class Collision {
    constructor(collides = false, a = null, b = null, dir, penetration, collisionPoint) {
        this.colliding = collides;
        this.dir = dir;
        this.a = a;
        this.b = b;
        this.penetration = penetration;
        if (collisionPoint) {
            this.collisionPoints = collisionPoint.length ? collisionPoint : [{
                point: collisionPoint,
                penetration
            }]; 
        }
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
    fix() {
        if (this._min > this._max) [this._min, this._max] = [this._max, this._min];
    }
    get mean() {
        return (this.min + this.max) / 2;
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
        this.length = length;
    }
    solve() {
        Physics.solveLengthConstraint(this.a, this.b, this.aOffset, this.bOffset, this.length);
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
            let penetration = a.radius + b.radius - g.f.getDistance(a, b);
            let aPoint = collisionAxis.times(a.radius).plus(a.middle);
            let bPoint = collisionAxis.times(-b.radius).plus(b.middle);
            let collisionPoint = aPoint.plus(bPoint).over(2);



            col = new Collision(true, a, b, collisionAxis, penetration, collisionPoint);
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



            // c.draw(cl.LIME).circle(bestPoint.x, bestPoint.y, 4);

            let col = new Collision(true, a, b, collisionAxis, penetration, bestPoint);
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
            let collisionAxis = bestPoint.minus(a.middle).normalize();
            let penetration = a.radius + (inside ? bestDist : -bestDist);
            if (inside) collisionAxis.mul(-1);


            col = new Collision(true, a, b, collisionAxis, penetration, bestPoint);
        } else col = new Collision(false, a, b);
        return col;
    }
    static collidePolygonPolygon(a, b) {
        s.SAT.boxChecks++;
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
//         for (let corner of [...aCorners, ...bCorners]) {
//             c.draw(cl.RED).circle(corner.x, corner.y, 3);
//         }
//         let le = a.getEdges();
//         for (let i = 0; i < le.length; i++) {
//             c.stroke(cl.LIME, 2).line(le[i]);
//             let normal = aEdges[(i - 1 + 4) % 4];
//             if (normal) c.stroke(cl.ORANGE, 1).arrow(le[i].midPoint, le[i].midPoint.plus(normal.times(20)));
//         }
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
        // colliding = false;
        let col;
        if (colliding) {
            pairs = pairs
                .map(e => [e[0], e[1], e[2], Range.getOverlap(e[0], e[1])])
                .sort((a, b) => {
                    return Math.abs(a[3]) - Math.abs(b[3]);
                });
            let [aRange, bRange, edge, intersect] = pairs[0];
            // c.stroke(cl.RED, 4).arrow(a.centerOfMass, a.centerOfMass.plus(edge.times(intersect)));
            leastIntersection = Math.abs(intersect);
            if (leastIntersection <= 0) return new Collision(false, a, b); //fake collision?
            collisionAxis = edge.times(-Math.sign(intersect));
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
                        aPC.push(corner.times(pen));
                        aPC2.push(corner);
                        aTP += pen;
                    }
                }
                for (let corner of bCorners) {
                    let proj = corner.dot(edge);
                    if (aRange.contains(proj)) {
                        let pen = aRange.getPenetration(proj);
                        bPC.push(corner.times(pen));
                        bPC2.push(corner);
                        bTP += pen;
                    }
                }
                // for (let crn of aPC) c.draw(cl.PURPLE).circle(crn.x, crn.y, 5);
                let collisionPointA = aPC.length ? Vector.sum(...aPC).over(aTP) : null;
                let collisionPointB = bPC.length ? Vector.sum(...bPC).over(bTP) : null;
                // if (aPC.length) c.draw(cl.GREEN).circle(collisionPointA.x, collisionPointA.y, 6);
                // if (bPC.length) c.draw(cl.ORANGE).circle(collisionPointB.x, collisionPointB.y, 6);
                const TRANSFORM_TO_LINKED_PENETRATION = (range) => e => ({
                    point: e,
                    penetration: range.getPenetration(e.dot(collisionAxis))
                });

