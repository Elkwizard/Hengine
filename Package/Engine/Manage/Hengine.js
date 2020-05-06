class Hengine {
	constructor(wrapperID, width, height, airResistance, gravity, canvasID) {
		//everything needs randomness
		this.randomSeed = 1;
		window.rand = this.rand.bind(this);

		//create engine
		this.g = new Engine(wrapperID, width, height, airResistance, gravity, canvasID);
		this.s = this.g.scene;
		this.c = this.g.renderer;
		this.C = this.c.c;
		this.custom = {};
		this.cl = new ColorLibrary();
		this.K = K;
		this.M = M;
		window.g = this.g;
		window.s = this.s;
		window.c = this.c;
		window.C = this.C;
		window.cl = this.cl;
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
		window.loadImage = this.loadImage.bind(this);
		window.loadAnimation = this.loadAnimation.bind(this);
		window.loadSound = this.loadSound.bind(this);
		window.middle = this.middle.bind(this);
		window.save = this.save.bind(this);
		window.get = this.get.bind(this);
		window.fileSize = this.fileSize.bind(this);
		window.packageFiles = this.packageFiles.bind(this);
		window.importPackage = this.importPackage.bind(this);
		window.clearFiles = this.clearFiles.bind(this);
		window.saveRaw = this.saveRaw.bind(this);
		window.getRaw = this.getRaw.bind(this);
		window.setTitle = this.setTitle.bind(this);
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
		ti = ti.replace(/%20/g, " ");
		return ti;
	}
	setTitle(title) {
		document.querySelector("title").innerHTML = title;
		return title;
	}
	clearFiles(loc = this.getProjectName()) {
		let src = "HengineLocalSaves/" + loc + "/";
		for (let key in localStorage) {
			if (key.indexOf(src) > -1) delete localStorage[key];
		}
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
		//escape chars
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
		localStorage["HengineLocalSaves/" + loc + "/" + name] = data;
		return data;
	}
	getRaw(file, loc = this.getProjectName()) {
		let name = file.split(".")[0] + "." + file.split(".")[1].toLowerCase();
		let dat = localStorage["HengineLocalSaves/" + loc + "/" + name];
		return dat;
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
		let x = new Image;
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
		f.c.c.drawImage(img, 0, 0, f.width, f.height);

		return f;
	}
	loadAnimation(src) {
		return Animation.copy(this.animations[src]);
	}
	static async load(scripts) {
		let scriptHome = document.querySelector("script"); //find yourself
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
							window.HENGINE = new Hengine();
						} else {
							if (file.match(/DATA/g)) {
								eval(file.slice(5));
							} else {
								if (!document.querySelector(`script[src="${src}.js"]`)) {
									let script = document.createElement("script");
									script.src = src + ".js";
									document.body.appendChild(script);
									resource = script;
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
	rand(sd) {
		let seed = this.randomSeed++;
		if (sd !== undefined) seed = sd;
		let a = (seed * 6.12849) % 8.7890975
		let b = (a * 256783945.4758903) % 238462.567890;
		let r = (a * b) % 1;
		this.randomSeed += r;
		return r;
	}
	middle() {
		return this.c.middle();
	}
}