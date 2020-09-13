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
			if (localStorage[name] !== undefined) {
				names.push(name);
			}
		} while (localStorage[name] !== undefined);
		for (let name of names) {
			delete localStorage[name];
		}
		return value;

	}
	static put(key, value) {
		value = LocalFileSystem.compress(value);
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
				localStorage[K] = value;
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
		do {
			name = prev + "_INX_" + n;
			n++;
			if (localStorage[name] !== undefined) {
				value += localStorage[name];
			}
		} while (localStorage[name] !== undefined);
		return LocalFileSystem.decompress(value);
	}
	static getRemainingSpace() {
		let key = "FILE_SIZE_CHECK";
		let data = "";
		let inc = "#".repeat(10000);
		while (LocalFileSystem.put(key, data)) data += inc;
		return (data.length / 512).toMaxed(1) + "kb";
	}
}