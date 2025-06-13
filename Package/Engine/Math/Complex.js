/**
 * @name class Complex
 * @implements MathObject
 * Represents a complex number of the form a + bi, where a and b are real numbers.
 * Multiplication and division (`times`, `over`, `mul`, `div`) are defined as they typically are for complex numbers, rather than the element-wise version provided by Operable.
 * @prop Number real | The real component of the number (a)
 * @prop Number imaginary | The imaginary component of the number (b)
 * @prop Number angle | The argument of the number
 * @prop Number norm | The length of the number
 * @prop Number sqrNorm | The squared length of the number
 */
class Complex extends MathObject {
	/**
	 * Creates a new complex number.
	 * @param Number real | The real component of the number
	 * @param Number imaginary? | The imaginary component of the number. Default is 0 
	 */
	constructor(real, imaginary = 0) {
		super();
		this.real = real;
		this.imaginary = imaginary.get();
	}
	set angle(a) {
		const { norm } = this;
		this.real = Math.cos(a) * norm;
		this.imaginary = Math.sin(a) * norm;
	}
	get angle() {
		return Math.atan2(this.imaginary, this.real);
	}
	set norm(a) {
		this.mul(a / (this.norm || 1));
	}
	get norm() {
		return Math.sqrt(this.sqrNorm);
	}
	set sqrNorm(a) {
		this.norm = Math.sqrt(a);
	}
	get sqrNorm() {
		return this.real.sqrMag + this.imaginary.sqrMag;
	}
	/**
	 * Returns the complex conjugate of the number. For a number a + bi, the conjugate would be a - bi.
	 * @return Complex
	 */
	get conjugate() {
		return new this.constructor(this.real, this.imaginary.inverse);
	}
	get inverse() {
		return this.conjugate;
	}
	get(result = this.constructor.zero) {
		result.real = this.real;
		result.imaginary = this.imaginary.get();
		return result;
	}
	flip() {
		this.imaginary = this.imaginary.mul(-1);
		this.div(this.real.sqrMag + this.imaginary.sqrMag);
		return this;
	}
	equals(other) {
		return this.real.equals(other.real) && this.imaginary.equals(other.imaginary);
	}
	plus(other, dst = this.constructor.zero) {
		if (typeof other === "number") {
			dst.set(this);
			dst.real += other;
		} else {
			dst.real = this.real + other.real;
			dst.imaginary = this.imaginary.plus(other.imaginary, dst.imaginary);
		}
		return dst;
	}
	times(other, dst = this.constructor.zero) {
		if (typeof other === "number") {
			dst.real = this.real * other;
			dst.imaginary = this.imaginary * other;
		} else {
			const real = this.real * other.real - this.imaginary * other.imaginary;
			const imaginary = this.real * other.imaginary + this.imaginary * other.real;
			dst.real = real;
			dst.imaginary = imaginary;
		}

		return dst;
	}
	pow(other, dst = this.constructor.zero) {
		const Complex = this.constructor;
		return dst.set(Complex.exp(Complex.log(this).times(other)));
	}
	/**
	 * Rotates a vector by the argument of the caller, and then multiplies it by the length of the caller.
	 * @param Vector2 vector | The vector to rotate
	 * @param Vector2 dst? | The destination to store the resulting vector in. If this is not specified, a new vector will be created 
	 * @return Vector2
	 */
	rotate(vector, dst = new Vector2()) {
		const x = this.real * vector.x - this.imaginary * vector.y;
		const y = this.real * vector.y + this.imaginary * vector.x;
		dst.x = x;
		dst.y = y;
		return dst;
	}
	/**
	 * Returns a matrix such that for a Complex `z` and Vector2 `v`, `z.rotate(v)` is the same as `z.toMatrix().times(v)`.
	 * @param Matrix2 result? | The destination to store the resulting matrix in. If this is not specified, a new matrix will be created
	 * @return Matrix2
	 */
	toMatrix(result = new Matrix2()) {
		return Matrix2.create(
			this.real, -this.imaginary,
			this.imaginary, this.real,
			result
		);
	}
	/**
	 * Returns a unit complex number with a given angle to the real axis.
	 * @param Number angle | The argument of the number to create
	 * @return Complex
	 */
	static fromRotation(angle) {
		return new Complex(Math.cos(angle), Math.sin(angle));
	}
	/**
	 * Returns the imaginary unit, i.
	 * @return Complex
	 */
	static get i() {
		return new Complex(0, 1);
	}
	/**
	 * Computes the complex logarithm of a given value.
	 * @param Complex value | The value to take the complex logarithm of
	 * @return Complex
	 */
	static log(a) {
		return new Complex(Math.log(a.norm), a.angle);
	}
	/**
	 * Computes the result of raising E to a given power.
	 * @param Complex exponent | The power to raise E to 
	 * @return Complex
	 */
	static exp(a) {
		return Complex.polar(a.imaginary, Math.exp(a.real));
	}
	/**
	 * Creates a complex number of the form re<sup>iθ</sup>.
	 * @param Number θ | The argument (angle) of the complex number
	 * @param Number r? | The length of the complex number. Default is 1
	 * @return Complex
	 */
	static polar(θ, r = 1) {
		return this.fromRotation(θ).mul(r);
	}
	static get zero() {
		return new this(0);
	}
}

