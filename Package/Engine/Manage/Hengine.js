
class LocalFileSystem {
	static get header() {
		return "LOCAL_FILE_SYSTEM_";
	}
	static compress(str) {
		return str;
	}
	static decompress(str) {
		return str;
	}
	static clearAll() {
		localStorage.clear();
	}
	static clear(key) {
		let prev = LocalFileSystem.header + key;
		let value = "";
		let n = 0;
		let name;
		let names = [];
		do {
			name = prev + "_INX_" + n;
			n++;
			if (localStorage[name] !== undefined) {
				names.push(name);
			}
		} while (localStorage[name] !== undefined);
		for (let name of names) {
			delete localStorage[name];
		}
		return value;

	}
	static put(key, value) {
		value = LocalFileSystem.compress(value);
		try {
			let values = [];
			let acc = "";
			for (let i = 0; i < value.length; i++) {
				acc += value[i];
				if ((i + 1) % 10000 === 0) {
					values.push(acc);
					acc = "";
				}
			}
			values.push(acc);
			values = values.map((e, i) => [e, "_INX_" + i]);

			for (let v of values) {
				let K = LocalFileSystem.header + key + v[1];
				let value = v[0];
				localStorage[K] = value;
			}
		} catch (e) {
			LocalFileSystem.clear(key);
			console.warn("File '" + key + "' was to big. It was erased.");
		}
	}
	static get(key) {
		let prev = LocalFileSystem.header + key;
		let value = "";
		let n = 0;
		let name;
		do {
			name = prev + "_INX_" + n;
			n++;
			if (localStorage[name] !== undefined) {
				value += localStorage[name];
			}
		} while (localStorage[name] !== undefined);
		return LocalFileSystem.decompress(value);
	}
}
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
		//everything needs randomness
		this.randomSeed = 1;
		window.rand = this.rand.bind(this);

		//create engine
		document.body.style.margin = 0;
		this.K = new KeyboardHandler();
		this.M = new MouseHandler();
		window.K = this.K;
		window.M = this.M;
		this.g = new Engine(utility, wrapper);
		this.s = this.g.scene;
		this.c = this.g.renderer;
		this.C = this.c.c;
		this.custom = {};
		this.cl = new ColorLibrary();
		this.sl = new SoundLibrary();
		this.K = K;
		this.M = M;
		window.g = this.g;
		window.s = this.s;
		window.c = this.c;
		window.C = this.C;
		window.cl = this.cl;
		window.sl = this.sl;
		window.gameEngine = g;
		window.scene = s;
		window.renderer = c;
		window.colorLibrary = cl;
		window.soundLibrary = sl;
		window.keyboard = K;
		window.mouse = M;
		if (!(window.width || window.height)) {
			Object.defineProperty(window, "width", {
				get: function () {
					return window.c.canvas.width;
				},
				set: function (a) {
					window.c.canvas.width = a;
				}
			});
			Object.defineProperty(window, "height", {
				get: function () {
					return window.c.canvas.height;
				},
				set: function (a) {
					window.c.canvas.height = a;
				}
			});
		}
		window.custom = this.custom;
		const EXPORT = ["initImage", "initAnimation", "initSound", "loadImage", "loadAnimation", "loadSound", "fileExists", "middle", "save", "get", "fileSize", "packageFiles", "importPackage", "getRaw", "saveRaw", "setTitle", "setCursor"];

		for (let EXP of EXPORT) {
			window[EXP] = this[EXP].bind(this);
		}
		this.SPRITE_PATH = "../Art/Sprites/";
		this.ANIMATION_PATH = "../Art/Animations/";
		this.SOUND_PATH = "../Sound/";
		this.animations = {};
		this.images = {};
		this.sounds = {};

		this.fileTypes = {
			NUMBER: str => parseFloat(str),
			STRING: str => str,
			NUMBER_ARRAY: str => str.split(",").map(e => parseFloat(e)),
			STRING_ARRAY: str => str.split(","),
			OBJECT: str => JSON.parse(str),
			BOOLEAN: str => str === "true",
			IMAGE: str => Texture.fromString(str)
		};
		this.fileAliases = {
			NUMBER: ["num", "int", "float", "double"],
			STRING: ["txt", "str", "file", "char"],
			NUMBER_ARRAY: ["num_ary", "num_array"],
			STRING_ARRAY: ["str_ary", "str_array"],
			OBJECT: ["obj", "col"],
			BOOLEAN: ["bln", "bool"],
			IMAGE: ["img", "png", "jpg", "jpeg", "bmp", "txr"]
		};
		for (let type in this.fileAliases) {
			for (let alt of this.fileAliases[type]) {
				this.fileTypes[alt.toUpperCase()] = this.fileTypes[type];
			}
		}

		//title
		this.setTitle(this.getProjectName());

		//defaults
		window.WALLS = new InactiveScene("WALLS");
		WALLS.addPhysicsRectElement("Ceiling", width / 2, -50, width, 100, false);
		WALLS.addPhysicsRectElement("Floor", width / 2, height + 50, width, 100, false);
		WALLS.addPhysicsRectElement("Left Wall", -50, height / 2, 100, height + 200, false);
		WALLS.addPhysicsRectElement("Right Wall", width + 50, height / 2, 100, height + 200, false);


		window.PLAYER_MOVEMENT = new ElementScript("PLAYER_MOVEMENT", {
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

	}
	get width() {
		return this.s.display.width;
	}
	get height() {
		return this.s.display.height;
	}
	getProjectName() {
		let script = document.createElement("script");
		script.src = "./Source.js";
		let t = script.src;
		let st = t.split("/");
		let ti = st[st.length - 3];
		if (ti) {
			ti = unescape(ti);
		} else ti = "Unknown";
		return ti;
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
	saveRaw(file, data, loc = this.getProjectName()) {
		let name = file.split(".")[0] + "." + file.split(".")[1].toLowerCase();
		LocalFileSystem.put("HengineLocalSaves/" + loc + "/" + name, data);
		return data;
	}
	getRaw(file, loc = this.getProjectName()) {
		let name = file.split(".")[0] + "." + file.split(".")[1].toLowerCase();
		let dat = LocalFileSystem.get("HengineLocalSaves/" + loc + "/" + name);
		return dat;
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
		if (data) {
			return data.length * 8;
		}
	}
	get(file, loc = this.getProjectName()) {
		let dat = this.getRaw(file, loc);
		if (dat) {
			let type = this.getFileType(file);
			return this.fileTypes[type](dat);
		}
	}
	initImage(src) {
		let x = new Frame();
		x.src = src;
		return x;
	}
	initSound(src) {
		let x = new Sound(src);
		return x;
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
	middle() {
		return this.c.middle();
	}
	static get defaultPreloadPackage() {
		return ["PrototypeOverload"];
	}
	static get defaultRenderPackage() {
		return ["Color", "Shapes", "Spline", "Animation", "Frame", "Texture", "Webcam", "Renderer", "Graph", "3DExperimental"];
	}
	static get defaultManagementPackage() {
		return ["Scripts", "Scenes", "Engine", "Hengine"];
	}
	static get defaultMathPackage() {
		return ["Random", "Operable", "Vector", "Geometry", "Physics", "PhysicsAPI"];
	}
	static get defaultUtilityPackage() {
		return ["Input", "Sound", "Time", "Console"];
	}
	static get defaultSceneObjectPackage() {
		return ["SceneObject", "SATPhysicsObject", "SpawnerObject", "UIObject"];
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
		for (let element in scripts) {
			let path;
			if (element === "engine") {
				path = scripts[element]["path"] ? scripts[element]["path"] : rootSrc;
			} else if (element === "sprites") {
				path = scripts[element]["path"] ? scripts[element]["path"] : "../Art/Sprites";
			} else if (element === "animations") {
				path = scripts[element]["path"] ? scripts[element]["path"] : "../Art/Animations";
			} else if (element === "sounds") {
				path = scripts[element]["path"] ? scripts[element]["path"] : "../Sounds";
			} else if (element === "code") {
				path = scripts[element]["path"] ? scripts[element]["path"] : ".";
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
						if (file === "Hengine") {
							window.HENGINE = new Hengine(scripts.utility);
							document.head.innerHTML += `<link rel="icon" href="https://elkwizard.github.io/Hengine/Package/favicon.ico" type="image/x-icon"></link>`;
							onload();
						} else {
							if (file.match(/DATA/g)) {
								eval(file.slice(5));
							} else {
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
		}
	}
}
Hengine.scriptsLoaded = [];