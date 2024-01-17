/**
 * Represents a non-leaf node in the element tree, and can contain SceneObjects or additional ElementContainers.
 * All methods on this class that add SceneObjects only take effect at the end of the update cycle.
 * @prop Class defaultScript | The default element script applied to all SceneObjects in the container upon creation
 */
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
			if (element instanceof ElementContainer) this.sceneObjectArray.pushArray(element.updateArray());
			else this.sceneObjectArray.push(element);
		}
		return this.sceneObjectArray;
	}
	startUpdate() {
		// remove queued
		for (const [name, element] of this.elements) {
			if (element.removed) this.removeElement(element);
			if (element instanceof SceneObject)
				element.scripts.removeQueued();
		}
		
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
		const check = () => {
			n = name;
			if (num) n += " (" + num + ")";
			return n;
		};
		while (database.has(check())) num++;
		return n;
	}
	initializeSceneObject(sceneObject) {
		sceneObject.scripts.add(this.defaultScript);
	}
	/**
	 * Adds a new SceneObject with a single rectangle shape to the container.
	 * @param String name | The name of the SceneObject. If this is not unique, it will be replaced with a similar but unique name
	 * @param Number x | The x coordinate of the center of the SceneObject
	 * @param Number y | The y coordinate of the center of the SceneObject
	 * @param Number width | The width of the rectangle shape
	 * @param Number height | The height of the rectangle shape
	 * @return SceneObject
	 */
	addRectElement(name, x, y, width, height, controls = new Controls(), tag = "") {
		name = this.genName(this.elements, name);
		let n = new SceneObject(name, x, y, controls, tag, this, this.engine);
		n.addShape("default", new Rect(-width / 2, -height / 2, width, height));
		this.initializeSceneObject(n);
		this.elements.set(name, n);
		return n;
	}
	/**
	 * Adds a new SceneObject with a single circle shape to the container.
	 * @param String name | The name of the SceneObject. If this is not unique, it will be replaced with a similar but unique name
	 * @param Number x | The x coordinate of the center of the SceneObject
	 * @param Number y | The y coordinate of the center of the SceneObject
	 * @param Number radius | The radius of the circle shape
	 * @return SceneObject
	 */
	addCircleElement(name, x, y, radius, controls = new Controls(), tag = "") {
		name = this.genName(this.elements, name);
		let n = new SceneObject(name, x, y, controls, tag, this, this.engine);
		n.addShape("default", new Circle(0, 0, radius));
		this.initializeSceneObject(n);
		this.elements.set(name, n);
		return n;
	}
	/**
	 * Adds a new SceneObject to the container.
	 * @param String name | The name of the SceneObject. If this is not unique, it will be replaced with a similar but unique name
	 * @param Number x | The x coordinate of the center of the SceneObject
	 * @param Number y | The y coordinate of the center of the SceneObject
	 * @return SceneObject
	 */
	addElement(name, x, y, controls = new Controls(), tag = "") {
		name = this.genName(this.elements, name);
		let n = new SceneObject(name, x, y, controls, tag, this, this.engine);
		this.initializeSceneObject(n);
		this.elements.set(name, n);
		return n;
	}
	/**
	 * Adds a new SceneObject to the container. This SceneObject will have the PHYSICS script added.
	 * @param String name | The name of the SceneObject. If this is not unique, it will be replaced with a similar but unique name
	 * @param Number x | The x coordinate of the center of the SceneObject
	 * @param Number y | The y coordinate of the center of the SceneObject
	 * @param Boolean dynamic? | Whether the rigidbody should be physically dynamic. Default is false
	 * @return SceneObject
	 */
	addPhysicsElement(name, x, y, gravity, controls = new Controls(), tag = "") {
		name = this.genName(this.elements, name);
		const n = new SceneObject(name, x, y, controls, tag, this, this.engine);
		this.initializeSceneObject(n);
		this.elements.set(name, n);
		n.scripts.add(PHYSICS, gravity);
		return n;
	}
	/**
	 * Adds a new SceneObject with a single rectangle shape to the container. This SceneObject will have the PHYSICS script added.
	 * @param String name | The name of the SceneObject. If this is not unique, it will be replaced with a similar but unique name
	 * @param Number x | The x coordinate of the center of the SceneObject
	 * @param Number y | The y coordinate of the center of the SceneObject
	 * @param Number width | The width of the rectangle shape
	 * @param Number height | The height of the rectangle shape
	 * @param Boolean dynamic? | Whether the rigidbody should be physically dynamic. Default is false
	 * @return SceneObject
	 */
	addPhysicsRectElement(name, x, y, width, height, gravity, controls = new Controls(), tag = "") {
		name = this.genName(this.elements, name);
		const n = new SceneObject(name, x, y, controls, tag, this, this.engine);
		n.addShape("default", new Rect(-width / 2, -height / 2, width, height));
		this.initializeSceneObject(n);
		this.elements.set(name, n);
		n.scripts.add(PHYSICS, gravity);
		return n;
	}
	/**
	 * Adds a new SceneObject with a single circle shape to the container. This SceneObject will have the PHYSICS script added.
	 * @param String name | The name of the SceneObject. If this is not unique, it will be replaced with a similar but unique name
	 * @param Number x | The x coordinate of the center of the SceneObject
	 * @param Number y | The y coordinate of the center of the SceneObject
	 * @param Number radius | The radius of the circle shape
	 * @param Boolean dynamic? | Whether the rigidbody should be physically dynamic. Default is false
	 * @return SceneObject
	 */
	addPhysicsCircleElement(name, x, y, radius, gravity, controls = new Controls(), tag = "") {
		name = this.genName(this.elements, name);
		let n = new SceneObject(name, x, y, controls, tag, this, this.engine);
		n.addShape("default", new Circle(0, 0, radius));
		this.initializeSceneObject(n);
		this.elements.set(name, n);
		n.scripts.add(PHYSICS, gravity);
		return n;
	}
	/**
	 * Adds a new UIObject with a single rectangle shape to the container.
	 * @param String name | The name of the UIObject. If this is not unique, it will be replaced with a similar but unique name
	 * @param Number x | The x coordinate of the center of the UIObject
	 * @param Number y | The y coordinate of the center of the UIObject
	 * @param Number width | The width of the rectangle shape
	 * @param Number height | The height of the rectangle shape
	 * @return UIObject
	 */
	addUIElement(name, x, y, width, height) {
		name = this.genName(this.elements, name);
		let n = new UIObject(name, x, y, this, this.engine);
		n.addShape("default", new Rect(-width / 2, -height / 2, width, height));
		this.initializeSceneObject(n);
		this.elements.set(name, n);
		return n;
	}
	/**
	 * Adds a new ElementContainer to the container.
	 * @param String name | The name of the new container. If this is not unique, it will be replaced with a similar but unique name
	 * @return ElementContainer
	 */
	addContainer(name) {
		name = this.genName(this.elements, name);
		let x = new ElementContainer(name, this, this.engine);
		this.elements.set(name, x);
		return x;
	}
	removeElement(element) {
		if (element.container === this) {
			if (element instanceof SceneObject) {
				element.scripts.run("remove");
				element.scripts.removeAllScripts();
			} else {
				const objects = element.updateArray();
				for (let i = 0; i < objects.length; i++)
					element.removeElement(objects[i]);
			}
			this.elements.delete(element.name);
			element.inScene = false;
		}
	}
	/**
	 * Removes a collection of elements from the container
	 * @param SceneElement[] elements | The elements to remove from the container
	 */
	removeElements(elements) {
		for (let i = 0; i < elements.length; i++) elements[i].remove();
	}
	/**
	 * Removes all the elements from the container.
	 */
	removeAllElements() {
		this.removeElements(this.getAllElements());
	}
	/**
	 * Retrieves an element from the container by name.
	 * @param String name | The name of the SceneElement to retrieve
	 * @return SceneElement
	 */
	get(name) {
		return this.elements.get(name);
	}
	/**
	 * Returns all of the leaf nodes within the container.
	 * @return SceneObject[]
	 */
	getAllElements() {
		return this.updateArray();
	}
	/**
	 * Returns a conditional subset of all the leaf nodes within the container. 
	 * @param SceneObject => Boolean mask | The function used to check which elements should be returned 
	 * @return SceneObject[]
	 */
	getElementsMatch(fn) {
		return this.updateArray().filter(fn);
	}
	/**
	 * Returns all of the UIObject leaf nodes within the container.
	 * @return UIObject[]
	 */
	getUIElements() {
		return this.getElementsMatch(element => element instanceof UIObject);
	}
	/**
	 * Returns all of the on-screen leaf nodes within the container.
	 * @return SceneObject[]
	 */
	getOnScreenElements() {
		return this.getElementsMatch(element => element.onScreen);
	}
	getElementsWithTag(tag) {
		return this.getElementsMatch(element => element.tag === tag);
	}
	/**
	 * Returns all of the leaf nodes within the container that have a specific ElementScript.
	 * @param Class script | The class of the ElementScript to check for
	 * @return SceneObject[]
	 */
	getElementsWithScript(script) {
		return this.getElementsMatch(element => element.scripts.has(script));
	}
}