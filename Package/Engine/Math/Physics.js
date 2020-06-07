//vectors
class PhysicsVector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    add(b) {
        this.x += b.x;
        this.y += b.y;
        return this;
    }
    sub(b) {
        this.x -= b.x;
        this.y -= b.y;
        return this;
    }
    mul(b) {
        this.x *= b;
        this.y *= b;
        return this;
    }
    div(b) {
        this.x /= b;
        this.y /= b;
        return this;
    }
    static add(a, b) {
        return new PhysicsVector(a.x + b.x, a.y + b.y);
    }
    static sub(a, b) {
        return new PhysicsVector(a.x - b.x, a.y - b.y);
    }
    static mul(a, b) {
        return new PhysicsVector(a.x * b, a.y * b);
    }
    static div(a, b) {
        return new PhysicsVector(a.x / b, a.y / b);
    }
    static dot(a, b) {
        return a.x * b.x + a.y * b.y;
    }
    static cross(a, b) {
        return a.x * b.y - a.y * b.x;
    }
    static invert(a) {
        return new PhysicsVector(-a.x, -a.y);
    }
    static mag(a) {
        return Math.sqrt(a.x * a.x + a.y * a.y);
    }
    static sqrMag(a) {
        return a.x * a.x + a.y * a.y;
    }
    static normalize(a) {
        let mag = PhysicsVector.mag(a);
        if (!mag) return new PhysicsVector(0, 0);
        return new PhysicsVector(a.x / mag, a.y / mag);
    }
    static normal(a) {
        return new PhysicsVector(-a.y, a.x);
    }
}
PhysicsVector.__ = [new PhysicsVector(0, 0), new PhysicsVector(0, 0), new PhysicsVector(0, 0), new PhysicsVector(0, 0)];

//shapes
class PolygonCollider {
    constructor(vertices) {
        this.vertices = vertices;
        this.position = vertices.reduce((a, b) => PhysicsVector.add(a, b)).div(vertices.length);
        let bounds = Bounds.fromPolygon(this);
        this.mass = bounds.width * bounds.height;
    }
    getModel(pos, cos, sin) {
        let poly = new PolygonCollider(this.vertices.map(vert => {
            let t_x = vert.x * cos - vert.y * sin + pos.x;
            let t_y = vert.x * sin + vert.y * cos + pos.y;
            return new PhysicsVector(t_x, t_y);
        }));
        poly.bounds = Bounds.fromPolygon(poly);
        return poly;
    }
}
class CircleCollider {
    constructor(x, y, radius) {
        this.position = new PhysicsVector(x, y);
        this.radius = radius;
        this.mass = this.radius * this.radius * Math.PI;
    }
    getModel(pos, cos, sin) {
        let circ = new CircleCollider(this.position.x + pos.x, this.position.y + pos.y, this.radius);
        circ.bounds = Bounds.fromCircle(circ);
        return circ;
    }
}

//grid
class Grid {
    constructor(cellsize) {
        this.cellsize = cellsize;
        this.cells = [];
    }
    addShape(x, y, shape) {
        if (!this.cells[x]) this.cells[x] = [];
        if (!this.cells[x][y]) this.cells[x][y] = [];
        this.cells[x][y].push(shape);
    }
    query(cells) {
        let bodies = [];
        for (let i = 0; i < cells.length; i++) {
            if (this.cells[cells[i].x] && this.cells[cells[i].x][cells[i].y]) bodies.push(...this.cells[cells[i].x][cells[i].y]);
        }
        return [...new Set(bodies)];
    }
    cellsBounds(body, bounds) {
        let cells = [];
        let startX = Math.floor(bounds.x / this.cellsize);
        let startY = Math.floor(bounds.y / this.cellsize);

        let endX = Math.floor((bounds.x + bounds.width) / this.cellsize);
        let endY = Math.floor((bounds.y + bounds.height) / this.cellsize);

        let rx = endX - startX;
        let ry = endY - startY;
        for (let i = 0; i <= rx; i++) for (let j = 0; j <= ry; j++) {
            this.addShape(startX + i, startY + j, body);
            cells.push({ x: startX + i, y: startY + j });
        }
        return cells;
    }
    insertPolygonCollider(body, poly) {
        return this.cellsBounds(body, poly.bounds);
    }
    insertCircleCollider(body, circ) {
        return this.cellsBounds(body, circ.bounds);
    }
}

