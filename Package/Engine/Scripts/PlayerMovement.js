const PLAYER_MOVEMENT = new ElementScript("PLAYER_MOVEMENT", {
	init(l) {
		l.keyboard = this.engine.keyboard;
		if (!this.controls.up) {
			this.controls = new Controls("w", "s", "a", "d");
		}
		this.mobilize();
	},
	update(l) {
		if (l.keyboard.pressed(this.controls.down)) this.velocity.y += 0.4;
		if (l.keyboard.pressed(this.controls.left)) this.velocity.x += -0.2;
		else if (l.keyboard.pressed(this.controls.right)) this.velocity.x += 0.2;
		if (l.keyboard.pressed(this.controls.up)) {
			if (this.colliding.bottom) {
				this.velocity.y -= 10;
			}
		}
	}
});