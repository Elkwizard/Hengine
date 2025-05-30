class Frame3D extends ImageType {
	constructor(width, height, pixelRatio = __devicePixelRatio) {
		super(width, height, pixelRatio);
		this.image = new_OffscreenCanvas(this.pixelWidth, this.pixelHeight);
		this.renderer = new Artist3D(this.image, this);
	}
	onresize(width, height) {
		this.renderer.resize(width, height);
	}
	makeImage() {
		this.renderer.flush();
		return this.image;
	}
}