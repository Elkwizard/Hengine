class UIObject extends SceneObject {
    constructor(name, x, y, width, height, draw, home) {
        super(name, x, y, width, height, null, "UI", home);
        this.draw = draw.bind(this);
    }
    engineDrawUpdate() {
        this.home.drawInScreenSpace(this.runDraw.bind(this));
    }
    enginePhysicsUpdate() {

    }
}