//bounds
class Bounds {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
    }
    static overlap(a, b) {
        return a.x + a.width > b.x && b.x + b.width > a.x && a.y + a.height > b.y && b.y + b.height > a.y;
    }
    static fromPolygon(p) {
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        for (let i = 0; i < p.vertices.length; i++) {
            let x = p.vertices[i].x;
            let y = p.vertices[i].y;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
        return new Bounds(minX, minY, maxX - minX, maxY - minY);
    }
    static fromCircle(c) {
        return new Bounds(c.position.x - c.radius, c.position.y - c.radius, c.radius * 2, c.radius * 2);
    }
}

//rigidbodies
class RigidBody {
    constructor(x, y, type) {
        this.userData = {};
        this.shapes = [];
        this.type = type;
        this.id = RigidBody.nextID++;
        //linear
        this.position = new PhysicsVector(x, y);
        this.velocity = new PhysicsVector(0, 0);
        //angular
        this.angle = 0;
        this.cosAngle = 1;
        this.sinAngle = 0;
        this.angularVelocity = 0;

        this.mass = 0;

        this.restitution = 0;
        this.canMoveThisStep = true;
        this.prohibitedDirections = [];

        this.collisionFilter = body => true;
    }
    getModels() {
        let pos = this.position;
        let cos = this.cosAngle;
        let sin = this.sinAngle;
        return this.shapes.map(shape => shape.getModel(pos, cos, sin));
    }
    removeShape(sh) {
        let inx = null;
        for (let i = 0; i < this.shapes.length; i++) {
            if (this.shapes[i] === sh) {
                inx = i;
                break;
            }
        }
        if (inx !== null) this.shapes.splice(inx, 1);
    }
    addShape(sh) {
        let shapes = [sh];
        this.shapes.push(...shapes);
        this.mass += sh.mass;
        return shapes;
    }
    integrate() {
        this.position.add(this.velocity);
        this.angle += this.angularVelocity;
        this.cosAngle = Math.cos(this.angle);
        this.sinAngle = Math.sin(this.angle);
    }
    pointVelocity(p) {
        return PhysicsVector.add(this.velocity, PhysicsVector.normal(PhysicsVector.sub(p, this.position)).mul(this.angularVelocity));
    }
    applyImpulse(pos, imp) {
        imp.div(this.mass);
        this.velocity.add(imp);
        let radius = PhysicsVector.sub(pos, this.position);
        let cross = -PhysicsVector.cross(imp, radius) / PhysicsVector.sqrMag(radius);
        if (cross) this.angularVelocity += cross;
    }
    static fromPolygon(vertices, type = RigidBody.DYNAMIC) {
        let position = vertices.reduce((a, b) => PhysicsVector.add(a, b));
        position.div(vertices.length);
        vertices = vertices.map(e => PhysicsVector.sub(e, position));
        let body = new RigidBody(position.x, position.y, type);
        body.addShape(new PolygonCollider(vertices));
        return body;
    }
    static fromRect(x, y, w, h, type = RigidBody.DYNAMIC) {
        let body = new RigidBody(x, y, type);
        body.addShape(new PolygonCollider([
            new PhysicsVector(-w / 2, -h / 2),
            new PhysicsVector(w / 2, -h / 2),
            new PhysicsVector(w / 2, h / 2),
            new PhysicsVector(-w / 2, h / 2)
        ]));
        return body;
    }
    static fromCircle(x, y, r, type = RigidBody.DYNAMIC) {
        let body = new RigidBody(x, y, type);
        body.addShape(new CircleCollider(0, 0, r));
        return body;
    }
}
RigidBody.DYNAMIC = Symbol("DYNAMIC");
RigidBody.STATIC = Symbol("STATIC");
RigidBody.TRIGGER = Symbol("TRIGGER");
RigidBody.nextID = 0;

