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
class Shape {
	constructor(rotation = 0) {
		this.rotation = rotation;
		this.__boundingBox = null; //bounding box cache
		this.collisionShapes = [this]; //a list of the shapes that make up the shape
	}
	get middle() {
		return Vector2.origin;
	}
	set middle(a) {
		this.center(a);
	}
	get area() {
		//return the area of the shape
		return 0;
	}
	get perimeter() {
		return 0;
	}
	cache(shape) {
		//retrieve cached values
		this.__boundingBox = shape.__boundingBox;
	}
	cacheBoundingBox(box) {
		//store bounding box for later use
		this.__boundingBox = box;
	}
	getBoundingBox() {
		//return the smallest rectangle that contains the shape
		return new Rect(0, 0, 0, 0, 0);
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
		return new Shape(this.rotation);
	}
	static lerp(a, b, t) {
		//returns the lerp from a to b at t
		return new Shape(a.rotation * (1 - t) + b.rotation * t);
	}
}
class Polygon extends Shape {
	constructor(vertices, rotation = 0) {
		super(rotation);
		this.vertices = vertices;
		this.vertexDirection = true;
		this.__axes = [];
	}
	set middle(a) {
		this.center(a);
	}
	get middle() {
		return Vector.sum(...this.vertices).Nover(this.vertices.length);
	}
	get area() {
		let bound = this.getBoundingBox();
		return bound.width * bound.height;
	}
	get perimeter() {
		let sum = 0;
		let edges = this.getEdges();
		for (let el of edges) sum += Math.sqrt((el.b.x - el.a.x) ** 2 + (el.b.y - el.a.y) ** 2);
		return sum;
	}
	subdivideForCollisions(direction) {
		if (direction === undefined) direction = this.vertexDirection;
		else this.vertexDirection = direction;
		this.collisionShapes = Geometry.subdividePolygon(this, direction);
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
		let middle = this.middle;
		let rotation = this.rotation;
		let verts;
		if (rotation) {
			let t_sin = Math.sin(rotation);
			let t_cos = Math.cos(rotation);
			verts = this.getCorners()
				.map(e => {
					let difX = e.x - middle.x;
					let difY = e.y - middle.y;
					let nX = t_cos * difX - t_sin * difY;
					let nY = t_sin * difX + t_cos * difY;
					return new Vector2(middle.x + nX, middle.y + nY);
				});
		} else verts = this.getCorners();
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
	cacheAxes(axes) {
		this.__axes = axes;
	}
	cache(shape) {
		this.__axes = shape.__axes;
		this.__boundingBox = shape.__boundingBox;
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
		this.vertices = this.vertices.map(e => e.Vplus(offset));
		return this;
	}
	scale(factor) {
		let middle = this.middle;
		this.vertices = this.vertices.map(e => middle.Vplus(e.Vminus(middle).Ntimes(factor)));
		this.subdivideForCollisions(this.vertexDirection);
		return this;
	}
	scaleAbout(pos, factor) {
		this.vertices = this.vertices.map(e => pos.Vplus(e.Vminus(pos).Ntimes(factor)));
		this.subdivideForCollisions(this.vertexDirection);
		return this;
	}
	move(dir) {
		for (let vert of this.vertices) vert.Vadd(dir);
		return this;
	}
	get() {
		let poly = new Polygon([...this.vertices], this.rotation);
		poly.vertexDirection = this.vertexDirection;
		return poly;
	}
	static lerp(a, b, t) {
		const vertices = a.vertices.map((v, inx) => Vector2.lerp(v, b.vertices[inx], t));
		return new Polygon(vertices, a.rotation * (1 - t) + b.rotation * t);
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
	set middle(a) {
		this.center(a);
	}
	get middle() {
		return new Vector2(this.x + this.width / 2, this.y + this.height / 2);
	}
	get area() {
		return this.width * this.height;
	}
	get perimeter() {
		return this.width * 2 + this.height * 2;
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
	subdivideForCollisions() {

	}
	center(pos) {
		this.x = pos.x - this.width / 2;
		this.y = pos.y - this.height / 2;
		return this;
	}
	scale(factor) {
		let middle = this.middle;
		this.width *= factor;
		this.height *= factor;
		this.center(middle);
		return this;
	}
	move(dir) {
		this.x += dir.x;
		this.y += dir.y;
		return this;
	}
	get() {
		return new Rect(this.x, this.y, this.width, this.height, this.rotation);
	}
	static lerp(a, b, t) {
		const dim = Vector2.lerp(new Vector2(a.width, a.height), new Vector2(b.width, b.height), t);
		const pos = Vector2.lerp(new Vector2(a.x, a.y), new Vector2(b.x, b.y), t);
		return new Rect(pos.x, pos.y, dim.x, dim.y, a.rotation * (1 - t) + b.rotation * t);
	}
}
class Circle extends Shape {
	constructor(x, y, radius) {
		super(0);
		this.x = x;
		this.y = y;
		this.radius = Math.abs(radius);
	}
	set middle(a) {
		this.center(a);
	}
	get middle() {
		return new Vector2(this.x, this.y);
	}
	get area() {
		return Math.PI * this.radius ** 2;
	}
	get perimeter() {
		return Math.PI * this.radius * 2;
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
		this.x = pos.x;
		this.y = pos.y;
		return this;
	}
	scale(factor) {
		this.radius *= factor;
		return this;
	}
	scaleAbout(pos, factor) {
		let nPos = pos.plus((new Vector2(this.x, this.y)).Vminus(pos).Ntimes(factor));
		this.x = nPos.x;
		this.y = nPos.y;
		this.radius *= factor;
		return this;
	}
	move(dir) {
		this.x += dir.x;
		this.y += dir.y;
		return this;
	}
	getBoundingBox() {
		return new Rect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
	}
	get() {
		return new Circle(this.x, this.y, this.radius);
	}
	static lerp(a, b, t) {
		const pos = Vector2.lerp(new Vector2(a.x, a.y),new Vector2(b.x, b.y), t);
		const radius = a.radius * (1 - t) + b.radius * t;
		return new Circle(pos.x, pos.y, radius);
	}
}