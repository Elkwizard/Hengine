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
		if (!gravity) gravity = new Vector2(0, 0.1);
		if (!airResistance) airResistance = 0.025;
		this.gravity = gravity;
		this.airResistance = airResistance
		this.name = name;
		this.rebound = 0;
		this.contains_array = [];
		this.custom = {};
		this.templates = {};
		this.hasRotatedRectangles = false;
		this.angularDragForce = .995;
		this.linearDragForce = .995;
		this.frictionDragForce = 0.2;
		this.SAT = {
			possibleChecks: 0,
			gridChecks: 0,
			boxChecks: 0,
			SATChecks: 0,
			collisions: 0
		};
		this.physicsRealism = 1;
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
		if (el instanceof PhysicsObject) {
			if (el instanceof ParticleSpawnerObject) {
				n = this.addParticleSpawner(el.name + " - copy", el.x, el.y, el.particleSize, el.particleInitSpeed, el.delay, el.timer, el.particleDraw, el.particleSizeVariance, el.particleSpeedVariance, el.dirs);
				n.width = el.width;
				n.height = el.height;
				n.particleSlows = el.particleSlows;
				n.particleFades = el.particleFades;
				n.particleFalls = el.particleFalls;
				n.active = el.active;
			} else {
				if (el instanceof CirclePhysicsObject) n = this.addCircleElement(el.name + " - copy", el.x, el.y, el.radius, !el.completelyStatic, { ...el.controls }, el.tag);
				else n = this.addRectElement(el.name + " - copy", el.x, el.y, el.width, el.height, !el.completelyStatic, { ...el.controls }, el.tag);
			}
			n.positionStatic = el.positionStatic;
			n.rotationStatic = el.rotationStatic;
			n.hasGravity = el.hasGravity;
			n.slows = el.slows;
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
		name = this.genName_PRIVATE(this.contains, name);
		if (width < 0) {
			width = -width;
			x -= width;
		}
		if (height < 0) {
			height = -height;
			y -= height;
		}
		this.contains[name] = new UIObject(name, x, y, width, height, draw, this);
		let n = this.contains[name];
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
	addParticle(spawner) {
		let name = "Particle #" + spawner.particleNumber++ + " from " + spawner.name;
		name = this.genName_PRIVATE(this.contains, name);
		let ns = new ParticleObject(spawner, this, name);
		this.contains[name] = ns;
		return ns;
	}
	addParticleSpawner(name, x, y, size = 1, spd = 1, delay = 1, timer = 50, draw, sizeVariance = 0, speedVariance = 0, dirs = new Directions(1, 1, 1, 1)) {
		name = this.genName_PRIVATE(this.contains, name);
		let ns = new ParticleSpawnerObject(name, x, y, size, spd, delay, timer, draw, sizeVariance, speedVariance, dirs, this);
		this.contains[name] = ns;
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
			e.isUI = true;
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
	collideRect(box) {
		let collideAry = [];
		for (let hitbox of this.updateArray()) {
			let name = "collide" + ((hitbox instanceof CirclePhysicsObject) ? "Circle" : "Rect") + "Rect";
			if (Physics[name](hitbox, box).colliding) {
				collideAry.push(hitbox);
			}
		}
		return collideAry;
	}
	collideCircle(cir) {
		let collideAry = [];
		for (let hitbox of this.updateArray()) {
			let name = "collide" + ((hitbox instanceof CirclePhysicsObject) ? "Circle" : "Rect") + "Circle";
			if (Physics[name](hitbox, cir).colliding) {
				collideAry.push(hitbox);
			}
		}
		return collideAry;
	}
	collidePoint(point) {
		let collideAry = [];
		for (let hitbox of this.updateArray()) {
			let name = "collide" + ((hitbox instanceof CirclePhysicsObject) ? "Circle" : "Rect") + "Point";
			if (Physics[name](hitbox, point).colliding) {
				collideAry.push(hitbox);
			}
		}
		return collideAry;
	}
	collidePointBoth(point) {
		let collideAry = [];
		let notCollideAry = [];
		for (let hitbox of this.contains_array) {
			let name = "collide" + ((hitbox instanceof CirclePhysicsObject) ? "Circle" : "Rect") + "Point";
			if (Physics[name](hitbox, point).colliding) {
				collideAry.push(hitbox);
			} else {
				notCollideAry.push(hitbox);
			}
		}
		return [collideAry, notCollideAry]
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
			let adjusted = this.screenSpaceToWorldSpace(e);
			for (let o of this.collidePoint(adjusted)) {
				this.get(o).response.click(adjusted);
				let m = this.get(o);
				for (let script of m.scripts) {
					script.scriptClick(script, adjusted);
				}
			}
		}.bind(this);
		M.engineRightClick = function (e) {
			let adjusted = this.screenSpaceToWorldSpace(e);
			for (let o of this.collidePoint(adjusted)) {
				this.get(o).response.rightClick(adjusted);
				let m = this.get(o);
				for (let script of m.scripts) {
					script.scriptRightClick(script, adjusted);
				}
			}
		}.bind(this);
		M.engineMove = function (e) {
			let adjusted = this.screenSpaceToWorldSpace(e);
			let collided = this.collidePointBoth(adjusted);
			for (let o of collided[0]) {
				if (!o.hovered) {
					o.response.hover(adjusted);
					let m = this.get(o);
					for (let script of m.scripts) {
						script.scriptHover(script, adjusted);
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
		this.SAT = {
			possibleChecks: 0,
			gridChecks: 0,
			boxChecks: 0,
			SATChecks: 0,
			collisions: 0
		}
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
			let isUseless = a => !(a instanceof PhysicsObject) || (a instanceof ParticleObject);
			let useful = [];
			let useless = [];

			let sortedEls = this.contains_array;
			for (let rect of sortedEls) {
				if (isUseless(rect)) {
					useless.push(rect);
					continue;
				} else useful.push([rect]);
				let cls = Physics.getCells(rect, this.cellSize);
				for (let cl of cls) {
					let key = cl.x + "," + cl.y;
					if (cells[key]) cells[key].push(rect);
					else cells[key] = [rect];
					let use = useful[useful.length - 1];
					use.push(cells[key]);
				}
			}
			for (let usef of useful) {
				//get rectangles
				let [rect, ...updateCells] = usef;
				let updater = [];
				if (!rect.completelyStatic) for (let cell of updateCells) {
					for (let r of cell) {
						if (r !== rect && !updater.includes(r)) updater.push(r);
					}
				}
				usef.push(updater);
			}
			useful = [...(new Set(useful))];
			const dir = this.gravity.get().normalize();
			useful = useful.sort(function (a, b) {
				let mA = Vector2.fromPoint(a[0].unrotatedMiddle);
				let mB = Vector2.fromPoint(b[0].unrotatedMiddle);
				let dA = mA.dot(dir);
				let dB = mB.dot(dir);
				return dB - dA;
			});

			//gravity phase
			for (let el of useful) {
				let rect = el[0];
				rect.applyGravity(1);
			}
			//collision phase
			for (let i = 0; i < useful.length; i++) {
				let rect = useful[i][0];
				let updater = useful[i][useful[i].length - 1];

				this.SAT.gridChecks += updater.length;
				this.SAT.possibleChecks += updater.length ? s.contains_array.length : 0;
				rect.physicsUpdate(updater);
			}
			//prohibited direction render
			// this.drawInWorldSpace(e => {
			// 	for (let i = 0; i < useful.length; i++) {
			// 		let rect = useful[i][0];
			// 		for (let prohibit of rect.prohibited) c.stroke(cl.RED, 2).arrow(rect.middle, rect.middle.plus(prohibit.times(20)));
			// 	}
			// });

			//custom updates run
			for (let usef of useful) {
				let rect = usef[0];
				rect.enginePhysicsUpdate();
			}
			//update order render
			// this.drawInWorldSpace(e => {
			// 	for (let i = 0; i < useful.length; i++) {
			// 		let other = useful[i][0];
			// 		let x = other.middle.x;
			// 		let y = other.middle.y;
			// 		c.draw(cl.RED).text("10px Arial", "#" + (i + 1), x, y);
			// 	}
			// });


			//non collision fixed update
			for (let rect of useless) {
				if (rect.physicsUpdate) for (let i = 0; i < 2; i++) rect.physicsUpdate([]);
				rect.enginePhysicsUpdate();
			}
			// // show cells
			// s.drawInWorldSpace(e => {
			// 	for (let [key, cell] of cells) {
			// 		let x = parseInt(key.split(",")[0]) * this.cellSize;
			// 		let y = parseInt(key.split(",")[1]) * this.cellSize;
			// 		let r = new Rect(x, y, this.cellSize, this.cellSize);
			// 		c.stroke(cl.RED, 3).rect(r);
			// 		c.draw(new Color(255, 0, 0, 0.15)).rect(r);
			// 	}
			// });
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
		this.c.clearTransformations();
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
		return new Vector2(newX, newY); //return the result
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
		return new Vector2(newX, newY); //return the result
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
