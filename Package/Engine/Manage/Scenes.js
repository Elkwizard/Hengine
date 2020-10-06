class Scene {
	constructor(context, gravity = new Vector2(0, 0.1), home) {
		this.main = new ElementContainer("Main", true, this, null);
		this.gravity = gravity;
		this.physicsEngine = new PhysicsEngine(gravity.toPhysicsVector());
		this.physicsEngine.polygonVertexListSubdivider = physicsPolygonSubdivider;
		this.physicsEngine.oncollide = this.handleCollisionEvent.bind(this);
		this.renderer = context;
		this.home = home;
		this.cullGraphics = true;
		this.cameras = {};
		this.mouseEvents = false;
		this.collisionEvents = true;
		this.camera = new Camera(0, 0, this.renderer.width, this.renderer.height, 1, 0);
	}
	addScript(name, opts) {
		window[name] = new ElementScript(name, opts);
		return window[name];
	}
	handleCollisionEvent(a, b, direction, contacts) {
		let A = a.userData.sceneObject;
		let B = b.userData.sceneObject;
		if (A && B && this.collisionEvents) {
			contacts = contacts.map(v => Contact.fromPhysicsContact(v));
			A.colliding.add(B, Vector2.fromPhysicsVector(direction), contacts);
			B.colliding.add(A, Vector2.fromPhysicsVector(direction).inverse, contacts);
		}
	}
	clearCollisions(phys) {
		for (let rect of phys) {
			rect.colliding.removeDead();
			if (!(this.physicsEngine.isAsleep(rect.body) && rect.mobile)) rect.colliding.clear();
		}
	}
	rayCast(origin, ray, shapes = this.main.elementArray) {
		shapes = shapes.filter(shape => !(shape instanceof UIObject));
		let bestDist = Infinity;
		let hitShape = null;
		let hit = null;
		for (let shape of shapes) {
			let models = shape.getModels();
			let result = Geometry.rayCast(origin, ray, models);
			if (result.hitPoint) {
				let hp = result.hitPoint;
				let dist = (hp.x - origin.x) ** 2 + (hp.y - origin.y) ** 2;
				if (dist < bestDist) {
					bestDist = dist;
					hitShape = shape;
					hit = hp;
				}
			}
		}
		return { hitPoint: hit, hitShape };
	}
	collidePoint(point, override = true) {
		let collideAry = [];
		let options = this.main.updateArray().filter(e => !(e instanceof ParticleObject) && (e.onScreen || override));
		for (let hitbox of options) {
			let p = (hitbox instanceof UIObject) ? this.camera.worldSpaceToScreenSpace(point) : point;
			let shapes = hitbox.getModels();
			let colliding = false;
			for (let shape of shapes) if (Geometry.overlapPoint(shape, p)) colliding = true;
			if (colliding) {
				collideAry.push(hitbox);
			}
		}
		return collideAry;
	}
	collidePointBoth(point, override = true) {
		let collideAry = this.collidePoint(point, override);
		return [collideAry, this.main.elementArray.filter(e => !collideAry.includes(e))];
	}
	engineFixedUpdate() {
		this.main.startUpdate();
		//custom before updates run
		for (let el of this.main.elementArray) {
			el.scripts.run("BeforeUpdate");
		}
		let phys = this.main.getPhysicsElements();
		this.clearCollisions(phys);
		this.beforePhysicsStep(phys);
		this.physicsEngine.run();
		this.afterPhysicsStep(phys);
		if (this.collisionEvents) this.handleCollisionEvents(phys);
		this.physicsObjectFixedUpdate(this.main.elementArray);
		this.main.endUpdate();
	}
	beforePhysicsStep(phys) {
		for (let el of phys) el.beforePhysicsStep();
	}
	afterPhysicsStep(phys) {
		for (let el of phys) el.afterPhysicsStep();
	}
	handleCollisionEvents(useful) {
		const types = [
			["left", "CollideLeft", "CollideRight"], 
			["right", "CollideRight", "CollideLeft"], 
			["top", "CollideTop", "CollideBottom"], 
			["bottom", "CollideBottom", "CollideTop"], 
			["general", "CollideGeneral", "CollideGeneral"]
		];

		for (let rect of useful) {
			for (let type of types) { 
				let last = rect.lastColliding[type[0]] || [];
				let col = rect.colliding[type[0]];
				if (col) {
					last = last.map(cd => cd.element);
					for (let body of col) if (!last.includes(body.element)) {
						rect.scripts.run(type[1], body);
					}
				}
			}	
			rect.lastColliding.extract(rect.colliding);
		}
	}
	constrain(a, b, ap = Vector2.origin, bp = Vector2.origin, str = "CURRENT_DIST", stiffness = 1) {
		let con = new PhysicsConstraint.Length(a.body, b.body, ap.toPhysicsVector(), bp.toPhysicsVector(), str, stiffness);
		if (str === "CURRENT_DIST") {
			let ends = con.getEnds();
			con.length = Geometry.distToPoint(ends[0], ends[1]);
		}
		this.physicsEngine.addConstraint(con);
	}
	updateCaches() {
		for (const el of this.main.elementArray) el.updateCaches();
	}
	updatePreviousData() {
		for (let rect of this.main.elementArray) {
			rect.updatePreviousData();
		}
	}
	physicsObjectFixedUpdate(useful) {
		for (let rect of useful) {
			rect.engineFixedUpdate();
		}
	}
	addCamera(name, camera) {
		this.cameras[name] = camera;
		return this.cameras[name];
	}
	getCamera(name) {
		return this.cameras[name];
	}
	renderCamera(camera) {
		let screen = camera.getScreen();

		if (camera !== this.camera) {
			camera.createView();
			this.renderer.embody(camera.newView);
		} else this.renderer.save();

		camera.transformToWorld(this.renderer);
		for (let rect of this.main.elementArray) {
			rect.engineDrawUpdate(screen);
			rect.lifeSpan++;
		}

		if (camera !== this.camera) {
			this.renderer.unembody();
			camera.view = camera.newView;
		} else this.renderer.restore();
		return camera.view;
	}
	engineDrawUpdate() {
		if (this.mouseEvents) {
			let adjusted = mouse.world;
			if (mouse.justPressed("Left")) {
				for (let o of this.collidePoint(adjusted, false).sort((a, b) => b.layer - a.layer)) {
					o.scripts.run("Click", adjusted);
				}
			}
			if (mouse.justPressed("Right")) {
				for (let o of this.collidePoint(adjusted, false).sort((a, b) => b.layer - a.layer)) {
					o.scripts.run("RightClick", adjusted);
				}
			}
			let collided = this.collidePointBoth(adjusted, false);
			for (let o of collided[0].sort((a, b) => b.layer - a.layer)) {
				if (!o.hovered) o.scripts.run("Hover", adjusted);
				o.hovered = true;
			}
			for (let o of collided[1].sort((a, b) => b.layer - a.layer)) {
				if (o.hovered) o.scripts.run("Unhover", adjusted);
				o.hovered = false;
			}
		}
		this.main.startUpdate();
		this.camera.width = this.renderer.canvas.width;
		this.camera.height = this.renderer.canvas.height;
		this.main.elementArray.sort((a, b) => a.layer - b.layer);
		for (let cameraName in this.cameras) this.renderCamera(this.cameras[cameraName]);
		this.renderCamera(this.camera);
		// this.c.image(this.renderCamera(this.camera)).rect(0, 0, width, height);
		this.main.endUpdate();
	}
}