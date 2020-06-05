class Collision {
    constructor(collides = false, a = null, b = null, dir, collisionPoints) {
        this.colliding = collides;
        this.dir = dir;
        this.a = a;
        this.b = b;
        if (collisionPoints) {
            this.penetration = Math.min(...collisionPoints.map(e => e.penetration)) - 0.001;
            this.contacts = collisionPoints;
        }
    }
    setObjects(a, b) {
        this.a = a;
        this.b = b;
        return this;
    }
    inverse() {
        if (this.colliding) return new Collision(true, this.b, this.a, this.dir.inverse(), this.contacts);
        else return new Collision(false, this.a, this.b);
    }
}
class CollisionPair {
    constructor(object, checks) {
        this.object = object;
        this.others = checks;
    }
}
class CollisionMoniter {
    constructor() {
        this.elements = [];
    }
    get general() {
        return this.elements.map(e => e.element);
    }
    get left() {
        return this.direction(Vector2.left);
    }
    get right() {
        return this.direction(Vector2.right);
    }
    get top() {
        return this.direction(Vector2.up);
    }
    get bottom() {
        return this.direction(Vector2.down);
    }
    extract(moniter) {
        this.elements = moniter.elements.map(e => ({
            dir: e.dir,
            element: e.element
        }));
    }
    clear() {
        this.elements = [];
    }
    add(element, dir) {
        this.elements.push({ element, dir });
    }
    has(el) {
        for (let element of this.elements) if (element.element === el) return true;
        return false;
    }
    direction(d) {
        let result = this.objectTest(e => e.dir.dot(d) > 0.2);
        if (result) return result.map(e => e.element);
        return null;
    }
    objectTest(test) {
        if (!this.elements.length) return null;
        let result = this.elements.filter(test);
        if (result.length > 0) return result;
        else return null;
    }
    test(test) {
        if (!this.elements.length) return null;
        let result = this.elements.map(e => e.element).filter(test);
        if (result.length > 0) return result;
        else return null;
    }
}
class Contact {
    constructor(point, penetration) {
        this.point = point;
        this.penetration = penetration;
    }
}
class Impulse {
    constructor(force = Vector2.origin, source = Vector2.origin) {
        this.force = force;
        this.source = source;
    }
    forceMul(v) {
        this.force.Nmul(v);
        return this;
    }
}
class Range {
    constructor(min = Infinity, max = -Infinity) {
        this.min = min;
        this.max = max;
    }
    get mean() {
        return (this.min + this.max) / 2;
    }
    fix() {
        if (this._min > this._max) [this._min, this._max] = [this._max, this._min];
    }
    extend(n) {
        this.min -= n;
        this.max += n;
    }
    contains(n) {
        return n >= this.min && n <= this.max;
    }
    getPenetration(n) {
        if (n < this.mean) return n - this.min;
        return this.max - n;
    }
    include(a) {
        if (a < this.min) this.min = a;
        if (a > this.max) this.max = a;
        this.fix();
    }
    static getOverlap(a, b) {
        let intersect;
        let sign = 1;
        if (a.mean < b.mean) {
            intersect = b.min - a.max;
        } else {
            intersect = b.max - a.min;
        }
        return intersect * sign;
    }
    static intersect(a, b) {
        return a.min < b.max && b.min < a.max;
    }
}
class Constraint {
    constructor(a, b, aOffset, bOffset, length, stiffness) {
        this.a = a;
        this.b = b;
        this.aOffset = aOffset;
        this.bOffset = bOffset;
        this.stiffness = stiffness;
        if (length === "CURRENT_DIST") {
            let ends = this.getEnds();
            length = Geometry.distToPoint(ends.a, ends.b);
        }
        this.length = length;
    }
    getEnds() {
        let aM = this.a.middle;
        let bM = this.b.middle;
        let pA = Geometry.rotatePointAround(aM, aM.Vplus(this.aOffset), this.a.rotation);
        let pB = Geometry.rotatePointAround(bM, bM.Vplus(this.bOffset), this.b.rotation);
        return new Line(pA, pB);
    }
    solve(intensity = 1) {
        Physics.solveLengthConstraint(this, intensity);
    }
}
class Physics {
    static collide(a, b) {
        s.physicsEngine.SAT.boxChecks++;
        if (a.__boundingBox && b.__boundingBox && !Geometry.overlapRectRect(a.__boundingBox, b.__boundingBox)) return new Collision(false, a, b);
        s.physicsEngine.SAT.SATChecks++;
        let nameA = (a instanceof Circle) ? "Circle" : "Polygon";
        let nameB = (b instanceof Circle) ? "Circle" : "Polygon";
        return Physics["collide" + nameA + nameB](a, b);
    }
    static collidePoint(a, b) {
        let nameA = (a instanceof Circle) ? "Circle" : "Polygon";
        return Physics["collide" + nameA + "Point"](a, b);
    }
    static collideCirclePoint(a, b) {
        return new Collision((b.x - a.x) ** 2 + (b.y - a.y) ** 2 < a.radius ** 2, a, b);
    }
    static collidePolygonPoint(a, b) {
        if (a.__boundingBox && Geometry.pointInsideRectangle(b, a.__boundingBox)) return new Collision(false, a, b);
        if (!(a instanceof Rect)) {
            let axes = a.getAxes();
            let aCorners = a.getCorners();
            let colliding = true;
            for (let axis of axes) {
                let aRange = new Range();
                for (let corner of aCorners) aRange.include(corner.dot(axis));
                let projB = b.dot(axis);
                if (!aRange.contains(projB)) {
                    colliding = false;
                    break;
                }
            }
            return new Collision(colliding, a, b);
        } else {
            let nP = Geometry.rotatePointAround(a.middle, b, -a.rotation);
            let colliding = a.x <= nP.x && a.x + a.width >= nP.x && a.y <= nP.y && a.y + a.height >= nP.y;
            return new Collision(colliding, a, b);
        }
    }
    static collideCircleCircle(a, b) {
        const colliding = (b.x - a.x) ** 2 + (b.y - a.y) ** 2 < (a.radius + b.radius) ** 2;
        let col;
        if (colliding) {
            const collisionAxis = b.middle.Vminus(a.middle);
            const axisMag = collisionAxis.mag;
            const penetration = a.radius + b.radius - axisMag;
            collisionAxis.Ndiv(axisMag);
            const aPoint = collisionAxis.Ntimes(a.radius).Vplus(a.middle);
            const bPoint = collisionAxis.Ntimes(-b.radius).Vplus(b.middle);
            const collisionPoint = aPoint.Vplus(bPoint).Nover(2);

            col = new Collision(true, a, b, collisionAxis, [new Contact(collisionPoint, penetration)]);
        } else col = new Collision(false, a, b);
        return col;
    }
    static collideCirclePolygon(a, b) {
        const bestPoint = Geometry.closestPointOnPolygon(a.middle, b);
        const inside = Physics.collidePolygonPoint(b, a.middle).colliding;
        const colliding = Geometry.distToPoint2(bestPoint, a.middle) < a.radius ** 2 || inside;
        //getting resolution data
        let col;
        if (colliding) {
            if (!bestPoint) return new Collision(false, a, b);

            //towards collision, from a
            const collisionAxis = bestPoint.Vminus(a.middle);
            const bestDist = collisionAxis.mag;
            collisionAxis.Ndiv(bestDist);
            const penetration = a.radius + (inside ? bestDist : -bestDist);
            if (inside) collisionAxis.invert();


            col = new Collision(true, a, b, collisionAxis, [new Contact(bestPoint, penetration)]);
        } else col = new Collision(false, a, b);
        return col;
    }
    static collidePolygonCircle(a, b) {
        return Physics.collideCirclePolygon(b, a).inverse();
    }
    static projectOntoAxis(v_a, v_b, ax) {
        let aRange = Physics.projectPolygonToAxis(v_a, ax);
        let bRange = Physics.projectPolygonToAxis(v_b, ax);
        let a_min = aRange.min;
        let a_max = aRange.max;
        let b_min = bRange.min;
        let b_max = bRange.max;
        return { a_min, a_max, b_min, b_max, a_m: (a_min + a_max) / 2, b_m: (b_min + b_max) / 2 };
    }
    static projectPolygonToAxis(v, ax) {
        let min = Infinity;
        let max = -Infinity;
        for (let i = 0; i < v.length; i++) {
            let value = v[i].dot(ax);
            if (value < min) min = value;
            if (value > max) max = value;
        }
        return { min, max };
    }
    static collidePolygonPoints(corners, axes, points) {
        let ax = [];
        for (let axis of axes) {
            let inv = axis.inverse();
            if (!ax.test(e => e.equals(inv))) ax.push(axis);
        }
        axes = ax;
        let cols = [];
        for (let i = 0; i < points.length; i++) cols.push(true);
        for (let i = 0; i < axes.length; i++) {
            let range = Physics.projectPolygonToAxis(corners, axes[i]);
            for (let j = 0; j < points.length; j++) {
                let proj = points[j].dot(axes[i]);
                let includes = proj >= range.min && proj <= range.max;
                if (!includes) {
                    cols[j] = false;
                }
            }
        }
        return points.filter((e, i) => cols[i]);
    }
    static collidePolygonPolygon(a, b) {
        let toB = b.middle.minus(a.middle);
        let aAxes = a.__axes.map(e => e.inverse());
        let bAxes = b.__axes;

        aAxes = aAxes.filter(e => e.dot(toB) > 0);
        bAxes = bAxes.filter(e => e.dot(toB) > 0);
        let axes = [
            ...aAxes,
            ...bAxes
        ];

        let aCorners = a.getCorners();
        let bCorners = b.getCorners();
        let colliding = true;

        let bestAxis = Vector2.up;
        let bestRange = {};
        let minOverlap = Infinity;
        for (let i = 0; i < axes.length; i++) {
            const axis = axes[i];
            let range = Physics.projectOntoAxis(aCorners, bCorners, axis);
            let { a_min, a_max, b_min, b_max, a_m, b_m } = range;

            let includes = b_max > a_min && a_max > b_min;
            if (!includes) {
                colliding = false;
                break;
            } else {
                let overlap = (a_m < b_m) ? a_max - b_min : b_max - a_min;
                if (overlap < 0) overlap = Infinity;
                if (overlap < minOverlap) {
                    minOverlap = overlap;
                    bestAxis = axis;
                    bestRange = range;
                }
            }
        }
        if (colliding && bestAxis) {
            let contacts = [];
            let contactsA = Physics.collidePolygonPoints(bCorners, b.__axes, aCorners);
            let contactsB = Physics.collidePolygonPoints(aCorners, a.__axes, bCorners);
            if (!Physics.advanced) {
                contactsA = contactsA.slice(0, 2);
                contactsB = contactsB.slice(0, 2);
            }

            for (let i = 0; i < contactsA.length; i++) {
                let dot = contactsA[i].dot(bestAxis);
                let pen = (dot < bestRange.b_m) ? dot - bestRange.b_min : bestRange.b_max - dot;
                if (pen > 0) contacts.push(new Contact(contactsA[i], pen));
            }
            for (let i = 0; i < contactsB.length; i++) {
                let dot = contactsB[i].dot(bestAxis);
                let pen = (dot < bestRange.a_m) ? dot - bestRange.a_min : bestRange.a_max - dot;
                if (pen > 0) contacts.push(new Contact(contactsB[i], pen));
            }
            if (Physics.advanced) contacts = contacts.sort((a, b) => b.penetration - a.penetration).slice(0, 2);
            if (!contacts.length) return new Collision(false, a, b);
            return new Collision(true, a, b, bestAxis, contacts);
        } else return new Collision(false, a, b);
    }
    static getTotalPenetration(contacts) {
        let t = 0;
        for (let i = 0; i < contacts.length; i++) t += contacts[i].penetration;
        return t;
    }
    static fullCollide(a, b) {
        let tempCollisions = [];
        if (!Geometry.overlapRectRect(a.__boundingBox, b.__boundingBox)) return [];

        let shapes = a.getModels();
        let otherShapes = b.getModels();

        for (let i = 0; i < shapes.length; i++) {
            for (let j = 0; j < otherShapes.length; j++) {
                tempCollisions.push(Physics.collide(shapes[i], otherShapes[j]));
            }
        }
        let cols = tempCollisions.filter(e => e.colliding);
        if (cols.length) {
            if (cols.length === 1) {
                return [cols[0].setObjects(a, b)];
            } else {
                let max = cols[0];
                let maxPen = Physics.getTotalPenetration(cols[0].contacts);
                let contacts = [];
                for (let col of cols) {
                    contacts.push(...col.contacts);
                    let pen = Physics.getTotalPenetration(col.contacts);
                    if (pen > maxPen) {
                        maxPen = pen;
                        max = col;
                    }
                }
                let res = new Collision(true, a, b, max.dir, contacts);
                res.penetration = Math.max(...cols.map(e => e.penetration));
                return [res];
            }
        }
        return [];
    }
    static fullCollideBool(a, b) {
        return !!Physics.fullCollide(a, b).length;
    }
    static resolveContacts(a, b, contacts, direction) {
        let penFactor = Physics.getTotalPenetration(contacts);
        let impulsesA = [], impulsesB = [];
        let tangent = direction.normal;
        for (let i = 0; i < contacts.length; i++) {
            let contact = contacts[i];
            const factor = contact.penetration / penFactor;
            let { impulseA, impulseB } = Physics.getImpulses(a, b, direction, contact.point);
            if (impulseA) impulsesA.push(impulseA.forceMul(factor));
            if (impulseB) impulsesB.push(impulseB.forceMul(factor));
            let friction = Physics.getFrictionImpulses(a, b, tangent, contact.point);
            impulseA = friction.impulseA;
            impulseB = friction.impulseB;
            if (impulseA) impulsesA.push(impulseA.forceMul(factor));
            if (impulseB) impulsesB.push(impulseB.forceMul(factor));
        }
        for (let i = 0; i < impulsesA.length; i++) a.internalApplyImpulse(impulsesA[i]);
        for (let i = 0; i < impulsesB.length; i++) b.internalApplyImpulse(impulsesB[i]);
    }
    static resolve(col) {
        const { a, b, dir, contacts, penetration } = col;
        a.physicsEngine.SAT.collisions++;
        if (b.velocity.dot(dir) - b.velocity.dot(dir) < 0) return;

        if (penetration > 0.05) {
            //going away
            let move = dir.Ntimes(-penetration);
            let massPerA = a.__mass / (a.__mass + b.__mass);
            let massPerB = 1 - massPerA;
            let isWallB = Physics.isWall(b);
            let aMove = isWallB ? move : move.Ntimes(massPerA);
            a.privateMove(aMove);
            if (!isWallB) {
                let bMove = move.Ntimes(-massPerB);
                b.privateMove(bMove);
            }
        }

        Physics.resolveContacts(a, b, contacts, dir);

        // immobilize
        a.canMoveThisFrame = false;
        const inv_dir = dir.inverse();
        if (a.positionStatic) {
            b.prohibited.push(inv_dir);
        }
        for (let i = 0; i < b.prohibited.length; i++) {
            let pro = b.prohibited[i];
            const dot = pro.dot(dir);
            if (dot > 0.5 && !a.prohibited.includes(dir)) { //are these prohibitions relevant to the collision (should they be inherited)
                a.prohibited.push(dir);
            }
        }
        if (b.positionStatic) {
            a.prohibited.push(dir);
        }
    }
    static events(col) {
        //cache vars
        const a = col.a;
        const b = col.b;

        //do custom collision response
        a.colliding.add(b, col.dir);
        b.colliding.add(a, col.dir.inverse());
    }
    static runEventListeners(a) {
        function runEvents(name) {
            let now = a.colliding[name];
            let last = a.lastColliding[name];
            if (now) for (let el of now) if (!last || !last.includes(el)) {
                a.response.collide[name](el);
                a.scripts.run("collide" + name.capitalize(), el);
            }
        }
        for (let dir of ["left", "right", "top", "bottom", "general"]) runEvents(dir);
        a.lastColliding.extract(a.colliding);
    }
    static getLineCells(a, b, cellSize) {
        let cells = [];
        const c = cellSize;
        const f = (v) => new Vector2(Math.floor(v.x / c), Math.floor(v.y / c));
        let minX = Math.min(a.x, b.x);
        let maxX = Math.max(a.x, b.x);
        let minY = Math.min(a.y, b.y);
        let maxY = Math.max(a.y, b.y);
        a = new Vector2(minX, minY);
        b = new Vector2(maxX, maxY);
        let A = f(a);
        let B = f(b);
        let d = B.Vminus(A);
        for (let i = 0; i <= d.x; i++) for (let j = 0; j <= d.y; j++) cells.push(A.plus(new Vector2(i, j)));

        return cells;

        /*
        //bad
        a = a.over(cellSize);
        b = b.over(cellSize);
        function floor(v) {
            return new Vector2(Math.floor(v.x), Math.floor(v.y));
        }
        if (!(b.x - a.x)) {
            let mag = b.y - a.y;
            let ps = [];
            for (let i = 0; i < mag; i++) {
                ps.push(floor(new Vector2(a.x, a.y + i)));
            }
            return ps;
        }
        function point(v) {
            c.draw(cl.RED).circle(v.x * cellSize, v.y * cellSize, 5);
        }
        const vct = b.minus(a).normalize();
        function getRect(x, y, m, b) {
            let minX = m * x + b;
            let maxX = m * (x + 1) + b;

            let minY = (y - b) / m;
            let maxY = (y + 1 - b) / m;

            let ps = [];

            const off = 0.0001;
            if (minY > x && minY < x + 1) {
                ps.push(new Vector2(minY, y - off));
            }
            if (maxY > x && maxY < x + 1) {
                ps.push(new Vector2(maxY, y + 1 + off));
            }
            if (minX > y && minX < y + 1) {
                ps.push(new Vector2(x - off, minX));
            }
            if (maxX > y && maxX < y + 1) {
                ps.push(new Vector2(x + 1 + off, maxX));
            }

            // for (let p of ps) point(p);

            if (!ps.length) return new Vector2(x, y);
            if (ps.length === 1) return floor(ps[0]);

            let rt = ps[0];
            if (ps[1].dot(vct) > ps[0].dot(vct)) rt = ps[1];
            return floor(rt);
        }
        let points = [];
        let loc = floor(a);
        let M = (b.y - a.y) / (b.x - a.x);
        let B = a.y - M * a.x;

        const dist = Geometry.distToPoint2(a, b);

        let steps = 0;
        while (Geometry.distToPoint2(a, loc) <= dist && steps < 1000) {
            steps++;

            points.push(loc);
            let n = getRect(loc.x, loc.y, M, B);
            if (n.equals(loc)) n = floor(n.plus(vct));
            loc = n;
        }
        points.push(loc);
        loc = getRect(loc.x, loc.y, M, B);
        return points; */
    }
    static getCells(rect, cellsize) {
        let finalCells = [];
        for (let r of rect.getModels()) {
            let bound = r.getBoundingBox();
            if (r instanceof Circle || (bound.width * bound.height) / (cellsize ** 2) < 30) {
                const x = bound.x;
                const y = bound.y;
                const w = bound.width;
                const h = bound.height;
                const c = cellsize;
                const dim = new Vector2(w, h);
                const min = new Vector2(x, y);
                const max = min.plus(dim);
                const f = (v) => new Vector2(Math.floor(v.x / c), Math.floor(v.y / c));
                const start = f(min);
                const end = f(max);
                const d = end.minus(start);
                const result = [];
                for (let i = 0; i <= d.x; i++) for (let j = 0; j <= d.y; j++) result.push(start.plus(new Vector2(i, j)));
                let cells = result;
                finalCells.push(...cells);
            } else {
                let indv = r.getEdges().map(e => Physics.getLineCells(e.a, e.b, cellsize));
                let cells = [];
                for (let i of indv) cells.push(...i);
                finalCells.push(...cells);
            }
        }
        return finalCells;
    }
    static isWall(r) {
        return r.positionStatic || r.rotationStatic || !r.canMoveThisFrame;
    }
    static getFrictionImpulses(a, b, tangent, collisionPoint) {
        let impulseA, impulseB;
        let frictionA = tangent.Ntimes(a.getPointVelocity(collisionPoint).dot(tangent) * -0.05 * a.__mass);//.times(-this.friction * otherFriction * 2);
        let frictionB = tangent.Ntimes(b.getPointVelocity(collisionPoint).dot(tangent) * -0.05 * b.__mass);//.times(-this.friction * otherFriction * 2);
        impulseA = new Impulse(frictionA, collisionPoint);
        impulseB = new Impulse(frictionB, collisionPoint);
        return { impulseA, impulseB };
    }
    static getImpulses(a, b, dir, collisionPoint) {
        let impulseA, impulseB;

        const m_A = a.__mass;
        const m_B = b.__mass;
        const v_A = a.getPointVelocity(collisionPoint);
        const v_B = b.getPointVelocity(collisionPoint);
        const v_AB = v_B.Vminus(v_A);
        const n = dir;
        if (v_AB.dot(n) > 0) return { impulseA: null, impulseB: null }; //going away
        const e = Math.max(1 - a.snuzzlement, 1 - b.snuzzlement);
        //v_AB dot n = (v_B - v_A) dot n;

        const j_DYNAMIC = -(1 + e) * v_AB.dot(n) / (1 / m_A + 1 / m_B);
        const j_STATIC_A = v_A.dot(n) * (1 + e) * m_A; //just for walls
        const j_STATIC_B = v_B.dot(n) * (1 + e) * m_B;  //just for walls
        const V_A_DOT_N = v_A.dot(n);
        const V_B_DOT_N = v_B.dot(n);
        let PER_A = b.completelyStatic ? 0 : Vector.prohibitDirections(b.prohibited, v_A).dot(n) / V_A_DOT_N;  //just for walls (measures how wall it is on a scale of 0 - 1)
        let PER_B = a.completelyStatic ? 0 : Vector.prohibitDirections(a.prohibited, v_B).dot(n) / V_B_DOT_N;  //just for walls
        if (!V_A_DOT_N) PER_A = 1;
        if (!V_B_DOT_N) PER_B = 1;
        const j_A = j_DYNAMIC * PER_A + j_STATIC_A * (1 - PER_A);
        const j_B = j_DYNAMIC * PER_B + j_STATIC_B * (1 - PER_B);
        const I_A = n.Ntimes(-j_A);
        const I_B = n.Ntimes(j_B);

        impulseA = new Impulse(I_A, collisionPoint);
        impulseB = new Impulse(I_B, collisionPoint);

        // c.stroke(cl.RED).arrow(a.middle, collisionPoint);
        // c.stroke(cl.RED).arrow(collisionPoint, collisionPoint.plus(I_A.normalized.times(50)));
        // c.draw(cl.ORANGE).circle(collisionPoint, 5);

        if (b.completelyStatic) impulseB = null;

        return { impulseA, impulseB };
    }
    //constraints
    static solveLengthConstraint(constraint, intensity) {
        let a = constraint.a;
        let b = constraint.b;
        let len = constraint.length;
        let ends = constraint.getEnds();
        let pA = ends.a;
        let pB = ends.b;
        let dx = pA.x - pB.x;
        let dy = pA.y - pB.y;
        let dist = dx ** 2 + dy ** 2;
        if (dist !== len ** 2 && dist) {
            let act_dist = Math.sqrt(dist);
            let dif = act_dist - len;
            let dx_N = dx / act_dist;
            let dy_N = dy / act_dist;
            let mDif = (!(a.constraintLeader || a.completelyStatic) && !(b.constraintLeader || b.completelyStatic)) ? dif / 2 : dif;
            let dx_N0 = -dx_N * mDif;
            let dy_N0 = -dy_N * mDif;
            let dx_N1 = dx_N * mDif;
            let dy_N1 = dy_N * mDif;
            const F = 1 / 10 * intensity * constraint.stiffness;
            const VECTOR_A = new Vector2(dx_N0 * F, dy_N0 * F);
            const VECTOR_B = new Vector2(dx_N1 * F, dy_N1 * F);
            let iA = new Impulse(VECTOR_A.Ntimes(a.__mass), pA);
            let iB = new Impulse(VECTOR_B.Ntimes(b.__mass), pB);
            if (!a.constraintLeader) {
                a.internalApplyImpulse(iA);
                a.privateMove(VECTOR_A);
                // a.privateSetX(a.x + dx_N0);
                // a.privateSetY(a.y + dy_N0);
            }
            if (!b.constraintLeader) {
                b.internalApplyImpulse(iB);
                b.privateMove(VECTOR_B);
                // b.privateSetX(b.x + dx_N1);
                // b.privateSetY(b.y + dy_N1);
            }
            return dif;
        }
        return 0;
    }
}
Physics.advanced = true;
class PhysicsEngine {
    constructor(gravity) {
        this.gravity = gravity;
		this.angularDragForce = .995;
		this.linearDragForce = .995;
		this.frictionDragForce = 0.2;
        this.cellSize = 150;
        this.collisionEvents = false;
        this.constraints = [];
        this.physicsRealism = 1;
        this.speedModulation = 1;
		this.SAT = {
			possibleChecks: 0,
			gridChecks: 0,
			boxChecks: 0,
			SATChecks: 0,
			collisions: 0
		};
    }
    run(elements) {
		this.SAT = {
			possibleChecks: 0,
			gridChecks: 0,
			boxChecks: 0,
			SATChecks: 0,
			collisions: 0
        };
        
		const arrays = this.extractUsefulCellArrays(elements);

		this.cleanConstraints();
		//physics
		for (let i = 0; i < this.physicsRealism; i++) {
			this.updateCaches(arrays.usefulArray);
			this.gravitySort(arrays.useful);
			this.gravityPhase(arrays.usefulArray);
			this.constraintSolve();
			this.collisionStep(arrays.useful);
			this.constraintSolve();
			this.collisionStep([...arrays.useful].reverse());
		}
		this.updatePreviousData(arrays.usefulArray);

		//events
		if (this.collisionEvents) this.runEventListeners(arrays.usefulArray);

        return arrays;
    }
    updateCaches(useful) {
		for (const el of useful) el.updateCaches();
    }
	runEventListeners(useful) {
		for (let el of useful) {
			Physics.runEventListeners(el);
		}
	}
	gravityPhase(useful) {
		for (let el of useful) {
			let rect = el;
			rect.applyGravity(1);
		}
	}
	extractUsefulCellArrays(elements) {
		let cells = { };
		let useful = [];
		let useless = [];
		let isUseless = a => !(a instanceof PhysicsObject);
		//categorize
		for (let rect of elements) {
			if (isUseless(rect)) {
				useless.push(rect);
				continue;
			} else useful.push([rect]);
		}
		//get cells, accumulate cells
		for (let usef of useful) {
			let rect = usef[0];
			let cls = Physics.getCells(rect, this.cellSize);
			for (let cl of cls) {
				let key = cl.x + "," + cl.y;
				if (cells[key]) cells[key].push(rect);
				else cells[key] = [rect];
				let use = usef;
				use.push(cells[key]);
			}
		}
		//map to collisionPairs
		useful = useful.map(usef => {
			//get rectangles
			let [rect, ...updateCells] = usef;
			let updater = [];
			if (!rect.completelyStatic) for (let cell of updateCells) {
				for (let r of cell) {
					if (r !== rect && !updater.includes(r)) updater.push(r);
				}
			}
			return new CollisionPair(rect, updater);
		});
		//remove duplicates
		useful = [...(new Set(useful))];

		// show cells
		// s.drawInWorldSpace(e => {
		// 	const cell_size = this.cellSize;
		// 	for (let [key, cell] of cells) {
		// 		let x = parseInt(key.split(",")[0]) * cell_size;
		// 		let y = parseInt(key.split(",")[1]) * cell_size;
		// 		let r = new Rect(x, y, cell_size, cell_size);
		// 		c.stroke(cl.RED, 3).rect(r);
		// 		c.draw(new Color(255, 0, 0, 0.15)).rect(r);
		// 	}
		// });
		
		let usefulArray = useful.map(e => e.object);
		return { useful, useless, usefulArray };
	}
	updatePreviousData(useful) {
		for (let use of useful) use.updatePreviousData();
	}
	cleanConstraints() {
		let keep = [];
		for (let con of this.constraints) {
			if (con.a.isDead || con.b.isDead);
			else keep.push(con);
		}
		this.constraints = keep;
	}
	gravitySort(useful) {
		const dir = this.gravity.normalized;
		useful.sort(function (a, b) {
			let mA = Vector2.fromPoint(a.object);
			let mB = Vector2.fromPoint(b.object);
			let dA = mA.dot(dir);
			let dB = mB.dot(dir);
			return dB - dA;
		});
	}
	collisionStep(useful) {
        let amtObjects = useful.length;
		for (let i = 0; i < useful.length; i++) {
			let rect = useful[i].object;
			let updater = useful[i].others;

			this.SAT.gridChecks += updater.length;
			this.SAT.possibleChecks += updater.length ? s.elementArray.length : 0;
            if (!rect.usedForCellSize) this.recalculateAverageCellSize(amtObjects, rect);
			rect.physicsUpdate(updater);
		}
	}
	constraintSolve() {
		for (let i = 1; i < 3; i++) {
			let random = this.constraints.randomize();
			for (let constraint of random) {
				constraint.solve(1 / i);
			}
		}
	}
	constrain(a, b, aOffset = Vector2.origin, bOffset = Vector2.origin, length = "CURRENT_DIST", stiffness = 1) {
		this.constraints.push(new Constraint(a, b, aOffset, bOffset, length, stiffness));
	}
	recalculateAverageCellSize(otherElements, newEl) {
		let oldAvg = this.cellSize;
		let mul = otherElements;
		oldAvg *= mul;
		let newSize = newEl.width + newEl.height;
		let newAverageMax = (oldAvg + newSize) / (mul + 1);
		this.cellSize = newAverageMax;
		newEl.usedForCellSize = true;
	}
}