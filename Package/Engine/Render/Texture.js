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
		
		//init image data
		let array = new Uint8ClampedArray(4 * this.width * this.height);
		for (let i = 0; i < array.length; i++) array[i] = 0;
		this.imageData = new ImageData(array, this.width, this.height);
		

		this.loops = false;
		this.updateImageData();
	}
	static async fromDataURI(uri, w_o, h_o) {
		let img = new Image();
		img.src = uri;
		let tex;
		return await new Promise(function (resolve, reject) {
			img.onload = function () {
				let canvas = document.createElement("canvas");
				canvas.style.position = "absolute";
				canvas.style.zIndex = "4";
				document.body.appendChild(img);
				let style = getComputedStyle(img);
				let w = w_o ? w_o : parseInt(style.width);
				let h = h_o ? h_o : parseInt(style.height);
				tex = new Texture(w, h);
				canvas.width = w;
				canvas.height = h;
				let ctx = canvas.getContext("2d");
				ctx.imageSmoothingEnabled = false;
				ctx.drawImage(img, 0, 0, w, h);
				let data = ctx.getImageData(0, 0, w, h).data;
				for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) {
					let inx = (j * w + i) * 4;
					let red = data[inx];
					let green = data[inx + 1];
					let blue = data[inx + 2];
					let alpha = data[inx + 3] / 255;
					let col = new Color(red, green, blue, alpha);
					tex.setPixel(i, j, col);
				}
				tex.updateImageData();
				img.outerHTML = "";
				resolve(tex);
			}
		});
	}
	static fromString(str) {
		function inv_channelPair(str) {
			let bin = str.charCodeAt(0) .toString(2);
			bin = "0".repeat(16 - bin.length) + bin;
			let a = parseInt(bin.slice(0, 8), 2);
			let b = parseInt(bin.slice(8), 2);
			return [a, b]
		}
		function inv_color(str) {
			let tok = str.split("");
			let rg = inv_channelPair(tok[0]);
			let ba = inv_channelPair(tok[1]);
			return new Color(rg[0], rg[1], ba[0], ba[1] / 255);
		}
		const col_size = 2;
		function inv_column(str) {
			let result = [];
			let acc = "";
			for (let i = 0; i < str.length; i++) {
				acc += str[i];
				if ((i + 1) % col_size === 0) {
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
				if ((i + 1) % (h * col_size) === 0) {
					result.push(inv_column(acc));
					acc = "";    
				}
			}
			for (let [x, y] of tex) tex.setPixel(x, y, result[x][y]);
			tex.updateImageData();
			return tex;
		}
		return inv_toString(str);
	}
	toString() {
		function channelPair(a, b) {
			let aStr = Math.floor(a).toString(2);
			let bStr = Math.floor(b).toString(2);
			let difA = 8 - aStr.length;
			let difB = 8 - bStr.length;
			return String.fromCharCode(parseInt("0".repeat(difA) + aStr + "0".repeat(difB) + bStr, 2));
		}
		function color(col) {
			return channelPair(col.red, col.green) + channelPair(col.blue, col.alpha * 255);
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
	clear() {
		for (let i = 0; i < this.pixels.length; i++) for (let j = 0; j < this.pixels[0].length; j++) this.act_set(i, j, cl.BLANK);
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
	act_set(x, y, clr) {
		this.pixels[x][y] = clr;
		let inx = (y * this.width + x) * 4;
		let data = this.imageData.data;
		data[inx] = clr.red;
		data[inx + 1] = clr.green;
		data[inx + 2] = clr.blue;
		data[inx + 3] = clr.alpha * 255;
	}
	setPixel(x, y, clr) {
		if (this.pixels[x] && this.pixels[x][y]) this.act_set(x, y, clr);
		return;
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
		let x = new Frame(this.width, this.height);
		x.c.c.putImageData(this.imageData, 0, 0);
		this.__image = x;
	}
	requestImage(width, height) {
		if (!this.loops) {
			return this.__image.img;
		} else {
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