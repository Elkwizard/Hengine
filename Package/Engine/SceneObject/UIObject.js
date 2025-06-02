/**
 * Represents a permanently screen-space object in a Scene.
 * All rendering for this class takes place in screen-space rather than world-space, and should be targeted to `ui` rather than `renderer`.
 * UIObjects are rendered after WorldObjects, regardless of `.layer` settings.
 * Culling, point-collision checks, and other related operations will all use screen-space coordinates rather than world-space.
 */
class UIObject extends SceneObject {
	static Vector = Vector2;
	
    constructor(name, pos, container, engine) {
        super(name, new Transform2D(pos), container, engine);
    }
    engineDraw() {
		this.onScreen = true;
        
		const lambda = () => {
            if (!this.hidden) this.runDraw(this.engine.ui);
            this.scripts.run("escapeDraw");
        };
		if (IS_3D) {
			lambda();
		} else {
			this.engine.scene.camera.drawInScreenSpace(lambda);
		}
    }
    collidePoint(point) {
        return super.collidePoint(point);
    }
}