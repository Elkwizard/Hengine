const IS_3D = new URL(document.currentScript.src).searchParams.has("3d");
const DIM = IS_3D ? 3 : 2;
const D2 = { }, D3 = { };
const ND = IS_3D ? D3 : D2;

class PathManager {
	static isRoot(path) {
		return /^((http(s?)|file):\/\/|[A-Z]:\/|file:(\/\/\/|\\\\\\))/g.test(path);
	}
	static findRoot(path) {
		let rootPrefix = path.match(/^((http(s?)|file):\/\/|[A-Z]:\/|file:(\/\/\/|\\\\\\))/g);
		return rootPrefix ? rootPrefix[0] : "";
	}
	static simplify(path) {
		let rootPrefix = PathManager.findRoot(path);
		if (rootPrefix)
			path = path.slice(rootPrefix.length);

		let pieces = path.split("/");
		let resultPath = [];
		for (let i = 0; i < pieces.length; i++) {
			if (pieces[i] === ".") continue;
			if (
				pieces[i] === ".." && resultPath.length &&
				resultPath[resultPath.length - 1] !== ".."
			) {
				resultPath.pop();
				continue;
			}
			resultPath.push(pieces[i]);
		}
		return rootPrefix + resultPath.join("/");
	}
	static join2Paths(a, b) {
		if (PathManager.isRoot(b)) return PathManager.simplify(b);
		if (a && b) return PathManager.simplify(`${a}/${b}`);
		if (a) return PathManager.simplify(a);
		if (b) return PathManager.simplify(b);
		return "";
	}
	static join(paths) {
		let a = paths[0];
		for (let i = 1; i < paths.length; i++) a = PathManager.join2Paths(a, paths[i]);
		return a;
	}
}

/**
 * Represents an external resource to be loaded by the Hengine.
 * ```js
 * HengineLoader.load([
 * 	new HengineImageResource("cat.png"),
 * 	new HengineImageResource("dog.png"),
 * 	new HengineScriptResource("renderers/catRenderer.js"),
 * 	new HengineScriptResource("renderers/dogRenderer.js"),
 * 	new HengineScriptResource("index.js")
 * ]);
 * ```
 * @prop String src | The path to the resource
 */
class HengineResource {
	constructor(src) {
		this.src = src;
	}
	/**
	 * Begins the loading of the resource, and returns a Promise. The Promise resolves to the final resource value when the loading is completed, or null if it fails.
	 * @return Promise
	 */
	load() {

	}
}

/**
 * Represents an external script to be loaded.
 * When this resource loads, it will run the loaded script and resolve to the HTMLScriptElement.
 */
class HengineScriptResource extends HengineResource {
	load() {
		const script = document.createElement("script");
		script.setAttribute("charset", "UTF-8");
		script.type = "text/javascript";
		script.src = this.src;
		document.head.appendChild(script);
		return new Promise(resolve => {
			script.addEventListener("load", () => resolve(script));
			script.addEventListener("error", () => resolve(null));
		});
	}
}

/**
 * Represents an external sound to be loaded.
 * When this resource loads, it will resolve to a Sound.
 * @prop Boolean loops | Whether or not the sound loops after completing
 */
class HengineSoundResource extends HengineResource {
	/**
	 * Creates a new HengineSoundResource.
	 * @param String src | The path to the sound
	 * @param Boolean loops | Whether or not the sound loops
	 */
	constructor(src, loops) {
		super(src);
		this.loops = loops;
	}
	load() {
		const audio = new Audio(this.src);
		return new Promise(resolve => {
			audio.addEventListener("canplaythrough", () => {
				resolve(new Sound(this.src, this.loops));
			});
			audio.addEventListener("error", () => resolve(null));
		});
	}
}

/**
 * Represents an external image to be loaded.
 * When this resource loads, it will resolve to an HImage.
 */
class HengineImageResource extends HengineResource {
	load() {
		const image = new Image();
		image.src = this.src;
		return new Promise(resolve => {
			image.addEventListener("load", () => resolve(new HImage(image)));
			image.addEventListener("error", () => resolve(null));
		});
	}
}

/**
 * Represents an external video to be loaded.
 * When this resource loads, it will resolve to a VideoView.
 * @prop Boolean loops | Whether or not the video loops after completing
 */
class HengineVideoResource extends HengineResource {
	/**
	 * Creates a new HengineVideoResource.
	 * @param String src | The path to the video
	 * @param Boolean loops | Whether or not the video loops
	 */
	constructor(src, loops) {
		super(src);
		this.loops = loops;
	}
	load() {
		const video = document.createElement("video");
		video.src = this.src;
		return new Promise(resolve => {
			video.addEventListener("canplay", () => resolve(new VideoView(video, this.loops)));
			video.addEventListener("error", () => resolve(null));
		});
	}
}

