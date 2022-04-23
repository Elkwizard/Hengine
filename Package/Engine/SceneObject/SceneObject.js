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
//Actual SceneObject
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
		this.hidden = false;
		this.hovered = false;
		this.layer = 0;
		this.lifeSpan = 0;
		this.log = [];
		this.onScreen = true;
		this.cullGraphics = true;
		this.beingUpdated = false;
		this.scripts = new ScriptContainer(this);
		this.__scripts;
		this.__width = 0;
		this.__height = 0;

		this.active = container.active;
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
	activate() {
		this.scripts.run("activate");
	}
	deactivate() {
		this.scripts.run("deactivate");
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
	getBoundingBox() {
		let shapes = this.getAllModels();
		let boxes = shapes.map(e => e.getBoundingBox());
		return Rect.composeBoundingBoxes(boxes);
	}
	hasShape(name) {
		return this.shapes.has(name);
	}
	addShape(name, shape, convex = false) {
		if (this.shapes.has(name)) this.removeShape(name);
		this.shapes.set(name, shape);
		if (shape instanceof Rect || shape instanceof Circle) convex = true;
		this.convexShapes.set(shape, convex ? [shape] : Geometry.subdividePolygon(shape));
		this.cacheDimensions();
		this.scripts.run("addShape", name, shape);
	}
	removeShape(name) {
		const shape = this.shapes.get(name);
		if (!shape) return null;
		this.shapes.delete(name);
		this.convexShapes.delete(shape);
		this.scripts.run("removeShape", name, shape);
		return shape;
	}
	getAllShapes() {
		let shapes = [];
		for (let [name, shape] of this.shapes) shapes.push(shape);
		return shapes;
	}
	getAllConvexShapes() {
		let shapes = [];
		for (let [shape, convexShapes] of this.convexShapes)
			shapes.pushArray(convexShapes);
		return shapes;
	}
	getAllModels() {
		const models = [];
		for (const [name, shape] of this.shapes)
			models.push(shape.getModel(this.transform));
		return models;
	}
	getAllConvexModels() {
		const models = [];
		for (const [shape, shapes] of this.convexShapes)
			for (let i = 0; i < shapes.length; i++)
				models.push(shapes[i].getModel(this.transform));
		return models;
	}
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
	removeAllShapes() {
		let names = [];
		for (let [name, shape] of this.shapes) names.push(name);
		let shapes = [];
		for (let i = 0; i < names.length; i++)
			shapes.push(this.removeShape(names[i]));
		return shapes;
	}
	getShape(name) {
		return this.shapes.get(name);
	}
	getConvexShapes(name) {
		return this.convexShapes.get(this.shapes.get(name));
	}
	getModel(name) {
		return this.shapes.get(name).getModel(this.transform);
	}
	getConvexModels(name) {
		const models = [];
		const shapes = this.convexShapes.get(this.shapes.get(name));
		for (let i = 0; i < shapes.length; i++)
			models.push(shapes[i].getModel(this.transform));
		return models;
	}
	scale(factor) {
		const pos = Vector2.origin;
		const entries = [];
		for (let entry of this.shapes) entries.push(entry);
		for (let i = 0; i < entries.length; i++)
			this.addShape(entries[i][0], entries[i][1].scaleAbout(pos, factor));
		this.cacheDimensions();
	}
	scaleX(factor) {
		let entries = [];
		for (let entry of this.shapes) entries.push(entry);
		for (let i = 0; i < entries.length; i++)
			this.addShape(entries[i][0], entries[i][1].scaleXAbout(0, factor));
		this.cacheDimensions();
	}
	scaleY(factor) {
		let entries = [];
		for (let entry of this.shapes) entries.push(entry);
		for (let i = 0; i < entries.length; i++)
			this.addShape(entries[i][0], entries[i][1].scaleYAbout(0, factor));
		this.cacheDimensions();
	}
	collidePoint(point) {
		const models = this.getAllConvexModels();
		for (let j = 0; j < models.length; j++)
			if (models[j].containsPoint(point)) return true;
		return false;
	}
	hide() {
		this.hidden = true;
		this.logMod(function () {
			this.hide();
		});
	}
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
		this.onScreen = !this.cullGraphics || (graphicalBoundingBox && screen.intersectSameType(graphicalBoundingBox));
		return this.onScreen;
	}
	engineDraw(screen) {
		this.determineOnScreen(screen);
		if (!this.hidden && this.onScreen) {
			this.runDraw();
			this.onScreen = true;
		} else this.onScreen = false;
		this.scripts.run("escapeDraw");
	}
	hasMoved() {
		return this.transform.diff(this.lastTransform);
	}
	updateCaches() {
		if (this.hasMoved()) this.cacheBoundingBoxes();
	}
}