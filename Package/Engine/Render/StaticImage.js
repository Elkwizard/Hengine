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
		const cis = image.makeImage();
		this.bitmap = new_OffscreenCanvas(cis.width, cis.height);
		this.bitmap.getContext("2d").drawImage(cis, 0, 0);
		createImageBitmap(cis, {
			premultiplyAlpha: "none"
		}).then(bmp => {
			this.bitmap = bmp;
		});
	}
	makeImage() {
		return this.bitmap;
	}
}