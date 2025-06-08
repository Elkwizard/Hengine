/**
 * Represents a 3D shape.
 * @type class Shape3D extends Shape<Matrix4, Vector3>
 * @abstract
 * @prop Number volume | The amount of space contained within the shape
 */
class Shape3D extends Shape {
	/**
	 * @name getBoundingBox
	 * Returns the smallest axis-aligned rectangular prism that contains the entire shape.
	 * @return Prism
	 */
}

/**
 * Represents a line segment in 3D space.
 * @prop Vector3 a | The beginning of the line segment
 * @prop Vector3 b | The end of the line segment
 * @prop Number length | The length of the line segment
 * @prop Vector3 vector | The vector from `.a` to `.b`
 */
class Line3D extends Shape3D {
	constructor(a, b) {
		super();
		this.a = a.get();
		this.b = b.get();
		this.volume = 0;
	}
	getBoundingBox() {
		return Prism.bound([this.a, this.b]);
	}
	get(result = new Line3D(Vector3.zero, Vector3.zero)) {
		result.a.set(this.a);
		result.b.set(this.b);
		return result;
	}
}
objectUtils.inherit(Line3D, Line, [
	"length", "middle", "vector",
	"getModel", "equalsSameType"
]);

/**
 * Represents a triangle in 3D space.
 * @prop Vector3 a | The first vertex of the triangle
 * @prop Vector3 b | The second vertex of the triangle
 * @prop Vector3 c | The third vertex of the triangle
 * @prop Vector3 normal | The unit surface normal of the triangle
 * @prop Number area | The area of the triangle
 */
class Triangle extends Shape3D {
	/**
	 * Creates a new triangle.
	 * @param Vector3[3] ...points | The points of the triangle
	 */
	constructor(a, b, c) {
		super();
		this.a = a;
		this.b = b;
		this.c = c;
		this.normal = this.b.minus(this.a).cross(this.c.minus(this.a));
		const { mag } = this.normal;
		this.normal.div(mag);
		this.area = 0.5 * Math.abs(mag);
	}
	getModel(transf) {
		return new Triangle(
			transf.times(this.a),
			transf.times(this.b),
			transf.times(this.c)
		);
	}
	closestPointTo(point) {
		point = point.minus(this.a);
		point.sub(point.dot(this.normal));

		const u = this.c.minus(this.a);
		const v = this.b.minus(this.a);
		const mat = new Matrix3(u, v, u.cross(v));
		const t = mat.inverse.times(point);
		t.x = Math.max(0, t.x);
		t.y = Math.max(0, t.y);
		t.z = 0;

		mat.times(t, point);
		point.add(this.a);

		if (t.x > 1 || t.y > 1 || t.y > 1 - t.x) {
			const a = this.b;
			const b = this.c;
			const vec = b.minus(a);
			point.sub(b);
			const t = Number.clamp(point.dot(vec) / vec.sqrMag, 0, 1);
			return vec.times(t, point).add(a);
		}

		return point;
	}
	get(result = new Triangle(Vector3.zero, Vector3.zero, Vector3.zero)) {
		result.a = this.a.get();
		result.b = this.b.get();
		result.c = this.c.get();
		return result;
	}
	rayCast(ro, rd) {
		const t = this.plane.rayCast(ro, rd);
		if (!isFinite(t)) return Infinity;

		const point = rd.times(t).add(ro);

		const fromA = point.minus(this.a);		
		const fromB = point.minus(this.b);
		const fromC = point.minus(this.c);

		if (fromA.cross(fromB).dot(this.normal) < -Vector3.EPSILON) return Infinity;
		if (fromB.cross(fromC).dot(this.normal) < -Vector3.EPSILON) return Infinity;
		if (fromC.cross(fromA).dot(this.normal) < -Vector3.EPSILON) return Infinity;

		return t;
	}
	/**
	 * Returns the plane in which the triangle resides.
	 * @return Plane
	 */
	get plane() {
		return new Plane(this.normal, this.a.dot(this.normal));
	}
}

