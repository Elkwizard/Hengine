class Vector {
	constructor(){
		
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
	add(v){
		return this.op((a, b) => a + b, v);
	}
	sub(v){
		return this.op((a, b) => a - b, v);
	}
	mul(v){
		return this.op((a, b) => a * b, v);
	}
	div(v){
		return this.op((a, b) => a / b, v);
	}
	mod(v){
		return this.op((a, b) => a % b, v);
	}
	plus(v) {
		let vn = new this.constructor(0, 0, 0, 0);
		vn.add(this);
		vn.add(v);
		return vn;
	}
	minus(v) {
		let vn = new this.constructor(0, 0, 0, 0);
		vn.add(this);
		vn.sub(v);
		return vn;
	}
	over(v) {
		let vn = new this.constructor(0, 0, 0, 0);
		vn.add(this);
		vn.div(v);
		return vn;
	}
	times(v) {
		let vn = new this.constructor(0, 0, 0, 0);
		vn.add(this);
		vn.mul(v);
		return vn;
	}
	normalize(){
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
}
class Vector1 extends Vector {
	constructor(x){
		super();
		this.x = x;
	}
	static random(){
		return new Vector1((Math.random() * 2) - 1);
	}
}
class Vector2 extends Vector {
	constructor(x, y){
		super();
		this.x = x;
		if (y !== undefined) {
			this.y = y;
		} else {
			this.y = x;
		}
	}
	static random(){
		return new Vector2((Math.random() * 2) - 1, (Math.random() * 2) - 1);
	}
	static fromAngle(a) {
		let x = Math.cos(a);
		let y = Math.sin(a);
		return new Vector2(x, y);
	}
	getAngle(){
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
	constructor(x, y, z){
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
	static random(){
		return new Vector3((Math.random() * 2) - 1, (Math.random() * 2) - 1, (Math.random() * 2) - 1);
	}
}
class Vector4 extends Vector {
	constructor(x, y, z, w){
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
	static random(){
		return new Vector4((Math.random() * 2) - 1, (Math.random() * 2) - 1, (Math.random() * 2) - 1, (Math.random() * 2) - 1);
	}
}
