class InactiveScene {
	constructor(name, gravity = 0.2) {
		this.gravity = gravity;
		this.name = name;
		this.rebound = 0;
		this.elementArray = [];
		this.custom = {};
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
		this.defaultDraw = function (name, shape) {
			c.draw("#000").infer(shape);
			c.stroke("cyan", 1).infer(shape);
		}
		this.defaultPhysDraw = function (name, shape) {
			c.draw("#000").infer(shape);
			c.stroke("red", 1).infer(shape);
		}
		this.defaultParticleDraw = function () {
			this.home.c.draw("Black").circle(this.middle.x, this.middle.y, this.width / 2);
		}
		this.defaultUpdate = function () { }
		this.elements = {};
	}
	updateArray() {
		this.elementArray = [];
		for (let rect in this.elements) {
			let cont = this.elements[rect];
			if (cont instanceof InactiveScene) {
				if (cont.active) {
					let ary = cont.updateArray();
					this.elementArray.push(...ary);
				}
			} else this.elementArray.push(cont);
		}
		return this.elementArray;
	}
	copy(el) {
		let n;
		if (el instanceof ParticleSpawnerObject) {
			n = this.addParticleSpawner(el.name + " - copy", el.x, el.y, el.particleSize, el.particleInitSpeed, el.particleDelay, el.particleLifeSpan, el.particleDraw, el.particleSizeVariance, el.particleSpeedVariance, el.dirs);
			n.particleSlows = el.particleSlows;
			n.particleFades = el.particleFades;
			n.particleFalls = el.particleFalls;
			n.active = el.active;
		} else if (el instanceof UIObject) {
			n = this.addUI(el.name + " - copy", el.x, el.y, el.width, el.height);
		} else if (el instanceof PhysicsObject) {
			n = this.addPhysicsElement(el.name + " - copy", el.x, el.y, !el.completelyStatic, { ...el.controls }, el.tag);
			n.positionStatic = el.positionStatic;
			n.rotationStatic = el.rotationStatic;
			n.hasGravity = el.hasGravity;
			n.slows = el.slows;
			n.rotation = el.rotation;
		} else {
			n = this.addElement(el.name + " - copy", el.x, el.y, { ...el.controls }, el.tag);
		}
		let ser = el.serializeShapes();
		n.parseShapes(ser);
		el.runLog(n);
		return n;
	}
	hideElement(name) {
		this.performFunctionBasedOnType(name, function (e) {
			this.elements[e].hide();
			this.elements[e].logMod(function HIDE() {
				this.hide();
			});
		}.bind(this));
		return this;
	}
	showElement(name) {
		this.performFunctionBasedOnType(name, function (e) {
			this.elements[e].show();
			this.elements[e].logMod(function SHOW() {
				this.show();
			});
		}.bind(this));
		return this;
	}
	genName(database, name) {
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
	addRectElement(name, x, y, width, height, controls = new Controls(), tag = "") {
		name = this.genName(this.elements, name);
		let n = new SceneObject(name, x, y, controls, tag, this);
		n.addShape("default", new Rect(-width / 2, -height / 2, width, height));
		this.changeElementDraw(n, this.defaultDraw);
		this.elements[name] = n;
		return n;
	}
	addCircleElement(name, x, y, radius, controls = new Controls(), tag = "") {
		name = this.genName(this.elements, name);
		let n = new SceneObject(name, x, y, controls, tag, this);
		n.addShape("default", new Circle(0, 0, radius));
		this.changeElementDraw(n, this.defaultDraw);
		this.elements[name] = n;
		return n;
	}
	addElement(name, x, y, controls = new Controls(), tag = "") {
		name = this.genName(this.elements, name);
		let n = new SceneObject(name, x, y, controls, tag, this);
		this.changeElementDraw(n, this.defaultDraw);
		this.elements[name] = n;
		return n;
	}
	addPhysicsElement(name, x, y, gravity, controls = new Controls(), tag = "") {
		name = this.genName(this.elements, name);
		let n = new PhysicsObject(name, x, y, gravity, controls, tag, this);
		this.changeElementDraw(n, this.defaultPhysDraw);
		this.elements[name] = n;
		return n;
	}
	addPhysicsRectElement(name, x, y, width, height, gravity, controls = new Controls(), tag = "") {
		name = this.genName(this.elements, name);
		let n = new PhysicsObject(name, x, y, gravity, controls, tag, this);
		n.addShape("default", new Rect(-width / 2, -height / 2, width, height));
		n.cacheMass();
		this.changeElementDraw(n, this.defaultPhysDraw);
		this.elements[name] = n;
		return n;
	}
	addPhysicsCircleElement(name, x, y, radius, gravity, controls = new Controls(), tag = "") {
		name = this.genName(this.elements, name);
		let n = new PhysicsObject(name, x, y, gravity, controls, tag, this);
		n.addShape("default", new Circle(0, 0, radius));
		n.cacheMass();
		this.changeElementDraw(n, this.defaultPhysDraw);
		this.elements[name] = n;
		return n;
	}
	addUIElement(name, x, y, width, height, draw = function () { }) {
		name = this.genName(this.elements, name);
		if (width < 0) {
			width = -width;
			x -= width;
		}
		if (height < 0) {
			height = -height;
			y -= height;
		}
		this.elements[name] = new UIObject(name, x, y, draw, this);
		let n = this.elements[name];
		n.addShape("default", new Rect(-width / 2, -height / 2, width, height));
		return n;
	}
	addContainer(name, active) {
		name = this.genName(this.elements, name);
		let x = new InactiveScene(name);
		x.active = active;
		x.home = this.home;
		this.elements[name] = x;
		return x;
	}
	addParticleExplosion(amountParticles, x, y, size = 1, spd = 1, delay = 1, timer = 50, draw, sizeVariance = 0, speedVariance = 0, dirs = new CardinalDirections(1, 1, 1, 1), falls = false, slows = true, fades = true) {
		name = this.genName(this.elements, "Default-Explosion-Spawner");
		let ns = new ParticleSpawnerObject(name, x, y, size, spd, delay, timer, draw, sizeVariance, speedVariance, dirs, this);
		this.elements[name] = ns;
		for (let i = 0; i < amountParticles; i++) {
			ns.spawnParticle();
		}
		ns.particleFalls = falls;
		ns.particleFades = fades;
		ns.particleSlows = slows;
		ns.active = false;
		ns.update = function () {
			let n = 0;
			for (let key in ns.spawns) n++;
			if (!n) ns.remove();
		}
		return ns;
	}
	addParticleSpawner(name, x, y, size = 1, spd = 1, delay = 1, timer = 50, draw, sizeVariance = 0, speedVariance = 0, dirs = new CardinalDirections(1, 1, 1, 1), falls = false, slows = true, fades = true, active = true) {
		name = this.genName(this.elements, name);
		let ns = new ParticleSpawnerObject(name, x, y, size, spd, delay, timer, draw, sizeVariance, speedVariance, dirs, this);
		this.elements[name] = ns;
		ns.particleFalls = falls;
		ns.particleFades = fades;
		ns.particleSlows = slows;
		ns.active = active;
		return ns;
	}
	addScript(name, opts) {
		window[name] = new ElementScript(name, opts);
		return window[name];
	}
	removeElement(name) {
		this.performFunctionBasedOnType(name, function (e) {
			let x = this.elements[e.name];
			if (x) {
				x.isDead = true;
				delete this.elements[e.name];
			} else if (e.home.elements[e.name]) {
				e.home.removeElement(e);
			}
		}.bind(this));
	}
	removeAllElements() {
		for (let x in this.elements) {
			delete this.elements[x];
		}
	}
	get(name) {
		if (typeof name === "object") {
			return name;
		} else {
			return this.elements[name];
		}
	}
	getAllElements() {
		this.updateArray();
		return this.elementArray;
	}
	getElementsMatch(fn) {
		let ary = [];
		let oAry = this.updateArray();
		for (let rect of oAry) {
			if (fn(rect)) {
				ary.push(rect);
			}
		}
		return ary;
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
	performFunctionBasedOnType(name, func) {
		if (typeof name === "object") {
			if (Array.isArray(name)) {
				for (let item of name) {
					this.performFunctionBasedOnType(item, func);
				}
			} else {
				func(name);
			}
		} else {
			func(this.get(name));
		}
	}
	changeElementDraw(name, newDraw) {
		this.performFunctionBasedOnType(name, function (e) {
			e.draw = newDraw.bind(e);
			e.logMod(function CHANGE_DRAW() {
				this.home.changeElementDraw(this, newDraw);
			});
		}.bind(this));
		return this;
	}
	changeElementMethod(name, method, newMethod) {
		this.performFunctionBasedOnType(name, function (e) {
			e[method] = newMethod.bind(e);
			e.logMod(function CHANGE_METHOD() {
				this.home.changeElementMethod(this, method, newMethod);
			});
		}.bind(this));
		return this;
	}
	changeElementResponse(name, input, newResponse) {
		this.performFunctionBasedOnType(name, function (e) {
			this.elements[e].response.input[input] = newResponse.bind(this.elements[e]);
			this.elements[e].logMod(function CHANGE_INPUT() {
				this.home.changeElementResponse(this, input, newResponse);
			});
		}.bind(this));
		return this;
	}
	changeElementUpdate(name, newUpdate) {
		this.performFunctionBasedOnType(name, function (e) {
			e.update = newUpdate.bind(e);
			e.logMod(function CHANGE_UPDATE() {
				this.home.changeElementUpdate(this, newUpdate);
			});
		}.bind(this));
		return this;
	}
	changeElementCollideResponse(name, dir, newResponse) {
		this.performFunctionBasedOnType(name, function (e) {
			e.response.collide[dir] = newResponse.bind(e);
			e.logMod(function CHANGE_COLLIDE_RESPONSE() {
				this.home.changeElementCollideResponse(this, dir, newResponse);
			});
		}.bind(this));
		return this;
	}
	changeElementCollideRule(name, newRule) {
		this.performFunctionBasedOnType(name, function (e) {
			(new ElementScript("auto_generated_collide_rule #" + performance.now(), {
				collide_rule(l, e) {
					return newRule.bind(this)(e);
				}
			})).addTo(e);
			e.logMod(function CHANGE_COLLIDE_RULE() {
				this.home.changeElementCollideRule(this, newRule);
			});
		}.bind(this));
		return this;
	}
	changeElementCollideOptimize(name, newRule) {
		this.performFunctionBasedOnType(name, function (e) {
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
			let name = "collide" + ((hitbox instanceof CirclePhysicsObject) ? "Circle" : "Shape") + "Shape";
			if (Physics[name](hitbox, box).colliding) {
				collideAry.push(hitbox);
			}
		}
		return collideAry;
	}
	collideCircle(cir) {
		let collideAry = [];
		for (let hitbox of this.updateArray()) {
			let name = "collide" + ((hitbox instanceof CirclePhysicsObject) ? "Circle" : "Shape") + "Circle";
			if (Physics[name](hitbox, cir).colliding) {
				collideAry.push(hitbox);
			}
		}
		return collideAry;
	}
	collidePoint(point) {
		let collideAry = [];
		for (let hitbox of this.updateArray().filter(e => !(e instanceof ParticleObject))) {
			let p = (hitbox instanceof UIObject) ? this.worldSpaceToScreenSpace(point) : point;
			let shapes = hitbox.getModels();
			let colliding = false;
			for (let shape of shapes) if (Physics.collidePoint(shape, p).colliding) colliding = true;
			if (colliding) {
				collideAry.push(hitbox);
			}
		}
		return collideAry;
	}
	collidePointBoth(point) {
		let collideAry = this.collidePoint(point);
		return [collideAry, this.elementArray.filter(e => !collideAry.includes(e))];
	}
}
class Camera extends Rect {
	constructor(x, y, width, height, zoom = 1, rotation = 0, RenderType = Frame) {
		super(x, y, width, height, rotation);
		this.zoom = zoom;
		this.RenderType = RenderType;
		this.view = new this.RenderType(width, height);
		this.newView = new this.RenderType(width, height);
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
	getWorld() {
		let m = this.getModel(Vector2.origin, 0);
		m.scale(1 / this.zoom);
		this.newView = new this.RenderType(width, height);
		return m;
	}
	updateView(width, height) {
		this.view.width = width;
		this.view.height = height;
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
class Scene extends InactiveScene {
	constructor(name, context, gravity, home) {
		super(name, gravity);
		this.c = context;
		this.home = home;
		this.cullGraphics = true;
		this.speedModulation = 1;
		this.constraints = [];
		this.cameras = {};
		this.collisionEvents = false;
		this.mouseEvents = false;
		this.camera = new Camera(0, 0, this.c.canvas.width, this.c.canvas.height, 1, 0);
		this.adjustedDisplay = new Rect(this.camera.x, this.camera.y, this.camera.width, this.camera.height);
		M.engineClick = function (e) {
			let adjusted = this.screenSpaceToWorldSpace(e);
			let collided = this.collidePoint(adjusted);
			if (this.mouseEvents) for (let o of collided) {
				this.get(o).response.click(adjusted);
				let m = this.get(o);
				m.scripts.run("click", adjusted);
			}
		}.bind(this);
		M.engineRightClick = function (e) {
			let adjusted = this.screenSpaceToWorldSpace(e);
			if (this.mouseEvents) for (let o of this.collidePoint(adjusted)) {
				this.get(o).response.rightClick(adjusted);
				let m = this.get(o);
				m.scripts.run("rightClick", adjusted);
			}
		}.bind(this);
		M.engineMove = function (e) {
			let adjusted = this.screenSpaceToWorldSpace(e);
			if (this.mouseEvents) {
				let collided = this.collidePointBoth(adjusted);
				for (let o of collided[0]) {
					if (!o.hovered) {
						o.response.hover(adjusted);
						let m = this.get(o);
						m.scripts.run("hover", adjusted);
					}
					o.hovered = true;
				}
				for (let o of collided[1]) {
					if (o) o.hovered = false;
				}
			}
		}.bind(this);
		this.cellSize = 150;
		this.removeQueue = [];

		this.physics = {
			gravitySort() {

			}
		}
	}
	drawInWorldSpace(artist) {
		this.c.save();
		this.camera.transformToWorld(this.c);
		artist();
		this.c.restore();
	}
	drawInScreenSpace(artist) {
		this.c.save();
		this.camera.transformFromWorld(this.c);
		artist();
		this.c.restore();
	}
	engineFixedUpdate() {
		let startTime = performance.now();
		this.SAT = {
			possibleChecks: 0,
			gridChecks: 0,
			boxChecks: 0,
			SATChecks: 0,
			collisions: 0
		}
		for (let rect of this.elementArray) rect.isBeingUpdated = true;
		this.updateArray();
		this.clearAllCollisions();
		let q = this.removeQueue;
		function p(x) {
			q.push(x);
		}
		for (let rect of this.elementArray) rect.pushToRemoveQueue = p;
		//grid

		//custom before updates run
		for (let el of this.elementArray) {
			el.scripts.run("beforeUpdate");
		}

		const arrays = this.extractUsefulCellArrays(this.elementArray);

		//physics
		for (let i = 0; i < this.physicsRealism; i++) {
			this.updateSceneObjectCaches(arrays.usefulArray);
			this.gravitySort(arrays.useful);
			this.gravityPhase(arrays.usefulArray);
			this.constraintSolve();
			this.collisionStep(arrays.useful);
			this.constraintSolve();
			this.collisionStep([...arrays.useful].reverse());
		}

		//events
		if (this.collisionEvents) this.runEventListeners(arrays.usefulArray);

		//particle movement
		for (let rect of arrays.useless) if (rect.physicsUpdate) for (let i = 0; i < 2; i++) rect.physicsUpdate([]);
		this.updateSceneObjectCaches(arrays.useless);

		//non collision fixed update
		this.physicsObjectFixedUpdate(this.elementArray);

		for (let rect of q) rect.home.removeElement(rect);
		this.removeQueue = [];
		for (let rect of this.elementArray) rect.isBeingUpdated = false;
		// console.log(performance.now() - startTime);
	}
	updateSceneObjectCaches(useful) {
		for (const el of useful) el.updateCaches();
	}
	physicsObjectFixedUpdate(useful) {
		for (let rect of useful) {
			rect.engineFixedUpdate();
		}
	}
	runEventListeners(useful) {
		for (let el of useful) {
			Physics.runEventListeners(el);
		}
	}
	gravityPhase(useful) {
		for (let el of useful) {
			let rect = el;
			rect.applyGravity(1);
		}
	}
	extractUsefulCellArrays(elements) {
		let cells = { };
		let useful = [];
		let useless = [];
		let isUseless = a => !(a instanceof PhysicsObject);
		//categorize
		for (let rect of this.elementArray) {
			if (isUseless(rect)) {
				useless.push(rect);
				continue;
			} else useful.push([rect]);
		}
		//get cells, accumulate cells
		for (let usef of useful) {
			let rect = usef[0];
			let cls = Physics.getCells(rect, this.cellSize);
			for (let cl of cls) {
				let key = cl.x + "," + cl.y;
				if (cells[key]) cells[key].push(rect);
				else cells[key] = [rect];
				let use = usef;
				use.push(cells[key]);
			}
		}
		//map to collisionPairs
		useful = useful.map(usef => {
			//get rectangles
			let [rect, ...updateCells] = usef;
			let updater = [];
			if (!rect.completelyStatic) for (let cell of updateCells) {
				for (let r of cell) {
					if (r !== rect && !updater.includes(r)) updater.push(r);
				}
			}
			return new CollisionPair(rect, updater);
		});
		//remove duplicates
		useful = [...(new Set(useful))];

		// // show cells
		// this.drawInWorldSpace(e => {
		// 	for (let [key, cell] of cells) {
		// 		let x = parseInt(key.split(",")[0]) * this.cellSize;
		// 		let y = parseInt(key.split(",")[1]) * this.cellSize;
		// 		let r = new Rect(x, y, this.cellSize, this.cellSize);
		// 		c.stroke(cl.RED, 3).rect(r);
		// 		c.draw(new Color(255, 0, 0, 0.15)).rect(r);
		// 		// let n = 0;
		// 		// for (let or of cell) {
		// 		// 	c.stroke(cl.ORANGE, 2).arrow(r.middle, or.middle);
		// 		// 	n++;
		// 		// }
		// 		// c.draw(cl.BLUE).text("20px monospace", n, r.middle.x, r.middle.y);
		// 		// c.draw(cl.ORANGE).circle(r.middle.x, r.middle.y, 3);
		// 	}
		// });
		
		let usefulArray = useful.map(e => e.object);
		return { useful, useless, usefulArray };
	}
	gravitySort(useful) {
		const dir = this.gravity.get().normalize();
		useful.sort(function (a, b) {
			let mA = Vector2.fromPoint(a.object);
			let mB = Vector2.fromPoint(b.object);
			let dA = mA.dot(dir);
			let dB = mB.dot(dir);
			return dB - dA;
		});
	}
	collisionStep(useful) {
		for (let i = 0; i < useful.length; i++) {
			let rect = useful[i].object;
			let updater = useful[i].others;

			this.SAT.gridChecks += updater.length;
			this.SAT.possibleChecks += updater.length ? s.elementArray.length : 0;
			if (!rect.usedForCellSize) this.recalculateAverageCellSize(rect);
			rect.physicsUpdate(updater);
		}
	}
	constraintSolve() {
		for (let i = 1; i < 3; i++) {
			let random = this.constraints.randomize();
			for (let constraint of random) {
				constraint.solve(1 / i);
			}
		}
	}
	constrain(a, b, aOffset = Vector2.origin, bOffset = Vector2.origin, length = "CURRENT_DIST", stiffness = 1) {
		this.constraints.push(new Constraint(a, b, aOffset, bOffset, length, stiffness));
	}
	recalculateAverageCellSize(newEl) {
		let oldAvg = this.cellSize;
		let mul = this.elementArray.filter(e => e instanceof PhysicsObject).length;
		oldAvg *= mul;
		let newSize = newEl.width + newEl.height;
		let newAverageMax = (oldAvg + newSize) / (mul + 1);
		this.cellSize = newAverageMax;
		newEl.usedForCellSize = true;
	}
	addCamera(name, camera) {
		name = this.genName(this.cameras, name);
		this.cameras[name] = camera;
		return this.cameras[name];
	}
	getCamera(name) {
		return this.cameras[name];
	}
	renderCamera(camera) {
		let screen = camera.getWorld().getBoundingBox();
		this.c.embody(camera.newView);
		camera.transformToWorld(this.c);
		for (let rect of this.elementArray) {
			rect.engineDrawUpdate(screen);
			rect.lifeSpan++;
		}
		this.c.unembody();
		camera.view = camera.newView;
		return camera.view;
	}
	engineDrawUpdate() {
		this.updateArray();
		this.home.beforeScript.run();
		for (let rect of this.elementArray) rect.isBeingUpdated = true;
		let q = this.removeQueue;
		function p(x) {
			q.push(x);
		}
		for (let rect of this.elementArray) rect.pushToRemoveQueue = p;
		this.updateSceneObjectCaches(this.elementArray);

		this.camera.width = this.c.canvas.width;
		this.camera.height = this.c.canvas.height;
		this.home.updateScript.run();
		this.elementArray.sort(function (a, b) {
			return a.layer - b.layer;
		});
		for (let cameraName in this.cameras) this.renderCamera(this.cameras[cameraName]);
		this.c.image(this.renderCamera(this.camera)).rect(0, 0, width, height);

		this.home.afterScript.run();
		for (let rect of q) rect.home.removeElement(rect);
		this.removeQueue = [];
		for (let rect of this.elementArray) rect.isBeingUpdated = false;
	}
	loadScene(sc) {
		sc.updateArray();
		let els = [];
		for (let el of sc.elementArray) {
			let n = this.copy(el);
			n.rename(sc.name + "&" + el.name);
			els.push(n);
		}
		return els;
	}
	unloadScene(els) {
		this.removeElement(els);
	}
	screenSpaceToWorldSpace(point) {
		return this.camera.screenSpaceToWorldSpace(point);
	}
	worldSpaceToScreenSpace(point) {
		return this.camera.worldSpaceToScreenSpace(point);
	}
	updateCameraAt(x, y, width, height) {
		this.camera = new Camera(x, y, width, height, this.camera.rotation, this.camera.zoom);
	}
	rotateCameraAt(rotation) {
		this.camera.rotation = rotation;
	}
	centerCameraAt(point) {
		this.camera.x = point.x - width / 2;
		this.camera.y = point.y - height / 2;
	}
	centerCameraX(x) {
		this.camera.x = x - width / 2;
	}
	centerCameraY(y) {
		this.camera.y = y - height / 2;
	}
	rotateCameraTowards(rotation, ferocity = 0.1) {
		let dif = Geometry.signedAngularDist(rotation, this.camera.rotation);
		this.camera.rotation += dif * ferocity;
	}
	moveCameraTowards(point, ferocity = 0.1) {
		const cameraPoint = this.camera.middle;
		let dif = point.Vminus(cameraPoint).Ntimes(ferocity);
		this.camera.middle = cameraPoint.plus(dif);
	}
	get zoom() {
		return this.camera.zoom;
	}
	zoomIn(amount) {
		this.camera.zoomIn(amount);
	}
	zoomOut(amount) {
		this.camera.zoomOut(amount);
	}
	restoreZoom() {
		this.camera.restoreZoom();
	}
}