class Physics {
	static distToLine(p, l) {
		if (l.b.y < l.a.y) [l.a, l.b] = [l.b, l.a];
		let min = Math.min(l.a.x, l.b.x);
		let max = Math.max(l.a.x, l.b.x);
		let dx = l.b.x - l.a.x;
		let dy = l.b.y - l.a.y;
		let b = l.a.y - l.a.x * (dy / dx);
		let x1 = p.x;
		let y1 = p.y;
		let pX = ((dx / dy) * x1 - b + y1) / ((dy * dy + dx * dx) / (dx * dy));
		if (pX < min) pX = min;
		if (pX > max) pX = max;
		let pY = (dy / dx) * pX + b;
		return Physics.distToPoint(p, new Vector2(pX, pY));
	}
	static distToCircle(p, c) {
		return Math.sqrt(Physics.distToPoint2(p, c)) - c.radius;
	}
	static distToPoint2(p, p2) {
		let dx = p2.x - p.x;
		let dy = p2.y - p.y;
		let sum = (dx ** 2) + (dy ** 2);
		return sum;
	}
	static distToPoint(p, p2) {
		return Math.sqrt(Physics.distToPoint2(p, p2));
	}
	static distToRect(p, r) {
		let d = Math.sqrt(Physics.distToRect2(p, r));
		return d;
	}
	static distToRect2(p, r) {
		let ax = p.x - (r.x + r.width / 2);
		let ay = p.y - (r.y + r.height / 2);
		let dx = Math.max(Math.abs(ax) - (r.width / 2), 0);
		let dy = Math.max(Math.abs(ay) - (r.height / 2), 0);
		return (dx ** 2) + (dy ** 2);
	}
	static projectPointOntoLine(p, d) {
		let x1 = p.x;
		let y1 = p.y;
		let dx = d.x;
		let dy = d.y;
		if (!dx) dx = 0.000000001;
		let xv = ((dx**2) * x1 + (dx * dy * y1)) / (dx**2 + dy**2);
		let yv = (dy / dx) * xv;
		let xrs = Math.sign(xv);
		let xr = Math.sqrt(xv ** 2 + yv ** 2);
		let xfv = xrs * xr;
		return xfv;
	}
	static closestPointOnLineObject(p, l) {if (l.b.y < l.a.y) [l.a, l.b] = [l.b, l.a];
		let min = Math.min(l.a.x, l.b.x);
		let max = Math.max(l.a.x, l.b.x);
		let dx = l.b.x - l.a.x;
		let dy = l.b.y - l.a.y;
		let b = l.a.y - l.a.x * (dy / dx);
		let x1 = p.x;
		let y1 = p.y;
		let pX = ((dx / dy) * x1 - b + y1) / ((dy * dy + dx * dx) / (dx * dy));
		if (pX < min) pX = min;
		if (pX > max) pX = max;
		let pY = (dy / dx) * pX + b;
		return new Vector2(pX, pY);
	}
	static closestPointOnLine(p, d) {
		let x1 = p.x;
		let y1 = p.y;
		let dx = d.x;
		let dy = d.y;
		if (!dx) dx = 0.000000001;
		let xv = ((dx**2) * x1 + (dx * dy * y1)) / (dx**2 + dy**2);
		let yv = (dy / dx) * xv;
		return new Vector2(xv, yv);
	}
	static rayCast(ray, rs, threshold = 100000) {
		let o = ray.a;
		let origin = new Vector2(ray.a.x, ray.a.y);
		let slope = new Vector2(ray.b.x - ray.a.x, ray.b.y - ray.a.y).normalize();
		if (!slope.x && !slope.y) return {error: "no direction"};
		let minDist = Infinity;
		let steps = 0;
		let maxSteps = 50;
		let collided = null;
		for (let r of rs) {
			let d;
			if (r.collider instanceof RectCollider) {
				d = Physics.distToRect(o, r);
			} else if (r.collider instanceof CircleCollider) {
				d = Physics.distToCircle(o, r);
			} else {
				d = Physics.distToLine(o, r);
			}
			if (d <= 0) return {error: "inside shape", collidedShape: r, collisionPoint: o};
		}
		while (minDist > 0.1 && steps < maxSteps) {
			minDist = Infinity;
			steps++;
			for (let r of rs) {
				let d;
				if (r.collider instanceof RectCollider) {
					d = Physics.distToRect(o, r);
				} else if (r.collider instanceof CircleCollider) {
					d = Physics.distToCircle(o, r);
				} else {
					d = Physics.distToLine(o, r);
				}
				if (d < minDist) {
					minDist = d;
					collided = r;
				}
			}
			if (g.f.getDistance(o, origin) > threshold) {
				o = origin.add((new Vector2(threshold, threshold)).mul(slope));
				steps = maxSteps;
				break;
			}
			if (Physics.displayRaymarch) c.draw(new Color(255, 255, 255, 0.2)).circle(o.x, o.y, minDist);
			o.x += slope.x * minDist;
			o.y += slope.y * minDist;
		}
		if (steps >= maxSteps) {
			return {collisionPoint: o, collidedShape: collided, error: "no collision"};
		}
		return {collisionPoint: o, collidedShape: collided};
	}
	static overlapLineLine(l1, l2) {
		let pol = Physics.projectPointOntoLine;
		let dirs = [
			Vector2.fromAngle(l1.b.minus(l1.a).getAngle() + Math.PI / 2),
			Vector2.fromAngle(l2.b.minus(l2.a).getAngle() + Math.PI / 2),
		];
		for (let dir of dirs) {
			let a = pol(l1.a, dir);
			let b = pol(l1.b, dir);
			let a2 = pol(l2.a, dir);
			let b2 = pol(l2.b, dir);
			if (b < a) [a, b] = [b, a];
			if (b2 < a2) [a2, b2] = [b2, a2];
			if (!(b > a2 && a < b2)) return false;
		}
		return true;
	}
	static isOverlapping(r1, r2) {
		if (r1.a) return Physics.overlapLineLine(r1, r2);
		if (r1.radius === undefined) {
			if (r2.radius === undefined) {
				return Physics.overlapRectRect(r1, r2)
			} else {
				return Physics.overlapCircleRect(r2, r1);
			}
		} else {
			if (r2.radius === undefined) {
				return Physics.overlapCircleRect(r1, r2)
			} else {
				return Physics.overlapCircleCircle(r1, r2);
			}
		}
	}
	static pointInsideRectangle(p, r) {
		return p.x > r.x && p.y > r.y && p.x < r.x + r.width && p.y < r.y + r.height;
	}
	static overlapCircleRect(c, r) {
		let dist = Physics.distToRect2(c, r);
		let inside = Physics.pointInsideRectangle(c, r);
		return (dist < c.radius ** 2) || inside;
	}
	static overlapRectRect(r, r2) {
		return r.x < r2.x + r2.width && r.x + r.width > r2.x && r.y < r2.y + r2.height && r.y + r.height > r2.y;
	}
	static overlapCircleCircle(c, c2) {
		return Physics.distToPoint2(c, c2) < (c.radius + c2.radius) ** 2;
	}
}
Physics.displayRaymarch = false;
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
	collideBox(hitbox){
        if(hitbox.width !== void 0){
			return this.x < hitbox.x + hitbox.width && hitbox.x < this.x+this.width && this.y < hitbox.y + hitbox.height && hitbox.y < this.y + this.height
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
						let projection = Physics.projectPointOntoLine(point, edge);
						aRange.include(projection);
					}
					let projection = Physics.projectPointOntoLine(hitbox.middle, edge);
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
	get middle(){
		return {x:this.x + this.width / 2,y: this.y + this.height / 2};
	}
	collidePoint(x, y){
		if(typeof x == "object"){
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
					let projection = Physics.projectPointOntoLine(point, edge);
					aRange.include(projection);
				}
				let projection = Physics.projectPointOntoLine(new Vector2(x, y), edge);
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
class CircleCollider{
    constructor(x, y, radius, rotation = 0){
        this.x = x;
        this.y = y;
		this.radius = radius;
		this.rotation = rotation;
    }
	get middle(){
		return {x:this.x,y:this.y};
	}
	collideBox(hitbox){
        if(hitbox.width !== void 0){
			let ax = this.x - (hitbox.x + hitbox.width / 2);
			let ay = this.y - (hitbox.y + hitbox.height / 2);
			let dx = Math.max(Math.abs(ax) - (hitbox.width / 2), 0);
			let dy = Math.max(Math.abs(ay) - (hitbox.height / 2), 0);
			return (dx ** 2) + (dy ** 2) < (this.radius ** 2);
        }
        else{
			return ((this.x - hitbox.x) ** 2) + ((this.y - hitbox.y) ** 2) < (this.radius + hitbox.radius) ** 2;
        }
	}
	collidePoint(x, y){
		if(typeof x == "object"){
			y = x.y
			x = x.x;
		}
		return ((this.x - x) ** 2) + ((this.y - y) ** 2) < this.radius ** 2;
	}
}