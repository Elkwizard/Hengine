class GrayMap {
	constructor(w, h, rule) {
		this.data = Array.dim(w, h).map((v, x, y) => rule(x, y));
	}
	static fromString(str) {
		let dim = str.slice(0, str.indexOf(":")).split(",");
		let w = parseInt(dim[0]);
		let h = parseInt(dim[1]);
		let data = str.slice(str.indexOf(":") + 1);
		let dat = [];
		for (let i = 0; i < data.length; i++) {
			let char = data[i].charCodeAt(0);
			let a = char >> 8;
			let b = char & 0x00FF;
			dat.push(a / 255, b / 255);
		}
		return new GrayMap(w, h, (x, y) => dat[x * h + y]);
	}
	toString() {
		let result = `${this.data.length},${this.data[0].length}:`;
		let dat = this.data.flatten();
		for (let i = 0; i < dat.length; i += 2) {
			let a = dat[i] * 255;
			let b = (dat[i + 1] * 255) || 0;
			let v = a << 8 | b;
			result += String.fromCharCode(v);
		}
		return result;
	}
}