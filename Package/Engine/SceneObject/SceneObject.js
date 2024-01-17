class Controls {
	constructor(up, down, left, right, interact1, interact2) {
		this.up = up;
		this.down = down;
		this.left = left;
		this.right = right;
		this.interact1 = interact1;
		this.interact2 = interact2;
	}
	toString2() {
		return this.up + ", " + this.down + ", " + this.left + ", " + this.right + ", " + this.interact1 + ", " + this.interact2
	}
	toString() {
		let res = [];
		function j(cont) {
			if (this[cont]) {
				if (typeof this[cont] === "string") {
					res.push('"' + this[cont] + '"');
				} else {
					res.push(this[cont]);
				}
			}
		}
		j = j.bind(this);
		j("up");
		j("down");
		j("left");
		j("right");
		j("interact1");
		j("interact2");
		return res.join(", ");
	}
}

/**
 * Represents an object in a Scene.
 * These can be created by the `.add...Element()` methods of ElementContainer.
 * Every scene object has a collection of local-space shapes that make up its presence.
 * These shapes are used for culling, rendering, and physics hitboxes.
 * @prop Transform transform | The location and orientation of the object in space
 * @prop Transform lastTransform | The location of orientation of the object last frame
 * @prop Rect/null graphicalBoundingBox | The world-space bounding box to use for graphical culling instead of the shapes of the object
 * @prop Boolean mouseEvents | Whether or not mouse events (hover and click) should be checked for this object. This can be ignored if the scene has disabled mouse events
 * @prop Boolean cullGraphics | Whether or not the graphics should ever be culled. This can be ignored if the scene has disabled graphics culling
 * @prop Boolean hidden | Whether or not the object should be rendered
 * @prop Boolean hovered | Whether or not the mouse cursor is hovering over the shapes of this object. This property is readonly, and won't be accurate if mouse events are disabled
 * @prop Boolean onScreen | Whether or not the object passed the most recent render culling check
 * @prop ScriptContainer scripts | All of the ElementScripts on the object
 * @prop Shape/null defaultShape | This is a reference to the shape with the name `"default"`
 * @prop Number layer | The sorting layer for the object. Objects with higher sorting layers will be rendered after those with lower sorting layers
 * @prop Number lifeSpan | The amount of frames that the object has existed for
 */
