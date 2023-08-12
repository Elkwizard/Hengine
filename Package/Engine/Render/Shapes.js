class Range {
	constructor(min, max) {
		if (min !== undefined && max !== undefined) {
			if (min < max) {
				this._min = min;
				this._max = max;
			} else {
				this._min = max;
				this._max = min;
			}
		} else {
			this._max = -Infinity;
			this._min = Infinity;
		}
	}
	get middle() {
		return (this.min + this.max) / 2;
	}
	set min(a) {
		const b = this._max;
		if (a < b) {
			this._min = a;
			this._max = b;
		} else {
			this._min = b;
			this._max = a;
		}
	}
	get min() {
		return this._min;
	}
	set max(a) {
		const b = this._min;
		if (a < b) {
			this._min = a;
			this._max = b;
		} else {
			this._min = b;
			this._max = a;
		}
	}
	get max() {
		return this._max;
	}
	get length() {
		return this.max - this.min;
	}
	clip(range) {
		return new Range(
			Number.clamp(this.min, range.min, range.max),
			Number.clamp(this.max, range.min, range.max)
		);
	}
	fromIntervalValue(interval) {
		return (this.max - this.min) * interval + this.min;
	}
	toIntervalValue(value) {
		return (value - this.min) / (this.max - this.min);
	}
	getDepth(value) {
		return (this.max - this.min) / 2 - Math.abs(value - (this.min + this.max) / 2);
	}
	includes(value) {
		return value >= this.min && value <= this.max;
	}
	include(value) {
		if (value < this.min) this._min = value;
		if (value > this.max) this._max = value;
	}
	intersect(r) {
		return this.max >= r.min && r.max >= this.min;
	}
	static fromValues(values) {
		let min = Infinity;
		let max = -Infinity;
		for (let i = 0; i < values.length; i++) {
			const v = values[i];
			if (v < min) min = v;
			if (v > max) max = v;
		}
		return new Range(min, max);
	}
}
class Shape {
	constructor() {
		this.area = 0;
	}
	get middle() {
		return new Vector2(0, 0);
	}
	center(pos) {
		return this.move(pos.minus(this.middle));
	}
	getModel(transf) { }
	scale(factor) {
		return this.scaleAbout(this.middle, factor);
	}
	scaleX(factor) {
		return this.scaleXAbout(this.middle.x, factor);
	}
	scaleY(factor) {
		return this.scaleYAbout(this.middle.y, factor);
	}
	scaleAbout(pos, factor) { }
	scaleXAbout(pos, factor) { }
	scaleYAbout(pos, factor) { }
	move(dir) { }
	getBoundingBox() { }
	equals(shape) { }
	intersectSameType() { }
	intersect(shape) {
		if (shape instanceof this.constructor)
			return this.intersectSameType(shape);
		return !!physicsAPICollideShapes(this, shape);
	}
	closestPointTo(point) { }
	distanceTo(point) {
		return Vector2.dist(point, this.closestPointTo(point));
	}
	containsPoint(point) {
		return this.closestPointTo(point).equals(point);
	}
	get(result = new Shape()) { }
	toPhysicsShape() { }
	static fromPhysicsShape(sh) { }
}

