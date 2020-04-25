class PhysicsObject extends SceneObject {
    constructor(name, x, y, gravity, controls, tag, home) {
        super(name, x, y, controls, tag, home);
        this.velocity = Vector2.origin;
        this.acceleration = Vector2.origin;
        this.angularVelocity = 0;
        this.angularAcceleration = 0;
        this.hasGravity = gravity;
        this.slows = gravity;
        this.direction = Vector2.origin;
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
        this.constraintLeader = false;
        this.contactPoints = [];
        this.prohibited = [];
        this.canCollide = true;
        this._gravity = null;
        this._mass = null;
        this._linearDragForce = null;
        this._angularDragForce = null;
        this._friction = null;
        this._rotation = 0;
        this.__mass = 0; //mass cache
        this.colliding = new CollisionMoniter();
        this.lastColliding = new CollisionMoniter();
        this.newColliding = new CollisionMoniter();
        this.collisionLog = [];
        this.usedForCellSize = false;
        this.response.collide = {
            general: function () { },
            top: function () { },
            bottom: function () { },
            left: function () { },
            right: function () { }
        };
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

        //overridable
        //getCustomCorners -> single polygon
        //getModels -> multiple shapes
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
        let totalMass = 0;
        for (let [name, shape] of this.shapes) totalMass += shape.area;
        return totalMass;
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
    set centerOfMass(a) {
        this.middle = a;
    }
    get centerOfMass() {
        return this.middle;
    }
    collideBasedOnRule(e) {
        let judgement = [];
        for (let m of this.scripts) {
            judgement.push(m.scriptCollideRule(m, e));
        }
        return !judgement.includes(false);
    }
    stop() {
        this.velocity = Vector2.origin;
        this.acceleration = Vector2.origin;
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
        let rot = this.parent ? this.parent.rotation : this.rotation;
        c.translate(com);
        c.rotate(-rot);
        c.translate(com.times(-1));
        artist.bind(this)();
        c.translate(com);
        c.rotate(rot);
        c.translate(com.times(-1));
    }
    getPointVelocity(point) {
        if (!this.rotationStatic) {
            let r_A = point.minus(this.centerOfMass);
            let v_A = this.angularVelocity;
            let sum = r_A.normal.times(v_A).plus(this.velocity);
            return sum;
        } else return this.velocity;
    }
    slowDown() {
        //apply linear drag;
        let drag = this.velocity.get().mul(-(1 - this.linearDragForce) * this.__mass);
        let iD = new Impulse(drag, this.centerOfMass);
        this.applyImpulse(iD);

        if (this.velocity.mag < 0.01) this.velocity.mag = 0;
        if (Math.abs(this.angularVelocity) < 0.00001) this.angularVelocity = 0;
        
        //wacky air
        // let removals = [];

        // //find surface area against wind
        // let totalSize = 0;
        // for (let name in this.shapes) {
        //     let model = this.getModel(name);
        //     let edges = model.getEdges();
        //     for (let edge of edges) {
        //         c.stroke(cl.LIME, 2).line(edge);
        //         let a = edge.a;
        //         let b = edge.b;
        //         let v = b.minus(a).normal;
        //         v = v.projectOnto(this.velocity);
        //         totalSize += v.mag;
        //         removals.push(v);
        //     }
        // }
        // let rmI = 0;
        // for (let name in this.shapes) {
        //     let model = this.getModel(name);
        //     let edges = model.getEdges();
        //     for (let edge of edges) {
        //         c.stroke(cl.LIME, 2).line(edge);
        //         let v = removals[rmI++].over(totalSize);
        //         if (v.dot(this.velocity) < 0) {
        //             let mid = edge.midPoint;
        //             let r = v.times(this.velocity);
        //             c.stroke(cl.RED, 2).arrow(mid.minus(v.times(200)), mid);
        //         }
        //     }
        // }
    }
    capSpeed() {
        let m = Math.sqrt(this.mass) / 2;
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
    privateMove(v) {
        if (!this.positionStatic) {
            this.x += v.x;
            this.y += v.y;
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
                    if (other instanceof PhysicsObject) {
                        if (this.optimize(this, other)) {
                            if (this.collideBasedOnRule(other) && other.collideBasedOnRule(this)) {
                                let col = Physics.fullCollide(this, other);
                                if (col.length) {
                                    this.allCollidingWith["Shape - " + other.name] = other;
                                    other.allCollidingWith["Shape - " + this.name] = this;
                                    if (!this.colliding.general) this.colliding.general = [];
                                    if (!other.colliding.general) other.colliding.general = [];
                                    this.colliding.general.push(other);
                                    other.colliding.general.push(this);
                                    if (this.canCollide && other.canCollide) {
                                        for (let collision of col) {
                                            Physics.resolve(collision);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return [];
    }
    checkAndResolveCollisions(others) {
        const dir = this.velocity.get().normalize();
        // c.stroke(cl.RED, 3).arrow(this.middle, this.middle.plus(dir.times(10)));
        others = others.sort(function (a, b) {
            let mA = Vector2.fromPoint(a);
            let mB = Vector2.fromPoint(b);
            let dA = mA.dot(dir);
            let dB = mB.dot(dir);
            let dif = dB - dA;
            return -dif;
        });
        let collisions;
        if (!this.completelyStatic) collisions = this.detectCollisions(others);
        if (!this.completelyStatic) {
            for (let col of collisions) {
                Physics.resolveResults(col);
            }
        }
    }
    getSpeedModulation() {
        return this.home.speedModulation / this.home.physicsRealism;
    }
    enginePhysicsUpdate() {
        this.scripts.run("update");
        this.update();
    }
    applyGravity(coef = 1) {
        if (this.hasGravity) {
            //gravity
            let gv = this.gravity;
            let gravitationalForce = gv.times(coef / this.getSpeedModulation() * this.__mass);
            let iG = new Impulse(gravitationalForce, this.centerOfMass);
            this.applyImpulse(iG);
        }
    }
    physicsUpdate(others) {
        s.drawInWorldSpace(e => {

            let spdMod = this.getSpeedModulation();
            for (let i = 0; i < this.home.physicsRealism; i++) {
                //slow
                if (this.slows) this.slowDown();
                
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

                this.cacheBoundingBoxes();
                this.__mass = this.mass;

                this.checkAndResolveCollisions(others);
            }

            let pi2 = Math.PI * 2;
            this.rotation = ((this.rotation % pi2) + pi2) % pi2;

            this.direction = new Vector2(this.x - this.lastX, this.y - this.lastY);
            this.lastX = this.x;
            this.lastY = this.y;

        });
    }
    moveTowards(point, ferocity = 1) {
        let dif = point.minus(this.middle);
        this.velocity.add(dif.mul(ferocity / 100));
        this.logMod(function () {
            this.moveTowards(point, ferocity);
        });
    }
    moveAwayFrom(point, ferocity = 1) {
        let dif = this.middle.minus(point);
        this.velocity.add(dif.times(ferocity / 100));
        this.logMod(function () {
            this.moveAwayFrom(point, ferocity);
        });
    }
    getImpulseRatio(point, axis) {
        let r_N = point.minus(this.centerOfMass).normal;
        let r = r_N.mag;
        if (r < 0.01) return 1;
        let I = axis;
        let proj = I.projectOnto(r_N);
        let pMag = proj.mag;
        if (!pMag) return 1;
        return 1 - pMag / I.mag;
    }
    applyImpulse(impulse, name = "no name") {
        if (!impulse || !impulse.force.mag) return;
        impulse.force.div(this.__mass);
        this.applyLinearImpulse(impulse);
        this.applyAngularImpulse(impulse);
        // c.stroke(cl.PURPLE, 1).circle(impulse.source.x, impulse.source.y, 2);
        // c.stroke(cl.PURPLE, 1).arrow(impulse.source, impulse.force.times(10).plus(impulse.source));
    }
    applyLinearImpulse(impulse) {
        if (!impulse) return;
        let ratio = this.getSpeedModulation();
        this.velocity.add(impulse.force.times(ratio));
    }
    applyAngularImpulse(impulse) {
        if (!impulse) return;
        let r = impulse.source.minus(this.centerOfMass);
        if (!r.x && !r.y && r.x + r.y < 0.01) return;
        let r_N = r.normal;
        let I = impulse.force;
        let proj = I.projectOnto(r_N);
        let sign = Math.sign(proj.dot(r_N));
        let v_theta = sign * Math.sqrt((proj.x ** 2 + proj.y ** 2) / (r.x ** 2 + r.y ** 2));
        this.angularVelocity += v_theta * this.getSpeedModulation();
    }
}