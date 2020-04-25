try {
	new OffscreenCanvas(0, 0);
} catch (e) {
	OffscreenCanvas = class {
		constructor(width, height) {
			this.width = width;
			this.height = height;
			this.id = "Fake";
			this.canvas = document.createElement("canvas");
		}
		getContext() {
			return this.canvas.getContext("2d");
		}
	}
}
class Frame {
	constructor(width, height) {
		this.width = width;
		this.height = height;
		this.img = new OffscreenCanvas(width, height);
		this.c = new Artist(this.img);
		this.c.c.imageSmoothingEnabled = !g.preservePixelart;
	}
}