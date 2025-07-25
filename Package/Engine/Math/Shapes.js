/**
 * Represents an inclusive interval.
 * @implements Copyable
 * @prop Number min | The lower bound of the interval
 * @prop Number max | The upper bound of the interval
 */
class Range {
	/**
	 * Creates a new interval, optionally with a specific min and max.
	 * If the arguments are not in ascending order, they will be reversed.
	 * If no arguments are provided, the interval will be empty. 
	 * @signature
	 * @signature
	 * @param Number min | The lower bound 
	 * @param Number max | The upper bound
	 */
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
	/**
	 * Returns the mean value of the range.
	 * @return Number
	 */
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
	/**
	 * Returns the size of the interval represented by the range.
	 * @return Number
	 */
	get length() {
		return this.max - this.min;
	}
	/**
	 * Returns the set intersection between the caller and another range.
	 * @param Range range | The range to clip against 
	 * @return Range
	 */
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
	/**
	 * Returns the distance from a specified value to the closest bound of the range.
	 * If the value is inside the range, the distance will be positive, otherwise, it will be negative.
	 * @param Number value | The value to check the depth of
	 * @return Number
	 */
	getDepth(value) {
		return (this.max - this.min) / 2 - Math.abs(value - (this.min + this.max) / 2);
	}
	/**
	 * Checks whether a value is within the current bounds of the range.
	 * @param Number value | The value to check
	 * @return Range
	 */
	includes(value) {
		return value >= this.min && value <= this.max;
	}
	/**
	 * Expands the range to include a specified value.
	 * @param Number value | The value to include 
	 */
	include(value) {
		if (value < this.min) this._min = value;
		if (value > this.max) this._max = value;
	}
	/**
	 * Checks if there is any overlap between the caller and another range.
	 * @param Range range | The range to check against 
	 * @return Boolean
	 */
	intersect(r) {
		return this.max >= r.min && r.max >= this.min;
	}
	/**
	 * Increases the size of the range by evenly moving both bounds away from the center.
	 * @param Number padding | The amount to change each bound by. For example, a padding value of 10 will increase the length of the range by 20
	 */
	expand(padding) {
		this.min -= padding;
		this.max += padding;
	}
	get(result = new Range()) {
		result._min = this.min;
		result._max = this.max;
		return result;
	}
	/**
	 * Returns the smallest range that contains every one of a collection of values.
	 * @param Number[] values | The set of values to bound 
	 * @return Range
	 */
	static fromValues(values) {
		const { min, max } = Number.bound(values);
		return new Range(min, max);
	}
}

/**
 * @implements Copyable
 * @type class Shape<Matrix = any, Vector = any>
 * Represents a solid shape.
 * Within the documentation of this class, `Vector` refers to either `Vector2` or `Vector3` depending on whether the 2D or 3D subclass is used.
 * Similarly, `Matrix` refers to either `Matrix3` or `Matrix4`.
 * @abstract
 * @props<immutable>
 * @prop Vector middle | The geometric center of the shape
 */
class Shape {
	/**
	 * @name getModel
	 * Returns a copy of the shape after a certain transformation is applied to all its points.
	 * @param Matrix transform | The transformation to apply to the shape
	 * @return Shape
	 */
	/**
	 * Returns a copy of the shape scaled about a specified point.
	 * @param Vector/Number factor | The scale factor on each axis. If this is a number, it applies to all axes equally
	 * @param Vector position? | The scaling center. Default is the middle of the shape
	 * @return Shape
	 */
	scale(factor, position = this.middle) {
		return this.getModel(position.TransformMatrix.scaleAbout(factor, position));
	}
	/**
	 * Returns a copy of the shape centered at a specified location.
	 * @param Vector newCenter | The location of the new center 
	 * @return Shape
	 */
	center(pos) {
		return this.move(pos.minus(this.middle));
	}
	/**
	 * Returns a copy of the shape translated by a specified amount.
	 * @param Vector displacement | The amount to displace the shape by
	 * @return Shape 
	 */
	move(dir) {
		return this.getModel(dir.TransformMatrix.translation(dir));
	}
	/**
	 * Checks if two shapes are congruent.
	 * @param Shape other | The Shape to compare against
	 * @return Boolean 
	 */
	equals(shape) {
		return	shape instanceof this.constructor &&
				this.equalsSameType(shape)
	}
	/**
	 * Checks if two shapes intersect.
	 * @param Shape shape | The Shape to check intersections with
	 * @return Boolean
	 */
	intersect(shape) {
		if (shape instanceof this.constructor)
			return this.intersectSameType(shape);
		return !!physicsAPICollideShapes(this, shape);
	}
	/**
	 * @name closestPointTo
	 * Returns the closest point within the shape to a specified other point, including the boundary.
	 * @param Vector point | The target point
	 * @return Vector 
	 */
	/**
	 * Returns the distance from a specified point to the shape.
	 * If the point is inside the shape, this will return 0.
	 * @param Vector point | The target point 
	 * @return Number
	 */
	distanceTo(point) {
		return point.constructor.dist(point, this.closestPointTo(point));
	}
	/**
	 * Checks if a point is inside the shape, including points on the boundary.
	 * @param Vector point | The point to check 
	 * @return Boolean
	 */
	containsPoint(point) {
		return this.closestPointTo(point).equals(point);
	}
	/**
	 * @name rayCast
	 * Traces a ray until it intersects the caller.
	 * If the ray misses the shape, returns Infinity.
	 * If it hits, it returns the distance that the ray traveled prior to intersection.
	 * @param Vector origin | The starting point of the ray
	 * @param Vector direction | The unit vector in the direction of the ray
	 * @return Number
	 */
}