/**
 * Represents an external animation to be loaded.
 * When this resource loads, it will resolve to an Animation.
 * @prop String src | The path to a folder containing all the animation frames, named `1.png` to `n.png`
 * @prop Number frames | The number of frames in the animation
 * @prop Number delay | The number of runtime frames to display each frame for
 * @prop Boolean loops | Whether or not the animation loops after completing
 */
class HengineAnimationResource extends HengineResource {
	/**
	 * Creates a new HengineAnimationResource.
	 * @param String src | The path to a folder containing the animation frames
	 * @param Number frames | The number of frames in the animation
	 * @param Number delay | The number of runtime frames to display each frame for
	 * @param Boolean loops | Whether or not the animation loops
	 */
	constructor(src, frames, delay, loops) {
		super(src);
		this.frames = frames;
		this.delay = delay;
		this.loops = loops;
	}
	async load() {
		try {
			const frames = await Promise.all(
				new Array(this.frames)
					.fill(null)
					.map((_, i) => new HengineImageResource(`${this.src}/${i + 1}.png`).load())
			);
			return new Animation(frames, this.delay, this.loops);
		} catch (err) {
			return null;
		}
	}
}

/**
 * Represents an external Font to be loaded.
 * When this resource loads, it will resolve to the name of the font family.
 * @prop String src | The path to a CSS stylesheet containing the @font-face rule(s).
 */
class HengineFontResource extends HengineResource {
	static TEST_STRING = String.fromCharCode(...new Array(255).fill(0).map((_, code) => code));
	load() {
		return new Promise(async resolve => {
			const handleCSS = css => {
				const style = document.createElement("style");

				const firstFontIndex = document.fonts.size;
				
				style.addEventListener("load", async () => {
					const allFonts = [...document.fonts];
					const lastFont = allFonts[allFonts.length - 1];
					if (!lastFont) {
						resolve(null);
						return;
					}
					
					const { family } = lastFont;
					await Promise.all(allFonts
						.slice(firstFontIndex)
						.filter(font => font.family === family)
						.map(font => font.load()));
					
					resolve(family);
				});

				style.innerHTML = css;
				document.head.appendChild(style);
			};

			try {
				const http = /^http(s?):/g;
				if (this.src.match(http) || location.protocol.match(http)) {
					const response = await fetch(this.src);
					const [contentType] = response.headers.get("Content-Type").split(";");
					if (contentType === "text/css") handleCSS(await response.text());
					else resolve(null);
				} else {
					const xhr = new XMLHttpRequest();
					xhr.open("GET", this.src);
					xhr.addEventListener("readystatechange", () => {
						if (xhr.readyState === XMLHttpRequest.DONE) {
							if (xhr.status === 0 || xhr.status === 200) handleCSS(xhr.responseText);
							else resolve(null);
						}
					});
					xhr.send();
				}
			} catch (err) {
				resolve(null);
			}
		});
	}
}

/**
 * Represents an external text file to be loaded.
 * When this resource is loaded, it resolves to the text content of the file.
 */
class HengineTextResource extends HengineResource {
	load() {
		return new Promise(async resolve => {
			try {
				const xhr = new XMLHttpRequest();
				xhr.open("GET", this.src);
				xhr.addEventListener("readystatechange", () => {
					if (xhr.readyState === XMLHttpRequest.DONE) {
						if (xhr.status === 0 || xhr.status === 200) resolve(xhr.responseText);
						else resolve(null);
					}
				});
				xhr.send();
			} catch (err) {
				resolve(null);
			}
		});
	}
}

/**
 * Represents an external binary file to be loaded.
 * When this resource is loaded, it resolves to a ByteBuffer containing the file content, with the pointer at 0.
 */
class HengineBinaryResource extends HengineResource {
	load() {
		return new Promise(async resolve => {
			try {
				const xhr = new XMLHttpRequest();
				xhr.open("GET", this.src);
				xhr.setRequestHeader("Content-Type", "application/octet-stream");
				xhr.responseType = "arraybuffer";
				xhr.addEventListener("readystatechange", () => {
					if (xhr.readyState === XMLHttpRequest.DONE) {
						if (xhr.status === 0 || xhr.status === 200) resolve(new ByteBuffer(xhr.response));
						else resolve(null);
					}
				});
				xhr.send();
			} catch (err) {
				resolve(null);
			}
		});
	}
}

