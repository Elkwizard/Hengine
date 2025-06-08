/**
 * @type class UIObject extends SceneObject<Vector2, Transform2D, Rect, Circle | Polygon>
 * Represents a permanently Screen-Space object in a Scene.
 * All rendering for this class takes place in Screen-Space rather than World-Space, and should be targeted to `ui` rather than `renderer`.
 * Culling, point-collision checks, and other related operations will all use Screen-Space coordinates rather than World-Space.
 */
class UIObject extends SceneObject {
	static Vector = Vector2;
	static Box = Rect;
	
    constructor(name, pos, container, engine) {
        super(name, new Transform2D(pos), container, engine);
		this.renderer = this.engine.ui;
    }
    engineDraw() {
		this.onScreen = true;
		if (!this.hidden) this.runDraw(this.engine.ui);
		this.scripts.run("escapeDraw");
    }
    collidePoint(point) {
        return super.collidePoint(point);
    }
}