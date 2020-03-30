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
		this.shapes = {};
		this.rotation = 0;
	}
	get middle() {
		// let middle = Vector2.origin;
		// let totalArea = 0;
		// for (let [name, shape] of this.shapes) {
		// 	let area = shape.area;
		// 	let sMiddle = shape.middle;
		// 	middle.add(sMiddle);
		// 	totalArea += area;
		// }
		// middle.div(totalArea);
		// middle = Geometry.rotatePointAround(Vector2.origin, middle, this.rotation).plus(new Vector2(this.x, this.y));
		// return middle;
		return new Vector2(this.x, this.y);
	}
	set middle(a) {
		let dif = a.minus(this.middle);
		this.x += dif.x;
		this.y += dif.y;
	}
	get width() {
		return this.getBoundingBox().width;
	}
	get height() {
		return this.getBoundingBox().height;
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
	getBoundingBox() {
		let shapes = this.getModels();
		let boxes = shapes.map(e => e.getBoundingBox());
		let mins = boxes.map(e => e.vertices[0]);
		let maxs = boxes.map(e => e.vertices[2]);
		let minX = Math.min(...mins.map(e => e.x));
		let minY = Math.min(...mins.map(e => e.y));
		let maxX = Math.max(...maxs.map(e => e.x));
		let maxY = Math.max(...maxs.map(e => e.y));
		return new Rect(new Vector2(minX, minY), new Vector2(maxX, maxY));
	}
	addShape(name, shape) {
		this.shapes[name] = shape;
	}
	removeShape(name) {
		let shape = this.shapes[name];
		delete this.shapes[name];
		return shape;
	}
	getShape(name) {
		return this.shapes[name];
	}
	getShapes() {
		let ary = [];
		for (let [name, shape] of this.shapes) ary.push(shape);
		return ary;
	}
	scale(factor) {
		let middle = Vector2.origin;
		for (let shape of this.getShapes()) shape.scaleAbout(middle, factor);
	}
	getModels() {
		let ary = this.getShapes();
		let middle = this.middle;
		let pos = middle;
		let rot = this.rotation;
		ary = ary.map(e => e.getModel(pos, rot));
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
	scriptUpdate() {
		for (let m of this.scripts) {
			m.scriptUpdate(m);
		}
	}
	scriptBeforeUpdate() {
		for (let m of this.scripts) {
			m.scriptBeforeUpdate(m);
		}
	}
	scriptDraw(name, shape) {
		for (let m of this.scripts) {
			m.scriptDraw(m, name, shape);
		}
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
			this.scriptDraw(name, shape);
			this.draw(name, shape);
			c.restore();
		}
		c.restore();
	}
	engineDrawUpdate() {
		let d = s.adjustedDisplay;
		let onScreen = !this.cullGraphics || Geometry.overlapRectRect(this.getBoundingBox(), (new Rect(d.x, d.y, d.width, d.height, s.viewRotation)).getBoundingBox());
		if (!this.hidden && onScreen) {
			this.runDraw();
			this.update();
		}
	}
	enginePhysicsUpdate(hitboxes) {
		if (this.controls) {
			this.move();
		}
		this.scriptUpdate();
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