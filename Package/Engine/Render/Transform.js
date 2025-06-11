/**
 * @3d TransformN = Transform2D -> Transform3D
 */

/**
 * @type class Transform<Matrix, Vector, Angle>
 * @implements Copyable
 * Represents an affine transformation with no scaling.
 * It is composed of a rotation about the origin followed by a translation.
 * Within the documentation for this class, `Angle` refers to either `Number` or `Vector3` depending on whether the 2D or 3D subclass is being used.
 * Similarly, `Vector` refers to either `Vector2` or `Vector3` and `Matrix` refers to either `Matrix3` or `Matrix4` depending on the dimension used.
 * @abstract
 * ```js
 * const obj = scene.main.addElement("my first object", 0, 0);
 * console.log(obj.transform); // { position: (0, 0), rotation: 0 }
 * 
 * obj.transform.rotateAbout(new Vector2(0, 100), Math.PI);
 * console.log(obj.transform); // { position: (0, 200), rotation: Math.PI }
 * ```
 * @prop Vector position | The translation of the transform
 * @prop Angle rotation | The angle of rotation (in radians) of the transform
 */
class Transform {
	constructor(position, rotation) {
		const { Vector, Complex } = this.constructor;
		this._position = position.get();
		this._rotation = rotation.get();
		
		this._position.onChange(() => this.change());
		this._rotation.onChange?.(() => this.change());

		this.change();
		this.complex = Complex.zero;
		this._matrix = new Vector.TransformMatrix();
		this._invMatrix = new Vector.TransformMatrix();
		this._dirMatrix = new Vector.Matrix();
		this._invDirMatrix = new Vector.Matrix();
	}
	set position(a) {
		this._position.set(a);
		this.change();
	}
	get position() {
		return this._position;
	}
	set rotation(a) {
		this._rotation = a.get(this._rotation);
		this.change();
	}
	get rotation() {
		return this._rotation;
	}
	/**
	 * Returns a transform that, when composed with the caller, will produce no offset and no rotation.
	 * @return Transform
	 */
	get inverse() {
		const pos = this.position.inverse.rotate(this.rotation.inverse);
		return new this.constructor(pos, this.rotation.inverse);
	}
	/**
	 * Returns a matrix representing the current transformation from local to global space.
	 * @return Matrix
	 */
	get matrix() {
		this.syncMatrix();
		return this._matrix;
	}
	/**
	 * Returns a matrix representing the current transformation from global to local space.
	 * @return Matrix
	 */
	get invMatrix() {
		if (this.invMatrixChanged) {
			this.invMatrixChanged = false;
			this.matrix.get(this._invMatrix).invert();
		}
		
		return this._invMatrix;
	}
	/**
	 * Returns a unit vector in the direction of the x axis in local space.
	 * @return Vector
	 */
	get direction() {
		return this.localDirectionToGlobal(this.constructor.Vector.right);
	}
	change() {
		this.matrixChanged = true;
		this.invMatrixChanged = true;
	}
	syncMatrix() {
		if (this.matrixChanged) {
			this.matrixChanged = false;

			this.complex = this.constructor.Complex.fromRotation(this.rotation);
			this._dirMatrix = this.complex.toMatrix();
			this._dirMatrix.get(this._invDirMatrix).invert();

			const rotationSize = this._dirMatrix.constructor.size;
			const matSize = this._matrix.constructor.size;
			
			for (let c = 0; c < rotationSize; c++)
			for (let r = 0; r < rotationSize; r++)
				this._matrix[c * matSize + r] = this._dirMatrix[c * rotationSize + r];
			
			const { modValues } = this.position.constructor;
			const positionStart = this._matrix.length - matSize;
			for (let r = 0; r < rotationSize; r++)
				this._matrix[positionStart + r] = this.position[modValues[r]];
		}
	}
	get(transf = new this.constructor(this.constructor.Vector.zero)) {
		transf.position = this.position;
		transf.rotation = this.rotation;
		return transf;
	}
	diff(transf) {
		return	!this.position.equals(transf.position) ||
				!this.rotation.equals(transf.rotation);
	}
	/**
	 * Transforms a given direction in global-space into local-space.
	 * @param Vector direction | The global-space direction to transform
	 * @return Vector
	 */
	globalDirectionToLocal(direction) {
		this.syncMatrix();
		return this._invDirMatrix.times(direction);
	}
	/**
	 * Transforms a given point by applying the inverse of the caller to it.
	 * This translates the point by the inverse of the transform's position and then rotates it counter-clockwise (in Screen-Space) about the origin by the transform's rotation.
	 * @param Vector point | The point to transform
	 * @return Vector
	 */
	globalToLocal(v) {
		return this.invMatrix.times(v);
	}
	globalSpaceToLocalSpace(v) {
		return this.globalToLocal(v);
	}
	/**
	 * Transforms a given direction in local-space into global-space.
	 * @param Vector direction | The local-space direction to transform
	 * @return Vector 
	 */
	localDirectionToGlobal(direction) {
		this.syncMatrix();
		return this._dirMatrix.times(direction);
	}
	/**
	 * Transforms a given point by applying the caller to it.
	 * This rotates the point clockwise (in Screen-Space) about the origin by the transform's rotation and then translates it by the transform's position.
	 * @param Vector point | The point to transform
	 * @return Vector
	 */
	localToGlobal(v) {
		return this.matrix.times(v);
	}
	localSpaceToGlobalSpace(v) {
		return this.localToGlobal(v);
	}
	drawInLocalSpace(artist, renderer) {
		const pos = this._position;
		const angle = this._rotation;

		renderer.translate(pos);
		if (angle) renderer.rotate(angle);
		artist();
		if (angle) renderer.rotate(angle.inverse);
		renderer.translate(pos.inverse);
	}
	drawInGlobalSpace(artist, renderer) {
		const pos = this._position;
		const angle = this._rotation;

		if (angle) renderer.rotate(angle.inverse);
		renderer.translate(pos.inverse);
		artist();
		renderer.translate(pos);
		if (angle) renderer.rotate(angle);
	}
	drawWithoutRotation(artist, renderer) {
		const angle = this._rotation;
		if (angle) renderer.rotate(angle.inverse);
		artist();
		if (angle) renderer.rotate(angle);
	}
	/**
	 * Returns a transform which has the same effect as applying two transformations in a row.
	 * @param Transform a | The first transformation
	 * @param Transform b | The second transformation
	 * @return Transform
	 */
	static combine(a, b) {
		const position = a.localToGlobal(b.position);
		const rotation = a.rotation + b.rotation;
		return new Transform(position, rotation);
	}
}

