class Triangle {
	constructor(p1, p2, p3) {
		this.vertices = [p1, p2, p3];
	}
	middle() {
		function average(ary) {
			let sum = 0;
			for (let num of ary) {
				sum += num;
			}
			sum /= ary.length;
			return sum;
		}
		let res = new Vertex();
		let xs = [];
		let ys = [];
		for (let x of this.vertices) {
			xs.push(x.x);
			ys.push(x.y);
		}
		res.x = average(xs);
		res.y = average(ys);
		return res;
	}
}
class Circle {
	constructor(x, y, radius) {
		this.collider = new CircleCollider(this);
		this.x = x;
		this.y = y;
		this.radius = radius;
	}
	get middle() {
		return { x: this.x, y: this.y }
	}
	set middle(a) {
		this.x = a.x;
		this.y = a.y;
	}
}
class Line {
	constructor(x, y, x2, y2) {
		if (typeof x === "object") {
			this.a = new Vector2(x.x, x.y);
			this.b = new Vector2(y.x, y.y);
		} else {
			this.a = new Vector2(x, y);
			this.b = new Vector2(x2, y2);
		}
	}
	get midPoint() {
		let ax = (this.a.x + this.b.x) / 2;
		let ay = (this.a.y + this.b.y) / 2;
		return new Vector2(ax, ay);
	}
	get vector() {
		return this.b.minus(this.a).normalize();
	}
	set vector(v) {
		let mag = this.b.minus(this.a).mag;
		let nB = this.a.plus(v.get().normalize().times(mag));
		this.b = nB;
	}
	get slope() {
		let dx = this.b.x - this.a.x;
		let dy = this.b.y - this.a.y;
		return dy / dx;
	}
	evaluate(x) {
		return this.slope * x + this.a.y;
	}
}
class Rect {
	constructor(x, y, width, height, rotation = 0) {
		this.collider = new RectCollider(this);
		this._x = 0;
		this._y = 0;
		this.shapes = [this];
		this.shapeOffsets = [new Vector2(0, 0)];
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		if (typeof x == "object") {
			this.x = x.x;
			this.y = x.y;
			this.width = y.x - x.x;
			this.height = y.y - x.y;
		}
		if (this.width < 0) {
			this.width = -this.width;
			this.x -= this.width;
		}
		if (this.height < 0) {
			this.height = -this.height;
			this.y -= this.height;
		}
		this._rotation = 0;
		this.rotation = rotation;
		this.inherentRotation = 0;
		this.parent = null;
		this.centerOfMassOffset = new Vector2(0, 0);
	}
	set x(a) {
		let th = this.shapes[0];
		let shapes = this.shapes.slice(1);
		for (let i = 0; i < shapes.length; i++) {
			let nX = a + this.shapeOffsets[i + 1].x;
			shapes[i]._x = nX;
		}
		th._x = a;
	}
	get x() {
		return this._x;
	}
	set y(a) {
		let th = this.shapes[0];
		let shapes = this.shapes.slice(1);
		for (let i = 0; i < shapes.length; i++) {
			let nY = a + this.shapeOffsets[i + 1].y;
			shapes[i]._y = nY;
		}
		th._y = a;
	}
	get y() {
		return this._y;
	}
	set width(a) {
		this._width = a;
	}
	get width() {
		if (!this.getCustomCorners) return this._width;
		else {
			let sorted = this.getCustomCorners.bind(this)()
				.map(e => e.x)
				.sort((a, b) => b - a);
			return sorted[0] - sorted[sorted.length - 1];
		}
	}
	set height(a) {
		this._height = a;
	}
	get height() {
		if (!this.getCustomCorners) return this._height;
		else {
			let sorted = this.getCustomCorners.bind(this)()
				.map(e => e.y)
				.sort((a, b) => b - a);
			return sorted[0] - sorted[sorted.length - 1];
		}
	}
	set angle(a) {
		this.rotation = a;
	}
	get angle() {
		return this.rotation;
	}
	set rotation(a) {
		if (!a) a = 0.0001;
		if (Math.abs(a % Math.PI / 2) < 0.0001) a += 0.0001;
		this._rotation = a;
	}
	get rotation() {
		return this._rotation;
	}
	set unrotatedMiddle(a) {
		if (!this.getCustomCorners) {
			this.x = a.x - this.width / 2;
			this.y = a.y - this.height / 2;
		} else {
			let corners = this.getCustomCorners.bind(this)();
			let offset = Vector.sum(...corners).over(corners.length).minus(new Vector2(this.x, this.y));
			this.x = a.x - offset.x;
			this.y = a.y - offset.y;
		}
	}
	get unrotatedMiddle() {
		if (!this.getCustomCorners) return { x: this.x + (this.width / 2), y: this.y + (this.height / 2) }
		else {
			let corners = this.getCustomCorners.bind(this)();
			return Vector.sum(...corners).over(corners.length);
		}
	}
	get middle() {
		if (!this.centerOfMassOffset.x && !this.centerOfMassOffset.y) return Vector2.fromPoint(this.unrotatedMiddle);
		let rot = this.parent ? this.parent.rotation : this.rotation;
		// if (this.parent) console.log(this.centerOfMass, this.unrotatedMiddle, rot);
		return Geometry.rotatePointAround(this.centerOfMass, this.unrotatedMiddle, rot);
	}
	set middle(a) {
		let dif = this.centerOfMassOffset;
		let rot = this.parent ? this.parent.rotation : this.rotation;
		let difXa = Math.cos(rot) * dif.x;
		let difYa = Math.sin(rot) * dif.x;
		let difXb = Math.cos(rot + Math.PI / 2) * dif.y;
		let difYb = Math.sin(rot + Math.PI / 2) * dif.y;
		let difX = difXa + difXb;
		let difY = difYa + difYb;
		this.centerOfMass = new Vector2(difX + a.x, difY + a.y);
	}
	addShape(...shapes) {
		for (let shape of shapes) {
			shape.remove();
			let dif = new Vector2(shape.x - this.x, shape.y - this.y);
			this.shapes.push(shape);
			this.shapeOffsets.push(dif);
			let centers = this.shapes.map(e => e.centerOfMass);
			let center = Vector.sum(...centers).over(this.shapes.length);
			let offset = center.minus(this.unrotatedMiddle);
			this.centerOfMassOffset = offset;
			shape.parent = this;
			shape.shapes = [shape];
		}
		for (let shape of this.shapes) {
			shape.centerOfMassOffset = shape.centerOfMass.minus(this.centerOfMass).times(-1);
		}
	}
	getShapes() {
		return this.shapes;
	}
	getCorners() {
		let r = this;
		let corners;
		if (r.getCustomCorners) corners = r.getCustomCorners.bind(this)();
		else corners = [
			new Vector2(r.x, r.y),
			new Vector2(r.x + r.width, r.y),
			new Vector2(r.x + r.width, r.y + r.height),
			new Vector2(r.x, r.y + r.height)
		];
		let com = r.centerOfMass;
		let middle = r.middle;
		let rot1 = this.parent ? this.parent.rotation : this.rotation;
		let rot2 = this.parent ? this.rotation : 0;
		// c.draw(cl.ORANGE).circle(com.x, com.y, 5);
		for (let i = 0; i < corners.length; i++) corners[i] = Geometry.rotatePointAround(com, corners[i], rot1);
		if (rot2) {
			for (let i = 0; i < corners.length; i++) corners[i] = Geometry.rotatePointAround(middle, corners[i], rot2);
		}
		return corners;
	}
	getAxes() {
		let r = this;
		let corners = r.getCorners();
		if (this.getCustomCorners) {
			let edges = [];
			for (let i = 0; i < corners.length; i++) {
				edges.push(corners[(i + 1) % corners.length].minus(corners[i]).normalize().normal);
			}
			return edges;
		}
		let edges = [
			corners[1].minus(corners[0]).normalize(),
			corners[2].minus(corners[1]).normalize()
		];
		return edges;
	}
	getLineEdges() {
		let r = this;
		let corners = r.getCorners();
		let edges = [];
		for (let i = 0; i < corners.length; i++) {
			if (i == 0) edges.push(new Line(corners[corners.length - 1], corners[0]));
			else edges.push(new Line(corners[i - 1], corners[i]));
		}
		return edges;
	}
	set centerOfMass(a) {
		this.unrotatedMiddle = this.centerOfMassOffset.times(-1).plus(a);
	}
	get centerOfMass() {
		return this.centerOfMassOffset.plus(this.unrotatedMiddle);
	}
}