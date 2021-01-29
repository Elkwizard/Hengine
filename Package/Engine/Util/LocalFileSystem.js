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