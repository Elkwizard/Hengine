/**
 * Represents a multidimensional vector.
 * @abstract
 * @prop Number mag | The magnitude of the vector
 * @prop Number sqrMag | The squared magnitude of the vector
 * @prop Vector normalized | The unit vector in the same direction of the vector
 * @prop Vector inverse | The vector in the opposite direction with the same magnitude
 */
class Vector extends Operable {
	constructor() {
		super();
	}
	set sqrMag(a) {
		this.mag = Math.sqrt(a);
	}
	get sqrMag() {
		return this.dot(this);
	}
	set mag(m) {
		return this.mul(m / this.mag);
	}
	get mag() {
		return Math.sqrt(this.sqrMag);
	}
	set normalized(a) {
		a.times(this.mag, this);
	}
	get normalized() {
		return this.get().normalize();
	}
	set inverse(a) {
		this.set(a).invert();
	}
	get inverse() {
		return this.times(-1);
	}
	/**
	 * Inverts the vector in-place and returns the caller.
	 * @return Vector
	 */
	invert() {
		return this.mul(-1);
	}
	compare(v1, v2) {
		return (v1.dot(this) > v2.dot(this)) ? v1 : v2;
	}
	/**
	 * Normalizes the vector in-place and returns the caller.
	 * @return Vector
	 */
	normalize() {
		const { mag } = this;
		if (mag > 0) return this.div(mag);
		return this;
	}
	/**
	 * Computes the dot product between the caller and another vector.
	 * @param Vector other | The vector to take the dot product with 
	 * @return Number
	 */
	dot(v) {
		const { modValues } = this.constructor;

		let result = 0;
		for (let i = 0; i < modValues.length; i++) {
			const field = modValues[i];
			result += this[field] * v[field];
		}

		return result;
	}
	/**
	 * Computes the projection of the caller onto another vector.
	 * Doesn't mutate the caller.
	 * @param Vector other | The vector to project the caller onto
	 * @return Vector
	 */
	projectOnto(v) {
		return v.times(this.dot(v) / v.sqrMag);
	}
	bestFit(v) {
		let d1 = this.dot(v);
		let d2 = this.inverse.dot(v);
		if (d2 < d1) return this.inverse;
		else return this.get();
	}
	/**
	 * Converts the vector to a human readable String representation.
	 * @return String
	 */
	toString() {
		return `\u27e8 ${this.values.join(", ")} \u27e9`;
	}
	toFixed(digits) {
		return this.map(v => v.toFixed(digits)).toString();
	}
	toMaxed(digits) {
		return this.map(v => v.toMaxed(digits)).toString();
	}
	/**
	 * Computes the distance between two vectors. 
	 * @param Vector a | The first vector
	 * @param Vector b | The second vector
	 * @return Number
	 */
	static dist(a, b) {
		return a.minus(b).mag;
	}
	/**
	 * Computes the squared distance between two vectors. 
	 * @param Vector a | The first vector
	 * @param Vector b | The second vector
	 * @return Number
	 */
	static sqrDist(a, b) {
		return a.minus(b).sqrMag;
	}
}
Vector.modValues = [];
/**
 * Represents a 2D vector.
 * ```js
 * const i = new Vector2(1, 0);
 * const j = new Vector2(0, 1);
 * console.log(i.dot(j)); // 0
 * console.log(i.cross(j)); // 1
 * console.log(i.plus(j).normalize()); // (1/√2, 1/√2)
 * ```
 * @prop Number angle | The clockwise (in screen-space) angle of the vector from the horizontal
 * @prop Vector2 normal | The vector with the same magnitude but perpendicular direction. Right-handed (in screen-space)
 * @static_prop String[] modValues | The modifiable elements of the vector, `["x", "y"]`
 */
