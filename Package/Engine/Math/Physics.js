//vectors
const INFINITY = 1e135;
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
    constructor(vertices, alreadyClockwise = false) {
        this.alreadyClockwise = alreadyClockwise;
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
        let poly = new PolygonModel(vertices, PhysicsVector.add(this.position, pos), axes, this);
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
        this.velocity = new PhysicsVector(0, 0);
        //angular
        this.angle = 0;
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

        this.__models = null;
    }
    set angle(a) {
        this._angle = a;
        this.cosAngle = Math.cos(a);
        this.sinAngle = Math.sin(a);
        this.__models = null;
    }
    get angle() {
        return this._angle;
    }
    addCollidingBody(body) {
        if (this.type !== RigidBody.STATIC && !this.collidingBodies.includes(body)) this.collidingBodies.push(body);
    }
    wake() {
        this.sleeping = 0;
    }
    displace(v) {
        this.position.add(v);
        if (this.__models) for (let i = 0; i < this.__models.length; i++) {
            this.__models[i].displace(v);
        }
    }
    cacheModels() {
        return this.__models || (this.__models = this.getModels());
    }
    getModels() {
        let pos = this.position;
        let cos = this.cosAngle;
        let sin = this.sinAngle;
        return this.shapes.map(shape => shape.getModel(pos, cos, sin));
    }
    clearShapes() {
        this.shapes = [];
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
            shapes = this.engine.polygonVertexListSubdivider(sh.vertices, sh.alreadyClockwise).map(poly => new PolygonCollider(poly));
        }

        this.shapes.push(...shapes);
        for (let sha of shapes) {
            this.mass += ShapeMass["mass" + sha.constructor.name](sha);
            this.inertia += ShapeMass["inertia" + sha.constructor.name](sha);
        }
        return shapes;
    }
    integrate(intensity) {
        let dif = PhysicsVector.mul(this.velocity, intensity);
        if (this.canRotate) {
            this.position.add(dif);
            this.angle += this.angularVelocity * intensity;
        } else this.displace(dif);
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
    CircleModel_PolygonModel(a, b) {
        //SAT

        // let axes = [];
        // let accX = 0, accY = 0;
        // for (let i = 0; i < b.vertices.length; i++) {
        //     let a = b.vertices[i];
        //     let b = b.vertices[(i + 1) % b.vertices.length];
        //     let mag = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);

        //     axes.push(new PhysicsVector((b.x - a.x) / mag, (b.y - a.y) / mag));
        //     accX += a.x;
        //     accY += a.y;

        // }
        // accX /= b.vertices.length;
        // accY /= b.vertices.length;

        // let toMiddleMag = Math.sqrt((a.position.x - accX) ** 2 + (a.position.y - accY) ** 2);
        // axes.push(new PhysicsVector((a.position.x - accX) / toMiddleMag, (a.position.y - accY) / toMiddleMag));

        // let minOverlap = Infinity;
        // let bestAxis = null;

        // for (let i = 0; i < axes.length; i++) {
        //     let ax = axes[i];
        //     let projA = PhysicsVector.dot(a.position, ax);
        //     let minA = projA - a.radius;
        //     let maxA = projA + a.radius;

        //     let minB = Infinity;
        //     let maxB = -Infinity;
        //     for (let j = 0; j < b.vertices.length; j++) {
        //         let point = b.vertices[j];
        //         let proj = PhysicsVector.dot(point, ax);
        //         if (proj < minB) minB = proj;
        //         if (proj > maxB) maxB = proj;
        //     }

        //     let overlap = (projA < (minB + maxB) / 2) ? maxA - minB : maxB - minA;
        //     if (overlap > 0 && overlap < minOverlap) {
        //         minOverlap = overlap;
        //         bestAxis = ax;
        //     }
        // }

        // if (bestAxis) {
        //     return CollisionDetector.Collision.inferPenetration(bestAxis, [new CollisionDetector.Contact(, minOverlap)]);
        // }

        //CLOSEST POINT

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
    PolygonModel_CircleModel(a, b) {
        let col = this.CircleModel_PolygonModel(b, a);
        if (col) {
            col.direction.mul(-1);
        }
        return col;
    }
    CircleModel_CircleModel(a, b) {
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
    PolygonModel_PolygonModel(a, b) {
        let intersections = PhysicsMath.intersectPolygon(a.vertices, b.vertices);
        if (intersections.length < 2) return null;

        let toB = PhysicsVector.sub(b.position, a.position);

        let axes = [...a.axes.map(ax => PhysicsVector.invert(ax)), ...b.axes].filter(ax => PhysicsVector.dot(ax, toB) > 0);
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

        let { aMin, aMax, bMin, bMax } = bestRange;
        let rMin = 0;
        let rMax = 0;
        if ((aMin + aMax) / 2 < (bMin + bMax) / 2) {
            rMin = bMin;
            rMax = aMax;
        } else {
            rMin = aMin;
            rMax = bMax;
        }

        let cA = intersections[0];
        let cB = intersections[1];
        if (Math.abs(cA.x - cB.x) < 0.01 && Math.abs(cA.y - cB.y) < 0.01) intersections = [cA];
        else intersections = [cA, cB];

        let contacts = intersections
            .map(contact => {
                let dot = PhysicsVector.dot(contact, bestAxis);
                let pen = Math.abs(rMax - dot + rMin);
                return new CollisionDetector.Contact(contact, pen || 1);
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
        let inertiaTerm = (n.x ** 2 * (iB * rA.y ** 2 + iA * rB.y ** 2)
            + n.y ** 2 * (iB * rA.x ** 2 + iA * rB.x ** 2)
            + n.x * n.y * (2 * iB * rA.x * rA.y + 2 * iA * rB.x * rB.y)) / (iA * iB);

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

        let friction = (bodyA.friction + bodyB.friction) / 2 / this.engine.iterations;

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
            if (PhysicsVector.dot(vAB, n) > -0.01) continue;
            let j_n = this.getJ(vAB, bodyA.mass, bodyB.mass, bodyA.inertia, bodyB.inertia, e, n, rA, rB) * factor;

            let impulseA_n = PhysicsVector.mul(n, j_n);
            let impulseB_n = PhysicsVector.invert(impulseA_n);

            //friction
            let t = PhysicsVector.normal(direction);
            let j_t = this.getJ(vAB, bodyA.mass, bodyB.mass, bodyA.inertia, bodyB.inertia, e, t, rA, rB) * factor * friction;

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

        let move = PhysicsVector.mul(direction, -penetration);
        bodyA.displace(move);

        let friction = (bodyA.friction + bodyB.friction) / 2 / this.engine.iterations;

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

            if (!dx) dx = 0;
            if (!dy) dy = 0;

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
        this.friction = 0.8;
        this.constraints = [];
        this.constraintIterations = 3;
        this.oncollide = (a, b, dir) => null;
        this.polygonVertexListSubdivider = null;
        this.iterations = 2;
        this.sleepDuration = 15;
    }
    isAsleep(body) {
        return body.sleeping > this.sleepDuration;
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
    solveConstraints() {
        for (let i = 0; i < this.constraintIterations; i++) {
            let cons = [...this.constraints];
            while (cons.length) {
                cons.splice(Math.floor(Math.random() * cons.length), 1)[0].solve(1 / this.constraintIterations);
            }
        }
    }
    applyForces(dynBodies) {
        for (let i = 0; i < dynBodies.length; i++) {
            let body = dynBodies[i];
            if (this.isAsleep(body)) continue;
            body.velocity.add(this.gravity);
            body.velocity.mul(this.linearDrag);
            body.angularVelocity *= this.angularDrag;
        }
    }
    integrate(intensity, dynBodies) {
        for (let i = 0; i < dynBodies.length; i++) {
            let body = dynBodies[i];
            if (this.isAsleep(body)) continue;
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
            let vel = body.velocity;
            let collidable = others.sort((a, b) => (a.position.x - b.position.x) * vel.x + (a.position.y - b.position.y) * vel.y);

            // checks
            // c.draw(cl.RED).text("20px monospace", others.length, body.position.x, body.position.y);
            // if (others.length > 10) {
            //     for (let i = 0; i < others.length; i++) {
            //         c.stroke(cl.RED).arrow(body.position, others[i].position);
            //     }
            // }

            for (let j = 0; j < collidable.length; j++) {
                let collisions = [];
                let body2 = collidable[j];
                let shapesA = body.cacheModels();
                let shapesB = body2.cacheModels();
                if (shapesA.length === 1 && shapesB.length === 1) {
                    let col = this.collisionDetector.collide(shapesA[0], shapesB[0]);
                    collisions.push(col);
                } else {
                    for (let sI = 0; sI < shapesA.length; sI++) for (let sJ = 0; sJ < shapesB.length; sJ++) {
                        let shapeA = shapesA[sI];
                        let shapeB = shapesB[sJ];
                        let col = this.collisionDetector.collide(shapeA, shapeB);
                        collisions.push(col);
                    }
                }
                let contacts = [];
                let maxPenetration = -Infinity;
                let best = null;
                if (collisions.length > 1) {
                    for (let ci = 0; ci < collisions.length; ci++) {
                        let collision = collisions[ci];
                        if (collision) {
                            if (collision.penetration > maxPenetration) {
                                maxPenetration = collision.penetration;
                                best = collision;
                                contacts.push(...collision.contacts
                                    .filter(contact => !contacts
                                        .test(con => con.point.equals(contact.point))
                                    )
                                );
                                contacts = collision.contacts;
                            }
                        }
                    }
                } else {
                    let col = collisions[0];
                    if (col) {
                        best = col;
                        contacts = col.contacts;
                        maxPenetration = col.penetration;
                    }
                }
                if (best) {
                    let collisionDirection = best.direction;
                    body2.addCollidingBody(body);
                    body.addCollidingBody(body2);
                    if (!maxPenetration) continue;
                    let STATIC = body2.type === RigidBody.STATIC || 0;
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
                    this.oncollide(body, body2, collisionDirection);
                    if (body.isTrigger || body2.isTrigger) continue;
                    if (STATIC) this.collisionResolver.staticResolve(body, body2, collisionDirection, maxPenetration, contacts);
                    else this.collisionResolver.dynamicResolve(body, body2, collisionDirection, maxPenetration, contacts);
                }
            }
            //immobilize
            body.canMoveThisStep = false;
        }
    }
    cacheModels() {
        for (let i = 0; i < this.bodies.length; i++) this.bodies[i].__models = null;
    }
    createGrid(dynBodies) {
        let cellsize = 100;
        if (this.bodies.length) {
            cellsize = 0;
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
            if (this.isAsleep(body)) bodies = [];
            collisionPairs.set(body, bodies);
        }
        if (false) for (let i in grid.cells) if (grid.cells[i]) for (let j in grid.cells[i]) if (typeof grid.cells[i][j] === "object") {
            c.stroke(cl.RED, 2).rect(i * cellsize, j * cellsize, cellsize, cellsize);
            if (false) for (let el of grid.cells[i][j]) {
                c.stroke(cl.ORANGE, 1).arrow(i * cellsize, j * cellsize, el.position.x, el.position.y);
            }
        }
        return collisionPairs;
    }
    lowActivity(body) {
        return PhysicsVector.mag(body.velocity) < 0.1 && Math.abs(body.angularVelocity) < 0.01;
    }
    run() {
        let dynBodies = this.bodies.filter(body => body.type === RigidBody.DYNAMIC);
        this.clearCollidingBodies();
        const collisionPairs = this.createGrid(dynBodies);
        this.applyForces(dynBodies);
        let intensity = 1 / this.iterations;
        for (let i = 0; i < this.iterations; i++) {
            //sorts
            let g = this.gravity;
            let gravitySort = (a, b) => PhysicsVector.dot(b.position, g) - PhysicsVector.dot(a.position, g);
            let inverseGravitySort = (a, b) => PhysicsVector.dot(a.position, g) - PhysicsVector.dot(b.position, g);

            //step
            this.integrate(intensity, dynBodies);
            this.solveConstraints();
            this.collisions(gravitySort, dynBodies, collisionPairs);
            this.integrate(intensity, dynBodies);
            this.solveConstraints();
            this.collisions(inverseGravitySort, dynBodies, collisionPairs);
        }
        for (let i = 0; i < this.bodies.length; i++) {
            let body = this.bodies[i];
            if (this.lowActivity(body)) body.sleeping++;
            else body.wake();
        }
        //all static objects are sleeping
        for (let i = 0; i < dynBodies.length; i++) {
            let body = dynBodies[i];
            if (this.isAsleep(body)) for (let j = 0; j < body.collidingBodies.length; j++) if (!body.collidingBodies[j].sleeping) body.wake();
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