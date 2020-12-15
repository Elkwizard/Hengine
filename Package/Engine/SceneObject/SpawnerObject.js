class Directions {
	constructor(prec = 0.3) {
		this.prec = prec;
    }
    getRandomVelocity() {
        return Vector2.origin;
    }
}
class CardinalDirections extends Directions {
    constructor(up, down, left, right, prec = 0.3) {
        super(prec);
        this.up = up;
        this.down = down;
        this.left = left;
        this.right = right;
    }
    getRandomVelocity() {
        return this.fix(new Vector2(Random.range(-1, 1), Random.range(-1, 1)));
    }
	fix(v) {
        return new Vector2(this.fixH(v.x), this.fixV(v.y)).normalize();
	}
	fixH(val) {
		if (this.left && this.right) return val;
		if (this.left) return -Math.abs(val);
		if (this.right) return Math.abs(val);
		else return val * this.prec;
	}
	fixV(val) {
		if (this.up && this.down) return val;
		if (this.up) return -Math.abs(val);
		if (this.down) return Math.abs(val);
		else return val * this.prec;
	}
}
class AngleDirections extends Directions {
    constructor(angle, prec = 0.3) {
        super(prec);
        this.angle = angle;
    }
    getRandomVelocity() {
        let val = Math.random() * this.prec * 2 - this.prec;
        return Vector2.fromAngle(this.angle + val);
    }
}
class ParticleSpawnerObject extends SceneObject {
    constructor(name, x, y, size = 1, spd = 1, delay = 1, timer = 50, draw, sizeVariance = 0, speedVariance = 0, dirs = new CardinalDirections(true, true, true, true), container, engine) {
        super(name, x, y, false, "Particle-Spawner", container, engine);
        this.particleActive = true;
        this.particleFades = true;
        this.particleSlows = true;
        this.particleFalls = false;
        this.particleDelay = delay;
        this.particleInitSpeed = spd;
        this.particleLifeSpan = timer;
        this.spawns = new Map();
        this.particleSize = size;
        this.particleDraw = draw;
        this.particleSizeVariance = sizeVariance;
        this.particleShape = new Rect(-0.5, -0.5, 1, 1);
        this.particleDirections = dirs;
        this.isSpawner = true;
        this.particleSpeedVariance = speedVariance;
        this.particleNumber = 0;
        this.canCollide = false;
        this.positionStatic = false;
        this.rotationStatic = true;
        this.slows = false;
    }
    getBoundingBox() {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (let [name, spawn] of this.spawns) {
            let p = spawn.transform.position;
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
        }
        return new Rect(minX, minY, maxX - minX, maxY - minY);
    }
    engineDraw(screen) {
        this.determineOnScreen(screen);

        if (!this.hidden && this.onScreen) {
            this.engine.renderer.save();
            const currentAlpha = this.engine.renderer.alpha;
            for (let [name, spawn] of this.spawns) spawn.engineDraw(currentAlpha);
            this.engine.renderer.restore();
        }
    }
    updatePreviousData() {
        super.updatePreviousData();
        for (let [name, spawn] of this.spawns) spawn.updatePreviousData();
    }
    spawnParticle() {
        const name = `Particle #${this.particleNumber++} from ${this.name}`; 
        this.spawns.set(name, new ParticleObject(this, name, this.container, this.engine));
    }
    hasMoved() {
        return true;
    }
    engineUpdate() {
        if (this.particleActive && this.lifeSpan % Math.ceil(this.particleDelay) === 0) {
            let len = 1;
            if (this.particleDelay < 1) len = 1 / this.particleDelay;
            for (let i = 0; i < len; i++) {
                this.spawnParticle();
            }
            this.cacheBoundingBoxes();
        }
        for (let [name, spawn] of this.spawns) {
            spawn.engineUpdate();
            spawn.lifeSpan++;
        }
    }
}
class ParticleObject extends SceneObject {
    constructor(spawner, name, container, engine) {
        super(name, spawner.transform.position.x, spawner.transform.position.y, false, "Engine-Particle", container, engine);
        this.velocity = Vector2.origin;
        this.spawner = spawner;
        this.name = name;
        this.angularVelocity = 0;
        this.drawPrefix = function (currentAlpha) {
            this.engine.renderer.alpha = currentAlpha;
        };

        //Particle Init
        let sp = this.spawner;
        let pSize = sp.particleSize + ((Math.random() - Math.random()) * sp.particleSizeVariance);
        let shape = this.spawner.particleShape.scale(pSize);
        this.addShape("default", shape, true);

        let varianceVector = new Vector2(sp.particleSpeedVariance, 0);
        varianceVector.angle = Math.random() * 2 * Math.PI;
        let vel = sp.particleDirections.getRandomVelocity().times(sp.particleInitSpeed).plus(varianceVector);
        vel.rotate(sp.transform.rotation);
        this.velocity = vel;
        this.layer = sp.layer;
        
        //art
        if (sp.particleFades) {
            this.drawPrefix = function (currentAlpha) {
                this.engine.renderer.alpha = currentAlpha * Number.clamp(1 - (this.lifeSpan / sp.particleLifeSpan), 0, 1);
            };
        }
        if (sp.particleDraw instanceof ElementScript) {
            sp.particleDraw.addTo(this);
        }
        //Done

        this.completelyStatic = false;
        this.lifeSpan = 0;
    }
    set name(a) {
        if (this.spawner) {
            this.spawner.spawns.delete(this._name);
            this._name = a;
            this.spawner.spawns.set(this._name, this);
        }
    }
    get name() {
        return this._name;
    }
    remove() {
        this.scripts.run("Remove");
        this.spawner.spawns.delete(this.name);
    }
    engineDraw(currentAlpha) {
        this.drawPrefix(currentAlpha);
        this.runDraw();
        this.scripts.run("EscapeDraw");
    }
    engineUpdate() {
        this.lastTransform = this.transform.get(this.lastTransform);
        if (this.spawner.particleFalls) {
            this.velocity.y += this.engine.scene.physicsEngine.gravity.y;
        }
        if (this.spawner.particleSlows) {
            this.velocity.Nmul(this.engine.scene.physicsEngine.linearDrag);
            this.angularVelocity *= this.engine.scene.physicsEngine.linearDrag;
        }
        this.transform.position.x += this.velocity.x * 2;
        this.transform.position.y += this.velocity.y * 2;
        this.transform.rotation += this.angularVelocity;
        if (this.lifeSpan > this.spawner.particleLifeSpan) {
            this.remove();
        }
        this.scripts.run("Update");
    }
}