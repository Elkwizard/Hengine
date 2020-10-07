function new_OffscreenCanvas(width, height) {
	if (window.OffscreenCanvas) return new OffscreenCanvas(width, height);
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	return canvas;
}
class ImageType {
	constructor(width = 1, height = 1, loops = false) {
		this.width = Math.max(1, Math.round(width));
		this.height = Math.max(1, Math.round(height));
		this.loops = loops;
		this.loaded = true;
	}
	inferWidth(height) {
		return this.width * height / this.height;
	}
	inferHeight(width) {
		return this.height * width / this.width;
	}
	async download(name) {
		let canvas = document.createElement("canvas");
		let img = this.makeImage();
		if (!img) return;
		canvas.width = img.width;
		canvas.height = img.height;
		canvas.getContext("2d").drawImage(img, 0, 0);
		let a = document.createElement("a");
		a.href = canvas.toDataURL();
		a.download = name + ".png";
		return new Promise(resolve => {
			a.onclick = function () {
				resolve();
			};
			a.click();
		});
	}
	makeImage() {
		return null;
	}
	requestImage(width, height) {
		if (!this.loops) {
			return this.makeImage();
		} else {
			width = Math.abs(width);
			height = Math.abs(height);
			if (!width) width = 0;
			if (!height) height = 0;
			let frame = new_OffscreenCanvas(width, height);
			let c = frame.getContext("2d");
			let img = this.makeImage();
			for (let i = 0; i < frame.width / this.width; i++) for (let j = 0; j < frame.height / this.height; j++) {
				c.drawImage(img, i * this.width, j * this.height, this.width, this.height);
			}
			return frame;
		}
	}
}
class Frame extends ImageType {
	constructor(width, height) {
		super(width, height, false);
		if (typeof width === "string") {
			this.src = width;
			this.width = 1;
			this.height = 1;
		}
		this.img = new_OffscreenCanvas(this.width, this.height);
		this.c = new Artist(this.img);
		this.c.c.imageSmoothingEnabled = window.c ? !window.c.preservePixelart : false;
		this.renderer = this.c;
		this.onload = () => null;
	}
	static async sourceExists(src) {
		let img = new Image();
		img.src = src;
		let result = await new Promise(function (resolve) {
			img.onerror = () => resolve(false);
			img.onload = () => resolve(true);
		});
		return result;
	}
	set src(src) {
		let img = new Image();
		img.src = src;
		this.loaded = false;
		img.onload = function () {
			this.width = img.width;
			this.height = img.height;
			this.img.width = img.width;
			this.img.height = img.height;
			this.c.c.drawImage(img, 0, 0);
			this.loaded = true;
			this.onload();
		}.bind(this);
	}
	clip(x, y, w, h) {
		if (x.width !== undefined) {
			h = x.height;
			w = x.width;
			y = x.y;
			x = x.x;
		}
		let f = new Frame(w, h);
		f.renderer.c.drawImage(this.img, x, y, w, h, 0, 0, w, h);
		return f;
	}
	static fromImageType(img) {
		let offscreen = img.makeImage();
		let f = new Frame(offscreen.width, offscreen.height);
		f.renderer.c.drawImage(offscreen, 0, 0);
		return f;
	}
	makeImage() {
		return this.img;
	}
}