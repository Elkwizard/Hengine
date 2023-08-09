class ElementContainer extends SceneElement {
	constructor(name = "container", container, engine) {
		super(name, container);
		this.elements = new Map();
		this.engine = engine;
		this.sceneObjectArray = [];
		this.removeQueue = [];
		this.defaultScript = class DEFAULT extends ElementScript {
			init(obj) {
				let fill;
				let outline;

				switch (obj.constructor) {
					case SceneObject: 
						fill = Color.BLACK;
						outline = Color.CYAN;
						break;
					case UIObject:
						fill = Color.WHITE;
						outline = Color.BLACK;
						break;
					default:
						fill = Color.BLACK;
						outline = Color.PURPLE;
				}

				this.outline = outline;
				this.fill = fill;
			}
			addScript(obj, script) {
				if (script === PHYSICS) {
					this.outline = Color.RED;
					this.fill = Color.BLACK;
				}
			}
			draw(obj, name, shape) {
				obj.engine.renderer.draw(this.fill).infer(shape);
				obj.engine.renderer.stroke(this.outline, 1).infer(shape);
			}
		};
	}
	updateArray() {
		this.sceneObjectArray = [];
		for (const [name, element] of this.elements) {
			// if (element.removed) continue;
			if (element instanceof ElementContainer) this.sceneObjectArray.pushArray(element.updateArray());
			else this.sceneObjectArray.push(element);
		}
		return this.sceneObjectArray;
	}
	startUpdate() {
		// remove queued
		for (const [name, element] of this.elements)
			if (element.removed) this.removeElement(element);
		
		// recurse
		for (const [name, element] of this.elements)
			if (element instanceof ElementContainer) element.startUpdate();
	
		this.updateArray();
	}
	copy(el) {
		let n;
		if (el instanceof UIObject) {
			n = this.addUI(el.name + " - copy", 0, 0, el.width, el.height);
		} else if (el.scripts.has(PHYSICS)) {
			n = this.addPhysicsElement(el.name + " - copy", 0, 0, el.scripts.PHYSICS.mobile, { ...el.controls }, el.tag);
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
		sceneObject.scripts.add(this.defaultScript);
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
		const n = new SceneObject(name, x, y, controls, tag, this, this.engine);
		this.initializeSceneObject(n);
		this.elements.set(name, n);
		n.scripts.add(PHYSICS, gravity);
		return n;
	}
	addPhysicsRectElement(name, x, y, width, height, gravity, controls = new Controls(), tag = "") {
		name = this.genName(this.elements, name);
		const n = new SceneObject(name, x, y, controls, tag, this, this.engine);
		n.addShape("default", new Rect(-width / 2, -height / 2, width, height));
		this.initializeSceneObject(n);
		this.elements.set(name, n);
		n.scripts.add(PHYSICS, gravity);
		return n;
	}
	addPhysicsCircleElement(name, x, y, radius, gravity, controls = new Controls(), tag = "") {
		name = this.genName(this.elements, name);
		let n = new SceneObject(name, x, y, controls, tag, this, this.engine);
		n.addShape("default", new Circle(0, 0, radius));
		this.initializeSceneObject(n);
		this.elements.set(name, n);
		n.scripts.add(PHYSICS, gravity);
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
	addContainer(name) {
		name = this.genName(this.elements, name);
		let x = new ElementContainer(name, this, this.engine);
		this.elements.set(name, x);
		return x;
	}
	removeElement(element) {
		if (element.container === this) {
			if (element instanceof SceneObject) {
				element.scripts.run("cleanUp");
				element.scripts.run("remove");
			} else {
				const objects = element.updateArray();
				for (let i = 0; i < objects.length; i++)
					element.removeElement(objects[i]);
			}
			this.elements.delete(element.name);
		}
	}
	removeElements(elements) {
		for (let i = 0; i < elements.length; i++) elements[i].remove();
	}
	removeAllElements() {
		this.removeElements(this.getAllElements());
	}
	get(name) {
		return this.elements.get(name);
	}
	getAllElements() {
		return this.updateArray();
	}
	getElementsMatch(fn) {
		return this.updateArray().filter(fn);
	}
	getUIElements() {
		return this.getElementsMatch(element => element instanceof UIObject);
	}
	getOnScreenElements() {
		return this.getElementsMatch(element => element.onScreen);
	}
	getElementsWithTag(tag) {
		return this.getElementsMatch(element => element.tag === tag);
	}
	getElementsWithScript(script) {
		return this.getElementsMatch(element => element.scripts.has(script));
	}
}