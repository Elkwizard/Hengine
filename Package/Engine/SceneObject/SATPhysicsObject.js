class PhysicsObject extends SceneObject {
    constructor(name, x, y, gravity, controls, tag, container, engine) {
        super(name, x, y, controls, tag, container, engine);
        this.body = new RigidBody(x, y, gravity ? RigidBody.DYNAMIC : RigidBody.STATIC);
        this.body.userData.sceneObject = this;
        this.body.collisionFilter = function (body) {
            let sceneObject = body.userData.sceneObject;
            return (!this.hasCollideRule || this.collideBasedOnRule(sceneObject)) && (!sceneObject.hasCollideRule || sceneObject.collideBasedOnRule(this));
        }.bind(this);

        this.hasCollideRule = false;
        //data
        this.colliding = new CollisionMonitor();
        this.lastColliding = new CollisionMonitor();
        
		this.physicsShapes = new Map();

        //fake velocity
        let vel = this.body.velocity;
        let vec = Vector2.origin;
        delete vec.x;
        delete vec.y;
        let body = this.body;
        Object.defineProperty(vec, "x", {
            get() {
                return vel.x;
            },
            set(a) {
                vel.x = a;
                body.wake();
            }
        });
        Object.defineProperty(vec, "y", {
            get() {
                return vel.y;
            },
            set(a) {
                vel.y = a;
                body.wake();
            }
        });
        this._velocity = vec;
    }
    get canRotate() {
        return this.body.canRotate;
    }
    set canRotate(a) {
        this.body.canRotate = a;
    }
    get friction() {
        return this.body.friction;
    }
    set friction(a) {
        this.body.friction = a;
    }
    get airResistance() {
        return this.body.airResistance;
    }
    set airResistance(a) {
        this.body.airResistance = a;
    }
    get gravity() {
        return this.body.gravity;
    }
    set gravity(a) {
        this.body.gravity = a;
    }
    get mobile() {
        return this.body.type === RigidBody.DYNAMIC;
    }
    set mobile(a) {
        this.body.type = a ? RigidBody.DYNAMIC : RigidBody.STATIC;
        this.body.gravity = a;
        if (a) this.body.wake();
    }
    set snuzzlement(a) {
        this.body.restitution = 1 - a;
    }
    get snuzzlement() {
        return 1 - this.body.restitution;
    }
    set mass(a) {
        let scale = a / this.body.mass;
        this.body.mass *= scale;
        this.body.inertia *= scale;
    }
    get mass() {
        return this.body.mass;
    }
    get isTrigger() {
        return this.body.isTrigger;
    }
    set isTrigger(a) {
        this.body.isTrigger = a;
    }
    get velocity() {
        return this._velocity;
    }
    set velocity(a) {
        this._velocity.x = a.x;
        this._velocity.y = a.y;
    }
    get angularVelocity() {
        return this.body.angularVelocity;
    }
    set angularVelocity(a) {
        this.body.angularVelocity = a;
    }
    activate() {
        super.activate();
        this.engine.scene.physicsEngine.addBody(this.body);
    }
    deactivate() {
        super.deactivate();
        this.engine.scene.physicsEngine.removeBody(this.body.id);
    }
    centerModels() {
        super.centerModels();
    }
	addShape(name, shape) {
		super.addShape(name, shape);
		const convex = this.convexShapes.get(shape);
        const physicsShapes = [];
		for (let i = 0; i < convex.length; i++) {
			const physicsShape = convex[i].toPhysicsShape();
			this.body.addShape(physicsShape);
			physicsShapes.push(physicsShape);
		}
		this.physicsShapes.set(shape, physicsShapes);
    }
	removeShape(name) {
		const shape = super.removeShape(name);
        const physics = this.physicsShapes.get(shape);
		for (let i = 0; i < physics.length; i++) this.body.removeShape(physics[i]);
		this.physicsShapes.delete(shape);
		return shape;
	}
	onAddScript(script) {
        super.onAddScript(script);
        if (script.implements("CollideRule")) this.hasCollideRule = true;
	}
    collideBasedOnRule(e) {
        let judgement = [];
        for (let m of this.scripts) {
            judgement.push(m.scriptCollideRule(m, e));
        }
        return !judgement.includes(false);
    }
    stop() {
        this.body.velocity.mul(0);
        this.body.angularVelocity = 0;
    }
    mobilize() {
        this.mobile = true;
    }
    immobilize() {
        this.mobile = false;
    }
    beforePhysicsStep() {
        let dx = !this.body.position.x.equals(this.transform.position.x);
        let dy = !this.body.position.y.equals(this.transform.position.y);
        let dtheta = !this.body.angle.equals(this.transform.rotation);
        if (dx) this.body.position.x = this.transform.position.x;
        if (dy) this.body.position.y = this.transform.position.y;
        if (dtheta) this.body.angle = this.transform.rotation;
        if (dx || dy || dtheta) this.body.invalidateModels();
    }
    afterPhysicsStep() {
        this.transform.position.x = this.body.position.x;
        this.transform.position.y = this.body.position.y;
        this.transform.rotation = this.body.angle;
        this.updateCaches();
    }
    moveTowards(point, ferocity = 1) {
        let dif = point.Vminus(this.transform.position);
        this.velocity.Vadd(dif.Ntimes(ferocity / 100));
    }
    moveAwayFrom(point, ferocity = 1) {
        let dif = this.transform.position.Vminus(point);
        this.velocity.Vadd(dif.Ntimes(ferocity / 100));
    }
    applyImpulseMass(point, force) {
        this.applyImpulse(point, force.times(this.body.mass));
    }
    applyImpulse(point, force) {
        this.body.applyImpulse(point.toPhysicsVector(), force.toPhysicsVector());
        this.body.wake();
    }
}