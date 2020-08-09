class InactiveScene {
	constructor(name = "scene", gravity = new Vector2(0, 0.1)) {
		this.name = name;
		this.rebound = 0;
		this.elementArray = [];
		this.custom = {};
		this.gravity = gravity;
		this.physicsEngine = new PhysicsEngine(gravity.toPhysicsVector());
		this.physicsEngine.polygonVertexListSubdivider = physicsPolygonSubdivider;
		this.defaults = {
			SceneObject: {
				draw(name, shape) {
					c.draw(cl.BLACK).infer(shape);
					c.stroke(cl.CYAN, 1).infer(shape);
				},
				update() { },
				scripts: []
			},
			PhysicsObject: {
				draw(name, shape) {
					c.draw(cl.BLACK).infer(shape);
					c.stroke(cl.RED, 1).infer(shape);
				},
				update() { },
				scripts: []
			},
			UIObject: {
				draw(name, shape) {
					c.draw(cl.BLACK).infer(shape);
					c.stroke(cl.PURPLE, 1).infer(shape);
				},
				update() { },
				scripts: []
			},
			ParticleSpawnerObject: {
				draw(name, shape) { },
				update() { },
				scripts: []
			},
			ParticleObject: {
				draw(name, shape) {
					c.draw(cl.BLACK).infer(shape);
				},
				update() { },
				scripts: []
			}
		};
		this.elements = {};
	}
	updateArray() {
		this.elementArray = [];
		for (let rect in this.elements) {
			let cont = this.elements[rect];
			if (cont instanceof InactiveScene) {
				if (cont.active) {
					let ary = cont.updateArray();
					for (let el of ary) if (el.body) {
						cont.physicsEngine.removeBody(el.body.id);
						this.physicsEngine.addBody(el.body);
					}
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
			n = this.addPhysicsElement(el.name + " - copy", el.x, el.y, el.body.type === RigidBody.DYNAMIC, { ...el.controls }, el.tag);
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
	initializeSceneObject(sceneObject) {
		const d = this.defaults[sceneObject.constructor.name];
		this.changeElementDraw(sceneObject, d.draw);
		this.changeElementUpdate(sceneObject, d.update);
		for (let script of d.scripts) script.addTo(sceneObject);
	}
	addRectElement(name, x, y, width, height, controls = new Controls(), tag = "") {
		name = this.genName(this.elements, name);
		let n = new SceneObject(name, x, y, controls, tag, this);
		n.addShape("default", new Rect(-width / 2, -height / 2, width, height));
		this.initializeSceneObject(n);
		this.elements[name] = n;
		return n;
	}
	addCircleElement(name, x, y, radius, controls = new Controls(), tag = "") {
		name = this.genName(this.elements, name);
		let n = new SceneObject(name, x, y, controls, tag, this);
		n.addShape("default", new Circle(0, 0, radius));
		this.initializeSceneObject(n);
		this.elements[name] = n;
		return n;
	}
	addElement(name, x, y, controls = new Controls(), tag = "") {
		name = this.genName(this.elements, name);
		let n = new SceneObject(name, x, y, controls, tag, this);
		this.initializeSceneObject(n);
		this.elements[name] = n;
		return n;
	}
	addPhysicsElement(name, x, y, gravity, controls = new Controls(), tag = "") {
		name = this.genName(this.elements, name);
		let n = new PhysicsObject(name, x, y, gravity, controls, tag, this);
		this.initializeSceneObject(n);
		this.elements[name] = n;
		return n;
	}
	addPhysicsRectElement(name, x, y, width, height, gravity, controls = new Controls(), tag = "") {
		name = this.genName(this.elements, name);
		let n = new PhysicsObject(name, x, y, gravity, controls, tag, this);
		n.addShape("default", new Rect(-width / 2, -height / 2, width, height));
		this.initializeSceneObject(n);
		this.elements[name] = n;
		return n;
	}
	addPhysicsCircleElement(name, x, y, radius, gravity, controls = new Controls(), tag = "") {
		name = this.genName(this.elements, name);
		let n = new PhysicsObject(name, x, y, gravity, controls, tag, this);
		n.addShape("default", new Circle(0, 0, radius));
		this.initializeSceneObject(n);
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
		this.initializeSceneObject(n);
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
	addParticleExplosion(amountParticles, x, y, size = 1, spd = 1, delay = 1, timer = 50, draw = this.defaults.ParticleObject.draw, sizeVariance = 0, speedVariance = 0, dirs = new CardinalDirections(1, 1, 1, 1), falls = false, slows = true, fades = true) {
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
	addParticleSpawner(name, x, y, size = 1, spd = 1, delay = 1, timer = 50, draw = this.defaults.ParticleObject.draw, sizeVariance = 0, speedVariance = 0, dirs = new CardinalDirections(1, 1, 1, 1), falls = false, slows = true, fades = true, active = true) {
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
			let el = this.elements[e.name];
			if (el) {
				el.isDead = true;
				this.physicsEngine.removeBody(el.body.id);
				delete this.elements[e.name];
			} else if (e.home.elements[e.name]) {
				e.home.removeElement(e);
			}
		}.bind(this));
	}
	removeAllElements() {
		for (let x in this.elements) {
			this.removeElement(this.elements[x]);
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
	getPhysicsElements() {
		return this.updateArray().filter(e => e instanceof PhysicsObject);
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
	clearAllCollisions() {
		let phys = this.getPhysicsElements();
		for (let i = 0; i < phys.length; i++) {
			if (!this.physicsEngine.isAsleep(phys[i].body)) phys[i].colliding.clear();
		}
	}
	collidePoint(point) {
		let collideAry = [];
		let options = this.updateArray().filter(e => !(e instanceof ParticleObject));
		for (let hitbox of options) {
			let p = (hitbox instanceof UIObject) ? this.worldSpaceToScreenSpace(point) : point;
			let shapes = hitbox.getModels();
			let colliding = false;
			for (let shape of shapes) if (Geometry.overlapPoint(shape, p)) colliding = true;
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
	constructor(x, y, width, height, zoom = 1, rotation = 0) {
		super(x, y, width, height);
		this.rotation = rotation;
		this.zoom = zoom;
		this.view = new Frame(width, height);
		this.newView = new Frame(width, height);
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
		let m = new Polygon(this.vertices.map(vert => vert.Vminus(middle))).getModelCosSin(middle, Math.cos(this.rotation), Math.sin(this.rotation));
		m = m.scale(1 / this.zoom);
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
		this.physicsEngine.oncollide = this.handleCollisionEvent.bind(this);
		this.c = context;
		this.home = home;
		this.cullGraphics = true;
		this.cameras = {};
		this.mouseEvents = false;
		this.collisionEvents = true;
		this.camera = new Camera(0, 0, this.c.width, this.c.height, 1, 0);
		this.home.mouse.onDown.listen(function (e) {
			let adjusted = this.screenSpaceToWorldSpace(e);
			let collided = this.collidePoint(adjusted);
			if (this.mouseEvents) for (let o of collided) {
				o.response.click(adjusted);
				o.scripts.run("Click", adjusted);
			}
		}.bind(this), true);
		this.home.mouse.onRight.listen(function (e) {
			let adjusted = this.screenSpaceToWorldSpace(e);
			if (this.mouseEvents) for (let o of this.collidePoint(adjusted)) {
				o.response.rightClick(adjusted);
				o.scripts.run("RightClick", adjusted);
			}
		}.bind(this), true);
		this.home.mouse.onMove.listen(function (e) {
			let adjusted = this.screenSpaceToWorldSpace(e);
			if (this.mouseEvents) {
				let collided = this.collidePointBoth(adjusted);
				for (let o of collided[0]) {
					if (!o.hovered) {
						o.response.hover(adjusted);
						o.scripts.run("Hover", adjusted);
					}
					o.hovered = true;
				}
				for (let o of collided[1]) {
					o.hovered = false;
				}
			}
		}.bind(this), true);
		this.removeQueue = [];
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
	startUpdate() {
		for (let rect of this.elementArray) rect.isBeingUpdated = true;
		this.updateArray();
		let q = this.removeQueue;
		function p(x) {
			q.push(x);
		}
		for (let rect of this.elementArray) rect.pushToRemoveQueue = p;
	}
	endUpdate() {
		for (let rect of this.removeQueue) rect.home.removeElement(rect);
		this.removeQueue = [];
		for (let rect of this.elementArray) rect.isBeingUpdated = false;
	}
	engineFixedUpdate() {
		this.startUpdate();
		//custom before updates run
		for (let el of this.elementArray) {
			el.scripts.run("beforeUpdate");
		}
		this.clearAllCollisions();
		this.physicsEngine.run();
		this.physicsObjectFixedUpdate(this.elementArray);
		this.endUpdate();
	}
	handleCollisionEvent(a, b, direction) {
		let A = a.userData.sceneObject;
		let B = b.userData.sceneObject;
		if (A && B && this.collisionEvents) {
			A.colliding.add(B, Vector2.fromPhysicsVector(direction));
			B.colliding.add(A, Vector2.fromPhysicsVector(direction).inverse());
		}
	}
	constrain(a, b, ap = Vector2.origin, bp = Vector2.origin, str = "CURRENT_DIST") {
		let con = new PhysicsConstraint.Length(a.body, b.body, ap.toPhysicsVector(), bp.toPhysicsVector(), str);
		if (str === "CURRENT_DIST") {
			let ends = con.getEnds();
			con.length = Geometry.distToPoint(ends[0], ends[1]);
		}
		this.physicsEngine.addConstraint(con);
	}
	updateSceneObjectCaches(useful) {
		for (const el of useful) el.updateCaches();
	}
	physicsObjectFixedUpdate(useful) {
		for (let rect of useful) {
			rect.engineFixedUpdate();
		}
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

		if (camera !== this.camera) {
			camera.createView();
			this.c.embody(camera.newView);
		} else this.c.save();

		camera.transformToWorld(this.c);

		for (let rect of this.elementArray) {
			rect.engineDrawUpdate(screen);
			rect.lifeSpan++;
		}

		if (camera !== this.camera) {
			this.c.unembody();
			camera.view = camera.newView;
		} else this.c.restore();
		return camera.view;
	}
	engineDrawUpdate() {
		this.home.beforeScript.run();
		this.startUpdate();
		this.updateSceneObjectCaches(this.elementArray);

		this.camera.width = this.c.canvas.width;
		this.camera.height = this.c.canvas.height;
		this.home.updateScript.run();
		this.elementArray.sort(function (a, b) {
			return a.layer - b.layer;
		});
		for (let cameraName in this.cameras) this.renderCamera(this.cameras[cameraName]);
		this.renderCamera(this.camera);
		// this.c.image(this.renderCamera(this.camera)).rect(0, 0, width, height);

		this.home.afterScript.run();
		this.endUpdate();
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
	rotateCamera(theta) {
		this.camera.rotation += theta;
	}
	moveCamera(vector) {
		this.camera.middle = this.camera.middle.plus(vector);
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