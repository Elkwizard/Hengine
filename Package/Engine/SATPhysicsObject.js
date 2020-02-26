const LINEAR_LOSS = .985;
const ANGULAR_LOSS = .995;
class PhysicsObject extends SceneObject {
    constructor(name, x, y, width, height, gravity, controls, tag, home) {
        super(name, x, y, width, height, controls, tag, home);
        this.velocity = new Vector2(0, 0);
        this.acceleration = new Vector2(0, 0);
        this._rotation = 0.0001;
        this.angularVelocity = 0;
        this.angularAcceleration = 0;
        this.applyGravity = gravity;
        this.slows = gravity;
        this.home.hasRotatedRectangles = true;
        this.links = [];
        this.colliding = {
            top: null,
            bottom: null,
            left: null,
            right: null,
            general: null
        };
        this.response.collide = {
            general: function () { },
            top: function () { },
            bottom: function () { },
            left: function () { },
            right: function () { }
        }
        this.canCollide = true;
        for (let x in this.response.collide) {
            let cap = x[0].toUpperCase() + x.slice(1);
            this["scriptCollide" + cap] = function (e) {
                for (let m of this.scripts) {
                    m["scriptCollide" + cap](e);
                }
            }
        }
        this.allCollidingWith = {
            includes: function (name) {
                for (let x in this) {
                    if (typeof this[x] !== "function" && this[x] === name) return this[x];
                }
                return false;
            },
            includesTag: function (tag) {
                for (let x in this) {
                    if (typeof this[x] !== "function" && this[x].tag === tag) return this[x];
                };
                return false;
            },
            clear: function () {
                for (let x in this) {
                    if (typeof this[x] !== "function") {
                        delete this[x];
                    }
                }
            }
        };
        this.direction = new Vector2(0, 0);
        this.lastX = this.x;
        this.lastY = this.y;
        this.hasPhysics = true;
        this.collideBasedOnRule = e => true;
        this.optimize = (a, b) => true;
        this.canMoveThisFrame = true;
        this.optimalRotation = (this.width > this.height) ? Math.PI / 2 : (this.height > this.width) ? 0 : null;
        this.snuzzlement = 1;
        this.linearDragForce = LINEAR_LOSS;
        this.angularDragForce = ANGULAR_LOSS;
        this.density = 0.1;
        this.positionStatic = !gravity;
        this.rotationStatic = !gravity;
        this._gravity = null;
        this._mass = null;
    }
    get gravity() {
        if (this._gravity === null) return this.home.gravity;
        else return this._gravity;
    }
    set gravity(a) {
        this._gravity = a;
    }
    set mass(a) {
        this._mass = a;
    }
    get mass() {
        if (this._mass !== null) return this._mass;
        let apparentMass = (this.radius === undefined) ? (this.width * this.height) : (Math.PI * this.radius * this.radius);
        return apparentMass * this.density;
    }
    set speed(a) {
        this.velocity = a;
    }
    get speed() {
        return this.velocity;
    }
    set accel(a) {
        this.acceleration = a;
    }
    get accel() {
        return this.acceleration;
    }
    set applyGravity(a) {
        this._applyGravity = a;
        this.slows = a;
    }
    get applyGravity() {
        return this._applyGravity;
    }
    set completelyStatic(a) {
        this.positionStatic = a;
        this.rotationStatic = a;
    }
    get completelyStatic() {
        return this.positionStatic && this.rotationStatic;
    }
    linkTo(el, fer = 1) {
        this.links.push(new Link(this, el, fer));
    }
    stop() {
        this.velocity = new Vector2(0, 0);
        this.acceleration = new Vector2(0, 0);
        this.angularVelocity = 0;
        this.angularAcceleration = 0;
    }
    static getRotationDifference(r, rotation) {
        let p2 = Math.PI / 2;
        let a = rotation;
        let possibleDirections = [a, a + p2, a + p2 * 2, a + p2 * 3];
        let dif = Infinity;
        for (let dir of possibleDirections) {
            let d = Math.abs(dir - r.rotation);
            let d2 = Math.abs(dir - r.rotation - Math.PI * 2);
            if (d < dif) dif = d;
            if (d2 < dif) dif = d2;
        }
        return dif;
    }
    align(angle, f, aerodynamic, par = "rotation") {
        let reversed = 1;
        let a = angle + this.optimalRotation ? this.optimalRotation : 0;
        let p2 = Math.PI / 2;
        let possibleDirections = [a, a + Math.PI];
        if (this.optimalRotation == null || !aerodynamic) {
            a = angle;
            possibleDirections = [a, a + p2, a + p2 * 2, a + p2 * 3];
        }
        let best = null;
        let dif = Infinity;
        for (let dir of possibleDirections) {
            let d = Math.abs(dir - this.rotation);
            let d2 = Math.abs(dir - this.rotation - Math.PI * 2);
            if (d < dif) {
                dif = d;
                best = dir;
                reversed = 1;
            }
            if (d2 < dif) {
                dif = d2;
                best = dir;
                reversed = -1;
            }
        }
        f *= reversed;
        let a1 = this.rotation;
        let a2 = this.rotation + Math.PI * 2;
        let d1 = Math.abs(best - a1);
        let d2 = Math.abs(best - a2);
        let actA = a1;
        if (d2 < d1) actA = a2;
        let difference = best - actA;
        if (d2 < d1) difference *= -1;
        let val = 0.3 * f * Math.sign(difference);
        if (!val) val = 0;
        this[par] += val;
    }
    clearCollisions() {
        for (let [key, value] of this.colliding) this.colliding[key] = null;
        this.canMoveThisFrame = true;
        this.allCollidingWith.clear();
    }
    drawWithoutRotation(artist) {
        let com = this.centerOfMass;
        c.translate(com);
        c.rotate(-this.rotation);
        c.translate(com.times(-1));
        artist();
        c.translate(com);
        c.rotate(this.rotation);
        c.translate(com.times(-1));
    }
    engineDrawUpdate() {
        let r = PhysicsObject.getBoundingBox(this);
        // c.draw(new Color(255, 0, 0,0.2)).rect(s.adjustedDisplay);
        if (!this.hidden && (!this.cullGraphics || Geometry.overlapRectRect(r, s.adjustedDisplay))) {
            let com = this.centerOfMass;
            let mcx = com.x;
            let mcy = com.y;
            let r = this.rotation;
            c.translate(mcx, mcy);
            c.rotate(r);
            c.translate(-mcx, -mcy);
            this.draw();
            this.scriptDraw();
            c.translate(mcx, mcy);
            c.rotate(-r);
            // c.stroke(cl.RED, 2).arrow(P(0, 0), this.velocity.times(10));
            // c.stroke(cl.LIME, 2).arrow(P(0, 0), this.acceleration.times(10));
            // c.draw(cl.WHITE).text("15px monospace", "MASS: " + Math.floor(this.mass / 1000) + "kg, " + (this.mass % 1000) + "g", 0, 0);
            c.translate(-mcx, -mcy);
        }
    }
    enginePhysicsUpdate(others) {
        this.physicsUpdate(others);
        this.scriptUpdate();
        this.update();
    }
    slowDown() {
        //apply linear drag;
        let drag = this.velocity.get().mul(-(1 - this.linearDragForce));
        this.applyImpulse(new Impulse(drag, this.centerOfMass));
    }
    capSpeed() {
        let m = Math.min(this.width, this.height) / 2;
        if (this.velocity.mag > m) this.velocity.mag = m;
    }
    privateSetX(x) {
        if (!this.positionStatic) {
            this.x = x;
        }
    }
    privateSetY(y) {
        if (!this.positionStatic) {
            this.y = y;
        }
    }
    privateSetRotation(a) {
        if (!this.rotationStatic) {
            this.rotation = a;
        }
    }
    detectCollisions(others, f = () => { ; }) {
        let collisions = [];
        if (!this.completelyStatic) {
            for (let other of others) {
                if (other !== this) {
                    if (other.hasPhysics && other.tag !== "Engine-Particle") {
                        if (this.optimize(this, other)) {
                            if (this.collideBasedOnRule(other) && other.collideBasedOnRule(this)) {
                                let col;
                                let thisCircle = this instanceof CirclePhysicsObject;
                                let otherCircle = other instanceof CirclePhysicsObject;
                                if (thisCircle) {
                                    if (otherCircle) {
                                        col = PhysicsObject.collideCircleCircle(this, other);
                                    } else {
                                        col = PhysicsObject.collideCircleRect(this, other);
                                    }
                                } else {
                                    if (otherCircle) {
                                        col = PhysicsObject.collideRectCircle(this, other);
                                    } else {
                                        col = PhysicsObject.collideRectRect(this, other);
                                    }
                                }
                                if (col.colliding) {
                                    this.allCollidingWith["Rect - " + other.name] = other;
                                    other.allCollidingWith["Rect - " + this.name] = this;
                                    if (this.canCollide && other.canCollide) {
                                        collisions.push(col);
                                        f(col);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return collisions;
    }
    checkAndResolveCollisions(others) {
        let collisions = this.detectCollisions(others);
        if (!this.completelyStatic) {
            for (let collision of collisions) {
                if (collision.colliding) PhysicsObject.resolve(collision);
            }
        }
    }
    physicsUpdate(others) {
        s.drawInWorldSpace(e => {
            //slow
            if (this.slows) this.slowDown();
            if (this.applyGravity && !this.positionStatic) {
                //links
                for (let link of this.links) link.fix();

                //gravity
                let gv = this.gravity;
                let gravitationalForce = gv;
                let gravity = new Impulse(gravitationalForce, this.centerOfMass);
                this.applyImpulse(gravity);
            }
            let spdMod = this.home.speedModulation / this.home.physicsRealism;
            for (let i = 0; i < this.home.physicsRealism; i++) {
                //linear
                this.velocity.add(this.acceleration.times(spdMod));
                this.capSpeed;


                let newX = this.x + this.velocity.x * 2 * spdMod;
                let newY = this.y + this.velocity.y * 2 * spdMod;
                this.privateSetX(newX);
                this.privateSetY(newY);

                //angular
                this.angularVelocity += this.angularAcceleration * spdMod;
                let newRotation = this.rotation + this.angularVelocity * spdMod;
                this.privateSetRotation(newRotation);

                this.checkAndResolveCollisions(others);
            }

            this.rotation %= Math.PI * 2;

            this.direction = new Vector2(this.x - this.lastX, this.y - this.lastY);
            this.lastX = this.x;
            this.lastY = this.y;
        });
    }
    moveTowards(point, ferocity) {
        if (ferocity === undefined) ferocity = 1;
        let dirX = Math.sign(point.x - this.middle.x);
        let dirY = Math.sign(point.y - this.middle.y);
        let dir = new Vector2(dirX, dirY);
        dir.mul(ferocity * 0.1);
        this.speed.add(dir);
        this.logMod(function () {
            this.moveTowards(point, ferocity);
        });
    }
    moveAwayFrom(point, ferocity) {
        if (ferocity === undefined) ferocity = 1;
        let dirX = -Math.sign(point.x - this.middle.x);
        let dirY = -Math.sign(point.y - this.middle.y);
        let dir = new Vector2(dirX, dirY);
        dir.mul(ferocity * 0.1);
        this.speed.add(dir);
        this.logMod(function () {
            this.moveAwayFrom(point, ferocity);
        });
    }
    applyImpulse(impulse) {
        if (!impulse) return;
        this.applyLinearImpulse(impulse);
        this.applyAngularImpulse(impulse);
        // c.stroke(cl.LIME, 1).circle(impulse.source.x, impulse.source.y, 2);
        // c.stroke(cl.LIME, 1).arrow(impulse.source, impulse.force.plus(impulse.source));
    }
    applyLinearImpulse(impulse) {
        this.velocity.add(impulse.force);
    }
    applyAngularImpulse(impulse) {
        let com = this.centerOfMass;
        let startVector = impulse.source.minus(com);
        if (startVector.mag < 0.01) return;
        let endVector = impulse.source.plus(impulse.force).minus(com);
        let difAngle = endVector.getAngle() - startVector.getAngle();

        let angularForce = Math.sign(difAngle) * clamp(Math.abs(difAngle / 2), 0, 0.01);
        this.angularVelocity += angularForce;
    }
    getSpine() {
        let spine;
        if (this.width > this.height) {
            let crs = this.getCorners();
            let v = crs[1].minus(crs[0]).normalize().times(this.height / 2);
            let l1 = new Line(crs[0], crs[3]);
            let l2 = new Line(crs[1], crs[2]);
            spine = new Line(l1.midPoint.plus(v), l2.midPoint.minus(v));
        } else if (this.height > this.width) {
            let crs = this.getCorners();
            let v = crs[2].minus(crs[1]).normalize().times(this.width / 2);
            let l1 = new Line(crs[0], crs[1]);
            let l2 = new Line(crs[2], crs[3]);
            spine = new Line(l1.midPoint.plus(v), l2.midPoint.minus(v));
        } else {
            spine = new Line(this.middle, this.middle);
        }
        return spine;
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
        let bound = PhysicsObject.getBoundingBox(r);
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
    static farthestInDirection(corners, dir) {
        let farthest = corners[0];
        let farthestDist = -Infinity;
        let result = { index: 0, corner: farthest }
        for (let i = 0; i < corners.length; i++) {
            let corner = corners[i];
            let dist = corner.x * dir.x + corner.y * dir.y;
            if (dist > farthestDist) {
                farthest = corner;
                farthestDist = dist;
                result.index = i;
            }
        }
        result.corner = farthest;
        return result;
    }
    static getImpulses(a, b, dirFromA, dirFromB, collisionPoint, penetration) {
        let impulseA, impulseB;

        let aPercentMass = 1 * (a.mass / (a.mass + b.mass));
        let bPercentMass = 1 - aPercentMass;

        let source = collisionPoint;

        //for impulse A
        let forceFromB = clamp(dirFromB.dot(b.velocity), 0, Infinity);

        //for impulse B
        let forceFromA = clamp(dirFromA.dot(a.velocity), 0, Infinity);



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


        impulseA = new Impulse(dirFromB.times(forceFromB), source);
        impulseB = new Impulse(dirFromA.times(forceFromA), source);

        let forceA = impulseA.force.minus(impulseB.force).times(bPercentMass);
        let forceB = impulseB.force.minus(impulseA.force).times(aPercentMass);


        impulseA.force = forceA;
        impulseB.force = forceB;

        if (b.positionStatic) impulseB = null;

        // if (impulseA && !impulseA.force.mag && impulseB && !impulseB.force.mag) return { impulseA: null, impulseB: null };
        // impulseA = null;
        // impulseB = null;

        return { impulseA, impulseB };
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

            //impulse resolution
            let impulses = PhysicsObject.getImpulses(a, b, collisionPoint.minus(a.middle).normalize(), collisionPoint.minus(b.middle).normalize(), collisionPoint, penetration);

            col = new Collision(true, a, b, collisionAxis, collisionAxis.times(-1), penetration, impulses.impulseA, impulses.impulseB, collisionPoint);
        } else col = new Collision(false, a, b);
        return col;
    }
    static collideRectCircle(a, b) {
        a.home.SAT.boxChecks++;
        if (!Geometry.overlapRectRect(PhysicsObject.getBoundingBox(a), PhysicsObject.getBoundingBox(b))) return new Collision(false, a, b);
        a.home.SAT.SATChecks++;
        let colliding = a.collider.collideBox(b);
        if (colliding) {
            a.home.SAT.collisions++;
            let inside = a.collider.collidePoint(b.middle);
            let bestPoint = Geometry.closestPointOnRectangle(b.middle, a);
            if (!bestPoint) return new Collision(false, a, b);
            let bestDist = Math.sqrt((bestPoint.x - b.middle.x) ** 2 + (bestPoint.y - b.middle.y) ** 2);
            let penetration = b.radius + (inside ? bestDist : -bestDist);
            //towards b, from collision
            let collisionAxis = new Vector2(b.middle.x - bestPoint.x, b.middle.y - bestPoint.y);
            collisionAxis.normalize();
            if (inside) collisionAxis.mul(-1);

            //impulse resolution
            let impulses = PhysicsObject.getImpulses(b, a, collisionAxis.times(-1), collisionAxis, bestPoint, penetration);

            let col = new Collision(true, a, b, collisionAxis, collisionAxis.times(-1), penetration, impulses.impulseB, impulses.impulseA, bestPoint);
            return col;
        } else return new Collision(false, a, b);
    }
    static collideCircleRect(a, b) {
        a.home.SAT.boxChecks++;
        if (!Geometry.overlapRectRect(PhysicsObject.getBoundingBox(a), PhysicsObject.getBoundingBox(b))) return new Collision(false, a, b);
        let colliding = b.collider.collideBox(a);
        a.home.SAT.SATChecks++;
        //getting resolution data
        let col;
        if (colliding) {
            a.home.SAT.collisions++;
            let bestPoint = Geometry.closestPointOnRectangle(a.middle, b);
            if (!bestPoint) return new Collision(false, a, b);
            let bestDist = Geometry.distToPoint(bestPoint, a.middle);
            //towards collision, from a
            let collisionAxis = bestPoint.minus(a.middle).normalize();
            const inside = b.collider.collidePoint(a.middle);
            let penetration = a.radius + (inside ? bestDist : -bestDist);
            if (inside) collisionAxis.mul(-1);

            //impulse resolution
            let impulses = PhysicsObject.getImpulses(a, b, collisionAxis, collisionAxis.times(-1), bestPoint, penetration);

            col = new Collision(true, a, b, collisionAxis, collisionAxis.times(-1), penetration, impulses.impulseA, impulses.impulseB, bestPoint);
        } else col = new Collision(false, a, b);
        return col;
    }
    static collideRectRect(a, b) {
        a.home.SAT.boxChecks++;
        if (!Geometry.overlapRectRect(PhysicsObject.getBoundingBox(a), PhysicsObject.getBoundingBox(b))) return new Collision(false, a, b);
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
        let finalPenetratingCornerIndex = null;
        let finalPenetratedEdge = null;
        if (colliding) {
            a.home.SAT.collisions++;
            for (let i = 0; i < bEdges.length; i++) {
                let edge = bEdges[i - 1];
                if (!i) edge = bEdges[bEdges.length - 1];
                let normal = Vector2.fromAngle(edge.getAngle() + Math.PI / 2);
                let far = PhysicsObject.farthestInDirection(aCorners, normal);
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
                    finalPenetratingCornerIndex = far.index;
                    finalPenetratedEdge = new Line(edgeStart, edgeEnd);
                    finalPenetratingCornerOwner = a;
                }
            }
            for (let i = 0; i < aEdges.length; i++) {
                let edge = i ? aEdges[i - 1] : aEdges[aEdges.length - 1];
                let normal = Vector2.fromAngle(edge.getAngle() + Math.PI / 2);
                let far = PhysicsObject.farthestInDirection(bCorners, normal);
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
                    finalPenetratingCornerIndex = far.index;
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
                let collisionPoint = finalPenetratingCornerOwner.getCorners()[finalPenetratingCornerIndex];
                let impulses = PhysicsObject.getImpulses(a, b, collisionAxis.times(-1), collisionAxis.get(), collisionPoint, leastIntersection);

                col = new Collision(true, a, b, collisionAxis.times(-1), collisionAxis, leastIntersection, impulses.impulseA, impulses.impulseB, collisionPoint);
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
        const d = col.Bdir;
        const a = col.a;
        const b = col.b;
        let collisionPoint = col.collisionPoint;
        let mobileA = !PhysicsObject.isWall(a)
        let mobileB = !PhysicsObject.isWall(b)
        //position
        let dir = col.Adir.times(col.penetration);
        if (col.penetration > 0.005) {
            if (!mobileB) {
                a.privateSetX(a.x - dir.x);
                a.privateSetY(a.y - dir.y);
            } else {
                a.privateSetX(a.x - dir.x / 2);
                a.privateSetY(a.y - dir.y / 2);
                b.privateSetX(b.x + dir.x / 2);
                b.privateSetY(b.y + dir.y / 2);
            }
        }
        // c.stroke(cl.RED, 2).arrow(a.centerOfMass, b.centerOfMass);

        //velocity
        const A_VEL_AT_COLLISION = a.velocity.dot(col.Adir);
        const B_VEL_AT_COLLISION = b.velocity.dot(col.Bdir);
        if (A_VEL_AT_COLLISION < 0 && B_VEL_AT_COLLISION < 0) return;

        //friction
        let frictionDir = d.normal.normalize();
        let aPointVel = a.velocity;
        let velDot1 = frictionDir.dot(a.velocity);
        let velDot2 = frictionDir.times(-1).dot(aPointVel);
        if (velDot2 < velDot1) frictionDir.mul(-1);
        let friction = frictionDir.plus(0);
        friction.mag = -frictionDir.dot(aPointVel) / 100;
        let cp = col.collisionPoint;
        // c.draw(cl.RED).circle(cp.x, cp.y, 3);
        // c.stroke(cl.RED, 2 / s.zoom).arrow(cp, frictionDir.times(100).plus(cp));
        a.angularVelocity *= a.angularDragForce;
        a.applyImpulse(new Impulse(friction, cp));

        //impulse resolution
        let iA = col.impulseA;
        let iB = col.impulseB;
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
}
class CirclePhysicsObject extends PhysicsObject {
    constructor(name, x, y, radius, gravity, controls, tag, home) {
        super(name, x, y, 0, 0, gravity, controls, tag, home);
        this.collider = new CircleCollider(this);
        this.radius = radius;
        this.optimalRotation = null;
    }
    set unrotatedMiddle(a) {
        this.x = a.x;
        this.y = a.y;
    }
    get unrotatedMiddle() {
        return P(this.x, this.y);
    }
    set width(a) {
        this.radius = a / 2;
    }
    get width() {
        return this.radius * 2;
    }
    set height(a) {
        this.radius = a / 2;
    }
    get height() {
        return this.radius * 2;
    }
}
