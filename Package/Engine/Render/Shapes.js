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
		return this.b.Vminus(this.a).mag;
	}
	get midPoint() {
		let ax = (this.a.x + this.b.x) / 2;
		let ay = (this.a.y + this.b.y) / 2;
		return new Vector2(ax, ay);
	}
	get vector() {
		return this.b.Vminus(this.a).normalize();
	}
	set vector(v) {
		let mag = this.length;
		let nB = this.a.Vplus(v.get().normalize().Ntimes(mag));
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
class Shape extends Operable {
	constructor() { 
		super();
		this.area = 0;
	}
	get middle() {
		return Vector2.origin;
	}
	getBoundingBox() {
		//return the smallest rectangle that contains the shape
		return new Rect(0, 0, 0, 0);
	}
	getModel(pos, rot) {
		//return the world space model of the relative shape
		return new Shape(0);
	}
	getModelCosSin(pos, cos, sin) {
		//get model with precalculated values
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
	move(dir) {
		//move by _dir_
	}
	get() {
		//return a copy of the shape
		return new Shape();
	}
}
class Polygon extends Shape {
	constructor(vertices, alreadyClockwise) {
		super();
		this.alreadyClockwise = alreadyClockwise;
		this.vertices = [];
		for (let v of vertices) {
			let valid = true;
			for (let v2 of this.vertices) if (v.equals(v2)) {
				valid = false;
				break;
			}
			if (valid) this.vertices.push(v);
		}
		let x = vertices.map(e => e.x);
		let y = vertices.map(e => e.y);
		let minX = Math.min(...x);
		let maxX = Math.max(...x);
		let minY = Math.min(...y);
		let maxY = Math.max(...y);
		this.area = (maxX - minX) * (maxY - minY);
	}
	set middle(a) {
		this.vertices = this.center(a).vertices;
	}
	get middle() {
		return Vector.sum(this.vertices).Nover(this.vertices.length);
	}
	getBoundingBox() {
		let verts = this.vertices;
		let x = verts.map(e => e.x);
		let y = verts.map(e => e.y);
		let minX = Math.min(...x);
		let maxX = Math.max(...x);
		let minY = Math.min(...y);
		let maxY = Math.max(...y);
		return new Rect(minX, minY, maxX - minX, maxY - minY);
	}
	getModel(pos, rot) {
		return this.getModelCosSin(pos, Math.cos(rot), Math.sin(rot));
	}
	getModelCosSin(pos, cos, sin) {
		let verts = this.getCorners();
		let m_sin = sin;
		let m_cos = cos;
		verts = verts
			.map(e => {
				let difX = e.x;
				let difY = e.y;
				let nX = m_cos * difX - m_sin * difY;
				let nY = m_sin * difX + m_cos * difY;
				return new Vector2(nX + pos.x, nY + pos.y);
				
			});
		return new Polygon(verts);
	}
	getCorners() {
		return this.vertices;
	}
	getAxes() {
		let axes = [];
		let verts = this.vertices;
		for (let i = 0; i < verts.length; i++) {
			let inx1 = i;
			let inx2 = (i + 1) % verts.length;
			let slope = verts[inx2].Vminus(verts[inx1]).normal.normalize();
			axes.push(slope);
		}
		return axes;
	}
	getEdges() {
		let edges = [];
		let verts = this.vertices;
		for (let i = 0; i < verts.length; i++) {
			let inx1 = i;
			let inx2 = (i + 1) % verts.length;
			edges.push(new Line(verts[inx1], verts[inx2]));
		}
		return edges;
	}
	center(pos) {
		let offset = pos.Vminus(this.middle);
		return new Polygon(this.vertices.map(e => e.Vplus(offset)));
	}
	scale(factor) {
		let middle = this.middle;
		return new Polygon(this.vertices.map(e => middle.Vplus(e.Vminus(middle).Ntimes(factor))));
	}
	scaleAbout(pos, factor) {
		return new Polygon(this.vertices.map(e => pos.Vplus(e.Vminus(pos).Ntimes(factor))));
	}
	move(dir) {
		return new Polygon(this.vertices.map(vert => vert.plus(dir)));
	}
	get() {
		let poly = new Polygon([...this.vertices], this.rotation);
		return poly;
	}
	toPhysicsShape() {
		return new PolygonCollider(this.vertices.map(v => v.toPhysicsVector()), this.alreadyClockwise);
	}
	static lerp(a, b, t) {
		const vertices = a.vertices.map((v, inx) => Vector2.lerp(v, b.vertices[inx], t));
		return new Polygon(vertices, a.rotation * (1 - t) + b.rotation * t);
	}
	static regular(sides, radius) {
		let v = [];
		for (let i = 0; i < sides; i++)
			v.push(Vector2.fromAngle(i / sides * 2 * Math.PI).times(radius));
		return new Polygon(v);
	}
}
class Rect extends Polygon {
	constructor(x, y, w, h) {
		super([]);
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
		this.area = this.width * this.height;
	}
	set middle(a) {
		let pos = this.center(a);
		this.x = pos.x;
		this.y = pos.y;
	}
	get middle() {
		return new Vector2(this.x + this.width / 2, this.y + this.height / 2);
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
	getBoundingBox() {
		return new Rect(this.x, this.y, this.width, this.height);
	}
	center(pos) {
		return new Rect(pos.x - this.width / 2, pos.y - this.height / 2, this.width, this.height);
	}
	scale(factor) {
		factor -= 1;
		let dw = this.width * factor;
		let dh = this.height * factor;
		return new Rect(this.x - dw / 2, this.y - dh / 2, this.width + dw, this.height + dh);
	}
	move(dir) {
		return new Rect(this.x + dir.x, this.y + dir.y, this.width, this.height);
	}
	get() {
		return new Rect(this.x, this.y, this.width, this.height, this.rotation);
	}
}
Rect.modValues = ["x", "y", "width", "height"];
class Circle extends Shape {
	constructor(x, y, radius) {
		super();
		this.x = x;
		this.y = y;
		this.radius = Math.abs(radius);
		this.area = this.radius * this.radius * Math.PI;
	}
	set middle(a) {
		this.center(a);
	}
	get middle() {
		return new Vector2(this.x, this.y);
	}
	getModel(pos, rot) {
		return this.getModelCosSin(pos, Math.cos(rot), Math.sin(rot));
	}
	getModelCosSin(pos, cos, sin) {
		let t_x = this.x * cos - this.y * sin + pos.x;
		let t_y = this.x * sin + this.y * cos + pos.y;
		return new Circle(t_x, t_y, this.radius);
	}
	center(pos) {
		return new Circle(pos.x, pos.y, this.radius);
	}
	scale(factor) {
		return new Circle(this.x, this.y, this.radius * factor)
	}
	scaleAbout(pos, factor) {
		let nPos = pos.plus((new Vector2(this.x, this.y)).Vminus(pos).Ntimes(factor));
		return new Circle(nPos.x, nPos.y, this.radius * factor);
	}
	move(dir) {
		return new Circle(this.x + dir.x, this.y + dir.y, this.radius);
	}
	getBoundingBox() {
		return new Rect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
	}
	get() {
		return new Circle(this.x, this.y, this.radius);
	}
	toPhysicsShape() {
		return new CircleCollider(this.x, this.y, this.radius);
	}
}
Circle.modValues = ["x", "y", "radius"];