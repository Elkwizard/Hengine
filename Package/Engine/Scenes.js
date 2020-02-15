class Directions {
	constructor(up, down, left, right, prec) {
		this.up = up;
		this.down = down;
		this.left = left;
		this.right = right;
		if (prec === undefined) prec = 0.3;
		this.prec = prec;
		this.angle = 0;
	}
	static fromAngle(a) {
		let dir = new Directions(0, 0, 0, 0);
		dir.angle = a;
		return dir;
	}
	getRandomSpeed() {
		if (this.angle) {
			let min = -this.angle - this.prec;
			let max = -this.angle + this.prec;
			let angle = Math.random() * (max - min) + min;
			let result = Vector2.fromAngle(angle);
			return result;
		} else {
			let result = Vector2.fromAngle(Math.random() * 2 * Math.PI);
			return this.fix(result);
		}
	}
	fix(v) {
		if (this.angle) {
			let va = -this.angle;
			let min = va - this.prec;
			let max = va + this.prec;
			let a = v.getAngle();
			if (a < min) a = min;
			if (a > max) a = max;
			let result = Vector2.fromAngle(a);
			result.mag = v.mag;
			return result;
		} else {
			return new Vector2(this.fixH(v.x), this.fixV(v.y));
		}
	}
	fixH(val) {
		if (this.left && this.right) return val;
		if (this.left) return -Math.abs(val);
		if (this.right) return Math.abs(val);
		else return val * this.prec;
	}
	fixV(val) {
		if (this.up && this.down) return val;
		if (this.up) return -Math.abs(val);
		if (this.down) return Math.abs(val);
		else return val * this.prec;
	}
}
class InactiveScene {
	constructor(name, gravity, airResistance) {
		if (!gravity) gravity = 0.1;
		if (!airResistance) airResistance = 0.025;
		this.gravity = gravity;
		this.airResistance = airResistance
		this.name = name;
		this.rebound = 0;
		this.contains_array = [];
		this.custom = {};
		this.templates = {};
		this.hasRotatedRectangles = false;
		this.defaultDraw = function () {
			if (this.radius === undefined) {
				c.draw("#000").rect(this.x, this.y, this.width, this.height);
				c.stroke("cyan", 1).rect(this.x + 0.5, this.y + 0.5, this.width - 1, this.height - 1);
			} else {
				c.draw("#000").circle(this.x, this.y, this.radius);
				c.stroke("cyan", 1).circle(this.x, this.y, this.radius - 1);
			}
		}
		this.defaultPhysDraw = function () {
			if (this.radius === undefined) {
				c.draw("#000").rect(this.x, this.y, this.width, this.height);
				c.stroke("red", 1).rect(this.x + 0.5, this.y + 0.5, this.width - 1, this.height - 1);
			} else {
				c.draw("#000").circle(this.x, this.y, this.radius);
				c.stroke("red", 1).circle(this.x, this.y, this.radius - 1);
			}
		}
		this.defaultParticleDraw = function () {
			this.home.c.draw("Black").circle(this.middle.x, this.middle.y, this.width / 2);
		}
		this.defaultUpdate = function () { }
		this.contains = {};
	}
	updateArray() {
		this.contains_array = [];
		for (let rect in this.contains) {
			let cont = this.contains[rect];
			if (cont instanceof InactiveScene) {
				if (cont.active) {
					let ary = cont.updateArray();
					this.contains_array.push(...ary);
				}
			} else this.contains_array.push(cont);
		}
		return this.contains_array;
	}
	copy(el) {
		let n;
		if (el.hasPhysics) {
			if (el.isSpawner) {
				n = this.addParticleSpawner(el.name + " - copy", el.x, el.y, el.particleSize, el.particleInitSpeed, el.delay, el.timer, el.particleDraw, el.particleSizeVariance, el.particleSpeedVariance, el.dirs);
				n.width = el.width;
				n.height = el.height;
				n.slows = el.slows;
				n.fades = el.fades;
				n.active = el.active;
				n.falls = el.falls;
			} else {
				n = this.addRectElement(el.name + " - copy", el.x, el.y, el.width, el.height, el.applyGravity, { ...el.controls }, el.tag);
			}
		} else {
			n = this.addElement(el.name + " - copy", el.x, el.y, el.width, el.height, { ...el.controls }, el.tag);
		}
		el.runLog(n);
		return n;
	}
	hideElement(name) {
		this.performFunctionBasedOnType_PRIVATE(name, function (e) {
			this.contains[e].hide();
			this.contains[e].logMod(function HIDE() {
				this.hide();
			});
		}.bind(this));
		return this;
	}
	showElement(name) {
		this.performFunctionBasedOnType_PRIVATE(name, function (e) {
			this.contains[e].show();
			this.contains[e].logMod(function SHOW() {
				this.show();
			});
		}.bind(this));
		return this;
	}
	genName_PRIVATE(database, name) {
		let num = 0;
		let n = name;
		function check() {
			n = name;
			if (num) n += " (" + num + ")";
			return n;
		}
		while (database[check()] !== undefined) num++;
		return n;
	}
	addElement(name, x, y, width, height, controls = new Controls(), tag = "", src = "") {
		name = this.genName_PRIVATE(this.contains, name);
		if (width < 0) {
			width = -width;
			x -= width;
		}
		if (height < 0) {
			height = -height;
			y -= height;
		}
		this.contains[name] = new SceneObject(name, x, y, width, height, controls, tag, this);
		let n = this.contains[name];
		let self = this;
		if (src) {
			let img = loadImage(src);
			this.changeElementDraw(n, function () {
				c.drawImage(img, this.x, this.y, this.width, this.height);
			});
		} else n.mod(function () {
			this.draw = self.defaultDraw.bind(this);
			this.update = self.defaultUpdate.bind(this);
		});
		return n;
	}
	addRectElement(name, x = 0, y = 0, width = 0, height = 0, gravity = false, controls = new Controls(), tag = "", src = "") {
		name = this.genName_PRIVATE(this.contains, name);
		if (width < 0) {
			width = -width;
			x -= width;
		}
		if (height < 0) {
			height = -height;
			y -= height;
		}
		this.contains[name] = new PhysicsObject(name, x, y, width, height, gravity, controls, tag, this);
		let n = this.contains[name];
		let self = this;
		if (src) {
			let img = loadImage(src);
			this.changeElementDraw(n, function () {
				c.drawImage(img, this.x, this.y, this.width, this.height);
			});
		} else n.mod(function () {
			this.draw = self.defaultPhysDraw.bind(this);
			this.update = self.defaultUpdate.bind(this);
		});
		return n;
	}
	addCircleElement(name, x = 0, y = 0, radius = 0, gravity = false, controls = new Controls(), tag = "", src = "") {
		name = this.genName_PRIVATE(this.contains, name);
		if (radius < 0) {
			radius *= -1;
			x -= radius * 2;
			y -= radius * 2;
		}
		this.contains[name] = new CirclePhysicsObject(name, x, y, radius, gravity, controls, tag, this);
		let n = this.contains[name];
		let self = this;
		if (src) {
			let img = loadImage(src);
			this.changeElementDraw(n, function () {
				c.drawImage(img, this.x - this.radius, this.y - this.radius, this.width, this.height);
			});
		} else n.mod(function () {
			this.draw = self.defaultPhysDraw.bind(this);
			this.update = self.defaultUpdate.bind(this);
		});
		return n;
	}
	addUI(name, x, y, width, height, draw = function () { }) {
		let n = this.addElement(name, x, y, width, height, new Controls(), "UI");
		this.UI(n);
		n.draw = draw.bind(n);
		return n;
	}
	addContainer(name, active) {
		name = this.genName_PRIVATE(this.contains, name);
		let x = new InactiveScene(name);
		x.active = active;
		x.home = this.home;
		this.contains[name] = x;
		return x;
	}
	addParticleSpawner(name, x, y, size = 1, spd = 1, delay = 1, timer = 50, draw, sizeVariance = 0, speedVariance = 0, dirs = new Directions(1, 1, 1, 1)) {
		let ns = this.addRectElement(name, x, y, 0, 0, false, false, "Particle-Spawner");
		ns.active = true;
		ns.removeCollisions();
		ns.fades = true;
		ns.slows = true;
		ns.falls = false;
		ns.particleDelay = delay;
		ns.particleInitSpeed = spd;
		ns.particleLifeSpan = timer;
		ns.spawns = {};
		ns.particleSize = size;
		ns.particleDraw = draw;
		let script = draw instanceof ElementScript;
		ns.particleSizeVariance = sizeVariance;
		ns.dirs = dirs;
		ns.isSpawner = true;
		ns.particleSpeedVariance = speedVariance;
		ns.particleNumber = 0;
		this.changeElementDraw(ns, e => e);
		let spawner = new ElementScript("spawning");
		spawner.addMethod("update", function () {
			if (this.active && this.lifeSpan % Math.ceil(this.particleDelay) === 0) {
				//spawn
				let len = 1;
				if (this.particleDelay < 1) len = 1 / this.particleDelay;
				for (let i = 0; i < len; i++) {
					let pSize = this.particleSize + ((Math.random() - Math.random()) * this.particleSizeVariance);
					let sX = (Math.random() * this.width) + this.x - pSize / 2;
					let sY = (Math.random() * this.height) + this.y - pSize / 2;
					let n = this.home.addRectElement("Particle #" + (this.particleNumber++) + " from " + this.name, sX, sY, pSize, pSize, false, false, "Engine-Particle");

					let speed = this.dirs.getRandomSpeed();
					speed.x = (this.particleInitSpeed * speed.x) + ((Math.random() - Math.random()) * this.particleSpeedVariance);
					speed.y = (this.particleInitSpeed * speed.y) + ((Math.random() - Math.random()) * this.particleSpeedVariance);
					n.speed = speed;
					n.timer = 0;
					n.layer = this.layer;
					this.spawns[n.name] = n;
					n.spawner = this;
					let r = n.remove.bind(n);
					n.remove = function () {
						r();
						delete this.spawner.spawns[this.name];
					}.bind(n);
					n.enginePhysicsUpdate = function () {
						this.lastX = this.x;
						this.lastY = this.y;
						if (ns.falls) this.accel.y = this.home.gravity.y;
						this.speed.add(this.accel);
						if (ns.slows) {
							this.slowDown();
						}
						this.x += this.speed.x * 2;
						this.y += this.speed.y * 2;
						if (this.lifeSpan > ns.particleLifeSpan) {
							this.remove();
						}
						this.direction.x = this.x - this.lastX;
						this.direction.y = this.y - this.lastY;
						this.direction.normalize();
						this.scriptUpdate();
					}.bind(n);
					function drawRect() {
						this.draw();
					}
					if (script) drawRect = function () {
						this.scriptDraw();
					}
					drawRect = drawRect.bind(n);
					if (this.fades) {
						n.engineDrawUpdate = function () {
							this.home.c.c.globalAlpha = Math.max(0, 1 - (this.lifeSpan / ns.particleLifeSpan));
							drawRect();
							this.home.c.c.globalAlpha = 1;
						}.bind(n);
					} else {
						n.engineDrawUpdate = function () {
							drawRect();
						}.bind(n);
					}
					if (draw) {
						if (!script) this.home.changeElementDraw(n, this.particleDraw);
					} else {
						this.home.changeElementDraw(n, this.home.defaultParticleDraw);
					}
					if (script) draw.addTo(n);
				}
			}
		}, "update");
		spawner.addTo(ns);
		return ns;
	}
	addScript(name, opts) {
		window[name] = new ElementScript(name, opts);
		return window[name];
	}
	removeElement(name) {
		this.performFunctionBasedOnType_PRIVATE(name, function (e) {
			let x = this.contains[e.name];
			if (x) {
				x.isDead = true;
				delete this.contains[e.name];
			} else if (e.home.contains[e.name]) {
				e.home.removeElement(e);
			}
		}.bind(this));
	}
	removeAllElements() {
		for (let x in this.contains) {
			delete this.contains[x];
		}
	}
	get(name) {
		if (typeof name === "object") {
			return name;
		} else {
			return this.contains[name];
		}
	}
	getAllElements() {
		this.updateArray();
		return this.contains_array;
	}
	getElementsWithTag(tag) {
		let ary = [];
		let oAry = this.updateArray();
		for (let rect of oAry) {
			if (rect.tag === tag) {
				ary.push(rect);
			}
		}
		return ary;
	}
	getElementsWithScript(script) {
		let ary = [];
		let oAry = this.updateArray();
		for (let rect of oAry) {
			if (rect.scripts[script]) {
				ary.push(rect);
			}
		}
		return ary;
	}
	performFunctionBasedOnType_PRIVATE(name, func) {
		if (typeof name === "object") {
			if (Array.isArray(name)) {
				for (let item of name) {
					this.performFunctionBasedOnType_PRIVATE(item, func);
				}
			} else {
				func(name);
			}
		} else {
			func(this.get(name));
		}
	}
	UI(name) {
		this.performFunctionBasedOnType_PRIVATE(name, function (e) {
			let el = e;
			el.offset = new Vertex(el.x, el.y);
			this.home.updateScript.addMethod(e + "__AdjustPosition__", function () {
				if (this.get(e)) {
					el.x = el.home.display.x + el.offset.x;
					el.y = el.home.display.y + el.offset.y;
				}
			}.bind(this));
			el.isUI = true;
			e.logMod(function UI() {
				this.home.UI(this);
			});
		}.bind(this));
		return this;
	}
	changeElementDraw(name, newDraw) {
		this.performFunctionBasedOnType_PRIVATE(name, function (e) {
			e.draw = newDraw.bind(e);
			e.logMod(function CHANGE_DRAW() {
				this.home.changeElementDraw(this, newDraw);
			});
		}.bind(this));
		return this;
	}
	changeElementMethod(name, method, newMethod) {
		this.performFunctionBasedOnType_PRIVATE(name, function (e) {
			e[method] = newMethod.bind(e);
			e.logMod(function CHANGE_METHOD() {
				this.home.changeElementMethod(this, method, newMethod);
			});
		}.bind(this));
		return this;
	}
	changeElementResponse(name, input, newResponse) {
		this.performFunctionBasedOnType_PRIVATE(name, function (e) {
			this.contains[e].response.input[input] = newResponse.bind(this.contains[e]);
			this.contains[e].logMod(function CHANGE_INPUT() {
				this.home.changeElementResponse(this, input, newResponse);
			});
		}.bind(this));
		return this;
	}
	changeElementUpdate(name, newUpdate) {
		this.performFunctionBasedOnType_PRIVATE(name, function (e) {
			e.update = newUpdate.bind(e);
			e.logMod(function CHANGE_UPDATE() {
				this.home.changeElementUpdate(this, newUpdate);
			});
		}.bind(this));
		return this;
	}
	changeElementCollideResponse(name, dir, newResponse) {
		this.performFunctionBasedOnType_PRIVATE(name, function (e) {
			e.response.collide[dir] = newResponse.bind(e);
			e.logMod(function CHANGE_COLLIDE_RESPONSE() {
				this.home.changeElementCollideResponse(this, dir, newResponse);
			});
		}.bind(this));
		return this;
	}
	changeElementCollideRule(name, newRule) {
		this.performFunctionBasedOnType_PRIVATE(name, function (e) {
			e.collideBasedOnRule = newRule.bind(e);
			e.logMod(function CHANGE_COLLIDE_RULE() {
				this.home.changeElementCollideRule(this, newRule);
			});
		}.bind(this));
		return this;
	}
	changeElementCollideOptimize(name, newRule) {
		this.performFunctionBasedOnType_PRIVATE(name, function (e) {
			e.optimize = newRule.bind(e);
			e.logMod(function CHANGE_COLLIDE_OPTIMIZE() {
				this.home.changeElementCollideOptimize(this, newRule);
			});
		}.bind(this));
		return this;
	}
	changeAllElementDraw(newDraw) {
		this.defaultDraw = newDraw;
		this.defaultPhysDraw = newDraw;
	}
	changeAllElementUpdate(newUpdate) {
		this.defaultUpdate = newUpdate;
	}
	clearAllCollisions() {
		for (let rect of this.updateArray()) {
			if (rect.clearCollisions) {
				rect.clearCollisions();
			}
		}
	}
	collideBox(box) {
		let collideAry = [];
		for (let hitbox of this.updateArray()) {
			if (hitbox.collider.collideBox(box.collider)) {
				collideAry.push(hitbox);
			}
		}
		return collideAry;
	}
	collidePoint(point) {
		let collideAry = [];
		for (let hitbox of this.updateArray()) {
			if (hitbox.collider.collidePoint(point.x, point.y)) {
				collideAry.push(hitbox);
			}
		}
		return collideAry;
	}
	collidePointBoth(point) {
		let collideAry = [];
		let notCollideAry = [];
		for (let hitbox of this.contains_array) {
			if (hitbox.collider.collidePoint(point.x, point.y)) {
				collideAry.push(hitbox);
			} else {
				notCollideAry.push(hitbox);
			}
		}
		return [collideAry, notCollideAry]
	}
	allowRotatedRectangles() {
		this.hasRotatedRectangles = true;
		const LOSS = .985;
		window.Collision = class {
			constructor(collides = false, a = null, b = null, Adir = new Vector2(0, 0), Bdir = new Vector2(0, 0), penetration = 0) {
				this.colliding = collides;
				this.Adir = Adir;
				this.Bdir = Bdir;
				this.a = a;
				this.b = b;
				this.penetration = penetration;
			}
		}
		window.Range = class {
			constructor(min = Infinity, max = -Infinity) {
				this.min = min;
				this.max = max;
			}
			include(a) {
				if (a < this.min) this.min = a;
				if (a > this.max) this.max = a;
			}
			static intersect(a, b) {
				return a.min < b.max && b.min < a.max;
			}
		}
		window.Link = class {
			constructor(start, end, fer) {
				this.start = start;
				this.end = end;
				this.ferocity = fer;
			}
			fix() {
				let l = new Line(this.start.middle, this.end.middle);
				let d = g.f.getDistance(l.a, l.b);
				d = clamp(d / 10, 0, 20);
				d *= this.ferocity;
				let dir = new Vector2(this.end.middle.x - this.start.middle.x, this.end.middle.y - this.start.middle.y);
				dir.normalize();
				this.start.linkMovement.add(dir.times(d));
			}
		}
		PhysicsObject = class extends SceneObject {
			constructor(name, x, y, width, height, gravity, controls, tag, home) {
				super(name, x, y, width, height, controls, tag, home);
				this.velocity = new Vector2(0, 0);
				this.acceleration = new Vector2(0, 0);
				this._rotation = 0.0001;
				this.angularVelocity = 0;
				this.angularAcceleration = 0;
				this.applyGravity = gravity;
				this.slows = gravity;
				this.links = [];
				this.linkMovement = new Vector2(0, 0);
				this.colliding = {
					top: null,
					bottom: null,
					left: null,
					right: null,
					general: null
				};
				this.response.collide = {
					general: function () { },
					top: function () { },
					bottom: function () { },
					left: function () { },
					right: function () { }
				}
				this.canCollide = true;
				for (let x in this.response.collide) {
					let cap = x[0].toUpperCase() + x.slice(1);
					this["scriptCollide" + cap] = function (e) {
						for (let m of this.scripts) {
							m["scriptCollide" + cap](e);
						}
					}
				}
				this.allCollidingWith = {
					includes: function (name) {
						for (let x in this) {
							if (typeof this[x] !== "function" && this[x] === name) return this[x];
						}
						return false;
					},
					includesTag: function (tag) {
						for (let x in this) {
							if (typeof this[x] !== "function" && this[x].tag === tag) return this[x];
						};
						return false;
					},
					clear: function () {
						for (let x in this) {
							if (typeof this[x] !== "function") {
								delete this[x];
							}
						}
					}
				};
				this.direction = new Vector2(0, 0);
				this.lastX = this.x;
				this.lastY = this.y;
				this.hasPhysics = true;
				this.collideBasedOnRule = e => true;
				this.optimize = (a, b) => true;
				this.canMoveThisFrame = true;
				this.optimalRotation = (this.width > this.height) ? Math.PI / 2 : (this.height > this.width) ? 0 : null;
			}
			get mass() {
				return this.width * this.height;
			}
			set rotation(a) {
				this.collider.rotation = a;
				if (!a) this.collider.rotation = 0.000001;
			}
			get rotation() {
				return this.collider.rotation;
			}
			set speed(a) {
				this.velocity = a;
			}
			get speed() {
				return this.velocity;
			}
			set accel(a) {
				this.acceleration = a;
			}
			get accel() {
				return this.acceleration;
			}
			set applyGravity(a) {
				this._applyGravity = a;
				this.slows = a;
			}
			get applyGravity() {
				return this._applyGravity;
			}
			linkTo(el, fer = 1) {
				this.links.push(new Link(this, el, fer));
			}
			stop() {
				this.velocity = new Vector2(0, 0);
				this.acceleration = new Vector2(0, 0);
				this.angularVelocity = 0;
				this.angularAcceleration = 0;
			}
			allowGravity() {
				this.applyGravity = true;
			}
			removeGravity() {
				this.applyGravity = false;
			}
			allowCollisions() {
				this.canCollide = true;
			}
			removeCollisions() {
				this.canCollide = false;
			}
			align(angle, f, aerodynamic) {
				let reversed = 1;
				let a = angle + this.optimalRotation ? this.optimalRotation : 0;
				let p2 = Math.PI / 2;
				let possibleDirections = [a, a + Math.PI];
				if (this.optimalRotation == null || !aerodynamic) {
					a = angle;
					possibleDirections = [a, a + p2, a + p2 * 2, a + p2 * 3];
				}
				let best = possibleDirections[0];
				let dif = Math.abs(possibleDirections[0] - this.rotation);
				for (let dir of possibleDirections) {
					let d = Math.abs(dir - this.rotation);
					let d2 = Math.abs(dir - this.rotation - Math.PI * 2);
					if (d < dif) {
						dif = d;
						//demons
						best = dir;
						reversed = 1;
					}
					if (d2 < dif) {
						dif = d2;
						best = dir;
						reversed = -1;
					}
				}
				f *= reversed;
				let a1 = this.rotation;
				let a2 = this.rotation + Math.PI * 2;
				let d1 = Math.abs(best - a1);
				let d2 = Math.abs(best - a2);
				let actA = a1;
				if (d2 < d1) actA = a2;
				let difference = best - actA;
				if (d2 < d1) difference *= -1;
				let val = 0.015 * f * Math.sign(difference);
				if (!val) val = 0;
				this.angularVelocity += val;
			}
			clearCollisions() {
				for (let [key, value] of this.colliding) this.colliding[key] = null;
				this.canMoveThisFrame = true;
				this.allCollidingWith.clear();
			}
			engineDrawUpdate() {
				let hypot = Math.sqrt((this.width / 2) ** 2 + (this.height / 2) ** 2);
				let r = new Rect(this.middle.x - hypot, this.middle.y - hypot, hypot * 2, hypot * 2);
				if (!this.hidden && (!this.cullGraphics || Physics.overlapRectRect(r, s.adjustedDisplay))) {
					c.translate(this.middle.x, this.middle.y);
					c.rotate(this.rotation);
					c.translate(-this.middle.x, -this.middle.y);
					this.draw();
					this.scriptDraw();
					c.translate(this.middle.x, this.middle.y);
					c.rotate(-this.rotation);
					c.translate(-this.middle.x, -this.middle.y);
					if (0) {
						c.stroke(cl.RED, 1).rect(PhysicsObject.getBoundingBox(this));
					}
				}
			}
			enginePhysicsUpdate(others) {
				this.physicsUpdate(others);
				this.scriptUpdate();
				this.update();
			}
			slowDown() {
				if (this.slows) {
					this.acceleration.mul(LOSS);
					this.velocity.mul(LOSS);
					this.angularAcceleration *= LOSS ** 4;
					this.angularVelocity *= LOSS;
					let sideSize = Math.PI / 2;
					if (this.rotation % sideSize < 0.05) {
						this.angularVelocity *= 0.999;
						this.angularAcceleration *= 0.999;
					}
					if (Math.abs(this.velocity.x) < 0.01) this.velocity.x = 0;
					if (Math.abs(this.velocity.y) < 0.01) this.velocity.y = 0;
					if (Math.abs(this.angularVelocity) < 0.0001) this.angularVelocity = 0;
					let m = Math.min(this.width, this.height) / 3;
					if (this.velocity.mag > m) this.velocity.mag = m;
				}
			}
			detectCollisions(others) {
				let collisions = [];
				if (this.applyGravity) {
					for (let other of others) {
						if (other !== this) {
							if (other.hasPhysics && other.tag !== "Engine-Particle") {
								if (this.optimize(this, other)) {
									if (this.collideBasedOnRule(other) && other.collideBasedOnRule(this)) {
										let col;
										let thisCircle = this instanceof CirclePhysicsObject;
										let otherCircle = other instanceof CirclePhysicsObject;
										if (thisCircle) {
											if (otherCircle) {
												col = PhysicsObject.collideCircleCircle(this, other);
											} else {
												col = PhysicsObject.collideCircleRect(this, other);
											}
										} else {
											if (otherCircle) {
												col = PhysicsObject.collideRectCircle(this, other);
											} else {
												col = PhysicsObject.collideRectRect(this, other);
											}
										}
										if (col.colliding) {
											this.allCollidingWith["Rect - " + other.name] = other;
											other.allCollidingWith["Rect - " + this.name] = this;
											if (this.canCollide && other.canCollide) collisions.push(col);
										}
									}
								}
							}
						}
					}
				}
				return collisions;
			}
			physicsUpdate(others) {
				if (this.applyGravity) {
					//links
					this.linkMovement.mul(0);
					for (let link of this.links) link.fix();
					this.x += this.linkMovement.x;
					this.y += this.linkMovement.y;

					//gravity
					let lessMass = (this.mass ** .5);
					let factor = Math.min((lessMass ** .5) / 7.0710678118654755, 1.1);
					this.velocity.add(new Vector2(this.home.gravity.x * factor, this.home.gravity.y * factor));
				}

				//linear
				this.velocity.add(this.acceleration.times(this.home.speedModulation));
				//slow
				if (this.slows) this.slowDown();
				this.x += this.velocity.x * 2 * this.home.speedModulation;
				this.y += this.velocity.y * 2 * this.home.speedModulation;

				//angular
				this.angularVelocity += this.angularAcceleration * this.home.speedModulation;
				this.rotation += this.angularVelocity * this.home.speedModulation;
				if (this.applyGravity) {
					if (this.colliding.general) this.align(this.velocity.getAngle(), 0.005, true);
					//this.align(this.velocity.getAngle(), 0.01);
				}
				this.rotation %= Math.PI * 2;

				let collisions = this.detectCollisions(others);
				if (this.applyGravity) {
					for (let collision of collisions) {
						if (collision.colliding) PhysicsObject.resolve(collision);
					}
				}
				this.direction = new Vector2(this.x - this.lastX, this.y - this.lastY);
				this.lastX = this.x;
				this.lastY = this.y;
			}
			moveTowards(point, ferocity) {
				if (ferocity === undefined) ferocity = 1;
				let dirX = Math.sign(point.x - this.middle.x);
				let dirY = Math.sign(point.y - this.middle.y);
				let dir = new Vector2(dirX, dirY);
				dir.mul(ferocity * 0.1);
				this.speed.add(dir);
				this.logMod(function () {
					this.moveTowards(point, ferocity);
				});
			}
			moveAwayFrom(point, ferocity) {
				if (ferocity === undefined) ferocity = 1;
				let dirX = -Math.sign(point.x - this.middle.x);
				let dirY = -Math.sign(point.y - this.middle.y);
				let dir = new Vector2(dirX, dirY);
				dir.mul(ferocity * 0.1);
				this.speed.add(dir);
				this.logMod(function () {
					this.moveAwayFrom(point, ferocity);
				});
			}
			static getBoundingBox(r) {
				let rect;
				if (r.radius) {
					rect = new Rect(r.middle.x - r.radius, r.middle.y - r.radius, r.radius * 2, r.radius * 2);
				} else {
					let hypot = Math.sqrt((r.width / 2) ** 2 + (r.height / 2) ** 2);
					rect = new Rect(r.middle.x - hypot, r.middle.y - hypot, hypot * 2, hypot * 2);
				}
				return rect;
			}
			static getCells(r, cellsize) {
				let bound = PhysicsObject.getBoundingBox(r);
				if (r.radius || (bound.width * bound.height) / (cellsize ** 2) < 30) {
					let cells = [];
					for (let i = 0; i <= Math.ceil(bound.width / cellsize); i++) {
						for (let j = 0; j <= Math.ceil(bound.height / cellsize); j++) {
							let x = i + Math.floor(bound.x / cellsize);
							let y = j + Math.floor(bound.y / cellsize);
							cells.push(P(x, y));
						}
					}
					return cells;
				} else {
					let cells = [];
					let edges = PhysicsObject.getEdges(r);
					let corners = PhysicsObject.getCorners(r);
					let nums = [0, 1, 2, 3];
					if (r.width < cellsize) {
						nums = [0];
						let x = (corners[0].x + corners[1].x) / 2;
						let y = (corners[0].y + corners[1].y) / 2;
						let x2 = (corners[2].x + corners[3].x) / 2;
						let y2 = (corners[2].y + corners[3].y) / 2;
						cells.push(P(x, y), P(x2, y2));
					}
					if (r.height < cellsize) {
						nums = [1];
						let x = (corners[1].x + corners[2].x) / 2;
						let y = (corners[1].y + corners[2].y) / 2;
						let x2 = (corners[3].x + corners[0].x) / 2;
						let y2 = (corners[3].y + corners[0].y) / 2;
						cells.push(P(x, y), P(x2, y2));
					}
					for (let i of nums) {
						let crn1 = corners[i];
						let crn2 = corners[i - 1] ? corners[i - 1] : corners[corners.length - 1];
						let d = Physics.distToPoint(crn1, crn2);
						let dir = edges[i];
						let originX = crn1.x / cellsize;
						let originY = crn1.y / cellsize;
						let steps = 3;
						for (let j = 0; j <= Math.ceil(d / cellsize) * steps; j++) {
							let x = originX + dir.x * j / steps;
							let y = originY + dir.y * j / steps;
							if (x % 1 > 0.5) cells.push(P(Math.floor(x + 1), Math.floor(y)));
							if (y % 1 > 0.5) cells.push(P(Math.floor(x), Math.floor(y + 1)));
							cells.push(P(Math.floor(x), Math.floor(y)));
						}
					}
					return cells;
				}
			}
			static rotatePointAround(o, p, r) {
				let dif = new Vector2(p.x - o.x, p.y - o.y);
				let a = dif.getAngle();
				a += r;
				let nDif = Vector2.fromAngle(a);
				nDif.mag = dif.mag;
				return new Vector2(o.x + nDif.x, o.y + nDif.y);
			}
			static getCorners(r) {
				if (r.getCorners) return r.getCorners();
				let corners = [
					new Vector2(r.x, r.y),
					new Vector2(r.x + r.width, r.y),
					new Vector2(r.x + r.width, r.y + r.height),
					new Vector2(r.x, r.y + r.height)
				];
				for (let i = 0; i < corners.length; i++) corners[i] = PhysicsObject.rotatePointAround(r.middle, corners[i], r.rotation);
				return corners;
			}
			static getEdges(r) {
				let corners = PhysicsObject.getCorners(r);
				let edges = [];
				for (let i = 0; i < corners.length; i++) {
					if (i == 0) edges.push(corners[corners.length - 1].minus(corners[0]).normalize());
					else edges.push(corners[i - 1].minus(corners[i]).normalize());
				}
				return edges;
			}
			static farthestInDirection(r, dir) {
				let corners = PhysicsObject.getCorners(r);
				let farthest = corners[0];
				let farthestDist = -Infinity;
				for (let corner of corners) {
					let dist = corner.x * dir.x + corner.y * dir.y;
					if (dist > farthestDist) {
						farthest = corner;
						farthestDist = dist;
					}
				}
				return farthest;
			}
			static collideCircleCircle(a, b) {
				let colliding = (b.x - a.x) ** 2 + (b.y - a.y) ** 2 < (a.radius + b.radius) ** 2;
				let col;
				if (colliding) {
					let collisionAxis = (new Vector2(b.x - a.x, b.y - a.y)).normalize();
					let penetration = a.radius + b.radius - g.f.getDistance(a, b);
					col = new Collision(true, a, b, collisionAxis, collisionAxis.times(-1), penetration);
				} else col = new Collision(false, a, b);
				return col;
			}
			static collideRectCircle(a, b) {
				let colliding = a.collider.collideBox(b.collider);
				if (colliding) {
					let edges = [];
					let corners = PhysicsObject.getCorners(a);
					for (let i = 0; i < corners.length; i++) {
						let a = corners[i];
						let b = corners[(i + 1) % corners.length];
						edges.push(new Line(a, b));
					}
					let inside = a.collider.collidePoint(b.middle);
					let bestPoint = Physics.closestPointOnRectangle(b.middle, a.collider);
					let bestDist = Math.sqrt((bestPoint.x - b.middle.x) ** 2 + (bestPoint.y - b.middle.y) ** 2);
					let penetration = b.radius + (inside ? bestDist : -bestDist);
					let collisionAxis = new Vector2(b.middle.x - bestPoint.x, b.middle.y - bestPoint.y);
					collisionAxis.normalize();
					if (inside) collisionAxis.mul(-1);
					let col = new Collision(true, a, b, collisionAxis, collisionAxis.times(-1), penetration);
					//console.log(col);
					return col;
				} else return new Collision(false, a, b);
			}
			static collideCircleRect(a, b) {
				let colliding = b.collider.collideBox(a.collider);

				//getting resolution data
				let col;
				if (colliding) {
					let bestDist = Infinity;
					let bestPoint = Physics.closestPointOnRectangle(a.middle, b.collider);
					if (!bestPoint) return new Collision(false, a, b);
					bestDist = Physics.distToPoint(bestPoint, a.middle);
					let collisionAxis = bestPoint.minus(a.middle).normalize();
					const inside = b.collider.collidePoint(a.middle);
					let penetration = a.radius + (inside ? bestDist : -bestDist);
					if (inside) collisionAxis.mul(-1);
					col = new Collision(true, a, b, collisionAxis, collisionAxis.times(-1), penetration / 2);
				} else col = new Collision(false, a, b);
				return col;
			}
			static collideRectRect(a, b) {
				if (!Physics.overlapRectRect(PhysicsObject.getBoundingBox(a), PhysicsObject.getBoundingBox(b))) return new Collision(false, a, b);
				let aEdges = PhysicsObject.getEdges(a);
				let bEdges = PhysicsObject.getEdges(b);
				let edges = [
					aEdges[0], aEdges[1],
					bEdges[0], bEdges[1]
				];
				let aCorners = PhysicsObject.getCorners(a);
				let bCorners = PhysicsObject.getCorners(b);
				let colliding = true;
				let collisionAxis = null;
				let leastIntersection = Infinity;
				for (let i = 0; i < edges.length; i++) {
					let edge = edges[i];
					let aRange = new Range();
					let bRange = new Range();
					for (let point of aCorners) {
						let projection = Physics.projectPointOntoLine(point, edge);
						aRange.include(projection);
					}
					for (let point of bCorners) {
						let projection = Physics.projectPointOntoLine(point, edge);
						bRange.include(projection);
					}
					if (!Range.intersect(aRange, bRange)) {
						colliding = false;
						break;
					}
				}
				if (colliding) {
					for (let i = 0; i < bEdges.length; i++) {
						let edge = bEdges[i - 1];
						if (!i) edge = bEdges[bEdges.length - 1];
						let normal = Vector2.fromAngle(edge.getAngle() + Math.PI / 2);
						let penetratingCorner = PhysicsObject.farthestInDirection(a, normal);
						let edgeStart = bCorners[i];
						let edgeEnd = bCorners[i + 1];
						if (!edgeEnd) edgeEnd = bCorners[0];
						let closestPointOnEdge = Physics.closestPointOnLineObject(penetratingCorner, new Line(edgeStart, edgeEnd));
						let overlap = a.home.home.f.getDistance(penetratingCorner, closestPointOnEdge);
						let axis = closestPointOnEdge.minus(penetratingCorner).normalize();
						if (overlap < leastIntersection) {
							leastIntersection = overlap;
							collisionAxis = axis;
						}
					}
					for (let i = 0; i < aEdges.length; i++) {
						let edge = i ? aEdges[i - 1] : aEdges[aEdges.length - 1];
						let normal = Vector2.fromAngle(edge.getAngle() + Math.PI / 2);
						let penetratingCorner = PhysicsObject.farthestInDirection(b, normal);
						let edgeStart = aCorners[i];
						let edgeEnd = (i !== aEdges.length - 1) ? aCorners[i + 1] : aCorners[0];
						let closestPointOnEdge = Physics.closestPointOnLineObject(penetratingCorner, new Line(edgeStart, edgeEnd));
						let overlap = a.home.home.f.getDistance(penetratingCorner, closestPointOnEdge);
						[closestPointOnEdge, penetratingCorner] = [penetratingCorner, closestPointOnEdge];
						let axis = closestPointOnEdge.minus(penetratingCorner).normalize();
						if (overlap < leastIntersection) {
							leastIntersection = overlap;
							collisionAxis = axis;
						}
					}
				}
				let col;
				if (colliding) {
					if (collisionAxis) col = new Collision(colliding, a, b, collisionAxis.times(-1), collisionAxis, leastIntersection);
					else {
						col = new Collision(false, a, b);
						a.rotation += 0.00001;
						b.rotation += 0.00001;
					}
				} else col = new Collision(false, a, b);
				return col;
			}
			static resolve(col) {
				//resolve collisions
				let d = col.Bdir;
				let a = col.a;
				let b = col.b;
				let mobile = b.applyGravity && b.canMoveThisFrame;
				let dir = col.Adir.times(col.penetration);
				a.x -= dir.x;
				a.y -= dir.y;
				//velocity
				let aVelocityCoefficient = clamp(Math.abs(a.velocity.mag) - 0.1, 0, 1);
				let bVelocityCoefficient = clamp(Math.abs(b.velocity.mag) - 0.1, 0, 1);

				if (a.velocity.mag) {
					let velocityMagnitude = clamp(a.velocity.dot(col.Adir), 0, 1) * 0.1;
					a.velocity.sub(col.Adir.times(velocityMagnitude));
				}
				//calculate relative percentages;
				let aPercentSize = a.mass / (a.mass + b.mass);
				let bPercentSize = 1 - aPercentSize;
				let aPercentSpeed = Math.abs(a.velocity.dot(col.Adir)) / (Math.abs(b.velocity.dot(col.Bdir)) + Math.abs(a.velocity.dot(col.Adir)));
				let bPercentSpeed = 1 - aPercentSpeed;
				let aPercent = (1 - (aPercentSize * aPercentSpeed));
				let bPercent = (1 - (bPercentSize * bPercentSpeed));
				if (mobile) {
					aPercent *= aVelocityCoefficient;
					bPercent *= bVelocityCoefficient;	
				}
				//angle
				let angleToAlign = (col.Bdir.getAngle() + Math.PI / 2) % (2 * Math.PI);
				a.align(angleToAlign, 0.05 * aPercent);
				if (mobile) b.align(angleToAlign, 0.05 * bPercent);
				a.canMoveThisFrame = false;

				//do custom collision response
				if (!a.colliding.general) a.colliding.general = [b];
				else a.colliding.general.push(b);
				if (!b.colliding.general) b.colliding.general = [a];
				else b.colliding.general.push(a);
				a.scriptCollideGeneral(b);
				b.scriptCollideGeneral(a);
				let top = d.y > 0.2;
				let bottom = d.y < -0.2;
				let right = d.x < -0.2;
				let left = d.x > 0.2;
				if (left) {
					if (!a.colliding.left) a.colliding.left = [b];
					else a.colliding.left.push(b);
					a.scriptCollideLeft(b);
					a.response.collide.left(b);
					if (!b.colliding.right) b.colliding.right = [a];
					else b.colliding.right.push(a);
					b.scriptCollideRight(a);
					b.response.collide.right(a);
				}
				if (right) {
					if (!a.colliding.right) a.colliding.right = [b];
					else a.colliding.right.push(b);
					a.scriptCollideRight(b);
					a.response.collide.right(b);
					if (!b.colliding.left) b.colliding.left = [a];
					else b.colliding.left.push(a);
					b.scriptCollideLeft(a);
					b.response.collide.left(a);
				}
				if (top) {
					if (!a.colliding.top) a.colliding.top = [b];
					else a.colliding.top.push(b);
					a.scriptCollideTop(b);
					a.response.collide.top(b);
					if (!b.colliding.bottom) b.colliding.top = [a];
					else b.colliding.bottom.push(a);
					b.scriptCollideBottom(a);
					b.response.collide.bottom(a);
				}
				if (bottom) {
					if (!a.colliding.bottom) a.colliding.bottom = [b];
					else a.colliding.bottom.push(b);
					a.scriptCollideBottom(b);
					a.response.collide.bottom(b);
					if (!b.colliding.top) b.colliding.top = [a];
					else b.colliding.top.push(a);
					b.scriptCollideTop(a);
					b.response.collide.top(a);
				}
			}
		}
		CirclePhysicsObject = class extends PhysicsObject {
			constructor(name, x, y, radius, gravity, controls, tag, home) {
				super(name, x, y, 0, 0, gravity, controls, tag, home);
				this.collider = new CircleCollider(x, y, radius, this.rotation);
				this.optimalRotation = null;
			}
			set middle(a) {
				this.x = a.x;
				this.y = a.y;
			}
			get middle() {
				return P(this.x, this.y);
			}
			set radius(a) {
				this.collider.radius = a;
			}
			get radius() {
				return this.collider.radius;
			}
			set width(a) {
				this.radius = a / 2;
			}
			get width() {
				return this.radius * 2;
			}
			set height(a) {
				this.radius = a / 2;
			}
			get height() {
				return this.radius * 2;
			}
		}
	}
}
class Scene extends InactiveScene {
	constructor(name, context, gravity, airResistance, home) {
		super(name, gravity, airResistance);
		this.c = context;
		this.home = home;
		this.zoom = 1;
		this.cullGraphics = true;
		this.speedModulation = 1;
		this.display = new Rect(0, 0, this.c.canvas.width, this.c.canvas.height)
		this.adjustedDisplay = new Rect(this.display.x, this.display.y, this.display.width, this.display.height);
		M.engineClick = function (e) {
			let adjusted = this.adjustPointForDisplay(e);
			for (let o of this.collidePoint(adjusted)) {
				this.get(o).response.click(adjusted);
				let m = this.get(o);
				for (let script of m.scripts) {
					script.scriptClick(adjusted);
				}
			}
		}.bind(this);
		M.engineRightClick = function (e) {
			let adjusted = this.adjustPointForDisplay(e);
			for (let o of this.collidePoint(adjusted)) {
				this.get(o).response.rightClick(adjusted);
				let m = this.get(o);
				for (let script of m.scripts) {
					script.scriptRightClick(adjusted);
				}
			}
		}.bind(this);
		M.engineMove = function (e) {
			let adjusted = this.adjustPointForDisplay(e);
			let collided = this.collidePointBoth(adjusted)
			for (let o of collided[0]) {
				if (!o.hovered) {
					o.response.hover(adjusted);
					let m = this.get(o);
					for (let script of m.scripts) {
						script.scriptHover(adjusted);
					}
				}
				o.hovered = true;
			}
			for (let o of collided[1]) {
				if (o) o.hovered = false;
			}
		}.bind(this);
		this.cellSize = 150;
		this.removeQueue = [];
		this.S = {
			UA: this.updateArray.bind(this),
			UDA: this.updateDisplayAt.bind(this),
			CDA: this.centerDisplayAt.bind(this),
			ZI: this.zoomIn.bind(this),
			ZO: this.zoomOut.bind(this),
			RZ: this.restoreZoom.bind(this),
			ARE: this.addRectElement.bind(this),
			AE: this.addElement.bind(this),
			APS: this.addParticleSpawner.bind(this),
			RE: this.removeElement.bind(this),
			RAE: this.removeAllElements.bind(this),
			G: this.get.bind(this),
			GAE: this.getAllElements.bind(this),
			GEWT: this.getElementsWithTag.bind(this),
			CED: this.changeElementDraw.bind(this),
			CEU: this.changeElementUpdate.bind(this),
			CER: this.changeElementResponse.bind(this),
			CECR: this.changeElementCollideResponse.bind(this),
			CAED: this.changeAllElementDraw.bind(this),
			CAEU: this.changeAllElementUpdate.bind(this),
			CP: this.collidePoint.bind(this)
		}
	}
	drawInWorldSpace(artist) {
		this.c.c.translate(this.c.middle.x, this.c.middle.y)
		this.c.c.scale(this.zoom, this.zoom)
		this.c.c.translate(-this.c.middle.x, -this.c.middle.y)
		this.c.c.translate(-this.display.x, -this.display.y)
		artist();
		this.c.c.translate(this.display.x, this.display.y)
		this.c.c.translate(this.c.middle.x, this.c.middle.y)
		this.c.c.scale(1 / this.zoom, 1 / this.zoom)
		this.c.c.translate(-this.c.middle.x, -this.c.middle.y)
	}
	drawInScreenSpace(artist) {
		this.c.c.translate(this.display.x, this.display.y)
		this.c.c.translate(this.c.middle.x, this.c.middle.y)
		this.c.c.scale(1 / this.zoom, 1 / this.zoom)
		this.c.c.translate(-this.c.middle.x, -this.c.middle.y)
		artist();
		this.c.c.translate(this.c.middle.x, this.c.middle.y)
		this.c.c.scale(this.zoom, this.zoom)
		this.c.c.translate(-this.c.middle.x, -this.c.middle.y)
		this.c.c.translate(-this.display.x, -this.display.y)
	}
	repairDisplay() {
		let nMin = new Vertex(this.display.x, this.display.y);
		let nMax = new Vertex(this.display.x + this.display.width, this.display.y + this.display.height);
		nMin = this.adjustPointForZoom(nMin);
		nMax = this.adjustPointForZoom(nMax);
		return new Rect(nMin, nMax);
	}
	enginePhysicsUpdate() {
		for (let rect of this.contains_array) rect.isBeingUpdated = true;
		this.updateArray();
		this.clearAllCollisions();
		let q = this.removeQueue;
		function p(x) {
			q.push(x);
		}
		for (let rect of this.contains_array) rect.pushToRemoveQueue = p;
		if (!this.hasRotatedRectangles) for (let rect of this.contains_array) rect.enginePhysicsUpdate(this.contains_array);
		else {
			//grid
			let cells = {};
			let cells2 = [[]];
			let isUseless = (a) => !(a instanceof PhysicsObject) || !a.canCollide || (a.tag === "Engine-Particle");
			let useful = []
			let useless = [];
			for (let rect of this.contains_array) {
				if (isUseless(rect)) {
					useless.push(rect);
					continue;
				} else useful.push(rect);
				let cls = PhysicsObject.getCells(rect, this.cellSize);
				for (let cl of cls) {
					let key = cl.x + "," + cl.y;
					if (cells[key]) cells[key].push(rect);
					else cells[key] = [rect];
					cells2[cells2.length - 1].push(cells[key]);
				}
				cells2.push([]);
			}
			for (let i = 0; i < useful.length; i++) {
				let rect = useful[i];
				let updater = [];
				let updateCells = cells2[i];
				if (rect.applyGravity) for (let cell of updateCells) {
					for (let r of cell) {
						if (r !== rect && !updater.includes(r)) updater.push(r);
					}
				}
				rect.enginePhysicsUpdate(updater);
			}
			for (let rect of useless) rect.enginePhysicsUpdate([]);
			if (0) s.drawWithTransformations(e => {
				for (let [key, cell] of cells) {
					let x = parseInt(key.split(",")[0]) * this.cellSize;
					let y = parseInt(key.split(",")[1]) * this.cellSize;
					let r = new Rect(x, y, this.cellSize, this.cellSize);
					c.stroke(cl.RED, 3).rect(r);
					c.draw(new Color(255, 0, 0, 0.15)).rect(r);
				}
			});
		}
		for (let rect of q) rect.home.removeElement(rect);
		this.removeQueue = [];
		for (let rect of this.contains_array) rect.isBeingUpdated = false;
	}
	engineDrawUpdate() {
		this.updateArray();
		for (let rect of this.contains_array) rect.isBeingUpdated = true;
		this.display.width = this.c.canvas.width;
		this.display.height = this.c.canvas.height;
		this.home.beforeScript.run();
		this.adjustedDisplay = this.repairDisplay();
		this.c.c.translate(this.c.middle.x, this.c.middle.y);
		this.c.c.scale(this.zoom, this.zoom);
		this.c.c.translate(-this.c.middle.x, -this.c.middle.y);
		this.c.c.translate(-this.display.x, -this.display.y);
		this.home.updateScript.run();
		let q = this.removeQueue;
		function p(x) {
			q.push(x);
		}
		for (let rect of this.contains_array) rect.pushToRemoveQueue = p;
		this.contains_array.sort(function (a, b) {
			return a.layer - b.layer;
		});
		for (let rect of this.contains_array) {
			rect.engineDrawUpdate();
			rect.lifeSpan++;
		}
		this.c.c.translate(this.display.x, this.display.y);
		this.c.c.translate(this.c.middle.x, this.c.middle.y);
		this.c.c.scale(1 / this.zoom, 1 / this.zoom);
		this.c.c.translate(-this.c.middle.x, -this.c.middle.y);
		this.home.afterScript.run();
		for (let rect of q) rect.home.removeElement(rect);
		this.removeQueue = [];
		for (let rect of this.contains_array) rect.isBeingUpdated = false;
	}
	loadScene(sc) {
		sc.updateArray();
		let els = [];
		for (let el of sc.contains_array) {
			let n = this.copy(el);
			n.rename(sc.name + "&" + el.name);
			els.push(n);
		}
		return els;
	}
	unloadScene(els) {
		this.removeElement(els);
	}
	adjustPointForZoom(point) {
		let displayM = this.display.middle; //optimize .middle() calls
		let newX = point.x;
		let newY = point.y;
		let DX = newX - displayM.x; //distance from the middle to the point
		let DY = newY - displayM.y; //distance from the middle to the point
		let distX = Math.abs(DX); //positive distance
		let distY = Math.abs(DY); //positive distance
		newX = this.home.extend(DX, (distX) * ((1 / this.zoom) - 1)); //extend x according to it's distance from the center
		newY = this.home.extend(DY, (distY) * ((1 / this.zoom) - 1)); //extend y according to it's distance from the center
		newX += displayM.x; //re-center x
		newY += displayM.y; //re-center y
		return new Vertex(newX, newY); //return the result
	}
	screenSpaceToWorldSpace(point) {
		let displayM = this.display.middle; //optimize .middle() calls
		let newX = point.x + this.display.x //move points to have accurate x with display movement
		let newY = point.y + this.display.y //move points to have accurate y with display movement
		let DX = newX - displayM.x; //distance from the middle to the point
		let DY = newY - displayM.y; //distance from the middle to the point
		let distX = Math.abs(DX); //positive distance
		let distY = Math.abs(DY); //positive distance
		newX = this.home.extend(DX, (distX) * ((1 / this.zoom) - 1)); //extend x according to it's distance from the center
		newY = this.home.extend(DY, (distY) * ((1 / this.zoom) - 1)); //extend y according to it's distance from the center
		newX += displayM.x; //re-center x
		newY += displayM.y; //re-center y
		return new Vertex(newX, newY); //return the result
	}
	updateDisplayAt(x, y, width, height) {
		this.display = new Rect(x, y, width, height);
	}
	centerDisplayAt(point) {
		this.display.x = point.x - this.c.canvas.width / 2;
		this.display.y = point.y - this.c.canvas.height / 2;
	}
	moveDisplayTowards(point, ferocity) {
		let goal = P(point.x - this.c.canvas.width / 2, point.y - this.c.canvas.height / 2);
		let pos = P(this.display.x, this.display.y);
		let dif = P(goal.x - pos.x, goal.y - pos.y);
		let move = P(Math.sign(dif.x) * ferocity, Math.sign(dif.y) * ferocity);
		this.display.x = pos.x + move.x;
		this.display.y = pos.y + move.y;
	}
	zoomIn(amount) {
		this.zoom *= 1 + amount;
	}
	zoomOut(amount) {
		this.zoom /= 1 + amount;
	}
	restoreZoom() {
		this.zoom = 1;
	}
}