class Vector2 extends Vector {
	/**
	 * Creates a new Vector2.
	 * @param Number x | The x component
	 * @param Number y | The y component
	 */
	constructor(x, y = x) {
		super();
		this.x = x;
		this.y = y;
	}
	set angle(angle) {
		const M = this.mag;
		if (M) {
			this.x = Math.cos(angle) * M;
			this.y = Math.sin(angle) * M;
		}
	}
	get angle() {
		return Math.atan2(this.y, this.x);
	}
	set normal(a) {
		let normNorm = new Vector2(-a.y, a.x);
		normNorm.mag = this.mag;
		this.x = normNorm.x;
		this.y = normNorm.y;
		return this;
	}
	get normal() {
		return new Vector2(-this.y, this.x);
	}
	get sqrMag() {
		return this.x * this.x + this.y * this.y;
	}
	set mag(m) {
		const { mag } = this;
		if (mag) {
			const factor = m / mag;
			this.x *= factor;
			this.y *= factor;
		}
	}
	get mag() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}
	get inverse() {
		return new Vector2(-this.x, -this.y);
	}
	get(result = new Vector2()) {
		result.x = this.x;
		result.y = this.y;
		return result;
	}
	equals(v) {
		if (this === v) return true;
		if (v === undefined || v.constructor !== Vector2) return false;
		const { EPSILON } = Operable;
		return Math.abs(this.x - v.x) < EPSILON && Math.abs(this.y - v.y) < EPSILON;
	}
	op(v, e) {
		if (typeof v === "number") {
			this.x = e(this.x, v);
			this.y = e(this.y, v);
		} else {
			this.x = e(this.x, v.x);
			this.y = e(this.y, v.y);
		}
		return this;
	}
	/**
	 * Rotates the vector clockwise (in screen-space). This operation is in-place and returns the caller.
	 * @param Number angle | The amount (in radians) to rotate by
	 * @return Vector2
	 */
	rotate(angle) {
		let cos = Math.cos(angle);
		let sin = Math.sin(angle);
		let t_x = this.x;
		let t_y = this.y;
		this.x = t_x * cos - t_y * sin;
		this.y = t_x * sin + t_y * cos;
		return this;
	}
	/**
	 * Returns a copy of the vector rotated clockwise (in screen-space) by a specified angle.
	 * @param Number angle | The amount (in radians) to rotate by 
	 * @return Vector2
	 */
	rotated(angle) {
		let cos = Math.cos(angle);
		let sin = Math.sin(angle);
		return new Vector2(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
	}
	dot(v) {
		return this.x * v.x + this.y * v.y;
	}
	/**
	 * Returns the 2D "cross product" (x1 * y2 - y1 * x2) between the caller and another vector.
	 * @param Vector2 v | The second vector in the product 
	 * @return Number
	 */
	cross(v) {
		return this.x * v.y - this.y * v.x;
	}
	projectOnto(v, result) {
		let u = this;
		let dot = u.x * v.x + u.y * v.y;
		let mag2 = v.x ** 2 + v.y ** 2;
		let k = dot / mag2;
		return v.times(k, result);
	}
	normalize() {
		let m = this.mag;
		if (m) {
			this.x /= m;
			this.y /= m;
		}
		return this;
	}
	invert() {
		this.x = -this.x;
		this.y = -this.y;
		return this;
	}
	Vplus(v) {
		return new Vector2(this.x + v.x, this.y + v.y);
	}
	Vminus(v) {
		return new Vector2(this.x - v.x, this.y - v.y);
	}
	Vtimes(v) {
		return new Vector2(this.x * v.x, this.y * v.y);
	}
	Vover(v) {
		return new Vector2(this.x / v.x, this.y / v.y);
	}
	VmodBy(v) {
		return new Vector2(this.x % v.x, this.y % v.y);
	}
	Nplus(v) {
		return new Vector2(this.x + v, this.y + v);
	}
	Nminus(v) {
		return new Vector2(this.x - v, this.y - v);
	}
	Ntimes(v) {
		return new Vector2(this.x * v, this.y * v);
	}
	Nover(v) {
		return new Vector2(this.x / v, this.y / v);
	}
	NmodBy(v) {
		return new Vector2(this.x % v, this.y % v);
	}
	Vadd(v) {
		this.x += v.x;
		this.y += v.y;
		return this;
	}
	Vsub(v) {
		this.x -= v.x;
		this.y -= v.y;
		return this;
	}
	Vmul(v) {
		this.x *= v.x;
		this.y *= v.y;
		return this;
	}
	Vdiv(v) {
		this.x /= v.x;
		this.y /= v.y;
		return this;
	}
	Vmod(v) {
		this.x %= v.x;
		this.y %= v.y;
		return this;
	}
	Nadd(v) {
		this.x += v;
		this.y += v;
		return this;
	}
	Nsub(v) {
		this.x -= v;
		this.y -= v;
		return this;
	}
	Nmul(v) {
		this.x *= v;
		this.y *= v;
		return this;
	}
	Ndiv(v) {
		this.x /= v;
		this.y /= v;
		return this;
	}
	Nmod(v) {
		this.x %= v;
		this.y %= v;
		return this;
	}
	toPhysicsVector() {
		return new PhysicsVector(this.x, this.y);
	}
	static fromPhysicsVector(v) {
		return new Vector2(v.x, v.y);
	}
	/**
	 * @group static get left, static get right, static get up, static get down
	 * Returns a new unit vector pointing in a specified direction (in screen-space).
	 * @return Vector2
	 */
	static get left() {
		return new Vector2(-1, 0);
	}
	static get right() {
		return new Vector2(1, 0);
	}
	static get up() {
		return new Vector2(0, -1);
	}
	static get down() {
		return new Vector2(0, 1);
	}
	/**
	 * Returns a new vector with both components initialized to 0.
	 * @return Vector2
	 */
	static get origin() {
		return new Vector2(0, 0);
	}
	/**
	 * Creates a vector with a specified x component and a y component of 0.
	 * @param Number x | The x coordinate
	 * @return Vector2
	 */
	static x(x) {
		return new Vector2(x, 0);
	}
	/**
	 * Creates a vector with a specified y component and an x component of 0.
	 * @param Number y | The y coordinate
	 * @return Vector2
	 */
	static y(y) {
		return new Vector2(0, y);
	}
	/**
	 * Creates a unit vector with a specified clockwise (in screen-space) angle from the horizontal.
	 * @param Number angle | The angle of the vector
	 * @return Vector2
	 */
	static fromAngle(a) {
		let x = Math.cos(a);
		let y = Math.sin(a);
		return new Vector2(x, y);
	}
	static fromPoint(p) {
		return new Vector2(p.x || 0, p.y || 0);
	}
}
Vector2.modValues = ["x", "y"];

