class Directions {
	constructor(prec = 0.3) {
		this.prec = prec;
    }
    //get particle speed
    getRandomSpeed() {
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
    getRandomSpeed() {
        return this.fix(Vector2.random());
    }
	fix(v) {
        return new Vector2(this.fixH(v.x), this.fixV(v.y));
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
        super(angle, prec);
        this.angle = angle;
    }
    getRandomSpeed(v) {
        let val = Math.random() * this.prec * 2 - this.prec;
        return Vector2.fromAngle(this.angle + val);
    }
}
class ParticleSpawnerObject extends SceneObject {
    constructor(name, x, y, size = 1, spd = 1, delay = 1, timer = 50, draw, sizeVariance = 0, speedVariance = 0, dirs = new Directions(1, 1, 1, 1), home) {
        super(name, x, y, false, "Particle-Spawner", home);
        this.active = true;
        this.particleFades = true;
        this.particleSlows = true;
        this.particleFalls = false;
        this.particleDelay = delay;
        this.particleInitSpeed = spd;
        this.particleLifeSpan = timer;
        this.spawns = {};
        this.particleSize = size;
        this.particleDraw = draw;
        this.particleSizeVariance = sizeVariance;
        this.particleShape = new Rect(-0.5, -0.5, 1, 1);
        this.dirs = dirs;
        this.isSpawner = true;
        this.particleSpeedVariance = speedVariance;
        this.particleNumber = 0;
        this.canCollide = false;
        this.positionStatic = false;
        this.rotationStatic = true;
        this.slows = false;
    }
    engineDrawUpdate() {
        for (let [name, particle] of this.spawns) {
            particle.engineDrawUpdate();
        }
    }
    spawnParticle() {
        //spawn
        let len = 1;
        if (this.particleDelay < 1) len = 1 / this.particleDelay;
        for (let i = 0; i < len; i++) {
            let name = "Particle #" + this.particleNumber++ + " from " + this.name;
            let ns = new ParticleObject(this, this.home, name);
        }
    }
    engineFixedUpdate() {
        if (this.active && this.lifeSpan % Math.ceil(this.particleDelay) === 0) {
            this.spawnParticle();
        }
        for (let [name, particle] of this.spawns) {
            particle.engineFixedUpdate();
            particle.lifeSpan++;
        }
        this.update();
    }
}
class ParticleObject extends SceneObject {
    constructor(spawner, home, name) {
        super(name, 0, 0, false, "Engine-Particle", home);

        this.cullGraphics = false;
        this.lastX = 0;
        this.lastY = 0;
        this.velocity = Vector2.origin;
        this.spawner = spawner;
        this.draw = function () { };
        this.drawPrefix = function () { };
        this.drawSuffix = function () { };
        this.particleInit();
        this.completelyStatic = false;
        this.lifeSpan = 0;
    }
    particleInit() {
        let sp = this.spawner;
        let pSize = sp.particleSize + ((Math.random() - Math.random()) * sp.particleSizeVariance);
        let sX = sp.x;
        let sY = sp.y;
        this.x = sX;
        this.y = sY;
        let shape = this.spawner.particleShape.scale(pSize);
        this.addShape("default", shape);
        this.lastX = sX;
        this.lastY = sY;

        let vel = sp.dirs.getRandomSpeed();
        vel.x = (sp.particleInitSpeed * vel.x) + ((Math.random() - Math.random()) * sp.particleSpeedVariance);
        vel.y = (sp.particleInitSpeed * vel.y) + ((Math.random() - Math.random()) * sp.particleSpeedVariance);
        this.velocity = vel;
        this.layer = sp.layer;
        
        //art
        if (sp.particleFades) {
            this.drawPrefix = function () {
                this.home.c.c.globalAlpha = Math.max(0, 1 - (this.lifeSpan / sp.particleLifeSpan));
            };
            this.drawSuffix = function () {
                this.home.c.c.globalAlpha = 1;
            };
        }
        if (sp.particleDraw instanceof Script) {
            this.draw = function () { };
            sp.particleDraw.addTo(this);
        } else {
            this.draw = sp.particleDraw.bind(this);
        }
        sp.spawns[this.name] = this;
    }
    remove() {
        delete this.spawner.spawns[this.name];
    }
    engineDrawUpdate() {
        this.drawPrefix();
        this.runDraw();
        this.drawSuffix();
        this.scripts.run("EscapeDraw");
    }
    engineFixedUpdate() {
        this.lastX = this.x;
        this.lastY = this.y;
        if (this.spawner.particleFalls) {
            this.velocity.y += this.home.gravity.y;
        }
        if (this.spawner.particleSlows) {
            this.velocity.Nmul(this.home.physicsEngine.linearDrag);
        }
        this.x += this.velocity.x * 2;
        this.y += this.velocity.y * 2;
        if (this.lifeSpan > this.spawner.particleLifeSpan) {
            this.remove();
        }
        this.scripts.run("Update");
    }
}