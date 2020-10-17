class PhysicsObject extends SceneObject {
    constructor(name, x, y, gravity, controls, tag, home, engine) {
        super(name, x, y, controls, tag, home, engine);

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
        this.lastVelocity = Vector2.origin;
        this.lastAngularVelocity = 0;

        this.optimize = other => true;
        this.hasCollideRule = false;
        //data
        this.colliding = new CollisionMonitor();
        this.lastColliding = new CollisionMonitor();

        this.shapeNameIDMap = new Map();

        //fake velocity
        let vel = this.body.velocity;
        let vec = Vector2.fromPhysicsVector(vel);
        delete vec.x;
        delete vec.y;
        Object.defineProperty(vec, "x", {
            get() {
                return vel.x;
            },
            set(a) {
                vel.x = a;
            }
        });
        Object.defineProperty(vec, "y", {
            get() {
                return vel.y;
            },
            set(a) {
                vel.y = a;
            }
        });
        this._velocity = vec;
    }
    get friction() {
        return this.body.friction;
    }
    set friction(a) {
        this.body.friction = a;
    }
    get airResistance() {
        return this.body.airResistance;
    }
    set airResistance(a) {
        this.body.airResistance = a;
    }
    get gravity() {
        return this.body.gravity;
    }
    set gravity(a) {
        this.body.gravity = a;
    }
    get mobile() {
        return this.body.type === RigidBody.DYNAMIC;
    }
    set mobile(a) {
        this.body.type = a ? RigidBody.DYNAMIC : RigidBody.STATIC;
        this.body.gravity = a;
        if (a) this.body.wake();
    }
    set snuzzlement(a) {
        this.body.restitution = 1 - a;
    }
    get snuzzlement() {
        return 1 - this.body.restitution;
    }
    set mass(a) {
        let scale = a / this.body.mass;
        this.body.mass *= scale;
        this.body.inertia *= scale;
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
        return this._velocity;
    }
    set velocity(a) {
        this._velocity.x = a.x;
        this._velocity.y = a.y;
    }
    get angularVelocity() {
        return this.body.angularVelocity;
    }
    set angularVelocity(a) {
        this.body.angularVelocity = a;
    }
    activate() {
        this.engine.scene.physicsEngine.addBody(this.body);
    }
    deactivate() {
        this.engine.scene.physicsEngine.removeBody(this.body.id);
    }
    centerModels() {
        super.centerModels();
        this.shapeSync();
    }
    shapeSync() {
        this.shapeNameIDMap.clear();
        this.body.clearShapes();
        for (let name in this.shapes) {
            let shape = this.shapes[name];
            let collider = shape.toPhysicsShape();
            let colliders = this.body.addShape(collider);
            this.shapeNameIDMap.set(name, colliders);
        }
        this.cacheDimensions();
    }
    scale(factor) {
        super.scale(factor);
        this.shapeSync();
    }
    scaleX(factor) {
        super.scaleX(factor);
        this.shapeSync();
    }
    scaleY(factor) {
        super.scaleY(factor);
        this.shapeSync();
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
        this.mobile = true;
    }
    immobilize() {
        this.mobile = false;
    }
    beforePhysicsStep() {
        this.body.position.x = this.transform.position.x;
        this.body.position.y = this.transform.position.y;
        this.body.angle = this.transform.rotation;
        this.body.invalidateModels();
    }
    afterPhysicsStep() {
        this.transform.position.x = this.body.position.x;
        this.transform.position.y = this.body.position.y;
        this.transform.rotation = this.body.angle;
        this.updateCaches();
    }
    moveTowards(point, ferocity = 1) {
        let dif = point.Vminus(this.transform.position);
        this.velocity.Vadd(dif.Ntimes(ferocity / 100));
    }
    moveAwayFrom(point, ferocity = 1) {
        let dif = this.transform.position.Vminus(point);
        this.velocity.Vadd(dif.Ntimes(ferocity / 100));
    }
    applyImpulseMass(point, force) {
        this.applyImpulse(point, force.times(this.body.mass));
    }
    applyImpulse(point, force) {
        this.body.applyImpulse(point.toPhysicsVector(), force.toPhysicsVector());
    }
}