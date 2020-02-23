class Triangle {
	constructor(p1, p2, p3) {
		this.vertices = [p1, p2, p3];
	}
	middle() {
		function average(ary) {
			let sum = 0;
			for (let num of ary) {
				sum += num;
			}
			sum /= ary.length;
			return sum;
		}
		let res = new Vertex();
		let xs = [];
		let ys = [];
		for (let x of this.vertices) {
			xs.push(x.x);
			ys.push(x.y);
		}
		res.x = average(xs);
		res.y = average(ys);
		return res;
	}
}
class Circle {
	constructor(x, y, radius) {
		this.collider = new CircleCollider(this);
		this.x = x;
		this.y = y;
		this.radius = radius;
	}
	get x() {
		return this.collider.x;
	}
	get y() {
		return this.collider.y;
	}
	get radius() {
		return this.collider.radius
	}
	set x(a) {
		this.collider.x = a;
	}
	set y(a) {
		this.collider.y = a;
	}
	set radius(a) {
		this.collider.radius = a;
	}
}
class Line {
	constructor(x, y, x2, y2) {
		this.collider = new LineCollider(x, y, x2, y2);
	}
	get a() {
		return this.collider.a;
	}
	get b() {
		return this.collider.b;
	}
	set a(a) {
		this.collider.a = new Vector2(a.x, a.y);
	}
	set b(a) {
		this.collider.b = new Vector2(a.x, a.y);
	}
	get midPoint() {
		let ax = (this.a.x + this.b.x) / 2;
		let ay = (this.a.y + this.b.y) / 2;
		return new Vector2(ax, ay);
	}
}
class Rect {
	constructor(x, y, width, height, rotation = 0) {
        this.collider = new RectCollider(this);
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
		if (typeof x == "object") {
			this.x = x.x;
			this.y = x.y;
			this.width = y.x - x.x;
			this.height = y.y - x.y;
		}
		if (this.width < 0) {
			this.width = -this.width;
			this.x -= this.width;
		}
		if (this.height < 0) {
			this.height = -this.height;
			this.y -= this.height;
        }
        this._rotation = 0;
        this.rotation = rotation;
        this.centerOfMassOffset = new Vector2(0, 0);
    }
    set width(a) {
        this._width = a;
    }
    get width() {
        return this._width;
    }
    set height(a) {
        this._height = a;
    }
    get height() {
        return this._height;
    }
    set rotation(a) {
        this.collider.rotation = a;
        if (!a) this.collider.rotation = 0.0001;
    }
    get rotation() {
        return this.collider.rotation;
    }
	set middle(a) {
		this.x = a.x - this.width / 2;
		this.y = a.y - this.height / 2;
	}
	get middle() {
		return { x: this.x + (this.width / 2), y: this.y + (this.height / 2) }
	}
	getCorners() {
		let r = this;
		let corners = [
			new Vector2(r.x, r.y),
			new Vector2(r.x + r.width, r.y),
			new Vector2(r.x + r.width, r.y + r.height),
			new Vector2(r.x, r.y + r.height)
		];
		let com = r.centerOfMass;
		for (let i = 0; i < corners.length; i++) corners[i] = Geometry.rotatePointAround(com, corners[i], r.rotation);
		return corners;
	}
	getEdges() {
		let r = this;
		let corners = r.getCorners();
		let edges = [];
		for (let i = 0; i < corners.length; i++) {
			if (i == 0) edges.push(corners[corners.length - 1].minus(corners[0]).normalize());
			else edges.push(corners[i - 1].minus(corners[i]).normalize());
		}
		return edges;
    }
	set centerOfMass(a) {
		this.centerOfMassOffset = Geometry.rotatePointAround(this.middle, a, -this.rotation).minus(this.middle);
	}
	get centerOfMass() {
		return this.centerOfMassOffset.plus(this.middle);
	}
}