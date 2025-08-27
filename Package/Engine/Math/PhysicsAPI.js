function physicsAPICollideShapes(a, b) {
    const aPhys = a.toPhysicsShape();
	const bPhys = b.toPhysicsShape();
	const physics = a instanceof Shape2D ? Physics2 : Physics3;
	const result = physics.Detector.testCollide(aPhys, bPhys);
	aPhys.delete();
	bPhys.delete();
	return result;
}

/**
 * Represents a physical constraint between one or more SceneObjects.
 * @abstract
 */
class Constraint {
	constructor(physicsConstraint, physics) {
		this.physicsConstraint = physicsConstraint;
		this.physics = physics;
	}
	
	/**
	 * Returns the World-Space location of the constrained points.
	 * @return VectorN[2]
	 */
	get ends() {
		const { a, b } = this.physicsConstraint;
		return [
			ND.Vector.fromPhysicsVector(a.anchor),
			ND.Vector.fromPhysicsVector(b.anchor)
		];
    }
	
	/**
	 * Removes the constraint from the simulation.
	 */
    remove() {
        this.physics.physicsEngine.removeConstraint(this.physicsConstraint);
    }

	static fromPhysicsConstraint(constraint, physics) {
		if (constraint.a.body.pointer === physics.anchor.pointer)
			return new Constraint1(constraint, physics);
		return new Constraint2(constraint, physics);
	}
}

/**
 * Represents a physical constraint between a SceneObject and a fixed point.
 * @prop VectorN offset | The local-space offset of the constrained point on the object
 * @prop VectorN point | The fixed point in the constraint
 * @prop Number length | The desired distance between the two constrained points. This is only defined for length constraints
 */
class Constraint1 extends Constraint {
    constructor(physicsConstraint, physics) {
		super(physicsConstraint, physics);
    }
	set length(a) {
		this.physicsConstraint.length = a;
	}
	get length() {
		return this.physicsConstraint.length;
	}
	set offset(a) {
		a.toPhysicsVector(this.physicsConstraint.b.offset);
	}
	get offset() {
		return ND.Vector.physicsProxy(this.physicsConstraint.offset);
	}
	set point(a) {
		a.toPhysicsVector(this.physicsConstraint.a.offset);
	}
	get point() {
		return ND.Vector.physicsProxy(this.physicsConstraint.point);
	}
	/**
	 * Returns the object in the constraint.
	 * @return SceneObject
	 */
    get body() {
		return PHYSICS.bodyToSceneObject.get(this.physicsConstraint.b.body.pointer);
	}
}

/**
 * Represents a physical constraint between two SceneObjects.
 * @prop VectorN offsetA | The local-space offset of the constrained point on the first object
 * @prop VectorN offsetB | The local-space offset of the constrained point on the second object
 * @prop Boolean staticA | Whether or not the first object should be considered static by the constraint
 * @prop Boolean staticB | Whether or not the second object should be considered static by the constraint
 * @prop Number length | The desired distance between the two constrained points. This is only defined for length constraints
 */
class Constraint2 extends Constraint {
    constructor(physicsConstraint, physics) {
		super(physicsConstraint, physics);
    }
	set staticA(a) {
		this.physicsConstraint.a.isStatic = a;
	}
	get staticA() {
		return this.physicsConstraint.a.isStatic;
	}
	set staticB(a) {
		this.physicsConstraint.b.isStatic = a;
	}
	get staticB() {
		return this.physicsConstraint.b.isStatic;
	}
	set length(a) {
		this.physicsConstraint.length = a;
	}
	get length() {
		return this.physicsConstraint.length;
	}
	set offsetA(a) {
		a.toPhysicsVector(this.physicsConstraint.a.offset);
	}
	get offsetA() {
		return ND.Vector.physicsProxy(this.physicsConstraint.a.offset);
	}
	set offsetB(a) {
		a.toPhysicsVector(this.physicsConstraint.b.offset);
	}
	get offsetB() {
		return ND.Vector.physicsProxy(this.physicsConstraint.b.offset);
	}
	/**
	 * Returns the first object in the constraint.
	 * @return SceneObject
	 */
    get bodyA() {
		return PHYSICS.bodyToSceneObject.get(this.physicsConstraint.a.body.pointer);
    }
	/**
	 * Returns the second object in the constraint.
	 * @return SceneObject
	 */
    get bodyB() {
		return PHYSICS.bodyToSceneObject.get(this.physicsConstraint.b.body.pointer);
    }
}

