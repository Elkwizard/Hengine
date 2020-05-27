class ImageType {
	constructor(width, height, loops = false) {
		this.width = Math.floor(width);
		this.height = Math.floor(height);
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
		this.c.c.imageSmoothingEnabled = !g.preservePixelart;
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
			this.c.c.imageSmoothingEnabled = !g.preservePixelart;
		}
		makeImage() {
			return this.img;
		}
	}
}