/**
 * @type class Spline<Vector = any>
 * Represents a quartic spline with four control points.
 * @prop Vector a | The first control point
 * @prop Vector b | The second control point
 * @prop Vector c | The third control point
 * @prop Vector d | The fourth control point
 */
class Spline {
	/**
	 * Creates a new Spline based on a set of control points.
	 * @param Vector a | The first control point
	 * @param Vector b | The second control point
	 * @param Vector c | The third control point
	 * @param Vector d | The fourth control point
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
	 * @return Vector
	 */
    evaluate(t) {
		const ab = Vector.lerp(this.a, this.b, t);
		const bc = Vector.lerp(this.b, this.c, t);
		const cd = Vector.lerp(this.c, this.d, t);
        return Vector.lerp(
			Vector.lerp(ab, bc, t), Vector.lerp(bc, cd, t), t
		);
    }
}