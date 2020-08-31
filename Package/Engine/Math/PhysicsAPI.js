function physicsPolygonSubdivider(poly) {
    let verts = poly.map(vert => Vector2.fromPoint(vert));
    let middle = Geometry.getMiddle(verts);
    verts = verts.map(vert => vert.Vminus(middle));
    let list = Geometry.subdividePolygonList(verts, Geometry.vertexDirection(verts)).map(verts => Geometry.clockwise(verts.map(vert => vert.Vplus(middle))));
    return list.map(verts => verts.map(vert => new PhysicsVector(vert.x, vert.y)));
}
class CollisionMoniter {
    constructor() {
        this.elements = [];
        this.physicsObjects = [];
    }
    get general() {
        return this.elements.map(e => e.element);
    }
    get left() {
        let els = [];
        for (let i = 0; i < this.elements.length; i++) {
            let el = this.elements[i];
            if (el.dir.x < -0.2) els.push(el.element);
        }
        return els.length ? els : null;
    }
    get right() {
        let els = [];
        for (let i = 0; i < this.elements.length; i++) {
            let el = this.elements[i];
            if (el.dir.x > 0.2) els.push(el.element);
        }
        return els.length ? els : null;
    }
    get top() {
        let els = [];
        for (let i = 0; i < this.elements.length; i++) {
            let el = this.elements[i];
            if (el.dir.y < -0.2) els.push(el.element);
        }
        return els.length ? els : null;
    }
    get bottom() {
        let els = [];
        for (let i = 0; i < this.elements.length; i++) {
            let el = this.elements[i];
            if (el.dir.y > 0.2) els.push(el.element);
        }
        return els.length ? els : null;
    }
    extract(moniter) {
        this.elements = moniter.elements.map(e => ({
            dir: e.dir,
            element: e.element
        }));
    }
    removeDead() {
        this.elements = this.elements.filter(el => !el.element.isDead);
        this.physicsObjects = this.elements.map(el => el.element);
    }
    clear() {
        this.elements = [];
        this.physicsObjects = [];
    }
    add(element, dir) {
        if (!this.physicsObjects.includes(element)) {
            this.physicsObjects.push(element);
            this.elements.push({ element, dir });
        }
    }
    has(el) {
        for (let element of this.elements) if (element.element === el) return true;
        return false;
    }
    direction(d) {
        let result = this.objectTest(e => e.dir.dot(d) > 0.2);
        if (result) return result.map(e => e.element);
        return null;
    }
    objectTest(test) {
        if (!this.elements.length) return null;
        let result = this.elements.filter(test);
        if (result.length > 0) return result;
        else return null;
    }
    test(test) {
        if (!this.elements.length) return null;
        let result = this.elements.map(e => e.element).filter(test);
        if (result.length > 0) return result;
        else return null;
    }
}