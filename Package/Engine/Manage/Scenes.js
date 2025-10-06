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
 * @prop PhysicsEngine physics | The physics simulation used by PHYSICS-enabled WorldObjects in the Scene
 * @prop CameraN camera | The camera used to render the scene
 * @prop Boolean mouseEvents | Whether or not mouse events will ever be checked. If this is true, specific SceneObjects can opt out, but not vice-versa
 * @prop Boolean cullGraphics | Whether or not SceneObject graphics will ever be culled. If this is true, specific SceneObjects can still opt out, but not vice-versa
 * @prop Boolean updating | Whether the scene is in the process of updating the SceneObjects
 * @prop<readonly> SceneObject[] renderOrder | A list of all of the objects most recently rendered, in the order they were rendered in. This updates prior to rendering each frame
 */
class Scene {
	constructor(engine) {
		this.engine = engine;
		this.main = new ElementContainer("Main", null, this.engine);
		
		this.physics = new PhysicsEngine();
		
		this.cullGraphics = true;
		this.mouseEvents = true;
		this.collisionEvents = true;
		this.camera = ND.Camera.forSurface(engine.canvas.renderer.imageType);
		this.updating = false;
		this.renderOrder = [];

		// backwards compatibility
		objectUtils.proxyAccess(this, this.physics, [
			"gravity", "collisionEvents",
			"constrainLength", "constrainLengthToPoint",
			"constrainPosition", "constrainPositionToPoint",
			"constraints"
		]);
	}
	/**
	 * Performs a ray-cast against some or all of the WorldObjects in the scene.
	 * If the ray-cast fails, then null is returned.
	 * Otherwise returns an object with a `.hitShape` property specifying which WorldObject was hit, and a `.hitPoint` property containing the point of intersection between the ray and the WorldObject.
	 * @param VectorN rayOrigin | The origin point of the ray
	 * @param VectorN rayDirection | The unit vector direction of the ray
	 * @param (WorldObject) => Boolean mask? | A filter for which WorldObjects should be considered in the ray-cast. Default is `(object) => true`
	 * @return { hitShape: WorldObject, hitPoint: VectorN }/null
	 */
	rayCast(ro, rd, mask = () => true) {
		const elements = this.main.sceneObjectArray;
		
		let bestDist = Infinity;
		let bestShape = null;

		for (let i = 0; i < elements.length; i++) {
			const element = elements[i];

			if (!(element instanceof WorldObject && mask(element)))
				continue;

			const shapes = element.getAllShapes();
			const localOrigin = element.transform.globalToLocal(ro);
			const localDirection = element.transform.globalDirectionToLocal(rd);
			for (let j = 0; j < shapes.length; j++) {
				const t = shapes[j].rayCast(localOrigin, localDirection, bestDist);
				if (t < bestDist) {
					bestDist = t;
					bestShape = element;
				}
			}
		}
		
		if (!isFinite(bestDist))
			return null;

		return { hitPoint: rd.times(bestDist).plus(ro), hitShape: bestShape };
	}
	/**
	 * Returns a list of all the WorldObjects that contain a specific World-Space point.
	 * @param VectorN point | The World-Space point to check
	 * @return WorldObject[]
	 */
	collidePoint(point) {
		return this.main.updateArray()
			.filter(e => e instanceof WorldObject && e.collidePoint(point));
	}
	updateCaches() {
		for (const el of this.main.sceneObjectArray) el.updateCaches();
	}
	updatePreviousData() {
		const objects = this.main.sceneObjectArray;
		for (let i = 0; i < objects.length; i++) objects[i].updatePreviousData();
	}
	render(camera) {
		camera.cacheScreen();

		this.renderOrder = [...this.main.sceneObjectArray]
			.sort((a, b) => a.layer - b.layer);

		camera.drawInWorldSpace(() => {
			for (let i = 0; i < this.renderOrder.length; i++) {
				const object = this.renderOrder[i];
				object.engineDraw(camera);
				object.lifeSpan++;
			}
		});
	}
	script(type, ...args) {
		const objects = this.main.sceneObjectArray;
		for (let i = 0; i < objects.length; i++)
			objects[i].scripts.run(type, ...args);
	}
	handleMouseEvents() {
		if (!this.mouseEvents) return;

		const { mouse } = this.engine;
		const { screen, world } = mouse;

		const hover = [];
		const unhover = [];
		for (let i = 0; i < this.main.sceneObjectArray.length; i++) {
			const object = this.main.sceneObjectArray[i];
			if (!object.mouseEvents || (object instanceof WorldObject && IS_3D)) continue;
			
			const point = object instanceof UIObject ? screen : world;
			const hovered = object.onScreen &&
							!object.hidden &&
							object.collidePoint(point);

			(hovered ? hover : unhover).push({ object, point });
		}

		const pressed = mouse.allJustPressed;
		for (let i = 0; i < hover.length; i++) {
			const { object, point } = hover[i];
			if (!object.hovered) object.scripts.run("hover", point);
			object.hovered = true;
			for (let j = 0; j < pressed.length; j++)
				object.scripts.run("click", pressed[j], point);
		}

		for (let i = 0; i < unhover.length; i++) {
			const { object, point } = unhover[i];
			if (object.hovered) object.scripts.run("unhover", point);
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
		this.camera.drawInWorldSpace(() => this.physics.run(), this.engine.renderer);
		this.script("afterPhysics");

		//draw
		this.render(this.camera);

		this.script("afterUpdate");

		this.updating = false;
	}
	end() {
		this.main.removeAllElements();
	}
}