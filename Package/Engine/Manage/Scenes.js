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
		this.home.mouse.onDown.listen(function (e) {
			let adjusted = this.camera.screenSpaceToWorldSpace(e);
			let collided = this.collidePoint(adjusted);
			if (this.mouseEvents) for (let o of collided) {
				o.response.click(adjusted);
				o.scripts.run("Click", adjusted);
			}
		}.bind(this), true);
		this.home.mouse.onRight.listen(function (e) {
			let adjusted = this.camera.screenSpaceToWorldSpace(e);
			if (this.mouseEvents) for (let o of this.collidePoint(adjusted)) {
				o.response.rightClick(adjusted);
				o.scripts.run("RightClick", adjusted);
			}
		}.bind(this), true);
		this.home.mouse.onMove.listen(function (e) {
			let adjusted = this.camera.screenSpaceToWorldSpace(e);
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
	}
	addScript(name, opts) {
		window[name] = new ElementScript(name, opts);
		return window[name];
	}
	clearAllCollisions() {
		let phys = this.main.getPhysicsElements();
		for (let i = 0; i < phys.length; i++) {
			if (!this.physicsEngine.isAsleep(phys[i].body)) phys[i].colliding.clear();
		}
	}
	collidePoint(point) {
		let collideAry = [];
		let options = this.main.updateArray().filter(e => !(e instanceof ParticleObject));
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
		return [collideAry, this.main.elementArray.filter(e => !collideAry.includes(e))];
	}
	engineFixedUpdate() {
		this.main.startUpdate();
		//custom before updates run
		for (let el of this.main.elementArray) {
			el.scripts.run("BeforeUpdate");
		}
		this.clearAllCollisions();
		this.updatePreviousData(this.main.elementArray);
		this.physicsEngine.run();
		this.physicsObjectFixedUpdate(this.main.elementArray);
		this.main.endUpdate();
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
	updatePreviousData(useful) {
		for (let rect of useful) {
			rect.updatePreviousData();
		}
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
		this.home.beforeScript.run();
		this.main.startUpdate();
		this.updateSceneObjectCaches(this.main.elementArray);

		this.camera.width = this.renderer.canvas.width;
		this.camera.height = this.renderer.canvas.height;
		this.home.updateScript.run();
		this.main.elementArray.sort(function (a, b) {
			return a.layer - b.layer;
		});
		for (let cameraName in this.cameras) this.renderCamera(this.cameras[cameraName]);
		this.renderCamera(this.camera);
		// this.c.image(this.renderCamera(this.camera)).rect(0, 0, width, height);

		this.home.afterScript.run();
		this.main.endUpdate();
	}
}