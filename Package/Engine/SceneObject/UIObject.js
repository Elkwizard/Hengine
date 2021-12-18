class UIObject extends SceneObject {
    constructor(name, x, y, container, engine) {
        super(name, x, y, null, "UI", container, engine);
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