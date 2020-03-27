const CLIPPING_THRESHOLD = 2;
class PhysicsObject extends SceneObject {
    constructor(name, x, y, width, height, gravity, controls, tag, home) {
        super(name, x, y, width, height, controls, tag, home);
        this.velocity = new Vector2(0, 0);
        this.acceleration = new Vector2(0, 0);
        this.angularVelocity = 0;
        this.angularAcceleration = 0;
        this.hasGravity = gravity;
        this.slows = gravity;
        this.home.hasRotatedRectangles = true;
        this.links = [];
        this.direction = new Vector2(0, 0);
        this.lastX = this.x;
        this.lastY = this.y;
        this.hasPhysics = true;
        this.limitsVelocity = true;
        this.optimize = (a, b) => true;
        this.canMoveThisFrame = true;
        this.optimalRotation = (this.width > this.height) ? Math.PI / 2 : (this.height > this.width) ? 0 : null;
        this.snuzzlement = 1;
        this.density = 0.1;
        this.positionStatic = !gravity;
        this.rotationStatic = !gravity;
        this.contactPoints = [];
        this.prohibited = [];
        this.canCollide = true;
        this._gravity = null;
        this._mass = null;
        this._linearDragForce = null;
        this._angularDragForce = null;
        this._friction = null;
        this._rotation = 0;
        this.colliding = new CollisionMoniter();
        this.lastColliding = new CollisionMoniter();
        this.newColliding = new CollisionMoniter();
        this.collisionLog = [];
        this.response.collide = {
            general: function () { },
            top: function () { },
            bottom: function () { },
            left: function () { },
            right: function () { }
        }
        for (let x in this.response.collide) {
            let cap = x[0].toUpperCase() + x.slice(1);
            this["scriptCollide" + cap] = function (e) {
                for (let m of this.scripts) {
                    m["scriptCollide" + cap](m, e);
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

        //downscale
        const m = this.middle;
        this.width -= 0.25;
        this.height -= 0.25;
        this.middle = m;
    }
    get gravity() {
        if (this._gravity === null) return this.home.gravity;
        else return this._gravity;
    }
    set gravity(a) {
        this._gravity = a;
    }
    set friction(a) {
        this._friction = a;
    }
    get friction() {
        if (this._friction !== null) return this._friction;
        return this.home.frictionDragForce;
    }
    set linearDragForce(a) {
        this._linearDragForce = a;
    }
    get linearDragForce() {
        if (this._angularDragForce !== null) return this._linearDragForce;
        return this.home.linearDragForce;
    }
    set angularDragForce(a) {
        this._angularDragForce = a;
    }
    get angularDragForce() {
        if (this._angularDragForce !== null) return this._angularDragForce;
        return this.home.angularDragForce;
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
    set hasGravity(a) {
        this._hasGravity = a;
        this.slows = a;
    }
    get hasGravity() {
        return this._hasGravity;
    }
    set completelyStatic(a) {
        this.positionStatic = a;
        this.rotationStatic = a;
    }
    get completelyStatic() {
        return this.positionStatic && this.rotationStatic;
    }
    collideBasedOnRule(e) {
        let judgement = [];
        for (let m of this.scripts) {
            judgement.push(m.scriptCollideRule(m, e));
        }
        return !judgement.includes(false);
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
    mobilize() {
        this.completelyStatic = false;
        this.hasGravity = true;
        this.slows = true;
    }
    clearCollisions() {
        for (let [key, value] of this.colliding) this.colliding[key] = null;
        this.canMoveThisFrame = true;
        this.allCollidingWith.clear();
        this.contactPoints = [];
        this.prohibited = [];
    }
    drawWithoutRotation(artist) {
        let com = this.centerOfMass;
        c.translate(com);
        c.rotate(-this.rotation);
        c.translate(com.times(-1));
        artist.bind(this)();
        c.translate(com);
        c.rotate(this.rotation);
        c.translate(com.times(-1));
    }
    engineDrawUpdate() {
        let r = Physics.getBoundingBox(this);
        // c.draw(new Color(255, 0, 0,0.2)).rect(s.adjustedDisplay);
        if (!this.hidden && (!this.cullGraphics || Geometry.overlapRectRect(r, s.adjustedDisplay))) {
            let com = this.centerOfMass;
            let mcx = com.x;
            let mcy = com.y;
            let r = this.rotation;
            c.translate(mcx, mcy);
            c.rotate(r);
            c.translate(-mcx, -mcy);
            this.runDraw();
            c.translate(mcx, mcy);
            c.rotate(-r);
            // c.stroke(cl.PURPLE, 2).arrow(P(0, 0), this.velocity.times(10));
            // c.stroke(cl.LIME, 2).arrow(P(0, 0), this.acceleration.times(10));
            // c.draw(cl.WHITE).text("15px monospace", "MASS: " + Math.floor(this.mass / 1000) + "kg, " + (this.mass % 1000) + "g", 0, 0);
            c.translate(-mcx, -mcy);
            // c.draw(cl.RED).rect(this.middle.x - this.width / 2, this.middle.y - this.height / 2, Math.sqrt(this.mass), Math.sqrt(this.mass));
            // c.draw(cl.BLACK).text("10px Monospace", Math.floor(this.mass) + "kg", this.middle.x - this.width / 2, this.middle.y - this.height / 2);
        }
    }
    slowDown() {
        //apply linear drag;
        let drag = this.velocity.get().mul(-(1 - this.linearDragForce));
        let iD = new Impulse(drag, this.centerOfMass);
        this.applyImpulse(iD);
        this.angularVelocity *= this.angularDragForce;

        if (this.velocity.mag < 0.01) this.velocity.mag = 0;
        if (Math.abs(this.angularVelocity) < 0.00001) this.angularVelocity = 0;
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
    detectCollisions(others) {
        let collisions = [];
        if (!this.completelyStatic) {
            for (let other of others) {
                if (other !== this) {
                    if (other instanceof PhysicsObject && other.tag !== "Engine-Particle") {
                        if (this.optimize(this, other)) {
                            if (this.collideBasedOnRule(other) && other.collideBasedOnRule(this)) {
                                let nameA = (this instanceof CirclePhysicsObject) ? "Circle" : "Rect";
                                let nameB = (other instanceof CirclePhysicsObject) ? "Circle" : "Rect";
                                let col = Physics["collide" + nameA + nameB](this, other);
                                if (col.colliding) {
                                    this.allCollidingWith["Rect - " + other.name] = other;
                                    other.allCollidingWith["Rect - " + this.name] = this;
                                    if (!this.colliding.general) this.colliding.general = [];
                                    if (!other.colliding.general) other.colliding.general = [];
                                    this.colliding.general.push(other);
                                    other.colliding.general.push(this);
                                    if (this.canCollide && other.canCollide) {
                                        collisions.push(col);
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
        const dir = this.velocity.get().normalize();
        // c.stroke(cl.RED, 3).arrow(this.middle, this.middle.plus(dir.times(10)));
        others = others.sort(function (a, b) {
            let mA = Vector2.fromPoint(a.unrotatedMiddle);
            let mB = Vector2.fromPoint(b.unrotatedMiddle);
            let dA = mA.dot(dir);
            let dB = mB.dot(dir);
            let dif = dB - dA;
            return -dif;
        });
        let collisions;
        if (!this.completelyStatic) collisions = this.detectCollisions(others);
        if (!this.completelyStatic) {
            for (let col of collisions) Physics.resolve(col);
        }
    }
    getSpeedModulation() {
        return this.home.speedModulation / this.home.physicsRealism;
    }
    enginePhysicsUpdate() {
        this.scriptUpdate();
        this.update();
    }
    applyGravity(coef = 1) {
        if (this.hasGravity) {
            //gravity
            let gv = this.gravity;
            let gravitationalForce = gv.times(coef * this.getSpeedModulation());
            let iG = new Impulse(gravitationalForce, this.centerOfMass);
            this.applyImpulse(iG);
        }
    }
    physicsUpdate(others) {
        s.drawInWorldSpace(e => {
            //slow
            if (this.slows) this.slowDown();

            let spdMod = this.getSpeedModulation();
            for (let i = 0; i < this.home.physicsRealism; i++) {
                //linear
                this.velocity.add(this.acceleration.times(spdMod));
                if (this.limitsVelocity) this.capSpeed();
                if (this.positionStatic) this.velocity.mul(0);


                let newX = this.x + this.velocity.x * 2 * spdMod;
                let newY = this.y + this.velocity.y * 2 * spdMod;
                this.privateSetX(newX);
                this.privateSetY(newY);

                //angular
                this.angularVelocity += this.angularAcceleration * spdMod;
                if (this.rotationStatic) this.angularVelocity = 0;
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
    moveTowards(point, ferocity = 1) {
        let dif = Vector2.fromPoint(point).minus(this.middle);
        this.velocity.add(dif.times(ferocity / 100));
        this.logMod(function () {
            this.moveTowards(point, ferocity);
        });
    }
    moveAwayFrom(point, ferocity = 1) {
        let dif = Vector2.fromPoint(point).minus(this.middle).times(-1);
        this.velocity.add(dif.times(ferocity / 100));
        this.logMod(function () {
            this.moveAwayFrom(point, ferocity);
        });
    }
    getImpulseRatio(impulse) {
        let com = this.centerOfMass;
        let startVector = impulse.source.minus(com);
        let endVector = impulse.source.plus(impulse.force).minus(com);
        let sMag = startVector.mag;
        if (sMag < 0.01) return 1;
        let eMag = endVector.mag;
        let shortest = (sMag < eMag) ? startVector : endVector;

        let maxR = this.radius ? this.radius : Math.sqrt((this.width / 2) ** 2, (this.height / 2) ** 2);
        let minR = shortest.mag;
        // c.stroke(cl.LIME, 1).circle(com.x, com.y, maxR);
        // c.stroke(cl.RED, 1).circle(com.x, com.y, minR);

        return minR / maxR;
    }
    applyImpulse(impulse, name = "no name") {
        if (!impulse) return;
        this.applyLinearImpulse(impulse);
        this.applyAngularImpulse(impulse);
        // c.stroke(cl.PURPLE, 1).circle(impulse.source.x, impulse.source.y, 2);
        // c.stroke(cl.PURPLE, 1).arrow(impulse.source, impulse.force.times(10).plus(impulse.source));
    }
    applyLinearImpulse(impulse) {
        if (!impulse) return;
        let ratio = this.getImpulseRatio(impulse);
        let rat = clamp(1 / ratio, 0, 1);
        this.velocity.add(impulse.force.times(rat));
    }
    applyAngularImpulse(impulse) {
        if (!impulse) return;
        let com = this.centerOfMass;
        let startVector = impulse.source.minus(com);
        if (startVector.mag < 0.01) return;
        let endVector = impulse.source.plus(impulse.force).minus(com);
        let startAngle = startVector.getAngle();
        let endAngle = endVector.getAngle();
        let difAngle = Geometry.signedAngularDist(startAngle, endAngle);

        let dadForce = difAngle * this.getImpulseRatio(impulse);

        this.angularVelocity += dadForce;
    }
    applyFriction(tangent, collisionPoint, otherFriction) {
        let pointVel = this.velocity;
        let best = tangent.bestFit(pointVel);
        let push = -tangent.normal.bestFit(pointVel).dot(pointVel);
        let friction = pointVel.times(-1).projectOnto(best).times(clamp(Math.ceil(push), 0, 1));
        let mag = friction.mag;
        friction.mag = Math.min(mag, mag * this.friction * otherFriction);
        let iFL = new Impulse(friction, collisionPoint);
        this.applyImpulse(iFL);

        pointVel = collisionPoint.minus(Geometry.rotatePointAround(this.centerOfMass, collisionPoint, this.angularVelocity));
        friction = pointVel.projectOnto(tangent.bestFit(pointVel));
        mag = friction.mag;
        friction.mag = Math.min(mag, mag * this.friction * otherFriction * 3);
        let iFA = new Impulse(friction, collisionPoint);
        this.applyAngularImpulse(iFA);
        // c.stroke(cl.LIME, 2).arrow(collisionPoint, collisionPoint.plus(pointVel.times(1000)));
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