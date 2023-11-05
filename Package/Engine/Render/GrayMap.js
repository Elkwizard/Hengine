/**
 * Represents a 2D grid of grayscale values.
 * ```js
 * const perlinMap = new GrayMap(100, 100, (x, y) => {
 * 	return Random.perlin2D(x, y, 0.1);
 * });
 * ```
 * @prop Number width | The width of the map
 * @prop Number height | The height of the map
 * @prop Number[][] data | The intensity values (on [0, 1]) of the map
 */
class GrayMap {
	/**
	 * Creates a new GrayMap based on an intensity function.
	 * @param Number width | The width of the map 
	 * @param Number height | The height of the map 
	 * @param Function rule | A function to be called for each coordinate pair to generate the intensity values
	 */
	constructor(w, h, rule = null) {
		w = Math.floor(w);
		h = Math.floor(h);
		this.width = w;
		this.height = h;
		this.data = Array.dim(w, h);
		if (rule !== null) this.data = this.data.map((v, x, y) => rule(x, y));
	}
	/**
	 * Returns the grayscale value at a specified point, or -1 if the point is out of bounds.
	 * @param Number x | The x coordinate of the sample point 
	 * @param Number y | The y coordinate of the sample point 
	 * @return Number
	 */
	get(x, y) {
		if (x in this.data && y in this.data[x]) return this.data[x][y];
		return -1;
	}
	/**
	* Copies the data of the map into a buffer.
	* If no destination is specified one will be created.
	* @param Number buffer? | The destination for the copy. The data will be written to the end of the buffer
	* @return ByteBuffer
	*/
	toByteBuffer(buffer = new ByteBuffer()) {
		buffer.write.uint32(this.width);
		buffer.write.uint32(this.height);

		for (let i = 0; i < this.width; i++) for (let j = 0; j < this.height; j++) buffer.write.uint8(this.data[i][j] * 255);
		
		return buffer;
	}
	/**
	 * Reads a map from a buffer, and returns it.
	 * @param ByteBuffer buffer | The buffer to read the data from
	 * @return GrayMap
	 */
	static fromByteBuffer(buffer) {
		const width = buffer.read.uint32();
		const height = buffer.read.uint32();

		const map = new GrayMap(width, height);

		for (let i = 0; i < width; i++) for (let j = 0; j < height; j++) map.data[i][j] = buffer.read.uint8() / 255;

		return map;
	}
}