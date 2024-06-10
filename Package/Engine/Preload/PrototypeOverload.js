/**
 * Subclasses of this class represent a set of unique symbolic values.
 * @abstract
 * ```js
 * const Options = Enum.define("YES", "NO", "MAYBE");
 * const answer = Options.YES;
 * ```
 * @prop String name | The name of the symbol. This property is read-only
 */
class Enum {
	constructor(name) {
		this.name = name;
	}

	/**
	 * Returns the name of the symbolic value.
	 * @return String
	 */
	toString() {
		return this.name;
	}

	/**
	 * Creates a new subclass of Enum based on a specific set of unique names.
	 * Static properties with these names will be defined on the return value and will contain the associated symbolic values.
	 * @param String[] ...names | The names for the symbolic values
	 * @return Class
	 */
	static define(...names) {
		const enumeration = class extends Enum { };
		for (let i = 0; i < names.length; i++) {
			const name = names[i];
			Object.defineProperty(enumeration, name, {
				value: new enumeration(name),
				writable: false,
				enumerable: true
			});
		}
		return Object.freeze(enumeration);
	}
}

window.__devicePixelRatio = devicePixelRatio;

Object.defineProperty(window, "title", {
	get() {
		const tag = document.querySelector("title");
		if (!tag) return "";
		return tag.innerText;
	},
	set(a) {
		let tag = document.querySelector("title");
		if (!tag) {
			tag = document.createElement("title");
			document.head.appendChild(tag);
		}
		tag.innerText = a;
	}
});
(function () {
	function proto(obj, name, value) {
		Object.defineProperty(obj, name, { value, enumerable: false });
	}
	function protoGetSet(obj, name, get, set) {
		Object.defineProperty(obj, name, { get, set, enumerable: false });
	}
	// types
	function addByteBufferConversions(type, bufferType) {
		if (typeof bufferType === "string") {
			proto(type.prototype, "toByteBuffer", function (buffer = new ByteBuffer()) {
				buffer.write[bufferType](this);
				return buffer;
			});
			proto(type, "fromByteBuffer", function (buffer) {
				return buffer.read[bufferType]();
			});
		} else {
			proto(type.prototype, "toByteBuffer", function (buffer = new ByteBuffer()) {
				bufferType[0](this, buffer);
				return buffer;
			});
			proto(type, "fromByteBuffer", function (buffer) {
				return bufferType[1](buffer);
			});
		}
	}
	
	addByteBufferConversions(String, "string");
	addByteBufferConversions(Number, "float64");
	addByteBufferConversions(Boolean, "bool");
	addByteBufferConversions(Object, "object");

	{ // webgl
		function overrideGetContext(CanvasType) {
			const { getContext } = CanvasType.prototype;

			proto(CanvasType.prototype, "getContext", function (name, options) {
				if (name === "webgl2" && !window.WebGL2RenderingContext) {
					const context = getContext.call(this, "webgl", options) ?? getContext.call(this, "experimental-webgl", options);

					// instancing
					const instancing = context.getExtension("ANGLE_instanced_arrays");
					proto(context, "vertexAttribDivisor", instancing.vertexAttribDivisorANGLE.bind(instancing));
					proto(context, "drawArraysInstanced", instancing.drawArraysInstancedANGLE.bind(instancing));
					proto(context, "drawElementsInstanced", instancing.drawElementsInstancedANGLE.bind(instancing));

					// shader transpilation
					const { shaderSource } = WebGLRenderingContext.prototype;
					proto(context, "shaderSource", function (shader, source) {
						const type = this.getShaderParameter(shader, this.SHADER_TYPE);

						source = source
							.replace(/\/\/(.*?)(\n|$)/g, "$2") // single line comments
							.replace(/\/\*((.|\n)*?)\*\//g, "") // multiline comments
							.replace(/\#version 300 es/g, "")
							.replace(/\btexture\b/g, "texture2D");

						if (type === this.VERTEX_SHADER) { // vs
							source = source
								.replace(/\bin\b/g, "attribute")
								.replace(/\bout\b/g, "varying");
						} else { // fs
							source = source.replace(/\bin\b/g, "varying");

							const outRegex = /\bout\b(?:\s*\w+)*\s*(\w+);/g;
							const outputName = source
								.match(outRegex)[0]
								.split(" ").last
								.slice(0, -1);

							const outputNameRegex = new RegExp(String.raw`\b${outputName}\b`, "g");
							source = source
								.replace(outRegex, "")
								.replace(outputNameRegex, "gl_FragColor");
						}

						return shaderSource.call(this, shader, source);
					});

					return context;
				} else return getContext.call(this, name, options);
			});
		}
		overrideGetContext(HTMLCanvasElement);
		if (window.OffscreenCanvas) overrideGetContext(OffscreenCanvas);
	}


	//Function
	proto(Function.prototype, "param", function (...args) {
		return function () {
			this(...args);
		};
	});
	proto(Function.prototype, "performance", function (iter, ...args) {
		const start = performance.now();
		for (let i = 0; i < iter; i++) {
			this(...args);
		}
		const end = performance.now();
		return (end - start) / iter;
	});
	
	/**
	 * @name class Array
	 * The built-in Array class has some additional quality-of-life methods in the Hengine.
	 * @prop Any last | The last element of the array
	 */
	protoGetSet(Array.prototype, "last", function () {
		return this[this.length - 1];
	}, function (value) {
		if (this.length) this[this.length - 1] = value;
	});
	/**
	 * @name pushArray
	 * Pushes each element in an array to the end of the caller.
	 * @param Any[] array | The array to add to the end
	 */
	proto(Array.prototype, "pushArray", function (arr) {
		const len = arr.length;
		for (let i = 0; i < len; i++) this.push(arr[i]);
	});
	proto(Array.prototype, "map", function (fn, ...coords) {
		const result = [];
		for (let i = 0; i < this.length; i++) result.push(fn(this[i], ...coords, i));
		return result;
	});
	proto(Array.prototype, "forEach", function (fn, ...coords) {
		for (let i = 0; i < this.length; i++) fn(this[i], ...coords, i);
	});
	proto(Array.prototype, "some", function (fn, ...coords) {
		for (let i = 0; i < this.length; i++)
			if (fn(this[i], ...coords, i)) return true;
		return false;
	});
	proto(Array.prototype, "every", function (fn, ...coords) {
		for (let i = 0; i < this.length; i++)
			if (!fn(this[i], ...coords, i)) return false;
		return true;
	});
	proto(Array.prototype, "flatten", function () {
		return this;
	});
	proto(Array.prototype, "sample", function (index) {
		if (index in this) return this[index];
		return null;
	});
	Array.makeMultidimensional = function (arr) {
		proto(arr, "multiDimensional", true);
		proto(arr, "sample", function (...indices) {
			const index = indices[0];
			indices.shift();
			if (index in this) return this[index].sample(...indices);
			return null;
		}.bind(arr));
		proto(arr, "flatten", function () {
			const result = [];
			for (let i = 0; i < this.length; i++) result.pushArray(this[i].flatten());
			return result;
		}.bind(arr));
		proto(arr, Symbol.iterator, function* () {
			const all = this.flatten();
			for (let i = 0; i < all.length; i++) yield all[i];
		}.bind(arr));
		proto(arr, "forEach", function (fn, ...coords) {
			for (let i = 0; i < this.length; i++) this[i].forEach(fn, ...coords, i);
		}.bind(arr));
		proto(arr, "map", function (fn, ...coords) {
			const result = Array.makeMultidimensional([]);
			for (let i = 0; i < this.length; i++) result.push(this[i].map(fn, ...coords, i));
			return result;
		}.bind(arr));
		proto(arr, "some", function (fn, ...coords) {
			for (let i = 0; i < this.length; i++)
				if (this[i].some(fn, ...coords, i)) return true;
			return false;
		}.bind(arr));
		proto(arr, "every", function (fn, ...coords) {
			for (let i = 0; i < this.length; i++)
				if (!this[i].every(fn, ...coords, i)) return false;
			return true;
		}.bind(arr));
		proto(arr, "fill", function (value) {
			for (let i = 0; i < this.length; i++) this[i].fill(value);
			return this;
		}.bind(arr));
		return arr;
	};

	/**
	 * @name static dim
	 * Creates a multidimensional array, on which standard array operations can be performed with additional arguments.
	 * e.g. `arr.map((value, i, j) => ...)` for a 2D array.
	 * @param Number[] ...dims | The sizes of the each dimension of the array.
	 * @return Array 
	 */
	Array.dim = function (...dims) {
		const arr = [];
		if (dims.length > 1) {
			const dim = dims.shift();
			Array.makeMultidimensional(arr);
			for (let i = 0; i < dim; i++) arr.push(Array.dim(...dims));
		} else {
			for (let i = 0; i < dims[0]; i++) arr.push(null);
		}
		return arr;
	};
	/**
	 * @name class Number extends Operable
	 * The built-in Number class has some additional utility methods in the Hengine.
	 * The class extends Operable only in the sense that it has all of the same methods, excluding those that modify the caller in-place.
	 */
	/**
	 * @name toDegrees
	 * Returns the caller (interpreted as radians) converted to degrees.
	 * @return Number 
	 */
	proto(Number.prototype, "toDegrees", function () {
		return this * (180 / Math.PI);
	});
	/**
	 * @name toRadians
	 * Returns the caller (interpreted as degrees) converted to radians.
	 * @return Number
	 */
	proto(Number.prototype, "toRadians", function () {
		return this * (Math.PI / 180);
	});
	proto(Number.prototype, "movedTowards", function (value, ferocity) {
		const dir = ferocity * (value - this) * 2;
		return this + dir;
	});
	/**
	 * @name toMaxed
	 * Converts the number to a string with a specified maximum number of digits.
	 * Trailing zeros will be discarded.
	 * @param Number digits | The maximum number of digits past the decimal point
	 * @return Number
	 */
	proto(Number.prototype, "toMaxed", function (digits) {
		return String(Math.round(this * 10 ** digits) / 10 ** digits);
	});
	/**
	 * @name class String
	 * The built-in String class has some additional utility methods in the Hengine.
	 */
	/**
	 * @name capitalize
	 * Returns a copy of the caller with the first character capitalized.
	 * @return String
	 */
	proto(String.prototype, "capitalize", function () {
		return this[0].toUpperCase() + this.slice(1);
	});
	/**
	 * @name cut
	 * Returns the caller split along the first instance of a substring.
	 * If the substring is not found, it will return an array containing the caller as the first element and the empty string as the second.
	 * @param String boundary | The substring to split on
	 * @return String[2]
	 */
	proto(String.prototype, "cut", function (char) {
		const inx = this.indexOf(char);
		if (inx === -1) return [this, ""];
		return [
			this.slice(0, inx),
			this.slice(inx + char.length)
		];
	});
	/**
	 * @name indent
	 * Returns the caller with each line indented by a single tab character.
	 * @return String
	 */
	proto(String.prototype, "indent", function () {
		return this.split("\n").map(str => "\t" + str).join("\n");
	});
	proto(String.prototype, "inverseMatchAll", function (regex) {
		let validMap = new Array(this.length).fill(true);

		let result = [];

		let matchAll = this.matchAll(regex);
		for (let match of matchAll) {
			let full = match[0];
			let index = match.index;
			for (let i = 0; i < full.length; i++) validMap[index + i] = false;
		}

		for (let i = 0; i < this.length; i++) {
			let acc = "";
			let startIndex = i;
			while (validMap[i]) {
				acc += this[i];
				i++;
			}
			if (acc.length) {
				let match = [acc];
				match.index = startIndex;
				match.input = String(this);
				match.groups = undefined;
				result.push(match);
			}
		}

		return result;
	});
	(function () {
		function tabs(str) {
			let tabs = str.match(/(    |\t)/g);
			tabs = tabs ? tabs.length : 0;
			return tabs;
		}
		function cls(obj) {
			return obj.constructor.name;
		}
		function string(value, depth) {
			if (value === null) return "null";
			if (typeof value === "string") return JSON.stringify(value);
			if (typeof value === "number") return String(value);
			if (typeof value === "bigint") return value + "n";
			if (typeof value === "function") {
				value += "";
				let lines = value.split("\n");
				if (lines.length <= 1) return value;
				let tbs = tabs(lines[0]);
				let tbs1 = tabs(lines[1]) - 1;
				if (tbs1 <= tbs) return value;
				else {
					while (tabs(lines[1]) - 1 > tbs) {
						lines = lines.map((l, i) => i ? l.replace(/(\t|    )/, "") : l);
					}
					return lines.join("\n");
				}
			}
			return value.toString(depth);
		}
		proto(Object.prototype, "toString", function (depth = 0) {
			if (depth < 0) {
				if (typeof this[Symbol.iterator] === "function") return cls(this) + `(${[...this].length})`;
				return "[object " + cls(this) + "]";
			}

			let contents = [];
			for (let key in this) {
				let statement = "";
				statement += key + ": " + string(this[key], depth - 1);
				contents.push(statement);
			}
			if (!contents.length) return cls(this) + "(0) { }";
			return `${cls(this)}(${contents.length}) { 
${contents.join(",\n").indent()}
}`.replace(/\t/g, "   ");
		});
	})();
	proto(Array.prototype, "toString", Object.prototype.toString);

	Object.generateInterface = function (object, template = {}, found = new Map()) {
		for (const key in object) {
			const value = object[key];
			const type = typeof value;
			if (type === "object") {
				if (value === null) continue;
				if (found.has(value)) template[key] = found.get(value);
				else {
					const child = {};
					found.set(value, child);
					template[key] = Object.generateInterface(value, child, found);
				}
			} else if (type !== "function") template[key] = type;
		}
		return template;
	};
	Object.shortcut = function (objectA, objectB, key) {
		Object.defineProperty(objectA, key, {
			set: a => objectB[key] = a,
			get: () => objectB[key]
		});
	};

	//Make Number behave like Operable
	Number.abs = n => Math.abs(n);
	Number.clamp = (n, a, b) => Math.max(a, Math.min(b, n));
	Number.lerp = (a, b, t) => a * (1 - t) + b * t;
	Number.remap = (n, a, b, a2, b2) => (n - a) / (b - a) * (b2 - a2) + a2;
	Number.min = (a, b) => Math.min(a, b);
	Number.max = (a, b) => Math.max(a, b);
	Number.sum = numbers => numbers.reduce((a, b) => a + b, 0);
	Number.avg = numbers => Number.sum(numbers) / numbers.length;
	Object.defineProperty(Number.prototype, "mag", {
		get() {
			return Math.abs(this);
		},
		enumerable: false
	});
	Object.defineProperty(Number.prototype, "sqrMag", {
		get() {
			return this ** 2;
		},
		enumerable: false
	});
	proto(Number.prototype, "plus", function (n) { return this + n; });
	proto(Number.prototype, "minus", function (n) { return this - n; });
	proto(Number.prototype, "times", function (n) { return this * n; });
	proto(Number.prototype, "over", function (n) { return this / n; });
	proto(Number.prototype, "mod", function (n) { return this % n; });
	proto(Number.prototype, "get", function () { return this; });
	proto(Number.prototype, "equals", function (n) { return this === n || Math.abs(this - n) < Operable.EPSILON; });

	Number.empty = 0;

	/**
	 * @name class Storage
	 * The storage class has some additional quality-of-life methods in the Hengine designed to promote safe usage.
	 */
	const defaultStorageClear = Storage.prototype.clear;
	/**
	 * @name downloadBackup
	 * Downloads a JSON backup of the storage object.
	 * @param String file? | The base name of the backup file. The default is `"backup"`
	 */
	proto(Storage.prototype, "downloadBackup", function (file = "backup") {
		const a = document.createElement("a");
		const uri = `data:text/json;charset=UTF-8,${encodeURIComponent(JSON.stringify(this))}`;
		a.setAttribute("href", uri);
		a.setAttribute("download", `${file} (localStorage backup on ${new Date().toDateString()}).json`);
		a.click();
	});
	/**
	 * @name clear
	 * Clears the storage object after asking permission from the user.
	 * If permission is given, a backup will be downloaded before the storage object is cleared.
	 * Returns whether or not the clearing succeeded.
	 * @param String file? | The base name of the backup file. The default is `"backup"`
	 * @return Boolean
	 */
	proto(Storage.prototype, "clear", function (file) {
		if (!confirm(`Do you truly, absolutely seriously, accepting ALL of the consequences, want to clear localStorage?`))
			return false;
		
		this.downloadBackup(file);
		defaultStorageClear.call(this);
		return true;
	});
	/**
	 * @name uploadBackup
	 * Replaces the current content of the storage object with a user-selected JSON backup.
	 * Before the file dialog is opened, this will call `.clear()`, which will ask permission and download a backup. If permission is not given, the entire upload operation will be canceled.
	 */
	proto(Storage.prototype, "uploadBackup", function () {
		if (!this.clear()) return;

		// recreate
		const input = document.createElement("input");
		input.type = "file";
		return new Promise(resolve => {
			input.addEventListener("change",  event => {
				const file = input.files[0];
				const reader = new FileReader();
				reader.addEventListener("load", () => {
					const text = reader.result;
					const parsedObject = JSON.parse(text);
					for (const key in parsedObject) {
						const value = parsedObject[key];
						if (typeof value === "string") this[key] = value;
					}
					resolve();
				});
				reader.readAsText(file);
			});
			input.click();
		});
	});

})();