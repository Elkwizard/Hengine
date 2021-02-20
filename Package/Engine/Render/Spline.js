class Spline {
    constructor(a, b, c, d) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
    }
    evaluate(t) {
        return Vector.lerp(Vector.lerp(Vector.lerp(this.a, this.b, t), Vector.lerp(this.b, this.c, t), t), Vector.lerp(Vector.lerp(this.b, this.c, t), Vector.lerp(this.c, this.d, t), t), t);
    }
}