class UIObject extends SceneObject {
    constructor(name, x, y, home) {
        super(name, x, y, null, "UI", home);
    }
    engineDrawUpdate() {
        this.onScreen = true;
        if (!this.hidden) this.home.scene.camera.drawInScreenSpace(this.runDraw.bind(this));
		this.scripts.run("EscapeDraw");
    }
    engineFixedUpdate() {

    }
}