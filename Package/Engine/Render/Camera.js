/**
 * @name class Camera extends Matrix
 * @interface
 * Represents a camera in a scene targeting a specific rendering surface.
 * The transformation represented by this matrix is from world-space to screen-space.
 * @prop Number zoom | The magnification level of the camera
 * @prop Number rotation | The clockwise roll (in radians) of the camera. Starts at 0
 */
class Camera {
	get renderer() {
		return this.canvas.renderer;
	}
	/**
	 * Returns the caller.
	 * @return Matrix
	 */
	get matrix() {
		return this;
	}
	/**
	 * Sets the zoom to 1.
	 */
	restoreZoom() {
		this.zoom = 1;
	}
	/**
	 * Zooms in by a specified amount.
	 * @param Number amount | The amount to zoom in by
	 */
	zoomIn(amount) {
		this.zoom *= 1 + amount;
	}
	/**
	 * Zooms out by a specified amount.
	 * @param Number amount | The amount to zoom out by
	 */
	zoomOut(amount) {
		this.zoom /= 1 + amount;
	}
	/**
	 * Multiplies the current zoom value.
	 * @param Number factor | The amount to multiply the current zoom
	 */
	zoomBy(factor) {
		this.zoom *= factor;
	}
	/**
	 * Maps a given point from screen-space to world-space.
	 * @param Vector2 point | The point to transform
	 * @return Vector2
	 */
	screenToWorld(point) {
		return this.inverse.times(point);
	}
	screenSpaceToWorldSpace(point) {
		return this.screenToWorld(point);
	}
	/**
	 * Maps a given point from world-space to screen-space.
	 * @param Vector2 point | The point to transform
	 * @return Vector2
	 */
	worldToScreen(point) {
		return this.times(point);
	}
	worldSpaceToScreenSpace(point) {
		return this.worldToScreen(point);
	}
}

/**
 * @implements Camera
 * Represents the camera in a 2D scene.
 * @prop Vector2 position | The current center of the camera's view.
 */
class Camera2D extends Matrix3 {
	/**
	 * Creates a new camera pointing to the middle of the provided renderer.
	 * @param ImageType canvas | The rendering surface to target
	 */
	constructor(canvas) {
		super();
		this.canvas = canvas;
		const { width, height } = this.canvas;
		Vector2.defineReference(this, "position", new Vector2(width / 2, height / 2))
			.onChange(() => this.updateTranslationMatrix());
		this.zoom = 1;
		this.rotation = 0;
		this.cacheScreen();
	}
	set rotation(a) {
		const cos = Math.cos(a);
		const sin = Math.sin(a);
		this._rotation = a;
		this.cosRotation = cos;
		this.sinRotation = sin;
		this.updateMatrix();
	}
	get rotation() {
		return this._rotation;
	}
	set zoom(a) {
		this._zoom = a;
		this.updateMatrix();
	}
	get zoom() {
		return this._zoom;
	}
	updateTranslationMatrix() {
		const { x, y } = this.position;
		const c = this.cosRotation;
		const s = this.sinRotation;
		const z = this.zoom;
		const w = this.canvas.width;
		const h = this.canvas.height;
		this[6] = w / 2 - x * c * z + y * s * z;
		this[7] = h / 2 - x * s * z - y * c * z;
	}
	updateMatrix() {
		const c = this.cosRotation;
		const s = this.sinRotation;
		const z = this.zoom;
		this[0] = c * z;
		this[1] = s * z;
		this[3] = -s * z;
		this[4] = c * z;
		this.updateTranslationMatrix();
	}
	/**
	 * Smoothly moves the camera toward a new rotation value.
	 * @param Number angle | The new rotation to move toward (in radians)
	 * @param Number ferocity | The degree to which the camera should move toward the new position, on [0, 1]
	 */
	rotateTowards(rotation, ferocity = 0.1) {
		const diff = Geometry.signedAngularDist(rotation, this.rotation);
		this.rotation += diff * ferocity;
	}
	/**
	 * Smoothly moves the camera toward a new position value.
	 * @param Vector2 point | The new position to move toward
	 * @param Number ferocity | The degree to which the camera should move toward the new position, on [0, 1]
	 */
	moveTowards(point, ferocity = 0.1) {
		const cameraPoint = this.position;
		const diff = point.Vminus(cameraPoint).Ntimes(ferocity);
		this.position = cameraPoint.plus(diff);
	}
	/**
	 * Moves the camera such that the entire viewport is entire a given axis-aligned rectangular boundary.
	 * If the boundary is smaller than the viewport, the behavior is undefined.
	 * @signature
	 * @param Rect boundary | The boundary in which the camera's viewport must exist
	 * @signature
	 * @param Number x | The x coordinate of the upper-left corner of the boundary
	 * @param Number y | The y coordinate of the upper-left corner of the boundary
	 * @param Number width | The width of the boundary 
	 * @param Number height | The height of the boundary 
	 */
	constrain(x = -Infinity, y = -Infinity, width = Infinity, height = Infinity) {
		if (typeof x === "object") ({ x, y, width, height } = x);

		const screen = this.cacheScreen();
		const w2 = screen.width / 2;
		const h2 = screen.height / 2;

		const minX = x + w2;
		const minY = y + h2;
		const maxX = (isFinite(width) ? x + width : width) - w2;
		const maxY = (isFinite(height) ? y + height : height) - h2;

		this.position = Vector2.clamp(
			this.position,
			new Vector2(minX, minY),
			new Vector2(maxX, maxY)
		);
	}
	/**
	 * Zooms in/out about a specific point (in world-space) by a specific factor.
	 * @param Vector2 center | The zoom center
	 * @param Number factor | The zoom multiplier
	 */
	zoomAbout(center, factor) {
		const offset = center.minus(this.position);
		offset.mul(factor - 1);
		this.position.add(offset);
		this.zoom *= factor;
	}
	/**
	 * @name get screen
	 * Returns the axis-aligned bounding box of the current viewport.
	 * @return Rect
	 */
	cacheScreen() {
		const { width, height } = this.canvas;
		return this.screen = Rect.bound([
			new Vector2(width / 2, height / 2),
			new Vector2(width / 2, -height / 2),
			new Vector2(-width / 2, height / 2),
			new Vector2(-width / 2, -height / 2)
		].map(v => v.rotate(this.rotation).Ndiv(this.zoom).Vadd(this.position)));
	}
	/**
	 * Assuming the renderer is currently in screen-space, transforms to world-space, calls a rendering function, and then transforms back to screen-space.
	 * @param () => void render | The function to call while in the world-space context
	 */
	drawInWorldSpace(artist) {
		this.renderer.drawThrough(this, artist, false);
	}
	/**
	 * Assuming the renderer is currently in world-space, transforms to screen-space, calls a rendering function, and then transforms back to world-space.
	 * @param () => void render | The function to call while in the screen-space context
	 */
	drawInScreenSpace(artist) {
		this.renderer.drawThrough(this.inverse, artist, false);
	}
	transformToWorld() {
		const { renderer } = this;
		renderer.translate(renderer.middle);
		renderer.rotate(this.rotation);
		renderer.scale(this.zoom);
		renderer.translate(this.position.inverse);
	}
	transformToScreen() {
		const { renderer } = this;
		renderer.translate(this.position);
		renderer.scale(1 / this.zoom);
		renderer.rotate(-this.rotation);
		renderer.translate(renderer.middle.inverse);
	}
}
objectUtils.inherit(Camera2D, Camera);

