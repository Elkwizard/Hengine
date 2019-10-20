class Vector {
	constructor(){
		
	}
	setMagnitude(m) {
		this.normalize();
		this.mul(m);
		return this;
	}
	add(v){
		if (typeof v === "number") {
			for (let x in this) {
				this[x] += v;
			}
		} else {
			for (let x in this) {
				this[x] += v[x] || 0;
			}
		}
		return this;
	}
	sub(v){
		if (typeof v === "number") {
			for (let x in this) {
				this[x] -= v;
			}
		} else {
			for (let x in this) {
				this[x] -= v[x] || 0;
			}
		}
		return this;
	}
	mul(v){
		if (typeof v === "number") {
			for (let x in this) {
				this[x] *= v;
			}
		} else {
			for (let x in this) {
				this[x] *= v[x] || 0;
			}
		}
		return this;
	}
	div(v){
		if (typeof v === "number") {
			for (let x in this) {
				this[x] /= v;
			}
		} else {
			for (let x in this) {
				this[x] /= v[x] || 0;
			}
		}
		return this;
	}
	mod(v){
		if (typeof v === "number") {
			for (let x in this) {
				this[x] %= v;
			}
		} else {
			for (let x in this) {
				this[x] %= v[x] || 0;
			}
		}
		return this;
	}
	normalize(){
		let sum = 0;
		for (let x in this) {
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
			this[x] /= dist;
		}
		return this;
	}
}
class Vector1 extends Vector{
	constructor(x){
		super();
		this.x = x;
	}
	static random(){
		return new Vector1(Math.random());
	}
}
class Vector2 extends Vector{
	constructor(x, y){
		super();
		this.x = x;
		this.y = y;
	}
	getAngle(){
		return Math.atan2(this.y, this.x);
	}
	static random(){
		return new Vector2(Math.random(), Math.random());
	}
	static fromAngle(a) {
		let x = Math.cos(a);
		let y = Math.sin(a);
		return new Vector2(x, y);
	}
}
class Vector3 extends Vector{
	constructor(x, y, z){
		super();
		this.x = x;
		this.y = y;
		this.z = z;
	}
	static random(){
		return new Vector3(Math.random(), Math.random(), Math.random());
	}
}
class Vector4 extends Vector{
	constructor(x, y, z, w){
		super();
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;
	}
	static random(){
		return new Vector4(Math.random(), Math.random(), Math.random(), Math.random());
	}
}
