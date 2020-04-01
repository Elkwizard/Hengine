class UIObject extends SceneObject {
    constructor(name, x, y, draw, home) {
        super(name, x, y, null, "UI", home);
        this.draw = draw.bind(this);
    }
    engineDrawUpdate() {
        this.home.drawInScreenSpace(this.runDraw.bind(this));
    }
    enginePhysicsUpdate() {

    }
}