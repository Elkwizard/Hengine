/**
 * Contains a collection of useful static methods for manipulating 3D shapes and figures.
 * This class cannot be constructed.
 */
class Geometry3D {
	static get random() {
		this._random ??= new Random();
		this._random.seed = 1234;
		return this._random;
	}
	/**
	 * Returns the smallest convex Polyhedron which contains a given set of points.
	 * The behavior is undefined if the points are all coplanar.
	 * @param Vector3[] points | The points to create a convex hull for. There must be at least 4
	 * @return Polyhedron
	 */
	static convexHull(sourcePoints) {
		sourcePoints = Geometry.unique(sourcePoints);
		const { random } = this;
		const points = sourcePoints.map(p => p.plus(new Vector3(
			random.range(Geometry.EPSILON * 4),
			random.range(Geometry.EPSILON * 4),
			random.range(Geometry.EPSILON * 4)
		)));

		const makeEdgeKey = (a, b) => `${a},${b}`;
		const getLeftNormal = (a, b) => {
			const aToB = b.minus(a);
			return aToB.cross(Vector3.left).cross(aToB).normalize();
		}
		const a = points.argmin(p => p.x);
		const b = points.argmin(p => p === points[a] ? Infinity : getLeftNormal(points[a], p).x);
		const normal = getLeftNormal(points[a], points[b]);
		const open = new Map([
			[makeEdgeKey(a, b), { edge: [a, b], normal }]
		]);

		const addEdge = (a, b, normal) => {
			const reverseKey = makeEdgeKey(b, a);
			const edgeKey = makeEdgeKey(a, b);
			if (open.has(reverseKey)) {
				open.delete(reverseKey);
			} else {
				open.set(edgeKey, { edge: [a, b], normal });
			}
		};

		const closed = [];

		let first = true;

		while (open.size) {
			// extract open edge
			const [edgeKey] = open.keys();
			const { edge, normal } = open.get(edgeKey);
			open.delete(edgeKey);
			
			// solidify open edge
			const [ia, ib] = edge;
			const a = points[ia];
			const b = points[ib];
			const aToB = b.minus(a);

			// find best cross product
			let best = null;
			let bestNormal = null;
			let bestDot = -Infinity;

			for (let i = 0; i < points.length; i++) {
				if (i === ia || i === ib) continue;
				const point = points[i];
				const newNormal = aToB.cross(point.minus(a)).normalize();
				const dot = newNormal.dot(normal);
				if (dot > bestDot) {
					bestDot = dot;
					bestNormal = newNormal;
					best = i;
				}
			}
			
			// close currently open edge
			closed.push([best, ia, ib]);
			addEdge(ia, best, bestNormal);
			addEdge(best, ib, bestNormal);
			if (first) {
				first = false;
				addEdge(ib, ia, bestNormal);
			}
		}

		// const color = Color.unlimited(0, 0, 500);
		// const arrowColor = Color.unlimited(500, 200, 100);
		// for (let [, { edge: [a, b], normal }] of open) {
		// 	a = points[a];
		// 	b = points[b];
		// 	renderer.stroke(color, 5).line(a, b);
		// 	const mid = a.plus(b).over(2);
		// 	renderer.stroke(arrowColor, 3).arrow(mid, mid.plus(normal.times(40)));
		// }

		const vertexToIndex = new Map();
		const vertices = [];
		const indices = [];
		for (let i = 0; i < closed.length; i++) {
			const tri = closed[i];
			for (let j = 0; j < 3; j++) {
				const vertex = tri[j];
				if (!vertexToIndex.has(vertex)) {
					vertexToIndex.set(vertex, vertices.length);
					vertices.push(sourcePoints[vertex]);
				}
				indices.push(vertexToIndex.get(vertex));
			}
		}

		return new Polyhedron(vertices, indices);
	}
	/**
	 * Subdivides a frustum along the z axis.
	 * @param Frustum frustum | The frustum to subdivide
	 * @param Number[]/Number portions | How to slice the frustum. If this is a number, the frustum will be sliced into that many pieces of equal size. If this is an array, each element provides a weight proportional to the size of each piece of the frustum. The weights may be scaled by any constant
	 * @return Frustum[]
	 */
	static subdivideFrustum(frustum, portions) {
		if (typeof portions === "number")
			portions = Array.dim(portions).fill(1);

		const { planes, vertices } = frustum;

		const FRONT = 4;
		const BACK = 5;

		const backDistance = planes[BACK].distance;
		const frontDistance = planes[FRONT].distance;
		const getDistance = t => Number.lerp(backDistance, frontDistance, t);

		const backVertices = vertices.slice(0, 4);
		const frontVertices = vertices.slice(4, 8);
		const getVertices = t => backVertices.map((v, i) => Vector3.lerp(v, frontVertices[i], t));

		const result = [];

		const total = Number.sum(portions);
		let t0 = 0;
		for (let i = 0; i < portions.length; i++) {
			const t1 = t0 + portions[i] / total;
			
			const frustum = new Frustum(null);
			frustum.planes = planes.map(plane => plane.get());
			frustum.planes[BACK].distance = getDistance(t0);
			frustum.planes[FRONT].distance = getDistance(t1);
			frustum.vertices = [
				...getVertices(t0),
				...getVertices(t1)
			];
			result.push(frustum);

			t0 = t1;
		}
		
		return result;
	}
}