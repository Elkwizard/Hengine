class ElementContainer {
	constructor(name = "container", active, home, engine) {
		this.elements = { };
		this.active = active;
		this.name = name;
		this.home = home;
		this.engine = engine;
		this.elementArray = [];
		this.removeQueue = [];
		this.defaults = {
			SceneObject: {
				draw(name, shape) {
					renderer.draw(cl.BLACK).infer(shape);
					renderer.stroke(cl.CYAN, 1).infer(shape);
				},
				scripts: []
			},
			PhysicsObject: {
				draw(name, shape) {
					renderer.draw(cl.BLACK).infer(shape);
					renderer.stroke(cl.RED, 1).infer(shape);
				},
				scripts: []
			},
			UIObject: {
				draw(name, shape) {
					renderer.draw(cl.WHITE).infer(shape);
					renderer.stroke(cl.PURPLE, 1).infer(shape);
				},
				scripts: []
			},
			ParticleSpawnerObject: {
				draw(name, shape) { },
				scripts: []
			},
			ParticleObject: {
				draw(name, shape) {
					renderer.draw(cl.BLACK).infer(shape);
				},
				scripts: []
			}
		};
	}
	activate() {
		this.active = true;
		this.updateArray();
		for (let element of this.elementArray) if (element.body) element.activate();
	}
	deactivate() {
		this.updateArray();
		this.active = false;
		for (let element of this.elementArray) if (element.body) element.deactivate();
	}
	updateArray() { 
		this.elementArray = [];
		if (this.active) for (let rect in this.elements) {
			let cont = this.elements[rect];
			if (cont instanceof ElementContainer) {
				let ary = cont.updateArray();
				this.elementArray.pushArray(ary);
			} else this.elementArray.push(cont);
		}
		return this.elementArray;
	}
	startUpdate() {
		this.updateArray();
		for (let rect of this.elementArray) rect.isBeingUpdated = true;
		let q = this.removeQueue;
		function p(x) {
			q.push(x);
		}
		for (let rect of this.elementArray) rect.pushToRemoveQueue = p;
	}
	endUpdate() {
		for (let rect of this.removeQueue) rect.home.removeElement(rect);
		this.removeQueue = [];
		for (let rect of this.elementArray) rect.isBeingUpdated = false;
	}
	copy(el) {
		let n;
		if (el instanceof ParticleSpawnerObject) {
			n = this.addParticleSpawner(el.name + " - copy", 0, 0, el.particleSize, el.particleInitSpeed, el.particleDelay, el.particleLifeSpan, el.particleDraw, el.particleSizeVariance, el.particleSpeedVariance, el.dirs);
			n.particleSlows = el.particleSlows;
			n.particleFades = el.particleFades;
			n.particleFalls = el.particleFalls;
			n.active = el.active;
		} else if (el instanceof UIObject) {
			n = this.addUI(el.name + " - copy", 0, 0, el.width, el.height);
		} else if (el instanceof PhysicsObject) {
			n = this.addPhysicsElement(el.name + " - copy", 0, 0, el.body.type === RigidBody.DYNAMIC, { ...el.controls }, el.tag);
			n.rotation = el.rotation;
		} else {
			n = this.addElement(el.name + " - copy", 0, 0, { ...el.controls }, el.tag);
		}
		n.transform = el.transform.get();
		n.lastTransform = el.lastTransform.get();
		let ser = el.serializeShapes();
		n.parseShapes(ser);
		el.runLog(n);
		
		return n;
	}
	hideElement(name) {
		this.performFunctionBasedOnType(name, function (e) {
			this.elements[e].hide();
			this.elements[e].logMod(function HIDE() {
				this.hide();
			});
		}.bind(this));
		return this;
	}
	showElement(name) {
		this.performFunctionBasedOnType(name, function (e) {
			this.elements[e].show();
			this.elements[e].logMod(function SHOW() {
				this.show();
			});
		}.bind(this));
		return this;
	}
	genName(database, name) {
		let num = 0;
		let n = name;
		function check() {
			n = name;
			if (num) n += " (" + num + ")";
			return n;
		}
		while (database[check()] !== undefined) num++;
		return n;
	}
	initializeSceneObject(sceneObject) {
		const d = this.defaults[sceneObject.constructor.name];
		this.changeElementDraw(sceneObject, d.draw);
		for (let script of d.scripts) script.addTo(sceneObject);
	}
	addRectElement(name, x, y, width, height, controls = new Controls(), tag = "") {
		name = this.genName(this.elements, name);
		let n = new SceneObject(name, x, y, controls, tag, this, this.engine);
		n.addShape("default", new Rect(-width / 2, -height / 2, width, height));
		this.initializeSceneObject(n);
		this.elements[name] = n;
		return n;
	}
	addCircleElement(name, x, y, radius, controls = new Controls(), tag = "") {
		name = this.genName(this.elements, name);
		let n = new SceneObject(name, x, y, controls, tag, this, this.engine);
		n.addShape("default", new Circle(0, 0, radius));
		this.initializeSceneObject(n);
		this.elements[name] = n;
		return n;
	}
	addElement(name, x, y, controls = new Controls(), tag = "") {
		name = this.genName(this.elements, name);
		let n = new SceneObject(name, x, y, controls, tag, this, this.engine);
		this.initializeSceneObject(n);
		this.elements[name] = n;
		return n;
	}
	addPhysicsElement(name, x, y, gravity, controls = new Controls(), tag = "") {
		name = this.genName(this.elements, name);
		let n = new PhysicsObject(name, x, y, gravity, controls, tag, this, this.engine);
		this.initializeSceneObject(n);
		this.elements[name] = n;
		return n;
	}
	addPhysicsRectElement(name, x, y, width, height, gravity, controls = new Controls(), tag = "") {
		name = this.genName(this.elements, name);
		let n = new PhysicsObject(name, x, y, gravity, controls, tag, this, this.engine);
		n.addShape("default", new Rect(-width / 2, -height / 2, width, height));
		this.initializeSceneObject(n);
		this.elements[name] = n;
		return n;
	}
	addPhysicsCircleElement(name, x, y, radius, gravity, controls = new Controls(), tag = "") {
		name = this.genName(this.elements, name);
		let n = new PhysicsObject(name, x, y, gravity, controls, tag, this, this.engine);
		n.addShape("default", new Circle(0, 0, radius));
		this.initializeSceneObject(n);
		this.elements[name] = n;
		return n;
	}
	addUIElement(name, x, y, width, height, draw = this.defaults.UIObject.draw) {
		name = this.genName(this.elements, name);
		let n = new UIObject(name, x, y, this, this.engine);
		n.addShape("default", new Rect(-width / 2, -height / 2, width, height));
		this.initializeSceneObject(n);
		this.elements[name] = n;
		n.draw = draw.bind(n);
		return n;
	}
	addContainer(name, active) {
		name = this.genName(this.elements, name);
		let x = new ElementContainer(name, active, this, this.engine);
		this.elements[name] = x;
		return x;
	}
	addParticleExplosion(amountParticles, x, y, size = 1, spd = 1, timer = 50, draw = this.defaults.ParticleObject.draw, sizeVariance = 0, speedVariance = 0, dirs = new CardinalDirections(1, 1, 1, 1), falls = false, slows = true, fades = true) {
		name = this.genName(this.elements, "Default-Explosion-Spawner");
		let ns = new ParticleSpawnerObject(name, x, y, size, spd, 1, timer, draw, sizeVariance, speedVariance, dirs, this, this.engine);
		this.elements[name] = ns;
		for (let i = 0; i < amountParticles; i++) {
			ns.spawnParticle();
		}
		ns.particleFalls = falls;
		ns.particleFades = fades;
		ns.particleSlows = slows;
		ns.active = false;
		ns.update = function () {
			let n = 0;
			for (let key in ns.spawns) n++;
			if (!n) ns.remove();
		}
		return ns;
	}
	addParticleSpawner(name, x, y, size = 1, spd = 1, delay = 1, timer = 50, draw = this.defaults.ParticleObject.draw, sizeVariance = 0, speedVariance = 0, dirs = new CardinalDirections(true, true, true, true), falls = false, slows = true, fades = true, active = true) {
		name = this.genName(this.elements, name);
		let ns = new ParticleSpawnerObject(name, x, y, size, spd, delay, timer, draw, sizeVariance, speedVariance, dirs, this, this.engine);
		this.elements[name] = ns;
		ns.particleFalls = falls;
		ns.particleFades = fades;
		ns.particleSlows = slows;
		ns.active = active;
		return ns;
	}
	removeContainer(name) {
		let container = this.get(name);
		if (container instanceof ElementContainer) {
			container.deactivate();
			delete this.elements[container.name];
		}
	}
	removeElement(name) {
		this.performFunctionBasedOnType(name, function (e) {
			let el = this.elements[e.name];
			if (el) {
				el.end();
				if (el.body) this.engine.scene.physicsEngine.removeBody(el.body.id);
				delete this.elements[e.name];
			} else if (e.home.elements[e.name]) {
				e.home.removeElement(e);
			}
		}.bind(this));
	}
	removeAllElements() {
		for (let x in this.elements) {
			this.removeElement(this.elements[x]);
		}
	}
	get(name) {
		return (name instanceof Object) ? name : this.elements[name];
	}
	getAllElements() {
		this.updateArray();
		return this.elementArray;
	}
	getPhysicsElements() {
		return this.updateArray().filter(e => e instanceof PhysicsObject);
	}
	getUIElements() {
		return this.updateArray().filter(e => e instanceof UIObject);
	}
	getOnScreenElements() {
		return this.updateArray().filter(e => e.onScreen);
	}
	getElementsMatch(fn) {
		let ary = [];
		let oAry = this.updateArray();
		for (let rect of oAry) {
			if (fn(rect)) {
				ary.push(rect);
			}
		}
		return ary;
	}
	getElementsWithTag(tag) {
		let ary = [];
		let oAry = this.updateArray();
		for (let rect of oAry) {
			if (rect.tag === tag) {
				ary.push(rect);
			}
		}
		return ary;
	}
	getElementsWithScript(script) {
		let ary = [];
		let oAry = this.updateArray();
		for (let rect of oAry) {
			if (rect.scripts[script]) {
				ary.push(rect);
			}
		}
		return ary;
	}
	performFunctionBasedOnType(name, func) {
		if (name instanceof ElementContainer) name = name.updateArray();
		if (typeof name === "object") {
			if (Array.isArray(name)) {
				for (let item of name) {
					this.performFunctionBasedOnType(item, func);
				}
			} else {
				func(name);
			}
		} else {
			func(this.get(name));
		}
	}
	changeElementDraw(name, newDraw) {
		this.performFunctionBasedOnType(name, function (e) {
			e.draw = newDraw.bind(e);
			e.logMod(function CHANGE_DRAW() {
				this.home.changeElementDraw(this, newDraw);
			});
		}.bind(this));
		return this;
	}
	changeElementMethod(name, method, newMethod) {
		this.performFunctionBasedOnType(name, function (e) {
			e[method] = newMethod.bind(e);
			e.logMod(function CHANGE_METHOD() {
				this.home.changeElementMethod(this, method, newMethod);
			});
		}.bind(this));
		return this;
	}
	changeElementCollideRule(name, newRule) {
		this.performFunctionBasedOnType(name, function (e) {
			(new ElementScript("auto_generated_collide_rule #" + performance.now(), {
				collide_rule(l, e) {
					return newRule.bind(this)(e);
				}
			})).addTo(e);
			e.logMod(function CHANGE_COLLIDE_RULE() {
				this.home.changeElementCollideRule(this, newRule);
			});
		}.bind(this));
		return this;
	}
	changeElementCollideOptimize(name, newRule) {
		this.performFunctionBasedOnType(name, function (e) {
			e.optimize = newRule.bind(e);
			e.logMod(function CHANGE_COLLIDE_OPTIMIZE() {
				this.home.changeElementCollideOptimize(this, newRule);
			});
		}.bind(this));
		return this;
	}
}