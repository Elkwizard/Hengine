class Texture extends ImageType {
	constructor(width, height) {
		super(width, height);
		this.image = new_OffscreenCanvas(width, height);
		this.c = this.image.getContext("2d");

		//init image data
		const array = new Uint8ClampedArray(4 * this.width * this.height);
		for (let i = 0; i < array.length; i++) array[i] = 0;
		this.imageData = new ImageData(array, this.width, this.height);
		this.data = new ByteBuffer(this.imageData.data.buffer);

		this._getPixel = new Color(0, 0, 0, 0);
		this.shaderBackBuffer = new Uint8ClampedArray(4 * this.width * this.height);

		this.loops = false;
	}
	get brightness() {
		const { width, height } = this;
		const result = Array.dim(width, height);
		for (let i = 0; i < width; i++) for (let j = 0; j < height; j++)
			result[i][j] = this.getPixel(i, j, true).brightness;
		return result;
	}
	get red() {
		const { width, height, imageData: { data } } = this;
		const result = Array.dim(width, height);
		let inx = 0;
		for (let j = 0; j < height; j++) for (let i = 0; i < width; i++) {
			result[i][j] = data[inx];
			inx += 4;
		}
		return result;
	}
	get green() {
		const { width, height, imageData: { data } } = this;
		const result = Array.dim(width, height);
		let inx = 0;
		for (let j = 0; j < height; j++) for (let i = 0; i < width; i++) {
			result[i][j] = data[inx + 1];
			inx += 4;
		}
		return result;
	}
	get blue() {
		const { width, height, imageData: { data } } = this;
		const result = Array.dim(width, height);
		let inx = 0;
		for (let j = 0; j < height; j++) for (let i = 0; i < width; i++) {
			result[i][j] = data[inx + 2];
			inx += 4;
		}
		return result;
	}
	get alpha() {
		const { width, height, imageData: { data } } = this;
		const result = Array.dim(width, height);
		let inx = 0;
		for (let j = 0; j < height; j++) for (let i = 0; i < width; i++) {
			result[i][j] = data[inx + 3] / 255;
			inx += 4;
		}
		return result;
	}
	*[Symbol.iterator]() {
		const { width, height } = this;
		for (let i = 0; i < width; i++) for (let j = 0; j < height; j++) yield this.getPixel(i, j, true);
	}
	clear() {
		const { width, height } = this;
		for (let i = 0; i < width; i++) for (let j = 0; j < height; j++) this.setPixel(i, j, Color.BLANK, true);
	}
	validPixel(x, y) {
		return x >= 0 && x < this.width && y >= 0 && y < this.height;
	}
	getPixel(x, y, valid = false) {
		const { _getPixel } = this;

		if (valid || this.validPixel(x, y)) {
			const { data } = this.imageData;
			const inx = (y * this.width + x) * 4;
			_getPixel.red = data[inx];
			_getPixel.green = data[inx + 1];
			_getPixel.blue = data[inx + 2];
			_getPixel.alpha = data[inx + 3] / 255;
			return _getPixel;
		} else if (!this.loops) {
			_getPixel.red = _getPixel.green = _getPixel.blue = _getPixel.alpha = 0;
			return _getPixel;
		} else {
			const { width, height } = this;
			return this.getPixel(
				(x % width + width) % width,
				(y % height + height) % height,
				true
			);
		}
	}
	shader(fn) {
		const dest = new Color(0, 0, 0, 0);

		const { width, height, shaderBackBuffer, imageData: { data } } = this;

		let inx = 0;
		for (let j = 0; j < height; j++) for (let i = 0; i < width; i++) {
			fn(i, j, dest);
			shaderBackBuffer[inx] = dest.red;
			shaderBackBuffer[inx + 1] = dest.green;
			shaderBackBuffer[inx + 2] = dest.blue;
			shaderBackBuffer[inx + 3] = dest.alpha * 255;
			inx += 4;
		}

		for (let i = 0; i < data.length; i++) data[i] = shaderBackBuffer[i];

		this.loaded = false;
		return this;
	}
	shaderSetPixel(x, y, clr) {
		const { data } = this.imageData;
		const inx = (y * this.width + x) * 4;
		data[inx] = clr.red;
		data[inx + 1] = clr.green;
		data[inx + 2] = clr.blue;
		data[inx + 3] = clr.alpha * 255;
	}
	setPixel(x, y, clr, valid = false) {
		if (valid || this.validPixel(x, y)) {
			this.loaded = false;
			this.shaderSetPixel(x, y, clr);
		}
	}
	blur(amount = 1) {
		return this.shader((x, y, dest) => {
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
			dest.set(r, g, b, a);
		});
	}
	stretch(w, h) {
		// TODO: reimplement
	}
	clip(x, y, width, height) {
		if (typeof x === "object") ({ x, y, width, height } = x);
		x = Math.round(x);
		y = Math.round(y);
		return new Texture(width, height)
			.shader((i, j, dest) => dest.set(this.getPixel(x + i, y + j)));
	}
	makeImage() {
		if (!this.loaded) {
			this.loaded = true;
			this.c.putImageData(this.imageData, 0, 0);
		}
		return this.image;
	}
	get(tex = new Texture(this.width, this.height)) {
		if (tex.width !== this.width || tex.height !== this.height) return null;
		tex.imageData = new ImageData(
			this.imageData.data.map(channel => channel),
			this.imageData.width,
			this.imageData.height
		);
		tex.loaded = false;
		return tex;
	}
	static fromImageType(image, x, y, width, height) {
		if (typeof x === "object") ({ x, y, width, height } = x);

		x ??= 0;
		y ??= 0;
		width ??= image.width;
		height ??= image.height

		const img = image.makeImage();
		const canvas = new_OffscreenCanvas(img.width, img.height);
		const context = canvas.getContext("2d");
		context.drawImage(img, 0, 0);

		const ratio = image.pixelRatio;

		x *= ratio;
		y *= ratio;
		const W = img.width;//Math.floor(w * __devicePixelRatio);
		const H = img.height;//Math.floor(h * __devicePixelRatio);
		const imageData = context.getImageData(x, y, W, H);
		const tex = new Texture(width, height);
		const data = imageData.data;
		for (let i = 0; i < width; i++) for (let j = 0; j < height; j++) {
			const inx = (Math.round(i * ratio) + Math.round(j * ratio) * W) * 4;
			const r = data[inx + 0];
			const g = data[inx + 1];
			const b = data[inx + 2];
			const a = data[inx + 3] / 255;
			tex.shaderSetPixel(i, j, new Color(r, g, b, a));
		}
		tex.loaded = false;
		return tex;
	}
	static grayScale(bright) {
		return new Texture(bright.length, bright[0].length)
			.shader((x, y, dest) => {
				const b = bright[x][y];
				dest.set(b * 255, b * 255, b * 255, 1);
			});
	}
	static colorScale(col, bright) {
		return new Texture(bright.length, bright[0].length)
			.shader((x, y, dest) => {
				const b = bright[x][y];
				dest.set(b * col.red, b * col.green, b * col.blue, col.alpha);
			});
	}
	static async fromDataURI(uri, w_o, h_o) {
		let img = new Image();
		img.src = uri;
		let tex;
		return await new Promise(resolve => {
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
				img.remove();
				resolve(tex);
			}
		});
	}
	toByteBuffer(buffer = new ByteBuffer()) {
		buffer.write.uint32(this.width);
		buffer.write.uint32(this.height);

		const { data } = texture.imageData;
		for (let i = 0; i < data.length; i++) buffer.write.uint8(data[i]);

		buffer.finalize();

		return buffer;
	}
	static fromByteBuffer(buffer) {
		const width = buffer.read.uint32();
		const height = buffer.read.uint32();

		const texture = new Texture(width, height);

		const { data } = texture.imageData;
		for (let i = 0; i < data.length; i++) data[i] = buffer.read.uint8();

		return texture;
	}
}