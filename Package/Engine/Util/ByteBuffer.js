/**
 * Represents a sequence of bytes, and allows writing and reading of various types to and from the buffer. 
 * @prop ByteBuffer.Writer write | The writing API of the buffer
 * @prop ByteBuffer.Reader read | The reading API of the buffer
 * @prop ByteBuffer.Measurer measure | The measuring API of the buffer
 * @prop Number pointer | The offset into the buffer where reading and writing occur
 * @prop Boolean littleEndian | The endianness of the buffer
 * @prop Number byteLength | The number of bytes in the buffer. This property is read-only
 */
class ByteBuffer {
	/**
	 * Creates a new ByteBuffer.
	 * @signature
	 * @param Number bytes? | The number of bytes (0 initialized) in the buffer. Default is 2
	 * @param Number pointer? | The offset into the buffer where operations occur. Default is 0
	 * @param Boolean littleEndian? | The endianness of the buffer. Default is true
	 * @signature
	 * @param ArrayBuffer bytes | A buffer containing the bytes for the new buffer
	 * @param Number pointer? | The offset into the buffer where operations occur. Default is 0
	 * @param Boolean littleEndian? | The endianness of the buffer. Default is true
	 */
	constructor(bytes = 2, pointer = 0, littleEndian = true) {
		this.data = new Uint8Array(bytes);
		this.view = new DataView(this.data.buffer);
		this.pointer = pointer;
		this.write = new ByteBuffer.Writer(this);
		this.read = new ByteBuffer.Reader(this);
		this.measure = new ByteBuffer.Measurer(this);
		this.shouldResize = true;
		this.littleEndian = littleEndian;
		this.byteLength = this.data.length;
	}
	reserve(length) {
		this.alloc(length - this.pointer);
	}
	alloc(amount) {
		const end = this.pointer + amount;
		if (this.shouldResize && end > this.byteLength) {
			if (end > this.data.length) {
				const newData = new Uint8Array(1 << Math.ceil(Math.log2(end)));
				newData.set(this.data);
				this.data = newData;
				this.view = new DataView(this.data.buffer);
			}
			this.byteLength = end;
		}
	}
	/**
	 * Advances the pointer by a specified amount.
	 * @param Number amount | The amount of bytes to increment by
	 */
	advance(amount) {
		this.pointer += amount;
	}
	/**
	 * Resets the pointer to the beginning of the buffer and sets all the bytes in the buffer to 0.
	 */
	clear() {
		this.pointer = 0;
		this.data.fill(0);
	}
	/**
	 * Trims the size of the buffer to only include up to (but not including) the current pointer.
	 */
	finalize() {
		this.data = this.data.slice(0, this.pointer);
	}
	/**
	* Copies the data of the buffer into a buffer.
	* If no destination is specified one will be created.
	* @param ByteBuffer buffer? | The destination for the copy. The data will be written to the end of the buffer
	* @return ByteBuffer
	*/
	toByteBuffer(buffer = new ByteBuffer()) {
		buffer.write.byteBuffer(this);
		return buffer;
	}
	/**
	 * Converts the buffer to a sequence of 16-bit unicode characters.
	 * @return String
	 */
	toString() {
		let result = String.fromCharCode(
			this.pointer >> 16,
			this.pointer & 0xFFFF,
			this.byteLength >> 16,
			this.byteLength & 0xFFFF
		);
		for (let i = 0; i < this.data.length; i += 2)
			result += String.fromCharCode(this.data[i] << 8 | this.data[i + 1]);
		
		if (this.littleEndian) result += "~";

		return result;
	}
	/**
	 * Converts the buffer to a base-64 string.
	 * @return String
	 */
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
	/**
	 * Creates a copy of the buffer and optionally stores it in a provided destination.
	 * @param ByteBuffer destination? | The destination to copy the buffer into.
	 * @return ByteBuffer
	 */
	get(buffer = new ByteBuffer()) {
		if (buffer.data.length >= this.data.length) buffer.data.set(this.data, 0);
		else buffer.data = this.data.slice();
		buffer.pointer = this.pointer;
		buffer.shouldResize = this.shouldResize;
		buffer.byteLength = this.byteLength;
		return buffer;
	}
	/**
	 * Converts a base-64 string to a new buffer.
	 * @param String base64 | The base-64 string to convert
	 * @return ByteBuffer
	 */
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
				buffer.write.uint8(b0 << 2 | b1 >> 4);
			} else if (base64[i + 3] === "=") {
				// __=
				buffer.write.uint8(b0 << 2 | b1 >> 4);
				buffer.write.uint8((b1 & 0b1111) << 4 | b2 >> 2);
			} else {
				// ___
				buffer.write.uint8(b0 << 2 | b1 >> 4);
				buffer.write.uint8((b1 & 0b1111) << 4 | b2 >> 2);
				buffer.write.uint8((b2 & 0b11) << 6 | b3);
			}
		}

		buffer.finalize();

		buffer.pointer = 0;

		return buffer;
	}
	/**
	 * Converts a series of 16-bit unicode characters into a new buffer.
	 * @param String string | The string of data
	 * @return ByteBuffer
	 */
	static fromString(string) {
		const length = string.charCodeAt(2) << 16 | string.charCodeAt(3);
		const prefixStringLength = 4;
		const dataStringLength = Math.ceil(length / 2);
		const buffer = new ByteBuffer(length, 0, dataStringLength + prefixStringLength < string.length);
		buffer.shouldResize = false;
		for (let i = 0; i < dataStringLength; i++) {
			const code = string.charCodeAt(i + 4);
			const inx = i * 2;
			buffer.data[inx] = code >> 8;
			if (inx + 1 < length) buffer.data[inx + 1] = code & 255;
		}
		buffer.pointer = string.charCodeAt(0) << 16 | string.charCodeAt(1);
		buffer.shouldResize = true;
		return buffer;
	}
	/**
	 * Reads a buffer from a buffer, and returns it.
	 * @param ByteBuffer buffer | The buffer to read the data from
	 * @return ByteBuffer
	 */
	static fromByteBuffer(buffer) {
		return buffer.read.byteBuffer();
	}
}
ByteBuffer.arrayTypes = ["Float32", "Float64", "Int8", "Int16", "Int32", "Uint8", "Uint16", "Uint32"];
ByteBuffer.objectTypes = [
	"undefined",
	"null",
	"function",
	"object",
	"array",
	"bigInt",
	"string",
	"bool",
	...ByteBuffer.arrayTypes.map(type => type.toLowerCase())
];
/**
 * @name class ByteBuffer.Writer
 * The writing API for a ByteBuffer.
 * Every method of this class increments the associated buffer's pointer to after the written data.
 */
