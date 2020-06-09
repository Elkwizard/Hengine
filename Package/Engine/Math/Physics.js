//vectors
const INFINITY = 1e135;
class PhysicsMath {
    static intersectLine(A, A1, B, B1) {
        let m_A = (A1.y - A.y) / (A1.x - A.x);
        let b_A = A.y - m_A * A.x;
        let m_B = (B1.y - B.y) / (B1.x - B.x);
        let b_B = B.y - m_B * B.x;
        
        if (m_A === m_B) return null;
        
        let x = (b_B - b_A) / (m_A - m_B);
        if (m_A === Infinity) {
            let x = A.x;
            let y = m_B * x + b_B;
            if (x < Math.min(B.x, B1.x)) return null;
            if (x > Math.max(B.x, B1.x)) return null;
            if (y < Math.min(A.y, A1.y)) return null;
            if (y > Math.max(A.y, A1.y)) return null;
            return { x, y };
        }

        if (m_B === Infinity) {
            let x = B.x;
            let y = m_A * x + b_A;
            if (x < Math.min(A.x, A1.x)) return null;
            if (x > Math.max(A.x, A1.x)) return null;
            if (y < Math.min(B.y, B1.y)) return null;
            if (y > Math.max(B.y, B1.y)) return null;
            return { x, y };
        }
        if (x < Math.min(A.x, A1.x)) return null;
        if (x > Math.max(A.x, A1.x)) return null;
        if (x < Math.min(B.x, B1.x)) return null;
        if (x > Math.max(B.x, B1.x)) return null;

        let y = m_A * x + b_A;
        return { x, y };
    }
    static intersectPolygon(a, b) {
        let points = [];
        
        for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) {
            let p = PhysicsVector.intersectLine(a[i][0], a[i][1], b[j][0], b[j][1]);
            if (p) points.push(p);
        }
        if (!points.length) return points;

