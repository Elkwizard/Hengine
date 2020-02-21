class LineCollider {
	constructor(x, y, x2, y2) {
		if (typeof x === "object") {
			this.a = new Vector2(x.x, x.y);
			this.b = new Vector2(y.x, y.y);
		} else {
			this.a = new Vector2(x, y);
			this.b = new Vector2(x2, y2);
		}
	}
	evaluate(x) {
		return this.slope * x + this.a.y;
	}
	get slope() {
		let dx = this.b.x - this.a.x;
		let dy = this.b.y - this.a.y;
		return dy / dx;
	}
	collidePoint(x, y) {
		return this.evaluate(x) == y;
	}
}
class RectCollider {
	constructor(x, y, width, height, rotation = 0) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.rotation = rotation;
	}
	collideBox(hitbox) {
		if (hitbox.width !== void 0) {
			return this.x < hitbox.x + hitbox.width && hitbox.x < this.x + this.width && this.y < hitbox.y + hitbox.height && hitbox.y < this.y + this.height
		}
		else {
			if (this.rotation) {
				let hypotA = Math.sqrt((this.width / 2) ** 2 + (this.height / 2) ** 2);
				let r1 = new Rect(this.middle.x - hypotA, this.middle.y - hypotA, hypotA * 2, hypotA * 2);
				let r2 = new Rect(hitbox.middle.x - hitbox.radius, hitbox.middle.y - hitbox.radius, hitbox.radius * 2, hitbox.radius * 2);
				if (!(r1.x < r2.x + r2.width && r2.x < r1.x + r1.width && r1.y < r2.y + r2.height && r2.y < r1.y + r1.height)) return false;
				let aEdges = PhysicsObject.getEdges(this);
				let edges = [aEdges[0], aEdges[1]];
				let normal = new Vector2(hitbox.x - this.x, hitbox.y - this.y);
				normal.normalize();
				edges.push(normal);
				let aCorners = PhysicsObject.getCorners(this);
				let colliding = true;
				for (let i = 0; i < edges.length; i++) {
					let edge = edges[i];
					let aRange = new Range();
					let bRange = new Range();
					for (let point of aCorners) {
						let projection = Geometry.projectPointOntoLine(point, edge);
						aRange.include(projection);
					}
					let projection = Geometry.projectPointOntoLine(hitbox.middle, edge);
					bRange.min = projection - hitbox.radius;
					bRange.max = projection + hitbox.radius;
					if (!Range.intersect(aRange, bRange)) {
						colliding = false;
						break;
					}
				}
				return colliding;
			} else {
				return hitbox.collideBox(this);
			}
		}
	}
	get middle() {
		return { x: this.x + this.width / 2, y: this.y + this.height / 2 };
	}
	collidePoint(x, y) {
		if (typeof x == "object") {
			y = x.y
			x = x.x;
		}
		if (this.rotation) {
			let hypotA = Math.sqrt((this.width / 2) ** 2 + (this.height / 2) ** 2);
			let r1 = new Rect(this.middle.x - hypotA, this.middle.y - hypotA, hypotA * 2, hypotA * 2);
			if (!(r1.x < x && x < r1.x + r1.width && r1.y < y && y < r1.y + r1.height)) return false;
			let aEdges = PhysicsObject.getEdges(this);
			let edges = aEdges;
			let aCorners = PhysicsObject.getCorners(this);
			let colliding = true;
			for (let i = 0; i < edges.length; i++) {
				let edge = edges[i];
				let aRange = new Range();
				for (let point of aCorners) {
					let projection = Geometry.projectPointOntoLine(point, edge);
					aRange.include(projection);
				}
				let projection = Geometry.projectPointOntoLine(new Vector2(x, y), edge);
				if (projection < aRange.min || projection > aRange.max) {
					colliding = false;
					break;
				}
			}
			return colliding;
		} else {
			return (x > this.x && x < this.x + this.width && y > this.y && y < this.y + this.height);
		}
	}
}
class CircleCollider {
	constructor(x, y, radius, rotation = 0) {
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.rotation = rotation;
	}
	get middle() {
		return { x: this.x, y: this.y };
	}
	collideBox(hitbox) {
		if (hitbox.width !== void 0) {
			return Geometry.overlapCircleRect(this, hitbox);
		}
		else {
			return ((this.x - hitbox.x) ** 2) + ((this.y - hitbox.y) ** 2) < (this.radius + hitbox.radius) ** 2;
		}
	}
	collidePoint(x, y) {
		if (typeof x == "object") {
			y = x.y
			x = x.x;
		}
		return ((this.x - x) ** 2) + ((this.y - y) ** 2) < this.radius ** 2;
	}
}