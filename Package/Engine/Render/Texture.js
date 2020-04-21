class Texture {
	constructor(width, height) {
		width = Math.floor(width);
		height = Math.floor(height);
		this.width = width;
		this.height = height;
		this.pixels = [];
		for (let i = 0; i < width; i++) {
			this.pixels.push([]);
			for (let j = 0; j < height; j++) {
				this.pixels[i].push(new Color(0, 0, 0, 0));
			}
		}
		this[Symbol.iterator] = function* () {
			for (let i = 0; i < this.width; i++) for (let j = 0; j < this.height; j++) {
				yield [i, j];
			}
		}
		this.__image = null;
		this.loops = false;
		this.updateImageData();
	}
	static fromString(str) {
		function inv_channel(str) {
			return str.charCodeAt(0);
		}
		function inv_color(str) {
			let tok = str.split("");
			return new Color(inv_channel(tok[0]), inv_channel(tok[1]), inv_channel(tok[2]), inv_channel(tok[3]) / 255);
		}
		function inv_column(str) {
			let result = [];
			let acc = "";
			for (let i = 0; i < str.length; i++) {
				acc += str[i];
				if ((i + 1) % 4 === 0) {
					result.push(inv_color(acc));
					acc = "";
				}
			}
			return result;
		}
		function inv_toString(str) {
			let inx = str.indexOf(":");
			let data = str.slice(inx + 1);
			let header = str.slice(0, inx);
			let sp = header.split(",");
			let w = parseFloat(sp[0]);
			let h = parseFloat(sp[1]);
			let tex = new Texture(w, h);
			let acc = "";
			let result = [];
			for (let i = 0; i < data.length; i++) {
				acc += data[i];        
				if ((i + 1) % (h * 4) === 0) {
					result.push(inv_column(acc));
					acc = "";    
				}
			}
			tex.pixels = result;
			tex.updateImageData();
			return tex;
		}
		return inv_toString(str);
	}
	toString() {
		function channel(v) {
			return String.fromCharCode(Math.floor(v))
		}
		function color(col) {
			return channel(col.red) + channel(col.green) + channel(col.blue) + channel(col.alpha * 255);
		}
		function column(col) {
			return col.map(e => color(e)).join("");
		}
		function toString(tex) {
			let result = tex.width + "," + tex.height + ":";
			for (let col of tex.pixels) result += column(col);
			return result;
		}
		return toString(this);
	}
	getPixel(x, y) {
		if (this.pixels[x] && this.pixels[x][y]) return this.pixels[x][y];
		else if (!this.loops) return new Color(0, 0, 0, 0);
		else {
			x = (x % this.pixels.length + this.pixels.length) % this.pixels.length;
			y = (y % this.pixels[0].length + this.pixels[0].length) % this.pixels[0].length;
			return this.pixels[x][y];
		}
	}
	setPixel(x, y, clr) {
		if (this.pixels[x] && this.pixels[x][y]) this.pixels[x][y] = clr;
	}
	blur(amount = 1) {
		for (let n = 0; n < amount; n++) for (let [x, y] of this) {
			let colors = [];
			for (let i = -1; i < 2; i++) for (let j = -1; j < 2; j++) {
				colors.push(this.getPixel(x + i, y + j));
			}
			let col = new Color(0, 0, 0, 1);
			col.limited = false;
			for (let color of colors) col.add(color);
			col.div(colors.length);
			this.setPixel(x, y, col);
		}
	}
	updateImageData() {
		let array = new Uint8ClampedArray(4 * this.width * this.height);
		let cntr = 0;
		for (let i = 0; i < this.height; i++) {
			for (let j = 0; j < this.width; j++) {
				let color = this.pixels[j][i];
				array[cntr] = Math.floor(color.red);
				array[cntr + 1] = Math.floor(color.green);
				array[cntr + 2] = Math.floor(color.blue);
				array[cntr + 3] = Math.floor(color.alpha * 255);
				cntr += 4;
			}
		}
		let img = new ImageData(array, this.width, this.height);
		this.imageData = img;
		let x = new Frame(this.width, this.height);
		x.c.c.putImageData(this.imageData, 0, 0);
		this.__image = x;
	}
	requestImage(width, height) {
		if (!this.loops) return this.__image.img;
		else {
			let frame = new OffscreenCanvas(width, height);
			let c = frame.getContext("2d");
			let img = this.__image.img;
			for (let i = 0; i < frame.width / this.width; i++) for (let j = 0; j < frame.height / this.height; j++) {
				c.drawImage(img, i * this.width, j * this.height, this.width, this.height);
			}
			return frame;
		}
	}
}