class SceneObject extends SceneElement {
	constructor(name, x, y, controls, tag, container, engine) {
		super(name, container);
		this.transform = new Transform(x, y, 0);
		this.lastTransform = this.transform.get();
		this.shapes = new Map();
		this.convexShapes = new Map();
		this.graphicalBoundingBox = null;
		this.engine = engine;
		this.tag = tag;
		this.controls = controls;
		this.mouseEvents = true;
		this.hidden = false;
		this.hovered = false;
		this.layer = 0;
		this.lifeSpan = 0;
		this.synced = [];
		this.log = [];
		this.onScreen = true;
		this.cullGraphics = true;
		this.scripts = new ScriptContainer(this);
		this.__width = 0;
		this.__height = 0;
	}
	set defaultShape(a) {
		this.addShape("default", a);
	}
	get defaultShape() {
		return this.getShape("default");
	}
	set width(a) {
		let factor = a / this.width;
		this.scaleX(factor);
	}
	get width() {
		return this.__width;
	}
	set height(a) {
		let factor = a / this.height;
		this.scaleY(factor);
	}
	get height() {
		return this.__height;
	}
	remove() {
		super.remove();
	}
	runSynced() {
		this.scripts.sync();
		for (let i = 0; i < this.synced.length; i++)
			this.synced[i](this);
		this.synced = [];
	}
	/**
	 * Schedules a function to be called immediately after additions and removals from the scene take effect.
	 * It will be passed the object when called.
	 * @param SceneObject => void fn | The function to be called
	 */
	sync(fn) {
		this.synced.push(fn);
	}
	updatePreviousData() {
		this.transform.get(this.lastTransform);
	}
	serializeShapes() {
		let shapes = this.getAllShapes();
		let result = [];
		for (let shape of shapes) {
			let term = "";
			if (shape instanceof Circle) {
				term = "C " + shape.x.toFixed(0) + " " + shape.y.toFixed(0) + " " + shape.radius.toFixed(0);
			} else if (shape instanceof Rect) {
				term = "R " + shape.x.toFixed(0) + " " + shape.y.toFixed(0) + " " + shape.width.toFixed(0) + " " + shape.height.toFixed(0);
			} else if (shape instanceof Polygon) {
				term = "P " + shape.vertices.map(e => e.x.toFixed(0) + "|" + e.y.toFixed(0)).join(" ");
			}
			result.push(term);
		}
		return result.join(", ");
	}
	parseShapes(str) {
		let shapes = str.split(", ");
		let result = [];
		for (let shape of shapes) {
			let args = shape.split(" ").slice(1).map(e => parseFloat(e));
			switch (shape[0]) {
				case "C":
					result.push(new Circle(args[0], args[1], args[2]));
					break;
				case "R":
					result.push(new Rect(args[0], args[1], args[2], args[3]));
					break;
				case "P":
					result.push(new Polygon(shape.split(" ").slice(1).map(e => new Vector2(parseFloat(e.split("|")[0]), parseFloat(e.split("|")[1])))))
					break;
			}
		}
		let num = 0;
		for (let shape of result) this.addShape(`Shape #${num++}`, shape);
		return result;
	}
	cacheDimensions() {
		let shapes = this.getAllShapes();
		let boxes = shapes.map(e => e.getBoundingBox());
		let bounds = Rect.composeBoundingBoxes(boxes);
		this.__width = bounds.width;
		this.__height = bounds.height;
		this.cacheBoundingBoxes();
	}
	cacheBoundingBoxes() {
		this.__boundingBox = this.getBoundingBox();
	}
	/**
	 * Returns the world-space bounding rectangle that contains the all the shapes of the object
	 * @return Rect
	 */
	getBoundingBox() {
		let shapes = this.getAllModels();
		let boxes = shapes.map(e => e.getBoundingBox());
		return Rect.composeBoundingBoxes(boxes);
	}
	/**
	 * Checks whether there is a shape on the object with a specific name
	 * @param String name | The name of the shape
	 * @return Boolean
	 */
	hasShape(name) {
		return this.shapes.has(name);
	}
	/**
	 * Adds a new shape with a specified name.
	 * If a shape with that name already exists, it will be removed.
	 * @param String name | The name corresponding to the new shape
	 * @param Shape shape | The shape to add
	 * @param Boolean convex? | Whether the shape is known to be convex. Default is false
	 */
	addShape(name, shape, convex = false) {
		if (this.shapes.has(name)) this.removeShape(name);
		this.shapes.set(name, shape);
		if (shape instanceof Rect || shape instanceof Circle) convex = true;
		this.convexShapes.set(shape, convex ? [shape] : Geometry.subdividePolygon(shape));
		this.cacheDimensions();
		this.scripts.run("addShape", name, shape);
	}
	/**
	 * Removes a shape from the object with a specified name.
	 * If no shape exists with the given name, null is returned.
	 * Otherwise, the shape that is removed is returned in local-space.
	 * @param String name | The name of the shape to remove
	 * @return Shape/null
	 */
	removeShape(name) {
		const shape = this.shapes.get(name);
		if (!shape) return null;
		this.shapes.delete(name);
		this.convexShapes.delete(shape);
		this.scripts.run("removeShape", name, shape);
		return shape;
	}
	/**
	 * Returns all the shapes on the object, in local-space.
	 * @return Shape[]
	 */
	getAllShapes() {
		let shapes = [];
		for (let [name, shape] of this.shapes) shapes.push(shape);
		return shapes;
	}
	/**
	 * Returns a collection of convex shapes that take up the same region as the shapes of the object, in local-space.
	 * @return Shape[]
	 */
	getAllConvexShapes() {
		let shapes = [];
		for (let [shape, convexShapes] of this.convexShapes)
			shapes.pushArray(convexShapes);
		return shapes;
	}
	/**
	 * Returns all the shapes on the object, in world-space.
	 * @return Shape[]
	 */
	getAllModels() {
		const models = [];
		for (const [name, shape] of this.shapes)
			models.push(shape.getModel(this.transform));
		return models;
	}
	/**
	 * Returns a collection of convex shapes that take up the same region as the shapes of the object, in world-space.
	 * @return Shape[]
	 */
	getAllConvexModels() {
		const models = [];
		for (const [shape, shapes] of this.convexShapes)
			for (let i = 0; i < shapes.length; i++)
				models.push(shapes[i].getModel(this.transform));
		return models;
	}
	/**
	 * Adjusts the location of all of the object's shapes such that the geometric center of all the shapes is (0, 0) in local-space.
	 */
	centerShapes() {
		let center = Vector2.origin;
		let totalArea = 0;
		let names = [];
		let shapes = [];
		for (let [name, shape] of this.shapes) {
			let area = shape.area;
			totalArea += area;
			center.Vadd(shape.middle.Ntimes(area));
			names.push(name);
			shapes.push(shape);
		}
		center.Ndiv(totalArea);
		const diff = center.inverse;
		for (let i = 0; i < names.length; i++)
			this.addShape(names[i], shapes[i].move(diff));
	}
	/**
	 * Removes all the shapes from the object, and returns them in local-space.
	 * @return Shape[]
	 */
	removeAllShapes() {
		let names = [];
		for (let [name, shape] of this.shapes) names.push(name);
		let shapes = [];
		for (let i = 0; i < names.length; i++)
			shapes.push(this.removeShape(names[i]));
		return shapes;
	}
	/**
	 * Retrieves a specific shape in local-space based on its name.
	 * @param String name | The name of the shape
	 * @return Shape
	 */
	getShape(name) {
		return this.shapes.get(name);
	}
	/**
	 * Returns a list of convex shapes in local-space that take up the same region as a specific shape.
	 * @param String name | The name of the shape
	 * @return Shape[]
	 */
	getConvexShapes(name) {
		return this.convexShapes.get(this.shapes.get(name));
	}
	/**
	 * Retrieves a specific shape in world-space based on its name.
	 * @param String name | The name of the shape
	 * @return Shape
	 */
	getModel(name) {
		return this.shapes.get(name).getModel(this.transform);
	}
	/**
	 * Returns a list of convex shapes in world-space that take up the same region as a specific shape.
	 * @param String name | The name of the shape
	 * @return Shape[]
	 */
	getConvexModels(name) {
		const models = [];
		const shapes = this.convexShapes.get(this.shapes.get(name));
		for (let i = 0; i < shapes.length; i++)
			models.push(shapes[i].getModel(this.transform));
		return models;
	}
	/**
	 * Uniformly scales the shapes of the object about its center.
	 * @param Number factor | The scale factor
	 */
	scale(factor) {
		const pos = Vector2.origin;
		const entries = [];
		for (let entry of this.shapes) entries.push(entry);
		for (let i = 0; i < entries.length; i++)
			this.addShape(entries[i][0], entries[i][1].scaleAbout(pos, factor));
		this.cacheDimensions();
	}
	/**
	 * Horizontally scales the shapes of the object about its center.
	 * @param Number factor | The scale factor
	 */
	scaleX(factor) {
		let entries = [];
		for (let entry of this.shapes) entries.push(entry);
		for (let i = 0; i < entries.length; i++)
			this.addShape(entries[i][0], entries[i][1].scaleXAbout(0, factor));
		this.cacheDimensions();
	}
	/**
	 * Vertically scales the shapes of the object about its center.
	 * @param Number factor | The scale factor
	 */
	scaleY(factor) {
		let entries = [];
		for (let entry of this.shapes) entries.push(entry);
		for (let i = 0; i < entries.length; i++)
			this.addShape(entries[i][0], entries[i][1].scaleYAbout(0, factor));
		this.cacheDimensions();
	}
	/**
	 * Returns whether a specific world-space point is inside the shapes of the object.
	 * @param Vector2 point | The point to check
	 * @return Boolean
	 */
	collidePoint(point) {
		const models = this.getAllConvexModels();
		for (let j = 0; j < models.length; j++)
			if (models[j].containsPoint(point)) return true;
		return false;
	}
	/**
	 * Hides the object.
	 */
	hide() {
		this.hidden = true;
		this.logMod(function () {
			this.hide();
		});
	}
	/**
	 * Shows the object. Un-does `.hide()`.
	 */
	show() {
		this.hidden = false;
		this.logMod(function () {
			this.show();
		});
	}
	logMod(func) {
		this.log.push(func);
	}
	mod(func) {
		func.bind(this)();
		this.logMod(func);
	}
	runLog(el) {
		for (let x of this.log) x.bind(el)();
		return el;
	}
	runDraw() {
		if (this.scripts.implements("draw")) this.transform.drawInLocalSpace(() => {
			const entries = Array.from(this.shapes.entries());
			for (const [name, shape] of entries) this.scripts.run("draw", name, shape);
		}, this.engine.renderer);
	}
	determineOnScreen(screen) {
		const graphicalBoundingBox = this.graphicalBoundingBox ?? this.__boundingBox;
		return this.onScreen = !this.cullGraphics || (graphicalBoundingBox && screen.intersectSameType(graphicalBoundingBox));
	}
	engineDraw(screen) {
		if (!this.hidden && this.determineOnScreen(screen))
			this.runDraw();
		this.scripts.run("escapeDraw");
	}
	hasMoved() {
		return this.transform.diff(this.lastTransform);
	}
	updateCaches() {
		if (this.hasMoved()) this.cacheBoundingBoxes();
	}
}