class HengineWASMResource extends HengineResource { // emscripten-only, uses specific API/naming convention, really only for internal Hengine use
	static Binding = class Binding {
		static registry = new FinalizationRegistry(held => {
			held.type.prototype.delete.call(held);
		});
		constructor(...args) {
			this.pointer = this.constructor.create(...args);
		}
		own() {
			this.constructor.registry.register(this, {
				type: this.constructor,
				pointer: this.pointer
			});
			return this;
		}
		solidify() {
			const keys = this.constructor.CONST_PROPERTIES;
			for (let i = 0; i < keys.length; i++) {
				const key = keys[i];
				const value = this[key];
				delete this[key];
				Object.defineProperty(this, key, {
					value: value.solidify()
				});
			}
			return this;
		}
		static cast(type, pointer) {
			const object = Object.create(type.prototype);
			object.pointer = pointer;
			return object;
		}
	};
	static buffers = {};
	static bindings = {};
	static imports = {};
	constructor(src, exportNames) {
		super(src);
		this.moduleName = this.src.match(/(\w+)$/)[1];
		this.exportNames = exportNames ?? [this.moduleName];
	}
	async load() {
		const { moduleName } = this;
		
		const resource = name => new HengineScriptResource(`${this.src}/${name}.js`).load();

		const resources = await Promise.all([resource("bindings"), resource("buffer")]);
		if (!resources.every(Boolean)) return null;

		const bufferFn = HengineWASMResource.buffers[moduleName];

		let buffer;
		{ // decode buffer
			const start = "() => {\n//";
			const end = "\n};";
			const fnString = bufferFn.toString();
			const chars = fnString.slice(
				fnString.indexOf(start) + start.length,
				1 - end.length
			);
			const offset = "\r".charCodeAt() + 1;

			const size = chars.length;
			buffer = new Uint8Array(size);
			for (let i = 0; i < size; i++)
				buffer[i] = chars.charCodeAt(i) - offset;
		}

		const memory = {
			view: null,
			refresh() {
				this.view = new DataView(exports.memory.buffer);
			}
		};

		const env = {
			emscripten_notify_memory_growth: () => memory.refresh()
		};
		const imports = {};
		const importNames = HengineWASMResource.imports[moduleName];
		for (let i = 0; i < importNames.length; i++) {
			const name = importNames[i];
			env[name] = (...args) => imports[name]?.(...args);
		}

		const { instance: { exports } } = await WebAssembly.instantiate(buffer, {
			env, wasi_snapshot_preview1: {
				proc_exit(code) {
					exit("WASM exited with code " + code);
				},
				fd_close: () => null,
				fd_write: () => null,
				fd_seek: () => null,
				fd_read: () => null,
				environ_sizes_get: () => 0,
				environ_get: () => null,
				
				clock_time_get: (clockId, _, timePointer) => {
					let ms = 0;
					if (clockId === 0) ms = Date.now();
					else if (clockId === 1) ms = performance.now();
					else return 28; // invalid_clock
					
					const ns = BigInt(Math.round(ms * 1e6));
					// console.log(timePointer)
					memory.view.setBigUint64(timePointer, ns, true);
					return 0; // success
				}
			}
		});

		exports._initialize();
		memory.refresh();

		const module = { memory };
		HengineWASMResource.bindings[moduleName](module, imports, exports);

		const readString = pointer => {
			let string = "";
			while (true) {
				const code = memory.view.getUint8(pointer);
				if (!code) break;
				string += String.fromCharCode(code);
				pointer++;
			}
			return string;
		};

		const jsArguments = [];
		module.sendJSArgument = value => {
			jsArguments.push(value);
		};

		module.runJS = pointer => {
			let string = readString(pointer);
			while (jsArguments.length) 
				string = string.replace("$", jsArguments.shift());
			window.eval(string);
		};

		module.printStringJS = pointer => {
			console.log(readString(pointer));
		};

		for (let i = 0; i < this.exportNames.length; i++)
			window[this.exportNames[i]] = module;
	}
}

/**
 * Represents a request for access to the user's webcam.
 * When this resource is loaded, it resolves to a WebcamCapture that is actively streaming.
 */
class HengineWebcamResource extends HengineResource {
	/**
	 * @name constructor
	 * Creates a new HengineWebcamResource.
	 * @param String name | A unique identifier for the webcam. This can be passed to `loadResource()` to retrieve it once loaded 
	 */

