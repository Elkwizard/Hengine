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
	constructor(src) {
		super(src);
	}
	load() {
		const script = document.createElement("script");
		script.src = this.src;
		document.head.appendChild(script);
		return new Promise(function (resolve) {
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
	constructor(src) {
		super(src);
	}
	load() {
		const sound = new Sound(this.src);
		return new Promise(function (resolve) {
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
	constructor(src) {
		super(src);
	}
	load() {
		const image = new HImage(this.src);
		return new Promise(function (resolve) {
			image.image.addEventListener("load", function () {
				// update dimensions in interim
				image.width = image.image.width;
				image.height = image.image.height;
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
		return new Promise(function (resolve) {
			video.video.addEventListener("canplay", () => {
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
						animation.width = image.image.width;
						animation.height = image.image.height;
						resolve(animation);
					});
					image.image.addEventListener("error", function () {
						resolve(null);
					});
				}));
			}
		}
		return new Promise(async function (resolve) {
			await Promise.all(promises);
			resolve(animation);
		});
	}
}
function exit(...msg) {
	console.warn("EXITED", ...msg);
	IntervalManager.intervals = [];
}
class HengineLoader {
	constructor() {
		this.hengine = new Hengine();

		//window
		window.cl = this.hengine.colorLibrary;
		window.hengine = this.hengine;
		window.scene = this.hengine.scene;
		window.renderer = this.hengine.renderer;
		window.keyboard = this.hengine.keyboard;
		window.mouse = this.hengine.mouse;
		window.clipboard = this.hengine.clipboard;
		window.fileSystem = this.hengine.fileSystem;
		window.intervals = this.hengine.intervals;

		let hengine = this;
		if (!(window.width || window.height || window.middle)) {
			Object.defineProperty(window, "middle", {
				get: function () {
					return new Vector2(hengine.hengine.renderer.width / 2, hengine.hengine.renderer.height / 2);
				}
			});
			Object.defineProperty(window, "width", {
				set: function (a) {
					hengine.hengine.renderer.width = a;
				},
				get: function () {
					return hengine.hengine.renderer.width;
				}
			});
			Object.defineProperty(window, "height", {
				set: function (a) {
					hengine.hengine.renderer.height = a;
				},
				get: function () {
					return hengine.hengine.renderer.height;
				}
			});
		}
		window.loadResource = this.loadResource.bind(this);

		this.resources = new Map();

		//title
		let script = document.createElement("script");
		script.src = "./Source.js";
		let t = script.src;
		let st = t.split("/");
		let ti = st[st.length - 3];
		if (ti) {
			ti = unescape(ti);
		} else ti = "Unknown";

		window.title = ti;
	}
	loadResource(src) {
		if (PathManager.isRoot(src)) {
			return this.resources.get(src) || null;
		} else {
			const processed = escape(src).replace(/([\.\\])/g, "\\$1");
			const regex = new RegExp(processed + "$");
			for (let [path, resource] of this.resources) {
				if (path.match(regex)) return resource;
			}
			return null;
		}
	}
	static load(userResources) {
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

			for (let i = 0; i < HengineLoader.engineResources.length; i++) {
				let path = HengineLoader.engineResources[i];
				let resource = new HengineScriptResource(PathManager.join([rootSrc, path + ".js"]));
				await resource.load();
			}


			document.body.style.width = "100vw";
			document.body.style.height = "100vh";
			const hengineLoader = new HengineLoader();
			window.hengineLoader = hengineLoader;


			for (let i = 0; i < userResources.length; i++) {
				const resource = await userResources[i].load();
				if (resource) console.log(`LOADED RESOURCE [${userResources[i].src}]`);
				else console.warn(`LOADING FAILED FOR RESOURCE [${userResources[i].src}]`);
				hengineLoader.resources.set(userResources[i].src, resource);
			}
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
	"Preload/PrototypeOverload", "Preload/Lazy", "Preload/Operable",

	"Math/Interpolation", "Math/Random", "Math/Matrix", "Math/Vector", "Math/Geometry", "Math/Physics", "Math/PhysicsAPI",

	"Render/Color", "Render/Transform", "Render/Shapes", "Render/Spline", "Render/Gradient", "Render/GrayMap", "Render/Frame", "Render/Animation", "Render/Texture", "Render/Webcam", "Render/VideoView", "Render/GPUShader", "Math/GPUComputation", "Render/WebGLImageRenderer", "Render/Font", "Render/WebGLRenderer2D", "Render/WebGLRenderer3D", "Render/Renderer", "Render/Graph", "Render/Mesh", "Render/Camera",

	"Util/Input", "Util/Sound", "Util/Time", "Util/LocalFileSystem",

	"SceneObject/Scripts", "SceneObject/SceneElement", "SceneObject/SceneObject", "SceneObject/SATPhysicsObject", "SceneObject/SpawnerObject", "SceneObject/UIObject",

	"Scripts/TextArea", "Scripts/PlayerMovement", "Scripts/Draggable",

	"Manage/ElementContainer", "Manage/Scenes", "Manage/Intervals", "Manage/Hengine",
];