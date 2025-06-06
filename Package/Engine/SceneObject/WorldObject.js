/**
 * @3d BoxN = Rect -> Prism
 * @3d WorldObjectBallN = Circle -> Sphere
 * @3d WorldObjectPolytopeN = Polygon -> Polyhedron
 */

/**
 * @type class WorldObject extends SceneObject<VectorN, TransformN, BoxN, WorldObjectBallN | WorldObjectPolytopeN>
 * Represents an object in a Scene that exists in the space of the world.
 * The dimensionality of this object depends on whether the engine is in 2D or 3D mode.
 * Only objects of this type can have PHYSICS, or be rendered in the space of a Camera.
 * @prop Prism/Rect/null graphicalBoundingBox | The world-space bounding box to use for graphical culling instead of the shapes of the object. Starts as null
 * @prop Boolean cullGraphics | Whether or not the graphics should ever be culled. This can be ignored if the scene has disabled graphics culling. Starts as true
 */
class WorldObject extends SceneObject {
	static Vector = ND.Vector;

	constructor(name, pos, container, engine) {
		super(name, new ND.Transform(pos), container, engine);
		this.graphicalBoundingBox = null;
		this.cullGraphics = true;
	}
	determineOnScreen(screen) {
		const graphicalBoundingBox = this.graphicalBoundingBox ?? this.__boundingBox;
		this.onScreen = !this.cullGraphics || (graphicalBoundingBox && !screen.cullBox(graphicalBoundingBox));
		return IS_3D ? true : this.onScreen;
	}
	engineDraw(camera) {
		if (
			!this.hidden &&
			this.scripts.check(true, "drawRule", camera) &&
			this.determineOnScreen(camera.screen)
		) this.runDraw();
		this.scripts.run("escapeDraw");
	}
}