	async load() {
		try {
			const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
			const video = document.createElement("video");
			video.srcObject = mediaStream;
			return new Promise(resolve => {
				video.addEventListener("canplay", () => {
					console.log("Webcam Streaming");
					resolve(new WebcamCapture(video));
				});
				video.addEventListener("error", () => resolve(null));
				video.play();
			});
		} catch (err) {
			return null;
		}
	}
}

/**
 * Represents an external material file to be loaded.
 * When this resource is loaded, it resolves to a Map from material names to Material objects.
 * This resource supports loading `.mtl` files.
 */
class HengineMaterialResource extends HengineResource {
	async load() {
		const match = this.src.match(/\.\w+$/);
		if (!match) return null;
		const type = match[0].slice(1);
		return await HengineMaterialResource[type]?.(this.src) ?? null;
	}
	static async mtl(src) {
		const text = await new HengineTextResource(src).load();
		if (!text) return null;

		const lines = text.split(/\r?\n/g);
		
		const materials = new Map();
		let mat = null;

		const ATTR_NAME = {
			Kd: "albedo",
			Ks: "specular",
			Ke: "emission",
			Ns: "specularExponent",
			map_Kd: "albedoTexture",
			map_Ks: "specularTexture",
			map_Ns: "specularExponentTexture",
			bump: "bumpTexture",
			map_bump: "bumpTexture",
			disp: "displacementTexture",
			decal: "stencilTexture",
			Ni: "ior"
		};

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			if (!line || line[0] === "#") continue;
			const [cmd, ...args] = line.split(" ");
			if (cmd === "newmtl") {
				const material = new SimpleMaterial();
				materials.set(args[0], mat = material);
			} else if (cmd === "d") {
				mat.alpha = +args[0];
			} else if (cmd === "Tr") {
				mat.alpha = 1 - args[0];
			} else {
				const attr = ATTR_NAME[cmd];
				if (!attr) continue;

				if (cmd[0] === "K") {
					mat[attr] = Color.unlimited(255 * args[0], 255 * args[1], 255 * args[2]);
				} else if (cmd[0] === "N" || cmd === "illum") {
					mat[attr] = +args[0];
				} else if (cmd.startsWith("map_")) {
					const path = args.join(" ");
					const image = await new HengineImageResource(path).load();
					mat[attr] = new Sampler(image, { wrap: true, mipmap: true });
				}
			}
		}

		return materials;
	}
}

/**
 * Represents an external 3D mesh file to be loaded.
 * When this resource is loaded, it resolves to a Map from object names to Meshes.
 * This resource supports loading `.obj` files.
 */
class HengineMeshResource extends HengineResource {
	async load() {
		const match = this.src.match(/\.\w+$/);
		if (!match) return null;
		const type = match[0].slice(1);
		return await HengineMeshResource[type]?.(this.src) ?? null;
	}
	static async obj(src) {
		const text = await new HengineTextResource(src).load();
		if (text === null) return null;
		
		const lines = text.split("\n");
		
		const objects = new Map();
		let materials = null;
		let obj = null;

		const vertices = [];
		const normals = [];
		const uvs = [];

		const newChunk = material => ({ faces: [], material });

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			if (!line || line[0] === "#") continue;
			const [cmd, ...args] = line.trim().split(" ");
			switch (cmd) {
				case "mtllib": {
					const path = src.replace(/[^\\/]*?$/, args[0]);
					materials = await new HengineMaterialResource(path).load();
					if (!materials) return null;
				} break;
				case "o": {
					obj = {
						indices: new Map(),
						data: [],
						attributes: ["vertexPosition", "vertexUV", "vertexNormal"],
						chunks: [newChunk(null)]
					};
					objects.set(args[0], obj);
				} break;
				case "usemtl": {
					obj.chunks.push(newChunk(materials.get(args[0])));
				} break;
				case "v": {
					vertices.push(+args[0], +args[1], +args[2]);
				} break;
				case "vn": {
					normals.push(+args[0], +args[1], +args[2]);
				} break;
				case "vt": {
					uvs.push(+args[0], +args[1]);
				} break;
				case "f": {
					const { indices, data } = obj;
					const face = [];
					for (let i = 0; i < args.length; i++) {
						const arg = args[i];
						if (!indices.has(arg)) {
							const base = data.length;
							indices.set(arg, base / 8);
							
							const [vInx, uvInx, nInx] = arg.split("/");
							const v = (vInx - 1) * 3;
							const uv = (uvInx - 1) * 2;
							const n = (nInx - 1) * 3;
							
							data[base + 0] = vertices[v + 0] ?? 0;
							data[base + 1] = vertices[v + 1] ?? 0;
							data[base + 2] = vertices[v + 2] ?? 0;
							data[base + 3] = uvs[uv + 0] ?? 0;
							data[base + 4] = uvs[uv + 1] ?? 0;
							data[base + 5] = normals[n + 0] ?? 0;
							data[base + 6] = normals[n + 1] ?? 0;
							data[base + 7] = normals[n + 2] ?? 0;
						}
						face.push(obj.indices.get(arg));
					}
					const chunk = obj.chunks.at(-1);
					for (let i = 2; i < face.length; i++)
						chunk.faces.push([face[0], face[i - 1], face[i]]);
				} break;
				case "s":
				case "l": break;
				default: {
					throw new TypeError(`No support for ${cmd}`);
				} break;
			}
		}

