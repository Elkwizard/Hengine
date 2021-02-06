class Camera extends Matrix3 {
	constructor(x, y, rotation = 0, zoom = 1, engine) {
		super();	
		this.engine = engine;
		this._position = Vector2.origin;
		delete this._position.x;
		delete this._position.y;
		const self = this;
		Object.defineProperties(this._position, {
			x: {
				set(a) {
					x = a;
					self.updateTranslationMatrix();
				},
				get: () => x
			},
			y: {
				set(a) {
					y = a;
					self.updateTranslationMatrix();
				},
				get: () => y
			}
		});
		this.zoom = zoom;
		this.rotation = rotation;
	}
	set position(a) {
		this._position.x = a.x;
		this._position.y = a.y;
	}
	get position() {
		return this._position;
	}
	set rotation(a) {
		const cos = Math.cos(a);
		const sin = Math.sin(a);
		this._rotation = a;
		this.cosRotation = cos;
		this.sinRotation = sin;
		this.updateMatrix();
	}
	get rotation() {
		return this._rotation;
	}
	set zoom(a) {
		this._zoom = a;
		this.updateMatrix();
	}
	get zoom() {
		return this._zoom;
	}
	updateTranslationMatrix() {
		const { x, y } = this._position;
		const c = this.cosRotation;
		const s = this.sinRotation;
		const z = this.zoom;
		const w = this.engine.renderer.width;
		const h = this.engine.renderer.height;
		this[6] = w / 2 - x * c * z + y * s * z;
		this[7] = h / 2 - x * s * z - y * c * z;
	}
	updateMatrix() {
		const c = this.cosRotation;
		const s = this.sinRotation;
		const z = this.zoom;
		this[0] = c * z;
		this[1] = s * z;
		this[3] = -s * z;
		this[4] = c * z;
		this.updateTranslationMatrix();
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
		const { renderer } = this.engine;
		renderer.translate(renderer.middle);
		renderer.rotate(this.rotation);
		renderer.scale(this.zoom);
		renderer.translate(this.position.inverse);
	}
	transformToScreen() {
		const { renderer } = this.engine;
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