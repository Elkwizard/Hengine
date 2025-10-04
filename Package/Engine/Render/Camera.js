/**
 * @3d CameraN = Camera2D -> Camera3D
 */

/**
 * @page World-Space
 * The location in which all WorldObjects exist.
 * This space is fixed, and can only appear to move by virtue of the Camera moving.
 * The dimensionality of this space depends on whether the engine is in 2D Mode or 3D Mode.
 * Positions are represented by a VectorN, and transformations are represented by a TransformMatrixN.
 * WorldObjects should be drawn in World-Space.
 * All rendering targeted at `renderer` will be in this space by default when inside an ElementScript's `draw()`/`escapeDraw()` handler.
 * However, when in `draw()`, the WorldObject's Transform will also be applied.
 */

/**
 * @page Camera-Space
 * A coordinate frame overlapping World-Space which is completely relative to the camera.
 * This has the same dimensionality as World-Space, but moves as the camera moves and rotates.
 * In 2D Mode, It is aligned in so that it is identical to Screen-Space, except insofar as it is in the same space as WorldObjects.
 * Positions are represented by a VectorN and transformations are represented by a TransformMatrixN.
 * UIObjects that are intended to be interspersed with world elements should be drawn in Camera-Space.
 * All rendering targeted at `renderer` will be in this space by default when outside an ElementScript's `draw()`/`escapeDraw()` handler.
 */

/**
 * @page Screen-Space
 * A coordinate frame representing positions in the UI overlay, relative to the upper-left corner of the monitor.
 * Coordinates are represented in units of CSS Pixels, and the frame is unrotated relative to the monitor.
 * Positions are represented by a Vector2 and transformations are represented by a Matrix3.
 * UIObjects should, in general, be drawn in Screen-Space.
 * All rendering targeted at `ui` will be in this space by default.
 */

/**
 * @name class Camera extends Matrix
 * @interface
 * @type interface Camera<Vector> extends Matrix
 * Represents a camera in a scene targeting a particular size of rendering surface.
 * The transformation represented by this matrix is from World-Space to Camera-Space.
 * `Vector` in the context of this class refers to either `Vector2` or `Vector3` depending on whether Camera2D or Camera3D is used.
 * Changes to camera position and orientation should be made before the screen is cleared, to avoid objects being rendered from multiple different camera positions over the course of the frame.
 * @prop<stable> Vector position | The location of the camera in World-Space
 * @prop Number zoom | The magnification level of the camera
 * @prop Number rotation | The clockwise roll (in radians) of the camera. Starts at 0
 */
class Camera {
	get viewport() {
		return this.getViewport();
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
	 * Smoothly moves the camera toward a new position value.
	 * @param Vector point | The new position to move toward
	 * @param Number ferocity | The degree to which the camera should move toward the new position, on [0, 1]
	 */
	moveTowards(point, ferocity = 0.1) {
		const cameraPoint = this.position;
		const diff = point.minus(cameraPoint).times(ferocity);
		this.position = cameraPoint.plus(diff);
	}
	/**
	 * Maps a given point from Camera-Space to World-Space.
	 * @param Vector point | The point to transform
	 * @return Vector
	 */
	cameraToWorld(point) {
		return this.inverse.times(point);
	}
	screenToWorld(point) {
		return this.cameraToWorld(point);
	}
	screenSpaceToWorldSpace(point) {
		return this.screenToWorld(point);
	}
	/**
	 * Maps a given point from World-Space to Camera-Space.
	 * @param Vector point | The point to transform
	 * @return Vector
	 */
	worldToCamera(point) {
		return this.times(point);
	}
	worldToScreen(point) {
		return this.worldToCamera(point);
	}
	worldSpaceToScreenSpace(point) {
		return this.worldToScreen(point);
	}
	/**
	 * Assuming a renderer is currently in Camera-Space, transforms to World-Space, calls a rendering function, and then transforms back to Camera-Space.
	 * @param () => void render | The function to call while in the World-Space context
	 * @param Artist renderer? | The renderer which `render()` writes to, which should be transformed
	 */
	drawInWorldSpace(artist, renderer) {
		this.transformToWorld(renderer);
		artist();
		this.transformToCamera(renderer);
	}
	/**
	 * Assuming a renderer is currently in World-Space, transforms to Camera-Space, calls a rendering function, and then transforms back to World-Space.
	 * @param () => void render | The function to call while in the Camera-Space context
	 * @param Artist renderer | The renderer which `render()` writes to, which should be transformed
	 */
	drawInCameraSpace(artist, renderer) {
		this.transformToCamera(renderer);
		artist();
		this.transformToWorld(renderer);
	}
	drawInScreenSpace(artist) {
		this.drawInCameraSpace(artist);
	}
	transformToWorld(renderer = window.renderer /* compatibility */) {
		renderer.enterWorldSpace(this);
	}
	transformToCamera(renderer = window.renderer /* compatibility */) {
		renderer.exitWorldSpace(this);
	}
	transformToScreen() {
		this.transformToCamera();
	}
	/**
	 * Creates an undisplaced camera for a provided rendering surface, targeting the entire surface.
	 * In 2D, this camera is positioned at the center of the surface, and in 3D it is positioned at (0, 0, 0) and pointing forward.
	 * @param CanvasImage/Frame surface | The rendering surface to target
	 * @return Camera
	 */
	static forSurface(surface) {
		return new this(() => new Rect(0, 0, surface.width, surface.height));
	}
}

/**
 * @implements Camera
 * @type class Camera2D extends Matrix3 implements Camera<Vector2>
 * Represents the camera in a 2D scene.
 */
class Camera2D extends Matrix3 {
	constructor(getViewport) {
		super();
		this.getViewport = getViewport;
		const { width, height } = this.viewport;
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
		const { x: vx, y: vy, width: vw, height: vh } = this.viewport;
		const { x, y } = this.position;
		const c = this.cosRotation;
		const s = this.sinRotation;
		const z = this.zoom;
		this[6] = vw / 2 - x * c * z + y * s * z + vx;
		this[7] = vh / 2 - x * s * z - y * c * z + vy;
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
	 * Zooms in/out about a specific point (in World-Space) by a specific factor.
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
		const { width, height } = this.viewport;
		const { vertices } = new Rect(0, 0, width, height);
		return this.screen = Rect.bound(vertices.map(v => this.screenToWorld(v)));
	}
}
objectUtils.inherit(Camera2D, Camera);

D2.Camera = Camera2D;