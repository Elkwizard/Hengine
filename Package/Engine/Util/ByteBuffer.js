class ByteBuffer {
	constructor(bytes = 2, pointer = 0) {
		this.data = new Uint8Array(bytes);
		this.pointer = pointer;
		this.write = new ByteBuffer.Writer(this);
		this.read = new ByteBuffer.Reader(this);
		this.shouldResize = true;
	}
	get byteLength() {
		return this.data.length;
	}
	alloc(amount) {
		if (this.shouldResize) while (this.pointer + amount >= this.data.length) {
			const newData = new Uint8Array(this.data.length * 2);
			newData.set(this.data);
			this.data = newData;
		}
	}
	clear() {
		this.pointer = 0;
		this.data.fill(0);
	}
	finalize() {
		this.data = this.data.slice(0, this.pointer);
	}
	toByteBuffer() {
		return this;
	}
	toString() {
		let result = String.fromCharCode(this.pointer >> 16, this.pointer & 0xFFFF);
		for (let i = 0; i < this.data.length; i += 2) {
			const charCode = this.data[i] << 8 | (this.data[i + 1] || 0);
			result += String.fromCharCode(charCode);
		}
		return result;
	}
	toBase64() {
		const binary = [...this.data];
		const base64Table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

		let base64 = "";
		for (let i = 0; i < binary.length; i += 3) {
			let a = binary[i];
			let b = binary[i + 1];
			let c = binary[i + 2];
			if (b === undefined) {
				// _==
				const b0 = a >> 2;
				const b1 = (a & 0b00000011) << 4;
				base64 += base64Table[b0] + base64Table[b1] + "==";
			} else if (c === undefined) {
				// __=
				const b0 = a >> 2;
				const b1 = ((a & 0b00000011) << 4) | (b >> 4);
				const b2 = (b & 0b00001111) << 2;
				base64 += base64Table[b0] + base64Table[b1] + base64Table[b2] + "=";
			} else {
				// ___
				const b0 = a >> 2;
				const b1 = ((a & 0b00000011) << 4) | (b >> 4);
				const b2 = (b & 0b00001111) << 2 | (c >> 6);
				const b3 = c & 0b00111111;
				base64 += base64Table[b0] + base64Table[b1] + base64Table[b2] + base64Table[b3];
			}
		}

		return this.pointer + "/" + base64;
	}
	get(buffer = new ByteBuffer()) {
		buffer.data = this.data.slice(0, this.data.length);
		buffer.pointer = this.pointer;
		buffer.shouldResize = this.shouldResize;
		return buffer;
	}
	static fromBase64(base64) {
		const base64Table = Object.fromEntries(
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
				.split("")
				.map((c, i) => [c, i])
		);
			
		const buffer = new ByteBuffer();

		const index = base64.indexOf("/");
		const pointer = parseInt(base64.slice(0, index));
		base64 = base64.slice(index + 1);

		for (let i = 0; i < base64.length; i += 4) {
			const b0 = base64Table[base64[i]];
			const b1 = base64Table[base64[i + 1]];
			const b2 = base64Table[base64[i + 2]];
			const b3 = base64Table[base64[i + 3]];

			if (base64[i + 2] + base64[i + 3] === "==") {
				// _==
				buffer.write.int8((b0 << 2) | (b1 >> 4));
			} else if (base64[i + 3] === "=") {
				// __=
				buffer.write.int8((b0 << 2) | (b1 >> 4));
				buffer.write.int8(((b1 & 0b1111) << 4) | (b2 >> 2));
			} else {
				// ___
				buffer.write.int8((b0 << 2) | (b1 >> 4));
				buffer.write.int8(((b1 & 0b1111) << 4) | (b2 >> 2));
				buffer.write.int8(((b2 & 0b11) << 6) | b3);
			}
		}
		buffer.finalize();
		buffer.pointer = pointer;
		return buffer;
	}
	static fromString(string) {
		const buffer = new ByteBuffer(string.length * 2);
		buffer.shouldResize = false;
		for (let i = 2; i < string.length; i++) buffer.write.int16(string.charCodeAt(i));
		buffer.pointer = (string.charCodeAt(0) << 16) | string.charCodeAt(1);
		buffer.shouldResize = true;
		return buffer;
	}
	static fromByteBuffer(buffer) {
		return buffer.get();
	}
}
ByteBuffer.float32ConvertBuffer = new ArrayBuffer(4);
ByteBuffer.float32 = new Float32Array(ByteBuffer.float32ConvertBuffer);
ByteBuffer.bytes32 = new Uint8Array(ByteBuffer.float32ConvertBuffer);
ByteBuffer.float64ConvertBuffer = new ArrayBuffer(8);
ByteBuffer.float64 = new Float64Array(ByteBuffer.float64ConvertBuffer);
ByteBuffer.bytes64 = new Uint8Array(ByteBuffer.float64ConvertBuffer);
ByteBuffer.Writer = class {
	constructor(buffer) {
		this.buffer = buffer;
	}
	bigInt(bigint) {
		let bytes = 0n;
		let value = 1n;
		const sign = (bigint > 0n) ? 1n : -1n;
		bigint = bigint * sign;
		while (bigint >= value) {
			value *= 256n;
			bytes++;
		}
		const byteSize = BigInt("0xFF");
		
		this.int32(Number(bytes * sign));
		for (let i = bytes - 1n; i >= 0n; i--) {
			this.int8(Number(bigint >> (i * 8n) & byteSize));
		}
	}
	string(string) {
		const len = string.length;
		this.int32(len);
		for (let i = 0; i < len; i++) this.int16(string.charCodeAt(i));
	}
	bool(bool) {
		this.int8(+bool);
	}
	bool8(a, b, c, d, e, f, g, h) {
		this.int8(+a << 7 | +b << 6 | +c << 5 | +d << 4 | +e << 3 | +f << 2 | +g << 1 | +h);
	}
	float64(float) {
		ByteBuffer.float64[0] = float;
		this.int8(ByteBuffer.bytes64[0]);
		this.int8(ByteBuffer.bytes64[1]);
		this.int8(ByteBuffer.bytes64[2]);
		this.int8(ByteBuffer.bytes64[3]);
		this.int8(ByteBuffer.bytes64[4]);
		this.int8(ByteBuffer.bytes64[5]);
		this.int8(ByteBuffer.bytes64[6]);
		this.int8(ByteBuffer.bytes64[7]);
	}
	float32(float) {
		ByteBuffer.float32[0] = float;
		this.int8(ByteBuffer.bytes32[0]);
		this.int8(ByteBuffer.bytes32[1]);
		this.int8(ByteBuffer.bytes32[2]);
		this.int8(ByteBuffer.bytes32[3]);
	}
	int32(int) {
		int &= 0xFFFFFFFF;
		this.int16(int >> 16);
		this.int16(int);
	}
	int16(int) {
		int &= 0xFFFF;
		this.int8(int >> 8);
		this.int8(int);
	}
	int8(int) {
		this.buffer.alloc(1);
		int &= 0xFF;
		this.buffer.data[this.buffer.pointer] = int;
		this.buffer.pointer++;
	}
	array(type, data) {
		const { length } = data;
		this.int32(length);
		for (let i = 0; i < length; i++) this[type](data[i]);
	}
	byteBuffer(buffer) {
		this.array("int8", buffer.data);
		this.int32(buffer.pointer);
	}
}
ByteBuffer.Reader = class {
	constructor(buffer) {
		this.buffer = buffer;
	}
	bigInt() {
		const byteNum = this.int32();
		const bytes = BigInt(Math.abs(byteNum));
		let result = 0n;
		for (let i = bytes - 1n; i >= 0n; i--) {
			result |= BigInt(this.int8()) << (i * 8n);
		}
		if (byteNum > 0) return result;
		return -result;
	}
	string() {
		const len = this.int32();
		let result = "";
		for (let i = 0; i < len; i++) result += String.fromCharCode(this.int16());
		return result;
	}
	bool() {
		return !!this.int8();
	}
	bool8() {
		const int = this.int8();
		return [
			!!(int >> 7),
			!!((int >> 6) & 1),
			!!((int >> 5) & 1),
			!!((int >> 4) & 1),
			!!((int >> 3) & 1),
			!!((int >> 2) & 1),
			!!((int >> 1) & 1),
			!!(int & 1)
		];
	}
	float64() {
		ByteBuffer.bytes64[0] = this.int8();
		ByteBuffer.bytes64[1] = this.int8();
		ByteBuffer.bytes64[2] = this.int8();
		ByteBuffer.bytes64[3] = this.int8();
		ByteBuffer.bytes64[4] = this.int8();
		ByteBuffer.bytes64[5] = this.int8();
		ByteBuffer.bytes64[6] = this.int8();
		ByteBuffer.bytes64[7] = this.int8(); 
		return ByteBuffer.float64[0];
	}
	float32() {
		ByteBuffer.bytes32[0] = this.int8();
		ByteBuffer.bytes32[1] = this.int8();
		ByteBuffer.bytes32[2] = this.int8();
		ByteBuffer.bytes32[3] = this.int8();
		return ByteBuffer.float32[0];
	}
	int32() {
		let result = this.int16() << 16 | this.int16();
		return result;
	}
	int16() {
		return this.int8() << 8 | this.int8();
	}
	int8() {
		const result = this.buffer.data[this.buffer.pointer];
		this.buffer.pointer++;
		return result;
	}
	array(type) {
		const length = this.int32();
		let result = new Array(length);
		for (let i = 0; i < length; i++) {
			result[i] = this[type]();
		}
		return result;
	}
	byteBuffer() {
		return new ByteBuffer(this.array("int8"), this.int32());
	}
};