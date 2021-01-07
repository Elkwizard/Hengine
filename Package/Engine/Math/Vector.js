class Vector extends Operable {
	constructor() {
		super();
	}
	set sqrMag(a) {
		this.mag = Math.sqrt(a);
	}
	get sqrMag() {
		let sum = 0;
		for (let x of this.constructor.modValues) {
			if (typeof this[x] !== "number") continue;
			let i = 0;
			let j = this[x];
			let dif = i - j;
			sum += dif ** 2;
		}
		let dist = sum;
		return dist;
	}
	set mag(m) {
		this.normalize();
		this.mul(m);
		return this;
	}
	get mag() {
		let sum = 0;
		for (let x of this.constructor.modValues) {
			if (typeof this[x] !== "number") continue;
			let i = 0;
			let j = this[x];
			let dif = i - j;
			sum += dif ** 2;
		}
		let dist = Math.sqrt(sum);
		return dist;
	}
	set normalized(a) {
		let m = this.mag;
		this.x = a.x * m;
		this.y = a.y * m;
	}
	get normalized() {
		return this.get().normalize();
	}
	set inverse(a) {
		this.x = -a.x;
		this.y = -a.y;
	}
	get inverse() {
		return this.times(-1);
	}
	op(v, e) {
		if (typeof v === "number") {
			for (let x of this.constructor.modValues) {
				this[x] = e(this[x], v);
			}
		} else if (v instanceof Vector) {
			for (let x of this.constructor.modValues) {
				this[x] = e(this[x], v[x] || 0);
			}
		}
		return this;
	}
	invert() {
		return this.mul(-1);
	}
	compare(v1, v2) {
		if (v1.dot(this) > v2.dot(this)) return v1;
		return v2;
	}
	normalize() {
		let sum = 0;
		for (let x of this.constructor.modValues) {
			if (typeof this[x] !== "number") continue;
			let i = 0;
			let j = this[x];
			let dif = i - j;
			sum += dif ** 2;
		}
		let dist = Math.sqrt(sum);
		if (dist <= 0) {
			return this;
		}
		for (let x of this.constructor.modValues) {
			if (typeof this[x] !== "number") continue;
			this[x] /= dist;
		}
		return this;
	}
	dot(v) {
		let result = 0;
		for (let x of this.constructor.modValues) result += this[x] * v[x];
		return result;
	}
	projectOnto(v) {
		return v.times(this.dot(v) / (v.mag ** 2));
	}
	bestFit(v) {
		let d1 = this.dot(v);
		let d2 = this.inverse.dot(v);
		if (d2 < d1) return this.inverse;
		else return this.get();
	}
	toString() {
		let ary = [];
		for (let n of this.constructor.modValues) ary.push(this[n]);
		return "\u27e8 " + ary.join(", ") + " \u27e9";
	}
	toFixed(digits) {
		return this.map(v => v.toFixed(digits)).toString();
	}
	toMaxed(digits) {
		return this.map(v => v.toMaxed(digits)).toString();
	}
	static dist(a, b) {
		return a.minus(b).mag;
	}
	static sqrDist(a, b) {
		return a.minus(b).sqrMag;
	}
	static prohibitDirections(proDirs, dir) {
		let remove = [];
		let mag = dir.mag;
		for (let proDir of proDirs) {
			let dot = proDir.dot(dir);
			if (dot > 0) {
				let bad = dir.times(dot / mag);
				remove.push(bad);
			}
		}
		let wrong = remove.length ? Vector.avg(remove) : new dir.constructor(0, 0, 0, 0);
		return dir.minus(wrong);
	}
}
Vector.modValues = [];
class Vector1 extends Vector {
	constructor(x) {
		super();
		this.x = x;
	}
	static get origin() {
		return new Vector1(0);
	}
	static x(x) {
		return new Vector1(x);
	}
}
Vector1.modValues = ["x"];
class Vector2 extends Vector {
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
		let M = this.mag;
		if (M) {
			this.x /= M / m;
			this.y /= M / m;
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
	equals(v, t = 0.00001) {
		return Math.abs(this.x - v.x) < t && Math.abs(this.y - v.y) < t;
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
	rotate(angle) {
		let cos = Math.cos(angle);
		let sin = Math.sin(angle);
		let t_x = this.x;
		let t_y = this.y;
		this.x = t_x * cos - t_y * sin;
		this.y = t_x * sin + t_y * cos;
		return this;
	}
	rotated(angle) {
		let cos = Math.cos(angle);
		let sin = Math.sin(angle);
		return new Vector2(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
	}
	dot(v) {
		return this.x * v.x + this.y * v.y;
	}
	cross(v) {
		return this.x * v.y - this.y * v.x;
	}
	projectOnto(v) {
		let u = this;
		let dot = u.x * v.x + u.y * v.y;
		let mag2 = v.x ** 2 + v.y ** 2;
		let k = dot / mag2;
		return new Vector2(v.x * k, v.y * k);
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
	toPhysicsVector() {
		return new PhysicsVector(this.x, this.y);
	}
	static fromPhysicsVector(v) {
		return new Vector2(v.x, v.y);
	}
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
	static get origin() {
		return new Vector2(0, 0);
	}
	static x(x) {
		return new Vector2(x, 0);
	}
	static y(y) {
		return new Vector2(0, y);
	}
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
class Vector3 extends Vector {
	constructor(x, y = x, z = x) {
		super();
		this.x = x;
		this.y = y;
		this.z = z;
	}
	cross(v) {
		const u = this;
		return new Vector3(u.y * v.z - u.z * v.y, u.z * v.x - u.x * v.z, u.x * v.y - u.y * v.x);
	}
	rotateAboutAxis(axis, angle) {
		const randomVectorX = (axis.x === 0 && axis.y === 0 && axis.z !== 0) ? 1 : 0;
		const randomVectorZ = 1 - randomVectorX;

		let xAxisX = axis.y * randomVectorZ;
		let xAxisY = axis.z * randomVectorX - axis.x * randomVectorZ;
		let xAxisZ = -axis.y * randomVectorX;

		const xAxisMagnitude = Math.sqrt(xAxisX ** 2 + xAxisY ** 2 + xAxisZ ** 2);

		xAxisX /= xAxisMagnitude;
		xAxisY /= xAxisMagnitude;
		xAxisZ /= xAxisMagnitude;

		let yAxisX = axis.y * xAxisZ - axis.z * xAxisY;
		let yAxisY = axis.z * xAxisX - axis.x * xAxisZ;
		let yAxisZ = axis.x * xAxisY - axis.y * xAxisX;

		const yAxisMagnitude = Math.sqrt(yAxisX ** 2 + yAxisY ** 2 + yAxisZ ** 2);

		yAxisX /= yAxisMagnitude;
		yAxisY /= yAxisMagnitude;
		yAxisZ /= yAxisMagnitude;

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
	static get origin() {
		return new Vector3(0, 0, 0);
	}
	static x(x) {
		return new Vector3(x, 0, 0);
	}
	static y(y) {
		return new Vector3(0, y, 0);
	}
	static z(z) {
		return new Vector3(0, 0, z);
	}
	static fromPoint(p) {
		return new Vector3(p.x || 0, p.y || 0, p.z || 0);
	}
}

Vector3.modValues = ["x", "y", "z"];
class Vector4 extends Vector {
	constructor(x, y = x, z = x, w = x) {
		super();
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;
	}
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
	static get origin() {
		return new Vector4(0, 0, 0, 0);
	}
	static x(x) {
		return new Vector4(x, 0, 0, 0);
	}
	static y(y) {
		return new Vector4(0, y, 0, 0);
	}
	static z(z) {
		return new Vector4(0, 0, z, 0);
	}
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
			if (n instanceof Vector1) return nN(n.x);
			if (n instanceof Vector2) return nN(n.x) || nN(n.y);
			if (n instanceof Vector3) return nN(n.x) || nN(n.y) || nN(n.z);
			if (n instanceof Vector4) return nN(n.x) || nN(n.y) || nN(n.z) || nN(n.w);
		}
		return nN(n);
	}
})();


(function () {
	// angles

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