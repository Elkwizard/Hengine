/**
 * Manages the creation, persistence, and deletion of SceneObjects in the Hengine.
 * It also manages the physics engine.
 * This class should not be constructed, and can be accessed via the `.scene` property of both the global object and Hengine.
 * ```js
 * scene.gravity = new Vector2(0, 0.1); // low gravity
 * const floor = scene.main.addPhysicsRectElement("floor", width / 2, height, width, 50);
 * 
 * const BLOCK_SIZE = 30;
 * for (let i = 0; i < 10; i++) // generate 10 slightly disorganized blocks that will fall
 * 	scene.main.addPhysicsRectElement(
 * 		"block",
 * 		width / 2 + Random.range(-10, 10),
 * 		floor.getBoundingBox().y - (i + 0.5) * BLOCK_SIZE,
 * 		BLOCK_SIZE, BLOCK_SIZE, true
 * 	);
 * ```
 * @prop ElementContainer main | The root of the element tree for the scene
 * @prop Camera camera | The camera used to render the scene
 * @prop Boolean mouseEvents | Whether or not mouse events will ever be checked. If this is true, specific SceneObjects can opt out, but not vice-versa
 * @prop Boolean cullGraphics | Whether or not SceneObject graphics will ever be culled. If this is true, specific SceneObjects can still opt out, but not vice-versa
 * @prop Boolean collisionEvents | Whether or not collision events will be detected
 * @prop Boolean updating | Whether the scene is in the process of updating the SceneObjects
 * @prop SceneObject[] renderOrder | A list of all of the objects most recently rendered, in the order they were rendered in. This updates prior to rendering each frame. This property is read-only.
 */
