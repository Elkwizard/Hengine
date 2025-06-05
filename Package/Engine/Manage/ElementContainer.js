/**
 * Represents a non-leaf node in the element tree, and can contain SceneObjects or additional ElementContainers.
 * All methods on this class that add SceneObjects only take effect at the end of the update cycle.
 * @prop Class extends ElementScript defaultScript | The default element script applied to all SceneObjects in the container upon creation
 */
class ElementContainer extends SceneElement {
	constructor(name = "container", container, engine) {
		super(name, container);
		this.elements = new Map();
		this.engine = engine;
		this.sceneObjectArray = [];
		this.defaultScript = class DEFAULT extends ElementScript {
			init(obj) {
				let fill;
				let outline;

				switch (obj.constructor) {
					case WorldObject: 
						fill = Color.GRAY;
						outline = Color.CYAN;
						break;
					case UIObject:
						fill = Color.WHITE;
						outline = Color.BLACK;
						break;
					default:
						fill = Color.GRAY;
						outline = Color.PURPLE;
				}

				this.outline = outline;
				this.fill = fill;
				this.shapeDrawCommands = new Map();

				for (const [name, shape] of obj.shapes)
					this.addShape(name, shape);
			}
			removeShape(obj, name, shape) {
				this.shapeDrawCommands.delete(shape);
			}
			addShape(obj, name, shape) {
				let command;
				if (IS_3D && obj instanceof WorldObject) {
					const polyhedron = shape instanceof Sphere ? Polyhedron.fromSphere(shape, 3) : shape;
					const material = new SimpleMaterial();
					const mesh = Mesh.fromPolyhedron(polyhedron, material);
					command = () => {
						material.albedo = this.fill;
						obj.engine.renderer.mesh(mesh).default();
					};
				} else {
					command = () => {
						obj.engine.renderer.draw(this.fill).infer(shape);
						obj.engine.renderer.stroke(this.outline, 1).infer(shape);
					};
				}
				this.shapeDrawCommands.set(shape, command);
			}
			addScript(obj, script) {
				if (script === PHYSICS) {
					this.outline = Color.RED;
					this.fill = Color.GRAY;
				}
			}
			draw(obj, name, shape) {
				this.shapeDrawCommands.get(shape)();
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
	unpackCreationArgs(args, dim = DIM) {
		if (typeof args[1] === "number") {
			const values = args.splice(1, dim);
			args.splice(1, 0, new Vector[dim](...values));
		}
		args[0] = this.genName(this.elements, args[0]);
		return args;
	}
	initializeSceneObject(sceneObject) {
		sceneObject.scripts.add(this.defaultScript);
	}
	/**
	 * Adds a new WorldObject with a single rectangle shape to the container.
	 * @param String name | The name of the WorldObject. If this is not unique, it will be replaced with a similar but unique name
	 * @param Number x | The x coordinate of the center of the WorldObject
	 * @param Number y | The y coordinate of the center of the WorldObject
	 * @param Number width | The width of the rectangle shape
	 * @param Number height | The height of the rectangle shape
	 * @return WorldObject
	 */
	addRectElement(...args) {
		const [name, pos, width, height] = this.unpackCreationArgs(args);
		let n = new WorldObject(name, pos, this, this.engine);
		n.addShape("default", new Rect(-width / 2, -height / 2, width, height));
		this.initializeSceneObject(n);
		this.elements.set(name, n);
		return n;
	}
	/**
	 * Adds a new WorldObject with a single circle shape to the container.
	 * @param String name | The name of the WorldObject. If this is not unique, it will be replaced with a similar but unique name
	 * @param Number x | The x coordinate of the center of the WorldObject
	 * @param Number y | The y coordinate of the center of the WorldObject
	 * @param Number radius | The radius of the circle shape
	 * @return WorldObject
	 */
	addCircleElement(...args) {
		const [name, pos, radius] = this.unpackCreationArgs(args);
		let n = new WorldObject(name, pos, this, this.engine);
		n.addShape("default", new Circle(Vector2.zero, radius));
		this.initializeSceneObject(n);
		this.elements.set(name, n);
		return n;
	}
	/**
	 * Adds a new WorldObject to the container.
	 * @param String name | The name of the WorldObject. If this is not unique, it will be replaced with a similar but unique name
	 * @param Number x | The x coordinate of the center of the WorldObject
	 * @param Number y | The y coordinate of the center of the WorldObject
	 * @return WorldObject
	 */
	addElement(...args) {
		const [name, pos] = this.unpackCreationArgs(args);
		let n = new WorldObject(name, pos, this, this.engine);
		this.initializeSceneObject(n);
		this.elements.set(name, n);
		return n;
	}
	/**
	 * Adds a new WorldObject to the container. This WorldObject will have the PHYSICS script added.
	 * @param String name | The name of the WorldObject. If this is not unique, it will be replaced with a similar but unique name
	 * @param Number x | The x coordinate of the center of the WorldObject
	 * @param Number y | The y coordinate of the center of the WorldObject
	 * @param Boolean dynamic? | Whether the rigidbody should be physically dynamic. Default is false
	 * @return WorldObject
	 */
	addPhysicsElement(...args) {
		const [name, pos, gravity] = this.unpackCreationArgs(args);
		const n = new WorldObject(name, pos, this, this.engine);
		this.initializeSceneObject(n);
		this.elements.set(name, n);
		n.scripts.add(PHYSICS, gravity);
		return n;
	}
	/**
	 * Adds a new WorldObject with a single rectangle shape to the container. This WorldObject will have the PHYSICS script added.
	 * @param String name | The name of the WorldObject. If this is not unique, it will be replaced with a similar but unique name
	 * @param Number x | The x coordinate of the center of the WorldObject
	 * @param Number y | The y coordinate of the center of the WorldObject
	 * @param Number width | The width of the rectangle shape
	 * @param Number height | The height of the rectangle shape
	 * @param Boolean dynamic? | Whether the rigidbody should be physically dynamic. Default is false
	 * @return WorldObject
	 */
	addPhysicsRectElement(...args) {
		const [name, pos, width, height, gravity] = this.unpackCreationArgs(args);
		const n = new WorldObject(name, pos, this, this.engine);
		n.addShape("default", new Rect(-width / 2, -height / 2, width, height));
		this.initializeSceneObject(n);
		this.elements.set(name, n);
		n.scripts.add(PHYSICS, gravity);
		return n;
	}
	/**
	 * Adds a new WorldObject with a single circle shape to the container. This WorldObject will have the PHYSICS script added.
	 * @param String name | The name of the WorldObject. If this is not unique, it will be replaced with a similar but unique name
	 * @param Number x | The x coordinate of the center of the WorldObject
	 * @param Number y | The y coordinate of the center of the WorldObject
	 * @param Number radius | The radius of the circle shape
	 * @param Boolean dynamic? | Whether the rigidbody should be physically dynamic. Default is false
	 * @return WorldObject
	 */
	addPhysicsCircleElement(...args) {
		const [name, pos, radius, gravity] = this.unpackCreationArgs(args);
		let n = new WorldObject(name, pos, this, this.engine);
		n.addShape("default", new Circle(Vector2.zero, radius));
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
	addUIElement(...args) {
		const [name, pos, width, height] = this.unpackCreationArgs(args, 2);
		let n = new UIObject(name, pos, this, this.engine);
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
	 * Retrieves an element from the container by name, or returns null if no such element exists.
	 * @param String name | The name of the SceneElement to retrieve
	 * @return SceneElement
	 */
	get(name) {
		return this.elements.get(name) ?? null;
	}
	/**
	 * Retrieves an element (or multiple) based on a piece of identifying information.
	 * @signature
	 * @param String name | The name of a scene element. Returns that element or null if no element exists with that name
	 * @signature
	 * @param Class extends ElementScript script | The ElementScript to select for. Returns all elements with an instance of this script
	 * @signature
	 * @param (SceneElement) => Boolean mask | A pure function selecting for certain elements. Returns all elements that return true when passed to this function.
	 * @signature
	 * @return SceneElement/SceneElement[]
	 */
	query(selector) {
		if (typeof selector === "string")
			return this.get(selector);
		
		if (selector.prototype instanceof ElementScript)
			return this.getElementsWithScript(selector);

		return this.getElementsMatch(selector);
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
	 * @param (SceneObject) => Boolean mask | The function used to check which elements should be returned 
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
	/**
	 * Returns all of the leaf nodes within the container that have a specific ElementScript.
	 * @param Class extends ElementScript script | The class of the ElementScript to check for
	 * @return SceneObject[]
	 */
	getElementsWithScript(script) {
		return this.getElementsMatch(element => element.scripts.has(script));
	}
}