class Directions {
	constructor(up, down, left, right, prec = 0.3) {
		this.up = up;
		this.down = down;
		this.left = left;
		this.right = right;
		this.prec = prec;
		this.angle = 0;
	}
	static fromAngle(a, prec = 0.3) {
		let dir = new Directions(0, 0, 0, 0);
        dir.angle = a;
        this.prec = prec;
		return dir;
	}
	getRandomSpeed() {
		if (this.angle) {
			let min = -this.angle - this.prec;
            let max = -this.angle + this.prec;
			let angle = Math.random() * (max - min) + min;
			let result = Vector2.fromAngle(angle);
			return result;
		} else {
			let result = Vector2.fromAngle(Math.random() * 2 * Math.PI);
			return this.fix(result);
		}
	}
	fix(v) {
		if (this.angle) {
			let va = -this.angle;
			let min = va - this.prec;
			let max = va + this.prec;
			let a = v.getAngle();
			if (a < min) a = min;
			if (a > max) a = max;
			let result = Vector2.fromAngle(a);
			result.mag = v.mag;
			return result;
		} else {
			return new Vector2(this.fixH(v.x), this.fixV(v.y));
		}
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
            this.home.addParticle(this);
        }

    }
    enginePhysicsUpdate() {
        if (this.active && this.lifeSpan % Math.ceil(this.particleDelay) === 0) {
            this.spawnParticle();
        }
        for (let [name, particle] of this.spawns) {
            particle.enginePhysicsUpdate();
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
        this.draw = e => e;
        this.drawPrefix = e => e;
        this.drawSuffix = e => e;
        this.particleInit();
        this.completelyStatic = false;
    }
    particleInit() {
        let sp = this.spawner;
        let pSize = sp.particleSize + ((Math.random() - Math.random()) * sp.particleSizeVariance);
        let sX = sp.x;
        let sY = sp.y;
        let n = this;
        this.x = sX;
        this.y = sY;
        let shape = this.spawner.particleShape.get();
        shape.scale(pSize);
        this.addShape("geo", shape);
        this.lastX = sX;
        this.lastY = sY;

        let vel = sp.dirs.getRandomSpeed();
        vel.x = (sp.particleInitSpeed * vel.x) + ((Math.random() - Math.random()) * sp.particleSpeedVariance);
        vel.y = (sp.particleInitSpeed * vel.y) + ((Math.random() - Math.random()) * sp.particleSpeedVariance);
        this.velocity = vel;
        this.layer = sp.layer;
        
        //art
        if (sp.particleFades) {
            this.drawPrefix = e => {
                this.home.c.c.globalAlpha = Math.max(0, 1 - (this.lifeSpan / sp.particleLifeSpan));
            }
            this.drawSuffix = e => {
                this.home.c.c.globalAlpha = 1;
            }
        }
        if (sp.particleDraw instanceof Script) {
            this.draw = function () { };
            sp.particleDraw.addTo(this);
        } else {
            this.draw = sp.particleDraw.bind(this);
        }
        sp.spawns[n.name] = this;
    }
    remove() {
        delete this.spawner.spawns[this.name];
    }
    engineDrawUpdate() {
        this.drawPrefix();
        this.runDraw();
        this.drawSuffix();
    }
    enginePhysicsUpdate() {
        this.lastX = this.x;
        this.lastY = this.y;
        if (this.spawner.falls) this.velocity.y += this.home.gravity.y / 4;
        if (this.spawner.particleSlows) {
            this.velocity.mul(this.home.linearDragForce)
        }
        this.x += this.velocity.x * 2;
        this.y += this.velocity.y * 2;
        if (this.lifeSpan > this.spawner.particleLifeSpan) {
            this.remove();
        }
        this.scripts.run("update");
    }
}