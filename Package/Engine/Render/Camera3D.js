/**
 * @implements Camera
 * @type class Camera3D extends Matrix4 implements Camera<Vector3>
 * Represents the camera in a 3D scene.
 * @prop Vector3 direction | The direction the camera is facing. This must be a unit vector, and starts as (0, 0, 1)
 * @prop<immutable> Matrix4 pcMatrix | The product of the camera's projection matrix and itself. This only updates when cacheScreen() is called
 * @prop<immutable> Vector3 right | The local right direction of the camera, in the XZ World-Space plane
 * @prop<immutable> Vector3 up | The local up direction of the camera, in World-Space
 */
class Camera3D extends Matrix4 {
	/**
	 * Creates a new camera at (0, 0, 0) pointing toward the positive z axis.
	 * @param ImageType canvas | The surface to target
	 */
	constructor(canvas) {
		super();

		// define parameters
		this.canvas = canvas;
		Vector3.defineReference(this, "position", new Vector3(0, 0, 0));
		Vector3.defineReference(this, "direction", new Vector3(0, 0, 1));
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
		this.cacheScreen();
	}
	/**
	 * @name get screen
	 * Returns the World-Space frustum of the camera, and synchronizes `.screen` and `.pcMatrix` to match the location and orientation of the camera. 
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
		const quat = Quaternion.fromRotation(forward, -this.rotation);
		const baseRight = forward.x || forward.z ? new Vector3(forward.z, 0, -forward.x).normalize() : Vector3.right;
		this.right = quat.rotate(baseRight);
		this.up = forward.cross(this.right);

		const trans = Matrix4.translation(this.position.inverse);
		
		const rotate = new Matrix3(
			this.right.times(this.zoom),
			this.up.times(this.zoom),
			forward
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

if (IS_3D) ND.Camera = Camera3D;