/**
 * Represents a closed 3D polyhedron as a collection of contiguous triangles.
 * @prop Vector3[] vertices | The vertices of the polyhedron
 * @prop Number[] indices | An array representing the triangles of the polyhedron. Every three indices in the array specify the locations in the `.vertices` array which make up a triangle 
 */
class Polyhedron extends Shape3D {
	constructor(vertices, indices) {
		super();
		this.vertices = vertices;
		this.indices = indices;
	}
	get volume() {
		if (this._volume === undefined) {
			this._volume = 0;
			const { indices, vertices } = this;
			for (let i = 0; i < indices.length; i += 3) {
				const a = vertices[indices[i + 0]];
				const b = vertices[indices[i + 1]];
				const c = vertices[indices[i + 2]];
				this._volume += a.dot(b.cross(c)) / 6;
			}
			if (this._volume < 0) {
				this._volume *= -1;
				for (let i = 0; i < indices.length; i += 3)
					[indices[i], indices[i + 2]] = [indices[i + 2], indices[i]];
			}
		}

		return this._volume;
	}
	get middle() {
		return (this._middle ??= Vector3.avg(this.vertices)).get();
	}
	equalsSameType(shape) {
		const { vertices: v1, indices: i1 } = this;
		const { vertices: v2, indices: i2 } = shape;
		return	i1.length === i2.length &&
				v1.length === v2.length &&
				i1.every((n, i) => n === i2[i]) &&
				v1.every((v, i) => v.equals(v2[i]));
	}
	/**
	 * Returns a set of unique lines that represent the edges of the faces of the polyhedron.
	 * @return Line3D[]
	 */
	getEdges() {
		if (this._edges === undefined) {
			const edges = [];
			
			const { vertices, indices } = this;
			
			const found = vertices.map(() => new Set());
			const addEdge = (i, j) => {
				if (j < i) {
					const temp = j;
					j = i;
					i = temp;
				}
	
				const set = found[i];
				if (!set.has(j)) {
					set.add(j);
					edges.push(new Line3D(vertices[i], vertices[j]));
				}
			};
	
			for (let i = 0; i < indices.length; i += 3) {
				const a = indices[i + 0];
				const b = indices[i + 1];
				const c = indices[i + 2];
				addEdge(a, b);
				addEdge(b, c);
				addEdge(c, a);
			}
	
			this._edges = edges;
		}

		return this._edges;
	}
	/**
	 * Returns a set of triangles making up the surface of the polyhedron.
	 * @return Triangle[]
	 */
	getFaces() {
		if (this._faces === undefined) {
			const triangles = [];
			const { vertices, indices } = this;
			for (let i = 0; i < indices.length; i += 3)
				triangles.push(new Triangle(
					vertices[indices[i + 0]],
					vertices[indices[i + 1]],
					vertices[indices[i + 2]]
				));
			
			this._faces = triangles;
		}

		return this._faces;
	}
	getModel(transform) {
		return new Polyhedron(
			this.vertices.map(vertex => transform.times(vertex)),
			this.indices
		);
	}
	rotate(axis, angle) {
		return this.getModel(Quaternion.fromRotation(axis, angle).toMatrix());
	}
	get(result = new Polyhedron([], [])) {
		result.vertices = this.vertices.map(vertex => vertex.get());
		result.indices = [...this.indices];
		return result;
	}
	getBoundingBox() {
		return Prism.bound(this.vertices);
	}
	toPhysicsShape() {
		const vertices = new Physics.Array_VectorN_3__0(this.vertices.length);
		const indices = new Physics.Array_int_0(this.indices.length);
		for (let i = 0; i < this.vertices.length; i++)
			this.vertices[i].toPhysicsVector(vertices.get(i));
		for (let i = 0; i < this.indices.length; i++)
			indices.set(i, this.indices[i]);

		const result = new Physics.Polytope(vertices, indices);

		vertices.delete();
		indices.delete();
		
		return result;
	}
	/**
	 * Subdivides each triangle in the polyhedron into a power of 4 number of additional triangles.
	 * The subdivided mesh is a copy and is returned.
	 * @param Number count? | The power of 4 to multiply the triangle count by. Default is 1
	 * @return Polyhedron
	 */
	subdivide(count = 1) {
		let current = this;

		for (let i = 0; i < count; i++) {
			const newVertices = [...current.vertices];
			const newIndices = [];
			for (let i = 0; i < current.indices.length; i += 3) {
				const indexA = current.indices[i + 0];
				const indexB = current.indices[i + 1];
				const indexC = current.indices[i + 2];
				const a = current.vertices[indexA];
				const b = current.vertices[indexB];
				const c = current.vertices[indexC];
	
				const ab = a.plus(b).over(2);
				const bc = b.plus(c).over(2);
				const ac = a.plus(c).over(2);
				const indexAB = newVertices.push(ab) - 1;
				const indexBC = newVertices.push(bc) - 1;
				const indexAC = newVertices.push(ac) - 1;
				
				newIndices.push(
					indexA, indexAB, indexAC,
					indexAB, indexB, indexBC,
					indexBC, indexC, indexAC,
					indexAC, indexAB, indexBC
				);
			}
	
			current = new Polyhedron(newVertices, newIndices);
		}

		return current;
	}
	/**
	 * Creates a new polyhedron by transforming every vertex using a given function.
	 * @param (Vector3) => Vector3 vertexTransform | The function to apply to each vertex
	 * @return Polyhedron
	 */
	map(vertexTransform) {
		return new Polyhedron(
			this.vertices.map(vertexTransform),
			this.indices
		);
	}
	/**
	 * Creates a new polyhedron from a list of triangles which form a closed surface.
	 * @param Triangle[] triangles | The triangles to use as the surface
	 * @return Polyhedron
	 */
	static fromTriangles(triangles) {
		const vertices = triangles.flatMap(tri => [tri.a, tri.b, tri.c]);
		return new Polyhedron(vertices, vertices.map((_, i) => i));
	}
	/**
	 * Creates a polyhedron that resembles a sphere to a given level of precision.
	 * @param Sphere sphere | The sphere to approximate
	 * @param Number subdivisions? | The amount of times to apply `.subdivide()` to the sphere. Default is 2
	 * @return Polyhedron
	 */
	static fromSphere(sphere, subdivisions = 2) {
		const { position, radius } = sphere;

		const result = new Prism(new Vector3(-radius), new Vector3(radius));
		const subdivided = result.subdivide(subdivisions);
		return subdivided.map(vertex => {
			vertex.mag = radius;
			return vertex.add(position);
		});
	}
	/**
	 * Creates a polyhedron that resembles a cylinder to a given level of precision.
	 * @param Cylinder cylinder | The cylinder to approximate
	 * @param Number steps? | The amount of vertices to use around the circular faces. Default is 8
	 * @return Polyhedron
	 */
	static fromCylinder(cylinder, steps = 8) {
		const { position, radius, axis, length } = cylinder;
		const capVertices = Polygon.regular(steps, 1).vertices;

		const bottomCap = capVertices
			.map(vertex => new Vector3(vertex.x, vertex.y, -1));
		const topCap = capVertices
			.map(vertex => new Vector3(vertex.x, vertex.y, 1));

		const vertices = [];
		const indices = [];

		const addVertices = (cap, reverse) => {
			const start = vertices.length;
			vertices.push(...cap);

			for (let i = 2; i < cap.length; i++) {
				const tri = [start, start + i - 1, start + i];
				if (reverse) tri.reverse();
				indices.push(...tri);
			}
		};

		const bottomIndex = vertices.length;
		addVertices(bottomCap, false);
		const topIndex = vertices.length;
		addVertices(topCap, true);

		for (let i = 0; i < bottomCap.length; i++) {
			const a = bottomIndex + i;
			const b = bottomIndex + (i + 1) % bottomCap.length;
			const c = topIndex + i;
			const d = topIndex + (i + 1) % topCap.length;

			indices.push(
				c, b, a,
				c, d, b
			);
		}

		const right = axis.normal.normalize().mul(radius);
		const up = right.cross(axis).normalize().mul(radius);
		const forward = axis.times(length / 2);
		const translation = position;
		
		const local = new Polyhedron(vertices, indices);
		const transform = new Matrix4(right, up, forward, translation);
		return local.getModel(transform);
	}
}
objectUtils.inherit(Polyhedron, Polygon, ["closestPointTo", "rayCast"]);

