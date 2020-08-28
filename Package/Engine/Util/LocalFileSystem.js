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
		} catch (e) {
			LocalFileSystem.clear(key);
			console.warn("File '" + key + "' was to big. It was erased.");
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
}