class Transform {
	constructor(x, y, rotation) {
		Vector2.defineReference(this, "position", new Vector2(x, y));
		this.rotation = rotation;
	}
	set rotation(a) {
		this._rotation = a;
		this.cosRotation = Math.cos(a);
		this.sinRotation = Math.sin(a);
	}
	get rotation() {
		return this._rotation;
	}
	get direction() {
		return new Vector2(this.cosRotation, this.sinRotation);
	}
	set direction(v) {
		this.angle = v.angle;
	}
	get(transf = new Transform(0, 0, 0)) {
		transf.position = this.position;
		transf.rotation = this.rotation;
		return transf;
	}
	dif(transf) {
		const EPSILON = 0.001;
		let dx = Math.abs(this.position.x - transf.position.x);
		let dy = Math.abs(this.position.y - transf.position.y);
		let dr = Math.abs(this.rotation - transf.rotation);
		return dx > EPSILON || dy > EPSILON || dr > EPSILON;
	}
	rotateAround(point, rotation) {
		let dif = this.position.Vminus(point);
		dif.rotate(rotation);
		dif.add(point);
		this.position = dif;
		this.rotation += rotation;
	}
	worldSpaceToModelSpace(v) {
		return v.Vminus(this.position).rotate(-this.rotation);
	}
	modelSpaceToWorldSpace(v) {
		return v.rotated(this.rotation).Vplus(this.position);
	}
	drawInModelSpace(artist, renderer) {
		let r = this.rotation;
		let { x, y } = this.position;
		renderer.translate(x, y);
		if (r) renderer.rotate(r);
		artist();
		if (r) renderer.rotate(-r);
		renderer.translate(-x, -y);
	}
	drawInWorldSpace(artist, renderer) {
		let r = this.rotation;
		let { x, y } = this.position;
		if (r) renderer.rotate(-r);
		renderer.translate(-x, -y);
		artist();
		renderer.translate(x, y);
		if (r) renderer.rotate(r);
	}
	drawWithoutRotation(artist, renderer) {
		let r = this.rotation;
		if (r) renderer.rotate(-r);
		artist();
		if (r) renderer.rotate(r);
	}
}