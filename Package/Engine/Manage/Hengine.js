class ApplicationPackageElement {
	constructor(files) {
		this.files = files;
	}
}
class ApplicationPackage {
	constructor(engine, code, art, animations, sound, canvas) {
		this.engine = new ApplicationPackageElement(engine);
		this.code = new ApplicationPackageElement({ ".": code });
		this.sprites = new ApplicationPackageElement({ ".": art });
		this.animations = new ApplicationPackageElement({ ".": animations });
		this.sounds = new ApplicationPackageElement({ ".": sound });
		this.utility = !canvas;
	}
}
//create game loop
(function () {
	window.intervals = [];
	setInterval(function () {
		for (let fn of window.intervals) {
			fn();
		}
	}, 16);

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
	window.intervals = [];
	window.animationFrames = [];
}
class Hengine {
	constructor(utility, wrapper = document.body) {
		if (!window.HENGINE_EXISTS) {
			window.HENGINE_EXISTS = true;
		} else throw new Error("Multiple Hengines");
		//everything needs randomness
		this.randomSeed = 1;
		window.rand = this.rand.bind(this);

		//create engine
		if (!utility) {
			document.body.style.margin = 0;
			document.body.style.overflow = "hidden";

			document.head.innerHTML += `<link rel="icon" href="https://elkwizard.github.io/Hengine/Package/favicon.ico" type="image/x-icon"></link>`;
		}
		
		this.gameEngine = new Engine(utility, wrapper);
		this.scene = this.gameEngine.scene;
		this.renderer = this.gameEngine.renderer;
		this.keyboard = this.gameEngine.keyboard;
		this.mouse = this.gameEngine.mouse;
		this.clipboard = this.gameEngine.clipboard;
		this.fileSystem = this.gameEngine.fileSystem;
		this.colorLibrary = new ColorLibrary();
		this.soundLibrary = new SoundLibrary();
		
		//window
		window.cl = this.colorLibrary;
		window.sl = this.soundLibrary;
		window.gameEngine = this.gameEngine;
		window.scene = this.scene;
		window.renderer = this.renderer;
		window.colorLibrary = this.colorLibrary;
		window.soundLibrary = this.soundLibrary;
		window.keyboard = this.keyboard;
		window.mouse = this.mouse;
		window.clipboard = this.clipboard;
		window.fileSystem = this.fileSystem;

		let hengine = this;
		if (!(window.width || window.height || window.middle)) {
			Object.defineProperty(window, "middle", {
				get: function() {
					return new Vector2(hengine.renderer.width / 2, hengine.renderer.height / 2);
				}
			});
			Object.defineProperty(window, "width", {
				get: function () {
					return hengine.renderer.width;
				}
			});
			Object.defineProperty(window, "height", {
				get: function () {
					return hengine.renderer.height;
				}
			});
		}
		const EXPORT = ["initImage", "initAnimation", "initSound", "loadImage", "loadAnimation", "loadSound", "setTitle", "setCursor"];
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

		this.setTitle(ti);

		//defaults
		this.initDefaults();
	}
	initDefaults() {
		window.WALLS = scene.main.addContainer("WALLS", false);
		let { width, height } = this.renderer;
		WALLS.addPhysicsRectElement("Ceiling", width / 2, -50, width, 100, false);
		WALLS.addPhysicsRectElement("Floor", width / 2, height + 50, width, 100, false);
		WALLS.addPhysicsRectElement("Left Wall", -50, height / 2, 100, height + 200, false);
		WALLS.addPhysicsRectElement("Right Wall", width + 50, height / 2, 100, height + 200, false);
	}
	setTitle(title) {
		let t = document.querySelector("title");
		if (!t) {
			t = document.createElement("title");
			document.head.appendChild(t);
		}
		t.innerHTML = title;
		return title;
	}
	setCursor(cursor) {
		document.body.style.cursor = cursor;
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
		let img = this.images[src];
		let f = new Frame(img.width, img.height);
		f.renderer.image(img).default(0, 0);
		return f;
	}
	loadAnimation(src) {
		return this.animations[src].get();
	}
	rand(sd) {
		let seed = this.randomSeed++;
		if (sd !== undefined) seed = sd;
		seed += 1e5;
		let a = (seed * 6.12849) % 8.7890975
		let b = (a * 256783945.4758903) % 238462.567890;
		let r = (a * b) % 1;
		this.randomSeed += r;
		return r;
	}
	static get defaultPreloadPackage() {
		return ["PrototypeOverload"];
	}
	static get defaultRenderPackage() {
		return ["Color", "Transform", "Shapes", "Spline", "Gradient", "GrayMap", "Frame", "Animation", "Texture", "Webcam", "GPUShader", "Font", "Renderer", "Graph", "3DExperimental", "Camera"];
	}
	static get defaultManagementPackage() {
		return ["ElementContainer", "Scenes", "IntervalFunction", "Engine", "Hengine"];
	}
	static get defaultMathPackage() {
		return ["Operable", "Interpolation", "Random", "Vector", "Geometry", "Physics", "PhysicsAPI"];
	}
	static get defaultUtilityPackage() {
		return ["Input", "Sound", "Time", "Console", "LocalFileSystem"];
	}
	static get defaultSceneObjectPackage() {
		return ["Scripts", "SceneObject", "SATPhysicsObject", "SpawnerObject", "UIObject"];
	}
	static get defaultScriptPackage() {
		return ["TextArea", "PlayerMovement", "Draggable"];
	}
	static get defaultEnginePackage() {
		return {
			Preload: Hengine.defaultPreloadPackage,
			Math: Hengine.defaultMathPackage,
			Render: Hengine.defaultRenderPackage,
			Util: Hengine.defaultUtilityPackage,
			SceneObject: Hengine.defaultSceneObjectPackage,
			Manage: Hengine.defaultManagementPackage,
			Scripts: Hengine.defaultScriptPackage
		};
	}
	static utilityApplicationPackage(code = []) {
		return new ApplicationPackage(Hengine.defaultEnginePackage, code, [], [], [], false);
	}
	static defaultApplicationPackage(code = [], art = [], animations = [], music = []) {
		return new ApplicationPackage(Hengine.defaultEnginePackage, code, art, animations, music, true);
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
		let rootSrc = pathSRC.join("/") + "/Engine";
		console.log("EXTRACTING FROM ROOT [" + rootSrc + "]");
		function instantiateHengine() {
			window.HENGINE = new Hengine(scripts.utility);
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
								resource = window.HENGINE.initAnimation(path + "/" + folder + "/" + file.folder, file.frames, file.delay, file.loop || false);
								window.HENGINE.animations[file.folder] = resource;
							} else if (element === "sprites") {
								type = "IMAGE";
								resource = window.HENGINE.initImage(path + "/" + folder + "/" + file);
								window.HENGINE.images[file] = resource;
							} else if (element === "sounds") {
								type = "SOUND";
								resource = window.HENGINE.initSound(path + "/" + folder + "/" + file);
								window.HENGINE.sounds[file] = resource;
							}
						}
					} else {
						if (file !== "Hengine") {
							if (file.match(/DATA/g)) {
								eval(file.slice(5));
							} else {
								if (element === "code" && !window.HENGINE) instantiateHengine();

								if (!document.querySelector(`script[src="${src}.js"]`)) {
									let script = document.createElement("script");
									script.src = src + ".js";
									document.body.appendChild(script);
									resource = script;
									Hengine.scriptsLoaded.push(file);
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
Hengine.scriptsLoaded = [];