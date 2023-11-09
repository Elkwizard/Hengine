function physicsAPICollideShapes(shape, shape2) {
    return !!CollisionDetector.collide(
        shape.toPhysicsShape(), new PhysicsVector(0, 0), 1, 0,
        shape2.toPhysicsShape(), new PhysicsVector(0, 0), 1, 0
    );
}

/**
 * Represents a physical constraint between one or more SceneObjects.
 * @abstract
 */
class Constraint {
	constructor(physicsConstraint, engine) {
		this.physicsConstraint = physicsConstraint;
		this.engine = engine;
	}
	
	/**
	 * Returns the world-space location of the constrained points.
	 * @return Vector2[2]
	 */
	get ends() {
        return this.physicsConstraint.ends.map(Vector2.fromPhysicsVector);
    }
	
	/**
	 * Removes the constraint from the simulation.
	 */
    remove() {
        const { physicsEngine } = this.engine.scene;
        physicsEngine.removeConstraint(this.physicsConstraint.id);
    }

	static fromPhysicsConstraint(constraint, engine) {
		return new (constraint instanceof PhysicsConstraint2 ? Constraint2 : Constraint1)(constraint, engine);
	}
}

/**
 * Represents a physical constraint between a SceneObject and a fixed point.
 */
class Constraint1 extends Constraint {
    constructor(physicsConstraint, engine) {
		super(physicsConstraint, engine);
    }
	/**
	 * Returns the object in the constraint.
	 * @return SceneObject
	 */
    get body() {
		return this.physicsConstraint.body.userData.sceneObject;
	}
}

/**
 * Represents a physical constraint between two SceneObjects.
 * @prop Boolean staticA | Whether or not the first object should be considered static by the constraint
 * @prop Boolean staticB | Whether or not the second object should be considered static by the constraint
 */
class Constraint2 extends Constraint {
    constructor(physicsConstraint, engine) {
		super(physicsConstraint, engine);
		Object.shortcut(this, this.physicsConstraint, "staticA");
		Object.shortcut(this, this.physicsConstraint, "staticB");
    }
	/**
	 * Returns the first object in the constraint.
	 * @return SceneObject
	 */
    get bodyA() {
        return this.physicsConstraint.bodyA.userData.sceneObject;
    }
	/**
	 * Returns the second object in the constraint.
	 * @return SceneObject
	 */
    get bodyB() {
        return this.physicsConstraint.bodyB.userData.sceneObject;
    }
}

/**
 * Represents a collision with another SceneObject.
 * @prop SceneObject element | The object that is being collided with
 * @prop Vector2 direction | A unit vector along the collision normal pointing toward the other object
 * @prop Vector2[] contacts | A list of world-space contact points between the two objects
 */
class CollisionData {
    constructor(element, direction, contacts) {
        this.element = element;
        this.direction = direction;
        this.contacts = contacts;
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
            for (const [element, data] of this.elements) elements.push(data);
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
        for (const [element, data] of this.elements)
            if (data.direction.x < -0.2) elements.push(data);
        return elements.length ? elements : null;
    }
	/**
	 * Returns all collisions on the right side of the object. If there are no collisions, this returns null.
	 * @return CollisionData[]/null
	 */
    get right() {
        const elements = [];
        for (const [element, data] of this.elements)
            if (data.direction.x > 0.2) elements.push(data);
        return elements.length ? elements : null;
    }
	/**
	 * Returns all collisions with the top edge of the object. If there are no collisions, this returns null.
	 * @return CollisionData[]/null
	 */
    get top() {
        const elements = [];
        for (const [element, data] of this.elements)
            if (data.direction.y < -0.2) elements.push(data);
        return elements.length ? elements : null;
    }
	/**
	 * Returns all collisions with the bottom edge of the object. If there are no collisions, this returns null.
	 * @return CollisionData[]/null
	 */
    get bottom() {
        const elements = [];
        for (const [element, data] of this.elements)
            if (data.direction.y > 0.2) elements.push(data);
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
    add(element, dir, contacts) {
        this.elements.set(element, new CollisionData(element, dir, contacts));
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
	 * @param Vector2 direction | A unit vector representing the direction to check. This will be interpreted as pointing toward the other object, rather than away
	 * @return CollisionData[]/null
	 */
    direction(d) {
        const result = this.test(data => data.direction.dot(d) > 0.2);
        return result || null;
    }
	/**
	 * Returns all collisions meeting a specific requirement.
	 * If there are no such collisions, this returns null.
	 * @param CollisionData => Boolean mask | The function that will be passed each collision to determine its eligibility
	 * @return CollisionData[]/null
	 */
    test(test) {
        const result = [];
        for (const [element, data] of this.elements) if (test(data)) result.push(data);
        return result.length ? result : null;
    }
}