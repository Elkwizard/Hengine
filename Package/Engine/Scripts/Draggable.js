class DRAGGABLE extends ElementScript {
	init(obj, key = "Left", bounds = null) {
		this.mouse = obj.engine.mouse;
		this.dragged = false;
		this.key = key;
		this.offset = Vector2.origin;
		this.bounds = bounds;
		obj.engine.scene.mouseEvents = true;
	}
	click(obj, key, mouse) {
		if (key !== this.key) return;
		this.dragged = true;
		this.offset = obj.transform.globalSpaceToLocalSpace(this.getMousePosition());
	}
	update(obj) {
		if (this.mouse.justReleased(this.key)) this.dragged = false; 
		if (this.dragged) {
			obj.transform.position = this.getMousePosition().minus(obj.transform.localSpaceToGlobalSpace(this.offset).minus(obj.transform.position));
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
		return (obj instanceof UIObject) ? this.mouse.screen : this.mouse.world;
	}
}