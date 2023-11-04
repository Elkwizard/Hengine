/**
 * Represents a quartic spline with four control points.
 * @prop Vector2 a | The first control point
 * @prop Vector2 b | The second control point
 * @prop Vector2 c | The third control point
 * @prop Vector2 d | The fourth control point
 */
class Spline {
	/**
	 * Creates a new Spline based on a set of control points.
	 * @param Vector2 a | The first control point
	 * @param Vector2 b | The second control point
	 * @param Vector2 c | The third control point
	 * @param Vector2 d | The fourth control point
	 */
    constructor(a, b, c, d) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
    }
	/**
	 * Evaluates the point on the spline at a specified parameter value t.
	 * @param Number t | The parameter value
	 * @return Vector2
	 */
    evaluate(t) {
        return Vector2.lerp(Vector2.lerp(Vector2.lerp(this.a, this.b, t), Vector2.lerp(this.b, this.c, t), t), Vector2.lerp(Vector2.lerp(this.b, this.c, t), Vector2.lerp(this.c, this.d, t), t), t);
    }
}