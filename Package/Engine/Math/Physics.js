//vectors
const INFINITY = 1e13;
class PhysicsVector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    get mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    get sqrMag() {
        return this.x * this.x + this.y * this.y;
    }
    get normalized() {
        let mag = this.mag;
        if (!mag) return new PhysicsVector(0, 0);
        return new PhysicsVector(this.x / mag, this.y / mag);
    }
    get normal() {
        return new PhysicsVector(-this.y, this.x);
    }
    get inverse() {
        return new PhysicsVector(-this.x, -this.y);
    }
    get(result = new PhysicsVector()) {
        result.x = this.x;
        result.y = this.y;
        return result;
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
        const m = this.mag;
        if (m) {
            this.x /= m;
            this.y /= m;
        }
        return this;
    }
    projectOnto(v) {
        return v.times(this.dot(v) / v.sqrMag);
    }
    equals(v) {
        return Math.abs(this.x - v.x) < 1.0001 && Math.abs(this.y - v.y) < 1.0001;
    }
    plus(b) {
        return new PhysicsVector(this.x + b.x, this.y + b.y);
    }
    minus(b) {
        return new PhysicsVector(this.x - b.x, this.y - b.y);
    }
    times(b) {
        return new PhysicsVector(this.x * b, this.y * b);
    }
    over(b) {
        return new PhysicsVector(this.x / b, this.y / b);
    }
    dot(b) {
        return this.x * b.x + this.y * b.y;
    }
    cross(b) {
        return this.x * b.y - this.y * b.x;
    }
    invert() {
        this.x = -this.x;
        this.y = -this.y;
        return this;
    }
    static crossNV(a, b) {
        return new PhysicsVector(-a * b.y, a * b.x);
    }
}
PhysicsVector.__ = [new PhysicsVector(0, 0), new PhysicsVector(0, 0), new PhysicsVector(0, 0), new PhysicsVector(0, 0)];

class PhysicsMatrix {
    constructor(a, b, c, d) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
    }
    get inverse() {
        const determinant = this.determinant;
        if (!determinant) return null;
        const invDeterminant = 1 / determinant;
        return new PhysicsMatrix(
            invDeterminant * this.d, invDeterminant * -this.b,
            invDeterminant * -this.c, invDeterminant * this.a
        );
    }
    get determinant() {
        return this.a * this.d - this.b * this.c;
    }
    get(result = new PhysicsMatrix()) {
        result.a = this.a;
        result.b = this.b;
        result.c = this.c;
        result.d = this.d;
        return result;
    }
    times(m) {
        return new PhysicsMatrix(
            this.a * m.a + this.b * m.c, this.a * m.b + this.b * m.d,
            this.c * m.a + this.d * m.c, this.c * m.b + this.d * m.d
        );
    }
    applyTo(vector) {
        return new PhysicsVector(
            this.a * vector.x + this.b * vector.y,
            this.c * vector.x + this.d * vector.y
        );
    }
    applyInverseTo(vector) {
        const determinant = this.determinant;
        if (!determinant) return null;

        const invDeterminant = 1 / determinant;
        const a = this.d;
        const b = -this.b;
        const c = -this.c;
        const d = this.a;

        return new PhysicsVector(
            invDeterminant * (a * vector.x + b * vector.y),
            invDeterminant * (c * vector.x + d * vector.y)
        );
    }
    static force1ToZero(body, point) {
        if (!body.dynamic) return new PhysicsVector(0, 0);

        const mA = 1 / body.mass;
        const iA = body.canRotate ? 1 / body.inertia : 0;
        const rAx = point.x - body.position.x;
        const rAy = point.y - body.position.y;

        // construct force-to-velocity matrix
        const a = -mA - iA * rAy ** 2;
        const b = iA * rAx * rAy;
        const c = b;
        const d = -mA - iA * rAx ** 2;

        const determinant = a * d - b * c;

        // non-invertable matrix, I really don't know what to do here
        if (!determinant) return new PhysicsVector(0, 0);

        const invDeterminant = 1 / determinant;

        // invert to get velocity-to-force matrix (save dividing by determinant for later)
        const inverseA = d;
        const inverseB = -b;
        const inverseC = -c;
        const inverseD = a;

        const velocityX = -rAy * body.angularVelocity + body.velocity.x;
        const velocityY = rAx * body.angularVelocity + body.velocity.y;

        return new PhysicsVector(
            invDeterminant * (inverseA * velocityX + inverseB * velocityY),
            invDeterminant * (inverseC * velocityX + inverseD * velocityY)
        );
    }
    static force2ToZero(bodyA, bodyB, point) {
        const rAx = point.x - bodyA.position.x;
        const rAy = point.y - bodyA.position.y;
        const rBx = point.x - bodyB.position.x;
        const rBy = point.y - bodyB.position.y;
        const velocityError = new PhysicsVector(
            (-rAy * bodyA.angularVelocity + bodyA.velocity.x) - (-rBy * bodyB.angularVelocity + bodyB.velocity.x),
            (rAx * bodyA.angularVelocity + bodyA.velocity.y) - (rBx * bodyB.angularVelocity + bodyB.velocity.y)
        );
        return PhysicsMatrix.resolveVelocityError(bodyA, bodyB, velocityError, point);
    }
    static resolveVelocityError(bodyA, bodyB, error, point) {
        const dynamicA = bodyA.dynamic;
        const dynamicB = bodyB.dynamic;

        if (dynamicA || dynamicB) {
            const mA = dynamicA ? 1 / bodyA.mass : 0;
            const mB = dynamicB ? 1 / bodyB.mass : 0;
            const iA = (dynamicA && bodyA.canRotate) ? 1 / bodyA.inertia : 0;
            const iB = (dynamicB && bodyB.canRotate) ? 1 / bodyB.inertia : 0;
            const rAx = point.x - bodyA.position.x;
            const rAy = point.y - bodyA.position.y;
            const rBx = point.x - bodyB.position.x;
            const rBy = point.y - bodyB.position.y;

            // construct force-to-velocity matrix
            const a = -(mA + iA * rAy ** 2 + mB + iB * rBy ** 2);
            const b = iA * rAx * rAy + iB * rBx * rBy;
            const c = b;
            const d = -(mA + iA * rAx ** 2 + mB + iB * rBx ** 2);

            const determinant = a * d - b * c;

            // non-invertable matrix, I really don't know what to do here
            if (!determinant) return new PhysicsVector(0, 0);

            const invDeterminant = 1 / determinant;

            // invert to get velocity-to-force matrix (save dividing by determinant for later)
            const inverseA = invDeterminant * d;
            const inverseB = invDeterminant * -b;
            const inverseC = invDeterminant * -c;
            const inverseD = invDeterminant * a;

            const velocityX = error.x//();
            const velocityY = error.y//();

            return new PhysicsVector(
                inverseA * velocityX + inverseB * velocityY,
                inverseC * velocityX + inverseD * velocityY
            );
        }
        return new PhysicsVector(0, 0);
    }
}