/**
 * Represents an axis-aligned rectangular prism.
 * @name_subs C: x, y, z
 * @prop Number [C] | The C coordinate of the left-upper-front corner
 * @prop Number width | The x axis size of the prism
 * @prop Number height | The y axis size of the prism
 * @prop Number depth | The z axis size of the prism
 * @prop Range [C]Range | The interval of the C axis occupied by the prism
 * @prop Vector3 min | The left-upper-front corner
 * @prop Vector3 max | The right-lower-back corner
 */
class Prism extends Polyhedron {
	/**
	 * Creates a new rectangular prism.
	 * @param Vector3 min | The left-upper-front corner of the prism
	 * @param Vector3 max | The right-lower-back corner of the prism
	 */
	constructor(min, max) {
		super();
		this.xRange = new Range(min.x, max.x);
		this.yRange = new Range(min.y, max.y);
		this.zRange = new Range(min.z, max.z);
	}
	set indices(a) { }
	get indices() {
		return this._indices ??= [
			// back
			2, 1, 0,
			2, 3, 1,
			
			// bottom
			6, 3, 2,
			6, 7, 3,

			// front
			4, 7, 6,
			4, 5, 7,

			// top
			0, 5, 4,
			0, 1, 5,

			// right
			3, 5, 1,
			3, 7, 5,

			// left
			6, 0, 4,
			6, 2, 0
		];
	}
	set vertices(a) { }
	get vertices() {
		const x = this.xRange;
		const y = this.yRange;
		const z = this.zRange;
		return [
			new Vector3(x.min, y.min, z.min),
			new Vector3(x.max, y.min, z.min),
			new Vector3(x.min, y.max, z.min),
			new Vector3(x.max, y.max, z.min),
			new Vector3(x.min, y.min, z.max),
			new Vector3(x.max, y.min, z.max),
			new Vector3(x.min, y.max, z.max),
			new Vector3(x.max, y.max, z.max)
		];
	}
	get x() {
		return this.xRange.min;
	}
	get y() {
		return this.yRange.min;
	}
	get z() {
		return this.zRange.min;
	}
	get width() {
		return this.xRange.length;
	}
	get height() {
		return this.xRange.length;
	}
	get depth() {
		return this.xRange.length;
	}
	get min() {
		return new Vector3(this.xRange.min, this.yRange.min, this.zRange.min);
	}
	get max() {
		return new Vector3(this.xRange.max, this.yRange.max, this.zRange.max);
	}
	get middle() {
		return this.min.plus(this.max).div(2);
	}
	get(result = new Prism(Vector3.zero, Vector3.zero)) {
		this.xRange.get(result.xRange);
		this.yRange.get(result.yRange);
		this.zRange.get(result.zRange);
		return result;
	}
	/**
	 * Returns a prism representing the points in both the caller and another given prism.
	 * @param Prism prism | The prism to intersect with
	 * @return Prism
	 */
	clip(prism) {
		const xRange = this.xRange.clip(prism.xRange);
		const yRange = this.yRange.clip(prism.yRange);
		const zRange = this.zRange.clip(prism.zRange);
		return Prism.fromRanges(xRange, yRange, zRange);
	}
	containsPoint(point) {
		return	this.xRange.includes(point.x) &&
				this.yRange.includes(point.y) &&
				this.zRange.includes(point.z);
	}
	intersectSameType(prism) {
		return	this.xRange.intersect(prism.xRange) &&
				this.yRange.intersect(prism.yRange) &&
				this.zRange.intersect(prism.zRange);
	}
	getBoundingBox() {
		return this.get();
	}
	move(dir) {
		return new Prism(
			this.min.plus(dir),
			this.max.plus(dir)
		);
	}
	scale(scale, center = this.middle) {
		const mat = Matrix4.scaleAbout(scale, center);
		return new Prism(mat.times(this.min), mat.times(this.max));
	}
	/**
	 * Creates a rectangular prism from a set of intervals.
	 * @param Range xRange | The interval on the x axis occupied by the prism
	 * @param Range yRange | The interval on the y axis occupied by the prism
	 * @param Range zRange | The interval on the z axis occupied by the prism
	 * @return Prism
	 */
	static fromRanges(xRange, yRange, zRange) {
		return new Prism(
			new Vector3(xRange.min, yRange.min, zRange.min),
			new Vector3(xRange.max, yRange.max, zRange.max)
		);
	}
	/**
	 * Creates a rectangular prism from a given minimum and maximum point.
	 * @param Vector3 min | The left-upper-front corner of the prism
	 * @param Vector3 max | The right-lower-back corner of the prism
	 * @return Prism
	 */
	static fromMinMax(min, max) {
		return new Prism(min, max);
	}
	/**
	 * Computes the smallest rectangular prism that contains a set of points and returns it.
	 * @param Vector3[] points | The points to contain
	 * @return Prism
	 */
	static bound(points) {
		if (!points.length) return new Prism(Vector3.zero, Vector3.zero);
		const { min, max } = Vector3.bound(points);
		return new Prism(min, max);
	}
	/**
	 * @name static composeBoundingBoxes
	 * Computes the smallest bounding rectangular prism the contains a set of other rectangular prisms.
	 * @param Prism[] boxes | The boxes to contain
	 * @return Prism
	 */
}
objectUtils.inherit(Prism, Rect, ["equalsSameType", "closestPointTo", "equalsSameType"]);
Prism.composeBoundingBoxes = Rect.composeBoundingBoxes;
ND.Box = Prism;

