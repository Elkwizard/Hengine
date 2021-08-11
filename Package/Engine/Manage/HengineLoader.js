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
class HengineFontResource {
	load() {
		const style = document.createElement("style");
		style.innerHTML = `@import url(${JSON.stringify(this.src)})`;

		return new Promise(async resolve => {
			style.onload = () => {
				const { family } = [...document.fonts][document.fonts.size - 1];
				const testCSS = "20px " + family;
				document.fonts.load(testCSS, HengineFontResource.TEST_STRING).then(() => resolve(family));
			};
			style.onerror = () => resolve(null);
			document.head.appendChild(style);
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
		this.hengine = new Hengine();

		//window
		window.hengine = this.hengine;
		window.scene = this.hengine.scene;
		window.renderer = this.hengine.renderer;
		window.keyboard = this.hengine.keyboard;
		window.mouse = this.hengine.mouse;
		window.clipboard = this.hengine.clipboard;
		window.fileSystem = this.hengine.fileSystem;
		window.intervals = this.hengine.intervals;
		window.canvas = this.hengine.canvas;

		let hengine = this;
		if (!(window.width || window.height || window.middle)) {
			Object.defineProperty(window, "middle", {
				get() {
					return new Vector2(hengine.hengine.canvas.width / 2, hengine.hengine.canvas.height / 2);
				}
			});
			Object.defineProperty(window, "width", {
				set(a) {
					hengine.hengine.canvas.width = a;
				},
				get() {
					return hengine.hengine.canvas.width;
				}
			});
			Object.defineProperty(window, "height", {
				set(a) {
					hengine.hengine.canvas.height = a;
				},
				get() {
					return hengine.hengine.canvas.height;
				}
			});
		}
		window.loadResource = this.loadResource.bind(this);

		this.resources = new Map();

		//title
		let script = document.createElement("script");
		script.src = "./fake.js";
		let t = script.src;
		let st = t.split("/");
		let ti = st[st.length - 2];
		if (ti) {
			ti = unescape(ti);
		} else ti = "Unknown";

		window.title = ti;
	}
	loadResource(src) {
		if (PathManager.isRoot(src)) {
			return this.resources.get(src) ?? null;
		} else {
			const processed = src.replace(/[/\\]/g, "/").replace(/([\.\\])/g, "\\$1");
			const processed2 = src.replace(/[/\\]/g, "\\").replace(/([\.\\])/g, "\\$1");
			const regex = new RegExp(processed + "$");
			const regex2 = new RegExp(processed2 + "$");
			for (let [path, resource] of this.resources) {
				if (path.match(regex) || path.match(regex2)) return resource;
			}
			return null;
		}
	}
	static load(userResources, engineLoaded = false) {
		async function loadResources() {
			let scriptHome = document.querySelectorAll("script"); //find yourself
			for (let el of scriptHome) {
				if (el.src.indexOf("Engine/Manage/Hengine") > -1) {
					scriptHome = el;
					break;
				}
			}
			let pathSRC = scriptHome.src.split("/");
			pathSRC.pop();
			pathSRC.pop();
			pathSRC.pop();
			let rootSrc = pathSRC.join("/");

			//icon
			document.head.innerHTML += `<link rel="icon" href="${rootSrc}/favicon.ico" type="image/x-icon"></link>`;

			rootSrc += "/Engine";
			console.log(`EXTRACTING FROM ROOT [${rootSrc}]`);

			console.time("loading engine");
			
			if (!engineLoaded) for (let i = 0; i < HengineLoader.engineResources.length; i++) {
				const block = HengineLoader.engineResources[i];
				const promises = [];
				for (let i = 0; i < block.length; i++) {
					const path = block[i];
					const script = new HengineScriptResource(PathManager.join([rootSrc, path + ".js"]));
					promises.push(script.load());
				}
				await Promise.all(promises);
			}

			console.timeEnd("loading engine");


			document.body.style.width = "100vw";
			document.body.style.height = "100vh";
			const hengineLoader = new HengineLoader();
			window.hengineLoader = hengineLoader;

			let nonScriptPromiseAcc = [];
			let nonScriptSourceAcc = [];

			const loadSuccess = src => console.log(`LOADED RESOURCE [${src}]`);
			const loadFailure = src => console.warn(`LOADING FAILED FOR RESOURCE [${src}]`);

			console.time("loading user resources");

			for (let i = 0; i < userResources.length; i++) {
				const userResource = userResources[i];

				if (userResources[i] instanceof HengineScriptResource) {
					const resources = await Promise.all(nonScriptPromiseAcc);
					for (let i = 0; i < resources.length; i++) {
						const src = nonScriptSourceAcc[i];
						const resource = resources[i];

						if (resource) loadSuccess(src);
						else loadFailure(src);

						hengineLoader.resources.set(src, resource);
					}
					nonScriptPromiseAcc = [];
					nonScriptSourceAcc = [];

					// console.log([...hengineLoader.resources.entries()].toString(1))

					const scriptResource = await userResource.load();
					if (scriptResource) loadSuccess(userResource.src);
					else loadFailure(userResource.src);
					hengineLoader.resources.set(userResource.src, scriptResource);
				} else {
					const promise = userResource.load();
					nonScriptPromiseAcc.push(promise);
					nonScriptSourceAcc.push(userResource.src);
				}
			}

			console.timeEnd("loading user resources");

			//450ms;
		}
		if (document.body && document.head) return loadResources();
		else {
			return new Promise(function (resolve) {
				window.addEventListener("load", async function () {
					await loadResources();
					resolve();
				});
			});
		}
	}
}

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
		"Util/Input",
		"Util/FileSystem",
		"Util/Sound",
		
		"Math/Matrix",
		"Math/Geometry",
		"Math/Physics",
		"Math/PhysicsAPI",
		"Math/Random",
		"Math/Interpolation",
		
		"Render/Frame",
		"Render/Gradient",
		"Render/Spline",
		"Render/WebGL2DContext",	
		"Render/GrayMap"
	],
	[ // basic dependencies
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
		"Math/GPUComputation",
		
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
		"Render/GPUShader"
	],
	[ // high level dependencies
		"SceneObject/UIObject"
	]
];