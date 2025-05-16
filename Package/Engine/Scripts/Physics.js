Physics.onCollide = (a, b, direction, contacts, triggerA, triggerB) => {
	a = PHYSICS.bodyToSceneObject.get(a.pointer);
	const { scene } = a.engine;
	if (!scene.collisionEvents) return;
	
	b = PHYSICS.bodyToSceneObject.get(b.pointer);

	scene.handleCollisionEvent(a, b, direction, contacts, triggerA, triggerB);
};

Physics.collisionRule = (a, b) => {
	const { bodyToSceneObject } = PHYSICS;
	a = bodyToSceneObject.get(a.pointer);
	b = bodyToSceneObject.get(b.pointer);
	return	a.scripts.PHYSICS.collideBasedOnRule(b);
};

Physics.triggerRule = (a, b) => {
	const { bodyToSceneObject } = PHYSICS;
	a = bodyToSceneObject.get(a.pointer);
	b = bodyToSceneObject.get(b.pointer);
	return a.scripts.PHYSICS.triggerBasedOnRule(b);
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
 * @prop Number mass | The mass of the object. Setting this will change the density
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
	init(obj, mobile) {
		this.engine = obj.container.engine;
		this.scene = this.engine.scene;
		this.physicsEngine = this.scene.physicsEngine;
		
		this.body = new Physics.RigidBody(mobile).solidify();
		if (obj.name === "player") this.body.name = 7;
		
		PHYSICS.bodyToSceneObject.set(this.body.pointer, obj);

		// monitors
        this.colliding = new CollisionMonitor();
        this.lastColliding = new CollisionMonitor();

		this.physicsShapes = new Map();
		for (const [name, shape] of obj.shapes) this.addShape(name, shape);

		const { body } = this;
		
		// links/shortcuts
		this._velocity = VectorN.physicsProxy(body.velocity.linear);
		if (IS_3D)
			this._angularVelocity = VectorN.physicsProxy(body.velocity.orientation.rotation);
		
		objectUtils.shortcut(this, body, "simulated");
		objectUtils.shortcut(this, body, "isTrigger");
		objectUtils.shortcut(this, body, "canCollide");
		objectUtils.shortcut(this, body, "canRotate");
		objectUtils.shortcut(this, body, "gravity");
		objectUtils.shortcut(this, body, "friction");
		objectUtils.shortcut(this, body, "density");
		objectUtils.shortcut(this, body, "airResistance", "drag");
		
		this.beforePhysics();

		obj.sync(() => {
			// update things that should have already been done
			if (obj.scripts.implements("triggerRule"))
				body.trivialTriggerRule = false;
			if (obj.scripts.implements("collideRule"))
				body.trivialCollisionRule = false;

			this.physicsEngine.addBody(body);
		});
	}
	/**
	 * Retrieves a list of copies of all the constraints on the object.
	 * @return Constraint[]
	 */
	get constraints() {
		const physicsConstraints = this.body.constraintDescriptors;
		const constraints = [];
		for (let i = 0; i < physicsConstraints.length; i++)
			constraints.push(Constraint.fromPhysicsConstraint(
				physicsConstraints.get(i), this.sceneObject.engine
			));

		physicsConstraints.delete();
		
		return constraints;
	}
	set velocity(a) {
		a.toPhysicsVector(this.body.velocity.linear);
	}
	get velocity() {
		return this._velocity;
	}
	set angularVelocity(a) {
		if (IS_3D) {
			a.toPhysicsVector(this.body.velocity.orientation.rotation);
		} else {
			this.body.velocity.orientation.rotation = a;
		}
	}
	get angularVelocity() {
		if (IS_3D) {
			return this._angularVelocity;
		} else {
			return this.body.velocity.orientation.rotation;
		}
	}
	set mobile(a) {
        this.body.dynamic = !!a;
	}
	get mobile() {
		return this.body.dynamic;
	}
	set mass(a) {
		const { body } = this;
		body.density *= a / body.mass;
	}
	get mass() {
		return this.body.mass;
	}
	/**
	 * Retrieves the moment of inertia for the object.
	 * @return Number
	 */
	get inertia() {
		if (IS_3D) return Matrix3.fromPhysicsMatrix(this.body.inertia);
		return this.body.inertia;
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
        const physicsShapes = this.physicsShapes.get(shape);
		for (let i = 0; i < physicsShapes.length; i++)
			this.body.removeShape(physicsShapes[i]);
		this.physicsShapes.delete(shape);
		return shape;
	}
	cleanUp(obj) {
		this.cleanedUp = true;
		PHYSICS.bodyToSceneObject.delete(this.body.pointer);
		this.physicsEngine.removeBody(this.body);
	}
	addScript(obj, script) {
		if (script.implements("collideRule"))
			this.body.trivialCollisionRule = false;
		if (script.implements("triggerRule"))
			this.body.trivialTriggerRule = false;
	}
	beforePhysics(obj) {
		// clear collisions
		this.colliding.removeDead();
		
		// update last colliding
		this.colliding.get(this.lastColliding);
		this.colliding.clear();

		// sync position
		const { linear, orientation } = this.body.position;
		obj.transform.position.toPhysicsVector(linear);
		if (IS_3D) {
			obj.transform.rotation.toPhysicsVector(orientation.rotation);
		} else {
			orientation.rotation = obj.transform.rotation;
		}
	}
	afterPhysics(obj) {
		const { position } = obj.transform;

		const { linear, orientation } = this.body.position;
		VectorN.fromPhysicsVector(linear, position);
		if (IS_3D) {
			VectorN.fromPhysicsVector(orientation.rotation, obj.transform.rotation);
		} else {
			obj.transform.rotation = orientation.rotation;
		}
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
		const pointPhysics = point.toPhysicsVector();
		const forcePhysics = force.toPhysicsVector();
		this.body.applyImpulse(pointPhysics, forcePhysics);
		pointPhysics.delete();
		forcePhysics.delete();
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
		this.velocity = this.velocity.times(0);
		this.angularVelocity = this.angularVelocity.times(0);
	}
	collideBasedOnRule(obj, element) {
		return obj.scripts.check(true, "collideRule", element);
	}
	triggerBasedOnRule(obj, element) {
		return obj.scripts.check(false, "triggerRule", element);
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
		const descriptors = this.body.constraintDescriptors;
		
		try {
			for (let i = 0; i < descriptors.length; i++)
				if (descriptors.get(i).hasBody(body))
					return true;
			
			return false;
		} finally {
			descriptors.delete();		
		}
	}
}
PHYSICS.directions = [
	["left", "collideLeft"],
	["right", "collideRight"],
	["top", "collideTop"],
	["bottom", "collideBottom"],
	["general", "collideGeneral"],	
];