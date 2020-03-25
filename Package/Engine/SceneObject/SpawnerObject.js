class ParticleSpawnerObject extends PhysicsObject {
    constructor(name, x, y, size = 1, spd = 1, delay = 1, timer = 50, draw, sizeVariance = 0, speedVariance = 0, dirs = new Directions(1, 1, 1, 1), home) {
        super(name, x, y, 0, 0, false, false, "Particle-Spawner", home);
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

    }
    spawnParticle() {
        //spawn
        let len = 1;
        if (this.particleDelay < 1) len = 1 / this.particleDelay;
        for (let i = 0; i < len; i++) this.home.addParticle(this);

    }
    enginePhysicsUpdate() {
        if (this.active && this.lifeSpan % Math.ceil(this.particleDelay) === 0) {
            this.spawnParticle();
        }
    }
}
class ParticleObject extends PhysicsObject {
    constructor(spawner, home, name) {
        super(name, 0, 0, 0, 0, spawner.particleFalls, false, "Engine-Particle", home);
        this.spawner = spawner;
        this.draw = e => e;
        this.drawPrefix = e => e;
        this.drawSuffix = e => e;
        if (this.spawner.particleFades) {
            this.drawPrefix = e => {
                this.home.c.c.globalAlpha = Math.max(0, 1 - (this.lifeSpan / this.spawner.particleLifeSpan));
            }
            this.drawSuffix = e => {
                this.home.c.c.globalAlpha = 1;
            }
        }
        if (this.spawner.particleDraw instanceof Script) {
            this.draw = function () { };
            this.spawner.particleDraw.addTo(this);
        } else {
            this.draw = this.spawner.particleDraw.bind(this);
        }
        this.particleInit();
        this.completelyStatic = false;
    }
    particleInit() {
        let sp = this.spawner;
        let pSize = sp.particleSize + ((Math.random() - Math.random()) * sp.particleSizeVariance);
        let sX = (Math.random() * sp.width) + sp.x - pSize / 2;
        let sY = (Math.random() * sp.height) + sp.y - pSize / 2;
        let n = this;
        this.x = sX;
        this.y = sY;
        this.lastX = sX;
        this.lastY = sY;
        this.width = pSize;
        this.height = pSize;

        let speed = sp.dirs.getRandomSpeed();
        speed.x = (sp.particleInitSpeed * speed.x) + ((Math.random() - Math.random()) * sp.particleSpeedVariance);
        speed.y = (sp.particleInitSpeed * speed.y) + ((Math.random() - Math.random()) * sp.particleSpeedVariance);
        this.speed = speed;
        this.layer = sp.layer;
        sp.spawns[n.name] = this;
        let r = this.remove.bind(this);
        this.remove = function () {
            r();
            delete sp.spawns[this.name];
        }.bind(this);
    }
    engineDrawUpdate() {
        this.drawPrefix();
        this.draw();
        this.scriptDraw();
        this.drawSuffix();
    }
    enginePhysicsUpdate() {
        this.lastX = this.x;
        this.lastY = this.y;
        if (this.spawner.falls) this.accel.y = this.home.gravity.y / 4;
        this.speed.add(this.accel);
        if (this.spawner.particleSlows) {
            this.slowDown();
        }
        this.x += this.speed.x * 2;
        this.y += this.speed.y * 2;
        if (this.lifeSpan > this.spawner.particleLifeSpan) {
            this.remove();
        }
        this.direction.x = this.x - this.lastX;
        this.direction.y = this.y - this.lastY;
        this.direction.normalize();
        this.scriptUpdate();
    }
}