class Transform extends Matrix3 {
	constructor(x, y, rotation) {
		super(
			1, 0, x,
			0, 1, y,
			0, 0, 1
		);
		this.rotation = rotation;
		
		// create an double bound position object, so (transf.position.x += ...) works

		this._position = Vector2.origin;
		delete this._position.x;
		delete this._position.y;
		const self = this;
		Object.defineProperties(this._position, {
			x: {
				set: value => self[6] = value,
				get: () => self[6],
				configurable: true
			},
			y: {
				set: value => self[7] = value,
				get: () => self[7],
				configurable: true
			}
		});
	}
	set position(vec) {
		this[6] = vec.x;
		this[7] = vec.y;
	}
	get position () {
		return this._position;
	}
	set rotation(a) {
		this._rotation = a;
		const cos = Math.cos(a);
		const sin = Math.sin(a);
		this.cosRotation = cos;
		this.sinRotation = sin;
		this[0] = cos;
		this[1] = sin;
		this[3] = -sin;
		this[4] = cos;
	}
	get rotation() {
		return this._rotation;
	}
	set direction(v) {
		this.rotation = v.angle;
	}
	get direction() {
		return new Vector2(this.cosRotation, this.sinRotation);
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
	globalSpaceToLocalSpace(v) {
		return v.Vminus(this.position).rotate(-this.rotation);
	}
	localSpaceToGlobalSpace(v) {
		return v.rotated(this.rotation).Vadd(this.position);
	}
	drawInLocalSpace(artist, renderer) {
		const r = this.rotation;
		const x = this[6];
		const y = this[7];
		renderer.translate(x, y);
		if (r) renderer.rotate(r);
		artist();
		if (r) renderer.rotate(-r);
		renderer.translate(-x, -y);
	}
	drawInGlobalSpace(artist, renderer) {
		const r = this.rotation;
		const x = this[6];
		const y = this[7];
		if (r) renderer.rotate(-r);
		renderer.translate(-x, -y);
		artist();
		renderer.translate(x, y);
		if (r) renderer.rotate(r);
	}
	drawWithoutRotation(artist, renderer) {
		const r = this.rotation;
		if (r) renderer.rotate(-r);
		artist();
		if (r) renderer.rotate(r);
	}
	static combine(a, b) {
		let tx = a.position.x;
		let ty = a.position.y;
		tx += b.position.x * a.cosRotation - b.position.y * a.sinRotation;
		ty += b.position.x * a.sinRotation + b.position.y * a.cosRotation;
		const rotation = a.rotation + b.rotation;
		return new Transform(tx, ty, rotation);
	}
}