/**
 * Represents a 2D shape.
 * @type class Shape2D extends Shape<Matrix3, Vector2>
 * @abstract
 * @prop Number area | The area of the shape at the time of construction
 */
class Shape2D extends Shape {
	/**
	 * @name getBoundingBox
	 * Returns the smallest axis-aligned rectangle that contains the entire shape.
	 * @return Rect
	 */
}

/**
 * Represents a line segment.
 * @prop Vector2 a | The start point of the line segment
 * @prop Vector2 b | The end point of the line segment
 * @prop Vector2 vector | A vector from the start point of the line segment to the end point
 * @prop Vector2 normal | A normal vector to the line segment. Left-handed (in Screen-Space)
 * @prop Number length | THe length of the line segment
 * @prop Number slope | The slope of the line segment. If the line segment is vertical, this is infinite
 * @prop Number intercept | The y-intercept of the line segment if it were extended into a line
 */
class Line extends Shape2D {
	/**
	 * Creates a new Line.
	 * @signature
	 * @param Number x | The x coordinate of the start point of the line segment
	 * @param Number y | The y coordinate of the start point of the line segment
	 * @param Number x2 | The x coordinate of the end point of the line segment
	 * @param Number y2 | The y coordinate of the end point of the line segment
	 * @signature
	 * @param Vector2 start | The start point of the line segment
	 * @param Vector2 end | The end point of the line segment
	 */
	constructor(x, y, x2, y2) {
		super();
		if (typeof x === "object") {
			this.a = x.get();
			this.b = y.get();
		} else {
			this.a = new Vector2(x, y);
			this.b = new Vector2(x2, y2);
		}
		this.area = 0;
	}
	get length() {
		return this.a.constructor.dist(this.a, this.b);
	}
	get middle() {
		return this.a.plus(this.b).mul(0.5);
	}
	get vector() {
		return this.b.minus(this.a);
	}
	get normal() {
		return this._normal ??= this.vector.normal.invert();
	}
	get slope() {
		const { a, b } = this;
		return (b.y - a.y) / (b.x - a.x);
	}
	get intercept() {
		return this.a.y - this.a.x * this.slope;
	}
	/**
	 * Computes the y coordinate on the line for a given x coordinate. This is calculated as if it were a line, rather than a line segment.
	 * @param Number x | The x coordinate to calculate the y at.
	 * @return Number
	 */
	evaluate(x) {
		return this.slope * x + this.intercept;
	}
	getModel(transf) {
		return new this.constructor(transf.times(this.a), transf.times(this.b));
	}
	getBoundingBox() {
		return Rect.bound([this.a, this.b]);
	}
	equalsSameType(line) {
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
		const v = this.b.minus(this.a);
		const { sqrMag } = v;
		const t = point.minus(this.a).dot(v) / sqrMag;
		return v.times(Number.clamp(t, 0, 1)).plus(this.a);
	}
	get(line = new Line(0, 0, 0, 0)) {
		line.a.set(this.a);
		line.b.set(this.b);
		return line;
	}
	rayCast(ro, rd) {
		const rayOrigin = ro;
		const rayVector = rd;
		const lineOrigin = this.a;
		const lineVector = this.b.minus(this.a);
		const a = rayVector.x;
		const b = lineVector.x;
		const c = rayVector.y;
		const d = lineVector.y;
		const det = a * d - b * c;
		if (!det) return Infinity;
		const invDet = 1 / det;
		const diff = lineOrigin.minus(rayOrigin);
		const t = invDet * (d * diff.x - b * diff.y);
		const s = invDet * (c * diff.x - a * diff.y);
		
		const EPSILON_T = Vector2.EPSILON;
		if (t < -EPSILON_T) return Infinity;
		
		const EPSILON_S = Vector2.EPSILON / lineVector.mag;
		if (s < -EPSILON_S || s > 1 + EPSILON_S) return Infinity;

		return t;
	}
	/**
	 * Creates a new line segment with a specified slope and intercept.
	 * The start point is at the y-intercept, and the end point is at x = 1.
	 * @param Number m | The slope of the line segment
	 * @param Number b | The y-intercept of the line segment
	 * @return Line
	 */
	static fromSlopeIntercept(m, b) {
		return new Line(0, b, 1, b + m);
	}
}

