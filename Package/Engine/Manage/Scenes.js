class Scene {
	constructor(gravity, engine) {
		this.engine = engine;
		this.main = new ElementContainer("Main", true, null, this.engine);
		this.physicsEngine = new PhysicsEngine(gravity.toPhysicsVector());
		this.physicsEngine.onCollide = this.handleCollisionEvent.bind(this);
		this.cullGraphics = true;
		this.mouseEvents = false;
		this.collisionEvents = true;
		this.camera = new Camera(this.engine.renderer.width / 2, this.engine.renderer.height / 2, 0, 1, engine);
	}
	dispatchMessage(message, mask = () => true) {
		let elements = this.main.getAllElements().filter(el => mask(el));
		for (let i = 0; i < elements.length; i++) elements[i].scripts.run("Message", message);
	}
	dispatchCommand(command, mask = () => true) {
		let elements = this.main.getAllElements().filter(el => mask(el));
		for (let i = 0; i < elements.length; i++) command(elements[i]);
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
	rayCast(origin, ray, mask = () => true) {
		let shapes = this.main.updateArray().filter(el => mask(el));
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
		let options = this.main.updateArray().filter(e => e.onScreen || override);
		for (let hitbox of options) {
			let p = (hitbox instanceof UIObject) ? this.camera.worldSpaceToScreenSpace(point) : point;
			let shapes = hitbox.getConvexModels();
			let colliding = false;
			for (let shape of shapes) if (Geometry.overlapPoint(p, shape)) colliding = true;
			if (colliding) {
				collideAry.push(hitbox);
			}
		}
		return collideAry;
	}
	collidePointBoth(point, override = true) {
		let collideAry = this.collidePoint(point, override);
		return [collideAry, this.main.sceneObjectArray.filter(e => !collideAry.includes(e))];
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
			rect.lastColliding = rect.colliding.get();
		}
	}
	constrainLength(a, b, ap = Vector2.origin, bp = Vector2.origin, length = null, stiffness = 1) {
		let con = new PhysicsConstraint2.Length(a.body, b.body, ap.toPhysicsVector(), bp.toPhysicsVector(), length, stiffness);
		if (length === null) {
			let ends = con.getEnds();
			con.length = Vector2.dist(Vector2.fromPhysicsVector(ends[0]), Vector2.fromPhysicsVector(ends[1]));
		}
		this.physicsEngine.addConstraint(con);
	}
	constrainLengthToPoint(a, offset = Vector2.origin, point = null, length = null, stiffness = 1) {
		let con = new PhysicsConstraint1.Length(a.body, offset.toPhysicsVector(), point ? point.toPhysicsVector() : null, length, stiffness);
		if (point === null) con.point = con.getEnds()[0];
		if (length === null) {
			let ends = con.getEnds();
			con.length = Vector2.dist(Vector2.fromPhysicsVector(ends[0]), Vector2.fromPhysicsVector(ends[1]));
		}
		this.physicsEngine.addConstraint(con);
	}
	constrainPosition(a, b, ap = Vector2.origin, bp = Vector2.origin) {
		let con = new PhysicsConstraint2.Position(a.body, b.body, ap.toPhysicsVector(), bp.toPhysicsVector());
		this.physicsEngine.addConstraint(con);
	}
	constrainPositionToPoint(a, offset = Vector2.origin, point = null) {
		let con = new PhysicsConstraint1.Position(a.body, offset.toPhysicsVector(), point ? point.toPhysicsVector() : null);
		if (point === null) con.point = con.getEnds()[0];
		this.physicsEngine.addConstraint(con);
	}
	updateCaches() {
		for (const el of this.main.sceneObjectArray) el.updateCaches();
	}
	updatePreviousData() {
		for (let rect of this.main.sceneObjectArray) {
			rect.updatePreviousData();
		}
	}
	renderCamera() {
		let screen = this.camera.cacheScreen();

		this.engine.renderer.save();

		this.camera.transformToWorld(this.engine.renderer);
		for (let rect of this.main.sceneObjectArray) {
			rect.engineDraw(screen);
			rect.lifeSpan++;
		}

		this.engine.renderer.restore();
	}
	script(type, ...args) {
		let el = this.main.sceneObjectArray;
		for (let i = 0; i < el.length; i++) {
			el[i].scripts.run(type, ...args);
		}
	}
	engineUpdate() {
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

		this.script("BeforeUpdate");

		//draw
		this.main.sceneObjectArray.sort((a, b) => a.layer - b.layer);
		this.renderCamera();
		
		//physics
		for (let i = 0; i < this.main.sceneObjectArray.length; i++) this.main.sceneObjectArray[i].engineUpdate();
			
		let phys = this.main.getPhysicsElements();
		this.clearCollisions(phys);
		this.beforePhysicsStep(phys);
		this.physicsEngine.run();
		this.afterPhysicsStep(phys);
		if (this.collisionEvents) this.handleCollisionEvents(phys);

		this.script("AfterUpdate");

		this.main.endUpdate();
	}
}