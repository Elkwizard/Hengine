class Geometry3D {
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
			frustum.planes = [...planes];
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