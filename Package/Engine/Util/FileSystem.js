class FileSystem { };
(() => {

	function getFile(fs, address) {
		const fileValue = fs.files[address];
		let buffer = fileValue;
		if (!fileValue) return null;
		if (typeof fileValue === "string") buffer = ByteBuffer.fromString(fileValue);
		fs.files[address] = buffer;
		return fs.files[address];
	}

	function getDirectoryEntries(fs, address) {
		const buffer = getFile(fs, address);
		const entries = new Map();
		const { pointer } = buffer;
		buffer.pointer = 0;
		entries.set("...dir", buffer.read.uint32());
		entries.set("..dir", address);
		while (true) {
			const name = buffer.read.string();
			const address = buffer.read.uint32();
			if (address) entries.set(name, address);
			else break;
		}
		buffer.pointer = pointer;
		return entries;
	}

	function getFileExt(name) {
		const index = name.lastIndexOf(".");
		if (index > -1) return name.slice(index + 1);
		return "";
	}

	function getFileNameWithoutExt(name) {
		const index = name.lastIndexOf(".");
		if (index > -1) return name.slice(0, index);
		return name;
	}

	function createFile(fs, name, contents) {
		const entries = getDirectoryEntries(fs, fs.directoryAddress);
		if (entries.has(name)) {
			error(`file '${name}' already exists in '${fs.directory}'`);
			return false;
		}

		const fileIndex = fs.free.length ? fs.free.shift() : fs.files.length;
		fs.files[fileIndex] = contents;
		const directoryBuffer = getFile(fs, fs.directoryAddress);
		directoryBuffer.write.string(name);
		directoryBuffer.write.uint32(fileIndex);

		return true;
	}

	function writeFile(fs, name, contents) {
		const entries = getDirectoryEntries(fs, fs.directoryAddress);
		if (!entries.has(name)) {
			createFile(fs, name, contents);
			return true;
		}
		const address = entries.get(name);
		fs.files[address] = contents;
		return false;
	}

	function getParentAddress(buffer) {
		const { pointer } = buffer;
		buffer.pointer = 0;
		const address = buffer.read.uint32();
		buffer.pointer = pointer;
		return address;
	}

	function getDirectoryName(fs, address) {
		const parentEntries = getDirectoryEntries(fs, getParentAddress(getFile(fs, address)));
		for (const [name, childAddress] of parentEntries) {
			if (name === "..dir") continue;
			if (childAddress === address) {
				if (name === "...dir") return "";
				return getFileNameWithoutExt(name);
			}
		}

		return "$null$";
	}

	function bytes(type, data) {
		const buffer = new ByteBuffer();
		buffer.write[type](data);
		return buffer;
	}

	function changeDirectory(fs, dirName) {
		if (dirName === ".") return true;
		const entries = getDirectoryEntries(fs, fs.directoryAddress);
		const dirFileName = dirName + ".dir";

		if (entries.has(dirFileName)) {
			fs.directoryAddress = entries.get(dirFileName);
			return true;
		} else {
			error(`directory '${getFileNameWithoutExt(dirName)}' does not exist in '${fs.directory}'`);
			return false;
		}
	}

	function getReferenced(fs, address) {
		const entries = getDirectoryEntries(fs, address);
		let referenced = new Set([address]);
		for (const [name, fileAddress] of entries) {
			if (name !== "...dir" && name !== "..dir") {
				if (getFileExt(name) === "dir") for (const address of getReferenced(fs, fileAddress)) referenced.add(address);
				else referenced.add(fileAddress);
			}
		}
		return referenced;
	}

	function getDereferenced(fs) {
		const referenced = getReferenced(fs, 0);
		const dereferenced = [];
		for (let i = 0; i < fs.files.length; i++) {
			if (!referenced.has(i)) {
				fs.files[i] = new ByteBuffer();
				dereferenced.push(i);
			}
		}
		return dereferenced;
	}

	function error(...msg) {
		console.warn(...msg);
	}

	const reflect = _ => _;

	const treeLineDouble = false;

	const specialChars = String.fromCharCode(9562, 9492, 9568, 9500, 9552, 9472, 9553, 9474);

	const ch1100 = treeLineDouble ? specialChars[0] : specialChars[1];
	const ch1110 = treeLineDouble ? specialChars[2] : specialChars[3];
	const ch0101 = treeLineDouble ? specialChars[4] : specialChars[5];
	const ch1010 = treeLineDouble ? specialChars[6] : specialChars[7];

	FileSystem = class FileSystem {
		constructor() {
			this.files = [bytes("uint32", 0)];
			this.directoryAddress = 0;
			this.free = [];

			this.fileTypes = { dir: class Directory { } };
			this.createFileType(Number);
			this.createFileType(String);
			this.createFileType(Boolean);
			this.createFileType(Object);
			this.createFileType(GrayMap);
			this.createFileType(Texture);
		}
		get directory() {
			const array = [];

			let addr = this.directoryAddress;
			while (addr) {
				array.push(getDirectoryName(this, addr));
				addr = getParentAddress(getFile(this, addr));
			}

			return `h:/${array.reverse().join("/")}`;
		}
		createFileType(type, exts = [type.name.toLowerCase()]) {
			for (const ext of exts) {
				if (ext in this.fileTypes) {
					error(`extension '${ext}' already used for '${this.fileTypes[ext].name}'`);
				} else {
					this.fileTypes[ext] = type;
				}
			}
		}
		listFiles(all = false) {
			const entries = getDirectoryEntries(this, this.directoryAddress);

			return Array.from(entries.keys()).filter(fileName => all || fileName[0] !== ".").map(fileName => {
				if (getFileExt(fileName) === "dir") return getFileNameWithoutExt(fileName);
				return fileName;
			});
		}
		tree(address = this.directoryAddress) {
			const entries = Array.from(getDirectoryEntries(this, address)).filter(entry => entry[0][0] !== ".");

			let result = (address === this.directoryAddress) ? [this.directory] : [];

			for (let i = 0; i < entries.length; i++) {
				const [name, address] = entries[i];

				const isDir = getFileExt(name) === "dir";

				const lastLine = i === entries.length - 1;
				let newSection = `${lastLine ? ch1100 : ch1110}${ch0101 + ch0101}${isDir ? getFileNameWithoutExt(name) : name}`;
				if (isDir) {
					const subfiles = this.tree(address)
					newSection += subfiles ? "\n" + subfiles
						.split("\n")
						.map(line => (!lastLine ? ch1010 : " ") + "  " + line)
						.join("\n") : "";
				}

				result.push(newSection);

			}

			return result.join("\n");
		}
		fileExists(path) {
			return this.readFile(path, false, true) !== null;
		}
		directoryExists(path) {
			return this.fileExists(`${path}.dir`);
		}
		writeFile(path, contents = new ByteBuffer()) {
			contents = contents.toByteBuffer();

			const pieces = path.split("/").filter(reflect);
			const pathPieces = pieces.slice(0, pieces.length - 1);
			const name = pieces[pieces.length - 1];

			const { directoryAddress } = this;
			const directoryExists = this.changeDirectory(pathPieces.join("/"));

			if (!directoryExists) {
				this.directoryAddress = directoryAddress;
				return false;
			}

			writeFile(this, name, contents);

			this.directoryAddress = directoryAddress;

			return true;
		}
		deleteFile(path) {
			const pieces = path.split("/").filter(reflect);
			const pathPieces = pieces.slice(0, pieces.length - 1);
			const name = pieces[pieces.length - 1];
			const ext = getFileExt(name);

			const { directoryAddress } = this;
			const directoryExists = this.changeDirectory(pathPieces.join("/"));

			if (!directoryExists) {
				this.directoryAddress = directoryAddress;
				return false;
			}

			const entries = getDirectoryEntries(this, this.directoryAddress);

			if (!entries.has(name)) {
				error(`file '${name}' does not exist in '${this.directory}'`);
				this.directoryAddress = directoryAddress;
				return false;
			}

			entries.delete(name);
			entries.delete("...dir");
			entries.delete("..dir");
			const directoryBuffer = getFile(this, this.directoryAddress);
			directoryBuffer.pointer = 0;
			const parentAddress = directoryBuffer.read.uint32();
			directoryBuffer.clear();
			directoryBuffer.write.uint32(parentAddress);
			for (const [name, address] of entries) {
				directoryBuffer.write.string(name);
				directoryBuffer.write.uint32(address);
			}

			this.directoryAddress = directoryAddress;

			return true;
		}
		deleteDirectory(path) {
			const result = this.deleteFile(`${path}.dir`);
			this.free = getDereferenced(this);
			return result;
		}
		createDirectory(path) {
			path += ".dir";

			const pieces = path.split("/").filter(reflect);
			const pathPieces = pieces.slice(0, pieces.length - 1);
			const name = pieces[pieces.length - 1];

			const { directoryAddress } = this;
			const directoryExists = this.changeDirectory(pathPieces.join("/"));

			if (!directoryExists) {
				this.directoryAddress = directoryAddress;
				return false;
			}

			const entries = getDirectoryEntries(this, this.directoryAddress);
			if (entries.has(name)) {
				error(`directory '${getFileNameWithoutExt(path)}' already exists in '${this.directory}'`);
				this.directoryAddress = directoryAddress;
				return false;
			}


			writeFile(this, name, bytes("uint32", this.directoryAddress));

			this.directoryAddress = directoryAddress;

			return true;
		}
		readFile(path, raw = false, existenceCheck = false) {
			const pieces = path.split("/").filter(reflect);
			const pathPieces = pieces.slice(0, pieces.length - 1);
			const name = pieces[pieces.length - 1];
			const { directoryAddress } = this;
			const directoryExists = this.changeDirectory(pathPieces.join("/"));
			if (!directoryExists) {
				this.directoryAddress = directoryAddress;
				return null;
			}
			
			// get file
			const entries = getDirectoryEntries(this, this.directoryAddress);
			const file = getFile(this, entries.get(name));
			
			if (!file) {
				if (!existenceCheck) error(`file '${name}' does not exist in '${this.directory}'`);
				this.directoryAddress = directoryAddress;
				return null;
			}
			
			this.directoryAddress = directoryAddress;

			const ext = getFileExt(path);
			if (!raw && ext !== "dir" && ext in this.fileTypes) {
				const { pointer } = file;
				const result = this.fileTypes[ext].fromByteBuffer(file);
				file.pointer = pointer;
				return result;
			}

			return file;
		}
		createFile(path, create) {
			if (!this.fileExists(path)) this.writeFile(path, create());
			return this.readFile(path);
		}
		getFileSize(path) {
			const file = this.readFile(path, true);
			if (!file) return 0;
			else return file.pointer;
		}
		changeDirectory(path) {
			let relativePieces;
			if (path.toLowerCase().startsWith("h:")) {
				// absolute
				relativePieces = path.split("/");
				relativePieces.shift();
				this.directoryAddress = 0;
			} else {
				// relative
				relativePieces = path.split("/");
			}

			relativePieces = relativePieces.filter(reflect);

			for (const piece of relativePieces) {
				const directoryExists = changeDirectory(this, piece);
				if (!directoryExists) return false;
			}

			return true;
		}
		downloadFile(path) {
			const buffer = this.readFile(path, true).get();
			buffer.finalize();
			const base64 = buffer.toBase64();
			const a = document.createElement("a");
			const uri = "data:application/octet-stream;base64," + base64;
			a.setAttribute("href", uri);
			const pathPieces = path.split("/");
			const name = pathPieces[pathPieces.length - 1];
			a.setAttribute("download", name);
			return new Promise(resolve => {
				a.onclick = () => resolve();
				a.click();
			});
		}
		uploadFile(path = null) {
			const fi = document.createElement("input");
			fi.type = "file";
			fi.onchange = () => {
				const file = fi.files[0];
				if (file) {
					const reader = new FileReader();
					reader.readAsArrayBuffer(file);
					reader.onload = () => {
						const { result } = reader;
						const buffer = new ByteBuffer(result);
						buffer.pointer = result.byteLength;
						this.writeFile(path || file.name, buffer);
					}
				}
			};
			fi.click();
		}
		toString() {
			for (const file of this.files)
				if (file instanceof ByteBuffer) file.finalize();

			const buffer = new ByteBuffer();
			buffer.write.array("uint32", this.free);
			buffer.write.array("string", this.files.map(file => file.toString()));
			buffer.finalize();
			buffer.pointer = 0;
			buffer.pointer = buffer.byteLength;
			return buffer.toString();
		}
		static fromString(string) {
			const buffer = ByteBuffer.fromString(string);
			buffer.pointer = 0;
			const fs = new FileSystem();
			fs.free = buffer.read.array("uint32");
			fs.files = buffer.read.array("string");
			return fs;
		}
	};
})();