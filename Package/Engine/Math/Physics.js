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
        return Math.abs(this.x - v.x) < 0.0001 && Math.abs(this.y - v.y) < 0.0001;
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
        const { determinant } = this;
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
class BaseModel {
    constructor(collider) {
        this.collider = collider;
    }
}
class BaseCollider {
    constructor() {
        this.cacheValid = false;
    }
    invalidateCache() {
        this.cacheValid = false;
    }
    cacheModel(pos, cos, sin) {
        if (this.cacheValid) return this.model;
        else {
            this.cacheValid = true;
            this.model.update(pos, cos, sin);
            return this.model;
        }
    }
    displaceCache(v) {
        this.model.displace(v);
    }
}

class PolygonModel extends BaseModel {
    constructor(collider) {
        super(collider);
        this.vertices = collider.vertices.map(vertex => new PhysicsVector(0, 0));
        this.position = new PhysicsVector(0, 0);
        this.axes = collider.axes.map(axis => new PhysicsVector(0, 0));
    }
    update(pos, cos, sin) {
        const { collider } = this;
        for (let i = 0; i < collider.vertices.length; i++) {
            const { x, y } = collider.vertices[i];
            const vertex = this.vertices[i];
            vertex.x = x * cos - y * sin + pos.x;
            vertex.y = x * sin + y * cos + pos.y;
        }

        for (let i = 0; i < collider.axes.length; i++) {
            const { x, y } = collider.axes[i];
            const axis = this.axes[i];
            axis.x = x * cos - y * sin;
            axis.y = x * sin + y * cos;
        }

        const { x, y } = collider.position;
        this.position.x = x * cos - y * sin + pos.x;
        this.position.y = x * sin + y * cos + pos.y;
    }
    displace(v) {
        this.position.add(v);
        for (let i = 0; i < this.vertices.length; i++) this.vertices[i].add(v);
    }
}
class PolygonCollider extends BaseCollider {
    constructor(vertices) {
        super();
        this.vertices = vertices;
        this.position = new PhysicsVector(0, 0);
        for (let i = 0; i < vertices.length; i++) this.position.add(vertices[i]);
        this.position.div(vertices.length);
        this.axes = vertices.map((_, i) => {
            const a = vertices[i];
            const b = vertices[(i + 1) % vertices.length];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const m = 1 / Math.sqrt(dx * dx + dy * dy);
            return new PhysicsVector(-dy * m, dx * m);
        });

        { // bounding radius
            let maxSqrRadius = 0;
            for (let i = 0; i < vertices.length; i++) {
                const { x, y } = vertices[i];
                const sqrRadius = x * x + y * y;
                if (sqrRadius > maxSqrRadius) maxSqrRadius = sqrRadius;
            }
            this.boundingRadius = Math.sqrt(maxSqrRadius);
        };

        // models
        this.model = new PolygonModel(this);
    }
    computeMatterData() {
        const { vertices, position } = this;
        { // mass
            this.mass = 0;
            for (let i = 0; i < vertices.length; i++) {
                const a = vertices[i].minus(position);
                const b = vertices[(i + 1) % vertices.length].minus(position);
                this.mass += Math.abs(a.cross(b)) / 2;
            }
        };
        { // inertia
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;
            for (let i = 0; i < vertices.length; i++) {
                const { x, y } = vertices[i];
                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
            }
            const width = maxX - minX;
            const height = maxY - minY;
            this.inertia = 1 / 12 * (width ** 3 * height + height ** 3 * width);
        };
    }
    size() {
        return Math.sqrt(this.mass);
    }
}
PolygonCollider.SYMBOL = Symbol("POLYGON");

class CircleModel extends BaseModel {
    constructor(collider) {
        super(collider);
        this.position = new PhysicsVector(0, 0);
        this.radius = 0;
    }
    update(pos, cos, sin) {
        const { collider } = this;
        this.radius = collider.radius;
        const { x, y } = collider.position;
        this.position.x = cos * x - sin * y + pos.x;
        this.position.y = sin * x + cos * y + pos.y;
    }
    displace(v) {
        this.position.add(v);
    }
}
class CircleCollider extends BaseCollider {
    constructor(x, y, radius) {
        super();
        this.position = new PhysicsVector(x, y);
        this.radius = radius;
        this.boundingRadius = this.position.mag + this.radius;
        this.model = new CircleModel(this);
    }
    computeMatterData() {
        this.mass = this.radius ** 2 * Math.PI;
        this.inertia = this.position.sqrMag + 1.25 * this.radius ** 2 * this.mass;
    }
    size() {
        return this.radius * 2;
    }
}
CircleCollider.SYMBOL = Symbol("CIRCLE");

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
    cellsBounds(body, radius) {
        const { x, y } = body.position;

        let cells = [];
        let startX = Math.floor((x - radius) / this.cellsize);
        let startY = Math.floor((y - radius) / this.cellsize);

        let endX = Math.floor((x + radius) / this.cellsize);
        let endY = Math.floor((y + radius) / this.cellsize);

        let rx = endX - startX;
        let ry = endY - startY;
        for (let i = 0; i <= rx; i++) for (let j = 0; j <= ry; j++) {
            this.addBody(startX + i, startY + j, body);
            cells.push({ x: startX + i, y: startY + j });
        }
        return cells;
    }
}

