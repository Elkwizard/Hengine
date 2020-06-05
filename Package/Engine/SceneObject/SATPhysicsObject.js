class PhysicsObject extends SceneObject {
    constructor(name, x, y, gravity, controls, tag, home) {
        super(name, x, y, controls, tag, home);
        this.physicsEngine = this.home.physicsEngine;
        //velocity
        this.velocity = Vector2.origin;
        this.acceleration = Vector2.origin;
        //velocity loss
        this.linearDragForce = this.physicsEngine.linearDragForce;
        this.angularDragForce = this.physicsEngine.angularDragForce;
        this.friction = this.physicsEngine.frictionDragForce;
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
        this.__middle = this.middle;
        this.hasCollideRule = false;
        //data
        this.colliding = new CollisionMoniter();
        this.lastColliding = new CollisionMoniter();
        this.response.collide = {
            general: function () { },
            top: function () { },
            bottom: function () { },
            left: function () { },
            right: function () { }
        };

        //scene
        this.usedForCellSize = false;
    }
    set gravity(a) {
        this._gravity = a;
    }
    get gravity() {
        if (this._gravity === null) return this.physicsEngine.gravity;
        else return this._gravity;
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
	onAddScript(script) {
        const value = 1;
		if (this.scripts[script].scriptCollideRule(value) !== value) this.hasCollideRule = true;
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
        this.colliding.clear();
        this.canMoveThisFrame = true;
        this.prohibited = [];
    }
    drawWithoutRotation(artist) {
        let com = this.middle;
        let rot = this.rotation;
        c.translate(com);
        c.rotate(-rot);
        c.translate(com.inverse());
        artist.bind(this)();
        c.translate(com);
        c.rotate(rot);
        c.translate(com.inverse());
    }
    getPointVelocity(point) {
        if (!this.rotationStatic) {
            let r_A = point.Vminus(this.middle).normal.Ntimes(this.angularVelocity);
            // r_A.mag = r_A.sqrMag;
            let sum = r_A.Vplus(this.velocity);
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
            this.__middle.x += v.x;
        }
    }
    privateSetY(y) {
        if (!this.positionStatic) {
            this.y = y;
            this.__middle.y += v.y;
        }
    }
    privateMove(v) {
        if (!this.positionStatic) {
            this.x += v.x;
            this.y += v.y;
            this.__middle.x += v.x;
            this.__middle.y += v.y;
            this.moveBoundingBoxCache(v);
        }
    }
    privateSetRotation(a) {
        if (!this.rotationStatic) {
            this.rotation = a;
            this.cacheRotation();
        }
    }
    detectCollisions(others) {
        if (!this.completelyStatic) {
            for (let other of others) {
                if (other !== this) {
                    if (this.optimize(other) && other.optimize(this)) {
                        if ((!this.hasCollideRule || this.collideBasedOnRule(other)) && (!other.hasCollideRule || other.collideBasedOnRule(this))) {
                            let col = Physics.fullCollide(this, other);
                            if (col.length) {
                                if (this.canCollide && other.canCollide) {
                                    for (const collision of col) {
                                        Physics.resolve(collision);
                                    }
                                } else {
                                    this.colliding.add(other, Vector2.down);
                                    other.colliding.add(this, Vector2.up);
                                }
                                if (this.home.collisionEvents) for (const collision of col) {
                                    Physics.events(collision);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    checkAndResolveCollisions(others) {
        const dir = this.velocity.normalized;
        others = others.sort((a, b) => (a.x - b.x) * dir.x + (a.y - b.y) * dir.y);
        others = [...others.filter(e => !e.completelyStatic), ...others.filter(e => e.completelyStatic)];
        this.detectCollisions(others);
    }
    getSpeedModulation() {
        return this.physicsEngine.speedModulation / this.physicsEngine.physicsRealism;
    }
    engineFixedUpdate() {
        this.scripts.run("update");
        this.update();
    }
    updatePreviousData() {
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
            let iG = new Impulse(gravitationalForce, this.middle);
            this.internalApplyImpulse(iG, "gravity");
        }
    }
    slowDown() {
        //apply linear drag;
        let dragFactor = -(1 - this.linearDragForce) / this.physicsEngine.physicsRealism;
        this.velocity.x += this.velocity.x * dragFactor;
        this.velocity.y += this.velocity.y * dragFactor;
        this.angularVelocity *= this.angularDragForce;

        // if (this.velocity.mag < 0.01) this.velocity.mag = 0;
        // if (Math.abs(this.angularVelocity) < 0.00001) this.angularVelocity = 0;
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
            this.angularVelocity += this.angularAcceleration;
            if (this.rotationStatic) this.angularVelocity = 0;
            let newRotation = this.rotation + this.angularVelocity * spdMod;
            
            this.privateSetRotation(newRotation);

            this.updateMovementCaches();

            this.checkAndResolveCollisions(others);

            let pi2 = Math.PI * 2;
            if (this.rotation < -pi2) this.rotation = -(-this.rotation % pi2);
            if (this.rotation > pi2) this.rotation = this.rotation % pi2;

            //any number of terrible things may have happened by this point.
            if (isNaN(this.velocity.x)) this.velocity.x = 0;
            if (isNaN(this.velocity.y)) this.velocity.y = 0;
            if (isNaN(this.x)) this.x = this.last.x;
            if (isNaN(this.y)) this.y = this.last.y;
        });
    }
    newShapeCache() {
        this.cacheBoundingBoxes();
		this.cacheMass();
    }
    moveBoundingBoxCache(v) {
        this.__boundingBox.x += v.x;
        this.__boundingBox.y += v.y;
        for (let name in this.shapes) {
            let rect = this.shapes[name];
            rect.__boundingBox.x += v.x;
            rect.__boundingBox.y += v.y;
        }
    }
    updateMovementCaches() {
        this.cacheAxes();
    }
    updateCaches() {
        this.cacheBoundingBoxes();
        this.updateMovementCaches();
        this.cacheDimensions();
        // this.__perimeter = this.perimeter;
    }
    cacheAxes() {
        const pos = this.middle;
        const rot = this.rotation;
        for (const name in this.shapes) {
            let shape = this.shapes[name];
            if (shape instanceof Polygon) {
                let axes = [];
                for (let sh of shape.collisionShapes) axes.push(...sh.getModel(pos, rot).getAxes());
                shape.cacheAxes(axes);
            }
        }
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
        let r_N = point.Vminus(this.middle).normal;
        let r = r_N.mag;
        if (r < 0.01) return 1;
        let I = axis;
        let proj = I.projectOnto(r_N);
        let pMag = proj.mag;
        if (!pMag) return 1;
        return 1 - pMag / I.mag;
    }
    internalApplyImpulse(impulse, name = "no name") {
        if (!impulse || !(impulse.force.x || impulse.force.y) ) return;
        impulse.force.Ndiv(this.__mass * this.physicsEngine.physicsRealism);
        this.applyLinearImpulse(impulse, name);
        this.applyAngularImpulse(impulse, name);
    }
    applyImpulse(impulse, name = "no name") {
        if (!impulse || !impulse.force.mag) return;
        impulse.force.Ndiv(this.__mass);
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
        let r = impulse.source.Vminus(this.middle);
        if (!r.x && !r.y && r.x + r.y < 0.01) return;
        this.angularVelocity += -impulse.force.cross(r) / (r.mag ** 2);
    }
}