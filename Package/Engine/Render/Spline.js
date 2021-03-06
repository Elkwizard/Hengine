class Spline {
    constructor(a, b, c, d) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
    }
    evaluate(t) {
        return Vector2.lerp(Vector2.lerp(Vector2.lerp(this.a, this.b, t), Vector2.lerp(this.b, this.c, t), t), Vector2.lerp(Vector2.lerp(this.b, this.c, t), Vector2.lerp(this.c, this.d, t), t), t);
    }
}