//vector accumulator
class PhysicsVectorAccumulator {
    constructor() {
        this.min = new PhysicsVector(0, 0);
        this.max = new PhysicsVector(0, 0);
        this._value = new PhysicsVector(0, 0);
        this.length = 0;
    }
    get value() {
        this._value.mul(0);
        this._value.add(this.min).add(this.max);
        return this._value;
    }
    reset() {
        this.min.mul(0);
        this.max.mul(0);
        this.length = 0;
    }
    append(x = 0, y = 0) {
        if (x < this.min.x) this.min.x = x;
        else if (x > this.max.x) this.max.x = x;
        if (y < this.min.y) this.min.y = y;
        else if (y > this.max.y) this.max.y = y;
        this.length++;
    }
}

//geometry

class PhysicsMath {
    static intersectLine(A, A1, B, B1) {

        let m_A = (A1.y - A.y) / (A1.x - A.x);
        let b_A = A.y - m_A * A.x;
        let m_B = (B1.y - B.y) / (B1.x - B.x);
        let b_B = B.y - m_B * B.x;

        if (m_A === m_B || (Math.abs(m_A) > INFINITY && Math.abs(m_B) > INFINITY)) return null;

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
        const vertices = this.vertices.map(vert => {
            let t_x = vert.x * cos - vert.y * sin + pos.x;
            let t_y = vert.x * sin + vert.y * cos + pos.y;
            return new PhysicsVector(t_x, t_y);
        });
        const axes = [];
        for (let i = 0; i < vertices.length; i++) {
            let a = vertices[i];
            let b = vertices[(i + 1) % vertices.length];
            let dx = b.x - a.x;
            let dy = b.y - a.y;
            let m = Math.sqrt(dx ** 2 + dy ** 2);
            axes.push(new PhysicsVector(-dy / m, dx / m));
        }
        const cpx = this.position.x;
        const cpy = this.position.y;
        const px = cpx * cos - cpy * sin + pos.x;
        const py = cpx * sin + cpy * cos + pos.y;
        const position = new PhysicsVector(px, py);
        return new PolygonModel(vertices, position, axes, this);
    }
}
PolygonModel.SYMBOL = Symbol("POLYGON");

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
CircleModel.SYMBOL = Symbol("CIRCLE");

