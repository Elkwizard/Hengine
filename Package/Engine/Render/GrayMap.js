class GrayMap {
	constructor(w, h, rule) {
		w = Math.floor(w);
		h = Math.floor(h);
		this.width = w;
		this.height = h;
		this.data = Array.dim(w, h).map((v, x, y) => rule(x, y));
	}
	toByteBuffer() {
		const buffer = new ByteBuffer();

		buffer.write.int32(this.width);
		buffer.write.int32(this.height);

		for (let i = 0; i < this.width; i++) for (let j = 0; j < this.height; j++) buffer.write.int8(this.data[i][j] * 255);
		
	}
	static fromByteBuffer(buffer) {
		buffer.pointer = 0;

		const width = buffer.read.int32();
		const height = buffer.read.int32();

		const map = new GrayMap(width, height, () => 0);

		for (let i = 0; i < width; i++) for (let j = 0; j < height; j++) map.data[i][j] = buffer.read.int8() / 255;

		return map;
	}
}