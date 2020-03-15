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
	static sum(...v) {
		return (new v[0].constructor(0, 0, 0, 0)).plus(...v);
	}
    static prohibitDirections(proDirs, dir) {
        let remove = [];
        for (let proDir of proDirs) {
            let proj = proDir.projectOnto(dir);
			if (proj.dot(dir) < 0) proj.mul(0);
			else proj.mul(dir.mag);
            remove.push(proj);
        }
		let wrong = remove.length? Vector.sum(...remove).over(remove.length) : new dir.constructor(0, 0, 0, 0);
        return dir.minus(wrong);
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
}
class Vector1 extends Vector {
	constructor(x) {
		super();
		this.x = x;
	}
	static random() {
		return new Vector1((Math.random() * 2) - 1);
	}
}
class Vector2 extends Vector {
	constructor(x, y) {
		super();
		this.x = x;
		if (y !== undefined) {
			this.y = y;
		} else {
			this.y = x;
		}
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
	static random() {
		return new Vector4((Math.random() * 2) - 1, (Math.random() * 2) - 1, (Math.random() * 2) - 1, (Math.random() * 2) - 1);
	}
}