class Line extends Shape {
	constructor(x, y, x2, y2) {
		super();
		if (typeof x === "object") {
			this.a = new Vector2(x.x, x.y);
			this.b = new Vector2(y.x, y.y);
		} else {
			this.a = new Vector2(x, y);
			this.b = new Vector2(x2, y2);
		}
		this.area = 0;
	}
	get length() {
		return Vector2.dist(this.a, this.b);
	}
	get middle() {
		return this.a.Vplus(this.b).Nmul(0.5);
	}
	set vector(v) {
		this.b = this.a.Vplus(v.normalized.Nmul(this.length));
	}
	get vector() {
		return this.b.Vminus(this.a).normalize();
	}
	get slope() {
		const { a, b } = this;
		return (b.y - a.y) / (b.x - a.x);
	}
	get intercept() {
		return this.a.y - this.a.x * this.slope;
	}
	evaluate(x) {
		return this.slope * x + this.intercept;
	}
	getModel(transf) {
		const pos = transf.position;
		const cos = transf.cosRotation;
		const sin = transf.sinRotation;
		
		const { a, b } = this;

		return new Line(
			a.x * cos - a.y * sin + pos.x,
			a.x * sin + a.y * cos + pos.y,
			
			b.x * cos - b.y * sin + pos.x,
			b.x * sin + b.y * cos + pos.y
		);
	}
	center(pos) {
		return this.move(pos.Vminus(this.middle));
	}
	scaleAbout(pos, factor) {
		return new Line(
			this.a.minus(pos).mul(factor).add(pos),
			this.b.minus(pos).mul(factor).add(pos)
		);
	}
	scaleXAbout(x, factor) {
		return new Line(
			(this.a.x - x) * factor + x, this.a.y,
			(this.b.x - x) * factor + x, this.b.y
		);
	}
	scaleYAbout(y, factor) {
		return new Line(
			this.a.x, (this.a.y - y) * factor + y,
			this.b.x, (this.b.y - y) * factor + y
		);
	}
	move(dir) {
		return new Line(
			this.a.plus(dir),
			this.b.plus(dir)
		);
	}
	getBoundingBox() {
		const { a, b } = this;
		const minX = Math.min(a.x, b.x);
		const maxX = Math.max(a.x, b.x);
		const minY = Math.min(a.y, b.y);
		const maxY = Math.max(a.y, b.y);
		return new Rect(minX, minY, maxX - minX, maxY - minY);
	}
	equals(line) {
		if (!(line instanceof Line)) return false;
		return line.a.equals(this.a) && line.b.equals(this.b);
	}
	intersectSameType(line) {
		const check = l => {
			const dir = l.b.Vminus(l.a);
			const a = this.a.cross(dir);
			const b = this.b.cross(dir);
			const a2 = line.a.cross(dir);
			const b2 = line.b.cross(dir);
			const r1 = new Range(a, b);
			const r2 = new Range(a2, b2);
			return r1.intersect(r2);
		};
		return check(this) && check(line);
	}
	closestPointTo(point) {
		const v = this.b.Vminus(this.a);
		const { sqrMag } = v;
		const t = point.Vminus(this.a).dot(v) / sqrMag;
		return v.Ntimes(Number.clamp(t, 0, 1)).Vplus(this.a);
	}
	get(line = new Line(0, 0, 0, 0)) {
		line.a.set(this.a);
		line.b.set(this.b);
		return line;
	}
	static fromSlopeIntercept(m, b) {
		return new Line(
			0, b,
			1, b + m
		);
	}
}


