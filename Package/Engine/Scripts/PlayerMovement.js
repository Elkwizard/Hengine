class PLAYER_MOVEMENT extends ElementScript {
	init(obj) {
		this.keyboard = obj.engine.keyboard;
		if (!obj.controls.up) {
			obj.controls = new Controls("w", "s", "a", "d");
		}
		obj.scripts.PHYSICS.mobile = true;
	}
	update(obj) {
		const rb = obj.scripts.PHYSICS;
		if (this.keyboard.pressed(obj.controls.down)) rb.velocity.y += 0.4;
		if (this.keyboard.pressed(obj.controls.left)) rb.velocity.x += -0.2;
		else if (this.keyboard.pressed(obj.controls.right)) rb.velocity.x += 0.2;
		if (this.keyboard.pressed(obj.controls.up)) {
			if (rb.colliding.bottom) {
				rb.velocity.y -= 10;
			}
		}
	}
}