/**
 * Represents a contiguous 2D polygon with no holes.
 * @prop Vector2[] vertices | The vertices of the border of the polygon, they are in a clockwise order.
 */
class Polygon extends Shape2D {
	/**
	 * Creates a new Polygon.
	 * @param Vector2[] vertices | The vertices for the new polygon. They can be ordered either clockwise or counter-clockwise
	 */
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
		return Vector2.avg(this.vertices);
	}
	getBoundingBox() {
		return Rect.bound(this.vertices);
	}
	getModel(transf) {
		return new Polygon(this.vertices.map(v => transf.times(v)), true);
	}
	/**
	 * @group getEdges/getFaces
	 * Returns the edges of the polygon.
	 * @return Line[]
	 */
	getEdges() {
		if (this._edges === undefined) {
			const edges = [];
			const { vertices } = this;
			for (let i = 0; i < vertices.length; i++)
				edges.push(new Line(vertices[i], vertices[(i + 1) % vertices.length]));
			this._edges = edges;
		}

		return this._edges;
	}
	getFaces() {
		return this.getEdges();
	}
	/**
	 * Returns a copy of the polygon rotated clockwise (in Screen-Space) by a specified angle.
	 * @param Number angle | The angle to rotate by (in radians)
	 * @return Polygon 
	 */
	rotate(angle) {
		return this.getModel(Matrix3.rotation(angle));
	}
	equalsSameType(shape) {
		const v1 = this.vertices;
		const v2 = shape.vertices;
		return	v1.length === v2.length &&
				v1.every((v, i) => v.equals(v2[i]));
	}
	intersectSameType(polygon) {
		return !!physicsAPICollideShapes(this, polygon);
	}
	closestPointTo(point) {
		let bestPoint = null;
		let bestDist = Infinity;

		let inside = true;

		const faces = this.getFaces();
		for (let i = 0; i < faces.length; i++) {
			const face = faces[i];
			const { normal } = face;
			
			inside &&= normal.dot(point) < normal.dot(face.a);

			const closest = face.closestPointTo(point);
			const dist = point.constructor.sqrDist(point, closest);
			if (dist < bestDist) {
				bestDist = dist;
				bestPoint = closest;
			}
		}

		return inside ? point.get() : bestPoint;
	}
	/**
	 * Checks whether a given point is inside the polygon (including the boundary).
	 * The behavior of this method is undefined if the polygon is concave.
	 * @param Vector2 point | The point to check
	 * @return Boolean
	 */
	containsPoint(point) {
		const faces = this.getFaces();
		for (let i = 0; i < faces.length; i++) {
			const { normal, a } = faces[i];
			if (normal.dot(point) > normal.dot(a)) return false;
		}
		return true;
	}
	get(result = new Polygon([])) {
		result.vertices = this.vertices.map(vert => vert.get());
		result.area = this.area;
		return result;
	}
	toPhysicsShape() {
		const vertices = new Physics2.Array_VectorN_2__0(this.vertices.length);
		for (let i = 0; i < this.vertices.length; i++)
			this.vertices[i].toPhysicsVector(vertices.get(i));
		const polytope = new Physics2.Polytope(vertices);
		vertices.delete();

		return polytope;
	}
	rayCast(ro, rd, maxDist = Infinity) {
		const originDot = ro.dot(rd);
		if (this.vertices.every(vertex => vertex.dot(rd) < originDot))
			return Infinity;
		
		const threshold = maxDist + originDot;
		if (this.vertices.every(vertex => vertex.dot(rd) > threshold))
			return Infinity;

		let bestDist = maxDist;
		const faces = this.getFaces();
		for (let i = 0; i < faces.length; i++) {
			const face = faces[i];
			if (face.normal.dot(rd) < 0) {
				const t = face.rayCast(ro, rd, bestDist);
				if (t < bestDist) bestDist = t;
			}
		}
		return bestDist;
	}
	/**
	 * Returns a new regular polygon centered at the origin with a specified amount of sides and radius.
	 * @param Number sides | The number of sides of the polygon
	 * @param Number radius | The distance from the center to each vertex
	 * @return Polygon
	 */
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

