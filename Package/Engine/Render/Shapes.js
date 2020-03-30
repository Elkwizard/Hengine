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
	get length() {
		return this.b.minus(this.a).mag;
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
		let mag = this.length;
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
class Shape {
	constructor(rotation = 0) {
		this.rotation = rotation;
	}
	get area() {
		//return the area of the shape
		return 0;
	}
	getBoundingBox() {
		//return the smallest rectangle that contains the shape
		return new Rect(0, 0, 0, 0, 0);
	}
	getModel(pos, rot) {
		//return the world space model of the relative shape
		return new Shape(0);
	}
	center(pos) {
		//center the polygon at _pos_
	}
	scale(factor) {
		//scale the shape about its center by _factor_
	}
	scaleAbout(pos, factor) {
		//scale shape relative to _pos_ by _factor_
	}
	get() {
		//return a copy of the shape
		return new Shape(this.rotation);
	}
}
class Polygon extends Shape {
	constructor(vertices, rotation = 0) {
		super(rotation);
		this.vertices = vertices;
	}
	get middle() {
		return Vector.sum(...this.vertices).over(this.vertices.length);
	}
	get area() {
		let bound = this.getBoundingBox();
		return bound.width * bound.height;
	}
	getBoundingBox() {
		let sortedX = this.vertices.map(e => e.x).sort((a, b) => b - a);
		let sortedY = this.vertices.map(e => e.y).sort((a, b) => b - a);
		let minX = sortedX[sortedX.length - 1];
		let maxX = sortedX[0];
		let minY = sortedY[sortedY.length - 1];
		let maxY = sortedY[0];
		return new Rect(new Vector2(minX, minY), new Vector2(maxX, maxY));
	}
	getModel(pos, rot) {
		let middle = this.middle;
		let verts = this.getCorners()
			.map(e => Geometry.rotatePointAround(middle, e, this.rotation))
			.map(e => Geometry.rotatePointAround(pos, e.plus(pos), rot));
		return new Polygon(verts);
	}
	getCorners() {
		return this.vertices;
	}
	getAxes() {
		let axes = [];
		for (let i = 0; i < this.vertices.length; i++) {
			let inx1 = i;
			let inx2 = (i + 1) % this.vertices.length;
			let slope = this.vertices[inx2].minus(this.vertices[inx1]).normal.normalize();
			axes.push(slope);
		}
		return axes;
	}
	getEdges() {
		let axes = [];
		for (let i = 0; i < this.vertices.length; i++) {
			let inx1 = this.vertices[i];
			let inx2 = this.vertices[(i + 1) % this.vertices.length];
			axes.push(new Line(this.vertices[inx1], this.vertices[inx2]));
		}
		return axes;
	}
	center(pos) {
		let offset = pos.minus(this.middle);
		this.vertices = this.vertices.map(e => e.plus(offset));
	}
	scale(factor) {
		let middle = this.middle;
		this.vertices = this.vertices.map(e => middle.plus(e.minus(middle).times(factor)));
	}
	scaleAbout(pos, factor) {
		this.vertices = this.vertices.map(e => pos.plus(e.minus(pos).times(factor)));
	}
	get() {
		return new Polygon([...this.vertices], this.rotation);
	}
}
class Rect extends Polygon {
	constructor(x, y, w, h, rotation = 0) {
		super([], rotation);
		if (typeof x === "object") {
			w = y.x - x.x;
			h = y.y - x.y;
			y = x.y;
			x = x.x;
		}
		if (w < 0) {
			w *= -1;
			x -= w;
		}
		if (h < 0) {
			h *= -1;
			y -= h;
		}
		this.x = x;
		this.y = y;
		this.width = w;
		this.height = h;
	}
	get middle() {
		return new Vector2(this.x + this.width / 2, this.y + this.height / 2);
	}
	get area() {
		return this.width * this.height;
	}
	get vertices() {
		return [
			new Vector2(this.x, this.y),
			new Vector2(this.x + this.width, this.y),
			new Vector2(this.x + this.width, this.y + this.height),
			new Vector2(this.x, this.y + this.height)
		];
	}
	set vertices(a) {
		if (a.length === 4) {
			let min = a[0];
			let max = a[2];
			this.x = min.x;
			this.y = min.y;
			this.width = max.x - min.x;
			this.height = max.y - min.y;
		}
	}
	center(pos) {
		this.x = pos.x - this.width / 2;
		this.y = pos.y - this.height / 2;
	}
	scale(factor) {
		let middle = this.middle;
		this.width *= factor;
		this.height *= factor;
		this.center(middle);	
	}
	get() {
		return new Rect(this.x, this.y, this.width, this.height, this.rotation);
	}
}
class Circle extends Shape {
	constructor(x, y, radius) {
		super(0);
		this.x = x;
		this.y = y;
		this.radius = Math.abs(radius);
	}
	get area() {
		return Math.PI * this.radius ** 2;
	}
	get middle() {
		return new Vector2(this.x, this.y);
	}
	getModel(pos, rot) {
		let p = Geometry.rotatePointAround(pos, pos.plus(new Vector2(this.x, this.y)), rot);
		return new Circle(p.x, p.y, this.radius);
	}
	center(pos) {
		this.x = pos.x;
		this.y = pos.y;
	}
	scale(factor) {
		this.radius *= factor;
	}
	scaleAbout(pos, factor) {
		let dist = Geometry.distToPoint(this, pos) + this.radius;
		let nPos = pos.plus((new Vector2(this.x, this.y)).minus(pos).times(factor));
		this.x = nPos.x;
		this.y = nPos.y;
		this.radius *= factor;
	}
	getBoundingBox() {
		return new Rect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
	}
	get() {
		return new Circle(this.x, this.y, this.radius);
	}
}