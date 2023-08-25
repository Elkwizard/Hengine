function physicsAPICollideShapes(shape, shape2) {
    return !!CollisionDetector.collide(
        shape.toPhysicsShape(), new PhysicsVector(0, 0), 1, 0,
        shape2.toPhysicsShape(), new PhysicsVector(0, 0), 1, 0
    );
}
class Constraint {
    constructor(physicsConstraint, engine) {
        this.physicsConstraint = physicsConstraint;
        this.engine = engine;
		this.multibody = physicsConstraint instanceof PhysicsConstraint2;
		Object.shortcut(this, this.physicsConstraint, "staticA");
		Object.shortcut(this, this.physicsConstraint, "staticB");
    }
    get ends() {
        return this.physicsConstraint.ends.map(Vector2.fromPhysicsVector);
    }
	get body() {
		return this.physicsConstraint.body.userData.sceneObject;
	}
    get bodyA() {
        return this.physicsConstraint.bodyA.userData.sceneObject;
    }
    get bodyB() {
        return this.physicsConstraint.bodyB.userData.sceneObject;
    }
    remove() {
        const { physicsEngine } = this.engine.scene;
        physicsEngine.removeConstraint(this.physicsConstraint.id);
    }
}
class CollisionData {
    constructor(element, direction, contacts) {
        this.element = element;
        this.direction = direction;
        this.contacts = contacts;
    }
}
class CollisionMonitor {
    constructor() {
        this.elements = new Map();
    }
    get general() {
        if (this.elements.size) {
            const elements = [];
            for (const [element, data] of this.elements) elements.push(data);
            return elements;
        }
        return null;
    }
    get left() {
        const elements = [];
        for (const [element, data] of this.elements)
            if (data.direction.x < -0.2) elements.push(data);
        return elements.length ? elements : null;
    }
    get right() {
        const elements = [];
        for (const [element, data] of this.elements)
            if (data.direction.x > 0.2) elements.push(data);
        return elements.length ? elements : null;
    }
    get top() {
        const elements = [];
        for (const [element, data] of this.elements)
            if (data.direction.y < -0.2) elements.push(data);
        return elements.length ? elements : null;
    }
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
    has(el) {
        return this.elements.has(el);
    }
    direction(d) {
        const result = this.test(data => data.direction.dot(d) > 0.2);
        return result || null;
    }
    test(test) {
        const result = [];
        for (const [element, data] of this.elements) if (test(data)) result.push(data);
        return result.length ? result : null;
    }
}