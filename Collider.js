class Physics {
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
		return Math.sqrt(Physics.distToRect2(p, r));
	}
	static distToRect2(p, r) {
		let ax = p.x - (r.x + r.width / 2);
		let ay = p.y - (r.y + r.height / 2);
		let dx = Math.max(Math.abs(ax) - (r.width / 2), 0);
		let dy = Math.max(Math.abs(ay) - (r.height / 2), 0);
		return (dx ** 2) + (dy ** 2);
	}
	static isOverlapping(r1, r2) {
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
class RectCollider {
	constructor(x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}
	collideBox(hitbox, exp){
        if(hitbox.width !== void 0){
			return this.x < hitbox.x + hitbox.width && hitbox.x < this.x+this.width && this.y < hitbox.y + hitbox.height && hitbox.y < this.y + this.height
        }
        else{
            return hitbox.collideBox(this)
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
		return (x > this.x && x < this.x + this.width && y > this.y && y < this.y + this.height);
	}
}
class CircleCollider{
    constructor(x, y, radius){
        this.x = x;
        this.y = y;
        this.radius = radius;
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