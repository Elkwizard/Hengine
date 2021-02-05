class Camera extends Transform {
	constructor(x, y, rotation = 0, zoom = 1, engine) {
		super(x, y, rotation);
		this.zoom = zoom;
		this.engine = engine;
		this.screen = new Rect(0, 0, 1, 1);
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
	cacheScreen() {
		let { width, height } = this.engine.renderer;
		this.screen = Rect.bound([
			new Vector2(width / 2, height / 2),
			new Vector2(width / 2, -height / 2),
			new Vector2(-width / 2, height / 2),
			new Vector2(-width / 2, -height / 2)
		].map(v => v.rotate(this.rotation).Ndiv(this.zoom).Vadd(this.position)));
		return this.screen;
	}
	drawInWorldSpace(artist) {
		let renderer = this.engine.renderer;
		renderer.save();
		this.transformToWorld(renderer);
		artist();
		renderer.restore();
	}
	drawInScreenSpace(artist) {
		let renderer = this.engine.renderer;
		renderer.save();
		this.transformToScreen(renderer);
		artist();
		renderer.restore();
	}
	transformToWorld() {
		let renderer = this.engine.renderer;
		renderer.translate(renderer.middle);
		renderer.rotate(this.rotation);
		renderer.scale(this.zoom);
		renderer.translate(this.position.inverse);
	}
	transformToScreen() {
		let renderer = this.engine.renderer;
		renderer.translate(this.position);
		renderer.scale(1 / this.zoom);
		renderer.rotate(-this.rotation);
		renderer.translate(renderer.middle.inverse);
	}
	screenSpaceToWorldSpace(point) {
		return point.Vminus(this.engine.renderer.middle).rotate(-this.rotation).Ndiv(this.zoom).Vadd(this.position);
	}
	worldSpaceToScreenSpace(point) {
		return point.Vminus(this.position).Nmul(this.zoom).rotate(this.rotation).Vadd(this.engine.renderer.middle);
	}
}