function new_OffscreenCanvas(width, height) {
	width = Math.floor(width);
	height = Math.floor(height);

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
		this._pixelRatio = pixelRatio;
	}
	set width(a) {
		a = ImageType.roundDimension(a);
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
		a = ImageType.roundDimension(a);
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
		return this._pixelRatio ?? (this.makeImage().width / this.width);
	}
	get pixelWidth() {
		return Math.floor(this.width * this.pixelRatio);
	}
	get pixelHeight() {
		return Math.floor(this.height * this.pixelRatio);
	}
	get renderable() {
		return this.loaded && this.width > 0 && this.height > 0;
	}
	onresize(width, height) { } // virtual
	resize(width, height, notify = true) {
		width = ImageType.roundDimension(width);
		height = ImageType.roundDimension(height);
		const prevWidth = this._width;
		const prevHeight = this._height;
		if (prevWidth !== width || prevHeight !== height) {
			this._width = width;
			this._height = height;
			if (notify) this.onresize();
		}
	}
	contains(x, y) {
		if (typeof x === "object") ({ x, y } = x);
		return x >= 0 && y >= 0 && x <= this.width && y <= this.height;
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
	static roundDimension(dimension) {
		return Math.max(0, Math.floor(dimension));
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
	clip(x, y, width, height) {
		return Frame.fromImageType(this, x, y, width, height);
	}
	makeImage() {
		return this.image;
	}
	get(f = new Frame(this.width, this.height, this.pixelRatio)) {
		f.renderer.resize(this.width, this.height);
		f.renderer.c.drawImage(this.image, 0, 0, this.width, this.height);
		return f;
	}
	static fromImageType(img, x, y, width, height) {
		if (typeof x === "object") ({ x, y, width, height } = x);

		x ??= 0;
		y ??= 0;
		width ??= img.width;
		height ??= img.height;
		
		const offscreen = img.makeImage();
		const pixelRatio = offscreen.width / img.width;
		const frame = new Frame(width, height, pixelRatio);
		frame.renderer.c.drawImage(offscreen, x * pixelRatio, y * pixelRatio, width * pixelRatio, height * pixelRatio, 0, 0, width, height);
		return frame;
	}
}	