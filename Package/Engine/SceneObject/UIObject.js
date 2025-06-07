/**
 * @type class UIObject extends SceneObject<Vector2, Transform2D, Rect, Circle | Polygon>
 * Represents a permanently screen-space object in a Scene.
 * All rendering for this class takes place in screen-space rather than world-space.
 * UIObjects are rendered after WorldObjects, regardless of `.layer` settings.
 * Culling, point-collision checks, and other related operations will all use screen-space coordinates rather than world-space.
 */
class UIObject extends SceneObject {
	static Vector = Vector2;
	static Box = Rect;
	
    constructor(name, pos, container, engine) {
        super(name, new Transform2D(pos), container, engine);
    }
    engineDraw() {
		this.onScreen = true;
		if (!this.hidden) this.runDraw();
		this.scripts.run("escapeDraw");
    }
    collidePoint(point) {
        return super.collidePoint(point);
    }
}