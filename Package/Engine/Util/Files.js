/**
 * Represents a serializable file system that can be modified with a command-line-like interface.
 * File paths in this system are similar to those used in Windows, except that they use a forward slash "/" separator, and the base drive is `h:` rather than `C:`.
 * Various file types can be specified, such that complex classes can be written to the file system and retrieved.
 * All built-in Serializable objects can be written to the file system, with their extensions being the lowercase version of their names (e.g. `.string` for String).
 * This class is primarily used in the `.fileSystem` property of both the global object and Hengine.
 * ```js
 * // the file type class
 * class Triple {
 * 	constructor(a, b, c) {
 * 		this.a = a;
 * 		this.b = b;
 * 		this.c = c;
 * 	}
 * 
 * 	toByteBuffer(buffer = new ByteBuffer()) {
 * 		buffer.write.float64(this.a);
 * 		buffer.write.float64(this.b);
 * 		buffer.write.float64(this.c);
 * 		return buffer;
 * 	}
 * 
 * 	static fromByteBuffer(buffer) {
 * 		return new Triple(
 * 			buffer.read.float64(),
 * 			buffer.read.float64(),
 * 			buffer.read.float64()
 * 		);
 * 	}
 * }
 * 
 * // register file type
 * fileSystem.createFileType(Triple);
 * 
 * const value = new Triple(10, 20, 30.5);
 * fileSystem.writeFile("h:/tripleFile.triple", value);
 * 
 * const readValue = fileSystem.readFile("h:/tripleFile.triple");
 * console.log(readValue); // Triple { a: 10, b: 20, c: 30.5 }
 * ```
 */
