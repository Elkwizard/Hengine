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
		
		//Abbreviations
		this.cl = new ColorLibrary();
		this.sl = new SoundLibrary();
		window.K = this.keyboard;
		window.M = this.mouse;
		window.g = this.gameEngine;
		window.s = this.scene;
		window.c = this.renderer;
		window.cl = this.cl;
		window.sl = this.sl;
		
		//Words
		window.gameEngine = this.gameEngine;
		window.scene = this.scene;
		window.renderer = this.renderer;
		window.colorLibrary = cl;
		window.soundLibrary = sl;
		window.keyboard = this.keyboard;
		window.mouse = this.mouse;

		if (!(window.width || window.height || window.middle)) {
			Object.defineProperty(window, "middle", {
				get: function() {
					return new Vector2(width / 2, height / 2);
				}
			});
			Object.defineProperty(window, "width", {
				get: function () {
					return window.c.width;
				},
				set: function (a) {
					window.c.width = a;
				}
			});
			Object.defineProperty(window, "height", {
				get: function () {
					return window.c.height;
				},
				set: function (a) {
					window.c.height = a;
				}
			});
		}
		window.custom = this.custom;
		const EXPORT = ["initImage", "initAnimation", "initSound", "loadImage", "loadAnimation", "loadSound", "fileExists", "save", "get", "deleteFile", "getAllFiles", "fileSize", "packageFiles", "importPackage", "getRaw", "saveRaw", "setTitle", "setCursor"];
		for (let EXP of EXPORT) {
			window[EXP] = this[EXP].bind(this);
		}

		this.SPRITE_PATH = "../Art/Sprites/";
		this.ANIMATION_PATH = "../Art/Animations/";
		this.SOUND_PATH = "../Sound/";
		this.animations = {};
		this.images = {};
		this.sounds = {};

		this.initFileSystem();

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
	initFileSystem() {
		this.fileTypes = {
			NUMBER: str => parseFloat(str),
			STRING: str => str,
			NUMBER_ARRAY: str => str.split(",").map(e => parseFloat(e)),
			STRING_ARRAY: str => str.split(","),
			OBJECT: str => JSON.parse(str),
			BOOLEAN: str => str === "true",
			IMAGE: str => Texture.fromString(str),
			GRAY_MAP: str => GrayMap.fromString(str)
		};
		this.fileAliases = {
			NUMBER: ["num", "int", "float", "double"],
			STRING: ["txt", "str", "file", "char"],
			NUMBER_ARRAY: ["num_ary", "num_array"],
			STRING_ARRAY: ["str_ary", "str_array"],
			OBJECT: ["obj", "col"],
			BOOLEAN: ["bln", "bool"],
			IMAGE: ["img", "png", "jpg", "jpeg", "bmp", "txr"],
			GRAY_MAP: ["gray_map", "grm"]
		};
		for (let type in this.fileAliases) {
			for (let alt of this.fileAliases[type]) {
				this.fileTypes[alt.toUpperCase()] = this.fileTypes[type];
			}
		}
	}
	initDefaults() {
		window.WALLS = s.main.addContainer("WALLS", false);
		WALLS.addPhysicsRectElement("Ceiling", width / 2, -50, width, 100, false);
		WALLS.addPhysicsRectElement("Floor", width / 2, height + 50, width, 100, false);
		WALLS.addPhysicsRectElement("Left Wall", -50, height / 2, 100, height + 200, false);
		WALLS.addPhysicsRectElement("Right Wall", width + 50, height / 2, 100, height + 200, false);


		s.addScript("PLAYER_MOVEMENT", {
			init() {
				if (!this.controls.up) {
					this.controls = new Controls("w", "s", "a", "d");
				}
				this.mobilize();
			},
			update() {
				if (K.P(this.controls.down)) this.velocity.y += 0.2;
				if (K.P(this.controls.left)) this.velocity.x += -0.1;
				else if (K.P(this.controls.right)) this.velocity.x += 0.1;
				if (K.P(this.controls.up)) {
					if (this.colliding.bottom) {
						this.velocity.y = -5;
					}
				}
			}
		});
		s.addScript("DRAGGABLE", {
			init(l, bounds = null) {
				l.dragged = false;
				l.offset = Vector2.origin;
				l.bounds = bounds;
				s.mouseEvents = true;
			},
			click(l, m) {
				l.dragged = true;
				l.offset = this.transform.worldSpaceToModelSpace(m);
			},
			update(l) {
				if (M.JR("Left")) l.dragged = false; 
				if (l.dragged) {
					this.transform.position = M.world.minus(l.offset);
					if (l.bounds) {
						let { x, y, width, height } = this.__boundingBox;
						let ox = x - this.transform.position.x;
						let oy = y - this.transform.position.y;
						if (x < l.bounds.x) x = l.bounds.x;
						if (y < l.bounds.y) y = l.bounds.y;
						if (x + width > l.bounds.x + l.bounds.width) x = l.bounds.x + l.bounds.width - width;
						if (y + height > l.bounds.y + l.bounds.height) y = l.bounds.y + l.bounds.height - height;
						this.transform.position.x = x - ox;
						this.transform.position.y = y - oy;
					}
					this.cacheBoundingBoxes();
					if (this.body) {
						//keep awake
						this.stop();
						this.body.wake();
					}
				}
			}
		});
	}
	getProjectName() {
		return document.querySelector("title").innerText;
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
	importPackage(pack, loc = this.getProjectName()) {
		let data = pack;
		for (let key in data) {
			if (!this.getRaw(key, loc)) this.saveRaw(key, data[key], loc);
		}
		return data;
	}
	packageFiles(files = [], loc = this.getProjectName()) {
		let data = {};
		for (let file of files) {
			data[file] = this.getRaw(file, loc);
		}
		let packageString = JSON.stringify(data);
		return packageString;
	}
	getFileType(fileName) {
		let type = fileName.split(".")[1];
		if (!this.fileTypes[type.toUpperCase()]) {
			type = "STRING";
		}
		return type.toUpperCase();
	}
	getFilePath(file, loc) {
		return "HengineLocalSaves\\" + escape(loc) + "\\" + escape(file.split(".")[0]) + "." + file.split(".")[1].toLowerCase();
	}
	saveRaw(file, data, loc = this.getProjectName()) {
		LocalFileSystem.put(this.getFilePath(file, loc), data);
		return data;
	}
	getRaw(file, loc = this.getProjectName()) {
		return LocalFileSystem.get(this.getFilePath(file, loc));
	}
	fileExists(file, loc = this.getProjectName()) {
		return this.getRaw(file, loc) !== undefined;
	}
	save(file, data, loc = this.getProjectName()) {
		let type = this.getFileType(file);
		let actData = data;
		if (this.fileAliases.OBJECT.includes(type.toLowerCase())) data = JSON.stringify(data);
		data += "";
		this.saveRaw(file, data, loc);
		return actData;
	}
	fileSize(file, loc = this.getProjectName()) {
		let data = this.getRaw(file, loc);
		if (data) return (data.length / 512).toMaxed(1) + "kb";
		return 0;
	}
	getAllFiles() {
		let files = LocalFileSystem.getAllFiles().map(file => {
			let inx = file.indexOf("\\") + 1;
			let nFile = file.slice(inx);
			let inx2 = nFile.indexOf("\\");
			let loc = nFile.slice(0, inx2);
			let fileName = nFile.slice(inx2 + 1);
			return { location: unescape(loc), file: unescape(fileName) };
		});
		return files;
	}
	deleteFile(file, loc = this.getProjectName()) {
		LocalFileSystem.clear(this.getFilePath(file, loc));
	}
	get(file, loc = this.getProjectName()) {
		let dat = this.getRaw(file, loc);
		if (dat) {
			let type = this.getFileType(file);
			return this.fileTypes[type](dat);
		}
	}
	initImage(src) {
		return new Frame(src);
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
		f.c.image(img).default(0, 0);
		return f;
	}
	loadAnimation(src) {
		return Animation.copy(this.animations[src]);
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
		return ["Color", "Transform", "Shapes", "Spline", "Gradient", "Animation", "Frame", "GrayMap", "Texture", "Webcam", "Renderer", "Graph", "3DExperimental", "Camera"];
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
	static get defaultEnginePackage() {
		return {
			Preload: Hengine.defaultPreloadPackage,
			Math: Hengine.defaultMathPackage,
			Render: Hengine.defaultRenderPackage,
			Util: Hengine.defaultUtilityPackage,
			SceneObject: Hengine.defaultSceneObjectPackage,
			Manage: Hengine.defaultManagementPackage
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