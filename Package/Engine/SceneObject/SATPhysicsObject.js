class PhysicsObject extends SceneObject {
    constructor(name, x, y, gravity, controls, tag, home) {
        super(name, x, y, controls, tag, home);

        this.body = new RigidBody(x, y, gravity ? RigidBody.DYNAMIC : RigidBody.STATIC);
        if (this.home.active) this.activate();
        this.body.userData.sceneObject = this;
        this.body.collisionFilter = function (body) {
            let sceneObject = body.userData.sceneObject;
            if (this.optimize(sceneObject) && sceneObject.optimize(this)) {
                if ((!this.hasCollideRule || this.collideBasedOnRule(sceneObject)) && (!sceneObject.hasCollideRule || sceneObject.collideBasedOnRule(this))) {
                    return true;
                }
            }
            return false;
        }.bind(this);

        //previous states
        this.lastRotation = 0;
        this.lastVelocity = Vector2.origin;
        this.last = this.middle;
        this.lastAngularVelocity = 0;

        this.optimize = other => true;
        this.hasCollideRule = false;
        //data
        this.colliding = new CollisionMoniter();
        this.lastColliding = new CollisionMoniter();
        this.response.collide = {
            general: function () { },
            top: function () { },
            bottom: function () { },
            left: function () { },
            right: function () { }
        };

        this.shapeNameIDMap = new Map();
    }
    get middle() {
        return new Vector2(this.x, this.y);
    }
    set middle(a) {
        this.x = a.x;
        this.y = a.y;
        this.body.position.x = a.x;
        this.body.position.y = a.y;
        this.body.__models = null;
    }
    set snuzzlement(a) {
        this.body.restitution = 1 - a;
    }
    get snuzzlement() {
        return 1 - this.body.restitution;
    }
    set rotation(a) {
        if (this.body) this.body.angle = a;
    }
    get rotation() {
        return this.body && this.body.angle;
    }
    get mass() {
        return this.body.mass;
    }
    get canCollide() {
        return !this.body.isTrigger;
    }
    set canCollide(a) {
        this.body.isTrigger = !a;
    }
    get velocity() {
        return this.body.velocity;
    }
    set velocity(a) {
        this.body.velocity = a.toPhysicsVector();
    }
    get angularVelocity() {
        return this.body.angularVelocity;
    }
    set angularVelocity(a) {
        this.body.angularVelocity = a;
    }
    activate() {
        this.home.scene.physicsEngine.addBody(this.body);
    }
    deactivate() {
        this.home.scene.physicsEngine.removeBody(this.body.id);
    }
    centerModels() {
        super.centerModels();
        this.shapeSync();
    }
    positionSync() {
        this.x = this.body.position.x;
        this.y = this.body.position.y;
        this.rotation = this.body.angle;
    }
    shapeSync() {
        this.shapeNameIDMap.clear();
        this.body.clearShapes();
        for (let name in this.shapes) {
            let shape = this.shapes[name];
            let collider;
            if (shape instanceof Polygon) collider = new PolygonCollider(shape.vertices.map(vert => vert.toPhysicsVector()));
            else collider = new CircleCollider(shape.x, shape.y, shape.radius);
            let colliders = this.body.addShape(collider);
            this.shapeNameIDMap.set(name, colliders);
        }
    }
    addShape(name, shape) {
        super.addShape(name, shape);
        this.shapeSync();
    }
    removeShape(name) {
        let shape = this.shapes[name];
        delete this.shapes[name];
        let cols = this.shapeNameIDMap.get(name);
        for (let i = 0; i < cols.length; i++) this.body.removeShape(cols[i]);
        this.shapeNameIDMap.delete(name);
        return shape;
    }
    getModels() {
        return this.body.cacheModels()
            .map(model => (model instanceof CircleModel) ? 
                new Circle(model.position.x, model.position.y, model.radius) 
                : new Polygon(model.vertices.map(vert => Vector2.fromPhysicsVector(vert))));
    }
	onAddScript(script) {
        super.onAddScript(script);
        const value = { };
        try {
            if (this.scripts[script].scriptCollideRule(value) !== value) this.hasCollideRule = true;
        } catch (err) {
            this.hasCollideRule = true;
        }
	}
    collideBasedOnRule(e) {
        let judgement = [];
        for (let m of this.scripts) {
            judgement.push(m.scriptCollideRule(m, e));
        }
        return !judgement.includes(false);
    }
    stop() {
        this.body.velocity.mul(0);
        this.body.angularVelocity = 0;
    }
    mobilize() {
        this.body.type = RigidBody.DYNAMIC;
        this.body.wake();
    }
    immobilize() {
        this.body.type = RigidBody.STATIC;
    }
    drawWithoutRotation(artist) {
        let com = this.middle;
        let rot = this.rotation;
        c.translate(com);
        c.rotate(-rot);
        c.translate(com.inverse());
        artist.bind(this)();
        c.translate(com);
        c.rotate(rot);
        c.translate(com.inverse());
    }
    engineFixedUpdate() {
        this.scripts.run("Update");
        this.update();
        this.positionSync();
    }
    updatePreviousData() {
        this.direction = this.middle.Vminus(this.last);
        this.last = this.middle;
        
        this.lastVelocity = this.velocity.get();
        this.lastAngularVelocity = this.angularVelocity;

        this.angularDirection = this.rotation - this.lastRotation; 
        this.lastRotation = this.rotation;
    }
    physicsUpdate() {
        
    }
    moveTowards(point, ferocity = 1) {
        let dif = point.Vminus(this.middle);
        this.velocity.Vadd(dif.Ntimes(ferocity / 100));
    }
    moveAwayFrom(point, ferocity = 1) {
        let dif = this.middle.Vminus(point);
        this.velocity.Vadd(dif.Ntimes(ferocity / 100));
    }
    applyImpulseMass(point, force) {
        this.applyImpulse(point, force.times(this.body.mass));
    }
    applyImpulse(point, force) {
        this.body.applyImpulse(point.toPhysicsVector(), force.toPhysicsVector());
    }
}