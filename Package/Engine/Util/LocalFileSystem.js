class LocalFileSystem {
	static get header() {
		return "LOCAL_FILE_SYSTEM_";
	}
	static compress(str) {
		return str;
	}
	static decompress(str) {
		return str;
	}
	static clearAll() {
		localStorage.clear();
	}
	static getAllFiles() {
		let files = [];
		let header = LocalFileSystem.header;
		for (let key in localStorage) {
			if (key.indexOf(header) > -1) {
				let act_key = key.slice(header.length);
				let inx = act_key.length - 1;
				while (act_key[inx].match(/\d/g)) inx--;
				inx -= 4;
				act_key = act_key.slice(0, inx);
				if (!files.includes(act_key)) files.push(act_key);
			}
		}
		return files;
	}
	static clear(key) {
		let prev = LocalFileSystem.header + key;
		let value = "";
		let n = 0;
		let name;
		let names = [];
		do {
			name = prev + "_INX_" + n;
			n++;
			if (localStorage.getItem(name) !== null) {
				names.push(name);
			}
		} while (localStorage.getItem(name) !== null);
		for (let name of names) {
			localStorage.removeItem(name);
		}
		return value;

	}
	static put(key, value) {
		value = LocalFileSystem.compress(value);
		LocalFileSystem.clear(key);
		try {
			let values = [];
			let acc = "";
			for (let i = 0; i < value.length; i++) {
				acc += value[i];
				if ((i + 1) % 10000 === 0) {
					values.push(acc);
					acc = "";
				}
			}
			values.push(acc);
			values = values.map((e, i) => [e, "_INX_" + i]);

			for (let v of values) {
				let K = LocalFileSystem.header + key + v[1];
				let value = v[0];
				localStorage.setItem(K, value);
			}
			return true;
		} catch (e) {
			LocalFileSystem.clear(key);
			console.warn("File '" + key + "' was to big. It was erased.");
			return false;
		}
	}
	static get(key) {
		let prev = LocalFileSystem.header + key;
		let value = "";
		let n = 0;
		let name;
		let exists = false;
		do {
			name = prev + "_INX_" + n;
			n++;
			if (localStorage.getItem(name) !== null) {
				value += localStorage.getItem(name);
				exists = true;
			}
		} while (localStorage.getItem(name) !== null);
		return exists ? LocalFileSystem.decompress(value) : null;
	}
	static getRemainingSpace() {
		let key = "FILE_SIZE_CHECK";
		let data = "";
		let inc = "#".repeat(10000);
		while (LocalFileSystem.put(key, data)) data += inc;
		return (data.length / 512).toMaxed(1) + "kb";
	}
}
class ByteBuffer {
	constructor(bytes = null) {
		this.data = (bytes !== null) ? new Uint8Array(bytes) : new Uint8Array(2);
		this.pointer = 0;
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
	toString() {
		let result = "";
		for (let i = 0; i < this.data.length; i += 2) {
			const charCode = this.data[i] << 8 | (this.data[i + 1] || 0);
			result += String.fromCharCode(charCode);
		}
		return result;
	}
	get(buffer = new ByteBuffer()) {
		buffer.data = this.data.slice(0, this.data.length);
		buffer.pointer = this.pointer;
		buffer.shouldResize = this.shouldResize;
		return buffer;
	}
	toByteBuffer() {
		return this;
	}
	static fromByteBuffer(buffer) {
		return buffer.get();
	}
	static fromString(string) {
		const buffer = new ByteBuffer(string.length * 2);
		buffer.shouldResize = false;
		for (let i = 0; i < string.length; i++) buffer.write.int16(string.charCodeAt(i));
		buffer.pointer = 0;
		buffer.shouldResize = true;
		return buffer;
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
	byteBuffer(data) {
		this.array("int8", data.data);
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
		return new ByteBuffer(this.array("int8"));
	}
};
class FileSystem {
	constructor() {
		this.fileTypes = {};

		this.registerFileType(ByteBuffer, ["buf", "buffer", "dat"]);
		this.registerFileType(Number, ["num", "int", "flt"]);
		this.registerFileType(String, ["str", "txt", "json", "js", "html", "css"]);
		this.registerFileType(Object, ["obj"]);
		this.registerFileType(Boolean, ["bool"]);
		this.registerFileType(Texture, ["txr", "img", "bmp", "png", "jpg", "jpeg"]);
		this.registerFileType(GrayMap, ["gmp", "grm", "map", "grid"]);
	}
	createFile(name, create) {
		if (!this.fileExists(name)) this.save(name, create());
		return this.get(name);
	}
	registerFileType(ObjectType, extensions = []) {
		extensions.push(ObjectType.name);
		for (let i = 0; i < extensions.length; i++) {
			const key = extensions[i].toLowerCase();
			if (key in this.fileTypes) console.warn(`File Extension Collision: extension '${key}' is currently mapped to ${this.fileTypes[key].name}`);
			this.fileTypes[key] = ObjectType;
		}
	}
	getProjectName() {
		return document.querySelector("title").innerText;
	}
	getFileType(fileName) {
		let type = fileName.split(".")[1].toLowerCase();
		return this.fileTypes[type] ?? ByteBuffer;
	}
	getFilePath(file, loc) {
		return "HengineLocalSaves\\" + escape(loc) + "\\" + escape(file.split(".")[0]) + "." + file.split(".")[1].toLowerCase();
	}
	saveRaw(file, data, loc = this.getProjectName()) {
		LocalFileSystem.put(this.getFilePath(file, loc), data.toString());
		return data;
	}
	getRaw(file, loc = this.getProjectName()) {
		const path = this.getFilePath(file, loc);
		const result = LocalFileSystem.get(path);
		if (result !== null) return ByteBuffer.fromString(result);
		return null;
	}
	fileExists(file, loc = this.getProjectName()) {
		return this.getRaw(file, loc) !== null;
	}
	save(file, data, loc = this.getProjectName()) {
		this.saveRaw(file, data.toByteBuffer(), loc);
		return data;
	}
	fileSize(file, loc = this.getProjectName()) {
		let data = this.getRaw(file, loc);
		if (data) return (data.length / 512).toMaxed(1) + "kb";
		return 0;
	}
	getAllFiles() {
		let files = LocalFileSystem.getAllFiles().map(file => {
			let inx = file.indexOf("\\") + 1;
			let nFile = file.slice(inx);
			let inx2 = nFile.indexOf("\\");
			let loc = nFile.slice(0, inx2);
			let fileName = nFile.slice(inx2 + 1);
			return { location: unescape(loc), file: unescape(fileName) };
		});
		return files;
	}
	deleteFile(file, loc = this.getProjectName()) {
		LocalFileSystem.clear(this.getFilePath(file, loc));
	}
	get(file, loc = this.getProjectName()) {
		let dat = this.getRaw(file, loc);
		if (dat !== null) {
			let type = this.getFileType(file);
			return type.fromByteBuffer(dat);
		}
	}
}