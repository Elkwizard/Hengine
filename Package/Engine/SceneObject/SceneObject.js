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
				if (typeof this[cont] == "string") {
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
	constructor(name, x, y, controls, tag, home, engine) {
		super(name, home.active, home);
		this.transform = new Transform(x, y, 0);
		this.lastTransform = this.transform.get();
		this.shapes = new Map();
		this.graphicalBoundingBox = null;
		this.engine = engine;
		this.tag = tag;
		this.controls = controls;
		this.hidden = false;
		this.onScreen = false;
		this.draw = function (name, shape) { };
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
	}
	set defaultShape(a) {
		this.removeShape("default");
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
		super.activate();
		this.scripts.run("Activate");
	}
	deactivate() {
		super.deactivate();
		this.scripts.run("Deactivate");
	}
	updatePreviousData() {
		this.lastTransform = this.transform.get();
	}
	serializeShapes() {
		let shapes = this.getShapes();
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
		let shapes = this.getShapes();
		let boxes = shapes.map(e => e.getBoundingBox());
		let bounds = Rect.composeBoundingBoxes(boxes);
		this.__width = bounds.width;
		this.__height = bounds.height;
		this.cacheBoundingBoxes();
	}
	cacheBoundingBoxes() {
		this.__boundingBox = this.getBoundingBox();
	}
	getModels() {
		let result = [];
		for (let [name, shape] of this.shapes) result.push(shape.getModel(this.transform));
		return result;
	}
	getBoundingBox() {
		let shapes = this.getModels();
		let boxes = shapes.map(e => e.getBoundingBox());
		return Rect.composeBoundingBoxes(boxes);
	}
	onAddScript(script) {

	}
	hasShape(name) {
		return this.shapes.has(name);
	}
	addShape(name, shape) {
		shape = shape.get();
		this.shapes.set(name, shape);
		this.cacheDimensions();
	}
	centerModels() {
		let center = Vector2.origin;
		let shapes = this.getShapes();
		let totalArea = 0;
		for (let shape of shapes) {
			let area = shape.area;
			totalArea += area;
			center.Vadd(shape.middle.Ntimes(area));
		}
		center.Ndiv(totalArea);
		let dif = center.inverse;
		for (let [name, shape] of this.shapes)
			this.shapes.set(name, shape.move(dif));
	}
	removeShape(name) {
		let shape = this.shapes.get(name);
		this.shapes.delete(name);
		return shape || null;
	}
	removeAllShapes() {
		let names = [];
		for (let [name, shape] of this.shapes) names.push(name);
		let shapes = [];
		for (let name of names) {
			shapes.push(this.removeShape(name));
		}
		return shapes;
	}
	getShape(name) {
		return this.shapes.get(name);
	}
	getModel(name) {
		return this.shapes.get(name).getModel(this.transform);
	}
	getShapes() {
		let ary = [];
		for (let [name, shape] of this.shapes) ary.push(shape);
		return ary;
	}
	scale(factor) {
		let middle = Vector2.origin;
		for (let [name, shape] of this.shapes) this.shapes.set(name, shape.scaleAbout(middle, factor));
		this.cacheDimensions();
	}
	scaleX(factor) {
		for (let [name, shape] of this.shapes) this.shapes.set(name, shape.scaleXAbout(0, factor));
		this.cacheDimensions();
	}
	scaleY(factor) {
		for (let [name, shape] of this.shapes) this.shapes.set(name, shape.scaleYAbout(0, factor));
		this.cacheDimensions();
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
		this.transform.drawInModelSpace(() => {
			for (let [name, shape] of this.shapes) {
				this.draw(name, shape);
				this.scripts.run("Draw", name, shape);
			}
		}, this.engine.renderer);
	}
	determineOnScreen(screen) {
		this.onScreen = !this.cullGraphics || Geometry.overlapRectRect(this.graphicalBoundingBox || this.__boundingBox, screen);
		return this.onScreen;
	}
	engineDraw(screen) {
		this.determineOnScreen(screen);
		if (!this.hidden && this.onScreen) {
			this.runDraw();
			this.onScreen = true;
		} else this.onScreen = false;
		this.scripts.run("EscapeDraw");
	}
	engineUpdate() {
		this.scripts.run("Update");
	}
	hasMoved() {
		return this.transform.dif(this.lastTransform);
	}
	updateCaches() {
		if (this.hasMoved()) this.cacheBoundingBoxes();
	}
}