class Scene {
	constructor(gravity, engine) {
		this.engine = engine;
		this.main = new ElementContainer("Main", null, this.engine);
		const gravityPhysics = gravity.toPhysicsVector();
		this.physicsEngine = physics.exports.PhysicsEngine.construct(gravityPhysics).own();
		gravityPhysics.free();
		this.cullGraphics = true;
		this.mouseEvents = true;
		this.collisionEvents = true;
		this.camera = new Camera(this.engine.canvas.width / 2, this.engine.canvas.height / 2, 0, 1, engine);
		this.updating = false;
		this.renderOrder = [];
	}
	/**
	 * Sets the gravitational acceleration for the physics engine.
	 * @param Vector2 gravity | The new gravitational acceleration
	 */
	set gravity(a) {
		this.physicsEngine.gravity.set(a.x, a.y);
	}
	/**
	 * Returns the current gravitational acceleration for the physics engine.
	 * This is initially `new Vector2(0, 0.4)`.
	 * @return Vector2
	 */
	get gravity() {
		return Vector2.fromPhysicsVectorReference(this.physicsEngine.gravity);
	}
	/**
	 * Returns all the active constraints in the scene.
	 * @return Constraint[]
	 */
	get constraints() {
		const physicsConstraints = this.physicsEngine.getConstraints();
		const constraints = [];
		for (let i = 0; i < physicsConstraints.length; i++)
			constraints.push(Constraint.fromPhysicsConstraint(
				physicsConstraints.get(i), this.engine
			));

		physicsConstraints.free();
		
		return constraints;
	}
	handleCollisionEvent(a, b, direction, contacts, isTriggerA, isTriggerB) {
		if (a && b) {
			contacts = contacts.map(v => Vector2.fromPhysicsVector(v));
			direction = Vector2.fromPhysicsVector(direction);
			a.scripts.PHYSICS.colliding.add(b, direction, contacts, isTriggerB);
			b.scripts.PHYSICS.colliding.add(a, direction.inverse, contacts, isTriggerA);
		}
	}
	/**
	 * Performs a ray-cast against some or all of the SceneObjects in the scene.
	 * If the ray-cast fails, then null is returned.
	 * Otherwise returns an object with a `.hitShape` property specifying which SceneObject was hit, and a `.hitPoint` property containing the point of intersection between the ray and the SceneObject.
	 * @param Vector2 rayOrigin | The origin point of the ray
	 * @param Vector2 rayDirection | The direction of the ray
	 * @param (SceneObject) => Boolean mask? | A filter for which SceneObjects should be considered in the ray-cast. Default is `(object) => true`
	 * @return { hitShape: SceneObject, hitPoint: Vector2 }/null
	 */
	rayCast(origin, ray, mask = () => true) {
		const elements = this.main.updateArray()
			.filter(el => !(el instanceof UIObject) && mask(el));
		let bestDist = Infinity;
		let hitShape = null;
		let hit = null;
		for (let i = 0; i < elements.length; i++) {
			const element = elements[i];
			const models = element.getAllModels();
			const result = Geometry.rayCast(origin, ray, models);
			if (result) {
				const hp = result.hitPoint;
				const dist = (hp.x - origin.x) ** 2 + (hp.y - origin.y) ** 2;
				if (dist < bestDist) {
					bestDist = dist;
					hitShape = element;
					hit = hp;
				}
			}
		}
		
		if (!hit)
			return null;

		return { hitPoint: hit, hitShape };
	}
	/**
	 * Returns a list of all the SceneObjects that contain a specific point.
	 * @param Vector2 point | The world-space point to check
	 * @return SceneObject[]
	 */
	collidePoint(point, mouse = false) {
		return this.main.updateArray()
			.filter(e => (!mouse || (e.mouseEvents && e.onScreen && !e.hidden)) && e.collidePoint(point));
	}
	collidePointBoth(point, mouse = false) {
		const collideAry = this.collidePoint(point, mouse);
		const collideSet = new Set(collideAry);
		return [collideAry, this.main.sceneObjectArray.filter(e => !collideSet.has(e))];
	}
	/**
	 * Creates a physical constraint that forces the distance between two points on two objects to remain constant.
	 * @param SceneObject a | The first object to constrain. Must have the PHYSICS script
	 * @param SceneObject b | The second object to constrain. Must have the PHYSICS script
	 * @param Vector2 aOffset? | The local a-space point where the constraint will attach to the first object. Default is no offset
	 * @param Vector2 bOffset? | The local b-space point where the constraint will attach to the second object. Default is no offset
	 * @param Number length? | The distance to enforce between the two points. Default is the current distance between the constrained points
	 * @return Constraint2
	 */
	constrainLength(a, b, ap = Vector2.origin, bp = Vector2.origin, length = null) {
		const apPhysics = ap.toPhysicsVector();
		const bpPhysics = bp.toPhysicsVector();
		const con = physics.exports.LengthConstraint2.construct(
			a.scripts.PHYSICS.body, b.scripts.PHYSICS.body,
			apPhysics, bpPhysics, length
		);
		apPhysics.free();
		bpPhysics.free();
		if (length === null) {
			const { a, b } = con.as(physics.exports.Constraint);
			con.length = Vector2.dist(
				Vector2.fromPhysicsVector(a),
				Vector2.fromPhysicsVector(b)
			);
		}
		this.physicsEngine.addConstraint(con);
		return new Constraint2(con, this.engine);
	}
	/**
	 * Creates a physical constraint that forces the distance between a point on an object and a fixed point to remain constant.
	 * @param SceneObject object | The object to constrain. Must have the PHYSICS script
	 * @param Vector2 offset? | The local object-space point where the constraint will attach to the object. Default is no offset
	 * @param Vector2 point? | The location to constrain the length to. Default is the current location of the constrained point
	 * @param Number length? | The distance to enforce between the two points. Default is the current distance between the constrained points
	 * @return Constraint1
	 */
	constrainLengthToPoint(a, offset = Vector2.origin, point = null, length = null) {
		point ??= a.transform.localSpaceToGlobalSpace(offset);
		const offsetPhysics = offset.toPhysicsVector();
		const pointPhysics = point.toPhysicsVector();
		const con = physics.exports.LengthConstraint1.construct(
			a.scripts.PHYSICS.body, offsetPhysics, pointPhysics, length
		);
		offsetPhysics.free();
		pointPhysics.free();
		if (length === null) {
			const { a, b } = con.as(physics.exports.Constraint);
			con.length = Vector2.dist(
				Vector2.fromPhysicsVector(a),
				Vector2.fromPhysicsVector(b)
			);
		}
		this.physicsEngine.addConstraint(con);
		return new Constraint1(con, this.engine);
	}
	/**
	 * Creates a physical constraint that forces two points on two objects to be in the same location.
	 * @param SceneObject a | The first object to constrain. Must have the PHYSICS script
	 * @param SceneObject b | The second object to constrain. Must have the PHYSICS script
	 * @param Vector2 aOffset? | The local a-space point where the constraint will attach to the first object. Default is no offset
	 * @param Vector2 bOffset? | The local b-space point where the constraint will attach to the second object. Default is no offset
	 * @return Constraint2
	 */
	constrainPosition(a, b, ap = Vector2.origin, bp = Vector2.origin) {
		const apPhysics = ap.toPhysicsVector();
		const bpPhysics = bp.toPhysicsVector();
		const con = physics.exports.PositionConstraint2.construct(
			a.scripts.PHYSICS.body, b.scripts.PHYSICS.body,
			apPhysics,
			bpPhysics
		);
		apPhysics.free();
		bpPhysics.free();
		this.physicsEngine.addConstraint(con);
		return new Constraint2(con, this.engine);
	}
	/**
	 * Creates a physical constraint that forces the a point on an object and a fixed point to remain in the same location.
	 * @param SceneObject object | The object to constrain. Must have the PHYSICS script
	 * @param Vector2 offset? | The local object-space point where the constraint will attach to the object. Default is no offset
	 * @param Vector2 point? | The location to constrain the length to. Default is the current location of the constrained point
	 * @return Constraint1
	 */
	constrainPositionToPoint(a, offset = Vector2.origin, point = null) {
		point ??= a.transform.localSpaceToGlobalSpace(offset);
		const offsetPhysics = offset.toPhysicsVector();
		const pointPhysics = point.toPhysicsVector();
		const con = physics.exports.PositionConstraint1.construct(
			a.scripts.PHYSICS.body,
			offsetPhysics, pointPhysics
		);
		offsetPhysics.free();
		pointPhysics.free();
		this.physicsEngine.addConstraint(con);
		return new Constraint1(con, this.engine);
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

		this.renderOrder = [...this.main.sceneObjectArray]
			.sort((a, b) => a.layer - b.layer);
		
		for (let i = 0; i < this.renderOrder.length; i++) {
			const object = this.renderOrder[i];
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
		const [hover, unhover] = this.collidePointBoth(adjusted, true);

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
		this.main.updateArray();

		for (let i = 0; i < this.main.sceneObjectArray.length; i++)
			this.main.sceneObjectArray[i].runSynced();

		this.main.startUpdate();
		this.updating = true;
		
		this.handleMouseEvents();

		this.script("beforeUpdate");
		
		// update
		this.script("update");

		//physics
		this.script("beforePhysics");
		this.physicsEngine.run();
		this.script("afterPhysics");

		//draw
		this.renderCamera();

		this.script("afterUpdate");

		this.updating = false;
	}
	destroy() {
		this.main.removeAllElements();
	}
}