class Collision {
    constructor(collides = false, a = null, b = null, Adir = new Vector2(0, 0), Bdir = new Vector2(0, 0), penetration = 0, collisionPoint) {
        this.colliding = collides;
        this.Adir = Adir;
        this.Bdir = Bdir;
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
        let r1 = Physics.getBoundingBox(a);
        if (!(r1.x < b.x && b.x < r1.x + r1.width && r1.y < b.y && b.y < r1.y + r1.height)) return false;
        let aEdges = a.getEdges();
        let edges = aEdges;
        let aCorners = a.getCorners();
        let colliding = true;
        for (let i = 0; i < edges.length; i++) {
            let edge = edges[i];
            let aRange = new Range();
            for (let point of aCorners) {
                let projection = Geometry.projectPointOntoLine(point, edge);
                aRange.include(projection);
            }
            let projection = Geometry.projectPointOntoLine(b, edge);
            if (projection < aRange.min || projection > aRange.max) {
                colliding = false;
                break;
            }
        }
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


            col = new Collision(true, a, b, collisionAxis, collisionAxis.times(-1), penetration, collisionPoint);
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

            let col = new Collision(true, a, b, collisionAxis, collisionAxis.times(-1), penetration, bestPoint);
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

            col = new Collision(true, a, b, collisionAxis, collisionAxis.times(-1), penetration, bestPoint);
        } else col = new Collision(false, a, b);
        return col;
    }
    static collideRectRect(a, b) {
        a.home.SAT.boxChecks++;
        if (!Geometry.overlapRectRect(Physics.getBoundingBox(a), Physics.getBoundingBox(b))) return new Collision(false, a, b);
        a.home.SAT.SATChecks++;
        let aEdges = a.getEdges();
        let bEdges = b.getEdges();
        let edges = [
            aEdges[0], aEdges[1],
            bEdges[0], bEdges[1]
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
        if (colliding) {
            a.home.SAT.collisions++;
            for (let i = 0; i < bEdges.length; i++) {
                let edge = bEdges[i - 1];
                if (!i) edge = bEdges[bEdges.length - 1];
                let normal = Vector2.fromAngle(edge.getAngle() + Math.PI / 2);
                let far = Geometry.farthestInDirection(aCorners, normal);
                let penetratingCorner = far.corner;
                let edgeStart = bCorners[i];
                let edgeEnd = bCorners[i + 1];
                if (!edgeEnd) edgeEnd = bCorners[0];
                let closestPointOnEdge = Geometry.closestPointOnLineObject(penetratingCorner, new Line(edgeStart, edgeEnd));
                let overlap = a.home.home.f.getDistance(penetratingCorner, closestPointOnEdge);
                let axis = closestPointOnEdge.minus(penetratingCorner).normalize();
                if (overlap < leastIntersection) {
                    leastIntersection = overlap;
                    collisionAxis = axis;
                    finalPenetratedEdge = new Line(edgeStart, edgeEnd);
                    finalPenetratingCornerOwner = a;
                }
            }
            for (let i = 0; i < aEdges.length; i++) {
                let edge = i ? aEdges[i - 1] : aEdges[aEdges.length - 1];
                let normal = Vector2.fromAngle(edge.getAngle() + Math.PI / 2);
                let far = Geometry.farthestInDirection(bCorners, normal);
                let penetratingCorner = far.corner;
                let edgeStart = aCorners[i];
                let edgeEnd = (i !== aEdges.length - 1) ? aCorners[i + 1] : aCorners[0];
                let closestPointOnEdge = Geometry.closestPointOnLineObject(penetratingCorner, new Line(edgeStart, edgeEnd));
                let overlap = a.home.home.f.getDistance(penetratingCorner, closestPointOnEdge);
                [closestPointOnEdge, penetratingCorner] = [penetratingCorner, closestPointOnEdge];
                let axis = closestPointOnEdge.minus(penetratingCorner);
                if (overlap < leastIntersection) {
                    leastIntersection = overlap;
                    collisionAxis = axis;
                    finalPenetratedEdge = new Line(edgeStart, edgeEnd);
                    finalPenetratingCornerOwner = b;
                }
            }
        }
        let col;
        if (colliding) {
            if (collisionAxis) {
                collisionAxis.normalize();
                //figure out impulses
                let corners = finalPenetratingCornerOwner.getCorners();
                let ownerDir = (finalPenetratingCornerOwner === a) ? collisionAxis.times(-1) : collisionAxis;
                let collisionPoint = Physics.getCollisionPoint(a, b, corners, finalPenetratedEdge, ownerDir);

                col = new Collision(true, a, b, collisionAxis.times(-1), collisionAxis, leastIntersection, collisionPoint);
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
        const d = col.Bdir;
        let collisionPoint = col.collisionPoint;
        let mobileA = !Physics.isWall(a);
        let mobileB = !Physics.isWall(b);

        //position
        let dir = col.Adir.times(col.penetration);
        if (col.penetration > 0.005) {
            let tomMath;
            let aCircle = (a instanceof CirclePhysicsObject)? "Circle":"Rect";
            let bCircle = (b instanceof CirclePhysicsObject)? "Circle":"Rect";
            tomMath = Physics["collide" + aCircle + bCircle](a, b);
            //mass percents
            let aPer = 1 - a.mass / (a.mass + b.mass);
            if (!mobileB) aPer = 1;
            let bPer = 1 - aPer;

            //escape dirs
            let aMove = dir.times(aPer);
            let bMove = dir.times(-bPer);

            //like, the escaping
            a.privateSetX(a.x - aMove.x);
            a.privateSetY(a.y - aMove.y);
            b.privateSetX(b.x - bMove.x);
            b.privateSetY(b.y - bMove.y);
        }
        // c.stroke(cl.RED, 2).arrow(a.centerOfMass, b.centerOfMass);

        //velocity
        const A_VEL_AT_COLLISION = a.velocity.dot(col.Adir);
        const B_VEL_AT_COLLISION = b.velocity.dot(col.Bdir);
        if (A_VEL_AT_COLLISION < 0 && B_VEL_AT_COLLISION < 0) return;

        //friction
        a.applyFriction(d.normal.normalize(), collisionPoint, b.friction);

        //impulse resolution
        let impulses = Physics.getImpulses(a, b, col.Adir, col.Bdir, collisionPoint, col.penetration);
        let iA = impulses.impulseA;
        let iB = impulses.impulseB;
        a.applyImpulse(iA);
        b.applyImpulse(iB);

        //immobilize
        a.canMoveThisFrame = false;

        //do custom collision response
        if (!a.colliding.general) a.colliding.general = [b];
        else a.colliding.general.push(b);
        if (!b.colliding.general) b.colliding.general = [a];
        else b.colliding.general.push(a);
        a.scriptCollideGeneral(b);
        b.scriptCollideGeneral(a);
        let top = d.y > 0.2;
        let bottom = d.y < -0.2;
        let right = d.x < -0.2;
        let left = d.x > 0.2;
        if (left) {
            if (!a.colliding.left) a.colliding.left = [b];
            else a.colliding.left.push(b);
            a.scriptCollideLeft(b);
            a.response.collide.left(b);
            if (!b.colliding.right) b.colliding.right = [a];
            else b.colliding.right.push(a);
            b.scriptCollideRight(a);
            b.response.collide.right(a);
        }
        if (right) {
            if (!a.colliding.right) a.colliding.right = [b];
            else a.colliding.right.push(b);
            a.scriptCollideRight(b);
            a.response.collide.right(b);
            if (!b.colliding.left) b.colliding.left = [a];
            else b.colliding.left.push(a);
            b.scriptCollideLeft(a);
            b.response.collide.left(a);
        }
        if (top) {
            if (!a.colliding.top) a.colliding.top = [b];
            else a.colliding.top.push(b);
            a.scriptCollideTop(b);
            a.response.collide.top(b);
            if (!b.colliding.bottom) b.colliding.top = [a];
            else b.colliding.bottom.push(a);
            b.scriptCollideBottom(a);
            b.response.collide.bottom(a);
        }
        if (bottom) {
            if (!a.colliding.bottom) a.colliding.bottom = [b];
            else a.colliding.bottom.push(b);
            a.scriptCollideBottom(b);
            a.response.collide.bottom(b);
            if (!b.colliding.top) b.colliding.top = [a];
            else b.colliding.top.push(a);
            b.scriptCollideTop(a);
            b.response.collide.top(a);
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
            let edges = r.getEdges();
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
    static getImpulses(a, b, dirFromA, dirFromB, collisionPoint) {
        let impulseA, impulseB;
        let source = collisionPoint;

        //mass percents
        let aPercentMass = a.mass / (a.mass + b.mass);
        let bPercentMass = 1 - aPercentMass;

        //for impulse A
        let forceFromB = clamp(dirFromB.dot(b.velocity), 0, Infinity);
        //for impulse B
        let forceFromA = clamp(dirFromA.dot(a.velocity), 0, Infinity);

        //walls
        if (b.positionStatic) {
            if (a instanceof CirclePhysicsObject) {
                dirFromB = dirFromA.times(-1);
                forceFromB = forceFromA * (1 - a.snuzzlement);
            } else {
                forceFromB = 0;
                aPercentMass = 0.5;
                bPercentMass = 0.5;
            }
        }

        //like, the actual impulse stuff, DUH!
        let rotationB = Geometry.rotatePointAround(b.centerOfMass, collisionPoint, b.angularVelocity).minus(collisionPoint);
        let rotationA = Geometry.rotatePointAround(b.centerOfMass, collisionPoint, b.angularVelocity).minus(collisionPoint);
        impulseA = new Impulse(rotationB.plus(dirFromB.times(forceFromB)), source);
        impulseB = new Impulse(rotationA.plus(dirFromA.times(forceFromA)), source);
        let forceA = impulseA.force.minus(impulseB.force).times(bPercentMass);
        let forceB = impulseB.force.minus(impulseA.force).times(aPercentMass);
        impulseA.force = forceA;
        impulseB.force = forceB;

        if (b.completelyStatic) impulseB = null;
        return { impulseA, impulseB };
    }
}