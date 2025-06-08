class Controls {
	constructor(up, down, left, right, interact1, interact2) {
		this.up = up;
		this.down = down;
		this.left = left;
		this.right = right;
		this.interact1 = interact1;
		this.interact2 = interact2;
	}
}

/**
 * @type class SceneObject<Vector = any, Transform = any, Box = any, Shape = any> extends SceneElement 
 * Represents an object in a Scene.
 * These can be created by the `.add...Element()` methods of ElementContainer.
 * Every scene object has a collection of local-space shapes that make up its presence.
 * These shapes are used for culling, rendering, and physics hitboxes.
 * Additionally, each scene object exists in N dimensions.
 * As such, within the documentation of this class, `Vector`, `Transform`, and `Shape` refer to the appropriate constructs for those dimensions.
 * @abstract
 * 
 * @prop Transform transform | The location and orientation of the object in space
 * @prop Transform lastTransform | The location and orientation of the object last frame
 * @prop Boolean mouseEvents | Whether or not mouse events (hover and click) should be checked for this object. This can be ignored if the scene has disabled mouse events
 * @prop Boolean hidden | Whether or not the object should be rendered
 * @prop Boolean hovered | Whether or not the mouse cursor is hovering over the shapes of this object. This property is readonly, and won't be accurate if mouse events are disabled. This property is always false for 3D objects
 * @prop Boolean onScreen | Whether or not the object passed the most recent render culling check
 * @prop ScriptContainer scripts | All of the ElementScripts on the object
 * @prop Shape/null defaultShape | A reference to the shape with the name `"default"`
 * @prop Number layer | The sorting layer for the object. Objects with higher sorting layers will be rendered after those with lower sorting layers
 * @prop Number lifeSpan | The amount of frames that the object has existed for
 * @prop Artist renderer | The renderer onto which the object will be drawn. This property is read-only
 */
class SceneObject extends SceneElement {
	constructor(name, transform, container, engine) {
		super(name, container);
		this.transform = transform;
		this.lastTransform = this.transform.get();
		this.shapes = new Map();
		this.convexShapes = new Map();
		this.engine = engine;
		this.mouseEvents = true;
		this.hidden = false;
		this.hovered = false;
		this.layer = 0;
		this.lifeSpan = 0;
		this.synced = [];
		this.onScreen = true;
		this.scripts = new ScriptContainer(this);
	}
	set defaultShape(a) {
		this.addShape("default", a);
	}
	get defaultShape() {
		return this.getShape("default");
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
	 * @param (SceneObject) => void fn | The function to be called
	 */
	sync(fn) {
		this.synced.push(fn);
	}
	updatePreviousData() {
		this.transform.get(this.lastTransform);
	}
	cacheBoundingBoxes() {
		this.__boundingBox = this.getBoundingBox();
	}
	/**
	 * @type getBoundingBox(): Box;
	 * Returns the World-Space bounding rectangle that contains the all the shapes of the object.
	 * @return Rect/Prism
	 */
	getBoundingBox() {
		const shapes = this.getAllModels();
		const boxes = shapes.map(e => e.getBoundingBox());
		return this.constructor.Box.composeBoundingBoxes(boxes);
	}
	/**
	 * Checks whether there is a shape on the object with a specific name.
	 * @param String name | The name of the shape
	 * @return Boolean
	 */
	hasShape(name) {
		return this.shapes.has(name);
	}
	/**
	 * @type addShape(name: string, shape: Shape, convex?: boolean): void;
	 * Adds a new shape with a specified name.
	 * If a shape with that name already exists, it will be removed.
	 * @param String name | The name corresponding to the new shape
	 * @param Circle/Polygon/Sphere/Polyhedron shape | The shape to add. The 3D shapes are only available for WorldObjects in 3D Mode
	 * @param Boolean convex? | Whether the shape is known to be convex. Default is false
	 */
	addShape(name, shape, convex = false) {
		if (this.shapes.has(name)) this.removeShape(name);
		this.shapes.set(name, shape);
		if (IS_3D) {
			convex ||= shape instanceof Prism || shape instanceof Sphere || shape instanceof Frustum;
		} else {
			convex ||= shape instanceof Rect || shape instanceof Circle;
		}
		this.convexShapes.set(shape, convex ? [shape] : Geometry.subdividePolygon(shape));
		this.cacheBoundingBoxes();
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
	 * Returns all the shapes on the object, in World-Space.
	 * @return Shape[]
	 */
	getAllModels() {
		const models = [];
		for (const [name, shape] of this.shapes)
			models.push(shape.getModel(this.transform.matrix));
		return models;
	}
	/**
	 * Returns a collection of convex shapes that take up the same region as the shapes of the object, in World-Space.
	 * @return Shape[]
	 */
	getAllConvexModels() {
		const models = [];
		for (const [shape, shapes] of this.convexShapes)
			for (let i = 0; i < shapes.length; i++)
				models.push(shapes[i].getModel(this.transform.matrix));
		return models;
	}
	/**
	 * Adjusts the location of all of the object's shapes such that the geometric center of all the shapes is (0, 0) in local-space.
	 * @param Boolean stay? | Whether the global-space position of the shapes be maintained by changing the object's transform. Default is false
	 */
	centerShapes(stay = false) {
		let center = this.constructor.Vector.zero;
		let totalArea = 0;
		let names = [];
		let shapes = [];
		for (let [name, shape] of this.shapes) {
			let area = shape.area;
			totalArea += area;
			center.add(shape.middle.times(area));
			names.push(name);
			shapes.push(shape);
		}
		center.div(totalArea);
		const diff = center.inverse;
		for (let i = 0; i < names.length; i++)
			this.addShape(names[i], shapes[i].move(diff));
		if (stay) this.transform.position.sub(diff.rotate(this.transform.rotation));
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
	 * Retrieves a specific shape in World-Space based on its name.
	 * @param String name | The name of the shape
	 * @return Shape
	 */
	getModel(name) {
		return this.shapes.get(name).getModel(this.transform.matrix);
	}
	/**
	 * Returns a list of convex shapes in World-Space that take up the same region as a specific shape.
	 * @param String name | The name of the shape
	 * @return Shape[]
	 */
	getConvexModels(name) {
		const models = [];
		const shapes = this.convexShapes.get(this.shapes.get(name));
		for (let i = 0; i < shapes.length; i++)
			models.push(shapes[i].getModel(this.transform.matrix));
		return models;
	}
	/**
	 * Uniformly scales the shapes of the object about its center.
	 * @param Number factor | The scale factor
	 */
	scale(factor) {
		const pos = this.constructor.Vector.zero;
		const entries = [];
		for (let entry of this.shapes) entries.push(entry);
		for (let i = 0; i < entries.length; i++)
			this.addShape(entries[i][0], entries[i][1].scale(factor, pos));
		this.cacheBoundingBoxes();
	}
	/**
	 * Returns whether a specific World-Space point is inside the shapes of the object.
	 * @param Vector point | The point to check
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
	}
	/**
	 * Shows the object. Un-does `.hide()`.
	 */
	show() {
		this.hidden = false;
	}
	runDraw() {
		if (this.scripts.implements("draw")) this.transform.drawInLocalSpace(() => {
			const entries = Array.from(this.shapes.entries());
			for (const [name, shape] of entries) this.scripts.run("draw", name, shape);
		}, this.renderer);
	}
	hasMoved() {
		return this.transform.diff(this.lastTransform);
	}
	updateCaches() {
		if (this.hasMoved()) this.cacheBoundingBoxes();
	}
}