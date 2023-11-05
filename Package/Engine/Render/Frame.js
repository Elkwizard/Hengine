function new_OffscreenCanvas(width, height) {
	width = Math.floor(width);
	height = Math.floor(height);

	let canvas;
	if (window.OffscreenCanvas) {
		canvas = new OffscreenCanvas(width, height);
		canvas.toBlob = function (callback, type, quality) {
			callback(canvas.convertToBlob({ type, quality }));
		};
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

/**
 * Represents an image that can be rendered.
 * This is an abstract class and should not be constructed.
 * @prop Number width | The natural rendered width of the image
 * @prop Number height | The natural rendered height of the image
 * @prop Number pixelRatio | The ratio of the number of pixels in a row to the natural width of the image. An image with a pixelRatio of 2, rendered at twice its natural size, will retain clarity 
 */
class ImageType {
	/**
	 * Creates a new ImageType.
	 * @param Number width? | The natural rendered width of the image. The default is 1
	 * @param Number height? | The natural rendered height of the image. The default is 1
	 * @param Number pixelRatio? | The ratio of the number of pixels to the natural size of the image. The default is 1
	 */
	constructor(width = 1, height = 1, pixelRatio = null) {
		this.resize(width, height, false);
		this.loaded = true;
		this._pixelRatio = pixelRatio;
	}
	set loaded(a) {
		this._loaded = a;
		if (this.needsWebGLProxy && a === false)
			this.webGLImageLoaded = false;
	}
	get loaded() {
		return this._loaded;
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
		return ImageType.roundDimension(this.width * this.pixelRatio);
	}
	get pixelHeight() {
		return ImageType.roundDimension(this.height * this.pixelRatio);
	}
	get renderable() {
		return this.loaded && this.width > 0 && this.height > 0;
	}
	onresize(width, height) { } // virtual
	/**
	 * Simultaneously updates the width and height of the image.
	 * Updates that occur on image resizing will only happen once with a call to this method, which can improve performance as opposed to simply assigning to `.width` and `.height` in a row.
	 * @param Number width | The new natural width of the image
	 * @param Number height | The new natural height of the image
	 */
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
	/**
	 * Checks whether a given point is inside the natural bounds of the image with the upper-left corner at the origin.
	 * This operation is inclusive on the lower bound and exclusive on the upper bound.
	 * @signature
	 * @param Vector2 point | The point to check
	 * @signature
	 * @param Number x | The x coordinate of the point to check
	 * @param Number y | The y coordinate of the point to check
	 * @return Boolean
	 */
	contains(x, y) {
		if (typeof x === "object") ({ x, y } = x);
		return x >= 0 && y >= 0 && x < this.width && y < this.height;
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
	makeWebGLImage() { // acquire a version of the image which can be used in webgl
		const image = this.makeImage();

		this.needsWebGLProxy ??= ( // chrome os doesn't allow webgl canvases as texImage2d arguments
			navigator.appVersion.indexOf("CrOS") > -1 &&
			(
				image instanceof HTMLCanvasElement ||
				(
					"OffscreenCanvas" in window &&
					image instanceof window.OffscreenCanvas
				)
			) &&
			image.getContext("webgl2") !== null
		);

		if (this.needsWebGLProxy) {
			const { width, height } = image;
			this.webGLImage ??= new_OffscreenCanvas(width, height);
			this.webGLImageContext ??= this.webGLImage.getContext("2d");
			
			// resize if necessary
			if (this.webGLImage.width !== width)
				this.webGLImage.width = width;
			if (this.webGLImage.height !== height)
				this.webGLImage.height = height;
			
			if (this.webGLImageLoaded !== true) {
				this.webGLImageContext.clearRect(0, 0, width, height);
				this.webGLImageContext.drawImage(image, 0, 0);
				if (this.webGLImageLoaded === false)
					this.webGLImageLoaded = true;
			}

			return this.webGLImage;
		}
		return image;
	}
	/**
	 * Converts the content of the image to a data: url.
	 * @return String
	 */
	toDataURL() {
		const canvas = document.createElement("canvas");
		const img = this.makeImage();
		if (img !== null) {
			canvas.width = img.width;
			canvas.height = img.height;
			canvas.getContext("2d").drawImage(img, 0, 0);
		} else {
			canvas.width = 0;
			canvas.height = 0;	
		}
		return canvas.toDataURL();
	}
	/**
	 * Downloads the image as a PNG, with a specified name.
	 * Returns a promise that resolves when the image downloads.
	 * @param String name | The name of the downloaded image, without the extension
	 * @return Promise
	 */
	download(name) {
		const a = document.createElement("a");
		a.href = this.toDataURL();
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
	/**
	 * Checks whether an image exists at a specified file path.
	 * Returns a promise that resolves to whether the image exists.
	 * @param String src | The file path to check
	 * @return Promise
	 */
	static imageExists(src) {
		const img = new Image();
		img.src = src;
		return new Promise(resolve => {
			img.onerror = () => resolve(false);
			img.onload = () => resolve(true);
		});
	}
}

/**
 * Represents an offscreen drawing surface that can be rendered as an image.
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
 * @prop Artist renderer | The renderer local to the frame that can be used to modify its contents
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
		this.renderer = new Artist(this.image, this.width, this.height, this, pixelRatio);
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
	 * Returns a frame containing rectangular region of the caller. 
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
	/**
	 * Creates a copy of the frame and optionally stores it in a provided destination.
	 * @param Frame destination? | The destination to copy the frame into.
	 * @return Frame
	 */
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