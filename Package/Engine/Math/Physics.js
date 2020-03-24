class Collision {
    constructor(collides = false, a = null, b = null, Adir = new Vector2(0, 0), Bdir = new Vector2(0, 0), penetration = 0, collisionPointA, collisionPointB) {
        this.colliding = collides;
        this.Adir = Adir;
        this.Bdir = Bdir;
        this.a = a;
        this.b = b;
        this.penetration = penetration;
        this.collisionPointA = collisionPointA;
        this.collisionPointB = collisionPointB;
    }
}
class CollisionOption {
    constructor(p1, edge, cp, coef) {
        this.p1 = p1;
        this.edge = edge;
        this.p2 = cp;
        this.coef = coef;
        this.dir = this.p2.minus(this.p1).normalize().times(this.coef);
        this.dist = Geometry.distToPoint2(this.p1, this.p2);
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
    constructor(force = new Vector2(0, 0), source = new Vector2(0, 0)) {
        this.force = force;
        this.source = source;
    }
}
class Range {
    constructor(min = Infinity, max = -Infinity) {
        this.min = min;
        this.max = max;
    }
    include(a) {
        if (a < this.min) this.min = a;
        if (a > this.max) this.max = a;
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
        let cps = Geometry.closestPointOnRectangle(p, this.start);
        let cpe = Geometry.closestPointOnRectangle(p, this.end);
    }
}
class Physics {
    static collideCirclePoint(a, b) {
        return new Collision((b.x - a.middle.x) ** 2 + (b.y - a.middle.y) ** 2 < a.radius ** 2, a, b);
    }
    static collideRectPoint(a, b) {
        let nP = Geometry.rotatePointAround(a.centerOfMass, b, -a.rotation);
        let colliding = a.x <= nP.x && a.x + a.width >= nP.x && a.y <= nP.y && a.y + a.height >= nP.y;
        return new Collision(colliding, a, b);
    }
    static collideCircleCircle(a, b) {
        a.home.SAT.boxChecks++;
        a.home.SAT.SATChecks++;
        let colliding = (b.x - a.x) ** 2 + (b.y - a.y) ** 2 < (a.radius + b.radius) ** 2;
        let col;
        if (colliding) {
            a.home.SAT.collisions++;
            let collisionAxis = (new Vector2(b.x - a.x, b.y - a.y)).normalize();
            let penetration = a.radius + b.radius - g.f.getDistance(a, b);
            let aPoint = collisionAxis.times(a.radius).plus(a.middle);
            let bPoint = collisionAxis.times(-b.radius).plus(b.middle);
            let collisionPoint = aPoint.plus(bPoint).over(2);

            //contacts
            a.contactPoints.push(collisionPoint);
            b.contactPoints.push(collisionPoint);


            col = new Collision(true, a, b, collisionAxis, collisionAxis.times(-1), penetration, collisionPoint, collisionPoint);
        } else col = new Collision(false, a, b);
        return col;
    }
    static collideRectCircle(a, b) {
        a.home.SAT.boxChecks++;
        if (!Geometry.overlapRectRect(Physics.getBoundingBox(a), Physics.getBoundingBox(b))) return new Collision(false, a, b);
        a.home.SAT.SATChecks++;
        let bestPoint = Geometry.closestPointOnRectangle(b.middle, a);
        const inside = Physics.collideRectPoint(a, b.middle).colliding;
        let colliding = Geometry.distToPoint2(bestPoint, b.middle) < b.radius ** 2 || inside;

        if (colliding) {
            a.home.SAT.collisions++;
            if (!bestPoint) return new Collision(false, a, b);
            let bestDist = Math.sqrt((bestPoint.x - b.middle.x) ** 2 + (bestPoint.y - b.middle.y) ** 2);
            let penetration = b.radius + (inside ? bestDist : -bestDist);
            //towards b, from collision
            let collisionAxis = new Vector2(b.middle.x - bestPoint.x, b.middle.y - bestPoint.y);
            collisionAxis.normalize();
            if (inside) collisionAxis.mul(-1);


            //contacts
            a.contactPoints.push(bestPoint);
            b.contactPoints.push(bestPoint);

            let col = new Collision(true, a, b, collisionAxis, collisionAxis.times(-1), penetration, bestPoint, bestPoint);
            return col;
        } else return new Collision(false, a, b);
    }
    static collideCircleRect(a, b) {
        a.home.SAT.boxChecks++;
        if (!Geometry.overlapRectRect(Physics.getBoundingBox(a), Physics.getBoundingBox(b))) return new Collision(false, a, b);
        let bestPoint = Geometry.closestPointOnRectangle(a.middle, b);
        const inside = Physics.collideRectPoint(b, a.middle).colliding;
        let colliding = Geometry.distToPoint2(bestPoint, a.middle) < a.radius ** 2 || inside;
        a.home.SAT.SATChecks++;
        //getting resolution data
        let col;
        if (colliding) {
            a.home.SAT.collisions++;
            if (!bestPoint) return new Collision(false, a, b);
            let bestDist = Geometry.distToPoint(bestPoint, a.middle);
            //towards collision, from a
            let collisionAxis = bestPoint.minus(a.middle).normalize();
            let penetration = a.radius + (inside ? bestDist : -bestDist);
            if (inside) collisionAxis.mul(-1);

            //contacts
            a.contactPoints.push(bestPoint);
            b.contactPoints.push(bestPoint);

            col = new Collision(true, a, b, collisionAxis, collisionAxis.times(-1), penetration, bestPoint, bestPoint);
        } else col = new Collision(false, a, b);
        return col;
    }
    static collideRectRect(a, b) {
        a.home.SAT.boxChecks++;
        if (!Geometry.overlapRectRect(Physics.getBoundingBox(a), Physics.getBoundingBox(b))) return new Collision(false, a, b);
        a.home.SAT.SATChecks++;
        let aEdges = a.getAxes();
        let bEdges = b.getAxes();
        let edges = [
            ...aEdges,
            ...bEdges
        ];
        let aCorners = a.getCorners();
        let bCorners = b.getCorners();
        let colliding = true;
        let collisionAxis = null;
        let leastIntersection = Infinity;
        for (let i = 0; i < edges.length; i++) {
            let edge = edges[i];
            let aRange = new Range();
            let bRange = new Range();
            for (let point of aCorners) {
                let projection = Geometry.projectPointOntoLine(point, edge);
                aRange.include(projection);
            }
            for (let point of bCorners) {
                let projection = Geometry.projectPointOntoLine(point, edge);
                bRange.include(projection);
            }
            if (!Range.intersect(aRange, bRange)) {
                colliding = false;
                break;
            }
        }
        let finalPenetratingCornerOwner = null;
        let finalPenetratedEdge = null;
        let finalPenetratingCorner = null;
        if (colliding) {
            const A_C = aCorners;
            const A_EL = a.getLineEdges();
            const A_E = A_EL.map(e => e.b.minus(e.a).normalize());
            const B_C = bCorners;
            const B_EL = b.getLineEdges();
            const B_E = B_EL.map(e => e.b.minus(e.a).normalize());
            let prospect = [];
            let objs = [{
                a: a,
                b: b,
                A_C: A_C,
                A_EL: A_EL,
                A_E: A_E,
                B_C: B_C,
                B_EL: B_EL,
                B_E: B_E,
                coef: 1,
                m: b.middle
            }, {
                a: b,
                b: a,
                A_C: B_C,
                A_EL: B_EL,
                A_E: B_E,
                B_C: A_C,
                B_EL: A_EL,
                B_E: A_E,
                coef: -1,
                m: a.middle
            }];
            for (let me of objs) {
                for (let i = 0; i < me.A_EL.length; i++) {
                    let edge = me.A_EL[i];
                    let v = me.A_E[i];
                    let normal = v.normal;
                    // c.stroke(cl.RED).arrow(edge.midPoint, edge.midPoint.plus(normal.times(20)));
                    let sorted = me.B_C
                        .sort((a, b) => b.dot(normal) - a.dot(normal))
                        .filter((e, i) => i !== me.A_EL.length - 1)
                        .filter(e => Physics.collideRectPoint(me.a, e).colliding)
                        .map(e => [e, Geometry.closestPointOnLineObject(e, edge)])
                        .filter(e => {
                            let dir = e[1].minus(e[0]);
                            let dir2 = me.m.minus(e[0]);
                            // c.stroke(cl.PURPLE, 1).arrow(e[0], e[0].plus(dir));
                            // c.stroke(cl.PURPLE, 1).arrow(e[0], e[0].plus(dir2));
                            return dir.dot(dir2) > 0;
                        });

                    for (let sort of sorted) {
                        let p = sort;
                        let cp = p[1];
                        prospect.push(new CollisionOption(p[0], edge, cp, me.coef));
                    }
                }
            }
            let groups = [];
            let found = [];
            for (let el of prospect) {
                let index = found.indexOf(el.p1);
                if (index === -1) {
                    found.push(el.p1);
                    groups.push([el]);
                } else {
                    groups[index].push(el);
                }
            }
            groups = groups
                .map(e => {
                    let smallest = e.sort((a, b) => a.dist - b.dist)[0];
                    // for (let el of e) {
                    //     c.stroke(cl.RED, 2).arrow(el.p1, el.p2);
                    // }
                    return [smallest, ...e];
                })
                .sort(function(a, b) {
                    return b[0].dist - a[0].dist;
                });
            if (groups.length && groups[0].length) {
                let final = groups[0][0];
                let finalP = final.p1;
                let finalDir = final.dir;
                // c.stroke(cl.RED).circle(finalP.x, finalP.y, 5);
                // c.stroke(cl.RED).arrow(finalP, final.p2);
                // c.stroke(cl.GREEN).arrow(finalP, final.p1.plus(finalDir.times(20)));
                leastIntersection = Math.sqrt(final.dist);
                collisionAxis = finalDir;
                finalPenetratingCornerOwner = (final.coef > 0) ? b : a;
                finalPenetratedEdge = final.edge;
                finalPenetratingCorner = final.p1;
                // c.draw(cl.ORANGE).circle(finalPenetratingCornerOwner.x, finalPenetratingCornerOwner.y, 5);
            } else colliding = false;
        }

        let col;
        if (colliding) {
            if (collisionAxis) {
                collisionAxis.normalize();
                //figure out impulses
                let corners = (finalPenetratingCornerOwner === a) ? aCorners : bCorners;
                let otherCorners = (finalPenetratingCornerOwner === a) ? bCorners : aCorners;
                otherCorners.push(finalPenetratingCorner);
                let ownerDir = (finalPenetratingCornerOwner === a) ? collisionAxis : collisionAxis.times(-1);
                let collisionPointOwner = Physics.getCollisionPoint(a, b, corners, finalPenetratedEdge, ownerDir);
                let collisionPointNotOwner = finalPenetratingCorner;//Physics.getCollisionPoint(b, a, [finalPenetratingCorner, otherCorners], finalPenetratedEdge, ownerDir.times(-1));
                let pointA, pointB;
                if (finalPenetratingCornerOwner === a) {
                    pointA = collisionPointOwner;
                    pointB = collisionPointNotOwner;
                } else {
                    pointB = collisionPointOwner;
                    pointA = collisionPointNotOwner;
                }
                // c.draw(cl.RED).circle(finalPenetratingCorner.x, finalPenetratingCorner.y, 5);

                col = new Collision(true, a, b, collisionAxis, collisionAxis.times(-1), leastIntersection, pointA, pointB);
            } else {
                col = new Collision(false, a, b);
                a.rotation += 0.00001;
                b.rotation += 0.00001;
            }
        } else col = new Collision(false, a, b);
        return col;
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
            let aCircle = (a instanceof CirclePhysicsObject) ? "Circle" : "Rect";
            let bCircle = (b instanceof CirclePhysicsObject) ? "Circle" : "Rect";
            tomMath = col//Physics["collide" + aCircle + bCircle](a, b);
            if (tomMath.colliding) {
                col = tomMath;
                let dir = col.Adir.times(col.penetration);
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

        
        const d = col.Bdir;

        //collision points

        let collisionPointA = col.collisionPointA;
        let collisionPointB = col.collisionPointB;

        //velocity
        const A_VEL_AT_COLLISION = a.velocity.dot(col.Adir);
        const B_VEL_AT_COLLISION = b.velocity.dot(col.Bdir);
        if (A_VEL_AT_COLLISION < 0 && B_VEL_AT_COLLISION < 0) return;

        //friction
        const normal = d.normal.normalize();
        a.applyFriction(normal, collisionPointA, b.friction);
        

        //impulse resolution
        let impulses = Physics.getImpulses(a, b, col.Adir, col.Bdir, collisionPointA, collisionPointB);
        let iA = impulses.impulseA;
        let iB = impulses.impulseB;
        a.applyImpulse(iA);
        b.applyImpulse(iB);

        //immobilize
        a.canMoveThisFrame = false;
        if (b.positionStatic) {
            a.prohibited.push(col.Adir);
        }
        for (let pro of b.prohibited) {
            let proj = pro.projectOnto(col.Adir);
            if (proj.dot(col.Adir) > 0) {
                a.prohibited.push(proj);
            }
        }
        if (a.positionStatic) {
            b.prohibited.push(col.Bdir);
        }
        for (let pro of a.prohibited) {
            let proj = pro.projectOnto(col.Bdir);
            if (proj.dot(col.Bdir) > 0) {
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
        Physics.runEventListeners(a);
        Physics.runEventListeners(b);
    }
    static runEventListeners(a) {
        const gNow = str => a.colliding[str] ? a.colliding[str] : [];
        const gLast = str => a.lastColliding[str] ? a.lastColliding[str] : [];

        function runEvents(name) {
            let now = gNow(name);
            let last = gLast(name);
            for (let el of now) if (!last.includes(el)) {
                a.response.collide[name](el);
                a["scriptCollide" + name.capitalize()](el);
            }
        }

        for (let dir of ["general", "top", "bottom", "left", "right"]) {
            runEvents(dir);
            a.lastColliding[dir] = gNow(dir).length ? gNow(dir) : null;
        }
    }
    static getCollisionPoint(a, b, corners, edge, dir) {
        let result3D = []; //<x, y, d>
        for (let corner of corners) {
            let closest = Geometry.closestPointOnLineObject(corner, edge);
            let dirToCorner = closest.minus(corner);
            let dot = dirToCorner.dot(dir);
            let valid = dot < CLIPPING_THRESHOLD;
            if (valid) {
                let weight = Math.max(-(dot - CLIPPING_THRESHOLD), 0);
                result3D.push(new Vector3(corner.x, corner.y, weight));
            }
        }
        let average = new Vector2(0, 0);
        let result2D = result3D.map(v3 => {
            return new Vector2(v3.x * v3.z, v3.y * v3.z);
        }); // <x, y>
        let sumDist = 0;
        for (let v3 of result3D) sumDist += v3.z;
        let contacts = result3D.map(v3 => new Vector2(v3.x, v3.y));

        //contacts
        a.contactPoints.push(...contacts);
        b.contactPoints.push(...contacts);

        average = (new Vector2(0, 0)).plus(...result2D).over(sumDist);
        return average;
    }
    static getBoundingBox(r) {
        let rect;
        if (r.radius) {
            rect = new Rect(r.middle.x - r.radius, r.middle.y - r.radius, r.radius * 2, r.radius * 2);
        } else {
            let hypot = Math.sqrt((r.width / 2) ** 2 + (r.height / 2) ** 2);
            rect = new Rect(r.middle.x - hypot, r.middle.y - hypot, hypot * 2, hypot * 2);
        }
        return rect;
    }
    static getCells(r, cellsize) {
        let bound = Physics.getBoundingBox(r);
        if (r.radius || (bound.width * bound.height) / (cellsize ** 2) < 30) {
            let cells = [];
            for (let i = 0; i <= Math.ceil(bound.width / cellsize); i++) {
                for (let j = 0; j <= Math.ceil(bound.height / cellsize); j++) {
                    let x = i + Math.floor(bound.x / cellsize);
                    let y = j + Math.floor(bound.y / cellsize);
                    cells.push(P(x, y));
                }
            }
            return cells;
        } else {
            let cells = [];
            let edges = r.getLineEdges().map(e => e.a.minus(e.b).normalize());
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
            return cells;
        }
    }
    static isWall(r) {
        return r.positionStatic || r.rotationStatic || !r.canMoveThisFrame;
    }
    static getImpulses(a, b, dirFromA, dirFromB, collisionPointA, collisionPointB) {
        let impulseA, impulseB;

        const cC_A = collisionPointA; //Point of Collision for A
        const cC_B = collisionPointB; //Point of Collision for B
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
        const d_A = dirFromA.get(); //Direction A escapes the collision
        const d_B = s_B ? d_A.times(-1) : dirFromB.get(); //Direction B escapes the collision
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