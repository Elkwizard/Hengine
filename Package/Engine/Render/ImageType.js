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
 * @abstract
 * @prop Number width | The natural rendered width of the image
 * @prop Number height | The natural rendered height of the image
 * @prop<static, immutable> Boolean dynamic | Whether the contents of the image can change over time
 */
class ImageType {
	static dynamic = true;
	constructor(width = 1, height = 1, pixelRatio = null) {
		this._width = ImageType.roundDimension(width);
		this._height = ImageType.roundDimension(height);
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
		this.resize(a, this.height);
	}
	get width() {
		return this._width;
	}
	set height(a) {
		this.resize(this.width, a);
	}
	get height() {
		return this._height;
	}
	/**
	 * Returns the pixel density of the image, measured as the ratio of the number of pixels in a row of the image to the natural width of the image.
	 * @return Number
	 */
	get pixelRatio() {
		return this._pixelRatio ?? (this.makeImage().width / this.width);
	}
	/**
	 * Returns the width of the image in actual pixels, accounting for the pixel density of the image.
	 * @return Number
	 */
	get pixelWidth() {
		return ImageType.roundDimension(this.width * this.pixelRatio);
	}
	/**
	 * Returns the height of the image in actual pixels, accounting for the pixel density of the image.
	 * @return Number
	 */
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
	resize(width, height) {
		width = ImageType.roundDimension(width);
		height = ImageType.roundDimension(height);
		const prevWidth = this._width;
		const prevHeight = this._height;
		if (prevWidth !== width || prevHeight !== height) {
			this._width = width;
			this._height = height;
			this.onresize(width, height);
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
	/**
	 * Returns the width of the image required for a given height to maintain the aspect ratio.
	 * @param Number height | The potential height of the image
	 * @return Number
	 */
	inferWidth(height) {
		return this.width * height / this.height;
	}
	/**
	 * Returns the height of the image required for a given width to maintain the aspect ratio.
	 * @param Number width | The potential width of the image
	 * @return Number
	 */
	inferHeight(width) {
		return this.height * width / this.width;
	}
	makeImage() {
		return null;
	}
	makeWebGLImage() { // acquire a version of the image which can be used in webgl
		const image = this.makeImage();

		this.needsWebGLProxy ??= ( // chrome os doesn't allow webgl canvases as texImage2d arguments
			navigator.appVersion.includes("CrOS") &&
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
			a.addEventListener("click", () => resolve());
			a.click();
		});
	}
	static roundDimension(dimension) {
		return Math.max(0, Math.floor(dimension));
	}
}