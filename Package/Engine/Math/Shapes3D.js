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
	intersectSameType() {
		return false;
	}
	/**
	 * Returns the points on the caller and a given line segment that with minimal distance.
	 * The distance between these points gives the distance between the line segments.
	 * The first element of the return value is the point on the caller, and the second is the point on the argument.
	 * @param Line3D other | The line segment to compare with
	 * @return Vector3[2]
	 */
	getClosestPoints(other) {
		const a0 = this.a;
		const av = this.vector;
		const b0 = other.a;
		const bv = other.vector;
		const d0 = b0.minus(a0);
		const dv = av.dot(bv);
		const la = 1 / av.sqrMag;
		const lb = 1 / bv.sqrMag;
		const matrix = new Matrix2(
			1, -la * dv,
			-lb * dv, 1
		);
		if (!matrix.invert()) return [Vector3.zero, Vector3.zero];//a0.get(), b0.get()];
		const vec = new Vector2(
			la * d0.dot(av),
			-lb * d0.dot(bv)
		);
		const { x: s, y: t } = matrix.times(vec);

		const pa = av.times(s).add(a0);
		const pb = bv.times(t).add(b0);

		const sInRange = s > 0 && s < 1;
		const tInRange = t > 0 && t < 1;
		
		if (sInRange) {
			if (tInRange)
				return [pa, pb];
			
			return [pa, other.closestPointTo(pa)];
		}

		if (tInRange)
			return [this.closestPointTo(pb), pb];

		return [this.closestPointTo(pb), other.closestPointTo(pa)];
	}
	rayCast() {
		return Infinity;
	}
	get(result = new Line3D(Vector3.zero, Vector3.zero)) {
		result.a.set(this.a);
		result.b.set(this.b);
		return result;
	}
}
objectUtils.inherit(Line3D, Line, [
	"length", "middle", "vector",
	"getModel", "equalsSameType",
	"closestPointTo"
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
 * Represents an append-only structure for building procedural polyhedra.
 * Vertices and triangles can be added through various means, and can at any point be converted into a Polyhedron.
 * @prop Vector3[] vertices | The vertices of the polyhedron. These can be added to directly, if desired
 * @prop Number[] indices | The indices of the vertices of the triangular faces of the polyhedron. These can be added to directly, if desired
 */
class PolyhedronBuilder {
	/**
	 * Creates a new building structure, with no vertices or indices.
	 */
	constructor() {
		this.vertices = [];
		this.indices = [];
	}
	/**
	 * Creates a new Polyhedron out of the current state of the builder.
	 * The Polyhedron is disconnected, in the sense that future changes to the builder will not be reflected in the created Polyhedron.
	 * @return Polyhedron
	 */
	get polyhedron() {
		return new Polyhedron(this.vertices, this.indices);
	}
	/**
	 * Adds a new vertex, and returns its index.
	 * @param Vector3 vertex | The vertex to add
	 * @return Number 
	 */
	addVertex(vertex) {
		return this.addVertices([vertex]);
	}
	/**
	 * Adds a new sequence of vertices, and returns the index of the first vertex in the sequence
	 * @param Vector3[] vertices | The vertices to add
	 * @return Number
	 */
	addVertices(vertices) {
		const start = this.vertices.length;
		this.vertices.pushArray(vertices);
		return start;
	}
	/**
	 * Adds the entire contents of a Polyhedron to the builder, and returns the index of the first vertex added.
	 * @param Polyhedron polyhedron | The Polyhedron to add
	 * @param Boolean flip? | Whether to flip all the faces in the added Polyhedron. This does not modify the first argument in-place. Default is false
	 * @return Number
	 */
	addPolyhedron(poly, flip = false) {
		const start = this.vertices.length;
		this.vertices.pushArray(poly.vertices);
		
		for (let i = 0; i < poly.indices.length; i += 3) {
			const a = poly.indices[i + 0] + start;
			const b = poly.indices[i + 1] + start;
			const c = poly.indices[i + 2] + start;
			if (flip) {
				this.indices.push(c, b, a);
			} else {
				this.indices.push(a, b, c);
			}
		}

		return start;
	}
	/**
	 * Adds a list of vertices representing the edge of a convex polygon, and adds triangles in a "triangle fan" formation to connect them.
	 * Returns the index of the first vertex added.
	 * @param Vector3[] vertices | The vertices of the convex polygon
	 * @return Number
	 */
	addConvexVertices(vertices) {
		const start = this.addVertices(vertices);
		for (let i = 2; i < vertices.length; i++)
			this.indices.push(
				start, start + i - 1, start + i
			);
		
		return start;
	}
}

/**
 * Represents a closed 3D polyhedron as a collection of contiguous triangles.
 * @prop Vector3[] vertices | The vertices of the polyhedron
 * @prop Number[] indices | An array representing the triangles of the polyhedron. Every three indices in the array specify the locations in the `.vertices` array which make up a triangle 
 * @prop Number faceCount | The number of faces of the polyhedron. This property is equivalent to `indices.length / 3`
 */
class Polyhedron extends Shape3D {
	/**
	 * Creates a new polyhedron.
	 * @param Vector3[] vertices | The vertices of the polyhedron
	 * @param Number[] indices | The vertex indices for the triangular faces of the polyhedron
	 */
	constructor(vertices, indices, lazy = false) {
		super();
		if (lazy) {
			this.vertices = vertices;
			this.indices = indices;
		} else {
			// remove duplicate vertices
			this.vertices = [];
			
			const vertexToIndex = new Map();
			const indexRemap = new Map();
			
			for (let i = 0; i < vertices.length; i++) {
				const vertex = vertices[i];
				const key = vertex.toMaxed(4);
				if (!vertexToIndex.has(key)) {
					vertexToIndex.set(key, this.vertices.length);
					this.vertices.push(vertex);
				}
				indexRemap.set(i, vertexToIndex.get(key));
			}

			// remove degenerate triangles
			this.indices = [];
			for (let i = 0; i < indices.length; i += 3) {
				const indexA = indexRemap.get(indices[i + 0]);
				const indexB = indexRemap.get(indices[i + 1]);
				const indexC = indexRemap.get(indices[i + 2]);
				if (
					indexA !== indexB &&
					indexB !== indexC &&
					indexC !== indexA
				) this.indices.push(indexA, indexB, indexC);
			}
		}
		this.faceCount = this.indices.length / 3;
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
	
			for (let i = 0; i < this.faceCount; i++) {
				const [a, b, c] = this.getFaceIndices(i);
				addEdge(a, b);
				addEdge(b, c);
				addEdge(c, a);
			}
	
			this._edges = edges;
		}

		return this._edges;
	}
	/**
	 * Returns the vertex indices of the nth face of the polyhedron.
	 * @return Number[] 
	 */
	getFaceIndices(index) {
		const { indices } = this;
		index *= 3;
		return [indices[index + 0], indices[index + 1], indices[index + 2]];
	}
	/**
	 * Returns the nth face in the polyhedron.
	 * @return Triangle
	 */
	getFace(index) {
		const { vertices } = this;
		const [a, b, c] = this.getFaceIndices(index);
		return new Triangle(vertices[a], vertices[b], vertices[c]);
	}
	/**
	 * Returns a set of triangles making up the surface of the polyhedron.
	 * @return Triangle[]
	 */
	getFaces() {
		return this._faces ??= Array.dim(this.faceCount)
				.map((_, i) => this.getFace(i));
	}
	getModel(transform) {
		return new Polyhedron(
			this.vertices.map(vertex => transform.times(vertex)),
			this.indices,
			true
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
			for (let i = 0; i < current.faceCount; i++) {
				const [indexA, indexB, indexC] = current.getFaceIndices(i);
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
	 * @param Number steps? | The amount of vertices to use around the great circles of the sphere. Default is 8
	 * @return Polyhedron
	 */
	static fromSphere(sphere, steps = 8) {
		return Polyhedron.fromCapsule(new Capsule(
			new Line3D(sphere.position, sphere.position),
			sphere.radius
		), steps);
	}
	/**
	 * Creates a polyhedron that resembles a capsule.
	 * @param Capsule capsule | The capsule to approximate
	 * @param Number steps? | The amount of vertices to use around the circular cross-sections of the capsule. Default is 8 
	 */
	static fromCapsule(capsule, steps = 8) {
		let cap;
		{ // build cap
			const capVertices2D = [];
			const capIndices = [];

			const rings = Math.floor(steps / 2);
			for (let i = 0; i < rings; i++) {
				const t = 1 - i / (rings - 0.5);
				const radius = Math.sqrt(t * (2 - t));

				// add ring
				capVertices2D.pushArray(Polygon.regular(steps, radius).vertices);
				
				if (i > 0) { // add triangles between rings
					const outerStart = capVertices2D.length - steps * 2;
					const innerStart = capVertices2D.length - steps;
					for (let i = 0; i < steps; i++) {
						const current = i;
						const next = (i + 1) % steps;
						const a = outerStart + current;
						const b = innerStart + current;
						const c = outerStart + next;
						const d = innerStart + next;
						capIndices.push(c, b, a);
						capIndices.push(c, d, b);
					}
				}

				if (i === rings - 1) { // close final gap
					const start = capVertices2D.length - steps;
					const centerIndex = capVertices2D.length;
					capVertices2D.push(Vector2.zero);
					for (let i = 0; i < steps; i++) {
						capIndices.push(
							start + (i + 1) % steps,
							centerIndex,
							start + i
						);
					}
				}
			}
			
			// lift 2D mesh into 3D
			const capVertices = capVertices2D
				.map(({ x, y }) => {
					const z = Math.sqrt(Math.max(0, 1 - x ** 2 - y ** 2));
					return new Vector3(x, y, z);
				});
	
			cap = new Polyhedron(capVertices, capIndices, true);
		}
		
		const { axis, radius } = capsule;
		let axisVector = axis.vector;
		if (axisVector.sqrMag < 0.01) // spherical case
			axisVector = Vector3.up;

		// transform caps into capsule-space
		const forward = axisVector.normalized.mul(radius);
		const right = forward.normal.normalize().mul(radius);
		const up = axisVector.cross(right).normalize().mul(radius);

		const capA = cap.getModel(new Matrix4(right, up, forward.inverse, axis.a));
		const capB = cap.getModel(new Matrix4(right, up, forward, axis.b));

		const builder = new PolyhedronBuilder();

		const capAStart = builder.addPolyhedron(capA, true);
		const capBStart = builder.addPolyhedron(capB);
		
		for (let i = 0; i < steps; i++) {
			const a = capAStart + i;
			const b = capAStart + (i + 1) % steps;
			const c = capBStart + i;
			const d = capBStart + (i + 1) % steps;
			builder.indices.push(
				a, b, c,
				d, c, b
			);
		}

		return builder.polyhedron;
	}
	/**
	 * Creates a polyhedron that resembles a right circular cone to a given level of precision
	 * @param Line3D axis | A line segment from the center of the cone's base to the peak
	 * @param Number radius | The radius of the circular base
	 * @param Number steps? | The amount of vertices around the circular base. Default is 8
	 */
	static fromCone(axis, radius, steps = 8) {
		const builder = new PolyhedronBuilder();
		const baseVertices = Polygon.regular(steps, 1).vertices
			.map(({ x, y }) => new Vector3(x, y, 0))
			.reverse();
		
		const baseIndex = builder.addConvexVertices(baseVertices);
		const tipIndex = builder.addVertex(new Vector3(0, 0, 1));

		for (let i = 0; i < steps; i++) {
			const a = baseIndex + i;
			const b = baseIndex + (i + 1) % steps;
			const c = tipIndex;
			builder.indices.push(c, b, a);
		}

		const forward = axis.vector;
		const right = forward.normal.normalize().mul(radius);
		const up = forward.cross(right).normalize().mul(radius);

		return builder.polyhedron.getModel(new Matrix4(right, up, forward, axis.a));
	}
	/**
	 * Creates a polyhedron that resembles a right circular cylinder to a given level of precision.
	 * @param Line3D longAxis | A line segment between the centers of the two circular faces
	 * @param Number radius | The radius of the cylinder
	 * @param Number steps? | The amount of vertices to use around the circular faces. Default is 8
	 * @return Polyhedron
	 */
	static fromCylinder(longAxis, radius, steps = 8) {
		// unpack cylinder
		const {
			vector: {
				normalized: axis,
				mag: length,
			},
			middle: position
		} = longAxis;

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
		super([], [], true);
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
		super([], Frustum.ndcPrism.indices, true);
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
 * Represents an arbitrarily aligned capsule (the set of points which are a fixed radius away from a line segment).
 * @prop Line3D axis | The core line segment which all points are equidistant to
 * @prop Number radius | The radius of the capsule
 */
class Capsule extends Shape3D {
	/**
	 * Creates a new capsule.
	 * @param Line3D axis | The central line segment
	 * @param Number radius | The radius of the capsule
	 */
	constructor(axis, radius) {
		super();
		this.axis = axis;
		this.radius = radius;
		this.volume = (
			Math.PI * this.radius ** 2 * this.axis.length + // cylinder core
			4 / 3 * Math.PI * this.radius ** 3 // spherical caps
		);
	}
	get(result = new Capsule(new Line3D(Vector3.zero, Vector3.up), 0)) {
		this.axis.get(result.axis);
		result.radius = this.radius;
		result.volume = this.volume;
		return result;
	}
	getBoundingBox() {
		const { min, max } = this.axis.getBoundingBox();
		return new Prism(min.minus(this.radius), max.plus(this.radius));
	}
	getModel(matrix) {
		return new Capsule(
			this.axis.getModel(matrix),
			matrix.maxHomogenousScaleFactor * this.radius
		);
	}
	equalsSameType(other) {
		return	other.axis.equals(this.axis) &&
				other.radius.equals(this.radius);
	}
	closestPointTo(point) {
		const closestPoint = this.axis.closestPointTo(point);
		const toPoint = point.minus(closestPoint);
		const { mag } = toPoint;
		if (mag > this.radius)
			toPoint.mul(this.radius / mag);
		
		return closestPoint.plus(toPoint);
	}
	intersectSameType(other) {
		const [a, b] = this.axis.getClosestPoints(other.axis);
		return Vector3.sqrDist(a, b) < (this.radius + other.radius) ** 2;
	}
	rayCast(ro, rd) {
		const { axis: { a, b, vector }, radius } = this;
		
		// TODO: add Capsule ray casting

		return Infinity;
	}
}