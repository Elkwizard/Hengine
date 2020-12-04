//vectors
const INFINITY = 1e13;
class PhysicsVector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    get() {
        return new PhysicsVector(this.x, this.y);
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
    equals(v) {
        return Math.abs(this.x - v.x) < 1.0001 && Math.abs(this.y - v.y) < 1.0001;
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

//geo

class PhysicsMath {
    static intersectLine(A, A1, B, B1) {

        let m_A = (A1.y - A.y) / (A1.x - A.x);
        let b_A = A.y - m_A * A.x;
        let m_B = (B1.y - B.y) / (B1.x - B.x);
        let b_B = B.y - m_B * B.x;

        if (m_A === m_B || (Math.abs(m_A) > INFINITY && Math.abs(m_B) > INFINITY)) {

            const nx = -(A1.y - A.y);
            const ny = A1.x - A.x;
            const a_dot_n = nx * A.x + ny * A.y;
            const b_dot_n = nx * B.x + ny * B.y;
            if (a_dot_n === b_dot_n) {
                const a_dot = -ny * A.x + nx * A.y;
                const b_dot = -ny * B.x + nx * B.y;
                const a_dot1 = -ny * A1.x + nx * A1.y;
                const b_dot1 = -ny * B1.x + nx * B1.y;
                const amin = Math.min(a_dot, a_dot1);
                const amax = Math.max(a_dot, a_dot1);
                const bmin = Math.min(b_dot, b_dot1);
                const bmax = Math.max(b_dot, b_dot1);
                if (amax < bmin || bmax < amin) return null;
                let abest = amin;
                let bbest = bmax;
                if ((amin + amax) / 2 < (bmin + bmax) / 2) {
                    abest = amax;
                    bbest = bmin;
                }
                const ap = (abest === a_dot) ? A : A1;
                const bp = (bbest === b_dot) ? B : B1;
                const x = (ap.x + bp.x) / 2;
                const y = (ap.y + bp.y) / 2;
                return new PhysicsVector(x, y);
            }
            return null;
        }

        let x = (b_B - b_A) / (m_A - m_B);
        if (Math.abs(m_A) > INFINITY) {
            let x = A.x;
            let y = m_B * x + b_B;
            if (x < Math.min(B.x, B1.x)) return null;
            if (x > Math.max(B.x, B1.x)) return null;
            if (y < Math.min(A.y, A1.y)) return null;
            if (y > Math.max(A.y, A1.y)) return null;
            return new PhysicsVector(x, y);
        }

        if (Math.abs(m_B) > INFINITY) {
            let x = B.x;
            let y = m_A * x + b_A;
            if (x < Math.min(A.x, A1.x)) return null;
            if (x > Math.max(A.x, A1.x)) return null;
            if (y < Math.min(B.y, B1.y)) return null;
            if (y > Math.max(B.y, B1.y)) return null;
            return new PhysicsVector(x, y);
        }
        if (x < Math.min(A.x, A1.x)) return null;
        if (x > Math.max(A.x, A1.x)) return null;
        if (x < Math.min(B.x, B1.x)) return null;
        if (x > Math.max(B.x, B1.x)) return null;

        let y = m_A * x + b_A;
        return new PhysicsVector(x, y);
    }
    static intersectPolygon(a, b) {
        let points = [];

        for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) {
            let p = PhysicsMath.intersectLine(a[i], a[(i + 1) % a.length], b[j], b[(j + 1) % b.length]);
            if (p) points.push(p);
        }

        return points;
    }
}

//shapes
class PolygonModel {
    constructor(vertices, position, axes, collider) {
        this.vertices = vertices;
        this.position = position;
        this.axes = axes;
        this.collider = collider;
        this.bounds = Bounds.fromPolygon(this);
    }
    displace(v) {
        this.bounds.x += v.x;
        this.bounds.y += v.y;
        this.position.add(v);
        for (let i = 0; i < this.vertices.length; i++) this.vertices[i].add(v);
    }
}
class PolygonCollider {
    constructor(vertices) {
        this.vertices = vertices;
        this.position = new PhysicsVector(0, 0);
        for (let i = 0; i < this.vertices.length; i++) this.position.add(this.vertices[i]);
        this.position.div(this.vertices.length);
        this.bounds = Bounds.fromPolygon(this);
    }
    size() {
        return Math.sqrt(this.bounds.width * this.bounds.height);
    }
    getModel(pos, cos, sin) {
        let vertices = this.vertices.map(vert => {
            let t_x = vert.x * cos - vert.y * sin + pos.x;
            let t_y = vert.x * sin + vert.y * cos + pos.y;
            return new PhysicsVector(t_x, t_y);
        });
        let axes = [];
        for (let i = 0; i < vertices.length; i++) {
            let a = vertices[i];
            let b = vertices[(i + 1) % vertices.length];
            let dx = b.x - a.x;
            let dy = b.y - a.y;
            let m = Math.sqrt(dx ** 2 + dy ** 2);
            dx /= m;
            dy /= m;
            axes.push(new PhysicsVector(-dy, dx));
        }
        let cpx = this.position.x;
        let cpy = this.position.y;
        let px = cpx * cos - cpy * sin + pos.x;
        let py = cpx * sin + cpy * cos + pos.y;
        let position = new PhysicsVector(px, py);
        let poly = new PolygonModel(vertices, position, axes, this);
        return poly;
    }
}
class CircleModel {
    constructor(x, y, radius) {
        this.position = new PhysicsVector(x, y);
        this.radius = radius;
        this.bounds = Bounds.fromCircle(this);
    }
    displace(v) {
        this.bounds.x += v.x;
        this.bounds.y += v.y;
        this.position.add(v);
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
        let t_x = this.position.x * cos - this.position.y * sin + pos.x;
        let t_y = this.position.x * sin + this.position.y * cos + pos.y;
        let circ = new CircleModel(t_x, t_y, this.radius);
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
        if (this.cells[x] === undefined) this.cells[x] = [];
        if (this.cells[x][y] === undefined) this.cells[x][y] = [];
        this.cells[x][y].push(shape);
    }
    query(body, cells) {
        let bodies = [];
        let found = [];
        found[body.id] = true;
        for (let i = 0; i < cells.length; i++) {
            let cl = cells[i];
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
}

//mass
class ShapeMass {
    static massCircleCollider(circ) {
        return circ.radius ** 2 * Math.PI;
    }
    static inertiaCircleCollider(circ) {
        return (circ.position.x ** 2 + circ.position.y ** 2) + 5 * circ.radius ** 4 * Math.PI / 4;
    }
    static massPolygonCollider(poly) {
        return poly.bounds.width * poly.bounds.height;
    }
    static inertiaPolygonCollider(poly) {
        return (poly.position.x ** 2 + poly.position.y ** 2) + (poly.bounds.width ** 3 * poly.bounds.height + poly.bounds.height ** 3 * poly.bounds.width) / 12;
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
        this.lastPosition = new PhysicsVector(x, y);
        this.velocity = new PhysicsVector(0, 0);
        //angular
        this.angle = 0;
        this.lastAngle = 0;
        this.cosAngle = 1;
        this.sinAngle = 0;
        this.angularVelocity = 0;

        this.mass = 0;
        this.inertia = 0;

        this.restitution = 0;
        this.friction = null;
        this.canMoveThisStep = true;
        this.prohibitedDirections = [];

        this.collisionFilter = body => true;
        this.engine = null;

        //sleep
        this.sleeping = 0;
        this.collidingBodies = [];

        this.canRotate = true;
        this.isTrigger = false;
        this.gravity = true;
        this.airResistance = true;
        this.simulated = true;

        this.invalidateModels();
    }
    set angle(a) {
        this._angle = a;
        this.cosAngle = Math.cos(a);
        this.sinAngle = Math.sin(a);
        this.invalidateModels();
    }
    get angle() {
        return this._angle;
    }
    updateLastData() {
        this.lastAngle = this.angle;
        this.lastPosition = this.position.get();
    }
    addCollidingBody(body) {
        if (this.type !== RigidBody.STATIC && !this.collidingBodies.includes(body)) this.collidingBodies.push(body);
    }
    wake() {
        this.sleeping = 0;
    }
    displace(v) {
        this.position.add(v);
        for (let i = 0; i < this.__models.length; i++) {
            if (this.__models[i]) this.__models[i].displace(v);
        }
    }
    invalidateModels() {
        this.__models = [];
        for (let i = 0; i < this.shapes.length; i++) this.__models.push(null);
    }
    getModel(i) {
        let pos = this.position;
        let cos = this.cosAngle;
        let sin = this.sinAngle;
        return this.shapes[i].getModel(pos, cos, sin);
    }
    getModels() {
        let models = [];
        for (let i = 0; i < this.shapes.length; i++) models.push(this.cacheModel(i));
        return models;
    }
    cacheModel(i) {
        return this.__models[i] ? this.__models[i] : (this.__models[i] = this.getModel(i));
    }
    cacheModels() {
        let models = [];
        for (let i = 0; i < this.shapes.length; i++) models.push(this.cacheModel(i));
        return models;
    }
    clearShapes() {
        this.shapes = [];
        this.invalidateModels();
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
        this.invalidateModels();
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
        this.invalidateModels();
        return shapes;
    }
    integrate(intensity) {
        let dif = PhysicsVector.mul(this.velocity, intensity);
        if (this.canRotate) {
            this.position.add(dif);
            this.angle += this.angularVelocity * intensity;
            this.invalidateModels();
        } else this.displace(dif);
    }
    stop() {
        this.velocity.mul(0);
        this.angularVelocity = 0;
    }
    pointVelocity(p) {
        return new PhysicsVector(-(p.y - this.position.y) * this.angularVelocity + this.velocity.x, (p.x - this.position.x) * this.angularVelocity + this.velocity.y);
    }
    applyImpulse(pos, imp) {
        //linear
        this.velocity.x += imp.x / this.mass;
        this.velocity.y += imp.y / this.mass;
        //angular
        if (this.canRotate) {
            let cross = (pos.x - this.position.x) * imp.y - (pos.y - this.position.y) * imp.x;
            if (cross) this.angularVelocity += cross / this.inertia;
        }
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
    static collide(shapeA, shapeB, arg) {
        // renderer.stroke(Color.LIME).rect(shapeA.bounds);
        // renderer.stroke(Color.BLUE).rect(shapeB.bounds);
        if (Bounds.notOverlap(shapeA.bounds, shapeB.bounds)) return null;
        return this[shapeA.constructor.name + "_" + shapeB.constructor.name](shapeA, shapeB, arg);
    }
    static CircleModel_PolygonModel(a, b, _unused) {
        //CLOSEST POINT

        let bestDist = Infinity;
        let bestPoint = null;
        let ax = a.position.x;
        let ay = a.position.y;
        for (let i = 0; i < b.vertices.length; i++) {
            let start = b.vertices[i];
            let end = b.vertices[(i + 1) % b.vertices.length];

            let submission;
            if (Math.abs(end.x - start.x) < 0.0001) {
                let min_ = Math.min(start.y, end.y);
                let max_ = Math.max(start.y, end.y);
                submission = new PhysicsVector(start.x, ay);
                if (ay < min_) submission.y = min_;
                if (ay > max_) submission.y = max_;
            } else if (Math.abs(end.y - start.y) < 0.0001) {
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
            let between = PhysicsVector.sub(bestPoint, a.position);
            bestDist = Math.sqrt(bestDist);
            let axis = PhysicsVector.normalize(between);

            let toB = PhysicsVector.sub(a.position, b.position);
            let inside = PhysicsVector.dot(toB, axis) > 0;

            if (bestDist > a.radius && !inside) return null;

            if (inside) {
                axis = PhysicsVector.invert(axis);
                bestDist = bestDist + a.radius;
            } else bestDist = a.radius - bestDist;



            if (!bestDist) return null;
            return CollisionDetector.Collision.inferPenetration(
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
    static PolygonModel_CircleModel(a, b, _unused) {
        let col = this.CircleModel_PolygonModel(b, a, PhysicsVector.invert(_unused));
        if (col) {
            col.direction.mul(-1);
        }
        return col;
    }
    static CircleModel_CircleModel(a, b, _unused) {
        let between = PhysicsVector.sub(b.position, a.position);
        let sqrMag = PhysicsVector.sqrMag(between);
        if (sqrMag < (a.radius + b.radius) ** 2) {
            let axis = between.normalize();
            let point = new PhysicsVector((axis.x * a.radius + a.position.x + axis.x * -b.radius + b.position.x) / 2, (axis.y * a.radius + a.position.y + axis.y * -b.radius + b.position.y) / 2);
            return CollisionDetector.Collision.inferPenetration(
                axis,
                [new CollisionDetector.Contact(
                    point,
                    a.radius + b.radius - Math.sqrt(sqrMag)
                )]
            );
        }
        return null;
    }
    static PolygonModel_PolygonModel(a, b, _unused) {
        let toB = PhysicsVector.sub(b.position, a.position);

        let axes = [...a.axes.map(ax => PhysicsVector.invert(ax)), ...b.axes].filter(ax => PhysicsVector.dot(ax, toB) > 0);
        if (!axes.length) return null;
        let minOverlap = Infinity;
        let bestAxis = null;
        let bestRange = [];
        for (let i = 0; i < axes.length; i++) {
            let axis = axes[i];
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
            if (aMax < bMin || aMin > bMax) {
                return null;
            }

            let overlap = ((aMin + aMax) / 2 < (bMin + bMax) / 2) ? aMax - bMin : bMax - aMin;
            if (overlap < minOverlap) {
                minOverlap = overlap;
                bestAxis = axis;
                bestRange = { aMin, aMax, bMin, bMax };
            }
        }
        if (!bestAxis) return null;
        let intersections = PhysicsMath.intersectPolygon(a.vertices, b.vertices);
        
        let { aMin, aMax, bMin, bMax } = bestRange;
        // exit(bestRange);
        let rMin;
        let rMax;
        if ((aMin + aMax) / 2 < (bMin + bMax) / 2) {
            rMin = bMin;
            rMax = aMax;
        } else {
            rMin = aMin;
            rMax = bMax;
        }

        if (intersections.length >= 2) {
            let final = new PhysicsVector(0, 0);
            for (let i = 0; i < intersections.length; i++) final.add(intersections[i]);
            final.div(intersections.length);
            intersections = [final];
        }

        let contacts = intersections
            .map(contact => {
                let dot = PhysicsVector.dot(contact, bestAxis);
                let pen = Math.abs((rMax - rMin) / 2 - Math.abs(dot - (rMin + rMax) / 2));
                return new CollisionDetector.Contact(contact, Math.max(pen, 0.01) || 0.0001);
            });
        
        if (!contacts.length) {
            return new CollisionDetector.Collision(bestAxis, [], minOverlap);
        } else return new CollisionDetector.Collision(bestAxis, contacts, minOverlap);
    }
}
CollisionDetector.Collision = class {
    constructor(direction, contacts, penetration) {
        this.direction = direction;
        this.contacts = contacts;
        this.penetration = penetration;
    }
    static inferPenetration(direction, contacts) {
        let penetration = 0;
        if (contacts.length === 1) penetration = contacts[0].penetration;
        else penetration = Math.max(...contacts.map(e => e.penetration));

        return new CollisionDetector.Collision(direction, contacts, penetration);
    }
    static fromData(direction, contacts, penetration) {
        return new CollisionDetector.Collision(direction, contacts, penetration);
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
        let inertiaTerm = PhysicsVector.dot(PhysicsVector.add(PhysicsVector.div(PhysicsVector.crossNV(PhysicsVector.cross(rA, n), rA), iA), PhysicsVector.div(PhysicsVector.crossNV(PhysicsVector.cross(rB, n), rB), iB)), n);
        // console.log(inertiaTerm);
        // let inertiaTerm = (n.x ** 2 * (iB * rA.y ** 2 + iA * rB.y ** 2)
        //     + n.y ** 2 * (iB * rA.x ** 2 + iA * rB.x ** 2)
        //     + n.x * n.y * (2 * iB * rA.x * rA.y + 2 * iA * rB.x * rB.y)) / (iA * iB);

        // let inertiaTerm = ((-iB * n.x ** 2 + rA.y) * (rA.x + rA.y) + (iA * n.y ** 2 * rB.x) * (rB.x - rB.y) + (n.x * n.y) * ((iB * rA.x) * (rA.x - rA.y) - (iA * rB.y) * (rB.x - rB.y))) / (iA * iB);

        let invMassSum = 1 / mA + 1 / mB + inertiaTerm;
        let j = (1 + e) * PhysicsVector.dot(vAB, n) / invMassSum;
        return j;
    }
    dynamicResolve(bodyA, bodyB, direction, penetration, contacts) {
        let move = PhysicsVector.mul(direction, penetration);
        let moveA = PhysicsVector.mul(move, -bodyB.mass / (bodyA.mass + bodyB.mass));
        let moveB = PhysicsVector.mul(move, bodyA.mass / (bodyA.mass + bodyB.mass));
        bodyA.displace(moveA)
        if (bodyB.canMoveThisStep) bodyB.displace(moveB);

        let friction = (bodyA.friction * bodyB.friction) / this.engine.iterations;

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
            // assert(PhysicsVector.dot(vAB, n) <= 0, "Traveling toward collision");
            // if (PhysicsVector.dot(vAB, n) > -0.01) continue;
            let j_n = this.getJ(vAB, bodyA.mass, bodyB.mass, bodyA.inertia, bodyB.inertia, e, n, rA, rB) * factor;

            let impulseA_n = PhysicsVector.mul(n, j_n);
            let impulseB_n = PhysicsVector.invert(impulseA_n);

            //friction
            let t = PhysicsVector.normal(direction);
            let j_t = this.getJ(vAB, bodyA.mass, bodyB.mass, bodyA.inertia, bodyB.inertia, e, t, rA, rB) * factor * friction;

            let impulseA_t = PhysicsVector.mul(t, j_t);
            let impulseB_t = PhysicsVector.invert(impulseA_t);



            let impulseA = impulseA_n.add(impulseA_t);
            let impulseB = impulseB_n.add(impulseB_t);
            impulsesA.push({ point: contact.point, impulse: impulseA });
            impulsesB.push({ point: contact.point, impulse: impulseB });

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

        let move = PhysicsVector.mul(direction, -penetration);
        bodyA.displace(move);

        let friction = (bodyA.friction * bodyB.friction) / this.engine.iterations;

        let totalPenetration = 0;
        for (let i = 0; i < contacts.length; i++) totalPenetration += contacts[i].penetration;

        let impulsesA = [];
        for (let i = 0; i < contacts.length; i++) {
            let contact = contacts[i];
            let factor = contact.penetration / totalPenetration;

            let vAB = bodyA.pointVelocity(contact.point);
            let e = bodyA.restitution;
            let rA = PhysicsVector.sub(contact.point, bodyA.position);
            let rB = new PhysicsVector(0, 0);
            let n = direction;
            // if (PhysicsVector.dot(vAB, n) <= 0) continue;
            let j_n = -this.getJ(vAB, bodyA.mass, INFINITY, bodyA.inertia, INFINITY, e, n, rA, rB) * factor;
            let impulseA_n = PhysicsVector.mul(n, j_n);

            let t = PhysicsVector.normal(n);
            let j_t = -this.getJ(vAB, bodyA.mass, INFINITY, bodyA.inertia, INFINITY, e, t, rA, rB) * factor * friction;
            let impulseA_t = PhysicsVector.mul(t, j_t);

            let impulseA = PhysicsVector.add(impulseA_n, impulseA_t);
            // console.log(j_n + 2 * bodyA.mass * PhysicsVector.dot(vAB, n));
            impulsesA.push({ point: contact.point, impulse: impulseA });
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
    constructor(a, b, ao, bo, l, stiffness) {
        super(a, b, ao, bo);
        this.length = l;
        this.stiffness = stiffness;
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
            dif *= this.stiffness;
            dx *= dif;
            dy *= dif;

            if (!dx) dx = 0;
            if (!dy) dy = 0;
            let pA = 1, pB = 1;
            if (this.bodyA.type === RigidBody.DYNAMIC && this.bodyB.type === RigidBody.DYNAMIC) {
                pA = 2 * this.bodyB.mass / (this.bodyA.mass + this.bodyB.mass);
                pB = 2 - pA;
            }
            if (this.bodyA.type === RigidBody.DYNAMIC) {
                this.bodyA.position.x += dx * pA;
                this.bodyA.position.y += dy * pA;
                this.bodyA.applyImpulse(ends[0], new PhysicsVector(dx * this.bodyA.mass * pA, dy * this.bodyA.mass * pA));
            }
            if (this.bodyB.type === RigidBody.DYNAMIC) {
                this.bodyB.position.x -= dx * pB;
                this.bodyB.position.y -= dy * pB;
                this.bodyB.applyImpulse(ends[1], new PhysicsVector(-dx * this.bodyB.mass * pB, -dy * this.bodyB.mass * pB));
            }

        }
    }
}
//engine
class PhysicsEngine {
    constructor(gravity = new PhysicsVector(0, 0.2)) {
        this.gravity = gravity;
        this.bodies = [];
        this.collisionResolver = new CollisionResolver(this);
        this.linearDrag = 0.995;
        this.angularDrag = 0.995;
        this.friction = 0.894;
        this.constraints = [];
        this.constraintIterations = 3;
        this.oncollide = (a, b, dir, contacts) => null;
        this.polygonVertexListSubdivider = null;
        this.iterations = 2;
        this.sleepDuration = 200;
        this.sleepingActivityThreshold = 0.6;
    }
    getSleepDuration() {
        return this.sleepDuration * this.iterations;
    }
    isAsleep(body) {
        return body.sleeping > this.getSleepDuration();
    }
    clearCollidingBodies() {
        for (let i = 0; i < this.bodies.length; i++) {
            let body = this.bodies[i];
            if (this.isAsleep(body)) continue;
            body.collidingBodies = [];
        }
    }
    addConstraint(constraint) {
        this.constraints.push(constraint);
    }
    getConstraints(id) {
        let constraints = [];
        for (let i = 0; i < this.constraints.length; i++) {
            let con = this.constraints[i];
            if (con.bodyA.id === id || con.bodyB.id === id) constraints.push(con);
        }
        return constraints;
    }
    solveConstraints() {
        for (let i = 0; i < this.constraintIterations; i++) {
            let cons = [...this.constraints];
            while (cons.length) {
                cons.splice(Math.floor(Math.random() * cons.length), 1)[0].solve(1 / this.constraintIterations / this.iterations);
            }
        }
    }
    applyForces(dynBodies) {
        for (let i = 0; i < dynBodies.length; i++) {
            let body = dynBodies[i];
            if (this.isAsleep(body)) continue;
            if (body.gravity) body.velocity.add(this.gravity);
            if (body.airResistance) {
                body.velocity.mul(this.linearDrag);
                body.angularVelocity *= this.angularDrag;
            }
        }
    }
    integrate(intensity, dynBodies) {
        for (let i = 0; i < dynBodies.length; i++) {
            let body = dynBodies[i];
            if (this.isAsleep(body)) continue;
            body.integrate(intensity);
        }
    }
    resolve(body, body2, col) {
        let collisionDirection = col.direction;
        let maxPenetration = col.penetration;
        let contacts = col.contacts;
        // scene.camera.drawInWorldSpace(() => {
        //     for (let cont of contacts) renderer.draw(Color.ORANGE).circle(cont.point, 5); 
        // });
        body2.addCollidingBody(body);
        body.addCollidingBody(body2);
        if (!maxPenetration) return;
        let STATIC = body2.type === RigidBody.STATIC;
        if (!STATIC) for (let i = 0; i < body2.prohibitedDirections.length; i++) {
            let dot = PhysicsVector.dot(body2.prohibitedDirections[i], collisionDirection);
            if (dot > 0.8) {
                STATIC = true;
                break;
            }
        }
        if (STATIC) {
            body.prohibitedDirections.push(collisionDirection);
        }
        this.oncollide(body, body2, collisionDirection, contacts);
        if (body.isTrigger || body2.isTrigger) return;
        if (STATIC) this.collisionResolver.staticResolve(body, body2, collisionDirection, maxPenetration, contacts);
        else this.collisionResolver.dynamicResolve(body, body2, collisionDirection, maxPenetration, contacts);

        //immobilize
        body.canMoveThisStep = false;
    }
    collisions(order, dynBodies, collisionPairs) {
        dynBodies.sort(order);

        if (false) for (let i = 0; i < dynBodies.length; i++) {
            renderer.draw(Color.RED).text(Font.Serif25, i + 1, dynBodies[i].position);
        }

        //collisions
        for (let i = 0; i < dynBodies.length; i++) {
            let body = dynBodies[i];
            //mobilize
            body.canMoveThisStep = true;
            body.prohibitedDirections = [];

            if (this.isAsleep(body)) continue;

            let others = collisionPairs.get(body);
            let vel = body.velocity;
            let collidable = others.sort((a, b) => (a.position.x - b.position.x) * vel.x + (a.position.y - b.position.y) * vel.y);

            // checks
            // renderer.draw(Color.RED).text("20px monospace", others.length, body.position.x, body.position.y);
            // if (others.length > 10) {
            //     for (let i = 0; i < others.length; i++) {
            //         renderer.stroke(Color.RED).arrow(body.position, others[i].position);
            //     }
            // }

            for (let j = 0; j < collidable.length; j++) {
                let body2 = collidable[j];
                if (body.shapes.length === 1 && body2.shapes.length === 1) {
                    let col = CollisionDetector.collide(body.cacheModel(0), body2.cacheModel(0), PhysicsVector.sub(body2.position, body.position));
                    if (col) this.resolve(body, body2, col);
                } else {
                    let collisions = [];
                    for (let sI = 0; sI < body.shapes.length; sI++) for (let sJ = 0; sJ < body2.shapes.length; sJ++) {
                        let col = CollisionDetector.collide(body.cacheModel(sI), body2.cacheModel(sJ), PhysicsVector.sub(body2.position, body.position));
                        if (col) collisions.push(col);
                    }
                    if (!collisions.length) continue;
                    let contacts = [];
                    let dir = new PhysicsVector(0, 0);
                    let penetration = -Infinity;
                    let best = null;
                    for (let cI = 0; cI < collisions.length; cI++) dir.add(collisions[cI].direction);
                    for (let cI = 0; cI < collisions.length; cI++) {
                        let col = collisions[cI];
                        if (PhysicsVector.dot(col.direction, dir) < 0) continue;
                        contacts.push(...col.contacts);
                        if (col.penetration > penetration) {
                            penetration = col.penetration;
                            best = col;
                        }
                    }
                    if (!contacts.length) continue;
                    best.contacts = contacts;
                    dir = PhysicsVector.normalize(dir);
                    let dot = PhysicsVector.dot(dir, best.direction);
                    best.penetration *= dot;
                    best.direction = dir;
                    this.resolve(body, body2, best);
                }
            }
        }
    }
    cacheModels() {
        for (let i = 0; i < this.bodies.length; i++) this.bodies[i].invalidateModels();
    }
    createGrid(dynBodies) {
        let cellsize = 100;
        if (this.bodies.length) {
            cellsize = 1;
            let body = this.bodies[Math.floor(this.bodies.length / 2)];
            for (let j = 0; j < body.shapes.length; j++) {
                cellsize += body.shapes[j].size();
            }
        }

        let grid = new Grid(cellsize);

        //create grid
        let collisionPairs = new Map();
        for (let i = 0; i < this.bodies.length; i++) {
            let body = this.bodies[i];
            let models = body.cacheModels();
            let cellsTotal = [];
            for (let j = 0; j < models.length; j++) {
                let model = models[j];
                let cells = grid.cellsBounds(body, model.bounds);
                cellsTotal.push(...cells);
            }
            collisionPairs.set(body, cellsTotal);
        }
        for (let i = 0; i < dynBodies.length; i++) {
            let body = dynBodies[i];
            let cellsTotal = collisionPairs.get(body);
            let bodies = grid.query(body, cellsTotal).filter(body.collisionFilter);
            collisionPairs.set(body, bodies);
        }
        if (false) for (let i in grid.cells) if (grid.cells[i]) for (let j in grid.cells[i]) if (typeof grid.cells[i][j] === "object") {
            renderer.stroke(Color.RED, 2).rect(i * cellsize, j * cellsize, cellsize, cellsize);
            if (false) for (let el of grid.cells[i][j]) {
                renderer.stroke(Color.ORANGE, 1).arrow(i * cellsize, j * cellsize, el.position.x, el.position.y);
            }
        }
        return collisionPairs;
    }
    lowActivity(body) {
        return body.type === RigidBody.STATIC || (
            //linear 
            PhysicsVector.sqrMag(PhysicsVector.sub(body.position, body.lastPosition)) * this.iterations < (this.sleepingActivityThreshold * 2) ** 2 &&
            PhysicsVector.sqrMag(body.velocity) < this.sleepingActivityThreshold ** 2 && 
            //angular
            Math.abs(body.angle - body.lastAngle) * this.iterations < (this.sleepingActivityThreshold * 2) / 40 &&
            Math.abs(body.angularVelocity) < this.sleepingActivityThreshold / 40
        );
    }
    handleSleep(dynBodies) {
        if (!isFinite(this.sleepDuration)) return;
        let sleepDuration = this.getSleepDuration();
        for (let i = 0; i < this.bodies.length; i++) {
            let body = this.bodies[i];
            if (this.lowActivity(body)) {
                body.sleeping++;
                if (body.sleeping === sleepDuration) body.stop();
            } else body.wake();
        }

        //update last position data
        for (let i = 0; i < this.bodies.length; i++) {
            let body = this.bodies[i];
            body.updateLastData();
        }

        //wake bodies that are in contact with woken bodies
        for (let n = 0; n < 3; n++) for (let i = 0; i < dynBodies.length; i++) {
            let body = dynBodies[i];
            if (!body.sleeping) {
                for (let j = 0; j < body.collidingBodies.length; j++) {
                    let body2 = body.collidingBodies[j];
                    body2.wake();
                }
            }
        }
    }
    run() {
        //remove unsimulated
        let backupBodies = this.bodies;
        this.bodies = this.bodies.filter(body => body.simulated);

        let dynBodies = this.bodies.filter(body => body.type === RigidBody.DYNAMIC);
        this.clearCollidingBodies();
        const collisionPairs = this.createGrid(dynBodies);
        this.applyForces(dynBodies);
        let intensity = 1 / this.iterations;
        this.step = 0;
        
        //sorts
        let g = this.gravity;
        let gravitySort = (a, b) => (b.position.x - a.position.x) * g.x + (b.position.y - a.position.y) * g.y;
        
        for (let i = 0; i < this.iterations; i++) {
            this.step++;

            //step
            this.integrate(intensity, dynBodies);
            this.solveConstraints();
            this.collisions(gravitySort, dynBodies, collisionPairs);
            this.integrate(intensity, dynBodies);
            this.solveConstraints();
            this.collisions(gravitySort, dynBodies, collisionPairs);
            this.handleSleep(dynBodies);
        }

        //add back unsimulated
        this.bodies = backupBodies;
    }
    getBody(id) {
        for (let i = 0; i < this.bodies.length; i++) {
            if (this.bodies[i].id === id) return this.bodies[i];
        }
        return null;
    }
    addBody(b) {
        b.engine = this;
        if (b.friction === null) b.friction = this.friction;
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
            this.bodies[inx].wake();
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