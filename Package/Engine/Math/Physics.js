class Collision {
    constructor(collides = false, a = null, b = null, Adir = new Vector2(0, 0), Bdir = new Vector2(0, 0), penetration = 0, impulseA, impulseB, collisionPoint) {
        this.colliding = collides;
        this.Adir = Adir;
        this.Bdir = Bdir;
        this.a = a;
        this.b = b;
        this.penetration = penetration;
        this.impulseA = impulseA;
        this.impulseB = impulseB;
        this.collisionPoint = collisionPoint;
    }
}
class Impulse {
    constructor(force = new Vector2(0, 0), source = new Vector2(0, 0)) {
        this.force = force;
        this.source = source;
    }
}
class Range {
    constructor(min = Infinity, max = -Infinity) {
        this.min = min;
        this.max = max;
    }
    include(a) {
        if (a < this.min) this.min = a;
        if (a > this.max) this.max = a;
    }
    static intersect(a, b) {
        return a.min < b.max && b.min < a.max;
    }
}
class Link {
    constructor(start, end, fer) {
        this.start = start;
        this.end = end;
        this.ferocity = fer;
    }
    fix() {
        let l = new Line(this.start.middle, this.end.middle);
        let d = g.f.getDistance(l.a, l.b);
        d = clamp(d / 10, 0, 20);
        d *= this.ferocity;
        let dir = new Vector2(this.end.middle.x - this.start.middle.x, this.end.middle.y - this.start.middle.y);
        dir.normalize();
        let p = l.midPoint;
        let cps = Geometry.closestPointOnRectangle(p, this.start);
        let cpe = Geometry.closestPointOnRectangle(p, this.end);
        // this.start.applyImpulse(new Impulse(dir.over(100), cps));
        // this.end.applyImpulse(new Impulse(dir.over(100), cpe));
    }
}