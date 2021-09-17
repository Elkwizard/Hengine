function defineEnum(...values) {
	const obj = {};
	for (let i = 0; i < values.length; i++) obj[values[i]] = Symbol(values[i]);
	return obj;
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
			proto(type.prototype, "toByteBuffer", function () {
				const buffer = new ByteBuffer();
				buffer.write[bufferType](this);
				return buffer;
			});
			proto(type, "fromByteBuffer", function (buffer) {
				buffer.pointer = 0;
				return buffer.read[bufferType]();
			});
		} else {
			proto(type.prototype, "toByteBuffer", function () {
				const buffer = new ByteBuffer();
				bufferType[0](this, buffer);
				return buffer;
			});
			proto(type, "fromByteBuffer", function (buffer) {
				buffer.pointer = 0;
				return bufferType[1](buffer);
			});
		}
	}
	addByteBufferConversions(String, "string");
	addByteBufferConversions(Number, "float64");
	addByteBufferConversions(Boolean, "bool");
	addByteBufferConversions(Object, [
		function (object, buffer) {
			buffer.write.string(JSON.stringify(object));
		},
		function (buffer) {
			return JSON.parse(buffer.read.string());
		}
	]);

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
					const { createShader, shaderSource } = WebGLRenderingContext.prototype;
					proto(context, "createShader", function (type) {
						const shader = createShader.call(this, type);
						shader.__type = type;
						return shader;
					});
					proto(context, "shaderSource", function (shader, source) {
						const { __type } = shader;

						source = source
							.replace(/\/\/(.*?)(\n|$)/g, "$2") // single line comments
							.replace(/\/\*((.|\n)*?)\*\//g, "") // multiline comments
							.replace(/\#version 300 es/g, "")
							.replace(/\btexture\b/g, "texture2D");

						if (__type === context.VERTEX_SHADER) { // vs
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
		const t_1 = performance.now();
		for (let i = 0; i < iter; i++) {
			this(...args);
		}
		const t_2 = performance.now();
		return (t_2 - t_1) / iter;
	});
	//Array
	protoGetSet(Array.prototype, "last", function () {
		return this[this.length - 1];
	}, function (value) {
		if (this.length) this[this.length - 1] = value;
	});
	proto(Array.prototype, "pushArray", function (arr) {
		let len = arr.length;
		for (let i = 0; i < len; i++) this.push(arr[i]);
	});
	proto(Array.prototype, "map", function (fn, ...coords) {
		let result = [];
		for (let i = 0; i < this.length; i++) result.push(fn(this[i], ...coords, i));
		return result;
	});
	proto(Array.prototype, "forEach", function (fn, ...coords) {
		for (let i = 0; i < this.length; i++) fn(this[i], ...coords, i);
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
			let index = indices[0];
			indices.shift();
			if (index in this) return this[index].sample(...indices);
			return null;
		}.bind(arr));
		proto(arr, "flatten", function () {
			let result = [];
			for (let i = 0; i < this.length; i++) result.pushArray(this[i].flatten());
			return result;
		}.bind(arr));
		proto(arr, Symbol.iterator, function* () {
			let all = this.flatten();
			for (let i = 0; i < all.length; i++) yield all[i];
		}.bind(arr));
		proto(arr, "forEach", function (fn, ...coords) {
			for (let i = 0; i < this.length; i++) this[i].forEach(fn, ...coords, i);
		}.bind(arr));
		proto(arr, "map", function (fn, ...coords) {
			let result = [];
			Array.makeMultidimensional(result);
			for (let i = 0; i < this.length; i++) result.push(this[i].map(fn, ...coords, i));
			return result;
		}.bind(arr));
		proto(arr, "fill", function (value) {
			for (let i = 0; i < this.length; i++) this[i].fill(value);
			return this;
		}.bind(arr));
	}
	Array.dim = function (...dims) {
		let ary = [];
		if (dims.length > 1) {
			let dim = dims.shift();
			Array.makeMultidimensional(ary);
			for (let i = 0; i < dim; i++) ary.push(Array.dim(...dims));
		} else {
			for (let i = 0; i < dims[0]; i++) ary.push(null);
		}
		return ary;
	};
	proto(Array.prototype, "test", function (test) {
		for (let i = 0; i < this.length; i++) if (test(this[i])) return true;
		return false;
	});
	proto(Array.prototype, "randomize", function () {
		const result = [];
		const copy = [...this];
		while (copy.length) {
			result.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
		}
		return result;
	});
	proto(Array.prototype, "total", function () {
		return this.reduce((a, b) => a + b);
	});
	//Number
	proto(Number.prototype, "toDegrees", function () {
		return this * (180 / Math.PI);
	});
	proto(Number.prototype, "toRadians", function () {
		return this * (Math.PI / 180);
	});
	proto(Number.prototype, "movedTowards", function (value, ferocity) {
		let dir = ferocity * (value - this) * 2;
		return this + dir;
	});
	proto(Number.prototype, "toMaxed", function (digits) {
		return Math.round(this * 10 ** digits) / 10 ** digits + "";
	});
	//String
	proto(String.prototype, "capitalize", function () {
		return this[0].toUpperCase() + this.slice(1);
	});
	proto(String.prototype, "cut", function (char) {
		const inx = this.indexOf(char);
		if (inx === -1) return [this, ""];
		return [
			this.slice(0, inx),
			this.slice(inx + 1)
		];
	});
	proto(String.prototype, "pad", function (size) {
		return " ".repeat(size - this.length) + this;
	});
	proto(String.prototype, "padRight", function (size) {
		return this + " ".repeat(size - this.length);
	});
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
				match.input = this + "";
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
			if (typeof value === "number") return value + "";
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
	Object.defineProperty(Number.prototype, "mag", {
		get() {
			return Math.abs(this);
		}
	});
	Object.defineProperty(Number.prototype, "sqrMag", {
		get() {
			return this ** 2;
		}
	})
	proto(Number.prototype, "plus", function (n) { return this + n; });
	proto(Number.prototype, "minus", function (n) { return this - n; });
	proto(Number.prototype, "times", function (n) { return this * n; });
	proto(Number.prototype, "over", function (n) { return this / n; });
	proto(Number.prototype, "get", function () { return this; });
	proto(Number.prototype, "equals", function (n) { return Math.abs(this - n) < Operable.EPSILON; });

	Number.empty = 0;

	// overload localStorage.clear()
	const localStorageClear = localStorage.clear.bind(localStorage);
	proto(Storage.prototype, "downloadBackup", function (file = "localStorage") {
		const a = document.createElement("a");
		const buffer = new ByteBuffer();
		buffer.write.object(this);
		buffer.finalize();
		const uri = `data:application/octet-stream;base64,` + buffer.toBase64();
		a.setAttribute("href", uri);
		a.setAttribute("download", file + ".backup");
		a.click();
	});
	proto(Storage.prototype, "clear", function (file) {
		if (!confirm("Do you truly, absolutely seriously, accepting ALL of the consequences, want to clear localStorage?")) return false;
		this.downloadBackup(file);
		localStorageClear();
		return true;
	});
	proto(Storage.prototype, "uploadBackup", function () {
		if (!this.clear()) return;

		// recreate
		const input = document.createElement("input");
		input.type = "file";
		return new Promise(resolve => {
			input.onchange = event => {
				const file = input.files[0];
				const reader = new FileReader();
				reader.onload = () => {
					const arrayBuffer = reader.result;
					const buffer = new ByteBuffer(arrayBuffer);
					const parsedObject = buffer.read.object();
					for (const key in parsedObject) {
						const value = parsedObject[key];
						if (typeof value === "string") this[key] = value;
					}
					resolve();
				};
				reader.readAsArrayBuffer(file);
			};
			input.click();
		});
	});

})();