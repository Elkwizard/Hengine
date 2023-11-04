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
			script.onload = function () {
				resolve(script);
			}
			script.onerror = function () {
				resolve(null);
			}
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
	 * Creates a new HengineSoundResource
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
			audio.addEventListener("error", function () {
				resolve(null);
			});
		});
	}
}

/**
 * Represents an external image to be loaded.
 * When this resource loads, it will resolve to an HImage.
 */
class HengineImageResource extends HengineResource {
	load() {
		const image = new HImage(this.src);
		return new Promise(resolve => {
			image.image.addEventListener("load", function () {
				// update dimensions in interim
				image.forceLoad();
				resolve(image);
			});
			image.image.addEventListener("error", function () {
				resolve(null);
			});
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
	 * Creates a new HengineVideoResource
	 * @param String src | The path to the video
	 * @param Boolean loops | Whether or not the video loops
	 */
	constructor(src, loops) {
		super(src);
		this.loops = loops;
	}
	load() {
		const video = new VideoView(this.src, this.loops);
		return new Promise(resolve => {
			video.video.addEventListener("canplay", () => {
				video.forceLoad();
				resolve(video);
			});
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
	load() {
		const animation = new Animation(this.src, this.frames, this.delay, this.loops);
		const promises = [];
		for (let i = 0; i < animation.frames.length; i++) {
			const image = animation.frames[i];
			if (image instanceof HImage) {
				promises.push(new Promise(function (resolve) {
					image.image.addEventListener("load", function () {
						// update dimensions in interim
						resolve(animation);
					});
					image.image.addEventListener("error", function () {
						resolve(null);
					});
				}));
			}
		}
		return new Promise(async resolve => {
			await Promise.all(promises);
			animation.forceLoad();
			resolve(animation);
		});
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
				
				style.onload = async () => {
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
				};

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
					xhr.onreadystatechange = () => {
						if (xhr.readyState === XMLHttpRequest.DONE) {
							if (xhr.status === 0 || xhr.status === 200) handleCSS(xhr.responseText);
							else resolve(null);
						}
					};
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
				xhr.onreadystatechange = () => {
					if (xhr.readyState === XMLHttpRequest.DONE) {
						if (xhr.status === 0 || xhr.status === 200) resolve(xhr.responseText);
						else resolve(null);
					}
				};
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
				xhr.onreadystatechange = () => {
					if (xhr.readyState === XMLHttpRequest.DONE) {
						if (xhr.status === 0 || xhr.status === 200) resolve(new ByteBuffer(xhr.response));
						else resolve(null);
					}
				};
				xhr.send();
			} catch (err) {
				resolve(null);
			}
		});
	}
}

/**
 * Represents a batch of HengineResources to be loaded in a row, and can be used as a more streamlined approach to constructing HengineResources by directly.
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
	 * @param Function fn | The function to call while in the context. This function is passed the caller as an argument
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
	 * @param Object options? | An object containing `.frames`, `.delay`, and `.loops` properties that will be passed to the HengineAnimationResource constructor. These values have defaults of 1, 1, and true, respectively
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
	 * @param Object options? | An object containing a `.loops` properties that will be passed to the HengineVideoResource constructor. The default value is true
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
	 * @param Object options? | An object containing a `.loops` properties that will be passed to the HengineSoundResource constructor. The default value is true
	 * @return HengineLoadingStructure
	 */
	sound(src, {
		loops = false
	} = {}) {
		return this.add(new HengineSoundResource(this.absSrc(src), loops));
	}
}

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
			Object.shortcut(window, hengineLoader.hengine.canvas, "width");
			Object.shortcut(window, hengineLoader.hengine.canvas, "height");
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
		if (resource) console.log(`LOADED RESOURCE [${src}]`);
		else console.warn(`LOADING FAILED FOR RESOURCE [${src}]`);
		this.resources.set(src, resource);
	}
	async addResource(wrapper) {
		this.addResourceSync(wrapper, await wrapper.load());
	}
	loadResource(src) {
		if (PathManager.isRoot(src)) {
			const resource = this.resources.get(src);
			if (resource) {
				if ("get" in resource) return resource.get();
				return resource;
			}

			return null;
		} else {
			const processed = src.replace(/\\/g, "/");
			for (const [path, resource] of this.resources)
				if (path.replace(/\\/g, "/").endsWith(processed)) {
					const resource = this.resources.get(path);
					if (resource) {
						if ("get" in resource) return resource.get();
						return resource;
					}
		
					return null;
				}
			return null;
		}
	}
	static load(userResources = [], done = true) {
		async function loadResources() {
			const newHengine = HengineLoader.loader === null;
			if (newHengine) {
				console.time("loading engine");

				// find yourself
				const allScripts = Array.from(document.getElementsByTagName("script"));
				const scriptSrc = allScripts.find(script => script.src.indexOf("Engine/Manage/HengineLoader.js") > -1).src;
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
						const src = PathManager.join([engineSrc, path + ".js"]);
						const script = new HengineScriptResource(src);
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
	[ // no dependencies
		"Preload/PrototypeOverload",
		"Preload/Lazy",
		"Preload/Operable",

		"SceneObject/SceneElement",
		"SceneObject/Scripts",

		"Manage/Scenes",
		"Manage/Hengine",
		"Manage/Intervals",

		"Util/ByteBuffer",
		"Util/FileSystem",
		"Util/Sound",

		"Math/Matrix",
		"Math/Physics",
		"Math/PhysicsAPI",
		"Math/Random",
		"Math/Interpolation",
		"Math/GPUComputation",

		"Render/Frame",
		"Render/Gradient",
		"Render/Spline",
		"Render/WebGL2DContext",
		"Render/GrayMap"
	],
	[ // basic dependencies
		"Util/Input",

		"Manage/Canvas",
		"Manage/ElementContainer",

		"Scripts/Draggable",
		"Scripts/ParticleSpawner",
		"Scripts/Physics",
		"Scripts/PlayerMovement",
		"Scripts/TextArea",

		"SceneObject/SceneObject",
		"Render/Color",

		"Math/Vector",
		"Math/Geometry",

		"Render/Font",
		"Render/Shapes",
		"Render/Animation",
		"Render/Transform",
		"Render/Camera",
		"Render/Webcam",
		"Render/Graph",
		"Render/Texture",
		"Render/VideoView",
		"Render/WebGLRenderer",
		"Render/Renderer",
		"Render/GPUShader",
		"Render/StaticImage",
		"Render/TileMap"
	],
	[ // high level dependencies
		"SceneObject/UIObject"
	]
];