/**
 * Represents a 3D vector.
 * @prop Number angle[UV] | The counter-clockwise angle of the vector from the horizontal on the U-V plane. e.g. `vec.angleXY` or `vec.angleYZ`
 * @static_prop String[] modValues | The modifiable elements of the vector, `["x", "y", "z"]`
 */
class Vector3 extends Vector {
	/**
	 * Creates a new Vector3.
	 * @param Number x | The x component
	 * @param Number y | The y component
	 * @param Number z | The z component
	 */
	constructor(x, y = x, z = x) {
		super();
		this.x = x;
		this.y = y;
		this.z = z;
	}
	/**
	 * Returns the cross product between the caller and another vector.
	 * @param Vector3 v | The second vector in the product 
	 * @return Number
	 */
	cross(v, result = new Vector3()) {
		const u = this;
		result.x = u.y * v.z - u.z * v.y;
		result.y = u.z * v.x - u.x * v.z;
		result.z = u.x * v.y - u.y * v.x;
		return result;
	}
	/**
	 * @name rotate[UV]
	 * Rotates the vector counter-clockwise on the U-V plane. This operation is in-place and returns the caller.
	 * e.g. `vec.rotateYZ(0.1)`
	 * @param Number angle | The amount (in radians) to rotate by
	 * @return Vector3
	 */
	/**
	 * @name rotated[UV]
	 * Returns a copy of the vector rotated counter-clockwise on the U-V plane.
	 * @param Number angle | The amount (in radians) to rotate by
	 * @return Vector3
	 */
	/**
	 * Rotates the vector counter-clockwise in-place about a specified axis.
	 * Returns the caller.
	 * @param Vector3 axis | The axis to rotate about
	 * @param Number angle | The angle to rotate by 
	 * @return Vector3
	 */
	rotateAboutAxis(axis, angle) {
		const randomVectorX = (axis.x === 0 && axis.y === 0 && axis.z !== 0) ? 1 : 0;
		const randomVectorZ = 1 - randomVectorX;

		let xAxisX = axis.y * randomVectorZ;
		let xAxisY = axis.z * randomVectorX - axis.x * randomVectorZ;
		let xAxisZ = -axis.y * randomVectorX;

		const iXAxisMagnitude = 1 / Math.sqrt(xAxisX ** 2 + xAxisY ** 2 + xAxisZ ** 2);

		xAxisX *= iXAxisMagnitude;
		xAxisY *= iXAxisMagnitude;
		xAxisZ *= iXAxisMagnitude;

		let yAxisX = axis.y * xAxisZ - axis.z * xAxisY;
		let yAxisY = axis.z * xAxisX - axis.x * xAxisZ;
		let yAxisZ = axis.x * xAxisY - axis.y * xAxisX;

		const iYAxisMagnitude = 1 / Math.sqrt(yAxisX ** 2 + yAxisY ** 2 + yAxisZ ** 2);

		yAxisX *= iYAxisMagnitude;
		yAxisY *= iYAxisMagnitude;
		yAxisZ *= iYAxisMagnitude;

		const x = xAxisX * this.x + xAxisY * this.y + xAxisZ * this.z;
		const y = yAxisX * this.x + yAxisY * this.y + yAxisZ * this.z;

		this.x -= xAxisX * x + yAxisX * y;
		this.y -= xAxisY * x + yAxisY * y;
		this.z -= xAxisZ * x + yAxisZ * y;

		const c = Math.cos(angle);
		const s = Math.sin(angle);

		const xPrime = x * c - y * s;
		const yPrime = x * s + y * c;

		this.x += xAxisX * xPrime + yAxisX * yPrime;
		this.y += xAxisY * xPrime + yAxisY * yPrime;
		this.z += xAxisZ * xPrime + yAxisZ * yPrime;

		return this;
	}
	/**
	 * Returns a copy of the vector rotated counter-clockwise about a specified axis.
	 * @param Vector3 axis | The axis to rotate about
	 * @param Number angle | The angle to rotate by 
	 * @return Vector3
	 */
	rotatedAboutAxis(axis, angle, result) {
		return this.get(result).rotateAboutAxis(axis, angle);
	}
	/**
	 * @group static get left, static get right, static get up, static get down, static get forward, static get backward
	 * Returns a new unit vector pointing in the specified direction.
	 * @return Vector3
	 */
	static get left() {
		return new Vector3(-1, 0, 0);
	}
	static get right() {
		return new Vector3(1, 0, 0);
	}
	static get up() {
		return new Vector3(0, -1, 0);
	}
	static get down() {
		return new Vector3(0, 1, 0);
	}
	static get forward() {
		return new Vector3(0, 0, 1);
	}
	static get backward() {
		return new Vector3(0, 0, -1);
	}
	/**
	 * Returns a new vector with all components equal to 0.
	 * @return Vector3
	 */
	static get origin() {
		return new Vector3(0, 0, 0);
	}
	/**
	 * Creates a vector with a specified x component and a y and z component of 0.
	 * @param Number x | The x coordinate
	 * @return Vector3
	 */
	static x(x) {
		return new Vector4(x, 0, 0);
	}
	/**
	 * Creates a vector with a specified y component and an x and z component of 0.
	 * @param Number y | The y coordinate
	 * @return Vector3
	 */
	static y(y) {
		return new Vector4(0, y, 0);
	}
	/**
	 * Creates a vector with a specified z component and an x and z component of 0.
	 * @param Number z | The z coordinate
	 * @return Vector3
	 */
	static z(z) {
		return new Vector4(0, 0, z);
	}
	static fromPoint(p) {
		return new Vector3(p.x || 0, p.y || 0, p.z || 0);
	}
}

