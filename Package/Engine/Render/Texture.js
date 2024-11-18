/**
 * @implements Copyable, Serializable
 * Represents a 2D grid of pixels which can be directly accessed and modified.
 * ```js
 * const texture = new Texture(300, 300);
 * 
 * // create a voronoi texture
 * texture.shader((x, y, dest) => {
 * 	const intensity = Random.voronoi2D(x, y, 0.1);
 * 	dest.set(Color.grayScale(intensity));
 * });
 * ```
 * @prop ByteBuffer data | The pixel data of the texture. Modifying this buffer will modify the texture
 * @prop Boolean loops | Whether or not pixel coordinate parameters to methods will be wrapped around the edges of the texture space
 */
class Texture extends ImageType {
	constructor(width, height) {
		super(width, height);
		this.image = new_OffscreenCanvas(width, height);
		this.c = this.image.getContext("2d");

		//init image data
		const array = new Uint8ClampedArray(4 * this.width * this.height);
		for (let i = 0; i < array.length; i++) array[i] = 0;
		this.imageData = new ImageData(array, this.width, this.height);
		this.data = new ByteBuffer(this.imageData.data.buffer);

		this._getPixel = new Color(0, 0, 0, 0);
		this.shaderBackBuffer = new Uint8ClampedArray(4 * this.width * this.height);

		this.loops = false;
	}
	/**
	 * Returns a 2D array of the colors for all pixels in the texture.
	 * The first index is the x coordinate, the second the y
	 * @return Color[][]
	 */
	get pixels() {
		const { width, height } = this;
		const result = Array.dim(width, height);
		for (let i = 0; i < width; i++) for (let j = 0; j < height; j++)
			result[i][j] = this.getPixel(i, j, true).get();
		return result;
	}
	/**
	 * Returns a 2D array of the brightness values for all pixels in the texture.
	 * The first index is the x coordinate, the second the y.
	 * @return Number[][]
	 */
	get brightness() {
		const { width, height } = this;
		const result = Array.dim(width, height);
		for (let i = 0; i < width; i++) for (let j = 0; j < height; j++)
			result[i][j] = this.getPixel(i, j, true).brightness;
		return result;
	}
	/**
	 * Returns a 2D array of the red channel values for all pixels in the texture.
	 * The first index is the x coordinate, the second the y.
	 * @return Number[][]
	 */
	get red() {
		const { width, height, imageData: { data } } = this;
		const result = Array.dim(width, height);
		let inx = 0;
		for (let j = 0; j < height; j++) for (let i = 0; i < width; i++) {
			result[i][j] = data[inx];
			inx += 4;
		}
		return result;
	}
	/**
	 * Returns a 2D array of the green channel values for all pixels in the texture.
	 * The first index is the x coordinate, the second the y.
	 * @return Number[][]
	 */
	get green() {
		const { width, height, imageData: { data } } = this;
		const result = Array.dim(width, height);
		let inx = 0;
		for (let j = 0; j < height; j++) for (let i = 0; i < width; i++) {
			result[i][j] = data[inx + 1];
			inx += 4;
		}
		return result;
	}
	/**
	 * Returns a 2D array of the blue channel values for all pixels in the texture.
	 * The first index is the x coordinate, the second the y.
	 * @return Number[][]
	 */
	get blue() {
		const { width, height, imageData: { data } } = this;
		const result = Array.dim(width, height);
		let inx = 0;
		for (let j = 0; j < height; j++) for (let i = 0; i < width; i++) {
			result[i][j] = data[inx + 2];
			inx += 4;
		}
		return result;
	}
	/**
	 * Returns a 2D array of the alpha channel values for all pixels in the texture.
	 * The first index is the x coordinate, the second the y.
	 * @return Number[][]
	 */
	get alpha() {
		const { width, height, imageData: { data } } = this;
		const result = Array.dim(width, height);
		let inx = 0;
		for (let j = 0; j < height; j++) for (let i = 0; i < width; i++) {
			result[i][j] = data[inx + 3] / 255;
			inx += 4;
		}
		return result;
	}
	*[Symbol.iterator]() {
		const { width, height } = this;
		for (let i = 0; i < width; i++) for (let j = 0; j < height; j++) yield this.getPixel(i, j, true);
	}
	/**
	 * Clears the texture to contain only transparent black pixels.
	 */
	clear() {
		const { width, height } = this;
		for (let i = 0; i < width; i++) for (let j = 0; j < height; j++) this.setPixel(i, j, Color.BLANK, true);
	}
	/**
	 * Checks whether the given coordinates are valid pixel coordinates.
	 * This method ignores potential coordinate wrapping. 
	 * @param Number x | The x coordinate to check
	 * @param Number y | The y coordinate to check
	 * @return Boolean
	 */
	validPixel(x, y) {
		return x >= 0 && x < this.width && y >= 0 && y < this.height;
	}
	/**
	 * Returns a reference to the color of the pixel at a specific location.
	 * This color object is managed by the texture, and will only be valid until the next call to this method.
	 * If the color data is needed more permanently, create a copy of the return value.
	 * @param Number x | The x coordinate of the pixel
	 * @param Number y | The y coordinate of the pixel
	 * @param Boolean valid? | Whether or not the pixel coordinates are known to be valid. Default is false
	 * @return Color
	 */
	getPixel(x, y, valid = false) {
		const { _getPixel } = this;

		if (valid || this.validPixel(x, y)) {
			const { data } = this.imageData;
			const inx = (y * this.width + x) * 4;
			_getPixel.red = data[inx];
			_getPixel.green = data[inx + 1];
			_getPixel.blue = data[inx + 2];
			_getPixel.alpha = data[inx + 3] / 255;
			return _getPixel;
		} else if (!this.loops) {
			_getPixel.red = _getPixel.green = _getPixel.blue = _getPixel.alpha = 0;
			return _getPixel;
		} else {
			const { width, height } = this;
			return this.getPixel(
				(x % width + width) % width,
				(y % height + height) % height,
				true
			);
		}
	}
	/**
	 * Applies an in-place mapping to every pixel in the texture. Returns the caller.
	 * @param (Number, Number, Color) => void mapping | A shader function called for every pixel. The return value of this function, but it takes in three arguments: the x and y coordinates of the pixel, and the pixel color. Modifying the state of the pixel color argument will change the pixel color in the texture
	 * @return Texture
	 */
	shader(fn) {
		const dest = new Color(0, 0, 0, 0);

		const { width, height, shaderBackBuffer, imageData: { data } } = this;

		let inx = 0;
		for (let j = 0; j < height; j++) for (let i = 0; i < width; i++) {
			fn(i, j, dest);
			shaderBackBuffer[inx] = dest.red;
			shaderBackBuffer[inx + 1] = dest.green;
			shaderBackBuffer[inx + 2] = dest.blue;
			shaderBackBuffer[inx + 3] = dest.alpha * 255;
			inx += 4;
		}

		for (let i = 0; i < data.length; i++) data[i] = shaderBackBuffer[i];

		this.loaded = false;
		return this;
	}
	shaderSetPixel(x, y, clr) {
		const { data } = this.imageData;
		const inx = (y * this.width + x) * 4;
		data[inx] = clr.red;
		data[inx + 1] = clr.green;
		data[inx + 2] = clr.blue;
		data[inx + 3] = clr.alpha * 255;
	}
	/**
	 * Changes the color of a specified pixel in the texture.
	 * @param Number x | The x coordinate of the pixel
	 * @param Number y | The y coordinate of the pixel
	 * @param Color color | The new color of the pixel 
	 * @param Boolean valid? | Whether or not the pixel coordinates are known to be valid. Default is false 
	 */
	setPixel(x, y, clr, valid = false) {
		if (valid || this.validPixel(x, y)) {
			this.loaded = false;
			this.shaderSetPixel(x, y, clr);
		}
	}
	/**
	 * Applies an in-place box blur with a specified radius to the texture. Returns the caller.
	 * @param Number radius | The radius of the box blur 
	 * @return Texture
	 */
	blur(amount = 1) {
		return this.shader((x, y, dest) => {
			let r = 0;
			let g = 0;
			let b = 0;
			let a = 0;
			let count = 0;
			for (let i = -amount; i <= amount; i++) for (let j = -amount; j <= amount; j++) {
				let col = this.getPixel(x + i, y + j);
				r += col.red;
				g += col.green;
				b += col.blue;
				a += col.alpha;
				count++;
			}
			r /= count;
			g /= count;
			b /= count;
			a /= count;
			dest.set(r, g, b, a);
		});
	}
	stretch(w, h) {
		// TODO: reimplement
	}
	/**
	 * Returns a texture containing a rectangular region of the caller. 
	 * @signature
	 * @param Rect region | The region to extract
	 * @signature
	 * @param Number x | The x coordinate of the upper-left corner of the region.
	 * @param Number y | The y coordinate of the upper-left corner of the region.
	 * @param Number width | The width of the region
	 * @param Number height | The height of the region
	 * @return Texture
	 */
	clip(x, y, width, height) {
		if (typeof x === "object") ({ x, y, width, height } = x);
		x = Math.round(x);
		y = Math.round(y);
		return new Texture(width, height)
			.shader((i, j, dest) => dest.set(this.getPixel(x + i, y + j)));
	}
	makeImage() {
		if (!this.loaded) {
			this.loaded = true;
			this.c.putImageData(this.imageData, 0, 0);
		}
		return this.image;
	}
	makeWebGLImage() {
		return this.imageData;
	}
	get(tex = new Texture(this.width, this.height)) {
		if (tex.width !== this.width || tex.height !== this.height) return null;
		tex.imageData = new ImageData(
			this.imageData.data.map(channel => channel),
			this.imageData.width,
			this.imageData.height
		);
		tex.loaded = false;
		return tex;
	}
	/**
	 * Returns a texture containing the (optionally clipped) contents of an image.
	 * If no clipping parameters are provided, the whole image will be copied.
	 * The copy will have the same dimensions as the original, so if the original has a pixel ratio greater than 1, this operation will result in a loss of detail.
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
	 * @return Texture
	 */
	static fromImageType(image, x, y, width, height) {
		if (typeof x === "object") ({ x, y, width, height } = x);

		x ??= 0;
		y ??= 0;
		width ??= image.width;
		height ??= image.height

		const img = image.makeImage();
		const canvas = new_OffscreenCanvas(img.width, img.height);
		const context = canvas.getContext("2d");
		context.drawImage(img, 0, 0);

		const ratio = image.pixelRatio;

		x *= ratio;
		y *= ratio;
		const W = img.width;//Math.floor(w * __devicePixelRatio);
		const H = img.height;//Math.floor(h * __devicePixelRatio);
		const imageData = context.getImageData(x, y, W, H);
		const tex = new Texture(width, height);
		const data = imageData.data;
		for (let i = 0; i < width; i++) for (let j = 0; j < height; j++) {
			const inx = (Math.round(i * ratio) + Math.round(j * ratio) * W) * 4;
			const r = data[inx + 0];
			const g = data[inx + 1];
			const b = data[inx + 2];
			const a = data[inx + 3] / 255;
			tex.shaderSetPixel(i, j, new Color(r, g, b, a));
		}
		tex.loaded = false;
		return tex;
	}
	/**
	 * Creates a new grayscale texture based on a 2D grid of brightness values.
	 * @param Number[][] brightness | The brightness values for each pixel in the texture. The first index is the x coordinate, the second the y 
	 * @return Texture
	 */
	static grayScale(bright) {
		return new Texture(bright.length, bright[0].length)
			.shader((x, y, dest) => {
				const b = bright[x][y];
				dest.set(b * 255, b * 255, b * 255, 1);
			});
	}
	static colorScale(col, bright) {
		return new Texture(bright.length, bright[0].length)
			.shader((x, y, dest) => {
				const b = bright[x][y];
				dest.set(b * col.red, b * col.green, b * col.blue, col.alpha);
			});
	}
	/**
	 * Returns a promise resolving to a new texture containing the image data from a data: url.
	 * @param String url | The data: url
	 * @return Promise<Texture>
	 */
	static fromDataURI(uri, width, height) {
		return new Promise(resolve => {
			const img = new Image();
			img.src = uri;
			img.addEventListener("load", () => {
				const w = width ?? img.width;
				if (width && !height) height = Math.floor(width * img.height / img.width);
				const h = height ?? style.height;
				const tex = new Texture(w, h);
				
				const canvas = new_OffscreenCanvas(w, h);
				const ctx = canvas.getContext("2d");
				ctx.imageSmoothingEnabled = false;
				ctx.drawImage(img, 0, 0, w, h);

				const { data } = ctx.getImageData(0, 0, w, h);
				for (let i = 0; i < w; i++)
				for (let j = 0; j < h; j++) {
					const inx = (j * w + i) * 4;
					tex.setPixel(i, j, new Color(
						data[inx],
						data[inx + 1],
						data[inx + 2],
						data[inx + 3] / 255
					));
				}
				resolve(tex);
			});
		});
	}
	toByteBuffer(buffer = new ByteBuffer()) {
		buffer.write.uint32(this.width);
		buffer.write.uint32(this.height);

		const { data } = this.imageData;
		for (let i = 0; i < data.length; i++) buffer.write.uint8(data[i]);

		buffer.finalize();

		return buffer;
	}
	static fromByteBuffer(buffer) {
		const width = buffer.read.uint32();
		const height = buffer.read.uint32();

		const texture = new Texture(width, height);

		const { data } = texture.imageData;
		for (let i = 0; i < data.length; i++) data[i] = buffer.read.uint8();

		return texture;
	}
}