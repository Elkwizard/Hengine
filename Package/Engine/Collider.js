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
	constructor(home) {
		this.home = home;
	}
	collideBox(hitbox) {
		if (!hitbox.radius) {
			return this.home.x < hitbox.x + hitbox.width && hitbox.x < this.home.x + this.home.width && this.home.y < hitbox.y + hitbox.height && hitbox.y < this.home.y + this.home.height
		} else {
			if (this.home.rotation) {
				let r1 = PhysicsObject.getBoundingBox(this.home);
				let r2 = PhysicsObject.getBoundingBox(hitbox);
				if (!Geometry.overlapRectRect(r1, r2)) return false;
				let aEdges = this.home.getEdges();
				let edges = [aEdges[0], aEdges[1]];
				let normal = new Vector2(hitbox.x - this.home.x, hitbox.y - this.home.y);
				normal.normalize();
				edges.push(normal);
				let aCorners = this.home.getCorners();
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
				return hitbox.collider.collideBox(this.home);
			}
		}
	}
	collidePoint(x, y) {
		if (typeof x == "object") {
			y = x.y
			x = x.x;
		}
		if (this.home.rotation) {
			let hypotA = Math.sqrt((this.home.width / 2) ** 2 + (this.home.height / 2) ** 2);
			let r1 = new Rect(this.home.middle.x - hypotA, this.home.middle.y - hypotA, hypotA * 2, hypotA * 2);
			if (!(r1.x < x && x < r1.x + r1.width && r1.y < y && y < r1.y + r1.height)) return false;
			let aEdges = this.home.getEdges();
			let edges = aEdges;
			let aCorners = this.home.getCorners();
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
			return (x > this.home.x && x < this.home.x + this.home.width && y > this.home.y && y < this.home.y + this.home.height);
		}
	}
}
class CircleCollider {
	constructor(home) {
		this.home = home;
	}
	collideBox(hitbox) {
		if (!hitbox.radius) {
			if (hitbox.rotation) {
				return hitbox.collider.collideBox(this.home);
			} return Geometry.overlapCircleRect(this.home, hitbox);
		}
		else {
			return ((this.home.x - hitbox.x) ** 2) + ((this.home.y - hitbox.y) ** 2) < (this.home.radius + hitbox.radius) ** 2;
		}
	}
	collidePoint(x, y) {
		if (typeof x == "object") {
			y = x.y
			x = x.x;
		}
		return ((this.home.x - x) ** 2) + ((this.home.y - y) ** 2) < this.home.radius ** 2;
	}
}