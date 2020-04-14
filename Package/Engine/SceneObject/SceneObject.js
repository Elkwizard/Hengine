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
function clamp(n, a, b) {
	return Math.max(a, Math.min(b, n));
}

//Actual SceneObject
class SceneObject {
	constructor(name, x, y, controls, tag, home) {
		this.x = x;
		this.y = y;
		this.shapes = {};
		this.rotation = 0;
		this.name = name;
		this.home = home;
		this.tag = tag;
		this.controls = controls;
		this.hidden = false;
		this.update = function () { };
		this.draw = function (shape) { };
		this.custom = {};
		this.hasPhysics = false;
		this.isUI = false;
		this.isRectangle = true;
		this.hovered = false;
		this.layer = 0;
		this.scripts = new ScriptContainer();
		this.lifeSpan = 0;
		this.log = [];
		this.isDead = false;
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
	}
	get middle() {
		return new Vector2(this.x, this.y);
	}
	set middle(a) {
		this.x = a.x;
		this.y = a.y;
	}
	set width(a) {
		let factor = a / this.width;
		this.scale(factor);
	}
	get width() {
		return this.__boundingBox.width;
	}
	set height(a) {
		let factor = a / this.height;
		this.scale(factor);
	}
	get height() {
		return this.__boundingBox.height;
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
				term = "R " + shape.rotation.toFixed(0) + " " + shape.x.toFixed(0) + " " + shape.y.toFixed(0) + " " + shape.width.toFixed(0) + " " + shape.height.toFixed(2);
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
			switch(shape[0]) {
				case "C":
					result.push(new Circle(args[0], args[1], args[2]));
					break;
				case "R":
					result.push(new Rect(args[1], args[2], args[3], args[4], args[0]));
				case "P":
					result.push(new Polygon(shape.split(" ").slice(2).map(e => new Vector2(parseFloat(e.split("|")[0]), parseFloat(e.split("|")[1]))), args[0]))
					break;
			}
		}
		let num = 0;
		for (let shape of result) this.addShape(num++, shape);
		return result;
	}
	cacheBoundingBoxes() {
		let shapes = this.getShapes();
		let models = this.getModels();
		for (let i = 0; i < shapes.length; i++) shapes[i].cacheBoundingBox(models[i].getBoundingBox()); //transfer from model to root shape
		this.__boundingBox = this.getBoundingBox();
	}
	getBoundingBox() {
		let shapes = this.getModels();
		let boxes = shapes.map(e => e.__boundingBox);
		if (boxes.length === 1) return boxes[0];
		let mins = boxes.map(e => e.vertices[0]);
		let maxs = boxes.map(e => e.vertices[2]);
		let minX = Math.min(...mins.map(e => e.x));
		let minY = Math.min(...mins.map(e => e.y));
		let maxX = Math.max(...maxs.map(e => e.x));
		let maxY = Math.max(...maxs.map(e => e.y));
		return new Rect(minX, minY, maxX - minX, maxY - minY);
	}
	rotateAround(point, rotation) {
		let middle = this.middle;
		let dif = point.minus(middle);
		let nDif = Geometry.rotatePointAround(Vector2.origin, dif, rotation);
		this.middle = middle.add(nDif.minus(dif).times(-1));
		this.rotation += rotation;
	}
	addShape(name, shape) {
		this.shapes[name] = shape;
		this.cacheBoundingBoxes();
	}
	centerModels() {
		let center = Vector2.origin;
		let shapes = this.getShapes();
		let totalArea = 0;
		for (let shape of shapes) {
			let area = shape.area;
			totalArea += area;
			center.add(shape.middle.times(area));
		}
		center.div(totalArea);
		let dif = center.times(-1);
		for (let shape of shapes) {
			shape.move(dif);
		}
	}
	removeShape(name) {
		let shape = this.shapes[name];
		delete this.shapes[name];
		return shape;
	}
	removeAllShapes() {
		let names = [];
		for (let [name, shape] of this.shapes) names.push(name);
		for (let name of names) {
			delete this.shapes[name];
		}
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
		for (let [name, shape] of this.shapes) ary.push(shape);
		return ary;
	}
	scale(factor) {
		let middle = Vector2.origin;
		for (let shape of this.getShapes()) shape.scaleAbout(middle, factor);
		this.cacheBoundingBoxes();
	}
	getModels() {
		let ary = this.getShapes();
		let middle = this.middle;
		let pos = middle;
		let rot = this.rotation;
		ary = ary.map(function(e,i){
			let r = e.getModel(pos, rot);
			r.__boundingBox = ary[i].__boundingBox; //transfer from root shape to model
			return r;
		});
		return ary;
	}
	rename(name) {
		delete this.home.contains[this.name];
		this.home.contains[name] = this;
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
	runDraw() {
		let middle = this.middle;
		c.save();
		c.translate(middle);
		c.rotate(this.rotation);
		for (let [name, shape] of this.shapes) {
			c.save();
			let sMiddle = shape.middle;
			c.translate(sMiddle);
			c.rotate(shape.rotation);
			c.translate(sMiddle.times(-1));
			this.draw(name, shape);
			this.scripts.run("draw", name, shape);
			c.restore();
		}
		c.restore();
	}
	engineDrawUpdate() {
		let d = s.adjustedDisplay;
		let onScreen = !this.cullGraphics || Geometry.overlapRectRect(this.__boundingBox, (new Rect(d.x, d.y, d.width, d.height, s.viewRotation)).getBoundingBox());
		if (!this.hidden && onScreen) {
			this.runDraw();
		}
		//bound visual
		// c.stroke(cl.GREEN, 1).rect(this.__boundingBox);
		// for (let shape of this.getShapes()) c.stroke(cl.GREEN, 1).rect(shape.__boundingBox);
		this.scripts.run("escapeDraw");
	}
	enginePhysicsUpdate(hitboxes) {
		if (this.controls) {
			this.move();
		}
		this.update();
		this.scripts.run("update");
		this.cacheBoundingBoxes();
	}
	pushToRemoveQueue(x) {
		return null;
	}
	remove() {
		if (this.isBeingUpdated) this.pushToRemoveQueue(this);
		else this.home.removeElement(this);
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