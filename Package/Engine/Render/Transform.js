class Transform {
	constructor(x, y, rotation) {
		this.position = new Vector2(x, y);
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
	get() {
		return new Transform(this.position.x, this.position.y, this.rotation);
	}
	rotateAround(point, rotation) {
		let dif = this.position.minus(point);
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
	drawInModelSpace(artist, c = renderer) {
		c.translate(this.position.x, this.position.y);
		c.rotate(this.rotation);
		artist();
		c.rotate(-this.rotation);
		c.translate(-this.position.x, -this.position.y);
	}
	drawInWorldSpace(artist, c = renderer) {
		c.rotate(-this.rotation);
		c.translate(-this.position.x, -this.position.y);
		artist();
		c.translate(this.position.x, this.position.y);
		c.rotate(this.rotation);
	}
}