//rigidbodies
class RigidBody {
    constructor(x, y, dynamic) {
        // general
        this.userData = {};
        this.shapes = [];
        this.constraints = [];
        this.dynamic = dynamic;
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

        // size
        this.size = 0;
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

        // booleans
        this.canRotate = true;
        this.isTrigger = false;
        this.canCollide = true;
        this.gravity = true;
        this.airResistance = true;
        this.simulated = true;

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
        for (let i = 0; i < this.shapes.length; i++) this.shapes[i].displaceCache(v);
    }
    invalidateModels() {
        for (let i = 0; i < this.shapes.length; i++) this.shapes[i].invalidateCache();
    }
    getModel(i) {
        const shape = this.shapes[i];
        shape.invalidateCache();
        return shape.cacheModel(this.position, this.cosAngle, this.sinAngle);
    }
    getModels() {
        const models = [];
        for (let i = 0; i < this.shapes.length; i++) models.push(this.cacheModel(i));
        return models;
    }
    cacheModel(i) {
        return this.shapes[i].cacheModel(this.position, this.cosAngle, this.sinAngle);
    }
    cacheModels() {
        const models = [];
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
        const inx = this.shapes.indexOf(sh);
        if (inx > -1) {
            this.shapes.splice(inx, 1);
            this.invalidateModels();
            this.wakeCollidingBodies();

            // don't just subtract shape's mass and inertia in case mass was changed elsewhere
            this.mass = 0
            this.inertia = 0;
            for (let i = 0; i < this.shapes.length; i++) {
                const shape = this.shapes[i];
                this.mass += shape.mass;
                this.inertia += shape.inertia;
            }

            this.size -= sh.size();
        }
    }
    addShape(sh) {
        this.shapes.push(sh);
        sh.computeMatterData();
        this.mass += sh.mass;
        this.inertia += sh.inertia;
        this.size += sh.size();
        this.invalidateModels();
        this.wakeCollidingBodies();
        return sh;
    }
    integrate(intensity) {
        this.displace(this.velocity.times(intensity));
        if (this.canRotate) this.angle += this.angularVelocity * intensity;
    }
    stop() {
        this.velocity.mul(0);
        this.angularVelocity = 0;
    }
    pointVelocity(p) {
        if (!this.dynamic) return new PhysicsVector(0, 0);
        return new PhysicsVector(
            -(p.y - this.position.y) * this.angularVelocity + this.velocity.x,
            (p.x - this.position.x) * this.angularVelocity + this.velocity.y
        );
    }
    pointForce(p) {
        return PhysicsMatrix.force1ToZero(this, p).invert();
    }
    applyImpulse(pos, imp, factor = 1) {
        if (!this.dynamic || this.mass === 0) return;
        // renderer.stroke(Color.ORANGE).arrow(pos, pos.plus(imp.over(1000)));

        const impx = imp.x * factor;
        const impy = imp.y * factor;

        //linear
        this.velocity.x += impx / this.mass;
        this.velocity.y += impy / this.mass;

        //angular
        if (this.canRotate) {
            const cross = (pos.x - this.position.x) * impy - (pos.y - this.position.y) * impx;
            if (cross) this.angularVelocity += cross / this.inertia;
        }
    }
    accumulateImpulse(pos, imp, factor = 1) {
        if (!this.dynamic || this.mass === 0) return;

        const impx = imp.x * factor;
        const impy = imp.y * factor;

        //linear
        this.accelerationAccumulator.append(impx / this.mass, impy / this.mass);

        //angular
        if (this.canRotate) {
            const cross = (pos.x - this.position.x) * impy - (pos.y - this.position.y) * impx;
            if (cross) this.angularAccelerationAccumulator.append(cross / this.inertia);
        }
    }
    static fromPolygon(vertices, dynamic = true) {
        const position = vertices.reduce((a, b) => a.plus(b));
        position.div(vertices.length);
        vertices = vertices.map(e => e.minus(position));
        const body = new RigidBody(position.x, position.y, dynamic);
        body.addShape(new PolygonCollider(vertices));
        return body;
    }
    static fromRect(x, y, w, h, dynamic = true) {
        const body = new RigidBody(x, y, dynamic);
        body.addShape(new PolygonCollider([
            new PhysicsVector(-w / 2, -h / 2),
            new PhysicsVector(w / 2, -h / 2),
            new PhysicsVector(w / 2, h / 2),
            new PhysicsVector(-w / 2, h / 2)
        ]));
        return body;
    }
    static fromCircle(x, y, r, dynamic = true) {
        const body = new RigidBody(x, y, dynamic);
        body.addShape(new CircleCollider(0, 0, r));
        return body;
    }
}
RigidBody.nextID = 0;