		const result = new Map();
		for (const [name, object] of objects) {
			const chunks = object.chunks
				.filter(chunk => chunk.faces.length)
				.map(chunk => new MeshChunk(chunk.material ?? Material.DEFAULT, chunk.faces));
			if (!chunks.length) continue;
			
			const mesh = new Mesh(
				["vertexPosition", "vertexUV", "vertexNormal"],
				new Float32Array(object.data),
				chunks
			);
			result.set(name, mesh);
		}

		return result;
	}
}

/**
 * Represents a batch of HengineResources to be loaded in a row, and can be used as a more streamlined approach compared to constructing HengineResources directly.
 * It contains an internal list of resources to load, and many of its methods simply add to this list, which can eventually be flushed and loaded, though only once per instance.
 * These methods also return the caller, which allows for convenient chaining.
 * ```js
 * new HengineLoadingStructure()
 * 	.image("cat.png")
 * 	.image("dog.png")
 * 	.folder("renderers", structure => structure
 * 		.script("catRenderer.js")
 * 		.script("dogRenderer.js")
 * 	)
 * 	.script("index.js")
 * 	.load()
 * ```
 */
class HengineLoadingStructure {
	constructor() {
		this.context = [];
		this.resources = [];
	}
	/**
	 * Loads all the queued resources, and returns the HengineLoader instance that contains them.
	 * @param Boolean done | Whether or not the HengineLoader should start the update loop after these resources finish loading
	 * @return HengineLoader
	 */
	load(done) {
		return HengineLoader.load(this.resources, done);
	}
	absSrc(src) {
		return PathManager.join([...this.context, src]);
	}
	add(resource) {
		this.resources.push(resource);
		return this;
	}
	/**
	 * Adds all the queued resources from another HengineLoadingStructure to the caller's queue.
	 * Returns the caller.
	 * @param HengineLoadingStructure structure | The structure to get the queue from
	 * @return HengineLoadingStructure
	 */
	from(structure) {
		this.resources.push(...structure.resources.map(res => {
			const copy = new res.constructor(this.absSrc(res.src));
			for (const key in res)
				if (key !== "src")
					copy[key] = res[key];
			return copy;
		}));
		return this;
	}
	/**
	 * Puts the loading structure in the context of a specified folder, calls a specific function, and then exits the context.
	 * Calls to this function while inside a call to this function will stack the contexts together, allowing nesting of folder scopes.
	 * Returns the caller.
	 * @param String path | The relative path to the folder to add to the context stack
	 * @param (HengineLoadingStructure) => void fn | The function to call while in the context. This function is passed the caller as an argument
	 * @return HengineLoadingStructure
	 */
	folder(name, fn) {
		this.context.push(name);
		fn(this);
		this.context.pop();
		return this;
	}
	/**
	 * Adds a HengineScriptResource to the queue with a specified source.
	 * @param String src | The path to the resource
	 * @return HengineLoadingStructure
	 */
	script(src) {
		return this.add(new HengineScriptResource(this.absSrc(src)));
	}
	/**
	 * Adds a HengineBinaryResource to the queue with a specified source.
	 * @param String src | The path to the resource
	 * @return HengineLoadingStructure
	 */
	binary(src) {
		return this.add(new HengineBinaryResource(this.absSrc(src)));
	}
	/**
	 * Adds a HengineControllerResource to the queue with a specified name.
	 * @param String name | The name of the resource. Can be anything
	 * @return HengineLoadingStructure
	 */
	controller(name) {
		return this.add(new HengineControllerResource(name));
	}
	/**
	 * Adds a HengineWebcamResource to the queue with a specified name.
	 * @param String name | The name of the resource. Can be anything
	 * @return HengineLoadingStructure
	 */
	webcam(name) {
		return this.add(new HengineWebcamResource(name));
	}
	/**
	 * Adds a HengineTextResource to the queue with a specified source.
	 * @param String src | The path to the resource
	 * @return HengineLoadingStructure
	 */
	text(src) {
		return this.add(new HengineTextResource(this.absSrc(src)));
	}
	/**
	 * Adds a HengineImageResource to the queue with a specified source.
	 * @param String src | The path to the resource
	 * @return HengineLoadingStructure
	 */
	image(src) {
		return this.add(new HengineImageResource(this.absSrc(src)));
	}
	/**
	 * Adds a HengineFontResource to the queue with a specified source.
	 * @param String src | The path to the resource
	 * @return HengineLoadingStructure
	 */
	font(src) {
		return this.add(new HengineFontResource(this.absSrc(src)));
	}
	/**
	 * Adds a HengineAnimationResource to the queue with a specified source.
	 * @param String src | The path to the resource
	 * @param { frames?: Number, delay?: Number, loops?: Boolean } options? | An object containing `.frames`, `.delay`, and `.loops` properties that will be passed to the HengineAnimationResource constructor. These values have defaults of 1, 1, and true, respectively
	 * @return HengineLoadingStructure
	 */
	animation(src, {
		frames = 1,
		delay = 1,
		loops = true
	} = {}) {
		return this.add(new HengineAnimationResource(this.absSrc(src), frames, delay, loops));
	}
	/**
	 * Adds a HengineVideoResource to the queue with a specified source.
	 * @param String src | The path to the resource
	 * @param { loops?: Boolean } options? | An object containing a `.loops` properties that will be passed to the HengineVideoResource constructor. The default value is false
	 * @return HengineLoadingStructure
	 */
	video(src, {
		loops = false
	} = {}) {
		return this.add(new HengineVideoResource(this.absSrc(src), loops));
	}
	/**
	 * Adds a HengineSoundResource to the queue with a specified source.
	 * @param String src | The path to the resource
	 * @param { loops?: Boolean } options? | An object containing a `.loops` properties that will be passed to the HengineSoundResource constructor. The default value is false
	 * @return HengineLoadingStructure
	 */
	sound(src, {
		loops = false
	} = {}) {
		return this.add(new HengineSoundResource(this.absSrc(src), loops));
	}
	/**
	 * Adds a HengineMeshResource to the queue with a specified source.
	 * @param String src | The path to the resource
	 * @return HengineLoadingStructure
	 */
	mesh(src) {
		return this.add(new HengineMeshResource(src));
	}
	/**
	 * Adds a HengineMaterialResource to the queue with a specified source.
	 * @param String src | The path to the resource
	 * @return HengineLoadingStructure
	 */
	material(src) {
		return this.add(new HengineMaterialResource(src));
	}
}

