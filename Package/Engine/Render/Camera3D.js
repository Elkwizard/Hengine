/**
 * Represents a viewpoint on a Camera3D, and handles the projection (but not positioning) of the camera.
 * This class should not be constructed, and should instead be accessed by the `.lenses` property of a Camera3D.
 * @prop<immutable> Matrix4 pcMatrix | The product of the lens' projection matrix and the camera. This only updates when `.cacheScreen()` is called
 * @prop<immutable> Frustum screen | The World-Space frustum of the lens. This only updates when `.cacheScreen()` is called
 */
class Lens {
	constructor(camera, getViewport) {
		this.camera = camera;
		this.getViewport = getViewport;
		this.perspective(Math.PI / 2, 0.1, 500);
		this.cacheScreen();
	}
	get viewport() {
		return this.getViewport();
	}
	/**
	 * Returns the World-Space frustum of the lens, and synchronizes `.screen` and `.pcMatrix` to match the location and orientation of the lens and camera. 
	 * @return Frustum
	 */
	cacheScreen() {
		this.pcMatrix = this.projection.times(this.camera);
		this.screen = this.pcMatrix.determinant ? new Frustum(this.pcMatrix) : null;
		return this.screen;
	}
	/**
	 * Configures the lens to use a custom projection.
	 * @param Matrix4 projection | The homogenous projection matrix to use
	 */
	set projection(a) {
		a = a.get();
		this.createProjection = () => a;
	}
	/**
	 * Returns the projection matrix of the lens.
	 * This may vary as the dimensions of the rendering surface change.
	 * @return Matrix4
	 */
	get projection() {
		const { width, height } = this.viewport;
		return this.createProjection(height / width);
	}
	/**
	 * Configures the lens to use a perspective projection.
	 * @param Number fov | The field of view of the lens in radians
	 * @param Number zNear | The location of the near clipping plane
	 * @param Number zFar | The location of the far clipping plane
	 */
	perspective(fov, zNear, zFar) {
		this.createProjection = ar => Matrix4.perspective(ar, fov, zNear, zFar);
	}
	/**
	 * Configures the lens to use an orthographic projection.
	 * @param Number span | The size of the x and y spans included in the projection
	 * @param Number depth | The maximum depth included in the projection
	 */
	orthographic(span, depth) {
		this.createProjection = () => Matrix4.orthographic(span, span, depth);
	}
}

/**
 * @implements Camera
 * @type class Camera3D extends Matrix4 implements Camera<Vector3>
 * Represents the camera in a 3D scene.
 * @prop Vector3 direction | The direction the camera is facing. This must be a unit vector, and starts as (0, 0, 1)
 * @prop<immutable> Matrix4 pcMatrix | The product of the camera's projection matrix and itself. This only updates when cacheScreen() is called
 * @prop<immutable> Vector3 right | The local right direction of the camera, in the XZ World-Space plane
 * @prop<immutable> Vector3 up | The local up direction of the camera, in World-Space
 * @prop<immutable> Frustum screen | A small World-Space Frustum containing the frusta of all the camera's lenses. This only updates when cacheScreen() is called
 * @prop<immutable> Lens[] lenses | A list of the lenses of the camera, defining how and what objects are projected to different parts of the screen
 */
class Camera3D extends Matrix4 {
	constructor(getViewport) {
		super();
		this.getViewport = getViewport;

		// define parameters
		Vector3.defineReference(this, "position", new Vector3(0, 0, 0));
		Vector3.defineReference(this, "direction", new Vector3(0, 0, 1));
		this.rotation = 0;
		this.zoom = 1;

		// change handlers
		const handle = () => this.updateMatrix();
		this.position.onChange(handle);
		this.direction.onChange(() => this.updateDirection());
		objectUtils.onChange(this, "rotation", () => this.updateDirection());
		objectUtils.onChange(this, "zoom", handle);
		
		this.updateDirection();
		this.updateMatrix();
		this.perspective(Math.PI / 2, 0.1, 500);
		this.cacheScreen();
	}
	/**
	 * Sets the current pose of the camera to a given Transform3D, aligning local X, Y, and Z to their corresponding Camera-Space axes.
	 * @param Transform3D transform | The new pose for the camera
	 */
	set transform(transform) {
		const forward = transform.localDirectionToGlobal(Vector3.forward);
		const right = transform.localDirectionToGlobal(Vector3.right);
		this.direction = forward;
		this.position = transform.position;
		this.rotation = 0;
		const roll = this.right.angleTo(right);
		this.rotation = -roll.mag * Math.sign(roll.dot(forward));
	}
	/**
	 * Retrieves the current pose of the camera as a Transform3D.
	 * @return Transform3D
	 */
	get transform() {
		const { zoom } = this;
		this.zoom = 1;
		const transform = Transform3D.fromRigidMatrix(this);
		this.zoom = zoom;
		return transform;
	}
	/**
	 * Synchronizes `.screen` to match the location and orientation of the camera and returns it.
	 * This also calls `.cacheScreen()` on all the camera's Lenses.
	 * @return Frustum
	 */
	cacheScreen() {
		this.pcMatrix = this.projection.times(this);
		this.screen = this.pcMatrix.determinant ? new Frustum(this.pcMatrix) : null;
		return this.screen;
	}
	/**
	 * Returns the projection matrix of the camera.
	 * This may vary as the dimensions of the rendering surface change.
	 * @return Matrix4
	 */
	get projection() {
		const { width, height } = this.viewport;
		return this.createProjection(height / width);
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
	updateDirection() {
		const { direction } = this;
		const cross = direction.cross(Vector3.up);
		const right = cross.sqrMag.equals(0) ? Vector3.right : cross.normalize();
		this.right = right.rotate(direction.times(-this.rotation));
		this.updateMatrix();
	}
	updateMatrix() {
		this.up = this.direction.cross(this.right);

		const trans = Matrix4.translation(this.position.inverse);
		
		const rotate = new Matrix3(
			this.right.times(this.zoom),
			this.up.times(this.zoom),
			this.direction.times(this.zoom)
		).transpose();

		new Matrix4(rotate).times(trans, this);
	}
	/**
	 * Moves the camera by a specified amount along its direction.
	 * @param Number amount | The amount to move forward (in World-Space)
	 */
	advance(amount) {
		this.position.add(this.direction.times(amount));
	}
	/**
	 * Moves the camera in the X-Z World-Space plane perpendicular to its direction.
	 * @param Number amount | The amount to strafe (in World-Space). Positive values will move right, and negative values will move left
	 */
	strafe(amount) {
		this.position.add(this.right.times(amount));
	}
	/**
	 * Moves the camera along the y axis by a specified amount.
	 * @param Number amount | The amount to move by. Positive values will move down, and negative values will move up
	 */
	lift(amount) {
		this.position.y += amount;
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

D3.Camera = Camera3D;