/**
 * Represents the camera in a scene.
 * This class should be constructed and is available via the `.camera` property of Scene.
 * The transformation represented by this matrix is from screen-space to world-space.
 * @prop Vector2 position | The current center of the camera's view. This starts as `new Vector2(width / 2, height / 2)`
 * @prop Number rotation | The clockwise roll (in radians) of the camera. Starts at 0
 * @prop Number zoom | The zoom factor of the camera. Starts at 1
 */
class Camera extends Matrix3 {
	constructor(x, y, rotation = 0, zoom = 1, engine) {
		super();	
		this.engine = engine;
		this._position = Vector2.origin;
		delete this._position.x;
		delete this._position.y;
		const self = this;
		Object.defineProperties(this._position, {
			x: {
				set(a) {
					x = a;
					self.updateTranslationMatrix();
				},
				get: () => x
			},
			y: {
				set(a) {
					y = a;
					self.updateTranslationMatrix();
				},
				get: () => y
			}
		});
		this.zoom = zoom;
		this.rotation = rotation;
		this.cacheScreen();
	}
	set position(a) {
		this._position.x = a.x;
		this._position.y = a.y;
	}
	get position() {
		return this._position;
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
		const { x, y } = this._position;
		const c = this.cosRotation;
		const s = this.sinRotation;
		const z = this.zoom;
		const w = this.engine.canvas.width;
		const h = this.engine.canvas.height;
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
		const { width, height } = this.engine.canvas;
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
		let renderer = this.engine.renderer;
		renderer.save();
		this.transformToWorld(renderer);
		artist();
		renderer.restore();
	}
	/**
	 * Assuming the renderer is currently in world-space, transforms to screen-space, calls a rendering function, and then transforms back to world-space.
	 * @param () => void render | The function to call while in the screen-space context
	 */
	drawInScreenSpace(artist) {
		let renderer = this.engine.renderer;
		renderer.save();
		this.transformToScreen(renderer);
		artist();
		renderer.restore();
	}
	transformToWorld() {
		const { renderer } = this.engine;
		renderer.translate(renderer.middle);
		renderer.rotate(this.rotation);
		renderer.scale(this.zoom);
		renderer.translate(this.position.inverse);
	}
	transformToScreen() {
		const { renderer } = this.engine;
		renderer.translate(this.position);
		renderer.scale(1 / this.zoom);
		renderer.rotate(-this.rotation);
		renderer.translate(renderer.middle.inverse);
	}
	/**
	 * Maps a given point from screen-space to world-space.
	 * @param Vector2 point | The point to transform
	 * @return Vector2
	 */
	screenSpaceToWorldSpace(point) {
		return point.Vminus(this.engine.renderer.middle).rotate(-this.rotation).Ndiv(this.zoom).Vadd(this.position);
	}
	/**
	 * Maps a given point from world-space to screen-space.
	 * @param Vector2 point | The point to transform
	 * @return Vector2
	 */
	worldSpaceToScreenSpace(point) {
		return point.Vminus(this.position).Nmul(this.zoom).rotate(this.rotation).Vadd(this.engine.renderer.middle);
	}
}