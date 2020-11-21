function new_OffscreenCanvas(width, height) {
	let canvas;
	if (window.OffscreenCanvas) {
		canvas = new OffscreenCanvas(width, height);
	} else {
		canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
	}
	canvas.style = {
		set width(a) {
			canvas.width = parseInt(a);
		},
		get width() {
			return canvas.width;
		},
		set height(a) {
			canvas.height = parseInt(a);
		},
		get height() {
			return canvas.height;
		}
	};
	return canvas;
}
class ImageType {
	constructor(width = 1, height = 1) {
		this.width = Math.max(1, Math.ceil(width));
		this.height = Math.max(1, Math.ceil(height));
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
}
class HImage extends ImageType {
	constructor(src) {
		super(1, 1);
		this.image = new Image();
		this.image.src = src;
		this.loaded = false;
		this.image.addEventListener("load", function () {
			this.width = this.image.width / devicePixelRatio;
			this.height = this.image.height / devicePixelRatio;
			this.loaded = true;
		}.bind(this));
	}
	static async imageExists(src) {
		let img = new Image();
		img.src = src;
		let result = await new Promise(function (resolve) {
			img.onerror = () => resolve(false);
			img.onload = () => resolve(true);
		});
		return result;
	}
	makeImage() {
		return this.image;
	}
}
class Frame extends ImageType {
	constructor(width, height) {
		super(width, height);
		this.image = new_OffscreenCanvas(this.width, this.height);
		this.renderer = new Artist(this.image, this.width, this.height, this);
		this.renderer.preservePixelart = true;
	}
	stretch(w, h) {
		if (!h) h = this.inferHeight(w);
		let f = new Frame(w, h);
		f.renderer.c.drawImage(this.image, 0, 0, w, h);
		return f;
	}
	makeImage() {
		return this.image;
	}
	clip(x, y, w, h) {
		return Frame.fromImageType(this, x, y, w, h);
	}
	get() {
		let f = new Frame(this.width, this.height);
		f.renderer.c.drawImage(this.image, 0, 0, this.width, this.height);
		return f;
	}
	static fromImageType(img, x, y, w, h) {
		if (typeof x === "object") {
			h = x.height;
			w = x.width;
			y = x.y;
			x = x.x;
		}

		if (!x) x = 0;
		if (!y) y = 0;
		if (!w) w = img.width;
		if (!h) h = img.height;
		
		let offscreen = img.makeImage();
		let f = new Frame(w, h);
		f.renderer.c.drawImage(offscreen, x * devicePixelRatio, y * devicePixelRatio, w * devicePixelRatio, h * devicePixelRatio, 0, 0, w, h);
		return f;
	}
}