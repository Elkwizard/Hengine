class Controls{
	constructor(up, down, left, right, interact1, interact2){
		this.up = up;
		this.down = down;
		this.left = left;
		this.right = right;
		this.interact1 = interact1;
		this.interact2 = interact2;
	}
	toString2(){
		return this.up + ", " + this.down + ", " + this.left + ", " + this.right + ", " + this.interact1 + ", " + this.interact2
	}
	toString(){
		let res = [];
		function j(cont){
			if(this[cont]){
				if(typeof this[cont] == "string"){
					res.push('"' + this[cont] + '"');
				} else {
					res.push(this[cont]);
				}
			}
		}
		j = j.bind(this);
		j("up");
		j("down");
		j("left");
		j("right");
		j("interact1");
		j("interact2");
		return res.join(", ");
	}
}
function clamp(n, a, b) {
	return Math.max(a, Math.min(b, n));
}
class PhysicsObject extends SceneObject {
	constructor(name, x, y, width, height, gravity, controls, tag, home){
		super(name, x, y, width, height, controls, tag, home);
		this.applyGravity = gravity;
		this.slows = undefined;
        this.instantStop = false;
        this.stopTimer = 0;
		this.canCollide = true;
		this.direction = new Vector2(0, 0);
		this.shown = false;
		this.hasPhysics = true;
		this.maxSpeedX = width / 3;
		this.maxSpeedY = height / 3;
		this.static = false;
        this.collideBasedOnRule = e => true;
		this.response.collide = {
            general: function(){},
			top: function(){},
			bottom: function(){},
			left: function(){},
			right: function(){}
		}
        this.colliding = {
            general: null,
			top: null,
			bottom: null,
			left: null,
			right: null
        }
		for (let x in this.response.collide) {
			let cap = x[0].toUpperCase() + x.slice(1);
			this["scriptCollide" + cap] = function(e){
				for (let m in this.scripts) {
					let script = this.scripts[m];
					script["scriptCollide" + cap](e);
				}
			}
		}
        this.allCollidingWith = {
            includes: function(name){
                for(let x in this){
                    if(typeof this[x] !== "function" && this[x] === name) return this[x];
                }
                return false;
            },   
            includesTag: function(tag){
                for(let x in this){
                    if(typeof this[x] !== "function" && this[x].tag === tag) return this[x];
                };
                return false;
            },
            clear: function(){
                for(let x in this){
                    if(typeof this[x] !== "function"){
                        delete this[x];
                    }
                }
            }
        };
		this.accel = new Vector2(0, 0);
		this.speed = new Vector2(0, 0);
	}
	optimize(a, b){
		return (a.middle.x - b.middle.x) ** 2 + (a.middle.y - b.middle.y) ** 2 < a.mass + b.mass ** 2;
	}
	stop(){
		this.speed.mul(0);
		this.accel.mul(0);
		this.logMod(function(){
			this.stop();
		});
	}
	get mass(){
		return this.width * this.height;
	}
	get rebound(){
		if (this._rebound !== undefined) {
			return this._rebound;
		} else {
			return this.home.rebound;
		}
	}
	set rebound(a){
		this._rebound = a;
	}
    moveTowards(point, ferocity){
        if(ferocity === undefined) ferocity = 1;
        let dirX = Math.sign(point.x - this.middle.x);
        let dirY = Math.sign(point.y - this.middle.y);
		let dir = new Vector2(dirX, dirY);
		dir.mul(ferocity * 0.1);
        this.speed.add(dir);
		this.logMod(function(){
			this.moveTowards(point, ferocity);
		});
    }
    moveAwayFrom(point, ferocity){
        if(ferocity === undefined) ferocity = 1;
        let dirX = -Math.sign(point.x - this.middle.x);
        let dirY = -Math.sign(point.y - this.middle.y);
		let dir = new Vector2(dirX, dirY);
		dir.mul(ferocity * 0.1);
        this.speed.add(dir);
		this.logMod(function(){
			this.moveAwayFrom(point, ferocity);
		});
    }
	removeCollisions(){
		this.canCollide = false;
		this.logMod(function(){
			this.removeCollisions();
		});
	}
	checkSpeed(){
		this.speed.x = clamp(this.speed.x, -this.maxSpeedX, this.maxSpeedX);
		this.speed.y = clamp(this.speed.y, -this.maxSpeedY, this.maxSpeedY);
	}
	allowCollisions(){
		this.canCollide = true;
		this.logMod(function(){
			this.allowCollisions();
		});
	}
	removeGravity(){
		this.applyGravity = false;
		this.accel.y = 0;
		this.logMod(function(){
			this.removeGravity();
		});
	}
	allowGravity(){
		this.applyGravity = true;
		this.logMod(function(){
			this.allowCollisions();
		});
	}
	engineDraw(){
		if(!this.hidden && (!this.cullGraphics || !this.home.cullGraphics || this.collide(this.home.adjustedDisplay))){
			this.draw();
			this.scriptDraw();
			this.shown = true;
		} else {
			this.shown = false;
		}
	}
	engineUpdate(hitboxes){
		if (!this.static) {
			this.oldX = this.x;
			this.oldY = this.y;
			if(this.applyGravity){
				this.speed.add(this.home.gravity);
			}
			if(this.controls){
				this.move(hitboxes);
			}
			this.speed.add(this.accel);
			if(this.slows === undefined){
				if(this.applyGravity){
					this.slowDown();
				}
			} else if (this.slows){
				this.slowDown();
			}
			this.moveAndRespond(hitboxes);
			//start
			this.checkSpeed();
			//end
			this.direction.x = -(this.oldX-this.x);
			this.direction.y = -(this.oldY-this.y);
			this.direction.normalize();
		}
		this.update();
		this.scriptUpdate();
	}
	moveAndRespond(hitboxes) {
		this.moveInDirection("x", hitboxes);
		this.moveInDirection("y", hitboxes);
	}
	clearCollisions(){
		for(let x in this.colliding){
            this.colliding[x] = false;
        }
        this.allCollidingWith.clear();
	}
    slowDown(){
        for(let x of ["x", "y"]){
            if(Math.abs(this.speed[x]) > 0){
                this.speed[x] = this.home.home.contract(this.speed[x], this.home.airResistance*((x === "y")? 2:1))
                if(Math.abs(this.speed[x]) < 0.01) {
                    this.speed[x] = 0
                }
            }
        }
    }
	moveInDirection(dir, hitboxes){
		if(this.speed[dir]){
			let cr = dir;
			this[cr] += this.speed[dir] * 2;
			let x = this.collideAll(hitboxes);
			if (x.length > 0) this.resolve(x, dir, hitboxes);
		} else {
			this.collideAll(hitboxes);
		}
	}
	collide(hitbox){
		let x = Physics.isOverlapping(hitbox.collider, this.collider);
		return x;
	}
	resolve(e, dir, hitboxes) {
		let spd = this.speed[dir] * 2;
		let pos = (dir === "x")? "right":"bottom";
		let neg = (dir === "x")? "left":"top";
		let pos2 = (dir === "x")? "Right":"Bottom";
		let neg2 = (dir === "x")? "Left":"Top";
		this.escape(e, dir, hitboxes);
		if (!this.colliding.general) this.colliding.general = [];
		for (let a of e) {
			this.colliding.general.push(a);
			if (!a.colliding.general) a.colliding.general = [];
			a.colliding.general.push(this);
			a.response.collide.general(this);
			this.scriptCollideGeneral(a);
			a.scriptCollideGeneral(this);
		}
		if (this.speed[dir] > 0) {
			if (!this.colliding[pos]) this.colliding[pos] = [];
			for (let a of e) {
				this.colliding[pos].push(a);
				if (!a.colliding[neg]) a.colliding[neg] = [];
				a.colliding[neg].push(this);
				this.response.collide[pos](a);
				a.response.collide[neg](this);
				this["scriptCollide" + pos2](a);
				a["scriptCollide" + neg2](this);
			}
		}
		if (this.speed[dir] < 0) {
			if (!this.colliding[neg]) this.colliding[neg] = [];
			for (let a of e) {
				this.colliding[neg].push(a);
				if (!a.colliding[pos]) a.colliding[pos] = [];
				a.colliding[pos].push(this);
				this.response.collide[neg](a);
				a.response.collide[pos](this);
				this["scriptCollide" + neg2](a);
				a["scriptCollide" + pos2](this);
			}
		}
		for (let a of e) if (!a.applyGravity) {
			this.speed[dir] = -spd / 2 * this.rebound;
		} else {
			a.speed[dir] += spd / 4 * a.rebound;
			this.speed[dir] = -spd / 4 * this.rebound;
		}
		for (let a of e) this.response.collide.general(a);
	}
	escape(a, dir, hitboxes) {
		let spd = this.speed[dir] * 2;
		for (let e of a) if (spd) {
			if (e instanceof CirclePhysicsObject) {
				this[dir] -= spd;
			} else {
				if (dir === "x") {
					this.x = (this.middle.x - e.middle.x < 0)? e.x - this.width : e.x + e.width;
				} else {
					this.y = (this.middle.y - e.middle.y < 0)? e.y - this.height : e.y + e.height;
				}
			}
		}
	}
	collideAll(hitboxes){
        let collideAry2 = [];
        let collideAry = [];
		for(let hitbox of hitboxes){
			if(hitbox.hasPhysics && hitbox.tag !== "Engine-Particle" && hitbox.name !== this.name){
				if(this.optimize(this, hitbox)){
					if(this.collide(hitbox)){
						collideAry.push(hitbox);
						if(this.canCollide && hitbox.canCollide){
							if(this.collideBasedOnRule(hitbox) && hitbox.collideBasedOnRule(this)){
								collideAry2.push(hitbox);
							}
						}
					}
				}
			}
		}
        for(let x of collideAry){
            this.allCollidingWith["rect " + x.name] = x;
			x.allCollidingWith["rect " + this.name] = this;
        }
		return collideAry2;
	}
}
class CirclePhysicsObject extends PhysicsObject {
	constructor(name, x, y, radius, gravity, controls, tag, home){
		super(name, x, y, radius * 2, radius * 2, gravity, controls, tag, home);
		this.collider = new CircleCollider(x, y, radius);
	}
	get middle() {
		return {x:this.x,y:this.y};
	}
	get width(){
		return this.radius * 2;
	}
	get height(){
		return this.width;
	}
	set width(a){
		this.radius = a / 2;
	}
	set height(a) {
		this.width = a;
	}
	get radius(){
		return this.collider.radius;
	}
	set radius(a){
		this.collider.radius = a;
	}
	moveAndRespond(hitboxes){
		this.x += this.speed.x * 2;
		this.y += this.speed.y * 2;
		if (this.speed.x || this.speed.y) {
			let el = this.collideAll(hitboxes);
			if (el.length > 0) {
				if (true) {
					function gDist(p1, p2, d = 1) {
						let dx = p2.x - p1.x;
						let dy = p2.y - p1.y;
						dx *= d;
						dy *= d;
						return Math.sqrt((dx * dx) + (dy * dy));
					}
					let escapeDir = new Vector2(this.speed.x, this.speed.y);
					let speedMag = Math.sqrt((escapeDir.x ** 2) + (escapeDir.y ** 2));
					//get direction
					for (let a of el) {
						let ove = 0;
						let dir = new Vector2(0, 0);
						let usesTobinMath = false;
						if (a instanceof CirclePhysicsObject) {
							//colliding with circle: get overlap
							let dist = gDist(this.collider, a.collider);
							ove = (this.collider.radius + a.collider.radius) - dist;
							let v = new Vector2(a.x - this.x, a.y - this.y);
							dir.add(v);
						} else {
							//rectangles... AHHHH!
							let closestPX = Math.max(a.x, Math.min(a.x + a.width, this.x));
							let closestPY = Math.max(a.y, Math.min(a.y + a.height, this.y));
							let cP = P(closestPX, closestPY);
							let v = new Vector2();
							if (Physics.pointInsideRectangle(this.collider, a)) {
								if (false) {
									let d = Physics.distToRect(this.collider, a);
									let r = this.radius;
									let theta = Math.PI / 2 - this.direction.getAngle();
									let dx = this.direction.x;
									let dy = this.direction.y;
									let cos = Math.cos(theta);
									let offs = (r + d) / cos;
									let ox = offs * dx;
									let oy = offs * dy;
									this.x -= ox;
									this.y -= oy;
									usesTobinMath = true;
								} else {
									let radius = 0;
									if (this.speed.x > this.speed.y) {
										cP.x = (this.x < a.middle.x)? a.x : a.x + a.width;
										v = new Vector2(a.middle.x - this.x, 0);
										radius = a.width / 2;
									} else {
										cP.y = (this.y < a.middle.y)? a.y : a.y + a.height;
										radius = a.height / 2;
										v = new Vector2(0, a.middle.y - this.y);
									}
									let dist = gDist(this.collider, cP);
									ove = dist + this.radius;
								}
							} else {
								let dist = gDist(this.collider, cP);
								ove = this.collider.radius - dist;
								v = new Vector2(cP.x - this.x, cP.y - this.y);
							}
							dir.add(v);
						}
						//adjust position
						dir.normalize();
						if (!usesTobinMath) {
							if (a.applyGravity && a instanceof CirclePhysicsObject) {
								a.x += dir.x * ove * .5;
								a.y += dir.y * ove * .5;
								this.x -= dir.x * ove * .5;
								this.y -= dir.y * ove * .5;
							} else {
								this.x -= dir.x * ove;
								this.y -= dir.y * ove;
							}
						}
						let r = Math.max(0.01, this.rebound);
						if (a.applyGravity) {
							a.speed.x += -r * speedMag * -dir.x;
							a.speed.y += -r * speedMag * -dir.y;
						}
						this.speed.x += -r * speedMag * dir.x * 2;
						this.speed.y += -r * speedMag * dir.y * 2;
						//manage collision data
						let left = -dir.x > 0.3;
						let right = -dir.x < -0.3;
						let top = -dir.y > 0.3;
						let bottom = -dir.y < -0.3;
						if (!this.colliding.general) this.colliding.general = [];
						if (!a.colliding.general) a.colliding.general = [];
						if (!this.colliding.right && right) this.colliding.right = [];
						else if (!this.colliding.left && left) this.colliding.left = []; 
						if (!this.colliding.bottom && bottom) this.colliding.bottom = [];
						else if (!this.colliding.top && top) this.colliding.top = [];
						this.colliding.general.push(a); 
						a.colliding.general.push(this);
						if (right) {
							if (!a.colliding.left) a.colliding.left = [];
							a.colliding.left.push(this);
							this.scriptCollideRight(a);
							a.scriptCollideLeft(this);
							this.response.collide.right(a);
							a.response.collide.left(this);
						} else if (left) {
							if (!a.colliding.right) a.colliding.right = [];
							a.colliding.right.push(this);
							this.scriptCollideLeft(a);
							a.scriptCollideRight(this);
							this.response.collide.left(a);
							a.response.collide.right(this);
						}
						if (top) {
							if (!a.colliding.bottom) a.colliding.bottom = [];
							a.colliding.bottom.push(this);
							this.scriptCollideTop(a);
							a.scriptCollideBottom(this);
							this.response.collide.top(a);
							a.response.collide.bottom(this);
						} else if (bottom) {
							if (!a.colliding.top) a.colliding.top = [];
							a.colliding.top.push(this);
							this.scriptCollideBottom(a);
							a.scriptCollideTop(this);
							this.response.collide.bottom(a);
							a.response.collide.top(this);
						}
						this.scriptCollideGeneral(a);
						a.scriptCollideGeneral(this);
						this.response.collide.general(a);
						a.response.collide.general(this);
					}
					//end direction
				}
			}
		}
	}
}