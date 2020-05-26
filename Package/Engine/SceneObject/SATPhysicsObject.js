class PhysicsObject extends SceneObject {
    constructor(name, x, y, gravity, controls, tag, home) {
        super(name, x, y, controls, tag, home);

        //velocity
        this.velocity = Vector2.origin;
        this.acceleration = Vector2.origin;
        //velocity loss
        this._linearDragForce = null;
        this._angularDragForce = null;
        this._friction = null;
        this.limitsVelocity = true;
        this.slows = gravity;
        
        //acceleration
        this.angularVelocity = 0;
        this.angularAcceleration = 0;
        this.hasGravity = gravity;
        this._gravity = null;

        //previous states
        this.lastRotation = 0;
        this.lastVelocity = Vector2.origin;
        this.last = this.middle;
        this.lastAngularVelocity = 0;

        //previous state differences
        this.direction = Vector2.origin;
        this.angularDirection = 0;
        
        //collision detection

        //collisions
        //detection
        this.optimize = (a, b) => true;
        this.canMoveThisFrame = true;
        this.canCollide = true;
        this.constraintLeader = false;
        //response
        this.snuzzlement = 1;
        this._mass = null;
        this.density = 0.1;
        this.positionStatic = !gravity;
        this.rotationStatic = !gravity;
        this.prohibited = [];
        this._rotation = 0;
        this.__mass = 0; //mass cache
        this.__perimeter = 0; //perimeter cache
        //data
        this.colliding = new CollisionMoniter();
        this.lastColliding = new CollisionMoniter();
        this.newColliding = new CollisionMoniter();
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

        //scene
        this.usedForCellSize = false;
    }
    set gravity(a) {
        this._gravity = a;
    }
    get gravity() {
        if (this._gravity === null) return this.home.gravity;
        else return this._gravity;
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
    get perimeter() {
        let totalPer = 0;
        for (let [name, shape] of this.shapes) totalPer += shape.perimeter;
        return totalPer;
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
    immobilize() {
        this.completelyStatic = true;
        this.hasGravity = false;
        this.slows = false;
    }
    clearCollisions() {
        for (let [key, value] of this.colliding) this.colliding[key] = null;
        this.canMoveThisFrame = true;
        this.allCollidingWith.clear();
        this.prohibited = [];
    }
    drawWithoutRotation(artist) {
        let com = this.centerOfMass;
        let rot = this.rotation;
        c.translate(com);
        c.rotate(-rot);
        c.translate(com.Ntimes(-1));
        artist.bind(this)();
        c.translate(com);
        c.rotate(rot);
        c.translate(com.Ntimes(-1));
    }
    getPointVelocity(point) {
        if (!this.rotationStatic) {
            let r_A = point.Vminus(this.centerOfMass);
            let v_A = this.angularVelocity;
            let sum = r_A.normal.Ntimes(v_A).Vplus(this.velocity);
            return sum;
        } else return this.velocity;
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
        let collisions = 0;
        if (!this.completelyStatic) {
            for (let other of others) {
                if (other !== this) {
                    if (other instanceof PhysicsObject) {
                        if (this.optimize(this, other)) {
                            if (this.collideBasedOnRule(other) && other.collideBasedOnRule(this)) {
                                let col = Physics.fullCollide(this, other);
                                collisions++;
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
                                    for (let collision of col) {
                                        Physics.events(collision);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        // c.draw(cl.RED).text("20px monospace", collisions, this.x, this.y);
        return [];
    }
    checkAndResolveCollisions(others) {
        const dir = this.velocity.get().normalize();
        others = others.sort(function (a, b) {
            let mA = Vector2.fromPoint(a);
            let mB = Vector2.fromPoint(b);
            let dA = mA.dot(dir);
            let dB = mB.dot(dir);
            let dif = dB - dA;
            return -dif;
        });
        others = [...others.filter(e => e.completelyStatic), ...others.filter(e => !e.completelyStatic)];
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
    engineFixedUpdate() {
        this.scripts.run("update");
        this.update();

        this.direction = this.middle.Vminus(this.last);
        this.last = this.middle;
        
        this.lastVelocity = this.velocity.get();
        this.lastAngularVelocity = this.angularVelocity;

        this.angularDirection = this.rotation - this.lastRotation; 
        this.lastRotation = this.rotation;

    }
    applyGravity(coef = 1) {
        if (this.hasGravity) {
            //gravity
            let gv = this.gravity;
            let gravitationalForce = gv.Ntimes(coef * this.__mass);
            let iG = new Impulse(gravitationalForce, this.centerOfMass);
            this.internalApplyImpulse(iG, "gravity");
        }
    }
    slowDown() {
        //apply linear drag;
        let drag = this.velocity.get().Nmul(-(1 - this.linearDragForce) * this.__mass / this.home.physicsRealism);
        let iD = new Impulse(drag, this.centerOfMass);
        this.internalApplyImpulse(iD, "drag");

        if (this.velocity.mag < 0.01) this.velocity.mag = 0;
        if (Math.abs(this.angularVelocity) < 0.00001) this.angularVelocity = 0;
    }
    physicsUpdate(others) {
        s.drawInWorldSpace(e => {
            let spdMod = this.getSpeedModulation();
            //slow
            if (this.slows) this.slowDown();
            
            //linear
            this.velocity.Vadd(this.acceleration.Ntimes(spdMod));
            if (this.limitsVelocity) this.capSpeed();
            if (this.positionStatic || this.velocity.mag > 30) this.velocity.Nmul(0);


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
            this.cacheMass();
            this.__perimeter = this.perimeter;

            this.checkAndResolveCollisions(others);

            let pi2 = Math.PI * 2;
            this.rotation = ((this.rotation % pi2) + pi2) % pi2;

            //any number of terrible things may have happened by this point.
            if (isNaN(this.velocity.x)) this.velocity.x = 0;
            if (isNaN(this.velocity.y)) this.velocity.y = 0;
            if (isNaN(this.x)) this.x = this.last.x;
            if (isNaN(this.y)) this.y = this.last.y;
        });
    }
    cacheMass() {
        this.__mass = this.mass;
    }
    moveTowards(point, ferocity = 1) {
        let dif = point.Vminus(this.middle);
        this.velocity.Vadd(dif.Ntimes(ferocity / 100));
    }
    moveAwayFrom(point, ferocity = 1) {
        let dif = this.middle.Vminus(point);
        this.velocity.Vadd(dif.Ntimes(ferocity / 100));
    }
    getImpulseRatio(point, axis) {
        let r_N = point.Vminus(this.centerOfMass).normal;
        let r = r_N.mag;
        if (r < 0.01) return 1;
        let I = axis;
        let proj = I.projectOnto(r_N);
        let pMag = proj.mag;
        if (!pMag) return 1;
        return 1 - pMag / I.mag;
    }
    internalApplyImpulse(impulse, name = "no name") {
        if (!impulse || !impulse.force.mag) return;
        impulse.force.Ndiv(this.__mass);
        this.applyLinearImpulse(impulse, name);
        this.applyAngularImpulse(impulse, name);
    }
    applyImpulse(impulse, name = "no name") {
        if (!impulse || !impulse.force.mag) return;
        impulse.force.Ndiv(this.__mass / this.home.physicsRealism);
        this.applyLinearImpulse(impulse, name);
        this.applyAngularImpulse(impulse, name);
    }
    applyLinearImpulse(impulse, name) {
        if (!impulse) return;
        const vel = impulse.force;
        this.velocity.Vadd(vel);
    }
    applyAngularImpulse(impulse, name) {
        if (!impulse) return;
        let r = impulse.source.Vminus(this.centerOfMass);
        if (!r.x && !r.y && r.x + r.y < 0.01) return;
        let r_N = r.normal;
        let I = impulse.force;
        let proj = I.projectOnto(r_N);
        let sign = Math.sign(proj.dot(r_N));
        let v_theta = sign * Math.sqrt((proj.x ** 2 + proj.y ** 2) / (r.x ** 2 + r.y ** 2));
        if (v_theta > Math.PI * 2) v_theta = 0;
        this.angularVelocity += v_theta;
    }
}