class Polygon extends Shape {
	constructor(vertices) {
		super();
		if (vertices.length) {
			let length = vertices.length;
			vertices = vertices.slice(0, length);

			// make clockwise
			let signedArea = 0;
			for (let i = 0; i < length; i++) {
				let a = vertices[i];
				let b = vertices[(i + 1) % length];
				signedArea += (b.x - a.x) * (a.y + b.y) / 2;
			}
			if (signedArea > 0) vertices.reverse();

			this.vertices = Polygon.removeDuplicates(vertices);
			this.area = Math.abs(signedArea);
		} else {
			this.vertices = [];
			this.area = 0;
		}
	}
	get middle() {
		return Vector2.sum(this.vertices).Nover(this.vertices.length);
	}
	getBoundingBox() {
		return Rect.bound(this.vertices);
	}
	getModel(transf) {
		const pos = transf.position;
		const cos = transf.cosRotation;
		const sin = transf.sinRotation;
	
		return new Polygon(this.vertices
			.map(vert => new Vector2(
				vert.x * cos - vert.y * sin + pos.x,
				vert.x * sin + vert.y * cos + pos.y
			)
		), true);
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
	scaleAbout(pos, factor) {
		return new Polygon(this.vertices.map(e => e.Vminus(pos).Nmul(factor).Vadd(pos)));
	}
	scaleXAbout(pos, factor) {
		return new Polygon(this.vertices.map(e => new Vector2(pos + (e.x - pos) * factor, e.y)));
	}
	scaleYAbout(pos, factor) {
		return new Polygon(this.vertices.map(e => new Vector2(e.x, pos + (e.y - pos) * factor)));
	}
	move(dir) {
		return new Polygon(this.vertices.map(vert => vert.plus(dir)));
	}
	rotate(angle) {
		return this.getModel(new Transform(0, 0, angle));
	}
	equals(shape) {
		if (!(shape instanceof Polygon)) return false;
		if (shape.vertices.length !== this.vertices.length) return false;
		if (!shape.area.equals(this.area)) return false;
		for (let i = 0; i < this.vertices.length; i++)
			if (!this.vertices[i].equals(shape.vertices[i])) return false;
		return true;
	}
	intersectSameType(polygon) {
		return !!physicsAPICollideShapes(this, polygon);
	}
	closestPointTo(point) {
		let bestPoint = null;
		let bestDist = Infinity;

		const edges = this.getEdges();
		for (let i = 0; i < edges.length; i++) {
			const edge = edges[i];
			const closest = edge.closestPointTo(point);
			const dist = Vector2.sqrDist(point, closest);
			if (dist < bestDist) {
				bestDist = dist;
				bestPoint = closest;
			}
		}

		return bestPoint;
	}
	containsPoint(point) {
		const axes = [];
		const poly = this.vertices;
		for (let i = 0; i < poly.length; i++) {
			axes.push(poly[(i + 1) % poly.length].Vminus(poly[i]).normal.normalize());
		}
		for (let i = 0; i < axes.length; i++) {
			const axis = axes[i];
			const range = Range.fromValues(poly.map(v => v.dot(axis)));
			const proj = point.dot(axis);
			if (!range.includes(proj)) return false;
		}
		return true;
	
	}
	get(result = new Polygon([])) {
		result.vertices = this.vertices.map(vert => vert.get());
		result.area = this.area;
		return result;
	}
	toPhysicsShape() {
		return new PolygonCollider(this.vertices.map(v => v.toPhysicsVector()));
	}
	static fromPhysicsShape(sh) {
		return new Polygon(sh.vertices.map(v => Vector2.fromPhysicsVector(v)));
	}
	static regular(sides, radius) {
		let v = [];
		let o = Math.PI / sides;
		for (let i = 0; i < sides; i++)
			v.push(Vector2.fromAngle(i / sides * 2 * Math.PI + o).times(radius));
		return new Polygon(v, true);
	}
	static removeDuplicates(verts) {
		const vertices = [];

		mainLoop: for (let i = 0; i < verts.length; i++) {
			let v = verts[i];
			for (let j = 0; j < vertices.length; j++) {
				let v2 = vertices[j];
				if (v.equals(v2)) continue mainLoop;
			}
			vertices.push(v);
		}

		return vertices;
	}
}
class Rect extends Polygon {
	constructor(x, y, width, height) {
		super([]);
		if (width < 0) {
			width *= -1;
			x -= width;
		}
		if (height < 0) {
			height *= -1;
			y -= height;
		}
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.area = this.width * this.height;
	}
	get min() {
		return new Vector2(this.x, this.y);
	}
	get max() {
		return new Vector2(this.x + this.width, this.y + this.height);
	}
	get xRange() {
		return new Range(this.x, this.x + this.width);
	}
	get yRange() {
		return new Range(this.y, this.y + this.height);
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
	largestWithin(width, height) {
		let m = height / width;

		let w, h;

		if (m * this.width / 2 < this.height / 2) {
			w = this.width;
			h = m * this.width;
		} else {
			h = this.height;
			w = this.height / m;
		}

		return new Rect(this.width / 2 - w / 2 + this.x, this.height / 2 - h / 2 + this.y, w, h);
	}
	pack(rects) {
		rects.sort((a, b) => b.height - a.height);

		const spaces = [
			new Rect(this.x, this.y, this.width, Infinity)
		];

		for (let i = 0; i < rects.length; i++) {
			const rect = rects[i];

			for (let j = spaces.length - 1; j >= 0; j--) { // reverse loop
				const space = spaces[j];

				if (rect.width > space.width || rect.height > space.height) continue; // too big

				// insert
				rect.x = space.x;
				rect.y = space.y;

				// different possible positions
				if (rect.width === space.width && rect.height === space.height) { // delete space
					const lastSpace = spaces.pop();
					if (j < spaces.length) spaces[j] = lastSpace;
				} else if (rect.width === space.width) {
					space.y += rect.height;
					space.height -= rect.height;
				} else if (rect.height === space.height) {
					space.x += rect.width;
					space.width -= rect.width;
				} else {
					spaces.push(new Rect(
						space.x + rect.width,
						space.y,
						space.width - rect.width,
						rect.height
					));
					space.y += rect.height;
					space.height -= rect.height;
				}

				break;
			}
		}

		return rects;
	}
	packInOrder(rects) {
		const { x, y, width: totalWidth } = this;
		let ox = 0;
		let oy = 0;
		let lineHeight = 0;
		
		for (let i = 0; i < rects.length; i++) {
			const { width, height } = rects[i];
			if (height > lineHeight) lineHeight = height;
			
			// handle overflow
			if (ox + width > totalWidth) {
				oy += lineHeight;
				ox = 0;
			}

			rects[i].x = x + ox;
			rects[i].y = y + oy;

			ox += width;
		}

		return rects;
	}
	clip(rect) {
		let xRange = this.xRange.clip(rect.xRange);
		let yRange = this.yRange.clip(rect.yRange);
		return Rect.fromRanges(xRange, yRange);
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
	scaleX(factor) {
		factor -= 1;
		let dw = this.width * factor;
		return new Rect(this.x - dw / 2, this.y, this.width + dw, this.height);
	}
	scaleY(factor) {
		factor -= 1;
		let dh = this.height * factor;
		return new Rect(this.x, this.y - dh / 2, this.width, this.height + dh);
	}
	scaleAbout(pos, factor) {
		return new Rect((this.x - pos.x) * factor + pos.x, (this.y - pos.y) * factor + pos.y, this.width * factor, this.height * factor);
	}
	scaleXAbout(pos, factor) {
		return new Rect((this.x - pos) * factor + pos, this.y, this.width * factor, this.height);
	}
	scaleYAbout(pos, factor) {
		return new Rect(this.x, (this.y - pos) * factor + pos, this.width, this.height * factor);
	}
	move(dir) {
		return new Rect(this.x + dir.x, this.y + dir.y, this.width, this.height);
	}
	equals(shape) {
		if (!(shape instanceof Rect)) return false;
		if (!shape.area.equals(this.area)) return false;
		return 	this.x.equals(shape.x) &&
				this.y.equals(shape.y) &&
				this.width.equals(shape.width) &&
				this.height.equals(shape.height);
	}
	intersectSameType(rect) {
		return rect.x < this.x + this.width && rect.x + rect.width > this.x && rect.y < this.y + this.height && rect.y + rect.height > this.y;
	}
	closestPointTo(point) {
		return Vector2.clamp(point, this.min, this.max);
	}
	containsPoint(point) {
		return point.x > this.x && point.y > this.y && point.x < this.x + this.width && point.y < this.y + this.height;
	}
	get(result = new Rect(0, 0, 0, 0)) {
		result.x = this.x;
		result.y = this.y;
		result.width = this.width;
		result.height = this.height;
		result.area = this.area;
		return result;
	}
	static fromMinMax(min, max) {
		return new Rect(min.x, min.y, max.x - min.x, max.y - min.y);
	}
	static fromRanges(xRange, yRange) {
		return new Rect(xRange.min, yRange.min, xRange.length, yRange.length);
	}
	static bound(points) {
		if (!points.length) return new Rect(0, 0, 0, 0);

		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;
		for (let i = 0; i < points.length; i++) {
			let v = points[i]
			if (v.x < minX) minX = v.x;
			if (v.y < minY) minY = v.y;
			if (v.x > maxX) maxX = v.x;
			if (v.y > maxY) maxY = v.y;
		}
		return new Rect(minX, minY, maxX - minX, maxY - minY);
	}
	static composeBoundingBoxes(boxes) {
		if (boxes.length === 1) return boxes[0];
		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;
		for (let i = 0; i < boxes.length; i++) {
			let box = boxes[i];
			if (box.x < minX) minX = box.x;
			if (box.y < minY) minY = box.y;
			if (box.x + box.width > maxX) maxX = box.x + box.width;
			if (box.y + box.height > maxY) maxY = box.y + box.height;
		}
		return new Rect(minX, minY, maxX - minX, maxY - minY);
	}
}

class Circle extends Shape {
	constructor(x, y, radius) {
		super();
		this.x = x;
		this.y = y;
		this.radius = Math.abs(radius);
		this.area = this.radius ** 2 * Math.PI;
	}
	get middle() {
		return new Vector2(this.x, this.y);
	}
	getModel(transf) {
		const pos = transf.position;
		const cos = transf.cosRotation;
		const sin = transf.sinRotation;

		return new Circle(
			this.x * cos - this.y * sin + pos.x,
			this.x * sin + this.y * cos + pos.y,
			this.radius
		);
	}
	center(pos) {
		return new Circle(pos.x, pos.y, this.radius);
	}
	scale(factor) {
		return new Circle(this.x, this.y, this.radius * factor)
	}
	scaleX(factor) {
		return this.scale(factor);	
	}
	scaleY(factor) {
		return this.scale(factor);
	}
	scaleAbout(pos, factor) {
		let nPos = pos.plus((new Vector2(this.x, this.y)).Vminus(pos).Ntimes(factor));
		return new Circle(nPos.x, nPos.y, this.radius * factor);
	}
	scaleXAbout(pos, factor) {
		return this.scaleAbout(pos, factor);
	}
	scaleYAbout(pos, factor) {
		return this.scaleAbout(pos, factor);
	}
	move(dir) {
		return new Circle(this.x + dir.x, this.y + dir.y, this.radius);
	}
	getBoundingBox() {
		return new Rect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
	}
	equals(shape) {
		if (!(shape instanceof Circle)) return false;
		if (!shape.area.equals(this.area)) return false;
		return 	this.x.equals(shape.x) &&
				this.y.equals(shape.y) &&
				this.radius.equals(shape.radius);
	}	
	intersectSameType(circle) {
		return Vector2.sqrDist(circle, this) < (circle.radius + this.radius) ** 2;
	}
	closestPointTo(point) {
		const diff = new Vector2(point.x - this.x, point.y - this.y);
		diff.mag = this.radius;
		diff.add(this);
		return diff;
	}
	distanceTo(point) {
		return Vector2.dist(point, this.middle) - this.radius;
	}
	containsPoint(point) {
		return Vector2.sqrDist(point, this.middle) < this.radius ** 2;
	}
	get(shape = new Circle(0, 0, 0)) {
		shape.x = this.x;
		shape.y = this.y;
		shape.radius = this.radius;
		shape.area = this.area;
		return shape;
	}
	toPhysicsShape() {
		return new CircleCollider(this.x, this.y, this.radius);
	}
	static fromPhysicsShape(sh) {
		return new Circle(sh.position.x, sh.position.y, sh.radius);
	}
}