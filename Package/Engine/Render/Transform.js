/**
 * @implements Copyable
 * Represents a 2D affine transformation with no scaling.
 * It is composed of a rotation about the origin followed by a translation.
 * ```js
 * const obj = scene.main.addElement("my first object", 0, 0);
 * console.log(obj.transform); // { position: (0, 0), rotation: 0 }
 * 
 * obj.transform.rotateAbout(new Vector2(0, 100), Math.PI);
 * console.log(obj.transform); // { position: (0, 200), rotation: Math.PI }
 * ```
 * @prop Vector2 position | The translation of the transform
 * @prop Number rotation | The angle of rotation (in radians) of the transform
 * @prop Vector2 direction | The unit direction the transform is facing in (alternate access method for rotation)
 */
class Transform extends Matrix3 {
	/**
	 * Creates a new Transform.
	 * @param Number x | The initial x translation
	 * @param Number y | The initial y translation
	 * @param Number rotation | The initial rotation of the  
	 */
	constructor(x, y, rotation) {
		super(
			1, 0, x,
			0, 1, y,
			0, 0, 1
		);
		this.rotation = rotation;
		
		// create an double bound position object, so (transf.position.x += ...) works

		this._position = Vector2.origin;
		delete this._position.x;
		delete this._position.y;
		const self = this;
		Object.defineProperties(this._position, {
			x: {
				set: value => self[6] = value,
				get: () => self[6],
				configurable: true
			},
			y: {
				set: value => self[7] = value,
				get: () => self[7],
				configurable: true
			}
		});
	}
	/**
	 * Returns a transform that, when composed with the caller, will produce no offset and no rotation.
	 * @return Transform
	 */
	get inverse() {
		const pos = this.position.inverse.rotate(-this.rotation);
		return new Transform(pos.x, pos.y, -this.rotation);
	}
	set position(vec) {
		this[6] = vec.x;
		this[7] = vec.y;
	}
	get position () {
		return this._position;
	}
	set rotation(a) {
		this._rotation = a;
		const cos = Math.cos(a);
		const sin = Math.sin(a);
		this.cosRotation = cos;
		this.sinRotation = sin;
		this[0] = cos;
		this[1] = sin;
		this[3] = -sin;
		this[4] = cos;
	}
	get rotation() {
		return this._rotation;
	}
	set direction(v) {
		this.rotation = v.angle;
	}
	get direction() {
		return new Vector2(this.cosRotation, this.sinRotation);
	}
	get(transf = new Transform(0, 0, 0)) {
		transf.position = this.position;
		transf.rotation = this.rotation;
		return transf;
	}
	diff(transf) {
		const EPSILON = 0.001;
		let dx = Math.abs(this.position.x - transf.position.x);
		let dy = Math.abs(this.position.y - transf.position.y);
		let dr = Math.abs(this.rotation - transf.rotation);
		return dx > EPSILON || dy > EPSILON || dr > EPSILON;
	}
	/**
	 * Adds a clockwise (in screen-space) rotation in-place about a specific point to the existing transformation. 
	 * @param Vector2 point | The center to rotate about
	 * @param Number rotation | The angle (in radians) to rotate by
	 */
	rotateAround(point, rotation) {
		const diff = this.position.Vminus(point);
		diff.rotate(rotation);
		diff.add(point);
		this.position = diff;
		this.rotation += rotation;
	}
	/**
	 * Transforms a given point by applying the inverse of the caller to it.
	 * This translates the point by the inverse of the transform's position and then rotates it counter-clockwise (in screen-space) about the origin by the transform's rotation.
	 * @param Vector2 point | The point to transform
	 * @return Vector2
	 */
	globalSpaceToLocalSpace(v) {
		return v.Vminus(this.position).rotate(-this.rotation);
	}
	/**
	 * Transforms a given point by applying the caller to it.
	 * This rotates the point clockwise (in screen-space) about the origin by the transform's rotation and then translates it by the transform's position.
	 * @param Vector2 point | The point to transform
	 * @return Vector2
	 */
	localSpaceToGlobalSpace(v) {
		return v.rotated(this.rotation).Vadd(this.position);
	}
	drawInLocalSpace(artist, renderer) {
		const x = this[6];
		const y = this[7];
		const r = this._rotation;

		renderer.translate(x, y);
		if (r) renderer.rotate(r);
		artist();
		if (r) renderer.rotate(-r);
		renderer.translate(-x, -y);
	}
	drawInGlobalSpace(artist, renderer) {
		const x = this[6];
		const y = this[7];
		const r = this._rotation;

		if (r) renderer.rotate(-r);
		renderer.translate(-x, -y);
		artist();
		renderer.translate(x, y);
		if (r) renderer.rotate(r);
	}
	drawWithoutRotation(artist, renderer) {
		const r = this._rotation;
		if (r) renderer.rotate(-r);
		artist();
		if (r) renderer.rotate(r);
	}
	/**
	 * Returns a transform which has the same effect as applying two transformations in a row.
	 * @param Transform a | The first transformation
	 * @param Transform b | The second transformation
	 * @return Transform
	 */
	static combine(a, b) {
		let tx = a.position.x;
		let ty = a.position.y;
		tx += b.position.x * a.cosRotation - b.position.y * a.sinRotation;
		ty += b.position.x * a.sinRotation + b.position.y * a.cosRotation;
		const rotation = a.rotation + b.rotation;
		return new Transform(tx, ty, rotation);
	}
}