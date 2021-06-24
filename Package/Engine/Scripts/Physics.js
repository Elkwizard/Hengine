class PHYSICS extends ElementScript {
	init(obj, gravity) {
		this.engine = obj.container.engine;
		this.scene = this.engine.scene;
		this.physicsEngine = this.scene.physicsEngine;
		
		this.body = new RigidBody(obj.transform.position.x, obj.transform.position.y, gravity ? RigidBody.DYNAMIC : RigidBody.STATIC);
        
		// collide rule
		this.body.userData.sceneObject = obj;
        this.body.collisionFilter = body => {
            const { sceneObject } = body.userData;
			const success = (!this.hasCollideRule || obj.collideBasedOnRule(sceneObject)) && (!sceneObject.hasCollideRule || sceneObject.collideBasedOnRule(obj));
			return success;
        };
		this.hasCollideRule = obj.scripts.implements("collideRule");

		// monitors
        this.colliding = new CollisionMonitor();
        this.lastColliding = new CollisionMonitor();

		this.physicsShapes = new Map();

		// update things that should have already been done
		if (obj.active) this.activate();
		for (const [name, shape] of obj.shapes) this.addShape(name, shape);

		// links/shortcuts
		this._velocity = new Vector2();
		delete this._velocity.x;
		delete this._velocity.y;
		const { body } = this;
		Object.defineProperties(this._velocity, {
			x: {
				set(a) {
					body.velocity.x = a;
					body.wake();
				},
				get: () => body.velocity.x
			},
			y: {
				set(a) {
					body.velocity.y = a;
					body.wake();
				},
				get: () => body.velocity.y
			}
		});

		Object.shortcut(this, body, "simulated");
		Object.shortcut(this, body, "isTrigger");
		Object.shortcut(this, body, "gravity");
		Object.shortcut(this, body, "friction");
		Object.shortcut(this, body, "airResistance");
	}
	set velocity(a) {
		const { body } = this;
		body.velocity.x = a.x;
		body.velocity.y = a.y;
		body.wake();
	}
	get velocity() {
		return this._velocity;
	}
	set angularVelocity(a) {
		const { body } = this;
		body.angularVelocity = a;
		body.wake();
	}
	get angularVelocity() {
		return this.body.angularVelocity;
	}
	set mobile(a) {
		const { body } = this;
        body.type = a ? RigidBody.DYNAMIC : RigidBody.STATIC;
        body.gravity = a;
        if (a) body.wake();
	}
	get mobile() {
		return this.body.type !== RigidBody.STATIC;
	}
	set mass(a) {
		const { body } = this;
        const scale = a / body.mass;
        body.mass *= scale;
        body.inertia *= scale;
	}
	get mass() {
		return this.body.mass;
	}
	set snuzzlement(a) {
		this.body.restitution = 1 - a;
	}
	get snuzzlement() {
		return 1 - this.body.restitution;
	}
	addShape(obj, name, shape) {
		const convex = obj.convexShapes.get(shape);
        const physicsShapes = [];
		for (let i = 0; i < convex.length; i++) {
			const physicsShape = convex[i].toPhysicsShape();
			this.body.addShape(physicsShape);
			physicsShapes.push(physicsShape);
		}
		this.physicsShapes.set(shape, physicsShapes);
	}
	removeShape(obj, name, shape) {
        const physics = this.physicsShapes.get(shape);
		for (let i = 0; i < physics.length; i++) this.body.removeShape(physics[i]);
		this.physicsShapes.delete(shape);
		return shape;
	}
	activate(obj) {
        this.physicsEngine.addBody(this.body);
	}
	deactivate(obj) {
        this.physicsEngine.removeBody(this.body.id);
	}
	cleanUp(obj) {
		this.deactivate();
	}
	addScript(obj, script) {
		if (script.implements("collideRule")) this.hasCollideRule = true;
	}
	beforePhysics(obj) {
		// clear collisions
		this.colliding.removeDead();
		if (!(this.physicsEngine.isAsleep(this.body) && this.mobile)) this.colliding.clear();

		// sync position
		const { position, rotation } = obj.transform;
        const dx = !this.body.position.x.equals(position.x);
        const dy = !this.body.position.y.equals(position.y);
        const dtheta = !this.body.angle.equals(rotation);
        if (dx) this.body.position.x = position.x;
        if (dy) this.body.position.y = position.y;
        if (dtheta) this.body.angle = rotation;
        if (dx || dy || dtheta) this.body.invalidateModels();
	}
	afterPhysics(obj) {
		const { position } = obj.transform;
        position.x = this.body.position.x;
        position.y = this.body.position.y;
        obj.transform.rotation = this.body.angle;
        obj.updateCaches();	
	}
	// custom methods
	applyImpulse(obj, point, force) {
        this.body.applyImpulse(point.toPhysicsVector(), force.toPhysicsVector());
        this.body.wake();
	}
	applyImpulseMass(obj, point, force) {
        this.applyImpulse(point, force.times(this.body.mass));
	}
	stop(obj) {
		this.body.stop();
		this.body.wake();
	}
}