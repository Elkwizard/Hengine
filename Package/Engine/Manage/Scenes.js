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
			contacts = contacts.map(v => Contact.fromPhysicsContact(v));
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
	handleCollisionEvents() {
		const directions = [
			["left", "collideLeft"],
			["right", "collideRight"],
			["top", "collideTop"],
			["bottom", "collideBottom"],
			["general", "collideGeneral"],	
		];

		const objects = this.main.getElementsWithScript(PHYSICS);
		for (let i = 0; i < objects.length; i++) {
			const object = objects[i];
			const { lastColliding, colliding } = object.scripts.PHYSICS;
			for (let i = 0; i < directions.length; i++) {
				const direction = directions[i][0];
				const now = colliding[direction];
				if (now) {
					const last = new Set();
					const lastArray = lastColliding[direction];
					if (lastArray) for (let j = 0; j < lastArray.length; j++) last.add(lastArray[j].element);
					for (let j = 0; j < now.length; j++) {
						const data = now[j];
						if (!last.has(data.element)) object.scripts.run(directions[i][1], data);
					}
				}
			}
			colliding.get(lastColliding);
		}
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
		const con = new PhysicsConstraint1.Position(a.scripts.PHYSICS.body, offset.toPhysicsVector(), point ? point.toPhysicsVector() : null);
		if (point === null) con.point = con.ends[0];
		this.physicsEngine.addConstraint(con);
	}
	updateCaches() {
		for (const el of this.main.sceneObjectArray) el.updateCaches();
	}
	updatePreviousData() {
		for (const rect of this.main.sceneObjectArray) {
			rect.updatePreviousData();
		}
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
		const { mouse } = this.engine;

		const adjusted = mouse.world;
		if (mouse.justPressed(["Left", "Right", "Middle"])) {
			let key = "";
			if (mouse.justPressed("Middle")) key = "Middle";
			if (mouse.justPressed("Right")) key = "Right";
			if (mouse.justPressed("Left")) key = "Left";

			for (const o of this.collidePoint(adjusted, false).sort((a, b) => b.layer - a.layer)) {
				o.scripts.run("click", key, adjusted);
			}
		}

		const collided = this.collidePointBoth(adjusted, false);
		for (const o of collided[0].sort((a, b) => b.layer - a.layer)) {
			if (!o.hovered) o.scripts.run("hover", adjusted);
			o.hovered = true;
		}
		for (const o of collided[1].sort((a, b) => b.layer - a.layer)) {
			if (o.hovered) o.scripts.run("unhover", adjusted);
			o.hovered = false;
		}
	}
	engineUpdate() {
		if (this.mouseEvents) this.handleMouseEvents();

		this.main.startUpdate();
		this.script("beforeUpdate");

		// update
		for (const element of this.main.updateArray()) {
			element.scripts.run("update");
		}

		//physics
		this.script("beforePhysics");
		this.physicsEngine.run();
		this.script("afterPhysics");
		if (this.collisionEvents) this.handleCollisionEvents();

		//draw
		this.main.sceneObjectArray.sort((a, b) => a.layer - b.layer);
		this.renderCamera();

		this.script("afterUpdate");
		this.main.endUpdate();
	}
}