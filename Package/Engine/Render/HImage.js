/**
 * Represents an externally loaded image file.
 * These should be loaded using HengineImageResource and not constructed directly.
 * ```js
 * const catImage = loadResource("cat.png"); // load the HImage
 * 
 * renderer.image(catImage).rect(0, 0, 100, 100);
 * ```
 */
class HImage extends ImageType {
	static dynamic = false;
	constructor(image) {
		super(image.width, image.height);
		this.image = image;
	}
	makeImage() {
		return this.image;
	}
	/**
	 * Checks whether an image exists at a specified file path.
	 * Returns a promise that resolves to whether the image exists.
	 * @param String src | The file path to check
	 * @return boolean
	 */
	static async imageExists(src) {
		return await new HengineImageResource(src).load() !== null;
	}
}