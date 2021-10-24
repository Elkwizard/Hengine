class Scene {
	constructor(gravity, engine) {
		this.engine = engine;
		this.main = new ElementContainer("Main", true, null, this.engine);
		this.physicsEngine = new PhysicsEngine(gravity.toPhysicsVector());
		this.physicsEngine.onCollide = this.handleCollisionEvent.bind(this);
		this.cullGraphics = true;
		this.mouseEvents = true;
		this.collisionEvents = true;
		this.camera = new Camera(this.engine.canvas.width / 2, this.engine.canvas.height / 2, 0, 1, engine);
	}
	handleCollisionEvent(a, b, direction, contacts) {
		let A = a.userData.sceneObject;
		let B = b.userData.sceneObject;
		if (A && B && this.collisionEvents) {
			contacts = contacts.map(v => Vector2.fromPhysicsVector(v));
			direction = Vector2.fromPhysicsVector(direction);
			A.scripts.PHYSICS.colliding.add(B, direction, contacts);
			B.scripts.PHYSICS.colliding.add(A, direction.inverse, contacts);
		}
	}
	rayCast(origin, ray, mask = () => true) {
		let shapes = this.main.updateArray().filter(el => mask(el));
		shapes = shapes.filter(shape => !(shape instanceof UIObject));
		let bestDist = Infinity;
		let hitShape = null;
		let hit = null;
		for (const shape of shapes) {
			let models = shape.getAllModels();
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
		for (const hitbox of options) {
			let p = (hitbox instanceof UIObject) ? this.camera.worldSpaceToScreenSpace(point) : point;
			let shapes = hitbox.getAllConvexModels();
			let colliding = false;
			for (const shape of shapes) if (Geometry.overlapPoint(p, shape)) colliding = true;
			if (colliding) {
				collideAry.push(hitbox);
			}
		}
		return collideAry;
	}
	collidePointBoth(point, override = true) {
		const collideAry = this.collidePoint(point, override);
		return [collideAry, this.main.sceneObjectArray.filter(e => !collideAry.includes(e))];
	}
	constrainLength(a, b, ap = Vector2.origin, bp = Vector2.origin, length = null) {
		const con = new PhysicsConstraint2.Length(a.scripts.PHYSICS.body, b.scripts.PHYSICS.body, ap.toPhysicsVector(), bp.toPhysicsVector(), length);
		if (length === null) {
			const { ends } = con;
			con.length = Vector2.dist(Vector2.fromPhysicsVector(ends[0]), Vector2.fromPhysicsVector(ends[1]));
		}
		this.physicsEngine.addConstraint(con);
	}
	constrainLengthToPoint(a, offset = Vector2.origin, point = null, length = null) {
		const con = new PhysicsConstraint1.Length(a.scripts.PHYSICS.body, offset.toPhysicsVector(), point ? point.toPhysicsVector() : null, length);
		if (point === null) con.point = con.ends[0];
		if (length === null) {
			const { ends } = con;
			con.length = Vector2.dist(Vector2.fromPhysicsVector(ends[0]), Vector2.fromPhysicsVector(ends[1]));
		}
		this.physicsEngine.addConstraint(con);
	}
	constrainPosition(a, b, ap = Vector2.origin, bp = Vector2.origin) {
		const con = new PhysicsConstraint2.Position(a.scripts.PHYSICS.body, b.scripts.PHYSICS.body, ap.toPhysicsVector(), bp.toPhysicsVector());
		this.physicsEngine.addConstraint(con);
	}
	constrainPositionToPoint(a, offset = Vector2.origin, point = null) {
		point ??= a.transform.localSpaceToGlobalSpace(offset);
		const con = new PhysicsConstraint1.Position(a.scripts.PHYSICS.body, offset.toPhysicsVector(), point);
		this.physicsEngine.addConstraint(con);
	}
	updateCaches() {
		for (const el of this.main.sceneObjectArray) el.updateCaches();
	}
	updatePreviousData() {
		const objects = this.main.sceneObjectArray;
		for (let i = 0; i < objects.length; i++) objects[i].updatePreviousData();
	}
	renderCamera() {
		const screen = this.camera.cacheScreen();

		this.engine.renderer.save();
		this.camera.transformToWorld(this.engine.renderer);

		const objects = this.main.sceneObjectArray;
		for (let i = 0; i < objects.length; i++) {
			const object = objects[i];
			object.engineDraw(screen);
			object.lifeSpan++;
		}

		this.engine.renderer.restore();
	}
	script(type, ...args) {
		const objects = this.main.sceneObjectArray;
		for (let i = 0; i < objects.length; i++)
			objects[i].scripts.run(type, ...args);
	}
	handleMouseEvents() {
		if (!this.mouseEvents) return;

		const { mouse } = this.engine;
		const adjusted = mouse.world;
		const [hover, unhover] = this.collidePointBoth(adjusted, false);

		const pressed = mouse.allJustPressed;
		for (let i = 0; i < hover.length; i++) {
			const object = hover[i];
			if (!object.hovered) object.scripts.run("hover", adjusted);
			object.hovered = true;
			for (let j = 0; j < pressed.length; j++)
				object.scripts.run("click", pressed[j], adjusted);
		}

		for (let i = 0; i < unhover.length; i++) {
			const object = unhover[i];
			if (object.hovered) object.scripts.run("unhover", adjusted);
			object.hovered = false;
		}
	}
	engineUpdate() {
		this.handleMouseEvents();

		this.main.startUpdate();
		this.script("beforeUpdate");

		// update
		this.script("update");

		//physics
		this.script("beforePhysics");
		this.camera.drawInWorldSpace(this.physicsEngine.run.bind(this.physicsEngine));
		this.script("afterPhysics");

		//draw
		this.main.sceneObjectArray.sort((a, b) => a.layer - b.layer);
		this.renderCamera();

		this.script("afterUpdate");
		this.main.endUpdate();
	}
}