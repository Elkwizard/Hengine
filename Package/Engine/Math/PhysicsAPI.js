function physicsPolygonSubdivider(input) {
    let poly = new Polygon(input.map(v => Vector2.fromPhysicsVector(v)));
    let list = Geometry.subdividePolygonList(poly.vertices);
    return list.map(verts => Polygon.removeDuplicates(verts).map(vert => vert.toPhysicsVector()));
}
function physicsAPIcollideShapes(shape, shape2) {
    return !!CollisionDetector.collide(
        shape.toPhysicsShape().getModel(new PhysicsVector(0, 0), 1, 0),
        shape2.toPhysicsShape().getModel(new PhysicsVector(0, 0), 1, 0)
    );
}
class Contact {
    constructor(point, penetration) {
        this.point = point;
        this.penetration = penetration;
    }
    static fromPhysicsContact(contact) {
        return new Contact(Vector2.fromPhysicsVector(contact.point), contact.penetration);
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
        this.elements = [];
        this.physicsObjects = [];
    }
    get general() {
        return this.elements.length ? this.elements.map(e => e) : null;
    }
    get left() {
        let els = [];
        for (let i = 0; i < this.elements.length; i++) {
            let el = this.elements[i];
            if (el.direction.x < -0.2) els.push(el);
        }
        return els.length ? els : null;
    }
    get right() {
        let els = [];
        for (let i = 0; i < this.elements.length; i++) {
            let el = this.elements[i];
            if (el.direction.x > 0.2) els.push(el);
        }
        return els.length ? els : null;
    }
    get top() {
        let els = [];
        for (let i = 0; i < this.elements.length; i++) {
            let el = this.elements[i];
            if (el.direction.y < -0.2) els.push(el);
        }
        return els.length ? els : null;
    }
    get bottom() {
        let els = [];
        for (let i = 0; i < this.elements.length; i++) {
            let el = this.elements[i];
            if (el.direction.y > 0.2) els.push(el);
        }
        return els.length ? els : null;
    }
    get(mon = new CollisionMonitor) {
        mon.elements = this.elements.map(e => new CollisionData(e.element, e.direction, e.contacts));
        mon.physicsObjects = this.physicsObjects.map(el => el);
        return mon;
    }
    removeDead() {
        this.elements = this.elements.filter(el => !el.element.removed);
        this.physicsObjects = this.physicsObjects.map(el => !el.removed);
    }
    clear() {
        this.elements = [];
        this.physicsObjects = [];
    }
    add(element, dir, contacts) {
        if (!this.physicsObjects.includes(element)) {
            this.physicsObjects.push(element);
            this.elements.push(new CollisionData(element, dir, contacts));
        }
    }
    has(el) {
        for (let element of this.elements) if (element.element === el) return true;
        return false;
    }
    direction(d) {
        let result = this.test(e => e.direction.dot(d) > 0.2);
        if (result) return result;
        return null;
    }
    test(test) {
        if (!this.elements.length) return null;
        let result = this.elements.filter(test);
        if (result.length > 0) return result;
        else return null;
    }
}