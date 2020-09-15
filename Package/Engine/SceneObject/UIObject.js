class UIObject extends SceneObject {
    constructor(name, x, y, draw, home) {
        super(name, x, y, null, "UI", home);
        this.draw = draw.bind(this);
    }
    engineDrawUpdate() {
        this.onScreen = true;
        if (!this.hidden) this.home.scene.camera.drawInScreenSpace(this.runDraw.bind(this));
		this.scripts.run("EscapeDraw");
    }
    engineFixedUpdate() {

    }
}