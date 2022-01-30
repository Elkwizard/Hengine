class GrayMap {
	constructor(w, h, rule = null) {
		w = Math.floor(w);
		h = Math.floor(h);
		this.width = w;
		this.height = h;
		this.data = Array.dim(w, h);
		if (rule !== null) this.data = this.data.map((v, x, y) => rule(x, y));
	}
	get(x, y) {
		if (x in this.data && y in this.data[x]) return this.data[x][y];
		return -1;
	}
	toByteBuffer(buffer = new ByteBuffer()) {
		buffer.write.uint32(this.width);
		buffer.write.uint32(this.height);

		for (let i = 0; i < this.width; i++) for (let j = 0; j < this.height; j++) buffer.write.uint8(this.data[i][j] * 255);
		
		return buffer;
	}
	static fromByteBuffer(buffer) {
		const width = buffer.read.uint32();
		const height = buffer.read.uint32();

		const map = new GrayMap(width, height);

		for (let i = 0; i < width; i++) for (let j = 0; j < height; j++) map.data[i][j] = buffer.read.uint8() / 255;

		return map;
	}
}