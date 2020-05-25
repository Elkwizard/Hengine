class Collision {
    constructor(collides = false, a = null, b = null, shapeA, shapeB, dir, collisionPoints) {
        this.colliding = collides;
        this.dir = dir;
        this.a = a;
        this.b = b;
        this.shapeA = shapeA;
        this.shapeB = shapeB;
        if (collisionPoints) {
            this.penetration = Math.min(...collisionPoints.map(e => e.penetration));
            this.contacts = collisionPoints;
        }
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
        this.top = null;
        this.bottom = null;
        this.left = null;
        this.right = null;
        this.general = null;
    }
    has(el) {
        return this.general && this.general.filter(e => e === el).length > 0;
    }
    test(test) {
        if (!this.general) return null;
        let result = this.general.filter(test);
        if (result.length > 0) return result;
        else return null;
    }
}
class Contact {
    constructor(a, b, point, penetration) {
        this.a = a;
        this.b = b;
        this.point = point;
        this.penetration = penetration;
    }
}
class Impulse {
    constructor(force = Vector2.origin, source = Vector2.origin) {
        this.force = force;
        this.source = source;
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
    constructor(a, b, aOffset, bOffset, length) {
        this.a = a;
        this.b = b;
        this.aOffset = aOffset;
        this.bOffset = bOffset;
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
        if (!Geometry.pointInsideRectangle(b, a.__boundingBox)) return new Collision(false, a, b);
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
            let nP = Geometry.rotatePointAround(a.centerOfMass, b, -a.rotation);
            let colliding = a.x <= nP.x && a.x + a.width >= nP.x && a.y <= nP.y && a.y + a.height >= nP.y;
            return new Collision(colliding, a, b);
        }
    }
    static collideCircleCircle(a, b) {
        s.SAT.boxChecks++;
        s.SAT.SATChecks++;
        let colliding = (b.x - a.x) ** 2 + (b.y - a.y) ** 2 < (a.radius + b.radius) ** 2;
        let col;
        if (colliding) {
            s.SAT.collisions++;
            let collisionAxis = (new Vector2(b.x - a.x, b.y - a.y)).normalize();
            let penetration = a.radius + b.radius - Geometry.distToPoint(a, b);
            let aPoint = collisionAxis.Ntimes(a.radius).Vplus(a.middle);
            let bPoint = collisionAxis.Ntimes(-b.radius).Vplus(b.middle);
            let collisionPoint = aPoint.Vplus(bPoint).Nover(2);

            col = new Collision(true, a, b, a, b, collisionAxis, [new Contact(a, b, collisionPoint, penetration)]);
        } else col = new Collision(false, a, b);
        return col;
    }
    static collidePolygonCircle(a, b) {
        s.SAT.boxChecks++;
        if (!Geometry.overlapRectRect(a.__boundingBox, b.__boundingBox)) return new Collision(false, a, b);
        s.SAT.SATChecks++;
        let bestPoint = Geometry.closestPointOnPolygon(b.middle, a);
        const inside = Physics.collidePolygonPoint(a, b.middle).colliding;
        let colliding = Geometry.distToPoint2(bestPoint, b.middle) < b.radius ** 2 || inside;

        if (colliding) {
            s.SAT.collisions++;
            if (!bestPoint) return new Collision(false, a, b);
            let bestDist = Math.sqrt((bestPoint.x - b.middle.x) ** 2 + (bestPoint.y - b.middle.y) ** 2);
            let penetration = b.radius + (inside ? bestDist : -bestDist);
            //towards b, from collision
            let collisionAxis = new Vector2(b.middle.x - bestPoint.x, b.middle.y - bestPoint.y);
            collisionAxis.normalize();
            if (inside) collisionAxis.mul(-1);

            let col = new Collision(true, a, b, a, b, collisionAxis, [new Contact(a, b, bestPoint, penetration)]);
            return col;
        } else return new Collision(false, a, b);
    }
    static collideCirclePolygon(a, b) {
        s.SAT.boxChecks++;
        if (!Geometry.overlapRectRect(a.__boundingBox, b.__boundingBox)) return new Collision(false, a, b);
        let bestPoint = Geometry.closestPointOnPolygon(a.middle, b);
        const inside = Physics.collidePolygonPoint(b, a.middle).colliding;
        let colliding = Geometry.distToPoint2(bestPoint, a.middle) < a.radius ** 2 || inside;
        s.SAT.SATChecks++;
        //getting resolution data
        let col;
        if (colliding) {
            s.SAT.collisions++;
            if (!bestPoint) return new Collision(false, a, b);
            let bestDist = Geometry.distToPoint(bestPoint, a.middle);
            //towards collision, from a
            let collisionAxis = bestPoint.Vminus(a.middle).normalize();
            let penetration = a.radius + (inside ? bestDist : -bestDist);
            if (inside) collisionAxis.mul(-1);


            col = new Collision(true, a, b, a, b, collisionAxis, [new Contact(a, b, bestPoint, penetration)]);
        } else col = new Collision(false, a, b);
        return col;
    }
    static collidePolygonPolygon(a, b) {
        s.SAT.boxChecks++;
        // c.stroke(cl.RED, 1).rect(a.__boundingBox);
        // c.stroke(cl.BLUE, 1).rect(b.__boundingBox);
        if (!Geometry.overlapRectRect(a.__boundingBox, b.__boundingBox)) return new Collision(false, a, b);

        s.SAT.SATChecks++;

        let aEdges = a.getAxes();
        let bEdges = b.getAxes();
        let edges = [
            aEdges,
            bEdges
        ];
        let aCorners = a.getCorners();
        let bCorners = b.getCorners();

        let colliding = true;
        let collisionAxis = null;
        let collisionPoints = null;
        let leastIntersection = Infinity;
        let pairs = [];
        for (let i = 0; i < edges.length; i++) for (let edge of edges[i]) {
            let aRange = new Range();
            let bRange = new Range();
            if (!(edge.x + edge.y)) continue;
            let aPoints = [];
            for (let point of aCorners) {
                let projection = point.x * edge.x + point.y * edge.y;
                aPoints.push(projection);
            }
            aRange.min = Math.min(...aPoints);
            aRange.max = Math.max(...aPoints);
            let bPoints = [];
            for (let point of bCorners) {
                let projection = point.x * edge.x + point.y * edge.y;
                bPoints.push(projection);
            }
            bRange.min = Math.min(...bPoints);
            bRange.max = Math.max(...bPoints);
            if (!(Range.intersect(aRange, bRange))) {
                colliding = false;
                break;
            } else {
                //colliding along axis!
                pairs.push([aRange, bRange, edge]);
            }
        }
        let col;
        if (colliding) {
            pairs = pairs
                .map(e => [e[0], e[1], e[2], Range.getOverlap(e[0], e[1])]);
            let minimumAry = pairs[0];
            let minimumOverlap = Infinity;
            for (let el of pairs) {
                let abs = Math.abs(el[3]);
                if (abs < minimumOverlap) {
                    minimumOverlap = abs;
                    minimumAry = el;
                }
            }
            let [aRange, bRange, edge, intersect] = minimumAry;
            leastIntersection = Math.abs(intersect);
            if (leastIntersection <= 0) return new Collision(false, a, b); //fake collision?
            collisionAxis = edge.Ntimes(-Math.sign(intersect));
            if (collisionAxis) {
                let aPC = [];
                let bPC = [];
                let aPC2 = [];
                let bPC2 = [];
                let aTP = 0;
                let bTP = 0;
                for (let corner of aCorners) {
                    let proj = corner.dot(edge);
                    if (bRange.contains(proj)) {
                        let pen = bRange.getPenetration(proj);
                        aPC.push(corner.Ntimes(pen));
                        aPC2.push(corner);
                        aTP += pen;
                    }
                }
                for (let corner of bCorners) {
                    let proj = corner.dot(edge);
                    if (aRange.contains(proj)) {
                        let pen = aRange.getPenetration(proj);
                        bPC.push(corner.Ntimes(pen));
                        bPC2.push(corner);
                        bTP += pen;
                    }
                }
                let collisionPointA = aPC.length ? Vector.sum(...aPC).Nover(aTP) : null;
                let collisionPointB = bPC.length ? Vector.sum(...bPC).Nover(bTP) : null;
                const TRANSFORM_TO_LINKED_PENETRATION = (range) => e => {
                    let dot = e.dot(collisionAxis);
                    let pen = range.getPenetration(dot);
                    if (pen < 0) pen = range.getPenetration(-dot);
                    return new Contact(a, b, e, Math.min(leastIntersection, pen));
                }

                if (collisionPointA && !collisionPointB) collisionPoints = [TRANSFORM_TO_LINKED_PENETRATION(bRange)(collisionPointA)];
                else if (!collisionPointA && collisionPointB) collisionPoints = [TRANSFORM_TO_LINKED_PENETRATION(aRange)(collisionPointB)];
                else {
                    let sumDistA = 0;
                    let sumDistB = 0;
                    for (let corner of aPC2) sumDistA += Geometry.distToPoint2(corner, collisionPointA);
                    for (let corner of bPC2) sumDistB += Geometry.distToPoint2(corner, collisionPointB);
                    collisionPoints = (sumDistA < sumDistB) ? aPC2.map(TRANSFORM_TO_LINKED_PENETRATION(bRange)) : bPC2.map(TRANSFORM_TO_LINKED_PENETRATION(aRange));
                }
                col = new Collision(true, a, b, a, b, collisionAxis, collisionPoints);
            } else {
                col = new Collision(false, a, b);
                a.rotation += 0.00001;
                b.rotation += 0.00001;
            }
        } else col = new Collision(false, a, b);
        return col;
    }
    static getTotalPenetration(contacts) {
        let t = 0;
        for (let con of contacts) t += con.penetration;
        return t;
    }
    static fullCollide(a, b) {
        let tempCollisions = [];
        if (!Geometry.overlapRectRect(a.__boundingBox, b.__boundingBox)) return [];
        let shapes = a.getModels();
        let otherShapes = b.getModels();
        for (let shape of shapes) {
            for (let otherShape of otherShapes) {
                tempCollisions.push(Physics.collide(shape, otherShape));
            }
        }
        let cols = tempCollisions.filter(e => e.colliding);
        if (cols.length) {
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
            let res = new Collision(true, a, b, max.shapeA, max.shapeB, max.dir, contacts);
            return [res];
        }
        return [];
    }
    static fullCollideBool(a, b) {
        return !!Physics.fullCollide(a, b).length;
    }
    static resolveContacts(a, b, contacts, direction) {
        const normal = direction.normal.normalize();
        const dir = direction;

        //impulse resolution
        let impulsesA = [];
        let impulsesB = [];
        let totalPenetrationDiv = Physics.getTotalPenetration(contacts);
        function addiA(iA) {
            impulsesA.push(iA);
        }
        function addiB(iB) {
            impulsesB.push(iB);
        }
        for (let contact of contacts) {
            let p = contact.point;
            let impulses = Physics.getImpulses(a, b, dir, p);
            let friction = Physics.getFrictionImpulses(a, b, p, normal);

            let iA = impulses.impulseA;
            let iB = impulses.impulseB;
            let iA2 = friction.impulseA;
            let iB2 = friction.impulseB;
            let ratio = contact.penetration / totalPenetrationDiv;
            if (iA) {
                iA.force.Nmul(ratio);
                addiA(iA);
            }
            if (iA2) {
                iA2.force.Nmul(ratio);
                addiA(iA2);
            }
            if (iB) {
                iB.force.Nmul(ratio);
                addiB(iB);
            }
            if (iB2) {
                iB2.force.Nmul(ratio);
                addiB(iB2);
            }

        }
        for (let iA of impulsesA) {
            a.applyImpulse(iA, iA.name);
        }
        for (let iB of impulsesB) {
            b.applyImpulse(iB, iB.name);
        }
    }
    static resolve(col) {

        //resolve collisions
        let a = col.a;
        let b = col.b;
        let mobileA = !Physics.isWall(a);
        let mobileB = !Physics.isWall(b);
        const d = col.dir.Ntimes(-1);


        //position
        if (col.penetration > 0.05) {
            let tomMath;
            tomMath = Physics.collide(col.shapeA, col.shapeB);
            if (tomMath.colliding) {
                col = tomMath;
                let dir = col.dir.Ntimes(col.penetration);
                //mass percents
                let aPer = 1 - a.__mass / (a.__mass + b.__mass);
                if (!mobileB) aPer = 1;
                let bPer = 1 - aPer;

                //escape dirs
                let aMove = dir.Ntimes(-1 * aPer);
                let bMove = dir.Ntimes(1 * bPer);

                //who knows
                if (col.penetration > col.a.__boundingBox.width + col.a.__boundingBox.height || col.penetration > col.b.__boundingBox.width + col.b.__boundingBox.height) return false;

                //like, the escaping
                a.privateMove(aMove);
                b.privateMove(bMove);
                // console.log(aMove, col.penetration);
                a.cacheBoundingBoxes();
                b.cacheBoundingBoxes();
            } else return false;
        } else return false;

        //velocity
        const A_VEL_AT_COLLISION = a.velocity.dot(col.dir);
        const B_VEL_AT_COLLISION = -b.velocity.dot(col.dir);
        if (A_VEL_AT_COLLISION < 0 && B_VEL_AT_COLLISION < 0) return false;

        //friction

        Physics.resolveContacts(a, b, col.contacts, col.dir);

        //immobilize
        a.canMoveThisFrame = false;
        const dir = col.dir;
        const inv_dir = dir.Ntimes(-1);
        if (b.positionStatic) {
            a.prohibited.push(dir);
        }
        for (let pro of b.prohibited) {
            let dot = pro.dot(dir);
            if (dot > 0.5 && !a.prohibited.includes(dir)) { //are these prohibitions relevant to the collision (should they be inherited)
                a.prohibited.push(dir);
            }
        }
        if (a.positionStatic) {
            b.prohibited.push(inv_dir);
        }

    }
    static events(col) {
        //cache vars
        const a = col.a;
        const b = col.b;
        let mobileA = !Physics.isWall(a);
        let mobileB = !Physics.isWall(b);
        const d = col.dir.Ntimes(-1);

        //do custom collision response
        if (!a.colliding.general) a.colliding.general = [b];
        else if (!a.colliding.general.includes(b)) a.colliding.general.push(b);
        if (!b.colliding.general) b.colliding.general = [a];
        else if (!b.colliding.general.includes(a)) b.colliding.general.push(a);
        let top = d.y > 0.2;
        let bottom = d.y < -0.2;
        let right = d.x > -0.2;
        let left = d.x < 0.2;
        if (left) {
            if (!a.colliding.left) a.colliding.left = [b];
            else if (!a.colliding.left.includes(b)) a.colliding.left.push(b);
            if (!b.colliding.right) b.colliding.right = [a];
            else if (!b.colliding.right.includes(a)) b.colliding.right.push(a);
        }
        if (right) {
            if (!a.colliding.right) a.colliding.right = [b];
            else if (!a.colliding.right.includes(b)) a.colliding.right.push(b);
            if (!b.colliding.left) b.colliding.left = [a];
            else if (!b.colliding.left.includes(a)) b.colliding.left.push(a);
        }
        if (top) {
            if (!a.colliding.top) a.colliding.top = [b];
            else if (!a.colliding.top.includes(b)) a.colliding.top.push(b);
            if (!b.colliding.bottom) b.colliding.top = [a];
            else if (!b.colliding.bottom.includes(a)) b.colliding.bottom.push(a);
        }
        if (bottom) {
            if (!a.colliding.bottom) a.colliding.bottom = [b];
            else if (!a.colliding.bottom.includes(b)) a.colliding.bottom.push(b);
            if (!b.colliding.top) b.colliding.top = [a];
            else if (!b.colliding.top.includes(a)) b.colliding.top.push(a);
        }
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

        for (let dir of ["general", "top", "bottom", "left", "right"]) {
            runEvents(dir);
            a.lastColliding[dir] = a.colliding[dir];
        }
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
    static getFrictionImpulses(a, b, collisionPoint, tangent) {
        let impulseA, impulseB;
        let frictionA = a.getPointVelocity(collisionPoint).projectOnto(tangent).Ntimes(-0.05);//.times(-this.friction * otherFriction * 2);
        let frictionB = b.getPointVelocity(collisionPoint).projectOnto(tangent).Ntimes(-0.05);//.times(-this.friction * otherFriction * 2);
        impulseA = new Impulse(frictionA.Ntimes(a.__mass), collisionPoint);
        impulseB = new Impulse(frictionB.Ntimes(b.__mass), collisionPoint);
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

        const impulse_name = {j_DYNAMIC, j_STATIC_A, j_STATIC_B, PER_A, PER_B, m_A, m_B, a, b}.toString();

        impulseA = new Impulse(I_A, collisionPoint);
        impulseB = new Impulse(I_B, collisionPoint);
        impulseA.name = impulse_name;
        impulseB.name = impulse_name;

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
            const F = 1 / 10;
            const VECTOR_A = new Vector2(dx_N0 * F, dy_N0 * F);
            const VECTOR_B = new Vector2(dx_N1 * F, dy_N1 * F);
            let iA = new Impulse(VECTOR_A.Ntimes(a.__mass), pA);
            let iB = new Impulse(VECTOR_B.Ntimes(b.__mass), pB);
            if (!a.constraintLeader) {
                a.applyImpulse(iA);
                a.privateMove(VECTOR_A);
                // a.privateSetX(a.x + dx_N0);
                // a.privateSetY(a.y + dy_N0);
            }
            if (!b.constraintLeader) {
                b.applyImpulse(iB);
                b.privateMove(VECTOR_B);
                // b.privateSetX(b.x + dx_N1);
                // b.privateSetY(b.y + dy_N1);
            }
            return dif;
        }
        return 0;
    }
}