ByteBuffer.Writer = class {
	constructor(buffer) {
		this.buffer = buffer;
	}
	_getType(object) {
		if (object === null) return "null";
		if (object === undefined) return "undefined";
		if (Array.isArray(object)) return "array";
		const type = typeof object;
		if (type.match(/function|object|string/)) return type;
		if (type === "boolean") return "bool";
		if (type === "number") {
			const signed = object < 0;
			const float = isNaN(object) || (object % 1) || (signed ? object < -2147483648 : object > 4294967295);
			if (float) {
				if (Math.fround(object) === object) return "float32";
				else return "float64";
			} else {
				if (signed) {
					if (object >= -128) return "int8";
					if (object >= -32768) return "int16";
					return "int32";
				} else {
					if (object < 256) return "uint8";
					if (object < 65536) return "uint16";
					return "uint32";
				}
			}
		}
		if (type === "bigint") return "bigInt";
		return "null";
	}
	
	/**
	 * @name int[S]
	 * @name_subs S: 8, 16, 32
	 * Writes an S-bit integer to the buffer. S can be 8, 16, or 32.
	 * @param Number integer | The integer to write
	 */
	
	/**
	 * @name uint[S]
	 * @name_subs S: 8, 16, 32
	 * Reads an S-bit unsigned integer from the buffer. S can be 8, 16, or 32.
	 * @param Number integer | The unsigned integer to write
	 */
	
	/**
	 * @name float[S]
	 * @name_subs S: 32, 64
	 * Reads an S-bit float from the buffer. S can be 32 or 64.
	 * @param Number float | The floating point value to write
	 */

	/**
	 * Writes a bigint to the buffer.
	 * @param BigInt bigint | The value to write
	 */
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
	/**
	 * Writes a string to the buffer.
	 * @param String string | The value to write
	 */
	string(string) {
		const len = string.length;
		this.uint32(len);
		for (let i = 0; i < len; i++) this.uint16(string.charCodeAt(i));
	}
	/**
	 * Writes a boolean to the buffer.
	 * @param Boolean bool | The value to write 
	 */
	bool(bool) {
		this.uint8(+bool);
	}
	bool8(a, b, c, d, e, f, g, h) {
		this.uint8(+a << 7 | +b << 6 | +c << 5 | +d << 4 | +e << 3 | +f << 2 | +g << 1 | +h);
	}
	/**
	 * Writes an array of values to the buffer.
	 * @param String type | The name of another method of this class that can be used to write each element of the array
	 * @param Any[] data | The single-type array to write
	 */
	array(type, data) {
		const { length } = data;
		this.uint32(length);
		for (let i = 0; i < length; i++) this[type](data[i]);
	}
	/**
	 * Writes a buffer to the buffer.
	 * @param ByteBuffer buffer | The value to write to the buffer
	 */
	byteBuffer(buffer) {
		this.array("uint8", buffer.data);
		this.uint32(buffer.pointer);
		this.bool(buffer.littleEndian);
	}
	/**
	 * Writes an arbitrary, potentially cyclic object to the buffer.
	 * This operation does not preserve the classes of the objects.
	 * @param Object object | The object to write 
	 */
	object(object, objectIDs /* object => id */) {
		const type = this._getType(object);
		const typeIndex = ByteBuffer.typeToIndex[type];
		this.uint8(typeIndex);

		if (type === "function" || type === "undefined" || type === "null") return;

		if (type === "object" || type === "array") {
			if (objectIDs === undefined) objectIDs = new Map();
			const referenced = objectIDs.has(object);
			this.bool(referenced);
			if (referenced) this.uint32(objectIDs.get(object));
			else {
				const id = objectIDs.size;
				objectIDs.set(object, id);

				if (type === "object") {
					const keys = Object.keys(object);
					this.uint32(keys.length);
					for (let i = 0; i < keys.length; i++) {
						const key = keys[i];
						const value = object[key];
						this.string(key);
						this.object(value, objectIDs);
					}
				} else {
					this.uint32(object.length);
					for (let i = 0; i < object.length; i++) this.object(object[i], objectIDs);
				}
			}
		} else this[type](object);
	}
};
/**
 * @name class ByteBuffer.Measurer
 * The measuring API for a ByteBuffer.
 * This can be used to measure the length of a sequence of writes or reads.
 * @prop Number size | The number of bytes operated on since the last reset 
 */