//detection
class CollisionDetector {
    static collideBodies(bodyA, bodyB) {
        if (bodyA.shapes.length === 1 && bodyB.shapes.length === 1) {
            return CollisionDetector.collide(
                bodyA.shapes[0], bodyA.position, bodyA.cosAngle, bodyA.sinAngle,
                bodyB.shapes[0], bodyB.position, bodyB.cosAngle, bodyB.sinAngle
            );
        } else {
            const collisions = [];
            for (let sI = 0; sI < bodyA.shapes.length; sI++) for (let sJ = 0; sJ < bodyB.shapes.length; sJ++) {
                const col = CollisionDetector.collide(
                    bodyA.shapes[sI], bodyA.position, bodyA.cosAngle, bodyA.sinAngle,
                    bodyB.shapes[sJ], bodyB.position, bodyB.cosAngle, bodyB.sinAngle
                );
                if (col !== null) collisions.push(col);
            }
            if (!collisions.length) return null;
            const contacts = [];
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
            if (!contacts.length) return null;
            best.contacts = contacts;
            dir = dir.normalized;
            const dot = best.direction.dot(dir);
            best.penetration *= dot;
            best.direction = dir;
            return best;
        }
    }
    static collide(shapeA, posA, cosA, sinA, shapeB, posB, cosB, sinB) {
        const dx = posB.x - posA.x;
        const dy = posB.y - posA.y;
        if (dx * dx + dy * dy > (shapeA.boundingRadius + shapeB.boundingRadius) ** 2) return null;
        shapeA.cacheModel(posA, cosA, sinA);
        shapeB.cacheModel(posB, cosB, sinB);
        return CollisionDetector.jumpTable[shapeA.constructor.SYMBOL][shapeB.constructor.SYMBOL](shapeA.model, shapeB.model);
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
            return new CollisionDetector.Collision(axis, [bestPoint], bestDist);
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
            return new CollisionDetector.Collision(axis, [point], a.radius + b.radius - Math.sqrt(sqrMag));
        }
        return null;
    }
    static PolygonModel_PolygonModel(a, b) {
        const toB = b.position.minus(a.position);

        const axes = [];
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
            }
        }
        if (!bestAxis) return null;
        const intersections = PhysicsMath.intersectPolygon(a.vertices, b.vertices);

        // if (intersections.length >= 2) {
        //     let final = new PhysicsVector(0, 0);
        //     for (let i = 0; i < intersections.length; i++) final.add(intersections[i]);
        //     final.div(intersections.length);
        //     intersections = [final];
        // }

        const contacts = [];
        if (intersections.length > 0) {
            const firstIntersection = intersections[0];
            contacts.push(firstIntersection);
            let next = 1;
            while (contacts.length < 2 && next < intersections.length) {
                if (!firstIntersection.equals(intersections[next])) contacts.push(intersections[next]);
                next++;
            }
        }

        // for (let i = 0; i < contacts.length; i++) {
        //     const contact = contacts[i];
        //     renderer.stroke(Color.ORANGE, 1).circle(contact, 3);
        // }

        return new CollisionDetector.Collision(bestAxis, contacts, minOverlap);
    }
}
CollisionDetector.Collision = class {
    constructor(direction, contacts, penetration) {
        this.direction = direction;
        this.contacts = contacts;
        this.penetration = penetration;
    }
};
CollisionDetector.jumpTable = {
    [PolygonCollider.SYMBOL]: {
        [PolygonCollider.SYMBOL]: CollisionDetector.PolygonModel_PolygonModel,
        [CircleCollider.SYMBOL]: CollisionDetector.PolygonModel_CircleModel
    },
    [CircleCollider.SYMBOL]: {
        [PolygonCollider.SYMBOL]: CollisionDetector.CircleModel_PolygonModel,
        [CircleCollider.SYMBOL]: CollisionDetector.CircleModel_CircleModel
    }
};