/**
 * Allows for the loading of both the rest of the Hengine and additional external files.
 * The file containing this class `HengineLoader.js` is the only file that needs to be loaded directly to use the Hengine.
 * Other files can be loaded via the HengineLoader's API.
 * The web URL for this file is:
 * ```url
 * https://elkwizard.github.io/Hengine/Package/Engine/Manage/HengineLoader.js
 * ```
 * The engine will be loaded in 3D Mode if the URL query parameter `?3d` is appended to the end of the `HengineLoader.js` path.
 * This class is a singleton, and the single instance can be accessed via a static property.
 * ```js
 * async function load() {
 * 	// choose which file to load based on an external file
 * 	await HengineLoader.load([
 * 		new HengineTextResource("whichToLoad.txt")
 * 	], false);
 * 
 * 	// load the selected script
 * 	const fileName = loadResource("whichToLoad.txt");
 * 	await HengineLoader.load([
 * 		new HengineScriptResource(`${fileName}.js`)
 * 	]);
 * }
 * ```
 * @prop<static, immutable> HengineLoader loader | The singleton instance
 */
class HengineLoader {
	static loader = null;
	constructor() {
		// window setup
		Object.assign(document.body.style, {
			width: "100vw",
			height: "100vh",
			backgroundColor: "#000",
			margin: "0",
			overflow: "hidden"
		});

		this.engine = new Hengine();

		//window
		window.hengine = this.engine;
		window.scene = this.engine.scene;
		window.renderer = this.engine.renderer;
		window.ui = this.engine.ui;
		window.keyboard = this.engine.keyboard;
		window.mouse = this.engine.mouse;
		window.touches = this.engine.touches;
		window.controllers = this.engine.controllers;
		window.clipboard = this.engine.clipboard;
		window.fileSystem = this.engine.fileSystem;
		window.intervals = this.engine.intervals;
		window.canvas = this.engine.canvas;

		const hengineLoader = this;
		if (!(window.width || window.height || window.middle)) {
			Object.defineProperty(window, "middle", {
				get() {
					return new Vector2(hengineLoader.engine.canvas.width / 2, hengineLoader.engine.canvas.height / 2);
				}
			});
			objectUtils.proxyAccess(window, hengineLoader.engine.canvas, ["width", "height"]);
		}

		window.loadResource = this.loadResource.bind(this);

		this.resources = new Map();

		{ // title
			const folderName = location.href.split("/").at(-2);
			window.title = folderName ? decodeURIComponent(folderName) : "Unknown Hengine Project";
		}
	}
	addResourceSync(wrapper, resource) {
		const { src } = wrapper;
		const name = wrapper.constructor.name.match(
			/Hengine(\w*?)Resource/
		)?.[1]?.toUpperCase() || "RESOURCE";
		if (resource) console.log(`LOADED ${name} [${src}]`);
		else console.warn(`LOADING FAILED FOR ${name} [${src}]`);
		this.resources.set(src, resource);
	}
	async addResource(wrapper) {
		this.addResourceSync(wrapper, await wrapper.load());
	}
	copyResource(src) {
		const resource = this.resources.get(src);
		if (resource === null) return null;
		if (typeof resource.get === "function" && resource.get.length === 0)
			return resource.get();
		return resource;
	}
	/**
	 * Retrieves a specific resource.
	 * If the resource failed to load, this returns null.
	 * This method is also available on the global object.
	 * If the resource implements Copyable, a copy of the resource will be returned.
	 * @param String src | An arbitrarily-lengthed tail end of the source of the resource. This can be as few characters as are needed to be unambiguous, or may be the entire path 
	 * @return Any/null
	 */
	loadResource(src) {
		if (PathManager.isRoot(src))
			return this.copyResource(src);

		const processed = src.replace(/\\/g, "/");
		for (const [path] of this.resources)
			if (path.replace(/\\/g, "/").endsWith(processed))
				return this.copyResource(path);

		return null;
	}
	/**
	 * Loads a series of resources, and optionally starts the update loop after the loading completes.
	 * If the rest of the Hengine has yet to be loaded, it will be loaded before any of the resources passed to this function.
	 * Returns a promise that resolves to the HengineLoader instance when all the resources are loaded.
	 * @param HengineResource[] userResources | The resources to load
	 * @param Boolean done? | Whether or not the update loop should start after the resources are loaded. Default is true
	 * @return Promise
	 */
	static load(userResources = [], done = true) {
		async function loadResources() {
			const newHengine = HengineLoader.loader === null;
			if (newHengine) {
				console.time("loading engine");

				// find yourself
				const allScripts = Array.from(document.getElementsByTagName("script"));
				const scriptSrc = allScripts.find(script => script.src.includes("Engine/Manage/HengineLoader.js")).src;
				const rootSrc = scriptSrc
					.split("/")
					.slice(0, -3)
					.join("/");

				//icon
				document.head.innerHTML += `<link rel="icon" href="${rootSrc}/favicon.ico" type="image/x-icon"></link>`;

				const engineSrc = rootSrc + "/Engine";
				console.log(`EXTRACTING FROM ROOT [${engineSrc}]`);

				for (let i = 0; i < HengineLoader.engineResources.length; i++) {
					const block = HengineLoader.engineResources[i];
					const promises = [];
					for (let i = 0; i < block.length; i++) {
						const path = block[i];
						
						let resource;
						if (path instanceof HengineResource) {
							resource = path;
						} else {
							resource = new HengineScriptResource(path);
						}
						resource.src = PathManager.join([engineSrc, resource.src])
						promises.push(resource.load());
					}
					await Promise.all(promises);
				}

				HengineLoader.loader = new HengineLoader();

				console.timeEnd("loading engine");
			}

			const hengineLoader = HengineLoader.loader;

			let nonScriptPromiseAcc = [];
			let nonScriptAcc = [];

			console.time("loading user resources");

			for (let i = 0; i < userResources.length; i++) {
				const userResource = userResources[i];

				const loadBlocking = userResource instanceof HengineScriptResource;
				const loadAllInParallel = loadBlocking || i === userResources.length - 1;
				const accumulateLoading = !loadBlocking;

				if (accumulateLoading) {
					nonScriptPromiseAcc.push(userResource.load());
					nonScriptAcc.push(userResource);
				}

				if (loadAllInParallel && nonScriptPromiseAcc.length > 0) {
					const resources = await Promise.all(nonScriptPromiseAcc);
					for (let i = 0; i < resources.length; i++)
						hengineLoader.addResourceSync(nonScriptAcc[i], resources[i]);
					nonScriptPromiseAcc = [];
					nonScriptAcc = [];
				}

				if (loadBlocking) await hengineLoader.addResource(userResource);
			}

			console.timeEnd("loading user resources");

			if (done) hengineLoader.engine.intervals.start();

			return hengineLoader;
		}
		if (document.body && document.head) return loadResources();
		else return new Promise(resolve => addEventListener("load", () => loadResources().then(resolve)));
	}
	static engineResources = [
		[ // preload
			"Preload/PrototypeOverload.js",
			"Preload/Lazy.js",
			"Preload/Operable.js",
		],
		[ // minimal dependencies
			"SceneObject/SceneElement.js",
			"SceneObject/Scripts.js",

			"Manage/Scenes.js",
			"Manage/Hengine.js",
			"Manage/Intervals.js",

			"Util/ByteBuffer.js",
			"Util/Files.js",
			"Util/Sound.js",

			"Math/Matrix.js",
			new HengineWASMResource(
				`C++/Physics/Physics2`,
				IS_3D ? ["Physics2"] : ["Physics2", "Physics"]
			),
			new HengineWASMResource(
				`C++/Physics/Physics3`,
				IS_3D ? ["Physics3", "Physics"] : ["Physics3"]
			),
			"Math/PhysicsAPI.js",
			"Math/Random.js",
			"Math/Interpolation.js",

			"Render/Frame.js",
			"Render/Gradient.js",
			"Math/Spline.js",
			"Render/WebGL2DContext.js",
			"Render/GrayMap.js",
			"Render/GPUInterface.js"
		],
		[ // basic dependencies
			"Util/Input.js",

			"Manage/Canvas.js",
			"Manage/ElementContainer.js",

			"Scripts/Draggable.js",
			"Scripts/ParticleSpawner.js",
			"Scripts/Physics.js",
			"Scripts/PlayerMovement.js",
			"Scripts/TextArea.js",

			"SceneObject/SceneObject.js",

			"Math/Vector.js",
			"Math/Complex.js",
			"Math/Geometry.js",
			"Math/GPUComputation.js",
			"Math/Shapes.js",

			"Render/Font.js",
			"Render/Animation.js",
			"Render/Camera.js",
			"Render/Webcam.js",
			"Render/Graph.js",
			"Render/Texture.js",
			"Render/VideoView.js",
			"Render/Renderer.js",
			"Render/GPUShader.js",
			"Render/StaticImage.js",
			"Render/TileMap.js"
		],
		IS_3D ? [
			// 3d
			"Render/Camera3D.js",
			"Render/Frame3D.js",
			"Math/Shapes3D.js",
			"Render/Mesh.js",
			"Render/Material.js",
			"Render/Renderer3D.js",

			"Math/Geometry3D.js"
		] : [],
		[ // high level dependencies
			"Render/Color.js",
			"Render/Transform.js",
			"SceneObject/UIObject.js",
			"SceneObject/WorldObject.js",
			"Render/WebGLRenderer.js",
		]
	];
}