                if (collisionPointA && !collisionPointB) collisionPoints = [TRANSFORM_TO_LINKED_PENETRATION(bRange)(collisionPointA)];
                else if (!collisionPointA && collisionPointB) collisionPoints = [TRANSFORM_TO_LINKED_PENETRATION(aRange)(collisionPointB)];
                else {
                    let sumDistA = 0;
                    let sumDistB = 0;
                    for (let corner of aPC2) sumDistA += Geometry.distToPoint2(corner, collisionPointA);
                    for (let corner of bPC2) sumDistB += Geometry.distToPoint2(corner, collisionPointB);
                    collisionPoints = (sumDistA < sumDistB) ? aPC2.map(TRANSFORM_TO_LINKED_PENETRATION(bRange)) : bPC2.map(TRANSFORM_TO_LINKED_PENETRATION(aRange));
//                    for (let p of collisionPoints) {
//                        c.draw(cl.GREEN).circle(p.point.x, p.point.y, 4);
//                    }
                }
                // for (let corner of aPC2) c.draw(cl.ORANGE).circle(corner.x, corner.y, 3);
                // for (let corner of bPC2) c.draw(cl.PURPLE).circle(corner.x, corner.y, 3);
                // c.draw(cl.BLUE).circle(collisionPoint.x, collisionPoint.y, 2);

