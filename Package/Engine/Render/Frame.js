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
		this._width = Math.max(1, Math.ceil(width));
		this._height = Math.max(1, Math.ceil(height));
		this.loaded = true;
	}
	resize(width, height) { } // virtual
	set width(a) {
		const prev = this._width;
		this._width = a;
		if (prev !== a) this.resize(this._width, this._height);
	}
	get width() {
		return this._width;
	}
	set height(a) {
		const prev = this._height;
		this._height = a;
		if (prev !== a) this.resize(this._width, this._height);
	}
	get height() {
		return this._height;
	}
	get pixelRatio() {
		return this.makeImage().width / this.width;
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
		this.image.addEventListener("load", this.forceLoad.bind(this));
	}
	forceLoad() {
		this.width = this.image.width;
		this.height = this.image.height;
		this.loaded = true;
	}
	makeImage() {
		return this.image;
	}
	static imageExists(src) {
		const img = new Image();
		img.src = src;
		return new Promise(resolve => {
			img.onerror = () => resolve(false);
			img.onload = () => resolve(true);
		});
	}
}
class Frame extends ImageType {
	constructor(width, height, pixelRatio = __devicePixelRatio) {
		super(width, height);
		this.image = new_OffscreenCanvas(this.width * pixelRatio, this.height * pixelRatio);
		this.renderer = new Artist(this.image, this.width, this.height, this, pixelRatio);
	}
	resize(width, height) {
		this.renderer.resize(width, height);
	}
	stretch(w, h) {
		if (!h) h = this.inferHeight(w);
		let f = new Frame(w, h, this.renderer.pixelRatio);
		f.renderer.c.drawImage(this.image, 0, 0, w, h);
		return f;
	}
	makeImage() {
		return this.image;
	}
	clip(x, y, w, h) {
		return Frame.fromImageType(this, x, y, w, h);
	}
	get(f = new Frame(this.width, this.height, this.renderer.pixelRatio)) {
		f.renderer.resize(this.width, this.height);
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
		const pixelRatio = offscreen.width / img.width;
		let f = new Frame(w, h, pixelRatio);
		f.renderer.c.drawImage(offscreen, x * pixelRatio, y * pixelRatio, w * pixelRatio, h * pixelRatio, 0, 0, w, h);
		return f;
	}
}	