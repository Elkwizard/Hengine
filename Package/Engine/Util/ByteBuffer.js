class ByteBuffer {
	constructor(bytes = 2, pointer = 0) {
		this.data = new Uint8Array(bytes);
		this.view = new DataView(this.data.buffer);
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
			this.view = new DataView(this.data.buffer);
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
		let result = String.fromCharCode(this.pointer >> 16, this.pointer & 0xFFFF, this.byteLength >> 16, this.byteLength & 0xFFFF);
		for (let i = 0; i < this.data.length; i += 2)
			result += String.fromCharCode(this.data[i] << 8 | (this.data[i + 1] || 0));
		
		return result;
	}
	toBase64() {
		const binary = this.data;
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

		return base64;
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

		for (let i = 0; i < base64.length; i += 4) {
			const b0 = base64Table[base64[i]];
			const b1 = base64Table[base64[i + 1]];
			const b2 = base64Table[base64[i + 2]];
			const b3 = base64Table[base64[i + 3]];

			if (base64[i + 2] + base64[i + 3] === "==") {
				// _==
				buffer.write.uint8((b0 << 2) | (b1 >> 4));
			} else if (base64[i + 3] === "=") {
				// __=
				buffer.write.uint8((b0 << 2) | (b1 >> 4));
				buffer.write.uint8(((b1 & 0b1111) << 4) | (b2 >> 2));
			} else {
				// ___
				buffer.write.uint8((b0 << 2) | (b1 >> 4));
				buffer.write.uint8(((b1 & 0b1111) << 4) | (b2 >> 2));
				buffer.write.uint8(((b2 & 0b11) << 6) | b3);
			}
		}

		buffer.finalize();

		buffer.pointer = 0;

		return buffer;
	}
	static fromString(string) {
		// console.log(string[4].charCodeAt(0));
		const length = string.charCodeAt(2) << 16 | string.charCodeAt(3);
		const buffer = new ByteBuffer(length);
		buffer.shouldResize = false;
		for (let i = 4; i < string.length; i++) buffer.write.uint16(string.charCodeAt(i));
		buffer.pointer = string.charCodeAt(0) << 16 | string.charCodeAt(1);
		buffer.shouldResize = true;
		return buffer;
	}
	static fromByteBuffer(buffer) {
		return buffer.get();
	}
}
ByteBuffer.arrayTypes = ["Float32", "Float64", "Int8", "Int16", "Int32", "Uint8", "Uint16", "Uint32"];
ByteBuffer.jsTypeAliases = {
	"number": "float64",
	"boolean": "bool",
	"bigint": "bigInt"
};
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
			this.uint8(Number(bigint >> (i * 8n) & byteSize));
		}
	}
	string(string) {
		const len = string.length;
		this.uint32(len);
		for (let i = 0; i < len; i++) this.uint16(string.charCodeAt(i));
	}
	bool(bool) {
		this.uint8(+bool);
	}
	bool8(a, b, c, d, e, f, g, h) {
		this.uint8(+a << 7 | +b << 6 | +c << 5 | +d << 4 | +e << 3 | +f << 2 | +g << 1 | +h);
	}
	array(type, data) {
		const { length } = data;
		this.uint32(length);
		for (let i = 0; i < length; i++) this[type](data[i]);
	}
	byteBuffer(buffer) {
		this.array("uint8", buffer.data);
		this.uint32(buffer.pointer);
	}
	object(template, value) {
		for (const key in template) {
			const type = template[key];
			if (typeof type === "string") this[type](value[key]);
			else this.object(type, value[key]);
		}
	}
};
ByteBuffer.Reader = class {
	constructor(buffer) {
		this.buffer = buffer;
	}
	bigInt() {
		const byteNum = this.int32();
		const bytes = BigInt(Math.abs(byteNum));
		let result = 0n;
		for (let i = bytes - 1n; i >= 0n; i--) {
			result |= BigInt(this.uint8()) << (i * 8n);
		}
		if (byteNum > 0) return result;
		return -result;
	}
	string() {
		const len = this.uint32();
		let result = "";
		for (let i = 0; i < len; i++) result += String.fromCharCode(this.uint16());
		return result;
	}
	bool() {
		return !!this.uint8();
	}
	bool8() {
		const int = this.uint8();
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
	array(type) {
		const length = this.uint32();
		const result = new Array(length);
		for (let i = 0; i < length; i++) result[i] = this[type]();
		return result;
	}
	byteBuffer() {
		return new ByteBuffer(this.array("uint8"), this.uint32());
	}
	object(template) {
		const object = { };
		for (const key in template) {
			const type = template[key];
			if (typeof type === "string") object[key] = this[type]();
			else object[key] = this.object(type);
		}
		return object;
	}
};

for (let i = 0; i < ByteBuffer.arrayTypes.length; i++) {
	const type = ByteBuffer.arrayTypes[i];
	const method = type.toLowerCase();

	const setViewMethod = "set" + type;
	const getViewMethod = "get" + type;
	const { BYTES_PER_ELEMENT } = window[type + "Array"];
	
	ByteBuffer.Writer.prototype[method] = function (value) {
		const { buffer } = this;
		buffer.alloc(BYTES_PER_ELEMENT);
		buffer.view[setViewMethod](buffer.pointer, value);
		buffer.pointer += BYTES_PER_ELEMENT;
	};
	ByteBuffer.Reader.prototype[method] = function () {
		const { buffer } = this;
		const value = (buffer.pointer + BYTES_PER_ELEMENT <= buffer.data.length) ? buffer.view[getViewMethod](buffer.pointer) : 0;
		buffer.pointer += BYTES_PER_ELEMENT;
		return value;
	};
}
for (const jsType in ByteBuffer.jsTypeAliases) {
	const bufferType = ByteBuffer.jsTypeAliases[jsType];
	ByteBuffer.Writer.prototype[jsType] = ByteBuffer.Writer.prototype[bufferType];
	ByteBuffer.Reader.prototype[jsType] = ByteBuffer.Reader.prototype[bufferType];
}