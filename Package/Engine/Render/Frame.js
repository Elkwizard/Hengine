function new_OffscreenCanvas(width, height) {
	width = Math.ceil(width);
	height = Math.ceil(height);

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
	constructor(width = 1, height = 1, pixelRatio = null) {
		this.resize(width, height, false);
		this.loaded = true;
		if (pixelRatio !== null) {
			delete this.pixelRatio;
			Object.defineProperty(this, "pixelRatio", {
				get: () => pixelRatio
			});
		}
	}
	set width(a) {
		const prev = this._width;
		if (prev !== a) {
			this._width = a;
			this.onresize(this._width, this._height);
		}
	}
	get width() {
		return this._width;
	}
	set height(a) {
		const prev = this._height;
		if (prev !== a) {
			this._height = a;
			this.onresize(this._width, this._height);
		}
	}
	get height() {
		return this._height;
	}
	get pixelRatio() {
		return this.makeImage().width / this.width;
	}
	get pixelWidth() {
		return Math.ceil(this.width * this.pixelRatio);
	}
	get pixelHeight() {
		return Math.ceil(this.height * this.pixelRatio);
	}
	get renderable() {
		return this.loaded && this.width > 0 && this.height > 0;
	}
	onresize(width, height) { } // virtual
	resize(width, height, notify = true) {
		width = Math.max(0, Math.ceil(width));
		height = Math.max(0, Math.ceil(height));
		const prevWidth = this._width;
		const prevHeight = this._height;
		if (prevWidth !== width || prevHeight !== height) {
			this._width = width;
			this._height = height;
			if (notify) this.onresize();
		}
	}
	inferWidth(height) {
		return this.width * height / this.height;
	}
	inferHeight(width) {
		return this.height * width / this.width;
	}
	makeImage() {
		return null;
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
			a.onclick = () => resolve();
			a.click();
		});
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
		super(width, height, pixelRatio);
		this.image = new_OffscreenCanvas(this.pixelWidth, this.pixelHeight);
		this.renderer = new Artist(this.image, this.width, this.height, this, pixelRatio);
	}
	onresize(width, height) {
		this.renderer.resize(width, height);
	}
	stretch(w, h) {
		if (!h) h = this.inferHeight(w);
		let f = new Frame(w, h, this.pixelRatio);
		f.renderer.c.drawImage(this.image, 0, 0, w, h);
		return f;
	}
	clip(x, y, w, h) {
		return Frame.fromImageType(this, x, y, w, h);
	}
	makeImage() {
		return this.image;
	}
	get(f = new Frame(this.width, this.height, this.pixelRatio)) {
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