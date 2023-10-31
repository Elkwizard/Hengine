class PHYSICS extends ElementScript {
	init(obj, gravity) {
		this.engine = obj.container.engine;
		this.scene = this.engine.scene;
		this.physicsEngine = this.scene.physicsEngine;
		
		this.body = new RigidBody(obj.transform.position.x, obj.transform.position.y, gravity);
        
		// collide rule
		this.body.userData.sceneObject = obj;
        this.body.collisionFilter = body => {
            const { sceneObject } = body.userData;
			const success = (
				!this.hasCollideRule ||
				this.collideBasedOnRule(sceneObject)
			) && (
				!sceneObject.scripts.PHYSICS.hasCollideRule ||
				sceneObject.scripts.PHYSICS.collideBasedOnRule(obj)
			);

			return success;
        };
		this.body.triggerFilter = body => {
			const { sceneObject } = body.userData;
			const success = (
				this.hasTriggerRule ? this.triggerBasedOnRule(sceneObject) : false
			) || (
				sceneObject.scripts.PHYSICS.hasTriggerRule ? sceneObject.scripts.PHYSICS.triggerBasedOnRule(obj) : false
			);

			return success;
		};

		// monitors
        this.colliding = new CollisionMonitor();
        this.lastColliding = new CollisionMonitor();

		this.physicsShapes = new Map();

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
		Object.shortcut(this, body, "canCollide");
		Object.shortcut(this, body, "canRotate");
		Object.shortcut(this, body, "gravity");
		Object.shortcut(this, body, "friction");
		Object.shortcut(this, body, "density");
		Object.shortcut(this, body, "airResistance");

		obj.sync(() => {
			// update things that should have already been done
			this.hasCollideRule = obj.scripts.implements("collideRule");
			this.hasTriggerRule = obj.scripts.implements("triggerRule");
		
			for (const [name, shape] of obj.shapes) this.addShape(name, shape);

			this.physicsEngine.addBody(this.body);
		});
	}
	get constraints() {
		return this.body.constraints.map(con => new Constraint(con, this.sceneObject.engine));
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
        body.dynamic = !!a;
        if (a) body.wake();
	}
	get mobile() {
		return this.body.dynamic;
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
	cleanUp(obj) {
		this.physicsEngine.removeBody(this.body.id);
	}
	addScript(obj, script) {
		this.hasCollideRule ||= script.implements("collideRule");
		this.hasTriggerRule ||= script.implements("triggerRule");
	}
	beforePhysics(obj) {
		// clear collisions
		this.colliding.removeDead();
		
		if (!(this.physicsEngine.isAsleep(this.body) && this.mobile)) {
			// update last colliding
			this.colliding.get(this.lastColliding);
		
			this.colliding.clear();	
		}

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

		if (this.scene.collisionEvents) {
			const { directions } = PHYSICS;
			const { lastColliding, colliding } = this;
			const lastCollidingCache = lastColliding.get();

			for (let i = 0; i < directions.length; i++) {
				const direction = directions[i][0];
				const now = colliding[direction];
				if (now) {
					const last = new Set();
					const lastArray = lastCollidingCache[direction];
					if (lastArray) for (let j = 0; j < lastArray.length; j++)
						last.add(lastArray[j].element);
					for (let j = 0; j < now.length; j++) {
						const data = now[j];
						if (!last.has(data.element))
							obj.scripts.run(directions[i][1], data);
					}
				}
			}
		}
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
	collideBasedOnRule(obj, element) {
		const scripts = obj.scripts.sortedScriptInstances;
		for (let i = 0; i < scripts.length; i++) {
			const script = scripts[i];
			if (script.scriptSynced && scripts[i].collideRule(element) === false)
				return false;
		}

		return true;
	}
	triggerBasedOnRule(obj, element) {
		const scripts = obj.scripts.sortedScriptInstances;
		for (let i = 0; i < scripts.length; i++) {
			const script = scripts[i];
			if (script.scriptSynced && scripts[i].triggerRule(element) === true)
				return true;
		}

		return false;
	}
	canCollideWith(obj, element) {
		const rb = element.scripts.PHYSICS;
		return this.canCollide && rb.canCollide && this.collideBasedOnRule(element) && rb.collideBasedOnRule(obj);
	}
	constrainedTo(obj, body) {
		body = body.scripts.PHYSICS.body;
		const { constraints } = this.body;
		for (let i = 0; i < constraints.length; i++) {
			const constraint = constraints[i];
			if (constraint.hasBody(body)) return true;
		}
		return false;
	}
}
PHYSICS.directions = [
	["left", "collideLeft"],
	["right", "collideRight"],
	["top", "collideTop"],
	["bottom", "collideBottom"],
	["general", "collideGeneral"],	
];