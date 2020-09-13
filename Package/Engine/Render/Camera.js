class Camera {
	constructor(x, y, width, height, zoom = 1, rotation = 0) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.rotation = rotation;
		this.zoom = zoom;
		this.view = new Frame(width, height);
		this.newView = new Frame(width, height);
	}
	get vertices() {
		return [
			new Vector2(this.x, this.y),
			new Vector2(this.x + this.width, this.y),
			new Vector2(this.x + this.width, this.y + this.height),
			new Vector2(this.x, this.y + this.height)
		];
	}
	set middle(a) {
		this.x = a.x - this.width / 2;
		this.y = a.y - this.height / 2;
	}
	get middle() {
		return new Vector2(this.x + this.width / 2, this.y + this.height / 2);
	}
	move(vector) {
		this.x += vector.x;
		this.y += vector.y;
	}
	rotateTowards(rotation, ferocity = 0.1) {
		let dif = Geometry.signedAngularDist(rotation, this.rotation);
		this.rotation += dif * ferocity;
	}
	moveTowards(point, ferocity = 0.1) {
		const cameraPoint = this.middle;
		let dif = point.Vminus(cameraPoint).Ntimes(ferocity);
		this.middle = cameraPoint.plus(dif);
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
	createView() {
		this.newView = new this.RenderType(width, height);
	}
	getWorld() {
		let middle = this.middle;
		let m = new Polygon(this.vertices.map(vert => vert.Vminus(middle))).getModel(new Transform(this.middle.x, this.middle.y, this.rotation));
		m = m.scale(1 / this.zoom);
		return m;
	}
	updateView(width, height) {
		this.view.width = width;
		this.view.height = height;
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
		artist.translate(width / 2, height / 2);
		artist.rotate(this.rotation);
		artist.scale(this.zoom, this.zoom);
		artist.translate(-width / 2, -height / 2);
		artist.translate(-this.x, -this.y);
	}
	transformFromWorld(artist) {
		artist.translate(this.x, this.y);
		artist.translate(width / 2, height / 2);
		artist.scale(1 / this.zoom, 1 / this.zoom);
		artist.rotate(-this.rotation);
		artist.translate(-width / 2, -height / 2);
	}
	screenSpaceToWorldSpace(point) {
		point = Geometry.rotatePointAround(new Vector2(width / 2, height / 2), point, -this.rotation);
		let newX = (point.x - width / 2) / this.zoom + width / 2 + this.x;
		let newY = (point.y - height / 2) / this.zoom + height / 2 + this.y;
		return new Vector2(newX, newY) //return the result
	}
	worldSpaceToScreenSpace(point) {
		let newX = this.zoom * (point.x - width / 2 - this.x) + width / 2;
		let newY = this.zoom * (point.y - height / 2 - this.y) + height / 2;
		return Geometry.rotatePointAround(new Vector2(width / 2, height / 2), new Vector2(newX, newY), this.rotation); //return the result
	}
}