ByteBuffer.Measurer = class extends ByteBuffer.Writer {
	constructor(buffer) {
		super(buffer);
		this.reset();
	}
	/**
	 * Resets the current size to 0.
	 */
	reset() {
		this.size = 0;
	}
}

/**
 * @name class ByteBuffer.Reader
 * The reading API for a Bytebuffer.
 * Every method of this class increments the associated buffer's pointer to after the read data.
 */
ByteBuffer.Reader = class {
	constructor(buffer) {
		this.buffer = buffer;
	}
	/**
	 * @name int[S]
	 * @name_subs S: 8, 16, 32
	 * Reads an S-bit integer from the buffer. S can be 8, 16, or 32.
	 * @return Number
	 */
	
	/**
	 * @name uint[S]
	 * @name_subs S: 8, 16, 32
	 * Reads an S-bit unsigned integer from the buffer. S can be 8, 16, or 32.
	 * @return Number
	 */
	
	/**
	 * @name float[S]
	 * @name_subs S: 32, 64
	 * Reads an S-bit float from the buffer. S can be 32 or 64.
	 * @return Number
	 */

	/**
	 * Reads a bigint from the buffer.
	 * @return BigInt
	 */
	bigInt() {
		const byteNum = this.int32();
		const bytes = BigInt(Math.abs(byteNum));
		let result = 0n;
		for (let i = bytes - 1n; i >= 0n; i--)
			result |= BigInt(this.uint8()) << (i * 8n);
		return (byteNum > 0) ? result : -result;
	}
	/**
	 * Reads a string from the buffer.
	 * @return String
	 */
	string() {
		const len = this.uint32();
		let result = "";
		for (let i = 0; i < len; i++) result += String.fromCharCode(this.uint16());
		return result;
	}
	/**
	 * Reads a boolean from the buffer.
	 * @return Boolean
	 */
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
	/**
	 * Reads an array of values of a single type from the buffer.
	 * @param String type | The name of another method of this class that can be used for reading each element 
	 * @param Number count? | If specified, this value will be used as the length of the array. This allows for reading sequences of values not prefixed with a length, but not those produced by `ByteBuffer.Writer.prototype.array()`
	 * @return Any[]
	 */
	array(type, count = null) {
		const length = count ?? this.uint32();
		const result = new Array(length);
		for (let i = 0; i < length; i++) result[i] = this[type]();
		return result;
	}
	/**
	 * Reads a buffer from the buffer
	 * @return ByteBuffer
	 */
	byteBuffer() {
		return new ByteBuffer(this.array("uint8"), this.uint32(), this.bool());
	}
	/**
	 * Reads an object from the buffer.
	 * @return Object
	 */
	object(objectIDs /* id => object */) {
		const type = ByteBuffer.indexToType[this.uint8()];
		if (type === "undefined") return undefined;
		if (type === "function" || type === "null") return null;

		if (type === "object" || type === "array") {
			if (objectIDs === undefined) objectIDs = new Map();
			const referenced = this.bool();
			if (referenced) return objectIDs.get(this.uint32());
			else {
				const object = (type === "object") ? {} : [];
				const id = objectIDs.size;
				objectIDs.set(id, object);

				if (type === "object") {
					const keys = this.uint32();
					for (let i = 0; i < keys; i++) {
						const key = this.string();
						const value = this.object(objectIDs);
						object[key] = value;
					}
				} else {
					const length = this.uint32();
					for (let i = 0; i < length; i++) object.push(this.object(objectIDs));
				}
				return object;
			}
		}

		return this[type]();
	}
};

