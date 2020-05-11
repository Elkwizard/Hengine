let Frame = class {
	constructor(width, height) {
		this.width = width;
		this.height = height;
		this.img = new OffscreenCanvas(width, height);
		this.c = new Artist(this.img);
		this.c.c.imageSmoothingEnabled = !g.preservePixelart;
	}
}
try {
	new OffscreenCanvas(0, 0);
} catch (e) {
	Frame = class {
		constructor(width, height) {
			this.width = width;
			this.height = height;
			this.img = document.createElement("canvas");
			this.img.width = width;
			this.img.height = height;
			this.c = new Artist(this.img);
			this.c.c.imageSmoothingEnabled = !g.preservePixelart;
		}
	}
}