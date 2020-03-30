class Collision {
    constructor(collides = false, a = null, b = null, dir, penetration, collisionPoint) {
        this.colliding = collides;
        this.dir = dir;
        this.a = a;
        this.b = b;
        this.penetration = penetration;
        this.collisionPoint = collisionPoint;
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
class Link {
    constructor(start, end, fer) {
        this.start = start;
        this.end = end;
        this.ferocity = fer;
    }
    fix() {
        let l = new Line(this.start.middle, this.end.middle);
        let d = g.f.getDistance(l.a, l.b);
        d = clamp(d / 10, 0, 20);
        d *= this.ferocity;
        let dir = new Vector2(this.end.middle.x - this.start.middle.x, this.end.middle.y - this.start.middle.y);
        dir.normalize();
        let p = l.midPoint;
        let cps = Geometry.closestPointOnPolygon(p, this.start);
        let cpe = Geometry.closestPointOnPolygon(p, this.end);
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
        if (!Geometry.overlapRectRect(a.getBoundingBox(), b.getBoundingBox())) return new Collision(false, a, b);
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
        if (!Geometry.overlapRectRect(a.getBoundingBox(), b.getBoundingBox())) return new Collision(false, a, b);
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
        if (a.home) s.SAT.boxChecks++;
        if (!Geometry.overlapRectRect(a.getBoundingBox(), b.getBoundingBox())) return new Collision(false, a, b);

        if (a.home) s.SAT.SATChecks++;
        let aEdges = a.getAxes();
        let bEdges = b.getAxes();
        let edges = [
            aEdges,
            bEdges
        ];
        let aCorners = a.getCorners();
        let bCorners = b.getCorners();
        // for (let corner of [...aCorners, ...bCorners]) {
        //     c.draw(cl.RED).circle(corner.x, corner.y, 3);
        // }
        // let le = a.getEdges();
        // for (let i = 0; i < le.length; i++) {
        //     c.stroke(cl.LIME, 2).line(le[i]);
        //     let normal = aEdges[(i - 1 + 4) % 4];
        //     if (normal) c.stroke(cl.ORANGE, 1).arrow(le[i].midPoint, le[i].midPoint.plus(normal.times(20)));
        // }
        let colliding = true;
        let collisionAxis = null;
        let collisionPoint = null;
        let leastIntersection = Infinity;
        let pairs = [];
        for (let i = 0; i < edges.length; i++) for (let edge of edges[i]) {
            let aRange = new Range();
            let bRange = new Range();
            if (!(edge.x + edge.y)) continue;
            for (let point of aCorners) {
                let projection = point.dot(edge);
                aRange.include(projection);
            }
            for (let point of bCorners) {
                let projection = point.dot(edge);
                bRange.include(projection);
            }
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
            collisionAxis = edge.times(-Math.sign(intersect));
            if (collisionAxis) {
                let aPC = [];
                let bPC = [];
                let aPC2 = [];
                let bPC2 = [];
                let aTP = 0;
                let bTP = 0;
                aRange.extend(CLIPPING_THRESHOLD);
                bRange.extend(CLIPPING_THRESHOLD);
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

                if (collisionPointA && !collisionPointB) collisionPoint = collisionPointA;
                else if (!collisionPointA && collisionPointB) collisionPoint = collisionPointB;
                else {
                    let sumDistA = 0;
                    let sumDistB = 0;
                    for (let corner of aPC2) sumDistA += Geometry.distToPoint2(corner, collisionPointA);
                    for (let corner of bPC2) sumDistB += Geometry.distToPoint2(corner, collisionPointB);
                    collisionPoint = (sumDistA < sumDistB) ? collisionPointA : collisionPointB;
                }
                // for (let corner of aPC2) c.draw(cl.ORANGE).circle(corner.x, corner.y, 3);
                // for (let corner of bPC2) c.draw(cl.PURPLE).circle(corner.x, corner.y, 3);
                // c.draw(cl.BLUE).circle(collisionPoint.x, collisionPoint.y, 2);

                // c.stroke(cl.GREEN, 2).arrow(a.centerOfMass, a.centerOfMass.plus(collisionAxis.times(leastIntersection)));
                col = new Collision(true, a, b, collisionAxis, leastIntersection, collisionPoint);
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
        return cols.map(e => {
            let n = e;
            n.a = a;
            n.b = b;
            return n;
        });
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
                let aPer = 1 - a.mass / (a.mass + b.mass);
                if (!mobileB) aPer = 1;
                let bPer = 1 - aPer;

                //escape dirs
                let aMove = dir.times(1 * aPer);
                let bMove = dir.times(-1 * bPer);


                //like, the escaping
                a.privateSetX(a.x - aMove.x);
                a.privateSetY(a.y - aMove.y);
                b.privateSetX(b.x - bMove.x);
                b.privateSetY(b.y - bMove.y);

            } else return;
        } else return;


        const d = col.dir.times(-1);

        //velocity
        const A_VEL_AT_COLLISION = a.velocity.dot(col.dir);
        const B_VEL_AT_COLLISION = b.velocity.dot(col.dir.times(-1));
        if (A_VEL_AT_COLLISION < 0 && B_VEL_AT_COLLISION < 0) return;

        //friction
        const normal = d.normal.normalize();
        a.applyFriction(normal, col.collisionPoint, b.friction);
        b.applyFriction(normal, col.collisionPoint, a.friction);


        //impulse resolution
        let impulses = Physics.getImpulses(a, b, col.dir, col.collisionPoint);
        let iA = impulses.impulseA;
        let iB = impulses.impulseB;
        a.applyImpulse(iA);
        b.applyImpulse(iB);

        //immobilize
        a.canMoveThisFrame = false;
        if (b.positionStatic) {
            a.prohibited.push(col.dir);
        }
        for (let pro of b.prohibited) {
            let proj = pro.projectOnto(col.dir);
            if (proj.dot(col.dir) > 0) {
                a.prohibited.push(proj);
            }
        }
        if (a.positionStatic) {
            b.prohibited.push(col.dir.times(-1));
        }
        for (let pro of a.prohibited) {
            let proj = pro.projectOnto(col.dir.times(-1));
            if (proj.dot(col.dir.times(-1)) > 0) {
                b.prohibited.push(proj);
            }
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
    }
    static runEventListeners(a) {
        function runEvents(name) {
            let now = a.colliding[name];
            let last = a.lastColliding[name];
            if (now) for (let el of now) if (!last || !last.includes(el)) {
                a.response.collide[name](el);
                a["scriptCollide" + name.capitalize()](el);
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
    static getImpulses(a, b, dir, collisionPoint) {
        let impulseA, impulseB;

        const cC_A = collisionPoint; //Point of Collision for A
        const cC_B = collisionPoint; //Point of Collision for B
        const sn_A = a.snuzzlement; //Velocity lost by A
        const sn_B = b.snuzzlement; //Velocity lost by B
        const s_A = a.positionStatic; //Is A static
        const s_B = b.positionStatic; //Is B static
        const com_A = a.centerOfMass; //A's Center of Mass
        const com_B = b.centerOfMass; //B's Center of Mass
        const m_A = a.mass; //Mass of A
        const m_B = s_B ? m_A : b.mass; //Mass of B
        const mi_A = 1 / m_A; //Inverse mass of A
        const mi_B = 1 / m_B; //Inverse mass of B
        const d_A = dir.get(); //Direction A escapes the collision
        const d_B = s_B ? d_A.times(-1) : dir.times(-1); //Direction B escapes the collision
        const vl_A = a.velocity.get(); //A's Linear Velocity
        const vl_B = b.velocity.get(); //B's Linear Velocity
        const v_A = vl_A; //A's Velocity
        const v_B = vl_B; //B's Velocity
        const vc_A = Math.max(d_A.dot(v_A), 0); //A's velocity towards collision (scalar)
        const vc_B = Math.max(s_B ? vc_A * (1 - sn_A) : d_B.dot(v_B), 0); //B's velocity towards collision (scalar)
        const P_A = (v) => Vector.prohibitDirections(a.prohibited, v); //Takes a vector, returns whether A can move that direction
        const P_B = (v) => Vector.prohibitDirections(b.prohibited, v); //Takes a vector, returns whether B can move that direction
        const F_A = d_A.times(vc_A); //Force applied by A in the direction of the collision
        const F_B = d_B.times(vc_B); //Force applied by B in the direction of the collision
        const mr_A = Math.min(1, m_B * mi_A); //Ratio used for calculating how much force should be applied
        const mr_B = Math.min(1, m_A * mi_B); //Ratio used for calculating how much force should be applied
        const app_A = F_A; //Actual applied force from A
        const app_B = F_B; //Actual applied force from B
        const Phb_A = app_B.minus(P_A(app_B)); //Force from B that A cannot accept
        const Phb_B = app_A.minus(P_B(app_A)); //Force from A that B cannot accept
        const u_A = d_A.compare(F_A, Phb_B.over(mr_A)); //Which undoing force is greater
        const u_B = d_B.compare(F_B, Phb_A.over(mr_B)); //Which undoing force is greater
        const I_A = P_A(F_B.minus(u_A).times(mr_A)); //Impulse applied to A
        const I_B = P_B(F_A.minus(u_B).times(mr_B)); //Impulse applied to B

        impulseA = new Impulse(I_A, cC_A);
        impulseB = new Impulse(I_B, cC_B);
        const awayBoth = vc_A < 0 && vc_B < 0;
        const awayA = -vc_A > vc_B;
        const awayB = -vc_B > vc_A;
        if (awayBoth || awayA || awayB) {
            impulseA = null;
            impulseB = null;
        }
        if (I_B.dot(d_B) > 0) impulseB = null;
        if (I_A.dot(d_A) > 0) impulseA = null;

        if (b.completelyStatic) impulseB = null;
        return { impulseA, impulseB };
    }
}