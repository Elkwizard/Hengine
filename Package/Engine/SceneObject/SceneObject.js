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
		this.x = x;
		this.y = y;
		this.shapes = { };
		this.rotation = 0;
		this.__cosRot = 1;
		this.__sinRot = 0;
		this.name = name;
		this.home = home;
		this.tag = tag;
		this.controls = controls;
		this.hidden = false;
		this.update = function () { };
		this.draw = function (shape) { };
		this.custom = {};
		this.hovered = false;
		this.layer = 0;
		this.scripts = new ScriptContainer();
		this.lifeSpan = 0;
		this.log = [];
		this.isDead = false;
		this.onScreen = true;
		this.cullGraphics = true;
		this.response = {
			click: e => e,
			rightClick: e => e,
			hover: e => e
		}
		this.response.input = {
			up: function () { },
			down: function () { },
			left: function () { },
			right: function () { },
			interact1: function () { },
			interact2: function () { }
		};
		this.isBeingUpdated = false;

		this.__width = 0;
		this.__height = 0;
	}
	get defaultShape() {
		return this.getShape("default");
	}
	set defaultShape(a) {
		this.removeShape("default");
		this.addShape("default", a);
	}
	set middle(a) {
		this.x = a.x;
		this.y = a.y;
	}
	get middle() {
		return new Vector2(this.x, this.y);
	}
	set width(a) {
		let factor = a / this.width;
		this.scale(factor);
	}
	get width() {
		return this.__width;
	}
	set height(a) {
		let factor = a / this.height;
		this.scale(factor);
	}
	get height() {
		return this.__height;
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
	cacheRotation() {
		this.__cosRot = Math.cos(this.rotation);
		this.__sinRot = Math.sin(this.rotation);
	}
	cacheDimensions() {
		let old_rot = this.rotation;
		this.rotation = 0;
		let bound = this.getBoundingBox();
		this.__width = bound.width;
		this.__height = bound.height;
		this.rotation = old_rot;
	}
	cacheBoundingBoxes() {
		this.__boundingBox = this.getBoundingBox();
	}
	getModels() {
		let pos = this.middle;
		let cos = this.__cosRot;
		let sin = this.__sinRot;
		let result = [];
		for (let name in this.shapes) result.push(this.shapes[name].getModelCosSin(pos, cos, sin));
		return result;
	}
	getBoundingBox() {
		let shapes = this.getModels();
		let boxes = shapes.map(e => e.getBoundingBox());
		if (boxes.length === 1) return boxes[0];
		let mins = boxes.map(e => new Vector2(e.x, e.y));
		let maxs = boxes.map(e => new Vector2(e.x + e.width, e.y + e.height));
		let minX = Math.min(...mins.map(e => e.x));
		let minY = Math.min(...mins.map(e => e.y));
		let maxX = Math.max(...maxs.map(e => e.x));
		let maxY = Math.max(...maxs.map(e => e.y));
		return new Rect(minX, minY, maxX - minX, maxY - minY);
	}
	addShape(name, shape) {
		shape = shape.get();
		this.shapes[name] = shape;
		this.cacheDimensions();
	}
	worldSpaceToModelSpace(v) {
		return v.Vminus(this.middle).rotate(-this.rotation);
	}
	modelSpaceToWorldSpace(v) {
		return v.rotate(this.rotation).Vplus(this.middle);
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
		let dif = center.inverse();
		let nShapes = new Map();
		for (let name in this.shapes) {
			nShapes.set(name, this.shapes[name].move(dif));
		}
		this.removeAllShapes();
		for (let [name, shape] of nShapes) this.addShape(name, shape);
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
		return this.shapes[name].getModelCosSin(this.middle, this.__cosRot, this.__sinRot);
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
		let nShapes = new Map();
		for (let name in this.shapes) nShapes.set(name, this.shapes[name].scaleAbout(middle, factor));
		this.removeAllShapes();
		for (let [name, shape] of nShapes) this.addShape(name, shape);
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
	position(p) {
		this.x = p.x;
		this.y = p.y;
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
	drawInModelSpace(artist) {
		c.save();
		let middle = this.middle;
		c.translate(middle);
		c.rotate(this.rotation);
		artist();
		c.restore();
	}
	drawInWorldSpace(artist) {
		c.save();
		c.rotate(-this.rotation);
		c.translate(-this.x, -this.y);
		artist();
		c.restore();
	}
	runDraw() {
		let middle = this.middle;
		c.translate(middle);
		c.rotate(this.rotation);
		for (let name in this.shapes) {
			let shape = this.shapes[name];
			this.draw(name, shape);
			this.scripts.run("Draw", name, shape);
		}
		c.rotate(-this.rotation);
		c.translate(-middle.x, -middle.y);
	}
	engineDrawUpdate(screen) {
		this.onScreen = !this.cullGraphics || Geometry.overlapRectRect(this.__boundingBox, screen);
		if (!this.hidden && this.onScreen) {
			this.runDraw();
		}
		// else console.log(1);
		// s.drawInScreenSpace(e => c.stroke(cl.GREEN, 1).rect(this.__boundingBox));
		// s.drawInScreenSpace(e => c.stroke(cl.RED, 1).rect(screen));
		this.scripts.run("EscapeDraw");
	}
	engineFixedUpdate(hitboxes) {
		if (this.controls) {
			this.move();
		}
		this.update();
		this.scripts.run("Update");
	}
	updateCaches() {
		this.cacheBoundingBoxes();
		this.cacheRotation();
	}
	pushToRemoveQueue(x) {
		return null;
	}
	remove() {
		if (this.isBeingUpdated) this.pushToRemoveQueue(this);
		else this.home.removeElement(this);
		this.isDead = true;
	}
	move() {
		if (K.P(this.controls.up)) {
			this.response.input.up();
		}
		if (K.P(this.controls.down)) {
			this.response.input.down();
		}
		if (K.P(this.controls.left)) {
			this.response.input.left();
		}
		if (K.P(this.controls.right)) {
			this.response.input.right();
		}
		if (K.P(this.controls.interact1)) {
			this.response.input.interact1();
		}
		if (K.P(this.controls.interact2)) {
			this.response.input.interact2();
		}
	}
}