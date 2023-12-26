physics.imports.onCollide = (engine, a, b, direction, contacts, triggerA, triggerB) => {
	a = PHYSICS.bodyToSceneObject.get(a);
	const { scene } = a.engine;
	if (!scene.collisionEvents) return;
	
	b = PHYSICS.bodyToSceneObject.get(b);
	direction = Vector2.fromPhysicsVector(new physics.exports.Vector(direction));
	
	contacts = new physics.exports.NativeVectorArray(contacts);
	const jsContacts = new Array(contacts.length);
	for (let i = 0; i < jsContacts.length; i++)
		jsContacts[i] = Vector2.fromPhysicsVector(contacts.get(i));

	scene.handleCollisionEvent(a, b, direction, jsContacts, triggerA, triggerB);
};

physics.imports.collideRule = (a, b) => {
	a = PHYSICS.bodyToSceneObject.get(a);
	b = PHYSICS.bodyToSceneObject.get(b);
	return a.scripts.PHYSICS.collisionFilter(b);
};

physics.imports.triggerRule = (a, b) => {
	a = PHYSICS.bodyToSceneObject.get(a);
	b = PHYSICS.bodyToSceneObject.get(b);
	return a.scripts.PHYSICS.triggerFilter(b);
};

/**
 * Adds rigidbody physics to a SceneObject.
 * @prop Vector2 velocity | The velocity of the object per frame
 * @prop Number angularVelocity | The angular velocity of the object in radians per frame
 * @prop Boolean mobile | Whether or not the object can move or rotate
 * @prop Boolean simulated | Whether or not the object should participate in the simulation at all
 * @prop Boolean gravity | Whether or not gravity should be applied to the object
 * @prop Boolean airResistance | Whether or not air resistance should be applied to the object
 * @prop Boolean canRotate | Whether or not the object can rotate
 * @prop Number mass | The mass of the object
 * @prop Number density | The density of the object. Starts at 1
 * @prop Number friction | The coefficient of friction for the object
 * @prop Number snuzzlement | The proportion of object's velocity lost in a collision
 * @prop Boolean canCollide | Whether the object can collide with any others
 * @prop Boolean isTrigger | Whether the object should cancel all collision resolution, but not detection
 * @prop CollisionMonitor colliding | All of the objects currently colliding with the object
 * @prop CollisionMonitor lastColliding | All of the objects that were colliding with the object last frame
 */