{
	const methods = ["toString", "toFixed", "toMaxed"];
	for (let i = 0; i < methods.length; i++) {
		const method = methods[i];
		Complex.prototype[method] = function (arg) {
			if (method === "toString") arg = undefined;
			return `${this.real[method](arg)} + ${this.imaginary[method](arg)}i`;
		};
	}
}

/**
 * Represents a quaternion, a 4D extension of the imaginary numbers.
 * Each quaternion is a number of the form a + bi + cj + dk.
 * These can be used to represent 3D rotations via `Quaternion.fromRotation()` and `Quaternion.prototype.rotate()`.
 * @prop Number real | The real component of the quaternion
 * @prop Vector3 imaginary | The imaginary components of the quaternion. Each element of this vector corresponds to a coefficient on one of the imaginary units
 * @prop Vector3 angle | The quaternion's axis of rotation multiplied by its angle of rotation. Only defined for rotation-representing quaternions
 */
class Quaternion extends Complex {
	/**
	 * Creates a new quaternion.
	 * @param Number real | The real component of the quaternion.
	 * @param Vector3 imaginary? | The imaginary components of the quaternion. Default is (0, 0, 1).
	 */
	constructor(real, imaginary = new Vector3(0, 0, 1)) {
		super(real, imaginary);
	}
	set angle(a) {
		this.set(Quaternion.fromRotation(a));
	}
	get angle() {
		const { mag } = this.imaginary;
		const phi = Math.atan2(mag, this.real);
		return this.imaginary.over(mag || 1).mul(phi * 2);
	}
	times(other, dst = new Quaternion()) {
		if (typeof other === "number") {
			dst.real = this.real * other;
			this.imaginary.times(other, dst.imaginary);
		} else {
			const real = this.real * other.real - this.imaginary.dot(other.imaginary);
			const prod1 = other.imaginary.times(this.real);
			const prod2 = this.imaginary.times(other.real);
			const cross = this.imaginary.cross(other.imaginary);
			prod1.add(prod2).plus(cross, dst.imaginary);
			dst.real = real;
		}

		return dst;
	}
	/**
	 * Returns the imaginary components of the product of the caller, the provided vector, and the caller's conjugate (q(0, v)q*).
	 * For quaternions created with `Quaternion.fromRotation()`, this corresponds to a 3D rotation.
	 * @param Vector3 vector | The vector to rotate
	 * @param Vector3 dst? | The destination to store the resulting vector in. If this is not specified, a new vector will be created 
	 * @return Vector3
	 */
	rotate(vector, dst = new Vector3()) {
		const { real, imaginary } = this;
		const scaled = vector.times(real * real - imaginary.sqrMag);
		const imag = imaginary.times(2 * imaginary.dot(vector));
		const cross = imaginary.cross(vector).mul(2 * real);
		return scaled.add(imag).plus(cross, dst);
	}
	/**
	 * Returns a matrix such that for a Quaternion `q` and Vector3 `v`, `q.rotate(v)` is the same as `q.toMatrix().times(v)`.
	 * @param Matrix3 result? | The destination to store the resulting matrix in. If this is not specified, a new matrix will be created
	 * @return Matrix3
	 */
	toMatrix(result = new Matrix3()) {
		return new Matrix3(
			this.rotate(new Vector3(1, 0, 0)),
			this.rotate(new Vector3(0, 1, 0)),
			this.rotate(new Vector3(0, 0, 1))
		).get(result);
	}
	/**
	 * Returns the first quaternion unit, i.
	 * @return Quaternion
	 */
	static get i() {
		return new Quaternion(0, new Vector3(1, 0, 0));
	}
	/**
	 * Returns the second quaternion unit, j.
	 * @return Quaternion
	 */
	static get j() {
		return new Quaternion(0, new Vector3(0, 1, 0));
	}
	/**
	 * Returns the third quaternion unit, k.
	 * @return Quaternion
	 */
	static get k() {
		return new Quaternion(0, new Vector3(0, 0, 1));
	}
	/**
	 * Returns a unit quaternion `q` such that for a Vector3 `v`, `q.rotate(v)` refers to `v` rotated counter-clockwise about the given axis by the given angle.
	 * @signature
	 * @param Vector3 axis | The normalized axis of rotation
	 * @param Number angle | The counter-clockwise angle of rotation
	 * @signature
	 * @param Vector3 rotation | A vector with length equal to the angle of rotation and direction equal to the axis of rotation
	 * @return Quaternion
	 */
	static fromRotation(axis, angle) {
		if (angle === undefined) {
			angle = axis.mag;
			axis = axis.over(angle || 1);
		}

		const phi = angle / 2;
		return new Quaternion(Math.cos(phi), axis.times(Math.sin(phi)));
	}
	static log(a) {
		return new Quaternion(Math.log(a.norm), a.angle.over(2));
	}
	static exp(a) {
		return Quaternion.fromRotation(a.imaginary.times(2)).times(Math.exp(a.real));
	}
}