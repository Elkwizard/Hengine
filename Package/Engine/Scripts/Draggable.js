/**
 * Makes a SceneObject draggable with the mouse.
 * If the object has PHYSICS, then it will become stationary while being dragged.
 * This forces the object to accept mouse events.
 * Only UIObjects can be made draggable in 3D Mode.
 * ```js
 * // create a draggable object with no bounds
 * const object = scene.main.addUIElement("box", width / 2, height / 2, 200, 100);
 * object.scripts.add(DRAGGABLE, "Left");
 * ```
 * @prop String key | The mouse button that can be used for dragging
 * @prop Boolean dragged | Whether the object is currently being dragged
 * @prop Rect/null bounds | The bounds in which the object can be dragged
 */
class DRAGGABLE extends ElementScript {
	/**
	 * Makes the object draggable with the mouse.
	 * @param String key | The mouse button that can be used to drag the object
	 * @param Rect bounds? | The bounds in which the object can be dragged. Default is null
	 */
	init(obj, key = "Left", bounds = null) {
		this.mouse = obj.engine.mouse;
		this.dragged = false;
		this.key = key;
		this.offset = Vector2.zero;
		this.bounds = bounds;
		obj.engine.scene.mouseEvents = true;
	}
	click(obj, key, mouse) {
		if (key !== this.key) return;
		this.dragged = true;
		this.offset = obj.transform.globalToLocal(this.getMousePosition());
	}
	update(obj) {
		if (this.mouse.justReleased(this.key)) this.dragged = false; 
		if (this.dragged) {
			obj.transform.position = this.getMousePosition().minus(obj.transform.localToGlobal(this.offset).minus(obj.transform.position));
			obj.cacheBoundingBoxes();
			if (obj.scripts.has(PHYSICS)) obj.scripts.PHYSICS.stop();
		}
		if (this.bounds) {
			obj.cacheBoundingBoxes();
			const boxToPosition = obj.transform.position.minus(obj.__boundingBox.min);
			const positionToBox = obj.transform.position.minus(obj.__boundingBox.max);
			const { bounds } = this;
			const { min, max } = bounds;
			const newPosition = Vector2.clamp(obj.transform.position, min.plus(boxToPosition), max.plus(positionToBox));
			if (!newPosition.equals(obj.transform.position) && obj.scripts.has(PHYSICS)) obj.scripts.PHYSICS.stop();
			obj.transform.position = newPosition;
		}
	}
	getMousePosition(obj) {
		return obj instanceof UIObject ? this.mouse.screen : this.mouse.world;
	}
}