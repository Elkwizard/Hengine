class Vector {
	constructor() {

	}
	set mag(m) {
		this.normalize();
		this.mul(m);
		return this;
	}
	get mag() {
		let sum = 0;
		for (let x in this) {
			if (typeof this[x] !== "number") continue;
			let i = 0;
			let j = this[x];
			let dif = i - j;
			sum += dif ** 2;
		}
		let dist = Math.sqrt(sum);
		return dist;
	}
	op(e, v) {
		if (typeof v === "number") {
			for (let x in this) {
				this[x] = e(this[x], v);
			}
		} else {
			for (let x in this) {
				this[x] = e(this[x], v[x] || 0);
			}
		}
		return this;
	}
	add(...vl) {
		for (let v of vl) this.op((a, b) => a + b, v);
		return this;
	}
	sub(...vl) {
		for (let v of vl) this.op((a, b) => a - b, v);
		return this;
	}
	mul(...vl) {
		for (let v of vl) this.op((a, b) => a * b, v);
		return this;
	}
	div(...vl) {
		for (let v of vl) this.op((a, b) => a / b, v);
		return this;
	}
	mod(...vl) {
		for (let v of vl) this.op((a, b) => a % b, v);
		return this;
	}
	plus(...v) {
		let vn = this.get();
		vn.add(...v);
		return vn;
	}
	minus(...v) {
		let vn = this.get();
		vn.sub(...v);
		return vn;
	}
	over(...v) {
		let vn = this.get();
		vn.div(...v);
		return vn;
	}
	times(...v) {
		let vn = this.get();
		vn.mul(...v);
		return vn;
	}
	total() {
		let result = 0;
		for (let n in this) result += this[n];
		return result;
	}
	equals(v) {
		let result = Vector.abs(this.minus(v)).total() < 0.00001;
		// console.log(v.toString() + " == " + this + " --> " + result);
		return result;
	}
	compare(v1, v2) {
		if (v1.dot(this) > v2.dot(this)) return v1;
		return v2;
	}
	normalize() {
		let sum = 0;
		for (let x in this) {
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
		for (let x in this) {
			if (typeof this[x] !== "number") continue;
			this[x] /= dist;
		}
		return this;
	}
	dot(v) {
		let result = 0;
		for (let x in this) result += this[x] * v[x];
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
		let d2 = this.times(-1).dot(v);
		if (d2 < d1) return this.times(-1);
		else return this.get();
	}
	get() {
		return new this.constructor(this.x, this.y, this.z, this.w);
	}
	toString() {
		let ary = [];
		for (let n in this) ary.push(this[n]);
		return "\u27e8 " + ary.join(", ") + " \u27e9"; 
	}
	toFixed(n) {
		let ary = [];
		for (let n in this) ary.push(this[n].toFixed(n));
		return "\u27e8 " + ary.join(", ") + " \u27e9"; 
	}
	static abs(v) {
		return v.op(Math.abs.bind(Math), 0);
	}
	static sum(...v) {
		return (new v[0].constructor(0, 0, 0, 0)).add(...v);
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
		let wrong = remove.length? Vector.sum(...remove).over(remove.length) : new dir.constructor(0, 0, 0, 0);
        return dir.minus(wrong);
	}
}
class Vector1 extends Vector {
	constructor(x) {
		super();
		this.x = x;
	}
	static get origin() {
		return new Vector1(0);
	}
	static random() {
		return new Vector1((Math.random() * 2) - 1);
	}
}
class Vector2 extends Vector {
	constructor(x, y) {
		super();
		this.x = x;
		this.y = y;
	}
	static get origin() {
		return new Vector2(0, 0);
	}
	static random() {
		return new Vector2((Math.random() * 2) - 1, (Math.random() * 2) - 1);
	}
	static fromAngle(a) {
		let x = Math.cos(a);
		let y = Math.sin(a);
		return new Vector2(x, y);
	}
	static fromPoint(p) {
		return new Vector2(p.x, p.y);
	}
    op(e, v) {
		if (typeof v === "number") {
			this.x = e(this.x, v);
            this.y = e(this.y, v);
		} else {
			this.x = e(this.x, v.x);
            this.y = e(this.y, v.y);
		}
		return this;
	}
    dot(v) {
        return this.x * v.x + this.y * v.y;
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
}
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
	static get origin() {
		return new Vector3(0, 0, 0);
	}
	static random() {
		return new Vector3((Math.random() * 2) - 1, (Math.random() * 2) - 1, (Math.random() * 2) - 1);
	}
}
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
	static get origin() {
		return new Vector4(0, 0, 0, 0);
	}
	static random() {
		return new Vector4((Math.random() * 2) - 1, (Math.random() * 2) - 1, (Math.random() * 2) - 1, (Math.random() * 2) - 1);
	}
}