//detection
class CollisionDetector {
    constructor(engine) {
        this.engine = engine;
    }
    collide(shapeA, shapeB) {
        if (!Bounds.overlap(shapeA.bounds, shapeB.bounds)) return null;
        return this[shapeA.constructor.name + "_" + shapeB.constructor.name](shapeA, shapeB);
    }
    CircleCollider_PolygonCollider(a, b) {
        let bestDist = Infinity;
        let bestPoint = null;
        let ax = a.position.x;
        let ay = a.position.y;
        for (let i = 0; i < b.vertices.length; i++) {
            let start = b.vertices[i];
            let end = b.vertices[(i + 1) % b.vertices.length];

            let submission;
            if (end.x - start.x === 0) {
                let min_ = Math.min(start.y, end.y);
                let max_ = Math.max(start.y, end.y);
                submission = new PhysicsVector(start.x, ay);
                if (ay < min_) submission.y = min_;
                if (ay > max_) submission.y = max_;
            } else if (end.y - start.y === 0) {
                let min_ = Math.min(start.x, end.x);
                let max_ = Math.max(start.x, end.x);
                submission = new PhysicsVector(ax, start.y);
                if (ax < min_) submission.x = min_;
                if (ax > max_) submission.x = max_;
            } else {
                let dx = end.x - start.x;
                let dy = end.y - start.y;
                let n_x = -dy;
                let n_y = dx;
                let m = n_y / n_x;
                let b = ay - m * ax;
                let m_n = dy / dx;
                let b_n = start.y - start.x * m_n;
                //m_n * x + b_n = m * x + b
                //(m_n - m) * x = b - b_n
                //x = (b - b_n) / (m_n - m)
                let x = (b - b_n) / (m_n - m);
                let min_ = Math.min(start.x, end.x);
                let max_ = Math.max(start.x, end.x);
                if (x < min_) x = min_;
                if (x > max_) x = max_;
                let y = m_n * x + b_n;
                submission = new PhysicsVector(x, y);
            }
            let dist = (submission.x - ax) ** 2 + (submission.y - ay) ** 2;
            if (dist < bestDist) {
                bestDist = dist;
                bestPoint = submission;
            }
        }
        if (bestPoint) {
            if (bestDist > a.radius ** 2) return null;
            let between = PhysicsVector.sub(bestPoint, a.position);
            bestDist = Math.sqrt(bestDist);
            let axis = PhysicsVector.normalize(between);

            let toB = PhysicsVector.sub(a.position, b.position);
            let inside = PhysicsVector.dot(toB, axis) > 0;

            if (inside) {
                axis = PhysicsVector.invert(axis);
                bestDist = bestDist + a.radius;
            } else bestDist = a.radius - bestDist;



            if (!bestDist) return null;
            return new CollisionDetector.Collision(
                axis, [
                new CollisionDetector.Contact(
                    bestPoint,
                    bestDist
                )
            ]
            );
        }
        return null;
    }
    PolygonCollider_CircleCollider(a, b) {
        let col = this.CircleCollider_PolygonCollider(b, a);
        if (col) {
            col.direction.mul(-1);
        }
        return col || null;
    }
    CircleCollider_CircleCollider(a, b) {
        let between = PhysicsVector.sub(b.position, a.position);
        let sqrMag = PhysicsVector.sqrMag(between);
        if (sqrMag < (a.radius + b.radius) ** 2) {
            let axis = PhysicsVector.normalize(between);
            let pointA = PhysicsVector.add(a.position, PhysicsVector.mul(axis, a.radius));
            let pointB = PhysicsVector.add(b.position, PhysicsVector.mul(axis, -b.radius));
            let point = PhysicsVector.add(pointA, pointB).div(2);
            return new CollisionDetector.Collision(
                axis,
                [new CollisionDetector.Contact(
                    point,
                    a.radius + b.radius - Math.sqrt(sqrMag)
                )]
            );
        }
        return null;
    }
    PolygonCollider_PolygonCollider(a, b) {
        let toB = PhysicsVector.sub(b.position, a.position);
        let aAxes = [];
        for (let i = 0; i < a.vertices.length; i++) {
            let axis = PhysicsVector.normal(PhysicsVector.sub(a.vertices[i], a.vertices[(i + 1) % a.vertices.length]));
            if (PhysicsVector.dot(axis, toB) > 0) aAxes.push(axis);
        }
        let bAxes = [];
        for (let i = 0; i < b.vertices.length; i++) {
            let axis = PhysicsVector.normal(PhysicsVector.sub(b.vertices[(i + 1) % b.vertices.length], b.vertices[i]));
            if (PhysicsVector.dot(axis, toB) > 0) bAxes.push(axis);
        }

        aAxes = aAxes;
        bAxes = bAxes;
        let axes = [aAxes, bAxes];
        let proj = [
            new Array(bAxes.length),
            new Array(aAxes.length)
        ];
        let minOverlap = Infinity;
        let bestIndex = [null, null];
        let bestRange = [];
        for (let i = 0; i < axes.length; i++) for (let I = 0; I < axes[i].length; I++) {
            axes[i][I] = PhysicsVector.normalize(axes[i][I]);
            let axis = axes[i][I];
            let aMin = Infinity;
            let aMax = -Infinity;
            let bMin = Infinity;
            let bMax = -Infinity;
            for (let j = 0; j < a.vertices.length; j++) {
                let dot = PhysicsVector.dot(a.vertices[j], axis);
                if (dot < aMin) aMin = dot;
                if (dot > aMax) aMax = dot;
            }
            for (let j = 0; j < b.vertices.length; j++) {
                let dot = PhysicsVector.dot(b.vertices[j], axis);
                if (dot < bMin) bMin = dot;
                if (dot > bMax) bMax = dot;
            }
            if (aMax <= bMin || aMin >= bMax) return null;

            if (i) proj[0][I] = { min: bMin, max: bMax };
            else proj[1][I] = { min: aMin, max: aMax };

            let overlap = ((aMin + aMax) / 2 < (bMin + bMax) / 2) ? aMax - bMin : bMax - aMin;
            if (overlap < minOverlap) {
                minOverlap = overlap;
                bestIndex = [i, I];
                bestRange = [{ min: aMin, max: aMax }, { min: bMin, max: bMax }];
            }
        }

        if (bestIndex[0] === null) return null;
        if (!bestRange[0]) return null;
        let bestAxis = axes[bestIndex[0]][bestIndex[1]];
        if (!bestAxis) return null;

        //A contacts
        let validAVerts = [];
        for (let i = 0; i < a.vertices.length; i++) validAVerts.push(true);
        for (let i = 0; i < bAxes.length; i++) {
            let { min, max } = proj[0][i];
            for (let j = 0; j < a.vertices.length; j++) {
                let dot = PhysicsVector.dot(a.vertices[j], bAxes[i]);
                if (validAVerts[j] && (dot < min || dot > max)) validAVerts[j] = false;
            }
        }
        let { min: bMin, max: bMax } = bestRange[1];
        let bMid = (bMin + bMax) / 2;
        let contactsA = a.vertices
            .filter((contact, inx) => validAVerts[inx])
            .map(contact => {
                let dot = PhysicsVector.dot(contact, bestAxis);
                let pen = (dot < bMid) ? dot - bMin : bMax - dot;
                return new CollisionDetector.Contact(contact, pen);
            })

        //B contacts
        let validBVerts = [];
        for (let i = 0; i < b.vertices.length; i++) validBVerts.push(true);
        for (let i = 0; i < aAxes.length; i++) {
            let { min, max } = proj[1][i];
            for (let j = 0; j < b.vertices.length; j++) {
                let dot = PhysicsVector.dot(b.vertices[j], aAxes[i]);
                if (dot < min || dot > max) validBVerts[j] = false;
            }
        }
        let { min: aMin, max: aMax } = bestRange[0];
        let aMid = (aMin + aMax) / 2;
        let contactsB = b.vertices
            .filter((contact, inx) => validBVerts[inx])
            .map(contact => {
                let dot = PhysicsVector.dot(contact, bestAxis);
                let pen = (dot < aMid) ? dot - aMin : aMax - dot;
                return new CollisionDetector.Contact(contact, pen);
            });
        let contacts = [...contactsA, ...contactsB];
        if (!contacts.length) return null;

        return new CollisionDetector.Collision(bestAxis, contacts);
    }
}
CollisionDetector.Collision = class {
    constructor(direction, contacts) {
        this.direction = direction;
        this.contacts = contacts;
        if (contacts.length === 1) this.penetration = contacts[0].penetration;
        else this.penetration = Math.max(...contacts.map(e => e.penetration));
    }
}
CollisionDetector.Contact = class {
    constructor(point, penetration) {
        this.point = point;
        this.penetration = penetration;
    }
}

