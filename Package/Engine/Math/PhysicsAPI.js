class CollisionMoniter {
    constructor() {
        this.elements = [];
    }
    get general() {
        return this.elements.map(e => e.element);
    }
    get left() {
        return this.direction(Vector2.left);
    }
    get right() {
        return this.direction(Vector2.right);
    }
    get top() {
        return this.direction(Vector2.up);
    }
    get bottom() {
        return this.direction(Vector2.down);
    }
    extract(moniter) {
        this.elements = moniter.elements.map(e => ({
            dir: e.dir,
            element: e.element
        }));
    }
    clear() {
        this.elements = [];
    }
    add(element, dir) {
        this.elements.push({ element, dir });
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