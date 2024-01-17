/**
 * Represents a permanently screen-space object in a Scene.
 * All rendering for this class takes place in screen-space rather than world-space.
 * Culling, point-collision checks, and other related operations will all use screen-space coordinates rather than world-space.
 */
class UIObject extends SceneObject {
    constructor(name, x, y, container, engine) {
        super(name, x, y, null, container, engine);
    }
    engineDraw() {
		this.onScreen = true;
        this.engine.scene.camera.drawInScreenSpace(() => {
            if (!this.hidden) this.runDraw();
            this.scripts.run("escapeDraw");
        });
    }
    collidePoint(point) {
        point = this.engine.scene.camera.worldSpaceToScreenSpace(point);
        return super.collidePoint(point);
    }
}