Vector3.modValues = ["x", "y", "z"];

/**
 * Represents a 4D vector.
 * @prop Number angle[UV] | The counter-clockwise angle of the vector from the horizontal on the U-V plane. e.g. `vec.angleYZ` or `vec.angleYW`
 * @static_prop String[] modValues | The modifiable elements of the vector, `["x", "y", "z", "w"]`
 */
class Vector4 extends Vector {
	/**
	 * Creates a new Vector4.
	 * @param Number x | The x component
	 * @param Number y | The y component
	 * @param Number z | The z component
	 * @param Number w | The w component
	 */
	constructor(x, y = x, z = x, w = x) {
		super();
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;
	}
	
	/**
	 * @name rotate[UV]
	 * Rotates the vector counter-clockwise on the U-V plane. This operation is in-place and returns the caller.
	 * e.g. `vec.rotateZW(0.3)`
	 * @param Number angle | The amount (in radians) to rotate by
	 * @return Vector4
	 */
	/**
	 * @name rotated[UV]
	 * Returns a copy of the vector rotated counter-clockwise on the U-V plane.
	 * @param Number angle | The amount (in radians) to rotate by
	 * @return Vector4
	 */

	/**
	 * @group static get left, static get right, static get up, static get down, static get forward, static get backward, static get before, static get after
	 * Returns a new unit vector pointing in the specified direction.
	 * @return Vector4
	 */
	static get left() {
		return new Vector4(-1, 0, 0, 0);
	}
	static get right() {
		return new Vector4(1, 0, 0, 0);
	}
	static get up() {
		return new Vector4(0, -1, 0, 0);
	}
	static get down() {
		return new Vector4(0, 1, 0, 0);
	}
	static get forward() {
		return new Vector4(0, 0, 1, 0);
	}
	static get backward() {
		return new Vector4(0, 0, -1, 0);
	}
	static get before() {
		return new Vector4(0, 0, 0, -1);
	}
	static get after() {
		return new Vector4(0, 0, 0, 1);
	}
	/**
	 * Returns a new vector with all components equal to 0.
	 * @return Vector4
	 */
	static get origin() {
		return new Vector4(0, 0, 0, 0);
	}
	/**
	 * Creates a vector with a specified x component and a y, z, and w component of 0.
	 * @param Number x | The x coordinate
	 * @return Vector4
	 */
	static x(x) {
		return new Vector4(x, 0, 0, 0);
	}
	/**
	 * Creates a vector with a specified y component and an x, z, and w component of 0.
	 * @param Number y | The y coordinate
	 * @return Vector4
	 */
	static y(y) {
		return new Vector4(0, y, 0, 0);
	}
	/**
	 * Creates a vector with a specified z component and an x, z, and w component of 0.
	 * @param Number z | The z coordinate
	 * @return Vector4
	 */
	static z(z) {
		return new Vector4(0, 0, z, 0);
	}
	/**
	 * Creates a vector with a specified w component and an x, y, and z component of 0.
	 * @param Number w | The w coordinate
	 * @return Vector4
	 */
	static w(w) {
		return new Vector4(0, 0, 0, w);
	}
}
Vector4.modValues = ["x", "y", "z", "w"];
//isNaN
(function () {
	const nN = window.isNaN.bind(window);
	window.isNaN = function (n) {
		if (n instanceof Vector) {
			if (n instanceof Vector2) return nN(n.x) || nN(n.y);
			if (n instanceof Vector3) return nN(n.x) || nN(n.y) || nN(n.z);
			if (n instanceof Vector4) return nN(n.x) || nN(n.y) || nN(n.z) || nN(n.w);
		}
		return nN(n);
	}
})();