//grid
class PhysicsGrid {
    constructor(cellsize) {
        this.cellsize = cellsize;
        this.cells = new Map();
        this.queryFoundMap = new Map();
    }
    addBody(x, y, body) {
        if (!this.cells.has(x)) this.cells.set(x, new Map());
        let column = this.cells.get(x);
        if (!column.has(y)) column.set(y, []);
        column.get(y).push(body);
    }
    query(body, cells, filter) {
        let bodies = [];
        let found = [];
        found[body.id] = true;
        for (let i = 0; i < cells.length; i++) {
            // expansion of: bodies.push(...this.cells[cl.x][cl.y].filter(b => (!found[b.id] && filter(b)) ? found[b.id] = true : false));
            let cl = cells[i];
            let cellBodies = this.cells.get(cl.x).get(cl.y);
            for (let j = 0; j < cellBodies.length; j++) {
                const b = cellBodies[j];
                const id = b.id;
                if (!(id in found)) {
                    found[id] = true;
                    if (filter(b)) bodies.push(b);
                }
            }
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
            this.addBody(startX + i, startY + j, body);
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

        this.accelerationAccumulator = new PhysicsVectorAccumulator();
        this.angularAccelerationAccumulator = new PhysicsVectorAccumulator();
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
    get dynamic() {
        return this.type !== RigidBody.STATIC;
    }
    updateLastData() {
        this.lastAngle = this.angle;
        this.lastPosition = this.position.get();
    }
    addCollidingBody(body) {
        if (!this.collidingBodies.includes(body)) this.collidingBodies.push(body);
    }
    wake() {
        if (this.dynamic) this.sleeping = 0;
    }
    displace(v) {
        if (!this.dynamic) return;

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
        return this.shapes[i].getModel(this.position, this.cosAngle, this.sinAngle);
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
    wakeCollidingBodies() {
        for (let i = 0; i < this.collidingBodies.length; i++) {
            this.collidingBodies[i].wake();
        }
    }
    clearShapes() {
        this.shapes = [];
        this.invalidateModels();
        this.wakeCollidingBodies();
    }
    removeShape(sh) {
        let inx = this.shapes.indexOf(sh);
        if (inx > -1) this.shapes.splice(inx, 1);
        this.invalidateModels();
        this.wakeCollidingBodies();
    }
    addShape(sh) {
        this.shapes.push(sh);
        const name = sh.constructor.name;
        this.mass += ShapeMass["mass" + name](sh);
        this.inertia += ShapeMass["inertia" + name](sh);
        this.invalidateModels();
        this.wakeCollidingBodies();
        return sh;
    }
    integrate(intensity) {
        const dif = this.velocity.times(intensity);
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
        if (!this.dynamic) return new PhysicsVector(0, 0);
        return new PhysicsVector(-(p.y - this.position.y) * this.angularVelocity + this.velocity.x, (p.x - this.position.x) * this.angularVelocity + this.velocity.y);
    }
    pointForce(p) {
        return PhysicsMatrix.force1ToZero(this, p).invert();
    }
    applyImpulse(pos, imp) {
        if (!this.dynamic) return;

        //linear
        this.velocity.x += imp.x / this.mass;
        this.velocity.y += imp.y / this.mass;

        //angular
        if (this.canRotate) {
            const cross = (pos.x - this.position.x) * imp.y - (pos.y - this.position.y) * imp.x;
            if (cross) this.angularVelocity += cross / this.inertia;
        }
    }
    accumulateImpulse(pos, imp) {
        if (!this.dynamic) return;

        //linear
        this.accelerationAccumulator.append(imp.x / this.mass, imp.y / this.mass);

        //angular
        if (this.canRotate) {
            const cross = (pos.x - this.position.x) * imp.y - (pos.y - this.position.y) * imp.x;
            if (cross) this.angularAccelerationAccumulator.append(cross / this.inertia);
        }
    }
    static fromPolygon(vertices, type = RigidBody.DYNAMIC) {
        let position = vertices.reduce((a, b) => a.plus(b));
        position.div(vertices.length);
        vertices = vertices.map(e => e.minus(position));
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
    static collide(shapeA, shapeB) {
        if (Bounds.notOverlap(shapeA.bounds, shapeB.bounds)) return null;
        return CollisionDetector.jumpTable[shapeA.constructor.SYMBOL][shapeB.constructor.SYMBOL](shapeA, shapeB);
    }
    static CircleModel_PolygonModel(a, b) {
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
            let between = bestPoint.minus(a.position);
            bestDist = Math.sqrt(bestDist);
            let axis = between.normalized;

            let toB = a.position.minus(b.position);
            let inside = toB.dot(axis) > 0;

            if (bestDist > a.radius && !inside) return null;

            if (inside) {
                axis.invert();
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
    static PolygonModel_CircleModel(a, b) {
        let col = CollisionDetector.CircleModel_PolygonModel(b, a);
        if (col) {
            col.direction.mul(-1);
        }
        return col;
    }
    static CircleModel_CircleModel(a, b) {
        let between = b.position.minus(a.position);
        let sqrMag = between.sqrMag;
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
    static PolygonModel_PolygonModel(a, b) {
        let toB = b.position.minus(a.position);

        let axes = [];
        for (let i = 0; i < a.axes.length; i++) {
            const ax = a.axes[i];
            if (ax.dot(toB) <= 0) axes.push(ax.inverse);
        }
        for (let i = 0; i < b.axes.length; i++) {
            const ax = b.axes[i];
            if (ax.dot(toB) > 0) axes.push(ax);
        }
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
                let dot = a.vertices[j].dot(axis);
                if (dot < aMin) aMin = dot;
                if (dot > aMax) aMax = dot;
            }
            for (let j = 0; j < b.vertices.length; j++) {
                let dot = b.vertices[j].dot(axis);
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
        let rMin;
        let rMax;
        if ((aMin + aMax) / 2 < (bMin + bMax) / 2) {
            rMin = bMin;
            rMax = aMax;
        } else {
            rMin = aMin;
            rMax = bMax;
        }

        // if (intersections.length >= 2) {
        //     let final = new PhysicsVector(0, 0);
        //     for (let i = 0; i < intersections.length; i++) final.add(intersections[i]);
        //     final.div(intersections.length);
        //     intersections = [final];
        // }

        let contacts = intersections
            .map(contact => {
                let dot = contact.dot(bestAxis);
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
CollisionDetector.jumpTable = {
    [PolygonModel.SYMBOL]: {
        [PolygonModel.SYMBOL]: CollisionDetector.PolygonModel_PolygonModel,
        [CircleModel.SYMBOL]: CollisionDetector.PolygonModel_CircleModel
    },
    [CircleModel.SYMBOL]: {
        [PolygonModel.SYMBOL]: CollisionDetector.CircleModel_PolygonModel,
        [CircleModel.SYMBOL]: CollisionDetector.CircleModel_CircleModel
    }
};

//resolution
class CollisionResolver {
    constructor(engine) {
        this.engine = engine;
    }
    getJ(vAB, mA, mB, iA, iB, e, n, rA, rB) {
        // let inertiaTerm = ((rA × n) × rA) ÷ iA + ((rB × n) × rB) ÷ iB) · n;// nice
        // const inertiaTerm = PhysicsVector.crossNV(rA.cross(n), rA).over(iA).plus(PhysicsVector.crossNV(rB.cross(n), rB).over(iB)).dot(n);
        // optimized
        const crossA = (rA.x * n.y - rA.y * n.x) / iA;
        const crossB = (rB.x * n.y - rB.y * n.x) / iB;
        const inertiaTerm = (crossA * rA.x + crossB * rB.x) * n.y - (crossA * rA.y + crossB * rB.y) * n.x;

        // const inertiaTerm = rA.cross(n) ** 2 / iA + rB.cross(n) ** 2 / iB

        const invMassSum = 1 / mA + 1 / mB + inertiaTerm;
        const j = (1 + e) * vAB.dot(n) / invMassSum;
        return j;
    }
    normalImpulse(bodyA, bodyB, rA, rB, mB, iB, normal, vAB) {
        const e = Math.max(bodyA.restitution, bodyB.restitution);
        return this.getJ(vAB, bodyA.mass, mB, bodyA.inertia, iB, e, normal, rA, rB);
    }
    frictionImpulse(bodyA, rA, rB, mB, iB, tangent, vAB, normalImpulse, staticFriction, kineticFriction) {
        const jt = this.getJ(vAB, bodyA.mass, mB, bodyA.inertia, iB, 0, tangent, rA, rB);
        if (Math.abs(jt) < normalImpulse * staticFriction) return jt;
        else return Math.sign(jt) * normalImpulse * kineticFriction;
    }
    contactImpulse(dynamic, bodyA, bodyB, contact, normal, tangent, staticFriction, kineticFriction) {
        const rA = contact.minus(bodyA.position);
        const vAB = dynamic ? bodyB.pointVelocity(contact).sub(bodyA.pointVelocity(contact)) : bodyA.pointVelocity(contact).invert();
        const rB = dynamic ? contact.minus(bodyB.position) : new PhysicsVector(0, 0);
        const mB = dynamic ? bodyB.mass : INFINITY;
        const iB = dynamic ? bodyB.inertia : INFINITY;
        
        const normalImpulse = this.normalImpulse(bodyA, bodyB, rA, rB, mB, iB, normal, vAB);
        if (normalImpulse >= 0) return new PhysicsVector(0, 0);
        const frictionImpulse = this.frictionImpulse(bodyA, rA, rB, mB, iB, tangent, vAB, -normalImpulse, staticFriction, kineticFriction);

        return new PhysicsVector(
            normalImpulse * normal.x + frictionImpulse * tangent.x,
            normalImpulse * normal.y + frictionImpulse * tangent.y
        );
    }
    dynamicResolve(bodyA, bodyB, direction, penetration, contacts) {
        const move = direction.times(penetration);
        const moveA = move.times(-bodyB.mass / (bodyA.mass + bodyB.mass));
        const moveB = move.times(bodyA.mass / (bodyA.mass + bodyB.mass));
        bodyA.displace(moveA);
        if (bodyB.canMoveThisStep || this.engine.iterations > 2) bodyB.displace(moveB);

        let totalPenetration = 0;
        for (let i = 0; i < contacts.length; i++) totalPenetration += contacts[i].penetration;

        const normal = direction;
        const tangent = direction.normal;

        const staticFriction = bodyA.friction * bodyB.friction;
        const kineticFriction = staticFriction * 0.9;

        for (let i = 0; i < contacts.length; i++) {
            const contact = contacts[i];
            const factor = contact.penetration / totalPenetration;
            const impulseA = this.contactImpulse(true, bodyA, bodyB, contact.point, normal, tangent, staticFriction, kineticFriction).mul(factor);
            const impulseB = impulseA.inverse;

            bodyA.accumulateImpulse(contact.point, impulseA);
            bodyB.accumulateImpulse(contact.point, impulseB);
        }
    }
    staticResolve(bodyA, bodyB, direction, penetration, contacts) {
        const move = direction.times(-penetration);
        bodyA.displace(move);

        let totalPenetration = 0;
        for (let i = 0; i < contacts.length; i++) totalPenetration += contacts[i].penetration;

        const normal = direction;
        const tangent = direction.normal;

        const staticFriction = bodyA.friction * bodyB.friction;
        const kineticFriction = staticFriction * 0.9;

        for (let i = 0; i < contacts.length; i++) {
            const contact = contacts[i];
            const factor = contact.penetration / totalPenetration;
            const impulseA = this.contactImpulse(false, bodyA, bodyB, contact.point, normal, tangent, staticFriction, kineticFriction).mul(factor);

            bodyA.accumulateImpulse(contact.point, impulseA);
        }
    }
}
//constraints
class PhysicsConstraint1 {
    constructor(body, offset, point) {
        this.body = body;
        this.offset = offset;
        this.point = point;
        this._ends = [
            this._endA = new PhysicsVector(0, 0),
            this._endB = new PhysicsVector(0, 0)
        ];

        this.forceToError = new PhysicsMatrix(null, null, null, null);
    }
    get error() {
        return new PhysicsVector(0, 0);
    }
    get ends() {
        let ax = this.offset.x;
        let ay = this.offset.y;
        let ac = this.body.cosAngle;
        let as = this.body.sinAngle;
        let t_ax = ax * ac - ay * as;
        let t_ay = ax * as + ay * ac;


        this._endA.x = t_ax + this.body.position.x;
        this._endA.y = t_ay + this.body.position.y;
        this._endB.x = this.point.x;
        this._endB.y = this.point.y;

        return this._ends;
    }
    hasBody(b) {
        return this.body === b;
    }
    solve() {
        const { body, forceToError } = this;

        if (body.dynamic) {
            const a = this.ends[0];

            // velocity
            const rA = a.minus(body.position);
            const mA = 1 / body.mass;
            const iA = body.canRotate ? 1 / body.inertia : 0;

            forceToError.a = mA + iA * rA.y ** 2;
            forceToError.b = -iA * rA.x * rA.y;
            forceToError.c = forceToError.b;
            forceToError.d = mA + iA * rA.x ** 2;

            const force = forceToError.applyInverseTo(this.error);

            if (!force) return;

            body.applyImpulse(a, force);
        }
    }
    static combineError(positionError, velocityError) {
        const { INTENSITY } = PhysicsConstraint1;
        return new PhysicsVector(velocityError.x + positionError.x, velocityError.y + positionError.y).mul(INTENSITY);
    }
}
PhysicsConstraint1.INTENSITY = 0.1;
class PhysicsConstraint2 {
    constructor(a, b, aOff, bOff) {
        this.bodyA = a;
        this.bodyB = b;
        this.offsetA = aOff;
        this.offsetB = bOff;
        this._ends = [
            this._endA = new PhysicsVector(0, 0),
            this._endB = new PhysicsVector(0, 0)
        ];

        const dynamicA = a.dynamic;
        const dynamicB = b.dynamic;
        const mA = dynamicA ? 1 / a.mass : 0;
        const mB = dynamicB ? 1 / b.mass : 0;
        this.forceToError = new PhysicsMatrix(
            mA + mB, null,
            null, mA + mB
        );
    }
    get error() {
        return new PhysicsVector(0, 0);
    }
    get ends() {
        const ax = this.offsetA.x;
        const ay = this.offsetA.y;
        const ac = this.bodyA.cosAngle;
        const as = this.bodyA.sinAngle;
        const t_ax = ax * ac - ay * as;
        const t_ay = ax * as + ay * ac;

        const bx = this.offsetB.x;
        const by = this.offsetB.y;
        const bc = this.bodyB.cosAngle;
        const bs = this.bodyB.sinAngle;
        const t_bx = bx * bc - by * bs;
        const t_by = bx * bs + by * bc;

        this._endA.x = t_ax + this.bodyA.position.x;
        this._endA.y = t_ay + this.bodyA.position.y;
        this._endB.x = t_bx + this.bodyB.position.x;
        this._endB.y = t_by + this.bodyB.position.y;

        return this._ends;
    }
    hasBody(b) {
        return this.bodyA === b || this.bodyB === b;
    }
    solve() {
        const { bodyA, bodyB, forceToError } = this;

        const dynamicA = bodyA.dynamic;
        const dynamicB = bodyB.dynamic;

        if (dynamicA || dynamicB) {
            const [a, b] = this.ends;

            // velocity
            const rA = a.minus(bodyA.position);
            const rB = b.minus(bodyB.position);
            const mA = dynamicA ? 1 / bodyA.mass : 0;
            const mB = dynamicB ? 1 / bodyB.mass : 0;
            const iA = (dynamicA && bodyA.canRotate) ? 1 / bodyA.inertia : 0;
            const iB = (dynamicB && bodyB.canRotate) ? 1 / bodyB.inertia : 0;

            forceToError.a = mA + iA * rA.y ** 2 + mB + iB * rB.y ** 2;
            forceToError.b = -iA * rA.x * rA.y - iB * rB.x * rB.y;
            forceToError.c = forceToError.b;
            forceToError.d = mA + iA * rA.x ** 2 + mB + iB * rB.x ** 2;

            const force = forceToError.applyInverseTo(this.error);

            if (!force) return;

            if (dynamicA) bodyA.applyImpulse(a, force);
            if (dynamicB) bodyB.applyImpulse(b, force.invert());
        }
    }
    static combineError(positionError, velocityError) {
        const { INTENSITY } = PhysicsConstraint2;
        return new PhysicsVector(velocityError.x + positionError.x, velocityError.y + positionError.y).mul(INTENSITY);
    }
}
PhysicsConstraint2.INTENSITY = 0.9;

// constraint implementations
PhysicsConstraint2.Length = class extends PhysicsConstraint2 {
    constructor(a, b, ao, bo, l) {
        super(a, b, ao, bo);
        this.length = l;
    }
    get error() {
        const { bodyA, bodyB } = this;
        const [a, b] = this._ends;
        const n = b.minus(a);
        const { mag } = n;
        if (!mag) return new PhysicsVector(0, 0);
        n.div(mag);
        const currentPositionError = n.times(mag - this.length);
        const currentVelocityError = n.times(bodyB.pointVelocity(b).dot(n) - bodyA.pointVelocity(a).dot(n));

        return PhysicsConstraint2.combineError(currentPositionError, currentVelocityError);
    }
}
PhysicsConstraint2.Position = class extends PhysicsConstraint2 {
    constructor(a, b, ao, bo) {
        super(a, b, ao, bo);
        this.forceToError = new PhysicsMatrix(null, null, null, null);
    }
    get error() {
        const { bodyA, bodyB } = this;
        const [a, b] = this._ends;
        const currentVelocityError = bodyB.pointVelocity(b).minus(bodyA.pointVelocity(a));
        const currentPositionError = b.minus(a);
        return PhysicsConstraint2.combineError(currentPositionError, currentVelocityError);
    }
}
PhysicsConstraint1.Length = class extends PhysicsConstraint1 {
    constructor(body, offset, point, length) {
        super(body, offset, point);
        this.length = length;
    }
    get error() {
        const { body } = this;
        const [a, b] = this._ends;
        const n = b.minus(a);
        const { mag } = n;
        if (!mag) return new PhysicsVector(0, 0);
        n.div(mag);
        const currentPositionError = n.times(mag - this.length);
        const currentVelocityError = n.times(-body.pointVelocity(a).dot(n));

        return PhysicsConstraint1.combineError(currentPositionError, currentVelocityError);
    }
}
PhysicsConstraint1.Position = class extends PhysicsConstraint1 {
    constructor(body, offset, point) {
        super(body, offset, point);
    }
    get error() {
        const { body } = this;
        const [a, b] = this.ends;
        const currentVelocityError = body.pointVelocity(a).invert();
        const currentPositionError = b.minus(a);
        return PhysicsConstraint1.combineError(currentPositionError, currentVelocityError);
    }
}

//engine
class PhysicsEngine {
    constructor(gravity = new PhysicsVector(0, 0.2)) {
        this.gravity = gravity;
        this.bodies = [];
        this.collisionResolver = new CollisionResolver(this);
        this.drag = 0.005;
        this.friction = 0.5;
        this.constraints = [];
        this.constraintIterations = 5;
        this.onCollide = (a, b, dir, contacts) => null;
        this.iterations = 10;
        this.sleepDuration = 200;
        this.sleepingActivityThreshold = 0.2;

        this.constraintOrderGenerator = {
            seed: 123456,
            next() {
                this.seed++;
                let a = (this.seed * 638835776.12849) % 8.7890975;
                let b = (a * 256783945.4758903) % 2.567890;
                let r = Math.abs(a * b * 382749.294873597) % 1;
                return r;
            }
        };
    }
    getSleepDuration() {
        return this.sleepDuration * this.iterations;
    }
    isAsleep(body) {
        return !body.dynamic || body.sleeping >= this.getSleepDuration();
    }
    clearCollidingBodies() {
        const filter = body => body.dynamic && this.isAsleep(body);
        for (let i = 0; i < this.bodies.length; i++) {
            let body = this.bodies[i];
            if (!filter(body)) body.collidingBodies = body.collidingBodies.filter(filter);
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
        const cons = [...this.constraints];
        while (cons.length)
            cons.splice(Math.floor(this.constraintOrderGenerator.next() * cons.length), 1)[0].solve();
    }
    applyForces(dynBodies, intensity) {
        const dragFactor = (1 - this.drag) ** intensity;
        const gravitationalAcceleration = this.gravity.times(intensity);
        for (let i = 0; i < dynBodies.length; i++) {
            let body = dynBodies[i];
            if (this.isAsleep(body)) continue;
            if (body.gravity) body.velocity.add(gravitationalAcceleration);
            if (body.airResistance) {
                body.velocity.mul(dragFactor);
                body.angularVelocity *= dragFactor;
            }
        }
    }
    integrate(dynBodies, intensity) {
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

        // for (let cont of contacts) renderer.stroke(Color.ORANGE, 1).circle(cont.point, 3);

        body2.addCollidingBody(body);
        body.addCollidingBody(body2);

        if (!maxPenetration || maxPenetration < 0.01) return;
        this.onCollide(body, body2, collisionDirection, contacts);

        if (body.isTrigger || body2.isTrigger) return;

        let STATIC = !body2.dynamic;

        if (!STATIC) {
            if ((body.sleeping || body2.sleeping) && (!this.lowActivity(body) || !this.lowActivity(body2))) {
                // console.log(body.userData.sceneObject.name, " => ", this.lowActivity(body), ", ", body2.userData.sceneObject.name, " => ", this.lowActivity(body2));
                body2.wake();
            }
        }

        if (!STATIC) for (let i = 0; i < body2.prohibitedDirections.length; i++) {
            let dot = body2.prohibitedDirections[i].dot(collisionDirection);
            if (dot > 0.8) {
                STATIC = true;
                break;
            }
        }
        if (STATIC) {
            body.prohibitedDirections.push(collisionDirection);
        }
        if (STATIC) this.collisionResolver.staticResolve(body, body2, collisionDirection, maxPenetration, contacts);
        else this.collisionResolver.dynamicResolve(body, body2, collisionDirection, maxPenetration, contacts);

        //immobilize
        body.canMoveThisStep = false;
    }
    collisions(dynBodies, collisionPairs, order) {
        dynBodies.sort(order);

        // for (let i = 0; i < dynBodies.length; i++) {
        //     renderer.draw(Color.RED).text(Font.Serif25, i + 1, dynBodies[i].position);
        // }


        //collisions
        for (let i = 0; i < dynBodies.length; i++) {
            const body = dynBodies[i];
            const asleep = this.isAsleep(body);

            //mobilize
            body.canMoveThisStep = true;
            body.prohibitedDirections = [];

            const others = collisionPairs.get(body);
            const vel = body.velocity;
            const collidable = others.filter(b => !(this.isAsleep(b) && asleep)).sort((a, b) => (a.position.x - b.position.x) * vel.x + (a.position.y - b.position.y) * vel.y);

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
                    let col = CollisionDetector.collide(body.cacheModel(0), body2.cacheModel(0));
                    if (col) this.resolve(body, body2, col);
                } else {
                    let collisions = [];
                    for (let sI = 0; sI < body.shapes.length; sI++) for (let sJ = 0; sJ < body2.shapes.length; sJ++) {
                        let col = CollisionDetector.collide(body.cacheModel(sI), body2.cacheModel(sJ));
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
                        if (col.direction.dot(dir) < 0) continue;
                        contacts.push(...col.contacts);
                        if (col.penetration > penetration) {
                            penetration = col.penetration;
                            best = col;
                        }
                    }
                    if (!contacts.length) continue;
                    best.contacts = contacts;
                    dir = dir.normalized;
                    const dot = best.direction.dot(dir);
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
        const nonEmptyBodies = this.bodies.filter(body => body.shapes.length > 0);
        if (nonEmptyBodies.length) {
            cellsize = 1;
            const body = nonEmptyBodies[Math.floor(nonEmptyBodies.length / 2)];
            for (let j = 0; j < body.shapes.length; j++) {
                cellsize += body.shapes[j].size();
            }
        }

        const grid = new PhysicsGrid(cellsize);

        //create grid
        const collisionPairs = new Map();
        for (let i = 0; i < this.bodies.length; i++) {
            let body = this.bodies[i];
            let models = body.cacheModels();
            let cellsTotal = [];
            for (let j = 0; j < models.length; j++) {
                let model = models[j];
                let cells = grid.cellsBounds(body, model.bounds);
                for (let ii = 0; ii < cells.length; ii++) cellsTotal.push(cells[ii]);
            }
            collisionPairs.set(body, cellsTotal);
        }
        for (let i = 0; i < dynBodies.length; i++) {
            let body = dynBodies[i];
            let cellsTotal = collisionPairs.get(body);
            let bodies = grid.query(body, cellsTotal, b => body.collisionFilter(b));
            // for (let j = 0; j < bodies.length; j++) {
            //     renderer.stroke(Color.ORANGE, 2).arrow(body.position, bodies[j].position);
            // }
            collisionPairs.set(body, bodies);
        }

        // scene.camera.drawInWorldSpace(() => {
        //     const LINE_WIDTH = 1 / scene.camera.zoom;
        //     for (let [x, column] of grid.cells) for (let [y, cell] of column) {
        //         renderer.stroke(Color.RED, LINE_WIDTH).rect(x * cellsize, y * cellsize, cellsize, cellsize);
        //     }
        // });
        return collisionPairs;
    }
    lowActivity(body) {
        if (!body.dynamic) return true;

        const positionChange = body.position.minus(body.lastPosition).sqrMag;
        const velocity = body.velocity.sqrMag;
        const angleChange = Math.abs(body.angle - body.lastAngle);
        const angularVelocity = Math.abs(body.angularVelocity);

        body.position.get(body.lastPosition);
        body.lastAngle = body.angle;

        return (
            //linear 
            positionChange * this.iterations < (this.sleepingActivityThreshold * 2) ** 2 &&
            velocity < this.sleepingActivityThreshold ** 2 &&
            //angular
            angleChange * this.iterations < (this.sleepingActivityThreshold * 2) / 100 &&
            angularVelocity < this.sleepingActivityThreshold / 100
        );
    }
    handleSleep(dynBodies) {
        if (!isFinite(this.sleepDuration)) return;

        const sleepDuration = this.sleepDuration * this.iterations;

        for (let i = 0; i < this.bodies.length; i++) {
            const body = this.bodies[i];
            if (this.lowActivity(body)) {
                body.sleeping++;
            } else if (body.sleeping) body.wake();
        }

        for (let n = 0; n < 30; n++) for (let i = 0; i < dynBodies.length; i++) {
            const body = dynBodies[i];
            if (body.sleeping < sleepDuration) continue;
            const cb = body.collidingBodies;
            for (let j = 0; j < cb.length; j++) if (!cb[j].sleeping) {
                body.wake();
                break;
            }
        }
    }
    applyAccumulatedImpulses(dynBodies) {
        for (let i = 0; i < dynBodies.length; i++) {
            const body = dynBodies[i];
            // if (body.accelerationAccumulator.length) {
                body.velocity.add(body.accelerationAccumulator.value);
                body.angularVelocity += body.angularAccelerationAccumulator.value.x;
                body.accelerationAccumulator.reset();
                body.angularAccelerationAccumulator.reset();
            // }
        }
    }
    run() {
        scene.camera.drawInWorldSpace(() => {
            //remove unsimulated
            const backupBodies = this.bodies;
            this.bodies = this.bodies.filter(body => body.simulated);

            const dynBodies = this.bodies.filter(body => body.type === RigidBody.DYNAMIC);

            // approximate where they'll be at the end of the frame
            this.integrate(dynBodies, 1);
            const collisionPairs = this.createGrid(dynBodies);
            this.integrate(dynBodies, -1);

            const intensity = 1 / (this.iterations * this.constraintIterations);
            this.step = 0;

            //sorts
            const { x: gx, y: gy } = this.gravity;
            const gravitySort = (a, b) => (b.position.x - a.position.x) * gx + (b.position.y - a.position.y) * gy;

            this.clearCollidingBodies();

            // solve
            for (let i = 0; i < this.iterations; i++) {
                this.step++;

                //step
                for (let j = 0; j < this.constraintIterations; j++) {
                    this.applyForces(dynBodies, intensity);
                    this.solveConstraints();
                    // this.applyAccumulatedImpulses(dynBodies);
                    this.integrate(dynBodies, intensity);
                }
                this.collisions(dynBodies, collisionPairs, gravitySort);
                this.applyAccumulatedImpulses(dynBodies);
                this.handleSleep(dynBodies);
                // for (const body of dynBodies) {
                //     renderer.stroke(Color.ORANGE).arrow(body.position, body.position.plus(body.velocity));
                // }    
            }

            //add back unsimulated
            this.bodies = backupBodies;
        });
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
            let body = this.bodies[inx];
            body.wake();
            let validConstraints = [];
            for (let i = 0; i < this.constraints.length; i++) {
                let con = this.constraints[i];
                if (!con.hasBody(body)) validConstraints.push(con);
            }
            this.constraints = validConstraints;
            this.bodies.splice(inx, 1);
        }
    }
}