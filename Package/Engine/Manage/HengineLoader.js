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
		if (rootPrefix) {
			path = path.slice(rootPrefix.length);
		}

		let pieces = path.split("/");
		let resultPath = [];
		for (let i = 0; i < pieces.length; i++) {
			if (pieces[i] === ".") continue;
			if (pieces[i] === "..") {
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
class HengineResource {
	constructor(src) {
		this.src = src;
	}
	load() {

	}
}
class HengineScriptResource extends HengineResource {
	load() {
		const script = document.createElement("script");
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
class HengineSoundResource extends HengineResource {
	load() {
		const sound = new Sound(this.src);
		return new Promise(resolve => {
			sound.audio.addEventListener("load", function () {
				resolve(sound);
			});
			sound.audio.addEventListener("error", function () {
				resolve(null);
			});
		});
	}
}
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
class HengineVideoResource extends HengineResource {
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
class HengineAnimationResource extends HengineResource {
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
class HengineFontResource extends HengineResource {
	load() {
		return new Promise(async resolve => {
			const handleCSS = css => {
				const style = document.createElement("style");

				const firstFontIndex = document.fonts.size;
				
				style.onload = async () => {
					const allFonts = [...document.fonts];
					const { family } = allFonts[allFonts.length - 1];
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
			return this.resources.get(src) ?? null;
		} else {
			const processed = src.replace(/[/\\]/g, "/").replace(/([\.\\])/g, "\\$1");
			const processed2 = src.replace(/[/\\]/g, "\\").replace(/([\.\\])/g, "\\$1");
			const regex = new RegExp(processed + "$");
			const regex2 = new RegExp(processed2 + "$");
			for (const [path, resource] of this.resources) {
				if (path.match(regex) || path.match(regex2)) return resource;
			}
			return null;
		}
	}
	static load(userResources = []) {
		async function loadResources() {
			if (HengineLoader.loader === null) {
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
		"Math/Geometry",
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
		"Render/StaticImage"
	],
	[ // high level dependencies
		"SceneObject/UIObject"
	]
];