                // c.stroke(cl.GREEN, 2).arrow(a.centerOfMass, a.centerOfMass.plus(collisionAxis.times(leastIntersection)));
                col = new Collision(true, a, b, collisionAxis, leastIntersection, collisionPoints);
            } else {
                col = new Collision(false, a, b);
                a.rotation += 0.00001;
                b.rotation += 0.00001;
            }
        } else col = new Collision(false, a, b);
        return col;
    }
    static fullCollide(a, b) {
        let tempCollisions = [];
        let shapes = a.getModels();
        let otherShapes = b.getModels();
        for (let shape of shapes) {
            for (let otherShape of otherShapes) {
                tempCollisions.push(Physics.collide(shape, otherShape));
            }
        }
        let cols = tempCollisions.filter(e => e.colliding);
        cols = cols
            // .map(e => {
            //     let n = e;
            //     n.a = a;
            //     n.b = b;
            //     return n;
            // })
        if (cols.length) {
            // let dir = Vector2.origin;
            // let collisionPoint = Vector2.origin;
            // let penetration = 0;
            // let totalPen = 0;
            // for (let col of cols) {
            //     let curPen = 1;
            //     totalPen += curPen;
            //     dir.add(col.dir.mul(curPen));
            //     collisionPoint.add(col.collisionPoint.mul(curPen));
            //     penetration += col.penetration * curPen;
            // }
            // let l = cols.length * totalPen;
            // return [new Collision(true, a, b, dir.div(l), penetration / l, collisionPoint.div(l))];
            return cols.map(e => {
                let n = e;
                n.a = a;
                n.b = b;
                return n;
            });
        }
        return [];
    }
    static fullCollideBool(a, b) {
        return !!Physics.fullCollide(a, b).length;
    }
    static resolve(col) {
        //resolve collisions
        let a = col.a;
        let b = col.b;
        let mobileA = !Physics.isWall(a);
        let mobileB = !Physics.isWall(b);
        

        //position
        if (col.penetration > 0.005) {
            let tomMath;
            tomMath = Physics.fullCollideBool(a, b);
            if (tomMath) {
                let dir = col.dir.times(col.penetration);
                //mass percents
                let aPer = 1 - a.__mass / (a.__mass + b.__mass);
                if (!mobileB) aPer = 1;
                let bPer = 1 - aPer;

                //escape dirs
                let aMove = dir.times(-1 * aPer);
                let bMove = dir.times(1 * bPer);

                // c.stroke(cl.BLUE, 2).arrow(col.collisionPoint, col.collisionPoint.minus(col.dir.times(col.penetration)));

                //like, the escaping
                a.privateMove(aMove);
                b.privateMove(bMove);
                a.cacheBoundingBoxes();
                b.cacheBoundingBoxes();

            } else return false;
        } else return false;


        const d = col.dir.times(-1);

        //velocity
        const A_VEL_AT_COLLISION = a.velocity.dot(col.dir);
        const B_VEL_AT_COLLISION = -b.velocity.dot(col.dir);
        if (A_VEL_AT_COLLISION < 0 && B_VEL_AT_COLLISION < 0) return false;

        //friction
        const normal = d.normal.normalize();


        //impulse resolution
        let impulsesA = [];
        let impulsesB = [];
        let pen = 0;
        for (let collisionPoint of col.collisionPoints) pen += collisionPoint.penetration;
        for (let collisionPoint of col.collisionPoints) {
            let p = collisionPoint.point;
            let impulses = Physics.getImpulses(a, b, col.dir, p);
            let iA = impulses.impulseA;
            let iB = impulses.impulseB;
            let ratio = collisionPoint.penetration / pen;
            if (iA) {
                iA.force.mul(ratio);
                impulsesA.push(iA);
            }
            if (iB) {
                iB.force.mul(ratio);
                impulsesB.push(iB);
            }
            
            //I don't care enough to distribute these
            let friction = Physics.getFrictionImpulses(a, b, p, normal);
            a.applyLinearImpulse(friction.impulseLinearA);
            a.applyAngularImpulse(friction.impulseAngularA);
            b.applyLinearImpulse(friction.impulseLinearB);
            b.applyAngularImpulse(friction.impulseAngularB);
        }
        for (let iA of impulsesA) {
            a.applyImpulse(iA);
        }
        for (let iB of impulsesB) {
            b.applyImpulse(iB);
        }

        //immobilize
        a.canMoveThisFrame = false;
        const dir = col.dir;
        const inv_dir = dir.times(-1);
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

        //do custom collision response
        if (!a.colliding.general) a.colliding.general = [b];
        else a.colliding.general.push(b);
        if (!b.colliding.general) b.colliding.general = [a];
        else b.colliding.general.push(a);
        let top = d.y > 0.2;
        let bottom = d.y < -0.2;
        let right = d.x > -0.2;
        let left = d.x < 0.2;
        if (left) {
            if (!a.colliding.left) a.colliding.left = [b];
            else a.colliding.left.push(b);
            if (!b.colliding.right) b.colliding.right = [a];
            else b.colliding.right.push(a);
        }
        if (right) {
            if (!a.colliding.right) a.colliding.right = [b];
            else a.colliding.right.push(b);
            if (!b.colliding.left) b.colliding.left = [a];
            else b.colliding.left.push(a);
        }
        if (top) {
            if (!a.colliding.top) a.colliding.top = [b];
            else a.colliding.top.push(b);
            if (!b.colliding.bottom) b.colliding.top = [a];
            else b.colliding.bottom.push(a);
        }
        if (bottom) {
            if (!a.colliding.bottom) a.colliding.bottom = [b];
            else a.colliding.bottom.push(b);
            if (!b.colliding.top) b.colliding.top = [a];
            else b.colliding.top.push(a);
        }
        if (s.collisionEvents) {
            Physics.runEventListeners(a);
            Physics.runEventListeners(b);
        }
        return true;
    }
    static resolveResults(resolution) {
        const a = resolution.a;
        const b = resolution.b;
        
        //prevent interpenetration
        a.privateMove(resolution.movement.aMove);
        b.privateMove(resolution.movement.bMove);
        a.cacheBoundingBoxes();
        b.cacheBoundingBoxes();
        
        //impulses
        a.applyImpulse(resolution.impulses.impulseA);
        b.applyImpulse(resolution.impulses.impulseB);
        
        //friction
        a.applyAngularImpulse(resolution.friction.impulseAngularA);
        a.applyLinearImpulse(resolution.friction.impulseLinearA);
        b.applyAngularImpulse(resolution.friction.impulseAngularB);
        b.applyLinearImpulse(resolution.friction.impulseLinearB);
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
    static getCells(rect, cellsize) {
        let finalCells = [];
        for (let r of rect.getModels()) {
            let bound = r.getBoundingBox();
            if (!(r instanceof Rect) || (bound.width * bound.height) / (cellsize ** 2) < 30) {
                let cells = [];
                for (let i = 0; i <= Math.ceil(bound.width / cellsize); i++) {
                    for (let j = 0; j <= Math.ceil(bound.height / cellsize); j++) {
                        let x = i + Math.floor(bound.x / cellsize);
                        let y = j + Math.floor(bound.y / cellsize);
                        cells.push(P(x, y));
                    }
                }
                finalCells.push(...cells);
            } else {
                let cells = [];
                let edges = r.getEdges().map(e => e.a.minus(e.b).normalize());
                let corners = r.getCorners();
                let nums = [0, 1, 2, 3];
                if (r.width < cellsize) {
                    nums = [0];
                    let x = (corners[0].x + corners[1].x) / 2;
                    let y = (corners[0].y + corners[1].y) / 2;
                    let x2 = (corners[2].x + corners[3].x) / 2;
                    let y2 = (corners[2].y + corners[3].y) / 2;
                    cells.push(P(x, y), P(x2, y2));
                }
                if (r.height < cellsize) {
                    nums = [1];
                    let x = (corners[1].x + corners[2].x) / 2;
                    let y = (corners[1].y + corners[2].y) / 2;
                    let x2 = (corners[3].x + corners[0].x) / 2;
                    let y2 = (corners[3].y + corners[0].y) / 2;
                    cells.push(P(x, y), P(x2, y2));
                }
                for (let i of nums) {
                    let crn1 = corners[i];
                    let crn2 = corners[i - 1] ? corners[i - 1] : corners[corners.length - 1];
                    let d = Geometry.distToPoint(crn1, crn2);
                    let dir = edges[i];
                    let originX = crn1.x / cellsize;
                    let originY = crn1.y / cellsize;
                    let steps = 3;
                    for (let j = 0; j <= Math.ceil(d / cellsize) * steps; j++) {
                        let x = originX + dir.x * j / steps;
                        let y = originY + dir.y * j / steps;
                        cells.push(P(Math.floor(x + 1), Math.floor(y)));
                        cells.push(P(Math.floor(x), Math.floor(y + 1)));
                        cells.push(P(Math.floor(x), Math.floor(y)));
                    }
                }
                finalCells.push(...cells);
            }
        }
        return finalCells;
    }
    static isWall(r) {
        return r.positionStatic || r.rotationStatic || !r.canMoveThisFrame;
    }
    static getFrictionImpulses(a, b, collisionPoint, tangent) {
        let impulseAngularA, impulseLinearA, impulseAngularB, impulseLinearB;
        let frictionA = a.getPointVelocity(collisionPoint).projectOnto(tangent).times(-0.05);//.times(-this.friction * otherFriction * 2);
        let frictionB = b.getPointVelocity(collisionPoint).projectOnto(tangent).times(-0.05);//.times(-this.friction * otherFriction * 2);
        impulseAngularA = new Impulse(frictionA.over(2), collisionPoint);
        impulseLinearA = impulseAngularA;
        impulseAngularB = new Impulse(frictionB.over(2), collisionPoint);
        impulseLinearB = impulseAngularB;
        return { impulseAngularA, impulseLinearA, impulseAngularB, impulseLinearB };
    }
    static getImpulses(a, b, dir, collisionPoint) {
        let impulseA, impulseB;
        
        const m_A = a.__mass;
        const m_B = b.__mass;
        const v_A = a.getPointVelocity(collisionPoint);
        const v_B = b.getPointVelocity(collisionPoint);
        const v_AB = v_B.minus(v_A);
        const n = dir;
        if (v_AB.dot(n) > 0) return { impulseA: null, impulseB: null }; //going away
        const e = Math.max(1 - a.snuzzlement, 1 - b.snuzzlement);
        //v_AB dot n = (v_B - v_A) dot n;
        
        const j_DYNAMIC = v_AB.times(-(1 + e)).dot(n) / (1 / m_A + 1 / m_B);
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
        const I_A = n.times(-j_A).over(m_A);
        const I_B = n.times(j_B).over(m_B);
        
        
        impulseA = new Impulse(I_A, collisionPoint);
        impulseB = new Impulse(I_B, collisionPoint);
        
        if (b.completelyStatic) impulseB = null;
        
        return { impulseA, impulseB };
    }
    
    
    //constraints
    static solveLengthConstraint(a, b, aOffset, bOffset, len) {
        let aM = a.middle;
        let bM = b.middle;
        let pA = Geometry.rotatePointAround(aM, aM.plus(aOffset), a.rotation);
        let pB = Geometry.rotatePointAround(bM, bM.plus(bOffset), b.rotation);
        let dx = pA.x - pB.x;
        let dy = pA.y - pB.y;
        let dist = dx ** 2 + dy ** 2;
        if (dist !== len ** 2 && dist) {
            let act_dist = Math.sqrt(dist);
            let dif = act_dist - len;
            let dx_N = dx / act_dist;
            let dy_N = dy / act_dist;
            let mDif = (!a.completelyStatic && !b.completelyStatic) ? dif / 2 : dif;
            let dx_N0 = -dx_N * mDif;
            let dy_N0 = -dy_N * mDif;
            let dx_N1 = dx_N * mDif;
            let dy_N1 = dy_N * mDif;
            a.privateSetX(a.x + dx_N0);
            a.privateSetY(a.y + dy_N0);
            b.privateSetX(b.x + dx_N1);
            b.privateSetY(b.y + dy_N1);
            a.velocity.x += dx_N0 / 10;
            a.velocity.y += dy_N0 / 10;
            b.velocity.x += dx_N1 / 10;
            b.velocity.y += dy_N1 / 10;
            return dif;
        }
        return 0;
    }
}