/**
 * Represents an axis-aligned rectangle.
 * @prop Number x | The x coordinate of the upper-left corner of the rectangle
 * @prop Number y | The y coordinate of the upper-left corner of the rectangle
 * @prop Number width | The width of the rectangle
 * @prop Number height | The height of the rectangle
 * @prop Vector2 min | The upper-left corner of the rectangle
 * @prop Vector2 max | The lower-right corner of the rectangle
 * @prop Range xRange | The horizontal interval that contains the rectangle
 * @prop Range yRange | The vertical interval that contains the rectangle
 */
class Rect extends Polygon {
	/**
	 * Creates a new Rect. The width and height can be negative and will extend the rectangle to the left and top respectively.
	 * @param Number x | The x coordinate of the upper-left corner of the rectangle
	 * @param Number y | The y coordinate of the upper-left corner of the rectangle
	 * @param Number width | The width of the rectangle
	 * @param Number height | The height of the rectangle
	 */
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
		this.xRange = new Range(this.x, this.x + this.width);
		this.yRange = new Range(this.y, this.y + this.height);
	}
	get min() {
		return new Vector2(this.x, this.y);
	}
	get max() {
		return new Vector2(this.x + this.width, this.y + this.height);
	}
	get middle() {
		return new Vector2(this.x + this.width / 2, this.y + this.height / 2);
	}
	get vertices() {
		return this._vertices ??= [
			new Vector2(this.x, this.y),
			new Vector2(this.x + this.width, this.y),
			new Vector2(this.x + this.width, this.y + this.height),
			new Vector2(this.x, this.y + this.height)
		];
	}
	set vertices(a) { } // this does nothing and exists to make the Polygon constructor not crash
	/**
	 * Returns the largest rectangle with a given aspect ratio that fits within the caller, centered at the center of the caller. 
	 * @param Number width | The width of the hypothetical rectangle from which to determine the aspect ratio 
	 * @param Number height | The height of the hypothetical rectangle from which to determine the aspect ratio
	 * @return Rect
	 */
	largestWithin(width, height) {
		const m = height / width;

		let w, h;

		if (m < this.height / this.width) {
			w = this.width;
			h = m * this.width;
		} else {
			h = this.height;
			w = this.height / m;
		}

		return new Rect(
			this.width / 2 - w / 2 + this.x,
			this.height / 2 - h / 2 + this.y,
			w, h
		);
	}
	cullBox(box) {
		return !this.intersectSameType(box);
	}
	cullPoint(point) {
		return !this.containsPoint(point);
	}
	move(dir) {
		return new Rect(
			this.x + dir.x, this.y + dir.y,
			this.width, this.height
		);
	}
	scale(scale, center = this.middle) {
		const mat = Matrix3.scaleAbout(scale, center);
		return Rect.fromMinMax(mat.times(this.min), mat.times(this.max));
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
	/**
	 * Returns the region of intersection between the caller and another rectangle.
	 * @param Rect rect | The rectangle to intersect with  
	 * @return Rect
	 */
	clip(rect) {
		return Rect.fromRanges(
			this.xRange.clip(rect.xRange),
			this.yRange.clip(rect.yRange)
		);
	}
	getBoundingBox() {
		return this.get();
	}
	move(dir) {
		return Rect.fromMinMax(this.min.add(dir), this.max.add(dir));
	}
	equalsSameType(shape) {
		return	this.min.equals(shape.min) &&
				this.max.equals(shape.max);
	}
	intersectSameType(rect) {
		return	this.xRange.intersect(rect.xRange) &&
				this.yRange.intersect(rect.yRange);
	}
	closestPointTo(point) {
		return Vector.clamp(point, this.min, this.max);
	}
	containsPoint(point) {
		return	this.xRange.includes(point.x) &&
				this.yRange.includes(point.y);
	}
	get(result = new Rect(0, 0, 0, 0)) {
		result.x = this.x;
		result.y = this.y;
		result.width = this.width;
		result.height = this.height;
		result.area = this.area;
		return result;
	}
	/**
	 * Returns a new rectangle with the specified minimum and maximum coordinates.
	 * @param Vector2 min | The upper-left corner of the rectangle 
	 * @param Vector2 max | The lower-right corner of the rectangle 
	 * @return Rect
	 */
	static fromMinMax(min, max) {
		return new Rect(min.x, min.y, max.x - min.x, max.y - min.y);
	}
	/**
	 * Returns a new rectangle with the specified vertical and horizontal spans.
	 * @param Range xRange | The horizontal span of the rectangle
	 * @param Range yRange | The vertical span of the rectangle
	 * @return Rect
	 */
	static fromRanges(xRange, yRange) {
		return new Rect(xRange.min, yRange.min, xRange.length, yRange.length);
	}
	/**
	 * Returns a new rectangle with specified dimensions centered at the origin.
	 * @signature
	 * @param Vector2 dimensions | A vector containing (width, height)
	 * @signature
	 * @param Number width | The width of the rectangle
	 * @param Number height | The height of the rectangle
	 * @return Rect
	 */
	static fromDimensions(x, y) {
		if (typeof x === "object") ({ x, y } = x);
		return new Rect(-x * 0.5, -y * 0.5, x, y);
	}
	/**
	 * Returns the smallest bounding rectangle around a collection of points.
	 * @param Vector2[] points | The points to create a bounding box for
	 * @return Rect
	 */
	static bound(points) {
		if (!points.length) return new Rect(0, 0, 0, 0);
		const { min, max } = Vector2.bound(points);
		return Rect.fromMinMax(min, max);
	}
	/**
	 * Returns the smallest bounding rectangle around a collection of rectangles.
	 * @param Rect[] boxes | The rectangles to create a bounding box for 
	 * @return Rect
	 */
	static composeBoundingBoxes(boxes) {
		if (boxes.length === 1) return boxes[0];
		return this.bound(
			boxes.flatMap(box => [box.min, box.max])
		);
	}
}
ND.Box = Rect;

