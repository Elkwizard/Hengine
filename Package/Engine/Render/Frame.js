class ImageType {
	constructor(width = 1, height = 1, loops = false) {
		this.width = Math.max(1, Math.round(width));
		this.height = Math.max(1, Math.round(height));
		this.loops = loops;
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
			let frame = new OffscreenCanvas(width, height);
			let c = frame.getContext("2d");
			let img = this.makeImage();
			for (let i = 0; i < frame.width / this.width; i++) for (let j = 0; j < frame.height / this.height; j++) {
				c.drawImage(img, i * this.width, j * this.height, this.width, this.height);
			}
			return frame;
		}
	}
}
let Frame = class extends ImageType {
	constructor(width, height) {
		super(width, height, false);
		this.img = new OffscreenCanvas(this.width, this.height);
		this.c = new Artist(this.img);
		this.c.c.imageSmoothingEnabled = window.c ? !window.c.preservePixelart : false;
	}
	set src(src) {
		let img = new Image();
		img.src = src;
		img.onload = function () {
			this.width = img.width;
			this.height = img.height;
			this.img.width = img.width;
			this.img.height = img.height;
			this.c.c.drawImage(img, 0, 0);
		}.bind(this);
	}
	makeImage() {
		return this.img;
	}
}
try {
	new OffscreenCanvas(0, 0);
} catch (e) {
	Frame = class extends ImageType {
		constructor(width, height) {
			super(width, height, false);
			this.img = document.createElement("canvas");
			this.img.width = this.width;
			this.img.height = this.height;
			this.c = new Artist(this.img);
			this.c.c.imageSmoothingEnabled = window.c ? !c.preservePixelart : false;
		}
		set src(src) {
			let img = new Image();
			img.src = src;
			img.onload = function () {
				this.width = img.width;
				this.height = img.height;
				this.img.width = img.width;
				this.img.height = img.height;
				this.c.c.drawImage(img, 0, 0);
			}.bind(this);
		}
		makeImage() {
			return this.img;
		}
	}
}