/**
 * Represents an infinite plane in 3D space.
 * @prop Vector3 normal | The unit normal vector to the plane
 * @prop Number distance | The distance from the plane to the origin 
 */
class Plane extends Shape3D {
	/**
	 * Creates a new plane.
	 * @prop Vector3 normal | A normal vector to the plane
	 * @prop Number distance | The dot product between the given normal vector and any point on the plane 
	 */
	constructor(normal, distance) {
		super();
		const { mag } = normal;
		this.distance = distance / mag;
		this.normal = normal.over(mag);
	}
	get middle() {
		return this.normal.times(this.distance);
	}
	get volume() {
		return 0;
	}
	getBoundingBox() {
		return new Prism(Vector3.filled(-Infinity), Vector3.filled(Infinity));
	}
	equalsSameType(shape) {
		return	shape.normal.equals(this.normal) && 
				shape.distance.equals(this.distance);
	}
	get(result = new Plane(Vector3.zero, 0)) {
		result.normal = this.normal.get();
		result.distance = this.distance;
		return result;
	}
	closestPointTo(point) {
		return point.minus(this.normal.times(
			point.dot(this.normal) - this.distance
		));
	}
	containsPoint(point) {
		return point.dot(this.normal).equals(this.distance);
	}
	distanceTo(point) {
		return Math.abs(point.dot(this.normal) - this.distance);
	}
	intersectSameType(plane) {
		return !plane.normal.equals(this.normal) || this.distance.equals(plane.distance);
	}
	getModel(transform) {
		const normal = Matrix3.normal(transform).times(this.normal);
		const point = this.normal.times(this.distance);
		const distance = normal.dot(transform.times(point));
		return new Plane(normal, distance);
	}
	rayCast(ro, rd) {
		const side = ro.dot(this.normal) - this.distance;
		const dot = -this.normal.dot(rd);
		const t = side / dot;
		return t > Vector3.EPSILON ? t : Infinity;
	}
}

