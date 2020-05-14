class Matrix {
	constructor(height, width) {
		this.cols = [];
		for (let i = 0; i < width; i++) {
			this.cols.push([]);
			for (let j = 0; j < height; j++) {
				this.cols[i].push(0);
			}
		}
	}
	get() {
		let m = new this.constructor(this.cols[0].length, this.cols.length);
		m.cols = this.cols.map(e => e.map(e => e));
		return m;
	}
	plus(v) {
		if (typeof v === "number") return this.get().opNumber(v, (a, b) => a + b);
		else {
			if (v instanceof Vector) v = v.toMatrix();
			return this.get().opMatrix(v, (a, b) => a + b);
		}
	}
	minus(v) {
		if (typeof v === "number") return this.get().opNumber(v, (a, b) => a - b);
		else {
			if (v instanceof Vector) v = v.toMatrix();
			return this.get().opMatrix(v, (a, b) => a - b);
		}
	}
	times(v) {
		if (typeof v === "number") return this.get().opNumber(v, (a, b) => a * b);
		else {
			if (v instanceof Vector) v = v.toMatrix();
			return this.mulMatrix(v);
		}
	}
	map(fn) {
		let g = this.get();
		g.cols = g.cols.map((e, x) => e.map((e, y) => fn(e, x, y)));
		return g;
	}
	reciprocal() {
		return this.map(e => 1 / e);
	}
	opMatrix(n, fn) {
		this.cols = this.cols.map((e, x) => e.map((e, y) => fn(e, n.cols[x][y])));
		return this;
	}
	opNumber(n, fn) {
		this.cols = this.cols.map(e => e.map(e => fn(e, n)));
		return this;
	}  
	mulMatrix(m) {
		let result = new Matrix(this.cols[0].length, m.cols.length);
		for (let c = 0; c < m.cols.length; c++) {
			for (let i = 0; i < this.cols[0].length; i++) {
				let v = 0;
				for (let j = 0; j < this.cols.length; j++) {
					v += m.cols[c][j] * this.cols[j][i];
				}
				result.cols[c][i] = v;
			}
		}
		return result;
	}
	toString() {
		let result = [];
		let vertical = String.fromCharCode(9474);
		let maxLen = this.cols.map(e => Math.max(...e.map(e => e.toString().length)));
		let amountSpaces = [];
		for (let num of maxLen) amountSpaces.push(" ".repeat(num));
		amountSpaces = amountSpaces.join(" ").length + 2;
		let spaces = " ".repeat(amountSpaces);
		for (let i = 0; i < this.cols[0].length; i++) {
			let row = [];
			for (let j = 0; j < this.cols.length; j++) {
				let num = this.cols[j][i].toString();
				num = " ".repeat(maxLen[j] - num.length) + num;
				row.push(num);
			}
			result.push(vertical + " " + row.join(" ") + " " + vertical);
		}
		return String.fromCharCode(9484) + spaces + String.fromCharCode(9488) + "\n" + result.join("\n") + "\n" + String.fromCharCode(9492) + spaces + String.fromCharCode(9496);
	}
	toFixed() {
		return this.map(e => e.toFixed(2)).toString();
	}
	static identity(dim) {
		let m = new Matrix(dim, dim);
		for (let i = 0; i < dim; i++) m.cols[i][i] = 1;
		return m;
	}
	static rotation(angle) {
		let c = Math.cos(angle);
		let s = Math.sin(angle);
		return new Matrix2x2(c, -s, s, c);
	}
}
class Matrix2x2 extends Matrix {
	constructor(m00 = 0, m10 = 0, m01 = 0, m11 = 0) {
		super(2, 2);
		this.cols[0][0] = m00;
		this.cols[1][0] = m10;
		this.cols[0][1] = m01;
		this.cols[1][1] = m11;
	}
}
class Matrix3x3 extends Matrix {
	constructor(m00 = 0, m10 = 0, m20 = 0, m01 = 0, m11 = 0, m21 = 0, m02, m12, m22) {
		super(3, 3);
		this.cols[0][0] = m00;
		this.cols[1][0] = m10;
		this.cols[2][0] = m20;
		this.cols[0][1] = m01;
		this.cols[1][1] = m11;
		this.cols[2][1] = m21;
		this.cols[0][2] = m02;
		this.cols[1][2] = m12;
		this.cols[2][2] = m22;
	}
}
class Matrix4x4 extends Matrix {
	constructor(m00 = 0, m01 = 0, m02 = 0, m03 = 0, m10 = 0, m11 = 0, m12 = 0, m13 = 0, m20 = 0, m21 = 0, m22 = 0, m23 = 0, m30 = 0, m31 = 0, m32 = 0, m33 = 0) {
		super(4, 4);
		this.cols[0][0] = m00;
		this.cols[0][1] = m01;
		this.cols[0][2] = m02;
		this.cols[0][3] = m03;
		this.cols[1][0] = m10;
		this.cols[1][1] = m11;
		this.cols[1][2] = m12;
		this.cols[1][3] = m13;
		this.cols[2][0] = m20;
		this.cols[2][1] = m21;
		this.cols[2][2] = m22;
		this.cols[2][3] = m23;
		this.cols[3][0] = m30;
		this.cols[3][1] = m31;
		this.cols[3][2] = m32;
		this.cols[3][3] = m33;
	}
}
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
		} else if (v instanceof Vector) {
			for (let x in this) {
				this[x] = e(this[x], v[x] || 0);
			}
		} else if (v instanceof Matrix) {
			let n = this.constructor.fromMatrix(this.toMatrix().mul(v));
			for (let x in this) {
				this[x] = n[x];
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
	toMatrix() {
		let count = 0;
		for (let x in this) count++;
		let m = new Matrix(count, 1);
		count = 0;
		for (let x in this) {
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
	static lerp(a, b, t) {
		return a.times(1 - t).plus(b.times(t));
	}
	static abs(v) {
		return v.op(Math.abs.bind(Math), 0);
	}
	static sum(...v) {
		let construct = v.length ? v[0].constructor : this;
		return (new construct(0, 0, 0, 0)).add(...v);
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
		let wrong = remove.length ? Vector.sum(...remove).over(remove.length) : new dir.constructor(0, 0, 0, 0);
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