/**
 * @implements Camera
 * Represents the camera in a 3D scene.
 * @prop Vector3 position | The location of the camera, in world-space. Starts at (0, 0, 0)
 * @prop Vector3 direction | The direction the camera is facing. This must be a unit vector, and starts as (0, 0, 1)
 */
class Camera3D extends Matrix4 {
	/**
	 * Creates a new camera at (0, 0, 0).
	 * @param ImageType canvas | The surface to target
	 */
	constructor(canvas) {
		super();

		// define parameters
		this.canvas = canvas;
		Vector2.defineReference(this, "position", new Vector3(0, 0, 0));
		Vector2.defineReference(this, "direction", new Vector3(0, 0, 1));
		this.rotation = 0;
		this.zoom = 1;

		// change handlers
		const handle = () => this.updateMatrix();
		this.position.onChange(handle);
		this.direction.onChange(handle);
		objectUtils.onChange(this, "rotation", handle);
		objectUtils.onChange(this, "zoom", handle);
		
		this.updateMatrix();
		this.perspective(Math.PI / 2, 0.1, 500);
	}
	/**
	 * Returns the product of the camera's projection matrix and itself, `projection * worldToScreen`.
	 * @return Matrix4
	 */
	get pcMatrix() {
		return this.projection.times(this);
	}
	/**
	 * Returns the projection matrix of the camera.
	 * This may vary as the dimensions of the rendering surface change.
	 * @return Matrix4
	 */
	get projection() {
		const img = this.canvas;
		return this.createProjection(img.height / img.width);
	}
	/**
	 * Configures the camera to use a custom projection.
	 * @param Matrix4 projection | The homogenous projection matrix to use
	 */
	set projection(a) {
		a = a.get();
		this.createProjection = () => a;
	}
	/**
	 * Configures the camera to use a perspective projection.
	 * @param Number fov | The field of view of the camera in radians
	 * @param Number zNear | The location of the near clipping plane
	 * @param Number zFar | The location of the far clipping plane
	 */
	perspective(fov, zNear, zFar) {
		this.createProjection = ar => Matrix4.perspective(ar, fov, zNear, zFar);
	}
	/**
	 * Configures the camera to use a orthographic projection.
	 * @param Number span | The size of the x and y spans included in the projection
	 * @param Number depth | The maximum depth included in the projection
	 */
	orthographic(span, depth) {
		this.createProjection = () => Matrix4.orthographic(span, span, depth);
	}
	updateMatrix() {
		const forward = this.direction;
		const quat = Quaternion.fromRotation(forward, this.rotation);
		const baseRight = forward.x || forward.z ? new Vector3(forward.z, 0, -forward.x).normalize() : Vector3.right;
		this.right = quat.rotate(baseRight);
		this.up = forward.cross(this.right);

		const trans = Matrix4.translation(this.position.inverse);
		
		const rotate = new Matrix3(
			this.right, this.up, forward
		).transpose().times(this.zoom);

		new Matrix4(rotate).times(trans, this);
	}
	/**
	 * Points the camera in a specific direction, with a specified angle from +z on the horizontal and vertical axes.
	 * The vertical input is clamped to avoid gimbal lock.
	 * @param Number xAngle | The angle in radians about the y axis from +z to the camera direction
	 * @param Number yAngle | The angle in radians about the x axis from +z to the camera direction
	 */
	look(xAngle, yAngle) {
		const limit = Math.PI / 2 - MathObject.EPSILON;
		yAngle = Number.clamp(yAngle, -limit, limit);
		this.direction = Vector3.forward
			.rotateAboutAxis(Vector3.right, -yAngle)
			.rotateAboutAxis(Vector3.up, -xAngle);
	}
}
objectUtils.inherit(Camera3D, Camera);