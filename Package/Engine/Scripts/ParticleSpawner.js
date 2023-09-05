class PARTICLE_SPAWNER extends ElementScript {
	init(obj, properties = {}) {
		// built-in caches
		this.scene = obj.engine.scene;
		this.camera = this.scene.camera;
		this.canvas = obj.engine.canvas;
		this.renderer = this.canvas.renderer;
		this.physicsEngine = this.scene.physicsEngine;

		this.particles = [];
		this.setProperties(properties);
		this.Particle = class Particle {
			constructor(position, spawner) {
				this.position = position;
				this.velocity = Vector2.origin;
				this.timer = 0;
				this.data = {};
				this.spawner = spawner;
			}
			update() {
				const self = this.spawner;
				if (self.falls) this.velocity.Vadd(self.physicsEngine.gravity);
				if (self.slows) this.velocity.Nmul(1 - self.physicsEngine.drag);
				this.position.Vadd(this.velocity);
				self.particleUpdate(this);
			}
		};

		this.anyParticlesRendered = false;
	}
	set particleCount(count) {
		if (count === this.particles.length) return;
		if (count < this.particles.length)
			this.particles.length = count;
		else this.explode(count - this.particles.length);
	}
	get particleCount() {
		return this.particles.length;
	}
	removeAllParticles(obj) {
		this.particles = [];
	}
	setProperties(obj, p) {
		this.particleInit = p.init ?? this.particleInit ?? (() => null);
		this.particleUpdate = p.update ?? this.particleUpdate ?? (() => null);
		this.particleDraw = p.draw ?? this.particleDraw ?? (() => null);
		this.falls = p.falls ?? this.falls ?? false;
		this.slows = p.slows ?? this.slows ?? false;
		this.active = p.active ?? this.active ?? true;
		this.radius = p.radius ?? this.radius ?? 10;
		this.lifeSpan = p.lifeSpan ?? this.lifeSpan ?? 100;
		this.delay = p.delay ?? this.delay ?? 1;
		const imageType = p.imageType ?? this.frame?.constructor ?? FastFrame;
		this.separateFrame = imageType !== CanvasImage;
		if (this.separateFrame)
			this.frame = PARTICLE_SPAWNER[imageType.name] ?? (PARTICLE_SPAWNER[imageType.name] = new imageType(obj.engine.canvas.width, obj.engine.canvas.height));
		else this.frame = this.canvas;
		this.gl = this.frame.renderer;
	}
	addParticle(obj, position) {
		const particle = new this.Particle(position, this);
		this.particleInit(particle);
		if (particle.timer >= 1) return;
		this.particles.push(particle);
	}
	explode(obj, count, position = obj.transform.position) {
		const pos = position;

		for (let i = 0; i < count; i++)
			this.addParticle(pos.get());
	}
	update(obj) {
		if (this.active) {
			if ((this.delay > 1 && obj.lifeSpan % Math.ceil(this.delay) === 0) || this.delay <= 1) {
				const pos = obj.transform.position;
				const last = obj.lastTransform.position;
				const count = Math.max(1, 1 / this.delay);

				for (let i = 0; i < count; i++) {
					const t = (i + 1) / count;
					this.addParticle(Interpolation.lerp(last, pos, t));
					if (!this.active) break;
				}
			}
		}
		obj.transform.get(obj.lastTransform);

		const { particles } = this;
		const particlesToKeep = [];
		const timerIncrement = 1 / this.lifeSpan;

		for (let i = 0; i < particles.length; i++) {
			const p = particles[i];
			if (p.timer >= 1) continue;
			p.timer += timerIncrement;
			p.update();
			particlesToKeep.push(p);
		}
		
		this.particles = particlesToKeep;
	}
	getBoundingBox(obj) {
		const particlePositions = [];
		for (const particle of this.particles) particlePositions.push(particle.position);
		return Rect.bound(particlePositions);
	}
	escapeDraw(obj) {
		if (obj.hidden) return;

		const { gl, frame, particles, radius } = this;

		if (this.separateFrame) {
			frame.resize(this.canvas.width, this.canvas.height);
			gl.transform = this.renderer.transform;
		}

		let { x, y, width, height } = this.camera.screen;
		if (obj instanceof UIObject) x = y = 0;
		x -= radius;
		y -= radius;
		width += radius * 2;
		height += radius * 2;
		const minX = x;
		const minY = y;
		const maxX = x + width;
		const maxY = y + height;

		let anyParticlesRendered = false;

		gl.save();

		for (let i = 0; i < particles.length; i++) {
			const p = particles[i];
			const { x, y } = p.position;
			if (
				x >= minX &&
				y >= minY &&
				x <= maxX &&
				y <= maxY
			) {
				this.particleDraw(gl, p);
				anyParticlesRendered = true;
			}
		}

		gl.restore();

		PARTICLE_SPAWNER.anyParticlesRendered ||= anyParticlesRendered;

		this.anyParticlesRendered = anyParticlesRendered;

		if (PARTICLE_SPAWNER.anyParticlesRendered && this.separateFrame) {
			// is next renderable a particle spawner
			const elements = this.scene.main.sceneObjectArray;
			for (let i = 0; i < elements.length - 1; i++) {
				const element = elements[i];
				const next = elements[i + 1];
				if (element === obj) {
					if (
						next.scripts.has(PARTICLE_SPAWNER) &&
						next.scripts.PARTICLE_SPAWNER.frame.constructor === frame.constructor
					) return;
					break;
				}
			}

			if (obj instanceof UIObject) this.renderer.image(frame).default(0, 0);
			else this.camera.drawInScreenSpace(() => this.renderer.image(frame).default(0, 0));
			gl.clear();
			PARTICLE_SPAWNER.anyParticlesRendered = false;
		}
	}
}
PARTICLE_SPAWNER.anyParticlesRendered = false;
PARTICLE_SPAWNER.Frame = null;
PARTICLE_SPAWNER.FastFrame = null;