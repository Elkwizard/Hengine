function physicsAPICollideShapes(a, b) {
    a = a.toPhysicsShape();
	b = b.toPhysicsShape();
	const result = physics.CollisionDetector.collide(a, b);
	a.delete();
	b.delete();
	return result;
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
		const { a, b } = this.physicsConstraint;
		return [Vector2.fromPhysicsVector(a), Vector2.fromPhysicsVector(b)];
    }
	
	/**
	 * Removes the constraint from the simulation.
	 */
    remove() {
        const { physicsEngine } = this.engine.scene;
        physicsEngine.removeConstraint(this.physicsConstraint.id);
    }

	static fromPhysicsConstraint(constraint, engine) {
		return new [Constraint1, Constraint2, Constraint1, Constraint2][constraint.type](constraint, engine);
	}
}

/**
 * Represents a physical constraint between a SceneObject and a fixed point.
 * @prop Vector2 offset | The local-space offset of the constrained point on the object
 * @prop Vector2 point | The fixed point in the constraint
 * @prop Number length | The desired distance between the two constrained points. This is only defined for length constraints
 */
class Constraint1 extends Constraint {
    constructor(physicsConstraint, engine) {
		super(physicsConstraint, engine);
    }
	set length(a) {
		this.physicsConstraint.length = a;
	}
	get length() {
		return this.physicsConstraint.length;
	}
	set offset(a) {
		this.physicsConstraint.offset.set(a.x, a.y);
	}
	get offset() {
		return Vector2.zero.proxy(this.physicsConstraint.offset);
	}
	set point(a) {
		this.physicsConstraint.point.set(a.x, a.y);
	}
	get point() {
		return Vector2.zero.proxy(this.physicsConstraint.point);
	}
	/**
	 * Returns the object in the constraint.
	 * @return SceneObject
	 */
    get body() {
		return PHYSICS.bodyToSceneObject.get(this.physicsConstraint.body.pointer);
	}
}

/**
 * Represents a physical constraint between two SceneObjects.
 * @prop Vector2 offsetA | The local-space offset of the constrained point on the first object
 * @prop Vector2 offsetB | The local-space offset of the constrained point on the second object
 * @prop Boolean staticA | Whether or not the first object should be considered static by the constraint
 * @prop Boolean staticB | Whether or not the second object should be considered static by the constraint
 * @prop Number length | The desired distance between the two constrained points. This is only defined for length constraints
 */
class Constraint2 extends Constraint {
    constructor(physicsConstraint, engine) {
		super(physicsConstraint, engine);
		objectUtils.shortcut(this, this.physicsConstraint, "staticA");
		objectUtils.shortcut(this, this.physicsConstraint, "staticB");
    }
	set length(a) {
		this.physicsConstraint.length = a;
	}
	get length() {
		return this.physicsConstraint.length;
	}
	set offsetA(a) {
		this.physicsConstraint.offsetA.set(a.x, a.y);
	}
	get offsetA() {
		return Vector2.zero.proxy(this.physicsConstraint.offsetA);
	}
	set offsetB(a) {
		this.physicsConstraint.offsetB.set(a.x, a.y);
	}
	get offsetB() {
		return Vector2.zero.proxy(this.physicsConstraint.offsetB);
	}
	/**
	 * Returns the first object in the constraint.
	 * @return SceneObject
	 */
    get bodyA() {
		return PHYSICS.bodyToSceneObject.get(this.physicsConstraint.bodyA.pointer);
    }
	/**
	 * Returns the second object in the constraint.
	 * @return SceneObject
	 */
    get bodyB() {
		return PHYSICS.bodyToSceneObject.get(this.physicsConstraint.bodyB.pointer);
    }
}

/**
 * Represents a collision with another SceneObject.
 * @prop SceneObject element | The object that is being collided with
 * @prop Vector2 direction | A unit vector along the collision normal pointing toward the other object
 * @prop Vector2[] contacts | A list of world-space contact points between the two objects
 * @prop Boolean isTrigger | Indicates whether the object being collided with requested that the collision be a trigger collision. A trigger collision is not resolved
 */
class CollisionData {
    constructor(element, direction, contacts, isTrigger) {
        this.element = element;
        this.direction = direction;
        this.contacts = contacts;
		this.isTrigger = isTrigger;
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
    add(element, dir, contacts, isTrigger) {
        this.elements.set(element, new CollisionData(element, dir, contacts, isTrigger));
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
	 * @param (CollisionData) => Boolean mask | The function that will be passed each collision to determine its eligibility
	 * @return CollisionData[]/null
	 */
    test(test) {
        const result = [];
        for (const [element, data] of this.elements) if (test(data)) result.push(data);
        return result.length ? result : null;
    }
}