/**
 * Represents the frustum of a projection matrix.
 * This is the space projected (via a perspective divide) by a given matrix into the region [-1, 1].
 * @prop Plane[] planes | The planes bounding the frustum
 */
class Frustum extends Polyhedron {
	/**
	 * Creates a frustum for a given projection matrix.
	 * @param Matrix4 projection | The projection for which to create a frustum
	 */
	constructor(projection) {
		super([], Frustum.ndcPrism.indices);
		if (projection) {
			const { transposed, inverse } = projection;

			this.planes = Frustum.ndcPlanes.map(({ normal, distance }) => {
				const encoding = new Vector4(normal.x, normal.y, normal.z, -distance);
				const { x, y, z, w } = transposed.times(encoding);
				return new Plane(new Vector3(x, y, z), -w);
			});

			this.vertices = Frustum.ndcPrism.vertices.map(vertex => inverse.project(vertex));
		}
	}
	getBoundingBox() {
		return Prism.bound(this.vertices);
	}
	cullBox(box) {
		for (let i = 0; i < this.planes.length; i++) {
			const plane = this.planes[i];
			const min = Math.min(...box.vertices.map(v => v.dot(plane.normal)));
			if (min > plane.distance)
				return true;
		}
		return false;
	}
	cullSphere(sphere) {
		for (let i = 0; i < this.planes.length; i++) {
			const plane = this.planes[i];
			if (sphere.position.dot(plane.normal) - plane.distance > sphere.radius)
				return true;
		}
		return false;
	}
	cullPoint(point) {
		for (let i = 0; i < this.planes.length; i++) {
			const plane = this.planes[i];
			if (point.dot(plane.normal) > plane.distance)
				return true;
		}
		return false;
	}
	get(result = new Frustum(null)) {
		result.planes = this.planes.map(plane => plane.get());
		result.vertices = this.vertices.map(vertex => vertex.get());
		return result;
	}
}
Frustum.ndcPrism = new Prism(
	new Vector3(-1, -1, -1),
	new Vector3(1, 1, 1)
);
Frustum.ndcPlanes = [
	new Plane(Vector3.right, 1),
	new Plane(Vector3.left, 1),
	new Plane(Vector3.down, 1),
	new Plane(Vector3.up, 1),
	new Plane(Vector3.forward, 1),
	new Plane(Vector3.backward, 1)
];