//resolution
class CollisionResolver {
    constructor(engine) {
        this.engine = engine;
        this.forceToDV = new PhysicsMatrix(
            null, null,
            null, null
        );
    }
    vAB(point, bodyA, bodyB, normal) {
        const rAx = point.x - bodyA.position.x;
        const rAy = point.y - bodyA.position.y;
        const rBx = point.x - bodyB.position.x;
        const rBy = point.y - bodyB.position.y;
        if (bodyB.dynamic) {
            const vABx = (-rBy * bodyB.angularVelocity + bodyB.velocity.x) - (-rAy * bodyA.angularVelocity + bodyA.velocity.x);
            const vABy = (rBx * bodyB.angularVelocity + bodyB.velocity.y) - (rAx * bodyA.angularVelocity + bodyA.velocity.y);
            return vABx * normal.x + vABy * normal.y;
        }
        const vABx = rAy * bodyA.angularVelocity - bodyA.velocity.x;
        const vABy = -rAx * bodyA.angularVelocity - bodyA.velocity.y;
        return vABx * normal.x + vABy * normal.y;
    }
    normalImpulse(vAB, mA, mB, iA, iB, e, n, rAx, rAy, rBx, rBy) {
        const crossA = (rAx * n.y - rAy * n.x) * iA;
        const crossB = (rBx * n.y - rBy * n.x) * iB;
        const inertiaTerm = (crossA * rAx + crossB * rBx) * n.y - (crossA * rAy + crossB * rBy) * n.x;

        // const inertiaTerm = rA.cross(n) ** 2 / iA + rB.cross(n) ** 2 / iB

        const invMassSum = mA + mB + inertiaTerm;
        const j = (1 + e) * vAB / invMassSum;
        return j;
    }
    normalImpulses(vAB1, vAB2, mA, mB, iA, iB, e, n, rA1x, rA1y, rB1x, rB1y, rA2x, rA2y, rB2x, rB2y) {
        const nx = n.x;
        const ny = n.y;

        const C1 = -rB1y * iB * nx;
        const C2 = rA1y * iA * nx;
        const C3 = rB1x * iB * ny;
        const C4 = -rA1x * iA * ny;

        const C1_2 = -rB2y * iB * nx;
        const C2_2 = rA2y * iA * nx;
        const C3_2 = rB2x * iB * ny;
        const C4_2 = -rA2x * iA * ny;

        const mABx = nx * (mA + mB);
        const mABy = ny * (mA + mB);

        const { forceToDV } = this;

        forceToDV.a = nx * (C1 * rB1y - C2 * rA1y + C3 * rB1y - C4 * rA1y - mABx) + ny * (-C1 * rB1x + C2 * rA1x - C3 * rB1x + C4 * rA1x - mABy);
        forceToDV.b = nx * (C1 * rB2y - C2 * rA2y + C3 * rB2y - C4 * rA2y - mABx) + ny * (-C1 * rB2x + C2 * rA2x - C3 * rB2x + C4 * rA2x - mABy);
        forceToDV.c = nx * (C1_2 * rB1y - C2_2 * rA1y + C3_2 * rB1y - C4_2 * rA1y - mABx) + ny * (-C1_2 * rB1x + C2_2 * rA1x - C3_2 * rB1x + C4_2 * rA1x - mABy);
        forceToDV.d = nx * (C1_2 * rB2y - C2_2 * rA2y + C3_2 * rB2y - C4_2 * rA2y - mABx) + ny * (-C1_2 * rB2x + C2_2 * rA2x - C3_2 * rB2x + C4_2 * rA2x - mABy);

        const dvFactor = -(1 + e);
        const dv1 = dvFactor * vAB1;
        const dv2 = dvFactor * vAB2;
        const dvs = new PhysicsVector(dv1, dv2);

        return forceToDV.applyInverseTo(dvs);
    }
    resolveContacts(dynamic, bodyA, bodyB, normal, contacts) {
        const tangent = normal.normal;

        const staticFriction = bodyA.friction * bodyB.friction;
        const kineticFriction = staticFriction * 0.9;

        // constants
        const e = Math.max(bodyA.restitution, bodyB.restitution);
        const mA = 1 / bodyA.mass;
        const iA = bodyA.canRotate ? 1 / bodyA.inertia : 0;
        const mB = dynamic ? 1 / bodyB.mass : 0;
        const iB = (dynamic && bodyB.canRotate) ? 1 / bodyB.inertia : 0;
        const GTE_EPSILON = -0.0001;

        const solve1 = contact => {
            // radii
            const rAx = contact.x - bodyA.position.x;
            const rAy = contact.y - bodyA.position.y;
            const rBx = contact.x - bodyB.position.x;
            const rBy = contact.y - bodyB.position.y;

            // normal force
            const vABn = this.vAB(contact, bodyA, bodyB, normal);
            if (vABn >= GTE_EPSILON) return false;
            const normalImpulse = this.normalImpulse(vABn, mA, mB, iA, iB, e, normal, rAx, rAy, rBx, rBy); // normal impulses are down the inverse normal
            if (normalImpulse >= GTE_EPSILON) return false;

            // friction
            const vABt = this.vAB(contact, bodyA, bodyB, tangent);
            const jt = this.normalImpulse(vABt, mA, mB, iA, iB, 0, tangent, rAx, rAy, rBx, rBy);
            const tangentImpulse = (Math.abs(jt) < -normalImpulse * staticFriction) ? jt : Math.sign(jt) * -normalImpulse * kineticFriction; // normal impulses negated for absolute value

            bodyA.applyImpulse(contact, normal, normalImpulse);
            bodyA.applyImpulse(contact, tangent, tangentImpulse);

            if (dynamic) {
                bodyB.applyImpulse(contact, normal, -normalImpulse);
                bodyB.applyImpulse(contact, tangent, -tangentImpulse);
            }

            // renderer.draw(Color.BLUE).circle(contact, 1);
            // const middle = contact;
            // renderer.stroke(Color.YELLOW, 0.4).line(middle.plus(normal.times(4)), middle.plus(normal.times(-4)));

            return true;
        };

        const solve2 = (contact1, contact2) => {
            const rA1x = contact1.x - bodyA.position.x;
            const rA1y = contact1.y - bodyA.position.y;
            const rB1x = contact1.x - bodyB.position.x;
            const rB1y = contact1.y - bodyB.position.y;

            const rA2x = contact2.x - bodyA.position.x;
            const rA2y = contact2.y - bodyA.position.y;
            const rB2x = contact2.x - bodyB.position.x;
            const rB2y = contact2.y - bodyB.position.y;

            // normal force
            const vAB1n = this.vAB(contact1, bodyA, bodyB, normal);
            const vAB2n = this.vAB(contact2, bodyA, bodyB, normal);

            if (vAB1n >= GTE_EPSILON || vAB2n >= GTE_EPSILON) return false;
            const normalImpulses = this.normalImpulses(vAB1n, vAB2n, mA, mB, iA, iB, e, normal, rA1x, rA1y, rB1x, rB1y, rA2x, rA2y, rB2x, rB2y); // normal impulses are down the inverse normal
            if (normalImpulses === null) return false;
            const { x: normalImpulse1, y: normalImpulse2 } = normalImpulses;
            if (normalImpulse1 >= GTE_EPSILON || normalImpulse2 >= GTE_EPSILON) return false;

            // friction (solved individually)
            const vAB1t = this.vAB(contact1, bodyA, bodyB, tangent);
            const vAB2t = this.vAB(contact2, bodyA, bodyB, tangent);
            const jt1 = this.normalImpulse(vAB1t, mA, mB, iA, iB, 0, tangent, rA1x, rA1y, rB1x, rB1y);
            const jt2 = this.normalImpulse(vAB2t, mA, mB, iA, iB, 0, tangent, rA2x, rA2y, rB2x, rB2y);
            const tangentImpulse1 = (Math.abs(jt1) < -normalImpulse1 * staticFriction) ? jt1 : Math.sign(jt1) * -normalImpulse1 * kineticFriction;
            const tangentImpulse2 = (Math.abs(jt2) < -normalImpulse2 * staticFriction) ? jt2 : Math.sign(jt2) * -normalImpulse2 * kineticFriction;

            // apply impulses
            bodyA.applyImpulse(contact1, normal, normalImpulse1);
            bodyA.applyImpulse(contact2, normal, normalImpulse2);

            bodyA.applyImpulse(contact1, tangent, tangentImpulse1);
            bodyA.applyImpulse(contact2, tangent, tangentImpulse2);

            if (dynamic) {
                bodyB.applyImpulse(contact1, normal, -normalImpulse1);
                bodyB.applyImpulse(contact2, normal, -normalImpulse2);
                bodyB.applyImpulse(contact1, tangent, -tangentImpulse1);
                bodyB.applyImpulse(contact2, tangent, -tangentImpulse2);
            }

            // renderer.stroke(Color.RED, 2, LineCap.ROUND).line(contact1, contact2);
            // const middle = contact1.plus(contact2).over(2);
            // renderer.stroke(Color.YELLOW, 0.4).line(middle.plus(normal.times(4)), middle.plus(normal.times(-4)));

            return true;
        };

        for (let i = 0; i < contacts.length; i += 2) {
            if (i + 1 < contacts.length) {
                if (!solve2(contacts[i], contacts[i + 1])) {
                    solve1(contacts[i]);
                    solve1(contacts[i + 1]);
                }
            } else {
                solve1(contacts[i]);
            }
        }
    }
    resolve(dynamic, bodyA, bodyB, direction, penetration, contacts) {
        if (dynamic) {
            const portionA = bodyB.mass / (bodyA.mass + bodyB.mass);
            const moveA = direction.times(-portionA * penetration);
            const moveB = direction.times((1 - portionA) * penetration);
            bodyA.displace(moveA);
            if (bodyB.canMoveThisStep || this.engine.iterations > 2) bodyB.displace(moveB);
        } else {
            const move = direction.times(-penetration);
            bodyA.displace(move);
        }

        this.resolveContacts(dynamic, bodyA, bodyB, direction, contacts);
    }
}
//constraints
class PhysicsConstraint {
    constructor() {
        this.id = PhysicsConstraint.nextID++;
    }
}
PhysicsConstraint.nextID = 0;

