class Camera extends Transform {
	constructor(x, y, rotation = 0, zoom = 1, engine) {
		super(x, y, rotation);
		this.zoom = zoom;
		this.engine = engine;
	}
	rotateTowards(rotation, ferocity = 0.1) {
		let dif = Geometry.signedAngularDist(rotation, this.rotation);
		this.rotation += dif * ferocity;
	}
	moveTowards(point, ferocity = 0.1) {
		const cameraPoint = this.position;
		let dif = point.Vminus(cameraPoint).Ntimes(ferocity);
		this.position = cameraPoint.plus(dif);
	}
	restoreZoom() {
		this.zoom = 1;
	}
	zoomIn(amount) {
		this.zoom *= 1 + amount;
	}
	zoomOut(amount) {
		this.zoom /= 1 + amount;
	}
	getScreen() {
		let { width, height } = this.engine.renderer;
		return Rect.bound([
			new Vector2(width / 2, height / 2),
			new Vector2(width / 2, -height / 2),
			new Vector2(-width / 2, height / 2),
			new Vector2(-width / 2, -height / 2)
		].map(v => v.rotate(this.rotation).div(this.zoom).plus(this.position)));
	}
	drawInWorldSpace(artist, c = renderer) {
		c.save();
		this.transformToWorld(c);
		artist();
		c.restore();
	}
	drawInScreenSpace(artist, c = renderer) {
		c.save();
		this.transformToScreen(c);
		artist();
		c.restore();
	}
	transformToWorld(artist) {
		artist.translate(artist.middle);
		artist.rotate(this.rotation);
		artist.scale(this.zoom);
		artist.translate(this.position.inverse);
	}
	transformToScreen(artist) {
		artist.translate(this.position);
		artist.scale(1 / this.zoom);
		artist.rotate(-this.rotation);
		artist.translate(artist.middle.inverse);
	}
	screenSpaceToWorldSpace(point) {
		return point.minus(middle).rotate(-this.rotation).over(this.zoom).plus(this.position);
	}
	worldSpaceToScreenSpace(point) {
		return point.minus(this.position).times(this.zoom).rotate(this.rotation).plus(middle);
	}
}