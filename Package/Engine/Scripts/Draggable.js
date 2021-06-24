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
			obj.transform.position = this.getMousePosition().minus(this.offset);
			if (this.bounds) {
				obj.cacheBoundingBoxes();
				let { x, y, width, height } = obj.__boundingBox;
				let ox = x - obj.transform.position.x;
				let oy = y - obj.transform.position.y;
				if (x < this.bounds.x) x = this.bounds.x;
				if (y < this.bounds.y) y = this.bounds.y;
				if (x + width > this.bounds.x + this.bounds.width) x = this.bounds.x + this.bounds.width - width;
				if (y + height > this.bounds.y + this.bounds.height) y = this.bounds.y + this.bounds.height - height;
				obj.transform.position.x = x - ox;
				obj.transform.position.y = y - oy;
			}
			obj.cacheBoundingBoxes();
			if (obj.scripts.has(PHYSICS)) {
				//keep awake
				obj.scripts.PHYSICS.stop();
			}
		}
	}
	getMousePosition(obj) {
		return (obj instanceof UIObject) ? this.mouse.screen : this.mouse.world;
	}
}