class PHYSICS extends ElementScript {
	static bodyToSceneObject = new Map();
	/**
	 * Adds rigidbody physics to an object.
	 * @param Boolean mobile | Whether the object should be able to move/rotate 
	 */
	init(obj, gravity) {
		this.engine = obj.container.engine;
		this.scene = this.engine.scene;
		this.physicsEngine = this.scene.physicsEngine;
		
		this.body = physics.exports.RigidBody.construct(
			obj.transform.position.x, obj.transform.position.y, gravity
		);
		PHYSICS.bodyToSceneObject.set(this.body.pointer, obj);
		
		// collision rules
        this.collisionFilter = body => this.collideBasedOnRule(body);
		
		this.triggerFilter = body => this.triggerBasedOnRule(body);

		// monitors
        this.colliding = new CollisionMonitor();
        this.lastColliding = new CollisionMonitor();

		this.physicsShapes = new Map();

		// links/shortcuts
		this._velocity = new Vector2();
		delete this._velocity.x;
		delete this._velocity.y;
		const { body } = this;
		const { velocity } = body;
		Object.defineProperties(this._velocity, {
			x: {
				set: a => velocity.x = a,
				get: () => velocity.x
			},
			y: {
				set: a => velocity.y = a,
				get: () => velocity.y
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

		this.synchronized = false;

		obj.sync(() => {
			// update things that should have already been done
			if (obj.scripts.implements("collideRule"))
				body.trivialCollisionFilter = false;
			if (obj.scripts.implements("triggerRule"))
				body.trivialTriggerFilter = false;
		
			for (const [name, shape] of obj.shapes) this.addShape(name, shape);

			this.physicsEngine.addBody(this.body);
			
			this.synchronized = true;
			
			if (this._mass !== undefined)
				this.mass = this._mass;
		});
	}
	/**
	 * Retrieves a list of copies of all the constraints on the object.
	 * @return Constraint[]
	 */
	get constraints() {
		return this.body.constraints.map(con => Constraint.fromPhysicsConstraint(con, this.sceneObject.engine));
	}
	set velocity(a) {
		this.body.velocity.set(a.x, a.y);
	}
	get velocity() {
		return this._velocity;
	}
	set angularVelocity(a) {
		this.body.angularVelocity = a;
	}
	get angularVelocity() {
		return this.body.angularVelocity;
	}
	set mobile(a) {
		const { body } = this;
        body.dynamic = !!a;
	}
	get mobile() {
		return this.body.dynamic;
	}
	set mass(a) {
		if (this.synchronized) {
			const { body } = this;
			const scale = a / body.mass;
			body.mass *= scale;
			body.inertia *= scale;
		} else this._mass = a;
	}
	get mass() {
		return this.synchronized ? this.body.mass : this._mass;
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
		PHYSICS.bodyToSceneObject.delete(this.body.pointer);
		this.physicsEngine.removeBody(this.body.id);
	}
	addScript(obj, script) {
		if (script.implements("collideRule"))
			this.body.trivialCollisionFilter = false;
		if (script.implements("triggerRule"))
			this.body.trivialTriggerFilter = false;
	}
	beforePhysics(obj) {
		// clear collisions
		this.colliding.removeDead();
		
		// update last colliding
		this.colliding.get(this.lastColliding);
		this.colliding.clear();	

		// sync position
		const { position, rotation } = obj.transform;
        this.body.position.set(position.x, position.y);
        this.body.angle = rotation;
        
		if (obj.transform.diff(obj.lastTransform))
			this.body.invalidateModels();
	}
	afterPhysics(obj) {
		const { position } = obj.transform;
		const { x, y } = this.body.position;
        position.x = x;
        position.y = y;
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
	/**
	 * Applies an impulse to a specific point on the object.
	 * @param Vector2 point | The world-space point at which the impulse should be applied
	 * @param Vector2 impulse | The impulse to apply
	 */
	applyImpulse(obj, point, force) {
        this.body.applyImpulse(point.toPhysicsVector(), force.toPhysicsVector());
	}
	/**
	 * Applies an impulse to a specific point on the object.
	 * The impulse will be scaled by the mass of the object.
	 * @param Vector2 point | The world-space point at which the impulse should be applied
	 * @param Vector2 impulse | The impulse to apply, which will be scaled
	 */
	applyImpulseMass(obj, point, force) {
        this.applyImpulse(point, force.times(this.body.mass));
	}
	/**
	 * Stops the object in place. It remains mobile, though it loses all velocity.
	 */
	stop(obj) {
		this.body.stop();
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
	/**
	 * Checks whether the object and another given object would have a trigger collision if they collided.
	 * A trigger collision is not resolved, just detected.
	 * @param SceneObject element | The object to check. Must have PHYSICS
	 * @return Boolean
	 */
	isTriggerWith(obj, element) {
		const rb = element.scripts.PHYSICS;
		return this.isTrigger || rb.isTrigger || this.triggerBasedOnRule(element) || rb.triggerBasedOnRule(obj);
	}
	/**
	 * Checks whether the object and another given object could collide if they intersected.
	 * @param SceneObject element | The object to check. Must have PHYSICS
	 * @return Boolean
	 */
	canCollideWith(obj, element) {
		const rb = element.scripts.PHYSICS;
		return this.canCollide && rb.canCollide && this.collideBasedOnRule(element) && rb.collideBasedOnRule(obj);
	}
	/**
	 * Checks whether there are any constraints between the object and another given object
	 * @param SceneObject other | The object to check. Must have PHYSICS
	 * @return Boolean
	 */
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