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
			this.width = 10;
			this.height = 10;
		}
		this.img = new_OffscreenCanvas(this.width, this.height);
		this.c = new Artist(this.img);
		this.c.c.imageSmoothingEnabled = window.renderer ? !window.renderer.preservePixelart : false;
		this.renderer = this.c;
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
		}.bind(this);
	}
	makeImage() {
		return this.img;
	}
}