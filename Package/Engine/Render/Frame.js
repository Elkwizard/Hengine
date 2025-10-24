/**
 * @implements Copyable
 * Represents an offscreen drawing surface that can be rendered as an image.
 * It is based on the HTML5 Canvas API.
 * ```js
 * const frame = new Frame(100, 200);
 * 
 * // add shapes to the frame
 * frame.renderer.stroke(new Color("blue"), 2).rect(10, 10, 20, 20);
 * frame.renderer.draw(new Color("red")).circle(30, 100, 50);
 * 
 * // render the frame to the screen
 * renderer.image(frame).default(0, 0);
 * ```
 * @prop<readonly> CanvasArtist2D renderer | The renderer local to the frame that can be used to modify its contents
 */
class Frame extends ImageType {
	/**
	 * Creates a new Frame.
	 * @param Number width | The natural width of the frame
	 * @param Number height | The natural height of the frame
	 * @param Number pixelRatio? | The pixel ratio for the frame. The default is `window.devicePixelRatio`
	 */
	constructor(width, height, pixelRatio = __devicePixelRatio) {
		super(width, height, pixelRatio);
		this.image = new_OffscreenCanvas(this.pixelWidth, this.pixelHeight);
		this.renderer = new CanvasArtist2D(this.image, this);
	}
	onresize(width, height) {
		this.renderer.resize(width, height);
	}
	/**
	 * Returns a copy of the frame stretched to a new set of dimensions.
	 * @param Number width | The width of the stretched image
	 * @param Number height | The height of the stretched image
	 * @return Frame
	 */
	stretch(w, h) {
		if (!h) h = this.inferHeight(w);
		let f = new Frame(w, h, this.pixelRatio);
		f.renderer.c.drawImage(this.image, 0, 0, w, h);
		return f;
	}
	/**
	 * Returns a frame containing a rectangular region of the caller. 
	 * @signature
	 * @param Rect region | The region to extract
	 * @signature
	 * @param Number x | The x coordinate of the upper-left corner of the region.
	 * @param Number y | The y coordinate of the upper-left corner of the region.
	 * @param Number width | The width of the region
	 * @param Number height | The height of the region
	 * @return Frame
	 */
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
	/**
	 * Returns a frame containing the (optionally clipped) contents of an image.
	 * If no clipping parameters are provided, the whole image will be copied.
	 * The copy will have the same pixel ratio as the original image.
	 * @signature
	 * @param ImageType image | The image to copy data from 
	 * @signature
	 * @param ImageType image | The image to copy data from 
	 * @param Rect region | The region to extract
	 * @signature
	 * @param ImageType image | The image to copy data from 
	 * @param Number x | The x coordinate of the upper-left corner of the region.
	 * @param Number y | The y coordinate of the upper-left corner of the region.
	 * @param Number width | The width of the region
	 * @param Number height | The height of the region
	 * @return Frame
	 */
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