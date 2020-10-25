class ApplicationPackageElement {
	constructor(files) {
		this.files = files;
	}
}
class ApplicationPackage {
	constructor(engine, code, art, animations, sound) {
		this.engine = new ApplicationPackageElement(engine);
		this.code = new ApplicationPackageElement({ ".": code });
		this.sprites = new ApplicationPackageElement({ ".": art });
		this.animations = new ApplicationPackageElement({ ".": animations });
		this.sounds = new ApplicationPackageElement({ ".": sound });
	}
}
//create animation loop
(function () {
	window.animationFrames = [];
	function animate() {
		requestAnimationFrame(animate);
		for (let fn of window.animationFrames) {
			fn();
		}
	}
	animate();
})();
function exit(...msg) { 
	console.log(...msg);
	window.animationFrames = [];
}
class HengineLoader {
	constructor(wrapper = document.body) {
		this.hengine = new Hengine(wrapper);
		
		//window
		window.cl = this.hengine.colorLibrary;
		window.hengine = this.hengine;
		window.scene = this.hengine.scene;
		window.renderer = this.hengine.renderer;
		window.keyboard = this.hengine.keyboard;
		window.mouse = this.hengine.mouse;
		window.clipboard = this.hengine.clipboard;
		window.fileSystem = this.hengine.fileSystem;

		let hengine = this;
		if (!(window.width || window.height || window.middle)) {
			Object.defineProperty(window, "middle", {
				get: function() {
					return new Vector2(hengine.hengine.renderer.width / 2, hengine.hengine.renderer.height / 2);
				}
			});
			Object.defineProperty(window, "width", {
				get: function () {
					return hengine.hengine.renderer.width;
				}
			});
			Object.defineProperty(window, "height", {
				get: function () {
					return hengine.hengine.renderer.height;
				}
			});
		}
		const EXPORT = ["initImage", "initAnimation", "initSound", "loadImage", "loadAnimation", "loadSound"];
		for (let EXP of EXPORT) {
			window[EXP] = this[EXP].bind(this);
		}

		this.SPRITE_PATH = "../Art/Sprites/";
		this.ANIMATION_PATH = "../Art/Animations/";
		this.SOUND_PATH = "../Sound/";
		this.animations = {};
		this.images = {};
		this.sounds = {};

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
	initImage(src) {
		return new HImage(src);
	}
	initSound(src) {
		return new Sound(src);
	}
	initAnimation(src, frames, delay, loop, response) {
		return new Animation(src, frames, delay, loop, response);
	}
	loadSound(src) {
		return this.sounds[src];
	}
	loadImage(src) {
		return this.images[src];
	}
	loadAnimation(src) {
		return this.animations[src].get();
	}
	static get defaultPreloadPackage() {
		return ["PrototypeOverload"];
	}
	static get defaultRenderPackage() {
		return ["Color", "Transform", "Shapes", "Spline", "Gradient", "GrayMap", "Frame", "Animation", "Texture", "Webcam", "GPUShader", "Font", "Renderer", "Graph", "3DExperimental", "Camera"];
	}
	static get defaultManagementPackage() {
		return ["ElementContainer", "Scenes", "IntervalFunction", "Engine", "HengineLoader"];
	}
	static get defaultMathPackage() {
		return ["Operable", "Interpolation", "Random", "Vector", "Geometry", "Physics", "PhysicsAPI"];
	}
	static get defaultUtilityPackage() {
		return ["Input", "Sound", "Time", "LocalFileSystem"];
	}
	static get defaultSceneObjectPackage() {
		return ["Scripts", "SceneObject", "SATPhysicsObject", "SpawnerObject", "UIObject"];
	}
	static get defaultScriptPackage() {
		return ["TextArea", "PlayerMovement", "Draggable"];
	}
	static get defaultEnginePackage() {
		return {
			Preload: HengineLoader.defaultPreloadPackage,
			Math: HengineLoader.defaultMathPackage,
			Render: HengineLoader.defaultRenderPackage,
			Util: HengineLoader.defaultUtilityPackage,
			SceneObject: HengineLoader.defaultSceneObjectPackage,
			Manage: HengineLoader.defaultManagementPackage,
			Scripts: HengineLoader.defaultScriptPackage
		};
	}
	static defaultApplicationPackage(code = [], art = [], animations = [], music = []) {
		return new ApplicationPackage(HengineLoader.defaultEnginePackage, code, art, animations, music);
	}
	static async load(scripts, onload = () => null) {
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
		function instantiateHengine() {
			window.HENGINE = new HengineLoader(document.body);
			onload();
		}
		for (let element in scripts) {
			let path;
			if (element === "engine") {
				path = scripts[element].path ? scripts[element].path : rootSrc;
			} else if (element === "sprites") {
				path = scripts[element].path ? scripts[element].path : "../Art/Sprites";
			} else if (element === "animations") {
				path = scripts[element].path ? scripts[element].path : "../Art/Animations";
			} else if (element === "sounds") {
				path = scripts[element].path ? scripts[element].path : "../Sounds";
			} else if (element === "code") {
				path = scripts[element].path ? scripts[element].path : ".";
			}
			for (let folder in scripts[element].files) {
				for (let file of scripts[element].files[folder]) {
					let src = path + "/" + folder + "/" + file;
					//absolute path
					if (file[1] === ":") src = file;
					
					let resource = null;
					let type = "SCRIPT";
					if (element === "sprites" || element === "animations" || element === "sounds") {
						if (window.HENGINE) {
							if (element === "animations") {
								type = "ANIMATION"
								resource = window.HENGINE.initAnimation(`${path}/${folder}/${file.folder}`, file.frames, file.delay, file.loops || false);
								window.HENGINE.animations[file.folder] = resource;
							} else if (element === "sprites") {
								type = "IMAGE";
								resource = window.HENGINE.initImage(src);
								window.HENGINE.images[file] = resource;
							} else if (element === "sounds") {
								type = "SOUND";
								resource = window.HENGINE.initSound(src);
								window.HENGINE.sounds[file] = resource;
							}
						}
					} else {
						if (file !== "HengineLoader") {
							if (file.match(/DATA/g)) {
								eval(file.slice(5));
							} else {
								if (element === "code" && !window.HENGINE) instantiateHengine();

								if (!document.querySelector(`script[src="${src}.js"]`)) {
									let script = document.createElement("script");
									script.src = src + ".js";
									document.body.appendChild(script);
									resource = script;
									HengineLoader.scriptsLoaded.push(file);
								}
							}
						}
					}
					if (resource) await new Promise(function (resolve, reject) {
						resource.onload = function () {
							resolve();
						}
					});
				}
			}
			if (!window.HENGINE) instantiateHengine();
		}
	}
}
HengineLoader.scriptsLoaded = [];