//resolution
class CollisionResolver {
    constructor(engine) {
        this.engine = engine;
    }
    dynamicResolve(bodyA, bodyB, direction, penetration, contacts) {
        let move = PhysicsVector.mul(direction, penetration);
        let moveA = PhysicsVector.mul(move, bodyB.mass / (bodyA.mass + bodyB.mass));
        let moveB = PhysicsVector.mul(move, bodyA.mass / (bodyA.mass + bodyB.mass));
        bodyA.position.sub(moveA)
        if (bodyB.canMoveThisStep) bodyB.position.add(moveB);

        if (!penetration) return;

        let totalPenetration = 0;
        for (let i = 0; i < contacts.length; i++) totalPenetration += contacts[i].penetration;

        let impulsesA = [];
        let impulsesB = [];
        for (let i = 0; i < contacts.length; i++) {
            let contact = contacts[i];
            let factor = contact.penetration / totalPenetration;

            //normal
            let velA = bodyA.pointVelocity(contact.point);
            let velB = bodyB.pointVelocity(contact.point);
            let impulseDir = direction;
            let e = Math.max(bodyA.restitution, bodyB.restitution);
            let invMassSum = 1 / bodyA.mass + 1 / bodyB.mass
            let j_n = (1 + e) / invMassSum;
            j_n *= PhysicsVector.dot(PhysicsVector.sub(velB, velA), impulseDir);
            j_n *= factor;

            let impulseA_n = PhysicsVector.mul(impulseDir, j_n);
            let impulseB_n = PhysicsVector.invert(impulseA_n);

            //friction
            impulseDir = PhysicsVector.normal(direction);
            let j_t = 1 / invMassSum;
            j_t *= PhysicsVector.dot(PhysicsVector.sub(velB, velA), impulseDir);
            j_t *= factor * this.engine.friction;

            let impulseA_t = PhysicsVector.mul(impulseDir, j_t);
            let impulseB_t = PhysicsVector.invert(impulseA_t);


            impulsesA.push({ point: contact.point, impulse: PhysicsVector.add(impulseA_n, impulseA_t) });
            impulsesB.push({ point: contact.point, impulse: PhysicsVector.add(impulseB_n, impulseB_t) });
        }
        for (let impulse of impulsesA) {
            bodyA.applyImpulse(impulse.point, impulse.impulse);
        }
        for (let impulse of impulsesB) {
            bodyB.applyImpulse(impulse.point, impulse.impulse);
        }
    }
    staticResolve(bodyA, bodyB, direction, penetration, contacts) {
        let move = PhysicsVector.mul(direction, penetration);
        bodyA.position.sub(move);

        if (penetration < 0.05) return;

        let totalPenetration = 0;
        for (let i = 0; i < contacts.length; i++) totalPenetration += contacts[i].penetration;

        let impulsesA = [];
        for (let i = 0; i < contacts.length; i++) {
            let contact = contacts[i];
            let factor = contact.penetration / totalPenetration;

            let impulseDir = direction;
            let impulseA_n = PhysicsVector.mul(impulseDir, -PhysicsVector.dot(bodyA.pointVelocity(contact.point), impulseDir) * bodyA.mass * factor);

            impulseDir = PhysicsVector.normal(direction);
            let impulseA_t = PhysicsVector.mul(impulseDir, -PhysicsVector.dot(bodyA.pointVelocity(contact.point), impulseDir) * bodyA.mass * factor * this.engine.friction);


            impulsesA.push({ point: contact.point, impulse: PhysicsVector.add(impulseA_n, impulseA_t) });
        }
        for (let impulse of impulsesA) {
            bodyA.applyImpulse(impulse.point, impulse.impulse);
        }
    }
}
class PhysicsConstraint {
    constructor(a, b, aOff, bOff) {
        this.bodyA = a;
        this.bodyB = b;
        this.offsetA = aOff;
        this.offsetB = bOff;
    }
    getEnds() {
        let ax = this.offsetA.x;
        let ay = this.offsetA.y;
        let ac = this.bodyA.cosAngle;
        let as = this.bodyA.sinAngle;
        let t_ax = ax * ac - ay * as;
        let t_ay = ax * as + ay * ac;


        let bx = this.offsetB.x;
        let by = this.offsetB.y;
        let bc = this.bodyB.cosAngle;
        let bs = this.bodyB.sinAngle;
        let t_bx = bx * bc - by * bs;
        let t_by = bx * bs + by * bc;

        return [
            new PhysicsVector(t_ax + this.bodyA.position.x, t_ay + this.bodyA.position.y),
            new PhysicsVector(t_bx + this.bodyB.position.x, t_by + this.bodyB.position.y)
        ];
    }
    solve() {
        //solve
    }
}
PhysicsConstraint.Length = class extends PhysicsConstraint {
    constructor(a, b, ao, bo, l) {
        super(a, b, ao, bo);
        this.length = l;
    }
    solve(int) {
        let ends = this.getEnds();
        let a_x = ends[0].x;
        let a_y = ends[0].y;
        let b_x = ends[1].x;
        let b_y = ends[1].y;

        let dx = b_x - a_x;
        let dy = b_y - a_y;

        let sum = dx ** 2 + dy ** 2;

        if (sum !== this.length ** 2) {
            let dist = Math.sqrt(sum);
            let dif = (dist - this.length) / 2;
            dx /= dist;
            dy /= dist;
            dx /= 10;
            dy /= 10;
            dx *= int;
            dy *= int;

            if (this.bodyA.type === RigidBody.STATIC || this.bodyB.type === RigidBody.STATIC) dif *= 2;
            dx *= dif;
            dy *= dif;

            if (this.bodyA.type === RigidBody.DYNAMIC) {
                this.bodyA.position.x += dx;
                this.bodyA.position.y += dy;
                this.bodyA.applyImpulse(ends[0], new PhysicsVector(dx * this.bodyA.mass, dy * this.bodyA.mass));
            }
            if (this.bodyB.type === RigidBody.DYNAMIC) {
                this.bodyB.position.x -= dx;
                this.bodyB.position.y -= dy;
                this.bodyB.applyImpulse(ends[1], new PhysicsVector(-dx * this.bodyB.mass, -dy * this.bodyB.mass));
            }

        }
    }
}
//engine
class PhysicsEngine {
    constructor(gravity = new PhysicsVector(0, 0.2)) {
        this.gravity = gravity;
        this.bodies = [];
        this.collisionDetector = new CollisionDetector(this);
        this.collisionResolver = new CollisionResolver(this);
        this.linearDrag = 0.995;
        this.angularDrag = 0.995;
        this.friction = 0.2;
        this.constraints = [];
        this.constraintIterations = 3;
        this.oncollide = (a, b, dir) => null;
    }
    addConstraint(constraint) {
        this.constraints.push(constraint);
    }
    solveConstraints() {
        for (let i = 0; i < this.constraintIterations; i++) {
            let cons = [...this.constraints];
            while (cons.length) {
                cons.splice(Math.floor(Math.random() * cons.length), 1)[0].solve(1 / this.constraintIterations);
            }
        }
    }
    integrate() {
        for (let i = 0; i < this.bodies.length; i++) {
            let body = this.bodies[i];
            if (body.type === RigidBody.STATIC) continue;
            body.integrate();
            body.velocity = PhysicsVector.add(body.velocity, this.gravity);
            body.velocity.mul(this.linearDrag);
            body.angularVelocity *= this.angularDrag;
        }
    }
    collisions(order, grid, collisionPairs) {
        this.bodies.sort(order);
        //collisions
        for (let i = 0; i < this.bodies.length; i++) {
            let body = this.bodies[i];
            if (body.type === RigidBody.STATIC) continue;
            //mobilize
            body.canMoveThisStep = true;
            body.prohibitedDirections = [];


            let others = grid.query(collisionPairs.get(body)).filter(body.collisionFilter);
            let collidable = [...others.filter(e => e.type === RigidBody.DYNAMIC), ...others.filter(e => e.type === RigidBody.STATIC)];
            for (let j = 0; j < collidable.length; j++) {
                let collisions = [];
                let body2 = collidable[j];
                if (body2 === body) continue;
                let shapesA = body.getModels();
                let shapesB = body2.getModels();
                for (let sI = 0; sI < shapesA.length; sI++) for (let sJ = 0; sJ < shapesB.length; sJ++) {
                    let shapeA = shapesA[sI];
                    let shapeB = shapesB[sJ];
                    collisions.push(this.collisionDetector.collide(shapeA, shapeB));
                }

                let contacts = [];
                let maxPenetration = -Infinity;
                let best = null;
                for (let collision of collisions) {
                    if (collision) {
                        if (collision.penetration > maxPenetration) {
                            maxPenetration = collision.penetration;
                            best = collision;
                            contacts.push(...collision.contacts);
                        }
                    }
                }
                if (best) {
                    let STATIC = body2.type === RigidBody.STATIC || 0;
                    let collisionDirection = best.direction;
                    if (!STATIC) for (let pro of body2.prohibitedDirections) {
                        let dot = PhysicsVector.dot(pro, collisionDirection);
                        if (dot > 0.8) {
                            STATIC = true;
                            break;
                        }
                    }
                    if (STATIC) {
                        body.prohibitedDirections.push(collisionDirection);
                    }
                    this.oncollide(body, body2, collisionDirection);
                    if (body.type === RigidBody.TRIGGER || body2.type === RigidBody.TRIGGER) continue;
                    if (STATIC) this.collisionResolver.staticResolve(body, body2, collisionDirection, maxPenetration, contacts);
                    else this.collisionResolver.dynamicResolve(body, body2, collisionDirection, maxPenetration, contacts);
                }
            }
            //immobilize
            body.canMoveThisStep = false;
        }
    }
    run() {
        this.integrate();
        let cellsize = 100;
        for (let i = 0; i < this.bodies.length; i++) for (let j = 0; j < this.bodies[i].shapes.length; j++) cellsize += Math.sqrt(this.bodies[i].shapes[j].mass);
        cellsize /= this.bodies.length + 1;
        
        let grid = new Grid(cellsize);

        //create grid
        let collisionPairs = new Map();
        for (let i = 0; i < this.bodies.length; i++) {
            let body = this.bodies[i];
            let models = body.getModels();
            let cellsTotal = [];
            for (let j = 0; j < models.length; j++) {
                let model = models[j];
                let cells = grid["insert" + model.constructor.name](body, model);
                cellsTotal.push(...cells);
            }
            collisionPairs.set(body, cellsTotal);
        }
        let g = this.gravity;
        let gravitySort = (a, b) => PhysicsVector.dot(b.position, g) - PhysicsVector.dot(a.position, g);
        let inverseGravitySort = (a, b) => PhysicsVector.dot(a.position, g) - PhysicsVector.dot(b.position, g);
        this.solveConstraints();
        this.collisions(gravitySort, grid, collisionPairs);
        this.solveConstraints();
        this.collisions(inverseGravitySort, grid, collisionPairs);

    }
    getBody(id) {
        for (let i = 0; i < this.bodies.length; i++) {
            if (this.bodies[i].id === id) return this.bodies[i];
        }
        return null;
    }
    addBody(b) {
        this.bodies.push(b);
    }
    removeBody(id) {
        let inx = null;
        for (let i = 0; i < this.bodies.length; i++) {
            if (this.bodies[i].id === id) {
                inx = i;
                break;
            }
        }

        if (inx !== null) {
            let validConstraints = [];
            for (let i = 0; i < this.constraints.length; i++) {
                let con = this.constraints[i];
                if (con.bodyA.id !== id && con.bodyB.id !== id) validConstraints.push(con);
            }
            this.constraints = validConstraints;
            this.bodies.splice(inx, 1);
        }
    }
}