        return points;
    }
}
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
    normalize() {
        let m = PhysicsVector.mag(this);
        if (m) {
            this.x /= m;
            this.y /= m;
        }
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
    static crossNV(a, b) {
        return new PhysicsVector(-a * b.y, a * b.x);
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
        let acc = this.vertices[0];
        this.position = new PhysicsVector(acc.x, acc.y);
        for (let i = 1; i < this.vertices.length; i++) this.position.add(this.vertices[i]);
        this.position.div(this.vertices.length);
        this.bounds = Bounds.fromPolygon(this);
    }
    size() {
        return this.bounds.width;
    }
    getModel(pos, cos, sin) {
        let poly = new PolygonCollider(this.vertices.map(vert => {
            let t_x = vert.x * cos - vert.y * sin + pos.x;
            let t_y = vert.x * sin + vert.y * cos + pos.y;
            return new PhysicsVector(t_x, t_y);
        }));
        return poly;
    }
}
class CircleCollider {
    constructor(x, y, radius) {
        this.position = new PhysicsVector(x, y);
        this.radius = radius;
    }
    size() {
        return this.radius * 2;
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
    query(body, cells) {
        let bodies = [];
        let found = [];
        found[body.id] = true;
        for (let i = 0; i < cells.length; i++) {
            let cl = cells[i];
            // if (this.cells[cl.x] && this.cells[cl.x][cl.y]) 
            bodies.push(...this.cells[cl.x][cl.y].filter(b => !found[b.id] ? found[b.id] = true : false));
        }
        return bodies;
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

//mass
class ShapeMass {
    static massCircleCollider(circ) {
        return circ.radius ** 2 * Math.PI;
    }
    static inertiaCircleCollider(circ) {
        return circ.radius ** 4 * Math.PI / 4;
    }
    static massPolygonCollider(poly) {
        return poly.bounds.width * poly.bounds.height;
    }
    static inertiaPolygonCollider(poly) {
        return (poly.bounds.width ** 3 * poly.bounds.height + poly.bounds.height ** 3 * poly.bounds.width) / 12;
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
    static notOverlap(a, b) {
        return a.x + a.width < b.x || a.x > b.x + b.width || a.y + a.height < b.y || a.y > b.y + b.height;
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
        this.inertia = 0;

        this.restitution = 0;
        this.canMoveThisStep = true;
        this.prohibitedDirections = [];

        this.collisionFilter = body => true;
        this.engine = null;

        this.canRotate = true;
        this.isTrigger = false;

        this.__models = null;
    }
    set angle(a) {
        this._angle = a;
        this.cosAngle = Math.cos(a);
        this.sinAngle = Math.sin(a);
    }
    get angle() {
        return this._angle;
    }
    cacheModels() {
        this.__models = this.getModels();
        return this.__models;
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

        if (sh instanceof PolygonCollider && this.engine && this.engine.polygonVertexListSubdivider) {
            shapes = this.engine.polygonVertexListSubdivider(sh.vertices).map(poly => new PolygonCollider(poly));
        }

        this.shapes.push(...shapes);
        for (let sha of shapes) {
            this.mass += ShapeMass["mass" + sha.constructor.name](sha);
            this.inertia += ShapeMass["inertia" + sha.constructor.name](sha);
        }
        return shapes;
    }
    integrate(intensity) {
        this.position.add(PhysicsVector.mul(this.velocity, intensity));
        if (this.canRotate) {
            this.angle += this.angularVelocity * intensity;
            this.cosAngle = Math.cos(this.angle);
            this.sinAngle = Math.sin(this.angle);
        }
    }
    pointVelocity(p) {
        return new PhysicsVector(-(p.y - this.position.y) * this.angularVelocity, (p.x - this.position.x) * this.angularVelocity).add(this.velocity);
    }
    applyImpulse(pos, imp) {
        //linear
        this.velocity.x += imp.x / this.mass;
        this.velocity.y += imp.y / this.mass;

        //angular
        let cross = (pos.x - this.position.x) * imp.y - (pos.y - this.position.y) * imp.x;
        if (cross && this.canRotate) this.angularVelocity += cross / this.inertia;
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
RigidBody.nextID = 0;

//detection
class CollisionDetector {
    constructor(engine) {
        this.engine = engine;
    }
    collide(shapeA, shapeB) {
        if (Bounds.notOverlap(shapeA.bounds, shapeB.bounds)) return null;
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
            let axis = between.normalize();
            let pointA = PhysicsVector.mul(axis, a.radius).add(a.position);
            let pointB = PhysicsVector.mul(axis, -b.radius).add(b.position);
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

        if (!aAxes.length || !bAxes.length) {
            let aAxes = [];
            for (let i = 0; i < a.vertices.length / 2; i++) {
                let axis = PhysicsVector.normal(PhysicsVector.sub(a.vertices[i], a.vertices[(i + 1) % a.vertices.length]));
                aAxes.push(axis);
            }
            let bAxes = [];
            for (let i = 0; i < b.vertices.length / 2; i++) {
                let axis = PhysicsVector.normal(PhysicsVector.sub(b.vertices[(i + 1) % b.vertices.length], b.vertices[i]));
                bAxes.push(axis);
            }
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
            if (aMax < bMin || aMin > bMax) return null;

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
        let aFill = !!bAxes.length;
        for (let i = 0; i < a.vertices.length; i++) validAVerts.push(aFill);
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
            });

        //B contacts
        let validBVerts = [];
        let bFill = !!aAxes.length;
        for (let i = 0; i < b.vertices.length; i++) validBVerts.push(bFill);
        for (let i = 0; i < aAxes.length; i++) {
            let { min, max } = proj[1][i];
            for (let j = 0; j < b.vertices.length; j++) {
                let dot = PhysicsVector.dot(b.vertices[j], aAxes[i]);
                if (validBVerts[j] && (dot < min || dot > max)) validBVerts[j] = false;
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

        //end
        let contacts = [...contactsA, ...contactsB];
        if (!contacts.length || contacts.length === a.vertices.length + b.vertices.length) {
            let col = new CollisionDetector.Collision(bestAxis, []);
            col.penetration = minOverlap;
        } else return new CollisionDetector.Collision(bestAxis, contacts);
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
    getJ(vAB, mA, mB, iA, iB, e, n, rA, rB) {
        // let inertiaTerm = ((rA × n) × rA) ÷ iA + ((rB × n) × rB) ÷ iB) · n;// nice
        //optimized
        let inertiaTerm = (n.x ** 2 * (iB * rA.y ** 2 + iA * rB.y ** 2)
        + n.y ** 2 * (iB * rA.x ** 2 + iA * rB.x ** 2)
        + n.x * n.y * (2 * iB * rA.x * rA.y + 2 * iA * rB.x * rB.y)) / (iA * iB);

        let invMassSum = 1 / mA + 1 / mB + inertiaTerm;
        let j = (1 + e) * PhysicsVector.dot(vAB, n) / invMassSum;
        return j;
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
            let vAB = bodyB.pointVelocity(contact.point).sub(bodyA.pointVelocity(contact.point));
            let rA = PhysicsVector.sub(contact.point, bodyA.position);
            let rB = PhysicsVector.sub(contact.point, bodyB.position);
            let e = Math.max(bodyA.restitution, bodyB.restitution);
            let n = direction;
            let j_n = this.getJ(vAB, bodyA.mass, bodyB.mass, bodyA.inertia, bodyB.inertia, e, n, rA, rB) * factor;

            let impulseA_n = PhysicsVector.mul(n, j_n);
            let impulseB_n = PhysicsVector.invert(impulseA_n);

            //friction
            let t = PhysicsVector.normal(direction);
            let j_t = this.getJ(vAB, bodyA.mass, bodyB.mass, bodyA.inertia, bodyB.inertia, e, t, rA, rB) * factor * this.engine.friction;

            let impulseA_t = PhysicsVector.mul(t, j_t);
            let impulseB_t = PhysicsVector.invert(impulseA_t);


            impulsesA.push({ point: contact.point, impulse: impulseA_n.add(impulseA_t) });
            impulsesB.push({ point: contact.point, impulse: impulseB_n.add(impulseB_t) });
        }
        for (let i = 0; i < impulsesA.length; i++) {
            let impulse = impulsesA[i];
            bodyA.applyImpulse(impulse.point, impulse.impulse);
        }
        for (let i = 0; i < impulsesB.length; i++) {
            let impulse = impulsesB[i];
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

            let n = direction;
            let vAB = bodyA.pointVelocity(contact.point);
            let e = bodyA.restitution;
            let rA = PhysicsVector.sub(contact.point, bodyA.position);
            let rB = new PhysicsVector(0, 0);
            let j_n = -this.getJ(vAB, bodyA.mass, INFINITY, bodyA.inertia, INFINITY, e, n, rA, rB) * factor;
            let impulseA_n = PhysicsVector.mul(n, j_n);

            let t = PhysicsVector.normal(n);
            let j_t = -this.getJ(vAB, bodyA.mass, INFINITY, bodyA.inertia, INFINITY, e, t, rA, rB) * factor * this.engine.friction;
            let impulseA_t = PhysicsVector.mul(t, j_t);

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
        this.polygonVertexListSubdivider = null;
        this.iterations = 2;
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
    applyForces() {
        for (let i = 0; i < this.bodies.length; i++) {
            let body = this.bodies[i];
            if (body.type === RigidBody.STATIC) continue;
            body.velocity.add(this.gravity);
            body.velocity.mul(this.linearDrag);
            body.angularVelocity *= this.angularDrag;
        }
    }
    integrate(intensity) {
        for (let i = 0; i < this.bodies.length; i++) {
            let body = this.bodies[i];
            if (body.type === RigidBody.STATIC) continue;
            body.integrate(intensity);
        }
    }
    collisions(order, dynBodies, collisionPairs) {
        this.bodies.sort(order);
        //collisions
        for (let i = 0; i < dynBodies.length; i++) {
            let body = dynBodies[i];
            //mobilize
            body.canMoveThisStep = true;
            body.prohibitedDirections = [];


            let others = collisionPairs.get(body);
            // for (let el of others) {
            //     c.stroke(cl.ORANGE, 1).arrow(body.position, el.position);
            // }
            let collidable = others//[...others.filter(e => e.type === RigidBody.DYNAMIC), ...others.filter(e => e.type === RigidBody.STATIC)];
            for (let j = 0; j < collidable.length; j++) {
                let collisions = [];
                let body2 = collidable[j];
                let shapesA = body.__models || body.cacheModels();
                let shapesB = body2.__models || body2.cacheModels();
                
                for (let sI = 0; sI < shapesA.length; sI++) for (let sJ = 0; sJ < shapesB.length; sJ++) {
                    let shapeA = shapesA[sI];
                    let shapeB = shapesB[sJ];
                    let col = this.collisionDetector.collide(shapeA, shapeB);
                    collisions.push(col);
                }

                let contacts = [];
                let maxPenetration = -Infinity;
                let best = null;
                for (let ci = 0; ci < collisions.length; ci++) {
                    let collision = collisions[ci];
                    if (collision) {
                        if (collision.penetration > maxPenetration) {
                            maxPenetration = collision.penetration;
                            best = collision;
                            if (contacts.length) contacts.push(...collision.contacts
                                .filter(contact => !contacts
                                    .test(con => con.x === contact.x && con.y === contact.y).length));
                            else contacts.push(...collision.contacts);
                        }
                    }
                }
                if (best) {
                    let STATIC = body2.type === RigidBody.STATIC || 0;
                    let collisionDirection = best.direction;
                    if (!STATIC) for (let pro of body2.prohibitedDirections) {
                        let dot = PhysicsVector.dot(pro, collisionDirection);
                        if (dot > 0.9) {
                            STATIC = true;
                            break;
                        }
                    }
                    if (STATIC) {
                        body.prohibitedDirections.push(collisionDirection);
                    }
                    this.oncollide(body, body2, collisionDirection);
                    if (body.isTrigger || body2.isTrigger) continue;
                    if (STATIC) this.collisionResolver.staticResolve(body, body2, collisionDirection, maxPenetration, contacts);
                    else {
                        this.collisionResolver.dynamicResolve(body, body2, collisionDirection, maxPenetration, contacts);
                        body2.cacheModels();
                    }
                    body.cacheModels();
                }
            }
            //immobilize
            body.canMoveThisStep = false;
        }
    }
    cacheModels() {
        for (let i = 0; i < this.bodies.length; i++) this.bodies[i].__models = null;
    }
    run() {
        let cellsize = 100;
        for (let i = 0; i < this.bodies.length; i++) for (let j = 0; j < this.bodies[i].shapes.length; j++) cellsize += this.bodies[i].shapes[j].size() * 2;
        cellsize /= this.bodies.length + 1;

        let grid = new Grid(cellsize);

        //create grid
        let collisionPairs = new Map();
        for (let i = 0; i < this.bodies.length; i++) {
            let body = this.bodies[i];
            let models = body.__models || body.getModels();
            let cellsTotal = [];
            for (let j = 0; j < models.length; j++) {
                let model = models[j];
                let cells = grid["insert" + model.constructor.name](body, model);
                cellsTotal.push(...cells);
            }
            collisionPairs.set(body, cellsTotal);
        }
        let dynBodies = this.bodies.filter(body => body.type === RigidBody.DYNAMIC);
        for (let i = 0; i < dynBodies.length; i++) {
            let body = dynBodies[i];
            let cellsTotal = collisionPairs.get(body);
            let bodies = grid.query(body, cellsTotal).filter(body.collisionFilter);
            collisionPairs.set(body, bodies);
        }
        if (false) for (let i in grid.cells) if (grid.cells[i]) for (let j in grid.cells[i]) if (typeof grid.cells[i][j] === "object") {
            c.stroke(cl.RED, 2).rect(i * cellsize, j * cellsize, cellsize, cellsize);
            for (let el of grid.cells[i][j]) {
                c.stroke(cl.ORANGE, 1).arrow(i * cellsize, j * cellsize, el.position.x, el.position.y);
            }
        }
        this.applyForces();
        let intensity = 1 / this.iterations;
        for (let i = 0; i < this.iterations; i++) {
            //sorts
            let g = this.gravity;
            let gravitySort = (a, b) => PhysicsVector.dot(b.position, g) - PhysicsVector.dot(a.position, g);
            let inverseGravitySort = (a, b) => PhysicsVector.dot(a.position, g) - PhysicsVector.dot(b.position, g);
            
            //step
            this.integrate(intensity);
            this.cacheModels();
            this.solveConstraints();
            this.collisions(gravitySort, dynBodies, collisionPairs);
            this.integrate(intensity);
            this.cacheModels();
            this.solveConstraints();
            this.collisions(inverseGravitySort, dynBodies, collisionPairs);
        }
    }
    getBody(id) {
        for (let i = 0; i < this.bodies.length; i++) {
            if (this.bodies[i].id === id) return this.bodies[i];
        }
        return null;
    }
    addBody(b) {
        b.engine = this;
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