class PhysicsObject extends SceneObject {
    constructor(name, x, y, gravity, controls, tag, home) {
        super(name, x, y, controls, tag, home);

        this.body = new RigidBody(x, y, gravity ? RigidBody.DYNAMIC : RigidBody.STATIC);
        this.home.physicsEngine.addBody(this.body);

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
    get mass() {
        return this.body.mass;
    }
    get canCollide() {
        return this.body.isTrigger;
    }
    set canCollide(a) {
        this.body.isTrigger = a;
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
    addShape(name, shape) {
		shape = shape.get();
        this.shapes[name] = shape;
        let collider;
        if (shape instanceof Polygon) collider = new PolygonCollider(shape.vertices.map(vert => vert.toPhysicsVector()));
        else collider = new CircleCollider(shape.x, shape.y,shape.radius);
        let colliders = this.body.addShape(collider);
        this.shapeNameIDMap.set(name, colliders);
    }
    removeShape(name) {
        let shape = this.shapes[name];
        delete this.shapes[name];
        let cols = this.shapeNameIDMap.get(name);
        for (let i = 0; i < cols.length; i++) this.body.removeShape(cols[i]);
        return shape;
    }
    getModels() {
        return this.body.getModels()
            .map(model => (model instanceof CircleCollider) ? 
                new Circle(model.position.x, model.position.y, model.radius) 
                : new Polygon(model.vertices.map(vert => Vector2.fromPhysicsVector(vert))));
    }
	onAddScript(script) {
        const value = 1;
		if (this.scripts[script].scriptCollideRule(value) !== value) this.hasCollideRule = true;
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
        this.scripts.run("update");
        this.update();
        this.x = this.body.position.x;
        this.y = this.body.position.y;
        this.rotation = this.body.angle;
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