class Vector extends Operable {
	constructor() {
		super();
	}
	set mag(m) {
		this.normalize();
		this.mul(m);
		return this;
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
	get normalized() {
		return this.get().normalize();
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
		} else if (v instanceof Matrix) {
			let chk = e(2, 3);
			let action = "times";
			if (chk === 6);
			else if (chk === -1) action = "minus";
			else if (chk === 5) action = "plus";
			let n = this.constructor.fromMatrix(this.toMatrix()[action](v));
			for (let x of this.constructor.modValues) {
				this[x] = n[x];
			}
		}
		return this;
	}
	invert() {
		return this.mul(-1);
	}
	get inverse() {
		return this.times(-1);
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
	cross(V) {
		let u = new Vector3(this.x, this.y || 0, this.z || 0);
		let v = new Vector3(V.x, V.y || 0, V.z || 0);
		return new Vector3(u.y * v.z - u.z * v.y, u.z * v.x - u.x * v.z, u.x * v.y - u.y * v.x);
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
	toMatrix() {
		let count = 0;
		for (let x of this.constructor.modValues) count++;
		let m = new Matrix(count, 1);
		count = 0;
		for (let x of this.constructor.modValues) {
			m.cols[0][count] = this[x];
			count++;
		}
		return m;
	}
	applyMatrix(m) {
		return this.constructor.fromMatrix(m.times(this.toMatrix()));
	}
	static fromMatrix(m) {
		return new this(...m.cols[0]);
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
	constructor(x, y) {
		super();
		this.x = x;
		this.y = y;
	}
	set angle(angle) {
		const M = this.mag;
		if (M) {
			const v = Vector2.fromAngle(angle);
			this.x = v.x * M;
			this.y = v.y * M;
		}
	}
	get angle() {
		return this.getAngle();
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
	getAngle() {
		return Math.atan2(this.y, this.x);
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
	get inverse() {
		return new Vector2(-this.x, -this.y);
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
	constructor(x, y, z) {
		super();
		this.x = x;
		if (y !== undefined) {
			this.y = y;
			this.z = z;
		} else {
			this.y = x;
			this.z = x;
		}
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
	static fromAngle(r, d = Vector3.right) {
		return Matrix.mulPoint(Matrix.rotation(r.x, r.y, r.z), d);
	}
}

Vector3.modValues = ["x", "y", "z"];
class Vector4 extends Vector {
	constructor(x, y, z, w) {
		super();
		this.x = x;
		if (y !== undefined) {
			this.y = y;
			this.z = z;
			this.w = w;
		} else {
			this.y = x;
			this.z = x;
			this.w = x;
		}
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
(function() {
	const nN = window.isNaN.bind(window);
	window.isNaN = function(n) {
		if (n instanceof Vector) {
			if (n instanceof Vector1) return nN(n.x);
			if (n instanceof Vector2) return nN(n.x) || nN(n.y);
			if (n instanceof Vector3) return nN(n.x) || nN(n.y) || nN(n.z);
			if (n instanceof Vector4) return nN(n.x) || nN(n.y) || nN(n.z) || nN(n.w);
		}
		return nN(n);
	}
})();