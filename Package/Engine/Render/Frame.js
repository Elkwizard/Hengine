class Frame {
	constructor(width, height) {
		this.width = width;
		this.height = height;
		this.img = new OffscreenCanvas(width, height);
		this.c = new Artist(this.img);
		this.c.c.imageSmoothingEnabled = !g.preservePixelart;
	}
}