/**
 * @type class Transform2D extends Transform<Matrix3, Vector2, Number>
 * Represents a 2D affine transformation, composed of a translation and a rotation.
 * @prop Vector2 position | The translation of the transform
 * @prop Number rotation | The angle of rotation
 */
class Transform2D extends Transform {
	static Complex = Complex;
	static Vector = Vector2;

	/**
	 * Creates a new 2D transform.
	 * @param Vector2 position | The translation of the transform
	 * @param Number rotation? | The angle of rotation. Default is 0
	 */
	constructor(position, rotation = 0) {
		super(position, rotation);
	}
	
	/**
	 * Adds a clockwise (in Screen-Space) rotation in-place about a specific point to the existing transformation. 
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
}

/**
 * @type class Transform3D extends Transform<Matrix4, Vector3, Vector3>
 * Represents a 3D affine transformation, composed of a translation and a rotation about an arbitrary axis.
 * @prop Vector3 position | The translation of the transform
 * @prop Vector3 rotation | The angle of rotation, represented as the unit axis of rotation multiplied by the angle of rotation
 */
class Transform3D extends Transform {
	static Vector = Vector3;
	static Complex = Quaternion;

	/**
	 * Creates a new 3D transform.
	 * @param Vector3 position | The translation of the transform
	 * @param Vector3 rotation? | The angle of rotation. Default is no rotation
	 */
	constructor(position, rotation = Vector3.zero) {
		super(position, rotation);
	}
}

ND.Transform = IS_3D ? Transform3D : Transform2D;