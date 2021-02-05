const DRAGGABLE = new ElementScript("DRAGGABLE", {
	init(l, key = "Left", bounds = null) {
		l.mouse = this.engine.mouse;
		l.dragged = false;
		l.key = key;
		l.offset = Vector2.origin;
		l.bounds = bounds;
		this.engine.scene.mouseEvents = true;
	},
	click(l, key, mouse) {
		if (key !== l.key) return;
		l.dragged = true;
		l.offset = this.transform.globalSpaceToLocalSpace(mouse);
	},
	update(l) {
		if (l.mouse.justReleased("Left")) l.dragged = false; 
		if (l.dragged) {
			this.transform.position = l.mouse.world.minus(l.offset);
			if (l.bounds) {
				this.cacheBoundingBoxes();
				let { x, y, width, height } = this.__boundingBox;
				let ox = x - this.transform.position.x;
				let oy = y - this.transform.position.y;
				if (x < l.bounds.x) x = l.bounds.x;
				if (y < l.bounds.y) y = l.bounds.y;
				if (x + width > l.bounds.x + l.bounds.width) x = l.bounds.x + l.bounds.width - width;
				if (y + height > l.bounds.y + l.bounds.height) y = l.bounds.y + l.bounds.height - height;
				this.transform.position.x = x - ox;
				this.transform.position.y = y - oy;
			}
			this.cacheBoundingBoxes();
			if (this.body) {
				//keep awake
				this.stop();
				this.body.wake();
			}
		}
	}
});