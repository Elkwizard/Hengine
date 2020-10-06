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
class SceneObject {
	constructor(name, x, y, controls, tag, home) {
		this.transform = new Transform(x, y, 0);
		this.lastTransform = this.transform.get();
		this.shapes = {};
		this.graphicalBoundingBox = null;
		this.name = name;
		this.home = home;
		this.tag = tag;
		this.controls = controls;
		this.hidden = false;
		this.onScreen = false;
		this.update = function () { };
		this.draw = function (shape) { };
		this.custom = {};
		this.hovered = false;
		this.layer = 0;
		this.lifeSpan = 0;
		this.log = [];
		this.removed = false;
		this.onScreen = true;
		this.cullGraphics = true;
		this.isBeingUpdated = false;
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
			}
			if (shape instanceof Rect) {
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
		for (let name in this.shapes) result.push(this.shapes[name].getModel(this.transform));
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
		return name in this.shapes;
	}
	addShape(name, shape) {
		shape = shape.get();
		this.shapes[name] = shape;
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
		for (let name in this.shapes)
			this.shapes[name] = this.shapes[name].move(dif);
	}
	removeShape(name) {
		let shape = this.shapes[name];
		delete this.shapes[name];
		return shape;
	}
	removeAllShapes() {
		let names = [];
		for (let name in this.shapes) names.push(name);
		let shapes = [];
		for (let name of names) {
			shapes.push(this.removeShape(name));
		}
		return shapes;
	}
	getShape(name) {
		return this.shapes[name];
	}
	getModel(name) {
		return this.shapes[name].getModel(this.transform);
	}
	reorderShapes(order) {
		let shapes = this.getShapes();
		let nShapes = new Array(shapes.length);
		this.shapes = {};
		for (let i = 0; i < order.length; i++) {
			nShapes[i] = shapes[order[i]];
		}
		for (let i = 0; i < nShapes.length; i++) this.shapes[i + 1] = nShapes[i];
	}
	getShapes() {
		let ary = [];
		for (let name in this.shapes) ary.push(this.shapes[name]);
		return ary;
	}
	scale(factor) {
		let middle = Vector2.origin;
		for (let name in this.shapes) this.shapes[name] = this.shapes[name].scaleAbout(middle, factor);
		this.cacheDimensions();
	}
	scaleX(factor) {
		for (let name in this.shapes) this.shapes[name] = this.shapes[name].scaleXAbout(0, factor);
		this.cacheDimensions();
	}
	scaleY(factor) {
		for (let name in this.shapes) this.shapes[name] = this.shapes[name].scaleYAbout(0, factor);
		this.cacheDimensions();
	}
	rename(name) {
		delete this.home.elements[this.name];
		this.home.elements[name] = this;
		this.name = name;
		this.logMod(function () {
			this.rename(name);
		});
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
			for (let name in this.shapes) {
				let shape = this.shapes[name];
				this.draw(name, shape);
				this.scripts.run("Draw", name, shape);
			}
		});
	}
	determineOnScreen(screen) {
		this.onScreen = !this.cullGraphics || Geometry.overlapRectRect(this.graphicalBoundingBox || this.__boundingBox, screen);
		return this.onScreen;
	}
	engineDrawUpdate(screen) {
		this.determineOnScreen(screen);
		if (!this.hidden && this.onScreen) {
			this.runDraw();
			this.onScreen = true;
		} else this.onScreen = false;
		// else console.log(1);
		// renderer.stroke(cl.BLACK, 2).rect(this.__boundingBox);
		// s.camera.drawInScreenSpace(e => c.stroke(cl.GREEN, 1).rect(this.__boundingBox));
		// s.drawInScreenSpace(e => c.stroke(cl.RED, 1).rect(screen));
		this.scripts.run("EscapeDraw");
	}
	engineFixedUpdate(hitboxes) {
		this.update();
		this.scripts.run("Update");
	}
	updateCaches() {
		if (this.transform.dif(this.lastTransform)) this.cacheBoundingBoxes();
	}
	pushToRemoveQueue(x) {
		return null;
	}
	end() {
		this.removed = true;
	}
	remove() {
		if (this.isBeingUpdated) this.pushToRemoveQueue(this);
		else this.home.removeElement(this);
		this.end();
	}
}