/**
 * Represents a circle.
 * @prop Vector2 position | The center of the circle
 * @prop Number radius | The radius of the circle
 */
class Circle extends Shape2D {
	/**
	 * Creates a new Circle.
	 * @param Vector2 position | The center of the circle 
	 * @param Number radius | The radius of the circle 
	 */
	constructor(position, radius) {
		super();
		this.position = position.get();
		this.radius = Math.abs(radius);
	}
	get area() {
		return Math.PI * this.radius ** 2;
	}
	get middle() {
		return this.position.get();
	}
	getModel(transf) {
		return new this.constructor(
			transf.times(this.position),
			this.radius * transf.maxHomogenousScaleFactor
		);
	}
	getBoundingBox() {
		return new Rect(
			this.position.x - this.radius,
			this.position.y - this.radius,
			this.radius * 2, this.radius * 2
		);
	}
	equalsSameType(shape) {
		return	this.position.equals(shape.position) &&
				this.radius.equals(shape.radius);
	}
	intersectSameType(circle) {
		return Vector.sqrDist(circle.position, this.position) < (circle.radius + this.radius) ** 2;
	}
	closestPointTo(point) {
		const diff = point.minus(this.position);
		if (diff.sqrMag > this.radius ** 2)
			diff.mag = this.radius;
		return diff.add(this.position);
	}
	distanceTo(point) {
		return Math.max(0, Vector.dist(point, this.position) - this.radius);
	}
	containsPoint(point) {
		return Vector.sqrDist(point, this.position) < this.radius ** 2;
	}
	get(shape = new Circle(Vector2.zero, 0)) {
		shape.x = this.x;
		shape.y = this.y;
		shape.radius = this.radius;
		return shape;
	}
	rayCast(ro, rd) {
		const toCenter = this.position.minus(ro);
		const centerT = toCenter.dot(rd);
		if (centerT < 0) return Infinity;
		const radius = toCenter.without(rd).mag;
		if (radius > this.radius) return Infinity;
		const t = centerT - Math.sqrt(this.radius ** 2 - radius ** 2);
		return t < 0 ? Infinity : t;
	}
	toPhysicsShape() {
		const center = this.position.toPhysicsVector();
		const ball = new Physics2.Ball(center, this.radius);
		center.delete();
		return ball;
	}
}