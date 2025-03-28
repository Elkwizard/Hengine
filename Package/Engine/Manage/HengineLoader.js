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
	 * @return Promise<Any/null>
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
HengineFontResource.TEST_STRING = String.fromCharCode(...new Array(255).fill(0).map((_, code) => code));

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
		static cast(type, pointer) {
			const object = Object.create(type.prototype);
			object.pointer = pointer;
			return object;
		}
	};
	static buffers = { };
	static bindings = { };
	static imports = { };
	async load() {
		const moduleName = this.src.match(/(\w+)\.wasm$/)[1];

		const resource = name => new HengineScriptResource(
			this.src.replace(/.wasm$/g, `/${name}.js`)
		).load();

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

		const env = {
			emscripten_notify_memory_growth: () => null
		};
		const imports = { };
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
				clock_time_get: () => Date.now()
			}
		});

		exports._initialize();
		
		const module = { };
		HengineWASMResource.bindings[moduleName](module, imports, exports);

		{ // printing
			let buffer = [];
			module.printFloat = module.printInt = v => buffer.push(v);
			window._buffer = buffer;
			module.printLn = () => {
				console.log(...buffer);
				buffer = [];
			};
		}

		module.Array = class Array {
			constructor(type, length, indirect) {
				if (length instanceof module._Slab) this.slab = length;
				else this.slab = new module._Slab(type.size, length);
				this.type = type;
				this.indirect = indirect;
			}
			get pointer() {
				return this.slab.pointer;
			}
			get length() {
				return this.slab.length;
			}
			*[Symbol.iterator]() {
				const { length } = this;
				for (let i = 0; i < length; i++)
					yield this.get(i);
			}
			get(index) {
				const pointer = this.indirect ? this.slab.getPointer(index) : this.slab.get(index)
				return HengineWASMResource.Binding.cast(this.type, pointer);
			}
			delete() {
				this.slab.delete();
			}
		}

		window[moduleName] = module;
	}
}
HengineWASMResource.files = { };

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
	 * Adds a HengineWebcamResource to the queue with a specified name.
	 * @param String name | The name of the resource
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
}

/**
 * Allows for the loading of both the rest of the Hengine and additional external files.
 * The file containing this class `HengineLoader.js` is the only file that needs to be loaded directly to use the Hengine.
 * Other files can be loaded via the HengineLoader's API.
 * The web url for this file is:
 * ```url
 * https://elkwizard.github.io/Hengine/Package/Engine/Manage/HengineLoader.js
 * ```
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
 * @static_prop HengineLoader loader | The singleton instance
 */
class HengineLoader {
	constructor() {
		// window setup
		document.body.style.width = "100vw";
		document.body.style.height = "100vh";
		document.body.style.backgroundColor = "#000";

		this.hengine = new Hengine();

		//window
		window.hengine = this.hengine;
		window.scene = this.hengine.scene;
		window.renderer = this.hengine.renderer;
		window.keyboard = this.hengine.keyboard;
		window.mouse = this.hengine.mouse;
		window.touches = this.hengine.touches;
		window.clipboard = this.hengine.clipboard;
		window.fileSystem = this.hengine.fileSystem;
		window.intervals = this.hengine.intervals;
		window.canvas = this.hengine.canvas;

		const hengineLoader = this;
		if (!(window.width || window.height || window.middle)) {
			Object.defineProperty(window, "middle", {
				get() {
					return new Vector2(hengineLoader.hengine.canvas.width / 2, hengineLoader.hengine.canvas.height / 2);
				}
			});
			objectUtils.shortcut(window, hengineLoader.hengine.canvas, "width");
			objectUtils.shortcut(window, hengineLoader.hengine.canvas, "height");
		}

		window.loadResource = this.loadResource.bind(this);

		this.resources = new Map();

		//title
		let t = location.toString();
		let st = t.split("/");
		let ti = st[st.length - 2];
		if (ti) {
			ti = unescape(ti);
		} else ti = "Unknown";

		window.title = ti;
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
		return resource?.get?.() ?? resource ?? null;
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
	 * @return Promise<void>
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
						const src = PathManager.join([engineSrc, path]);
						const script = src.endsWith(".js") ? new HengineScriptResource(src) : new HengineWASMResource(src);
						promises.push(script.load());
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

			if (done) hengineLoader.hengine.intervals.start();

			return hengineLoader;
		}
		if (document.body && document.head) return loadResources();
		else return new Promise(resolve => addEventListener("load", () => loadResources().then(resolve)));
	}
}
HengineLoader.loader = null;

HengineLoader.engineResources = [
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
		"Util/FileSystem.js",
		"Util/Sound.js",

		"Math/Matrix.js",
		"Math/Physics/physics.wasm",
		"Math/PhysicsAPI.js",
		"Math/Random.js",
		"Math/Interpolation.js",

		"Render/Frame.js",
		"Render/Gradient.js",
		"Render/Spline.js",
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

		"Render/Font.js",
		"Render/Shapes.js",
		"Render/Animation.js",
		"Render/Transform.js",
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
	[ // high level dependencies
		"Render/Color.js",
		"SceneObject/UIObject.js",
		"Render/WebGLRenderer.js",
	]
];

/**
 * @name class Window
 * @interface
 * 
 * @prop KeyboardHandler keyboard | The keyboard input API for the Hengine
 * @prop MouseHandler mouse | The mouse input API for the Hengine
 * @prop TouchHandler touches | The touchscreen input API for the Hengine
 * @prop ClipboardHandler clipboard | The clipboard I/O API for the Hengine
 * @prop CanvasImage canvas | The canvas on which rendering occurs
 * @prop Artist renderer | The renderer that affects the screen
 * @prop Scene scene | The scene that contains all SceneElements
 * @prop IntervalManager intervals | The timing and scheduling API for the Hengine
 * @prop FileSystem fileSystem | The built-in, localStorage-based file system API
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