class Files {
	/**
	 * Creates a new Files.
	 */
	constructor() {
		this.files = [ByteBuffer.of(0, "uint32")];
		this.directoryAddress = 0;
		this.free = [];

		this.fileTypes = { dir: class Directory { } };
		this.createFileType(ByteBuffer, [""]);
		for (const Type of [
			Number, String, Boolean, Object, GrayMap,
			Texture, Vector2, Vector3, Vector4, Color
		]) this.createFileType(Type);
	}
	/**
	 * Returns the current active directory.
	 * @return String
	 */
	get directory() {
		const array = [];

		let addr = this.directoryAddress;
		while (addr) {
			array.push(this.getDirectoryName(addr));
			addr = Files.getParentAddress(this.readAddress(addr));
		}

		return `h:/${array.reverse().join("/")}`;
	}
	error(...msg) {
		console.warn(...msg);
	}
	getDirectoryEntries(address) {
		const buffer = this.readAddress(address);
		const entries = new Map();
		const { pointer } = buffer;
		buffer.pointer = 0;
		entries.set("...dir", buffer.read.uint32());
		entries.set("..dir", address);
		while (true) {
			const name = buffer.read.string();
			const address = buffer.read.uint32();
			if (!address) break;
			entries.set(name, address);
		}
		buffer.pointer = pointer;
		return entries;
	}
	getDirectoryName(address) {
		const parentEntries = this.getDirectoryEntries(
			Files.getParentAddress(this.readAddress(address))
		);
		for (const [name, childAddress] of parentEntries) {
			if (name === "..dir") continue;
			if (childAddress === address) {
				if (name === "...dir") return "";
				return Files.getNameWithoutExt(name);
			}
		}

		return "$null$";
	}
	readAddress(address) {
		let buffer = this.files[address];
		if (!buffer) return null;
		if (typeof buffer === "string")
			buffer = ByteBuffer.fromString(buffer);
		this.files[address] = buffer;
		return this.files[address];
	}
	setDirectoryEntry(name, contents) {
		const entries = this.getDirectoryEntries(this.directoryAddress);
		if (!entries.has(name)) {
			const fileIndex = this.free.length ? this.free.shift() : this.files.length;
			this.files[fileIndex] = contents;
			const directoryBuffer = this.readAddress(this.directoryAddress);
			directoryBuffer.write.string(name);
			directoryBuffer.write.uint32(fileIndex);

			return true;
		}

		const address = entries.get(name);
		this.files[address] = contents;
		return false;
	}
	getContainedFiles(address) {
		const entries = this.getDirectoryEntries(address);
		const referenced = new Set([address]);
		for (const [name, fileAddress] of entries) {
			if (Files.isDirectory(name)) {
				const base = Files.getNameWithoutExt(name);
				if (base === ".." || base === ".") continue;
				for (const address of this.getContainedFiles(fileAddress))
					referenced.add(address);
			} else {
				referenced.add(fileAddress);
			}
		}
		return referenced;
	}
	/**
	 * @type createFileType<T extends Serializable>(type: Class<T>, extensions?: string[]): void;
	 * Registers a new file type.
	 * The instance method `.toByteBuffer()` will be invoked when the type is written to the file system, and the static method `.fromByteBuffer()` will be invoked when reading.
	 * @param Class implements Serializable type | The data type that can be written and read to and from the file system
	 * @param String[] extensions? | A list of file name extensions that will have this type applied. Default is the name of the type
	 */
	createFileType(type, exts = [type.name.toLowerCase()]) {
		for (const ext of exts) {
			if (ext in this.fileTypes) {
				this.error(`extension '${ext}' already used for '${this.fileTypes[ext].name}'`);
			} else {
				this.fileTypes[ext] = type;
			}
		}
	}
	/**
	 * Returns the names of all the files in the current directory.
	 * @param Boolean all? | Whether or not files beginning with "." should be included. Default is false 
	 * @return String[]
	 */
	listFiles(all = false) {
		const entries = this.getDirectoryEntries(this.directoryAddress);

		return Array.from(entries.keys()).filter(fileName => all || fileName[0] !== ".").map(fileName => {
			return Files.isDirectory(fileName) ? Files.getNameWithoutExt(fileName) : fileName;
		});
	}
	/**
	 * Returns a human-readable file tree of the current directory.
	 * @return String
	 */
	tree(address = this.directoryAddress) {
		const entries = Array.from(this.getDirectoryEntries(address)).filter(entry => entry[0][0] !== ".");

		let result = address === this.directoryAddress ? [this.directory] : [];

		for (let i = 0; i < entries.length; i++) {
			const [name, address] = entries[i];

			const isDir = Files.isDirectory(name);

			const lastLine = i === entries.length - 1;
			let newSection = `${lastLine ? "└" : "├"}──${isDir ? Files.getNameWithoutExt(name) : name}`;
			if (isDir) {
				const subfiles = this.tree(address)
				newSection += subfiles ? "\n" + subfiles
					.split("\n")
					.map(line => (!lastLine ? "│" : " ") + "  " + line)
					.join("\n") : "";
			}

			result.push(newSection);
		}

		return result.join("\n");
	}
	/**
	 * Checks whether or not a file exists.
	 * @param String path | The file path to check
	 * @return Boolean
	 */
	fileExists(path) {
		return this.readFile(path, false, true) !== null;
	}
	/**
	 * Checks whether or not a directory exists.
	 * @param String path | The directory path to check
	 * @return Boolean
	 */
	directoryExists(path) {
		return this.fileExists(`${path}.dir`);
	}
	/**
	 * Writes a file to a specified path.
	 * Returns whether the file was successfully written.
	 * @param String path | The file path to write to
	 * @param Any contents | The data to write to the file
	 * @param Boolean raw? | Whether or not the contents parameter is a ByteBuffer to be written directly rather than being file-type-specific data to be converted. Default is false 
	 * @return Boolean
	 */
	writeFile(path, contents = new ByteBuffer(), raw = false) {
		if (!raw) contents = contents.toByteBuffer();

		const { directory, name } = Files.parsePath(path);

		const { directoryAddress } = this;
		try {
			if (!this.changeDirectory(directory))
				return false;

			this.setDirectoryEntry(name, contents);
			return true;
		} finally {
			this.directoryAddress = directoryAddress;
		}
	}
	/**
	 * Deletes a file at a specified path.
	 * Returns whether the file was successfully deleted.
	 * @param String path | The file path to delete
	 * @return Boolean
	 */
	deleteFile(path) {
		const { directory, name } = Files.parsePath(path);

		const { directoryAddress } = this;
		try {
			if (!this.changeDirectory(directory))
				return false;

			const entries = this.getDirectoryEntries(this.directoryAddress);

			if (!entries.has(name)) {
				this.error(`file '${name}' does not exist in '${this.directory}'`);
				return false;
			}

			entries.delete(name);
			entries.delete("...dir");
			entries.delete("..dir");
			
			const directoryBuffer = this.readAddress(this.directoryAddress);
			directoryBuffer.pointer = 0;
			const parentAddress = directoryBuffer.read.uint32();
			
			directoryBuffer.clear();
			directoryBuffer.write.uint32(parentAddress);
			for (const [name, address] of entries) {
				directoryBuffer.write.string(name);
				directoryBuffer.write.uint32(address);
			}

			return true;
		} finally {
			this.directoryAddress = directoryAddress;
		}
	}
	/**
	 * Deletes a directory at a specified path.
	 * Returns whether the directory was successfully deleted.
	 * @param String path | The directory path to delete
	 * @return Boolean
	 */
	deleteDirectory(path) {
		const result = this.deleteFile(`${path}.dir`);
		const referenced = this.getContainedFiles(0);
		this.free = [];
		for (let i = 0; i < this.files.length; i++) {
			if (!referenced.has(i)) {
				this.files[i] = new ByteBuffer();
				this.free.push(i);
			}
		}
		return result;
	}
	/**
	 * Creates a new directory at a specified path.
	 * Returns whether the directory was successfully created.
	 * @param String path | The path to create the directory at
	 * @return Boolean
	 */
	createDirectory(path) {
		const { directory, name } = Files.parsePath(`${path}.dir`);

		const { directoryAddress } = this;
		try {
			if (!this.changeDirectory(directory))
				return false;

			const entries = this.getDirectoryEntries(this.directoryAddress);
			if (entries.has(name)) {
				this.error(`directory '${path}' already exists in '${this.directory}'`);
				return false;
			}

			this.setDirectoryEntry(name, ByteBuffer.of(this.directoryAddress, "uint32"));

			return true;
		} finally {
			this.directoryAddress = directoryAddress;
		}
	}
	/**
	 * Reads a file from a specified path.
	 * Returns null if it fails.
	 * @param String path | The file path to read
	 * @param Boolean raw? | Whether the data should be returned as a ByteBuffer, or as a file-type-specific converted type. Default is false
	 * @return Any/null
	 */
	readFile(path, raw = false, existenceCheck = false) {
		const { directory, name } = Files.parsePath(path);

		const { directoryAddress } = this;
		try {
			if (!this.changeDirectory(directory))
				return null;

			// get file
			const entries = this.getDirectoryEntries(this.directoryAddress);
			const file = this.readAddress(entries.get(name));

			if (!file) {
				if (!existenceCheck) this.error(`file '${name}' does not exist in '${this.directory}'`);
				return null;
			}

			const ext = Files.getExt(path);
			if (!raw && ext !== "dir" && ext in this.fileTypes) {
				const { pointer } = file;
				file.pointer = 0;
				const result = this.fileTypes[ext].fromByteBuffer(file);
				file.pointer = pointer;
				return result;
			}

			return file;
		} finally {
			this.directoryAddress = directoryAddress;
		}
	}
	/**
	 * Creates a new file if it doesn't exist.
	 * Returns the content of the file.
	 * @param String path | The file to write to
	 * @param () => Any create | The function used to initially create the file content
	 * @return Any
	 */
	createFile(path, create) {
		if (!this.fileExists(path)) this.writeFile(path, create());
		return this.readFile(path);
	}
	/**
	 * Checks the file size of a specified file.
	 * @param String path | The file path to check
	 * @return Number
	 */
	getFileSize(path) {
		const file = this.readFile(path, true);
		if (!file) return 0;
		else return file.pointer;
	}
	/**
	 * Changes the current directory.
	 * Returns whether the current directory was successfully changed.
	 * @param String path | The path of the new directory
	 * @return Boolean
	 */
	changeDirectory(path) {
		const relativePieces = path.split("/").filter(Boolean);

		if (relativePieces[0]?.toLowerCase?.() === "h:") {
			this.directoryAddress = 0;
			relativePieces.shift();
		}

		for (const dirName of relativePieces) {
			if (dirName === ".") continue;
			const entries = this.getDirectoryEntries(this.directoryAddress);
			const dirFileName = `${dirName}.dir`;

			if (!entries.has(dirFileName)) {
				this.error(`directory '${dirName}' does not exist in '${this.directory}'`);
				return false;
			}
			
			this.directoryAddress = entries.get(dirFileName);
		}

		return true;
	}
	/**
	 * Downloads a file onto the user's computer.
	 * Returns a promise which resolves when the download occurs.
	 * @param String path | The file to download
	 * @return Promise
	 */
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
			a.addEventListener("click", () => resolve());
			a.click();
		});
	}
	/**
	 * Lets the user upload a file from their computer to a specified location.
	 * Returns a promise which resolves when the file is uploaded.
	 * @param String path | The destination path for the file
	 * @return Promise
	 */
	uploadFile(path = null) {
		const fi = document.createElement("input");
		fi.type = "file";
		return new Promise(resolve => {
			fi.addEventListener("change", () => {
				const file = fi.files[0];
				if (file) {
					path ??= file.name;
					const reader = new FileReader();
					reader.readAsArrayBuffer(file);
					reader.addEventListener("load", () => {
						const { result } = reader;
						const buffer = new ByteBuffer(result);
						buffer.pointer = result.byteLength;
						this.writeFile(path, buffer, true);
						resolve(path);
					});
				}
			});
			fi.click();
		});
	}
	/**
	 * Serializes the file system to a data string.
	 * @return String
	 */
	toString() {
		for (const file of this.files)
			if (file instanceof ByteBuffer) file.finalize();

		const buffer = new ByteBuffer();
		buffer.write.array("uint32", this.free);
		buffer.write.array("string", this.files.map(file => file.toString()));
		buffer.finalize();
		buffer.pointer = buffer.byteLength;
		return buffer.toString();
	}
	static getExt(name) {
		const index = name.lastIndexOf(".");
		return index >= 0 ? name.slice(index + 1) : "";
	}
	static getNameWithoutExt(name) {
		const index = name.lastIndexOf(".");
		return index >= 0 ? name.slice(0, index) : name;
	}
	static parsePath(path) {
		const pieces = path.split("/").filter(Boolean);
		const directory = pieces.slice(0, -1).join("/");
		const name = pieces.last;
		return { directory, name };
	}
	static isDirectory(path) {
		return this.getExt(path) === "dir";
	}
	static getParentAddress(buffer) {
		const { pointer } = buffer;
		buffer.pointer = 0;
		const address = buffer.read.uint32();
		buffer.pointer = pointer;
		return address;
	}
	/**
	 * Deserializes a file system from a data string.
	 * @param String string | The data string to deserialize 
	 * @return Files
	 */
	static fromString(string) {
		const buffer = ByteBuffer.fromString(string);
		buffer.pointer = 0;
		const fs = new Files();
		fs.free = buffer.read.array("uint32");
		fs.files = buffer.read.array("string");
		return fs;
	}
};