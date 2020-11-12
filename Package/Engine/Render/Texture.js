class Texture extends ImageType {
	constructor(width, height) {
		super(width, height);
		this.pixels = Array.dim(this.width, this.height).fill(new Color(0, 0, 0, 0));
		this.image = new_OffscreenCanvas(width, height);
		this.c = this.image.getContext("2d");

		//init image data
		let array = new Uint8ClampedArray(4 * this.width * this.height);
		for (let i = 0; i < array.length; i++) array[i] = 0;
		this.imageData = new ImageData(array, this.width, this.height);

		this.changed = false;
		this.loops = false;
	}
	get brightness() {
		return this.pixels.map(col => col.brightness);
	}
	get red() {
		return this.pixels.map(col => col.red);
	}
	get green() {
		return this.pixels.map(col => col.green);
	}
	get blue() {
		return this.pixels.map(col => col.blue);
	}
	get alpha() {
		return this.pixels.map(col => col.alpha);
	}
	*[Symbol.iterator]() {
		for (let i = 0; i < this.width; i++) for (let j = 0; j < this.height; j++) yield this.pixels[i][j];
	}
	toString() {
		function channelPair(a, b) {
			let charCode = a << 8 | b;
			return String.fromCharCode(charCode);
		}
		function color(col) {
			return channelPair(col.red, col.green) + channelPair(col.blue, col.alpha * 255);
		}
		function column(col) {
			return col.map(e => color(e)).join("");
		}
		function toString(tex) {
			let result = tex.width + "," + tex.height + ":";
			for (let i = 0; i < tex.pixels.length; i++) result += column(tex.pixels[i]);
			return result;
		}
		return toString(this);
	}
	clear() {
		let height = this.pixels[0].length;
		let width = this.pixels.length;
		for (let i = 0; i < width; i++) for (let j = 0; j < height; j++) this.act_set(i, j, Color.BLANK);
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
	shader(fn) {
		let coms = [];
		for (let i = 0; i < this.width; i++) for (let j = 0; j < this.height; j++) coms.push([i, j, fn(i, j)]);
		for (let i = 0; i < coms.length; i++) this.shader_set(coms[i][0], coms[i][1], coms[i][2]);
		this.changed = true;
		return this;
	}
	act_get(x, y) {
		return this.pixels[x][y];
	}
	act_add(x, y, clr) {
		let t = clr.alpha;
		if (clr.alpha !== 1) {
			let c1 = this.act_get(x, y);
			if (c1.alpha) {
				let col = new Color(clr.red * t + c1.red * (1 - t), clr.green * t + c1.green * (1 - t), clr.blue * t + c1.blue * (1 - t));
				this.act_set(x, y, col);
			} else this.act_set(x, y, clr);
		} else this.act_set(x, y, clr);
	}
	shader_set(x, y, clr) {
		this.pixels[x][y] = clr;
		let inx = (y * this.width + x) * 4;
		let data = this.imageData.data;
		data[inx] = clr.red;
		data[inx + 1] = clr.green;
		data[inx + 2] = clr.blue;
		data[inx + 3] = clr.alpha * 255;
	}
	act_set(x, y, clr) {
		this.changed = true;
		this.shader_set(x, y, clr);
	}
	setPixel(x, y, clr) {
		if (this.pixels[x] && this.pixels[x][y]) this.act_set(x, y, clr);
		return;
	}
	blur(amount = 1) {
		let newPixels = this.pixels.map((col, x, y) => {
			let r = 0;
			let g = 0;
			let b = 0;
			let a = 0;
			for (let i = -amount; i <= amount; i++) for (let j = -amount; j <= amount; j++) {
				let col = this.getPixel(x + i, y + j);
				r += col.red;
				g += col.green;
				b += col.blue;
				a += col.alpha;
			}
			r /= 9;
			g /= 9;
			b /= 9;
			a /= 9;
			return new Color(r, g, b, a);
		});
		this.pixels = newPixels;
		this.updateImageData();
	}
	updateImageData() {
		for (let i = 0; i < this.width; i++) for (let j = 0; j < this.height; j++) {
			let inx = 4 * (j * this.width + i);
			let { red, green, blue, alpha } = this.pixels[i][j];
			this.imageData.data[inx] = red;
			this.imageData.data[inx + 1] = green;
			this.imageData.data[inx + 2] = blue;
			this.imageData.data[inx + 3] = alpha * 255;
		}
		this.changed = false;
	}
	makeImage() {
		if (this.changed) {
			this.changed = false;
			this.c.putImageData(this.imageData, 0, 0);
		}
		return this.image;
	}
	stretch(w, h) {
		w = Math.round(w);
		h = Math.round(h);
		let r = new Texture(w, h);
		let w_f = this.width / w;
		let h_f = this.height / h;
		for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) {
			let x = Math.floor(i * w_f);
			let y = Math.floor(j * h_f);
			let tx = (i * w_f) % 1;
			let ty = (j * h_f) % 1;
			let a = this.pixels[x][y];
			let b, c, d;
			if (this.pixels[x + 1]) b = this.pixels[x + 1][y];
			else b = a;
			if (this.pixels[x + 1] && this.pixels[x + 1][y + 1]) d = this.pixels[x + 1][y + 1];
			else d = b;
			if (this.pixels[x][y + 1]) c = this.pixels[x][y + 1];
			else c = a;
			r.shader_set(i, j, Color.quadLerp(a, b, c, d, tx, ty));
		}
		r.changed = true;
		return r;
	}
	clip(x, y, w, h) {
		x = Math.round(x);
		y = Math.round(y);
		let r = new Texture(w, h);
		for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) r.shader_set(i, j, this.getPixel(x + i, y + j));
		r.changed = true;
		return r;
	}
	get() {
		let tex = new Texture(this.width, this.height);
		tex.pixels = this.pixels.map(v => v.get());
		tex.updateImageData();
		tex.changed = true;
		return tex;
	}
	static fromRenderer(renderer, x, y, w, h) {
		if (!x) x = 0;
		if (!y) y = 0;
		if (!w) w = renderer.width;
		if (!h) h = renderer.height;
		if (typeof x === "object") {
			h = x.height;
			w = x.width;
			y = x.y;
			x = x.x;
		}
		x *= devicePixelRatio;
		y *= devicePixelRatio;
		let W = ~~(w * devicePixelRatio);
		let H = ~~(h * devicePixelRatio);
		let imageData = renderer.c.getImageData(x, y, W, H);
		let tex = new Texture(w, h);
		let data = imageData.data;
		for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) {
			let inx = (Math.round(i * devicePixelRatio) + Math.round(j * devicePixelRatio) * W) * 4;
			let r = data[inx + 0];
			let g = data[inx + 1];
			let b = data[inx + 2];
			let a = data[inx + 3] / 255;
			tex.shader_set(i, j, new Color(r, g, b, a));
		}
		tex.changed = true;
		return tex;
	}
	static grayScale(bright) {
		return (new Texture(bright.length, bright[0].length)).shader((x, y) => Color.grayScale(bright[x][y]));
	}
	static colorScale(col, bright) {
		return (new Texture(bright.length, bright[0].length)).shader((x, y) => Color.colorScale(col, bright[x][y]));
	}
	static async fromDataURI(uri, w_o, h_o) {
		let img = new Image();
		img.src = uri;
		let tex;
		return await new Promise(function (resolve, reject) {
			img.onload = function () {
				let canvas = document.createElement("canvas");
				document.body.appendChild(img);
				let style = getComputedStyle(img);
				let w = w_o ? w_o : parseInt(style.width);
				if (w_o && !h_o) h_o = Math.floor(parseInt(style.height) * w_o / parseInt(style.width));
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
				img.outerHTML = "";
				resolve(tex);
			}
		});
	}
	static fromString(str) {
		function inv_channelPair(str) {
			let bin = str.charCodeAt(0);
			let a = bin >> 8;
			let b = bin - (a << 8);
			return [a, b];
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
			//fix pixels
			Array.makeMultidimensional(result);
			tex.pixels = result;
			tex.updateImageData();
			tex.changed = true;
			return tex;
		}
		return inv_toString(str);
	}
}