/**
 * Represents a collision with another SceneObject.
 * @prop SceneObject element | The object that is being collided with
 * @prop VectorN direction | A unit vector along the collision normal pointing toward the other object
 * @prop VectorN[] contacts | A list of World-Space contact points between the two objects
 * @prop Boolean isTrigger | Indicates whether the object being collided with requested that the collision be a trigger collision. A trigger collision is not resolved
 */
class CollisionData {
    constructor(element, direction, contacts, isTrigger) {
        this.element = element;
        this.direction = direction;
        this.contacts = contacts;
		this.isTrigger = isTrigger;
		this.count = 1;
    }
}

/**
 * Represents a collection of collisions that a SceneObject is undergoing.
 */
class CollisionMonitor {
    constructor() {
        this.elements = new Map();
    }
	/**
	 * Returns all collisions. If there are no collisions, this returns null.
	 * @return CollisionData[]/null
	 */
    get general() {
        if (this.elements.size) {
            const elements = [];
            for (const data of this.elements.values()) elements.push(data);
            return elements;
        }
        return null;
    }
	/**
	 * Returns all collisions on the left side of the object. If there are no collisions, this returns null.
	 * @return CollisionData[]/null
	 */
    get left() {
        const elements = [];
        for (const data of this.elements.values())
            if (data.direction.x < -0.2) elements.push(data);
        return elements.length ? elements : null;
    }
	/**
	 * Returns all collisions on the right side of the object. If there are no collisions, this returns null.
	 * @return CollisionData[]/null
	 */
    get right() {
        const elements = [];
        for (const data of this.elements.values())
            if (data.direction.x > 0.2) elements.push(data);
        return elements.length ? elements : null;
    }
	/**
	 * Returns all collisions with the top edge of the object. If there are no collisions, this returns null.
	 * @return CollisionData[]/null
	 */
    get top() {
        const elements = [];
        for (const data of this.elements.values())
            if (data.direction.y < -0.2) elements.push(data);
        return elements.length ? elements : null;
    }
	/**
	 * Returns all collisions with the bottom edge of the object. If there are no collisions, this returns null.
	 * @return CollisionData[]/null
	 */
    get bottom() {
        const elements = [];
        for (const data of this.elements.values())
            if (data.direction.y > 0.2) elements.push(data);
        return elements.length ? elements : null;
    }
	/**
	 * Returns all collisions on the front (+Z) side of the object.
	 * If there are no collisions, this returns null.
	 * This accessor only works in 3D Mode.
	 * @return CollisionData[]/null
	 */
	get front() {
		const elements = [];
		for (const data of this.elements.values())
			if (data.direction.z > 0.2) elements.push(data);
		return elements.length ? elements : null;
	}
	/**
	 * Returns all collisions on the back (-Z) side of the object.
	 * If there are no collisions, this returns null.
	 * This accessor only works in 3D Mode.
	 * @return CollisionData[]/null
	 */
	get back() {
		const elements = [];
		for (const data of this.elements.values())
			if (data.direction.z < -0.2) elements.push(data);
		return elements.length ? elements : null;
	}
    get(monitor = new CollisionMonitor()) {
        monitor.clear();
        for (const [element, data] of this.elements)
			monitor.add(element, data.direction, data.contacts);
        return monitor;
    }
    removeDead() {
        const newElements = new Map();
        for (const [element, data] of this.elements)
			if (!element.removed) newElements.set(element, data);
        this.elements = newElements;
    }
    clear() {
        this.elements.clear();
    }
    add(element, dir, contacts, isTrigger) {
		const data = this.elements.get(element);
		if (data) {
			data.contacts.pushArray(contacts);
			data.direction
				.mul(data.count++)
				.add(dir)
				.div(data.count);
		} else {
			this.elements.set(element, new CollisionData(element, dir, contacts, isTrigger));
		}
    }
	/**
	 * Checks whether there is a collision with a specific object.
	 * @param SceneObject object | The object to check 
	 * @return Boolean
	 */
    has(el) {
        return this.elements.has(el);
    }
	/**
	 * Returns all collisions where the collision is in a specific direction.
	 * If there are no such collisions, this returns null.
	 * @param VectorN direction | A unit vector representing the direction to check. This will be interpreted as pointing toward the other object, rather than away
	 * @return CollisionData[]/null
	 */
    direction(d) {
        const result = this.test(data => data.direction.dot(d) > 0.2);
        return result || null;
    }
	/**
	 * Returns all collisions meeting a specific requirement.
	 * If there are no such collisions, this returns null.
	 * @param (CollisionData) => Boolean mask | The function that will be passed each collision to determine its eligibility
	 * @return CollisionData[]/null
	 */
    test(test) {
        const result = [];
        for (const data of this.elements.values()) if (test(data)) result.push(data);
        return result.length ? result : null;
    }
}