for (let i = 0; i < ByteBuffer.arrayTypes.length; i++) {
	const type = ByteBuffer.arrayTypes[i];
	const method = type.toLowerCase();

	const setViewMethod = "set" + type;
	const getViewMethod = "get" + type;
	const { BYTES_PER_ELEMENT } = window[type + "Array"];

	ByteBuffer.Measurer.prototype[method] = function (value) {
		this.size += BYTES_PER_ELEMENT;
	};
	ByteBuffer.Writer.prototype[method] = function (value) {
		const { buffer } = this;
		buffer.alloc(BYTES_PER_ELEMENT);
		buffer.view[setViewMethod](buffer.pointer, value, buffer.littleEndian);
		buffer.pointer += BYTES_PER_ELEMENT;
	};
	ByteBuffer.Reader.prototype[method] = function () {
		const { buffer } = this;
		const value = (buffer.pointer + BYTES_PER_ELEMENT <= buffer.data.length) ? buffer.view[getViewMethod](buffer.pointer, buffer.littleEndian) : 0;
		buffer.pointer += BYTES_PER_ELEMENT;
		return value;
	};
}
ByteBuffer.typeToIndex = Object.fromEntries(
	ByteBuffer.objectTypes
		.map((type, index) => [type, index])
);
ByteBuffer.indexToType = Object.fromEntries(
	ByteBuffer.objectTypes
		.map((type, index) => [index, type])
);