/**
 * @name class Window
 * @interface
 * 
 * @prop KeyboardHandler keyboard | The keyboard input API for the Hengine
 * @prop MouseHandler mouse | The mouse input API for the Hengine
 * @prop TouchHandler touches | The touchscreen input API for the Hengine
 * @prop ClipboardHandler clipboard | The clipboard I/O API for the Hengine
 * @prop CanvasImage canvas | The canvas on which rendering occurs
 * @prop CanvasArtist renderer | The 2D or 3D renderer that affects the screen
 * @prop CanvasArtist2D ui | The 2D Screen-Space overlay renderer that affects the screen
 * @prop Scene scene | The scene that contains all SceneElements
 * @prop IntervalManager intervals | The timing and scheduling API for the Hengine
 * @prop Files fileSystem | The built-in, localStorage-based file system API
 * @prop Vector2 middle | The coordinates of the center of the screen, in screen space
 * @prop Number width | The width of the screen
 * @prop Number height | The height of the screen
 * @prop String title | The name of the current browser tab
 */

/**
 * @name function loadResource
 * Retrieves a specific resource.
 * If the resource failed to load, this returns null.
 * This method is also available on the global object.
 * If the resource has internal mutable state, like an Animation, a new copy of the resource will be returned with each call to this function.
 * @param String src | An arbitrarily-lengthed tail end of the source of the resource. This can be as few characters as are needed to be unambiguous, or may be the entire path 
 * @return Any/null
 */