/**
 * Represents a simulation in which WorldObjects can interact in a "physically accurate" manner. This class should not be constructed, and should instead be accessed via the `.physics` property of Scene.
 * @prop Number airResistance | The proportion of velocity lost to air resistance every frame. Lower values will cause speed to decrease more gradually. Starts as 0.005
 * @prop Boolean collisionEvents | Whether or not collision events will be detected. If this is true, then the `.collide*()` handlers on ElementScripts of colliding objects will be called when collisions begin. Starts as true
 * @prop Number iterations | The number of solver iterations to run each frame. Starts as 10
 * @prop Number contactIterations | The number of contact solver iterations to run per solver iterations. Starts as 4
 * @prop Number constraintIterations | The number of constraint solver iterations to run per solver iteration. Starts as 4
 */
class PhysicsEngine {
	constructor() {
		this.physicsEngine = new Physics.Engine().own();
		this.collisionEvents = true;
		this.anchor = new Physics.RigidBody(false).own();
		objectUtils.shortcut(this, this.physicsEngine, "airResistance", "drag");
		objectUtils.proxyAccess(this, this.physicsEngine, [
			"iterations", "constraintIterations", "contactIterations"
		]);

		this.airResistance = 0.005;
		this.gravity = ND.Vector.y(0.4);
	}
	/**
	 * Sets the gravitational acceleration for the physics engine.
	 * @param VectorN gravity | The new gravitational acceleration
	 */
	set gravity(a) {
		a.toPhysicsVector(this.physicsEngine.gravity);
	}
	/**
	 * Returns the current gravitational acceleration for the physics engine.
	 * This is initially `VectorN.y(0.4)`.
	 * @return VectorN
	 */
	get gravity() {
		return ND.Vector.physicsProxy(this.physicsEngine.gravity);
	}
	/**
	 * Returns all the active constraints in the scene.
	 * @return Constraint[]
	 */
	get constraints() {
		const physicsConstraints = this.physicsEngine.constraintDescriptors;
		const constraints = [];
		for (let i = 0; i < physicsConstraints.length; i++)
			constraints.push(Constraint.fromPhysicsConstraint(
				physicsConstraints.get(i), this
			));

		physicsConstraints.delete();
		
		return constraints;
	}
	/**
	 * Returns all of the WorldObjects in the simulation.
	 * @return WorldObject[]
	 */
	get bodies() {
		const physicsBodies = this.physicsEngine.bodies;
		const bodies = [];
		const map = PHYSICS.bodyToWorldObject;
		for (let i = 0; i < physicsBodies.length; i++)
			bodies.push(map.get(physicsBodies.get(i).pointer));
		return bodies;
	}
	onCollide(a, b, direction, contacts, isTriggerA, isTriggerB) {
		if (a && b) {
			direction = ND.Vector.fromPhysicsVector(direction);
	
			const jsContacts = new Array(contacts.length);
			for (let i = 0; i < jsContacts.length; i++)
				jsContacts[i] = ND.Vector.fromPhysicsVector(contacts.get(i));
			
			a.scripts.PHYSICS.colliding.add(b, direction, jsContacts, isTriggerB);
			b.scripts.PHYSICS.colliding.add(a, direction.inverse, jsContacts, isTriggerA);
		}
	}
	makeConstrained(offset, body) {
		const physicsOffset = offset.toPhysicsVector();
		const physicsBody = body ? body.scripts.PHYSICS.body : this.anchor;
		const constrained = new Physics.Constrained(physicsBody, physicsOffset);
		physicsOffset.delete();
		return constrained;
	}
	/**
	 * Creates a physical constraint that forces the distance between two points on two objects to remain constant.
	 * @param WorldObject a | The first object to constrain. Must have the PHYSICS script
	 * @param WorldObject b | The second object to constrain. Must have the PHYSICS script
	 * @param VectorN aOffset? | The local a-space point where the constraint will attach to the first object. Default is no offset
	 * @param VectorN bOffset? | The local b-space point where the constraint will attach to the second object. Default is no offset
	 * @param Number length? | The distance to enforce between the two points. Default is the current distance between the constrained points
	 * @return Constraint2
	 */
	constrainLength(bodyA, bodyB, aOffset = ND.Vector.zero, bOffset = ND.Vector.zero, length = null) {
		const a = this.makeConstrained(aOffset, bodyA);
		const b = this.makeConstrained(bOffset, bodyB);

		length ??= ND.Vector.dist(
			bodyA ? bodyA.transform.localSpaceToGlobalSpace(aOffset) : a.anchor,
			bodyB.transform.localSpaceToGlobalSpace(bOffset)
		);

		const con = new Physics.LengthConstraintDescriptor(a, b, length);

		a.delete();
		b.delete();

		this.physicsEngine.addConstraint(con);
		return Constraint.fromPhysicsConstraint(con, this);
	}
	/**
	 * Creates a physical constraint that forces the distance between a point on an object and a fixed point to remain constant.
	 * @param WorldObject object | The object to constrain. Must have the PHYSICS script
	 * @param VectorN offset? | The local object-space point where the constraint will attach to the object. Default is no offset
	 * @param VectorN point? | The location to constrain the length to. Default is the current location of the constrained point
	 * @param Number length? | The distance to enforce between the two points. Default is the current distance between the constrained points
	 * @return Constraint1
	 */
	constrainLengthToPoint(body, offset = ND.Vector.zero, point = null, length = null) {
		point ??= body.transform.localToGlobal(offset);
		const constraint = this.constrainLength(null, body, offset, point, length);
		return new Constraint1(constraint.physicsConstraint, this);
	}
	/**
	 * Creates a physical constraint that forces two points on two objects to be in the same location.
	 * @param WorldObject a | The first object to constrain. Must have the PHYSICS script
	 * @param WorldObject b | The second object to constrain. Must have the PHYSICS script
	 * @param VectorN aOffset? | The local a-space point where the constraint will attach to the first object. Default is no offset
	 * @param VectorN bOffset? | The local b-space point where the constraint will attach to the second object. Default is no offset
	 * @return Constraint2
	 */
	constrainPosition(bodyA, bodyB, aOffset = ND.Vector.zero, bOffset = ND.Vector.zero) {
		const a = this.makeConstrained(aOffset, bodyA);
		const b = this.makeConstrained(bOffset, bodyB);

		const con = new Physics.PositionConstraintDescriptor(a, b);

		a.delete();
		b.delete();

		this.physicsEngine.addConstraint(con);
		return Constraint.fromPhysicsConstraint(con, this);
	}
	/**
	 * Creates a physical constraint that forces the a point on an object and a fixed point to remain in the same location.
	 * @param WorldObject object | The object to constrain. Must have the PHYSICS script
	 * @param VectorN offset? | The local object-space point where the constraint will attach to the object. Default is no offset
	 * @param VectorN point? | The location to constrain the length to. Default is the current location of the constrained point
	 * @return Constraint1
	 */
	constrainPositionToPoint(body, offset = ND.Vector.zero, point = null) {
		point ??= body.transform.localToGlobal(offset);
		return this.constrainPosition(null, body, point, offset);
	}
	run() {
		this.physicsEngine.run(1);
	}
}