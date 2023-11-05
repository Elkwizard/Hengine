/**
 * Represents an image that will not change.
 * This image format is more efficient for rendering than other ImageTypes.
 */
class StaticImage extends ImageType {
	/**
	 * Creates a new StaticImage.
	 * @param ImageType image | The data to use for the static image
	 */
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