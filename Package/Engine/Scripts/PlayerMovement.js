class PLAYER_MOVEMENT extends ElementScript {
	init(obj, controlPoint = Vector2.zero) {
		this.controlPoint = controlPoint;
		this.keyboard = obj.engine.keyboard;
		this.controls = new Controls("w", "s", "a", "d");
		obj.scripts.PHYSICS.mobile = true;
	}
	update(obj) {
		const rb = obj.scripts.PHYSICS;
		const cp = obj.transform.localToGlobal(this.controlPoint);
		if (this.keyboard.pressed(this.controls.down)) rb.applyImpulseMass(cp, Vector2.y(0.4));
		if (this.keyboard.pressed(this.controls.left)) rb.applyImpulseMass(cp, Vector2.x(-0.2));
		else if (this.keyboard.pressed(this.controls.right)) rb.applyImpulseMass(cp, Vector2.x(0.2));
		if (this.keyboard.pressed(this.controls.up))
			if (rb.colliding.bottom) {
				const solid = rb.colliding.bottom.find(({ element }) => !element.scripts.PHYSICS.isTrigger);
				if (solid) rb.velocity.y = -10;
			}
	}
}