(function () {
	// angles for Vector3 and Vector4

	const combinations = [
		["x", "y"],
		["x", "z"],
		["x", "w"],
		["y", "z"],
		["y", "w"],
		["z", "w"]
	];

	function proto(obj, name, value) {
		Object.defineProperty(obj, name, {
			value,
			enumerable: false
		});
	}
	function protoGetSet(obj, name, get, set) {
		Object.defineProperty(obj, name, {
			get,
			set,
			enumerable: false,
		});
	}

	for (let i = 0; i < combinations.length; i++) {
		const [x, y] = combinations[i];
		const XY = x.toUpperCase() + y.toUpperCase();

		function rotateXY(angle) {
			const c = Math.cos(angle);
			const s = Math.sin(angle);
			const t_x = this[x] * c - this[y] * s;
			const t_y = this[x] * s + this[y] * c;
			this[x] = t_x;
			this[y] = t_y;
			return this;
		}

		const rotateXYname = `rotate${XY}`;
		const rotatedXYname = `rotated${XY}`;
		const angleXYname = `angle${XY}`;

		function rotatedXY(angle) {
			return this.get()[rotateXYname](angle);
		}

		function getAngleXY() {
			return Math.atan2(this[y], this[x]);
		}

		function setAngleXY(angle) {
			const M = Math.sqrt(this[x] ** 2 + this[y] ** 2);
			this[x] = Math.cos(angle) * M;
			this[y] = Math.sin(angle) * M;
		}

		proto(Vector4.prototype, rotateXYname, rotateXY);
		proto(Vector4.prototype, rotatedXYname, rotatedXY);
		protoGetSet(Vector4.prototype, angleXYname, getAngleXY, setAngleXY);

		if (y !== "w") {
			proto(Vector3.prototype, rotateXYname, rotateXY);
			proto(Vector3.prototype, rotatedXYname, rotatedXY);
			protoGetSet(Vector3.prototype, angleXYname, getAngleXY, setAngleXY);
		}
	}
})();