/**
 * Represents a 3D sphere, the collection of points within a given distance of a center.
 * @prop Vector3 position | The center of the sphere
 * @prop Number radius | The maximum distance from the center of the sphere to its bounds
 */
class Sphere extends Shape3D {
	/**
	 * Creates a new sphere.
	 * @param Vector3 position | The center of the sphere
	 * @param Number radius | The radius of the sphere
	 */
	constructor(position, radius) {
		super();
		this.position = position.get();
		this.radius = Math.abs(radius);
	}
	get volume() {
		return 4 / 3 * Math.PI * this.radius ** 3;
	}
	get middle() {
		return this.position.get();
	}
	get(result = new Sphere(Vector3.zero, 0)) {
		result.position = this.position.get();
		result.radius = this.radius;
		return result;
	}
	getBoundingBox() {
		return new Prism(this.position.minus(radius), this.position.plus(radius));
	}
	toPhysicsShape() {
		const center = this.position.toPhysicsVector();
		const result = new Physics.Ball(center, this.radius);
		center.delete();
		return result;
	}
	/**
	 * Returns a sphere which contains all of the given spheres.
	 * It is not guaranteed to be a newly allocated sphere, nor is it guaranteed to be the smallest possible bounding sphere.
	 * @param Sphere[] spheres | The bounding spheres to compose together. This must include at least one sphere
	 * @return Sphere
	 */
	static composeBoundingBalls(spheres) {
		if (spheres.length === 1) return spheres[0];

		const center = Vector3.avg(spheres.map(sphere => sphere.position));
		
		let maxRadius = 0;
		for (let i = 0; i < spheres.length; i++) {
			const sphere = spheres[i];
			const sphereRadius = sphere.radius + Vector3.dist(sphere.position, center);
			if (sphereRadius > maxRadius)
				maxRadius = sphereRadius;
		}

		return new Sphere(center, maxRadius);
	}
}
objectUtils.inherit(Sphere, Circle, [
	"distanceTo", "closestPointTo", "containsPoint",
	"intersectSameType", "equalsSameType",
	"getModel", "rayCast"
]);

