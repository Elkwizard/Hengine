function physicsPolygonSubdivider(poly) {
    let verts = poly.map(vert => Vector2.fromPhysicsVector(vert));
    let middle = Geometry.getMiddle(verts);
    verts = verts.map(vert => vert.Vminus(middle));
    let list = Geometry.subdividePolygonList(verts).map(verts => verts.map(vert => vert.Vplus(middle)));
    return list.map(verts => Polygon.removeDuplicates(verts).map(vert => vert.toPhysicsVector()));
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
    extract(monitor) {
        this.elements = monitor.elements.map(e => new CollisionData(e.element, e.direction, e.contacts));
    }
    removeDead() {
        this.elements = this.elements.filter(el => !el.element.isDead);
        this.physicsObjects = this.elements.map(el => el.element);
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