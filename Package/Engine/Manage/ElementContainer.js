class ElementContainer extends SceneElement {
	constructor(name = "container", active, container, engine) {
		super(name, active, container);
		this.elements = new Map();
		this.engine = engine;
		this.sceneObjectArray = [];
		this.removeQueue = [];
		this.defaultScript = new ElementScript("DEFAULT", {
			init(l) {
				let fill;
				let outline;

				switch (this.constructor) {
					case SceneObject: 
						fill = Color.BLACK;
						outline = Color.CYAN;
						break;
					case PhysicsObject:
						fill = Color.BLACK;
						outline = Color.RED;
						break;
					case UIObject:
						fill = Color.WHITE;
						outline = Color.BLACK;
						break;
					case ParticleSpawnerObject:
						fill = Color.BLANK;
						outline = Color.BLANK;
						break;
					default:
						fill = Color.BLACK;
						outline = Color.PURPLE;
				}

				l.outline = outline;
				l.fill = fill;
			},
			draw(l, name, shape) {
				this.engine.renderer.draw(l.fill).infer(shape);
				this.engine.renderer.stroke(l.outline, 1).infer(shape);
			}
		});
	}
	activate() {
		super.activate();
		this.updateArray();
		for (let [name, element] of this.elements) if (!element.active) element.activate();
	}
	deactivate() {
		super.deactivate();
		this.updateArray();
		for (let [name, element] of this.elements) if (element.active) element.deactivate();
	}
	updateArray() {
		this.sceneObjectArray = [];
		for (let [name, element] of this.elements) {
			if (!element.active || element.removed) continue;
			if (element instanceof ElementContainer) this.sceneObjectArray.pushArray(element.updateArray());
			else this.sceneObjectArray.push(element);
		}
		return this.sceneObjectArray;
	}
	startUpdate() {
		this.updateArray();
		//remove queued
		for (let [name, element] of this.elements) {
			if (element.removed) this.removeElement(element);
			else element.beingUpdated = true;
		}
		//recurse
		for (let [name, element] of this.elements) if (element instanceof ElementContainer) element.startUpdate();
	}
	endUpdate() {
		//remove queued
		for (let [name, element] of this.elements) {
			if (element.removed) this.removeElement(element);
			else element.beingUpdated = false;
		}
		//recurse
		for (let [name, element] of this.elements) if (element instanceof ElementContainer) element.endUpdate();
	}
	copy(el) {
		let n;
		if (el instanceof ParticleSpawnerObject) {
			n = this.addParticleSpawner(el.name + " - copy", 0, 0, el.particleSize, el.particleInitSpeed, el.particleDelay, el.particleLifeSpan, el.particleDraw, el.particleSizeVariance, el.particleSpeedVariance, el.dirs);
			n.particleSlows = el.particleSlows;
			n.particleFades = el.particleFades;
			n.particleFalls = el.particleFalls;
			n.particleActive = el.particleActive;
		} else if (el instanceof UIObject) {
			n = this.addUI(el.name + " - copy", 0, 0, el.width, el.height);
		} else if (el instanceof PhysicsObject) {
			n = this.addPhysicsElement(el.name + " - copy", 0, 0, el.body.type === RigidBody.DYNAMIC, { ...el.controls }, el.tag);
			n.rotation = el.rotation;
		} else {
			n = this.addElement(el.name + " - copy", 0, 0, { ...el.controls }, el.tag);
		}
		n.transform = el.transform.get();
		n.lastTransform = el.lastTransform.get(n.lastTransform);
		let ser = el.serializeShapes();
		n.parseShapes(ser);
		el.runLog(n);

		return n;
	}
	genName(database, name) {
		let num = 0;
		let n = name;
		function check() {
			n = name;
			if (num) n += " (" + num + ")";
			return n;
		}
		while (database.has(check())) num++;
		return n;
	}
	initializeSceneObject(sceneObject) {
		if (this.active) sceneObject.activate();
		this.defaultScript.addTo(sceneObject);
	}
	addRectElement(name, x, y, width, height, controls = new Controls(), tag = "") {
		name = this.genName(this.elements, name);
		let n = new SceneObject(name, x, y, controls, tag, this, this.engine);
		n.addShape("default", new Rect(-width / 2, -height / 2, width, height));
		this.initializeSceneObject(n);
		this.elements.set(name, n);
		return n;
	}
	addCircleElement(name, x, y, radius, controls = new Controls(), tag = "") {
		name = this.genName(this.elements, name);
		let n = new SceneObject(name, x, y, controls, tag, this, this.engine);
		n.addShape("default", new Circle(0, 0, radius));
		this.initializeSceneObject(n);
		this.elements.set(name, n);
		return n;
	}
	addElement(name, x, y, controls = new Controls(), tag = "") {
		name = this.genName(this.elements, name);
		let n = new SceneObject(name, x, y, controls, tag, this, this.engine);
		this.initializeSceneObject(n);
		this.elements.set(name, n);
		return n;
	}
	addPhysicsElement(name, x, y, gravity, controls = new Controls(), tag = "") {
		name = this.genName(this.elements, name);
		let n = new PhysicsObject(name, x, y, gravity, controls, tag, this, this.engine);
		this.initializeSceneObject(n);
		this.elements.set(name, n);
		return n;
	}
	addPhysicsRectElement(name, x, y, width, height, gravity, controls = new Controls(), tag = "") {
		name = this.genName(this.elements, name);
		let n = new PhysicsObject(name, x, y, gravity, controls, tag, this, this.engine);
		n.addShape("default", new Rect(-width / 2, -height / 2, width, height));
		this.initializeSceneObject(n);
		this.elements.set(name, n);
		return n;
	}
	addPhysicsCircleElement(name, x, y, radius, gravity, controls = new Controls(), tag = "") {
		name = this.genName(this.elements, name);
		let n = new PhysicsObject(name, x, y, gravity, controls, tag, this, this.engine);
		n.addShape("default", new Circle(0, 0, radius));
		this.initializeSceneObject(n);
		this.elements.set(name, n);
		return n;
	}
	addUIElement(name, x, y, width, height) {
		name = this.genName(this.elements, name);
		let n = new UIObject(name, x, y, this, this.engine);
		n.addShape("default", new Rect(-width / 2, -height / 2, width, height));
		this.initializeSceneObject(n);
		this.elements.set(name, n);
		return n;
	}
	addContainer(name, active = true) {
		name = this.genName(this.elements, name);
		let x = new ElementContainer(name, active, this, this.engine);
		this.elements.set(name, x);
		return x;
	}
	addParticleExplosion(amountParticles, x, y, size = 1, spd = 1, timer = 50, draw = this.defaults.ParticleObject.draw, sizeVariance = 0, speedVariance = 0, dirs = new CardinalDirections(1, 1, 1, 1), falls = false, slows = true, fades = true) {
		name = this.genName(this.elements, "Default-Explosion-Spawner");
		let ns = new ParticleSpawnerObject(name, x, y, size, spd, 1, timer, draw, sizeVariance, speedVariance, dirs, this, this.engine);
		this.elements.set(name, ns);
		for (let i = 0; i < amountParticles; i++) {
			ns.spawnParticle();
		}
		ns.particleFalls = falls;
		ns.particleFades = fades;
		ns.particleSlows = slows;
		ns.particleActive = false;
		let curUpdate = ns.engineUpdate.bind(ns);
		ns.engineUpdate = function () {
			curUpdate();
			let n = 0;
			for (let entry of ns.spawns) n++;
			if (!n) ns.remove();
		}
		this.initializeSceneObject(ns);
		return ns;
	}
	addParticleSpawner(name, x, y, size = 1, spd = 1, delay = 1, timer = 50, draw = this.defaults.ParticleObject.draw, sizeVariance = 0, speedVariance = 0, dirs = new CardinalDirections(true, true, true, true), falls = false, slows = true, fades = true, active = true) {
		name = this.genName(this.elements, name);
		let ns = new ParticleSpawnerObject(name, x, y, size, spd, delay, timer, draw, sizeVariance, speedVariance, dirs, this, this.engine);
		this.elements.set(name, ns);
		ns.particleFalls = falls;
		ns.particleFades = fades;
		ns.particleSlows = slows;
		ns.particleActive = active;
		this.initializeSceneObject(ns);
		return ns;
	}
	removeElement(element) {
		if (element.container === this) {
			element.scripts.run("Remove");
			if (element.active) element.deactivate();
			element.removed = true;
			this.elements.delete(element.name);
		}
	}
	removeElements(elements) {
		for (let i = 0; i < elements.length; i++) this.removeElement(elements[i]);
	}
	removeAllElements() {
		for (let [name, element] of this.elements) this.removeElement(element);
	}
	get(name) {
		return this.elements.get(name);
	}
	getAllElements() {
		let array = [];
		for (let [name, element] of this.elements) {
			if (element.removed) continue;
			if (element instanceof ElementContainer) array.pushArray(element.getAllElements());
			else array.push(element);
		}
		return array;
	}
	getActiveElements() {
		return this.updateArray();
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
			if (rect.scripts[script.name]) {
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
}