class PhysicsConstraint1 extends PhysicsConstraint {
    constructor(body, offset, point) {
        super();
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
    add() {
        this.bodyA.constraints.push(this);
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

class PhysicsConstraint2 extends PhysicsConstraint {
    constructor(a, b, aOff, bOff) {
        super();
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
    add() {
        this.bodyA.constraints.push(this);
        this.bodyB.constraints.push(this);
    }
    hasBody(b) {
        return this.bodyA === b || this.bodyB === b;
    }
    solve() {
        const { bodyA, bodyB, forceToError } = this;

        const dynamicA = bodyA.dynamic;
        const dynamicB = bodyB.dynamic;

        if (dynamicA || dynamicB) {
            const { ends } = this;
            const a = ends[0];
            const b = ends[1];

            // velocity
            const rA = a.minus(bodyA.position);
            const rB = b.minus(bodyB.position);
            const mA = dynamicA ? 1 / bodyA.mass : 0;
            const mB = dynamicB ? 1 / bodyB.mass : 0;
            const mAB = mA + mB;
            const iA = (dynamicA && bodyA.canRotate) ? 1 / bodyA.inertia : 0;
            const iB = (dynamicB && bodyB.canRotate) ? 1 / bodyB.inertia : 0;

            // // correct equation
            // forceToError.a = mA + iA * rA.y ** 2 + mB + iB * rB.y ** 2;
            // forceToError.b = -iA * rA.x * rA.y - iB * rB.x * rB.y;
            // forceToError.c = forceToError.b;
            // forceToError.d = mA + iA * rA.x ** 2 + mB + iB * rB.x ** 2;

            // optimized
            forceToError.a = mAB + (iA * rA.y * rA.y) + (iB * rB.y * rB.y);
            forceToError.b = (-iA * rA.x * rA.y) - (iB * rB.x * rB.y);
            forceToError.c = forceToError.b;
            forceToError.d = mAB + (iA * rA.x * rA.x) + (iB * rB.x * rB.x);



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
        this.bodyMap = new Map();
        this.collisionResolver = new CollisionResolver(this);
        this.drag = 0.005;
        this.friction = 0.5;
        this.constraintMap = new Map();
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
    get bodies() {
        return [...this.bodyMap.values()].filter(body => body.simulated);
    }
    get constraints() {
        return [...this.constraintMap.values()];
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
        constraint.add();
        this.constraintMap.set(constraint.id, constraint);
    }
    solveConstraints() {
        const cons = this.constraints;
        while (cons.length)
            cons.splice(Math.floor(this.constraintOrderGenerator.next() * cons.length), 1)[0].solve();
    }
    applyForces(dynBodies, intensity) {
        const dragFactor = (1 - this.drag) ** intensity;
        const gravitationalAcceleration = this.gravity.times(intensity);
        for (let i = 0; i < dynBodies.length; i++) {
            let body = dynBodies[i];
            if (this.isAsleep(body)) continue;
            if (body.gravity) {
                body.velocity.add(gravitationalAcceleration);
            }
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

        body2.addCollidingBody(body);
        body.addCollidingBody(body2);

        if (!maxPenetration || maxPenetration < 0.01) return;
        this.onCollide(body, body2, collisionDirection, contacts);

        if (body.isTrigger || body2.isTrigger) return;

        let STATIC = !body2.dynamic;

        if (!STATIC && (body.sleeping || body2.sleeping) && (!this.lowActivity(body) || !this.lowActivity(body2))) body2.wake();

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
        this.collisionResolver.resolve(!STATIC, body, body2, collisionDirection, maxPenetration, contacts);

        //immobilize
        body.canMoveThisStep = false;
    }
    collisions(dynBodies, collisionPairs, order) {
        const colBodies = dynBodies.filter(body => body.canCollide);
        colBodies.sort(order);

        // for (let i = 0; i < dynBodies.length; i++) {
        //     renderer.draw(Color.RED).text(Font.Serif25, i + 1, dynBodies[i].position);
        // }

        //collisions
        for (let i = 0; i < colBodies.length; i++) {
            const body = colBodies[i];

            const asleep = this.isAsleep(body);

            //mobilize
            body.canMoveThisStep = true;
            body.prohibitedDirections = [];

            const others = collisionPairs.get(body);
            const vel = body.velocity;
            const collidable = others.filter(b => !(this.isAsleep(b) && asleep)).sort((a, b) => (a.position.x - b.position.x) * vel.x + (a.position.y - b.position.y) * vel.y);

            for (let j = 0; j < collidable.length; j++) {
                const body2 = collidable[j];
                const collision = CollisionDetector.collideBodies(body, body2);
                if (collision !== null) this.resolve(body, body2, collision);
            }
        }
    }
    createGrid(dynBodies) {
        let cellsize = 100;
        if (this.bodies.length) {
            let meanSize = 0;
            for (let i = 0; i < this.bodies.length; i++) meanSize += this.bodies[i].size;
            meanSize /= this.bodies.length;
            if (meanSize) cellsize = meanSize;
        }

        const grid = new PhysicsGrid(cellsize);

        //create grid
        const collisionPairs = new Map();
        for (let i = 0; i < this.bodies.length; i++) {
            let body = this.bodies[i];
            if (!body.canCollide) continue;

            let cellsTotal = [];
            const { shapes } = body;
            for (let j = 0; j < shapes.length; j++) {
                const shape = shapes[j];
                let cells = grid.cellsBounds(body, shape.boundingRadius);
                for (let ii = 0; ii < cells.length; ii++) cellsTotal.push(cells[ii]);
            }
            collisionPairs.set(body, cellsTotal);
        }
        for (let i = 0; i < dynBodies.length; i++) {
            let body = dynBodies[i];
            if (!body.canCollide) continue;

            let cellsTotal = collisionPairs.get(body);
            let bodies = grid.query(body, cellsTotal, b => body.collisionFilter(b) && b.collisionFilter(body));
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
            body.velocity.add(body.accelerationAccumulator.value);
            body.angularVelocity += body.angularAccelerationAccumulator.value.x;
            body.accelerationAccumulator.reset();
            body.angularAccelerationAccumulator.reset();
        }
    }
    run() {
        const dynBodies = this.bodies.filter(body => body.dynamic);

        // approximate where they'll be at the end of the frame
        this.integrate(dynBodies, 1);
        const collisionPairs = this.createGrid(dynBodies);
        this.integrate(dynBodies, -1);

        const intensity = 1 / (this.iterations * this.constraintIterations);

        //sorts
        const { x: gx, y: gy } = this.gravity;
        const gravitySort = (a, b) => (b.position.x - a.position.x) * gx + (b.position.y - a.position.y) * gy;

        this.clearCollidingBodies();

        // solve
        for (this.step = 0; this.step < this.iterations; this.step++) {

            //step
            this.integrate(dynBodies, 1 / this.iterations);
            this.applyForces(dynBodies, 1 / this.iterations);
            this.solveConstraints();
            this.collisions(dynBodies, collisionPairs, gravitySort);
            this.applyAccumulatedImpulses(dynBodies);
            // this.handleSleep(dynBodies);
            // for (const body of dynBodies) {
            //     renderer.stroke(Color.ORANGE).arrow(body.position, body.position.plus(body.velocity));
            // }
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
        this.bodyMap.set(b.id, b);
    }
    removeBody(id) {
        const body = this.bodyMap.get(id);
        // found it!
        body.wake();
        for (let i = 0; i < body.constraints.length; i++) {
            const con = constraints[i];
            this.removeConstraint(con.id);
        }

        this.bodyMap.delete(id);
    }
    removeConstraint(id) {
        const con = this.constraintMap.get(id);
        // found it!
        const constraintsA = con.bodyA.constraints;
        const constraintsB = con.bodyB.constraints;
        constraintsA.splice(constraintsA.indexOf(con), 1);
        constraintsB.splice(constraintsB.indexOf(con), 1);

        this.constraintMap.delete(id);
    }
}

/* problems (json)

[[\"deltav_Ax=M_A(F_A1x+F_A2x)\",\"deltav_Ay=M_A(F_A1y+F_A2y)\",\"deltaomega_A=I_A([R_A1x][F_A1y]-[R_A1y][F_A1x]+[R_A2x][F_A2y]-[R_A2y][F_A2x])\",\"deltav_A1x=[-R_A1y][deltaomega_A]+deltav_Ax\",\"deltav_A1y=[R_A1x][deltaomega_A]+deltav_Ay\",\"deltav_A2x=-[R_A2y]deltaomega_A+deltav_Ax\",\"deltav_A2y=[R_A2x]deltaomega_A+deltav_Ay\",\"=======================\",\"deltav_Bx=M_B(F_B1x+F_B2x)\",\"deltav_By=M_B(F_B1y+F_B2y)\",\"deltaomega_B=I_B([R_B1x][F_B1y]-[R_B1y][F_B1x]+[R_B2x][F_B2y]-[R_B2y][F_B2x])\",\"deltav_B1x=[-R_B1y][deltaomega_B]+deltav_Bx\",\"deltav_B1y=[R_B1x][deltaomega_B]+deltav_By\",\"deltav_B2x=-[R_B2y]deltaomega_B+deltav_Bx\",\"deltav_B2y=[R_B2x]deltaomega_B+deltav_By\",\"=======================\",\"deltav_AB1x=deltav_B1x-deltav_A1x\",\"deltav_AB1y=deltav_B1y-deltav_A1y\",\"deltav_AB2x=deltav_B2x-deltav_A2x\",\"deltav_AB2y=deltav_B2y-deltav_A2y\",\"=======================\",\"C_1=-[R_B1y][I_B]\",\"C_2=[R_A1y][I_A]\",\"deltav_AB1x=([C_1][R_B1y]-M_B-[C_2][R_A1y]-M_A)F_A1x+([C_2][R_A1x]-[C_1][R_B1x])F_A1y+([C_1][R_B2y]-M_B-[C_2][R_A2y]-M_A)F_A2x+([C_2][R_A2x]-[C_1][R_B2x])F_A2y\",\"C_3=[R_B1x][I_B]\",\"C_4=-[R_A1x][I_A]\",\"deltav_AB1y=(C_3[R_B1y]-C_4[R_A1y])F_A1x+(C_4[R_A1x]-C_3[R_B1x]-M_A-M_B)F_A1y+(C_3[R_B2y]-C_4[R_A2y])F_A2x+(C_4[R_A2x]-C_3[R_B2x]-M_A-M_B)F_A2y\",\"C_5=-[R_B2y]I_B\",\"C_6=R_A2y[I_A]\",\"deltav_AB2x=(C_5[R_B1y]-C_6[R_A1y]-M_A-M_B)F_A1x+(C_6[R_A1x]-C_5[R_B1x]-M_A-M_B)F_A1y+(C_5[R_B2y]-C_6[R_A2y])F_A2x+(C_6[R_A2x]-C_5[R_B2x])F_A2y\",\"\"]]

// correct
[[\"deltav_Ax=M_A(F_A1x+F_A2x)\",\"deltav_Ay=M_A(F_A1y+F_A2y)\",\"deltaomega_A=I_A([R_A1x][F_A1y]-[R_A1y][F_A1x]+[R_A2x][F_A2y]-[R_A2y][F_A2x])\",\"deltav_A1x=[-R_A1y][deltaomega_A]+deltav_Ax\",\"deltav_A1y=[R_A1x][deltaomega_A]+deltav_Ay\",\"deltav_A2x=-[R_A2y]deltaomega_A+deltav_Ax\",\"deltav_A2y=[R_A2x]deltaomega_A+deltav_Ay\",\"=======================\",\"deltav_Bx=M_B(F_B1x+F_B2x)\",\"deltav_By=M_B(F_B1y+F_B2y)\",\"deltaomega_B=I_B([R_B1x][F_B1y]-[R_B1y][F_B1x]+[R_B2x][F_B2y]-[R_B2y][F_B2x])\",\"deltav_B1x=[-R_B1y][deltaomega_B]+deltav_Bx\",\"deltav_B1y=[R_B1x][deltaomega_B]+deltav_By\",\"deltav_B2x=-[R_B2y]deltaomega_B+deltav_Bx\",\"deltav_B2y=[R_B2x]deltaomega_B+deltav_By\",\"=======================\",\"deltav_AB1x=deltav_B1x-deltav_A1x\",\"deltav_AB1y=deltav_B1y-deltav_A1y\",\"deltav_AB2x=deltav_B2x-deltav_A2x\",\"deltav_AB2y=deltav_B2y-deltav_A2y\",\"=======================\",\"C_1=-[R_B1y][I_B][n_x]\",\"C_2=[R_A1y][I_A]n_x\",\"C_3=[R_B1x][I_B]n_y\",\"C_4=-[R_A1x][I_A]n_y\",\"deltav_1=(n_x(C_1[R_B1y]-C_2[R_A1y]+C_3[R_B1y]-C_4[R_A1y]-[M_A]n_x-M_B[n_x])+n_y(-C_1[R_B1x]+C_2[R_A1x]-C_3[R_B1x]+C_4[R_A1x]-[M_A]n_y-[M_B]n_y))F_1+(n_x(C_1[R_B2y]-C_2[R_A2y]+C_3[R_B2y]-C_4[R_A2y]-[M_A]n_x-M_B[n_x])+n_y(-C_1[R_B2x]+C_2[R_A2x]-C_3[R_B2x]+C_4[R_A2x]-[M_A]n_y-[M_B]n_y))F_2\",\"deltav_2=[deltav_AB2x]n_x+[deltav_AB2y]n_y\"]]

*/