/**
 * Represents an arbitrarily aligned circular cylinder.
 * @prop Vector3 position | The position of the center of the cylinder
 * @prop Vector3 axis | The unit vector pointing along the long axis of the cylinder
 * @prop Number length | The length of the long axis of the cylinder
 * @prop Number radius | The radius of the cylinder
 */
class Cylinder extends Shape3D {
	/**
	 * Creates a new cylinder.
	 * @param Vector3 position | The position of the center of the new cylinder
	 * @param Vector3 axis | The unit vector pointing along the long axis of the new cylinder
	 * @param Number length | The length of the long axis of the new cylinder
	 * @param Number radius | The radius of the new cylinder
	 */
	constructor(position, axis, length, radius) {
		super();
		this.position = position;
		this.axis = axis;
		this.length = length;
		this.radius = radius;
		this.volume = Math.PI * this.radius ** 2 * this.length;
	}
	/**
	 * Returns a line segment from the center of one circular face to the other.
	 * @return Line3D
	 */
	get longAxis() {
		const halfAxis = this.axis.times(this.length / 2);
		return new Line3D(
			this.position.minus(halfAxis),
			this.position.plus(halfAxis)
		);
	}
	get(result = new Cylinder(Vector3.zero, Vector3.up, 0, 0)) {
		result.position = this.position.get();
		result.axis = this.axis.get();
		result.length = this.length;
		result.radius = this.radius;
		result.volume = this.volume;
		return result;
	}
	getBoundingBox() {
		const { min, max } = this.longAxis.getBoundingBox();
		return new Prism(min.minus(this.radius), max.plus(this.radius));
	}
	getModel(matrix) {
		return Cylinder.fromLongAxis(
			this.longAxis.getModel(matrix),
			matrix.maxHomogenousScaleFactor * this.radius
		);
	}
	equalsSameType(other) {
		return	other.longAxis.equals(this.longAxis) &&
				other.radius.equals(this.radius);
	}
	closestPointTo(other) {
		const toPoint = other.minus(this.position);
		const alongAxis = toPoint.projectOnto(this.axis);
		const alongCross = toPoint.minus(alongAxis);
		alongCross.mag = Math.min(alongCross.mag, this.radius);
		alongAxis.mag = Math.min(alongAxis.mag, this.length / 2);
		return alongAxis.plus(alongCross);
	}
	/**
	 * Creates a new cylinder based on a line segment and a radius.
	 * @param Line3D longAxis | A line segment from the center of one circular face to the other
	 * @param Number radius | The radius of the cylinder
	 */
	static fromLongAxis(longAxis, radius) {
		const { vector } = longAxis;
		const { mag } = vector;
		return new Cylinder(
			longAxis.middle, vector.over(mag),
			mag, radius
		)
	}
}