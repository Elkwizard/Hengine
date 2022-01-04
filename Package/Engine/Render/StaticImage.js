class StaticImage extends ImageType {
	constructor(image) {
		super(image.width, image.height, image.pixelRatio);
		this.bitmap = null;
		this.loaded = false;
		createImageBitmap(image.makeImage(), {
			premultiplyAlpha: "none"
		}).then(bmp => {
			this.bitmap = bmp;
			this.loaded = true;
		});
	}
	makeImage() {
		return this.bitmap;
	}
}