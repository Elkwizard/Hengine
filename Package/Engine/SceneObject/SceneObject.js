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
		this.cacheBoundingBoxes();
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
				term = "R " + shape.rotation.toFixed(0) + " " + shape.x.toFixed(0) + " " + shape.y.toFixed(0) + " " + shape.width.toFixed(0) + " " + shape.height.toFixed(0);
			} else if (shape instanceof Polygon) {
				term = "P " + shape.rotation.toFixed(0) + " " + shape.vertices.map(e => e.x.toFixed(0) + "|" + e.y.toFixed(0)).join(" ");
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
					result.push(new Rect(args[1], args[2], args[3], args[4], args[0]));
					break;
				case "P":
					result.push(new Polygon(shape.split(" ").slice(2).map(e => new Vector2(parseFloat(e.split("|")[0]), parseFloat(e.split("|")[1]))), args[0]))
					break;
			}
		}
		let num = 0;
		for (let shape of result) this.addShape(num++, shape);
		return result;
	}
	onAddScript(script) {

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
		let shapes = this.getShapes();
		let models = this.getShapeModels();
		for (let i = 0; i < shapes.length; i++) shapes[i].cacheBoundingBox(models[i].getBoundingBox()); //transfer from model to root shape
		this.__boundingBox = this.getBoundingBox();
	}
	getShapeModels() {
		let pos = this.middle;
		let cos = this.__cosRot;
		let sin = this.__sinRot;
		let result = [];
		for (let name in this.shapes) result.push(this.shapes[name].getModelCosSin(pos, cos, sin));
		return result;
	}
	getModels() {
		let middle = this.middle;
		let pos = middle;
		let cos = this.__cosRot;
		let sin = this.__sinRot;
		let result = [];
		for (let name in this.shapes) {
			result.push(...this.shapes[name].collisionShapes.map(e => {
				e.cache(this.shapes[name]);
				return e;
			}));
		}
		result = result.map(e => {
			let el = e.getModelCosSin(pos, cos, sin);
			el.cache(e);
			return el;
		});
		return result;
	}
	getBoundingBox() {
		let shapes = this.getShapeModels();
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
	rotateAround(point, rotation) {
		let middle = this.middle;
		let dif = point.Vminus(middle);
		let nDif = Geometry.rotatePointAround(Vector2.origin, dif, rotation);
		this.middle = middle.Vadd(nDif.Vminus(dif).inverse());
		this.rotation += rotation;
	}
	addShape(name, shape) {
		shape = shape.get();
		this.shapes[name] = shape;
		if (shape instanceof Polygon && !(shape instanceof Rect)) shape.subdivideForCollisions();
		this.cacheMass();
	}
	worldSpaceToModelSpace(v) {
		return v.rotate(this.rotation).Vplus(this.middle);
	}
	modelSpaceToWorldSpace(v) {
		return v.Vminus(this.middle).rotate(-this.rotation);
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
		for (let shape of shapes) {
			shape.move(dif);
		}
	}
	removeShape(name) {
		let shape = this.shapes[name];
		delete this.shapes[name];
		this.cacheMass();
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
		return this.shapes[name].getModel(this.middle, this.rotation);
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
		for (let shape of this.getShapes()) shape.scaleAbout(middle, factor);
	}
	vertexDirection(dir) {
		const type = dir === "CLOCKWISE";
		for (let [name, shape] of this.shapes) if (shape instanceof Polygon) {
			shape.subdivideForCollisions(type);
		}
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
	runDraw() {
		let middle = this.middle;
		c.translate(middle);
		if (this.rotation) c.rotate(this.rotation);
		for (let name in this.shapes) {
			let shape = this.shapes[name];
			if (shape.rotation) {
				c.save();
				let sMiddle = shape.middle;
				c.translate(sMiddle);
				c.rotate(shape.rotation);
				c.translate(sMiddle.inverse());
			}
			this.draw(name, shape);
			this.scripts.run("draw", name, shape);
			if (shape.rotation) c.restore();
		}
		c.rotate(-this.rotation);
		c.translate(middle.inverse());
	}
	engineDrawUpdate(screen) {
		let onScreen = !this.cullGraphics || Geometry.overlapRectRect(this.__boundingBox, screen);
		if (!this.hidden && onScreen) {
			this.runDraw();
		}
		this.onScreen = onScreen;
		//bound visual
		// c.stroke(cl.GREEN, 1).rect(this.__boundingBox);
		// for (let shape of this.getShapes()) c.stroke(cl.GREEN, 1).rect(shape.__boundingBox);
		this.scripts.run("escapeDraw");
	}
	engineFixedUpdate(hitboxes) {
		if (this.controls) {
			this.move();
		}
		this.update();
		this.scripts.run("update");
	}
	updateCaches() {
		this.cacheBoundingBoxes();
		this.cacheDimensions();
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