class PARTICLE_SPAWNER extends ElementScript {
	init(obj, properties = {}) {
		this.scene = obj.engine.scene;
		this.camera = this.scene.camera;
		this.canvas = obj.engine.canvas;
		this.renderer = this.canvas.renderer;

		this.particles = [];
		this.setProperties(properties);
		const spawner = obj;
		const { physicsEngine } = this.scene;
		const self = this;
		this.Particle = class Particle {
			constructor(position, others) {
				this.position = position;
				this.velocity = Vector2.origin;
				this.others = others;
				this.timer = 0;
				this.data = {};
				this.spawner = spawner;
			}
			update() {
				if (self.falls) this.velocity.add(physicsEngine.gravity);
				if (self.slows) this.velocity.mul(1 - physicsEngine.drag);
				this.position.add(this.velocity);
				self.particleUpdate(this);
			}
		};

		this.lastTransform = obj.transform.get();
		this.anyParticlesRendered = false;
	}
	removeAllParticles(obj) {
		this.particles = [];
	}
	setProperties(obj, p) {
		this.init = p.init ?? this.init ?? (() => null);
		this.particleUpdate = p.update ?? this.particleUpdate ?? (() => null);
		this.particleDraw = p.draw ?? this.particleDraw ?? (() => null);
		this.falls = p.falls ?? this.falls ?? false;
		this.slows = p.slows ?? this.slows ?? false;
		this.active = p.active ?? this.active ?? true;
		this.radius = p.radius ?? this.radius ?? 10;
		this.lifeSpan = p.lifeSpan ?? this.lifeSpan ?? 100;
		this.delay = p.delay ?? this.delay ?? 1;
		const imageType = p.imageType ?? FastFrame;
		this.frame = PARTICLE_SPAWNER[imageType.name] ?? (PARTICLE_SPAWNER[imageType.name] = new imageType(obj.engine.canvas.width, obj.engine.canvas.height));
		this.gl = this.frame.renderer;
	}
	explode(obj, count, position = obj.transform.position) {
		const pos = position;

		for (let i = 0; i < count; i++) {
			const p = new this.Particle(pos.get(), this.particles);
			this.init(p);
			this.particles.push(p);
		}
	}
	update(obj) {
		if (this.active) {
			if ((this.delay > 1 && obj.lifeSpan % Math.ceil(this.delay) === 0) || this.delay <= 1) {

				const pos = obj.transform.position;
				const last = this.lastTransform.position;
				const count = Math.max(1, 1 / this.delay);

				for (let i = 0; i < count; i++) {
					const t = (i + 1) / count;
					const p = new this.Particle(Interpolation.lerp(last, pos, t), this.particles);
					this.init(p);
					if (!this.active) break;
					this.particles.push(p);
				}

			}
		}
		obj.transform.get(this.lastTransform);

		const { particles } = this;
		const particlesToKeep = [];
		const timerIncrement = 1 / this.lifeSpan;

		for (let i = 0; i < particles.length; i++) {
			const p = particles[i];
			p.timer += timerIncrement;
			if (p.timer > 1) continue;
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

		const { gl, frame, particles } = this;

		gl.transform = this.renderer.transform;

		frame.width = this.canvas.width;
		frame.height = this.canvas.height;

		const screen = this.camera.screen.get();
		if (obj instanceof UIObject) screen.x = screen.y = 0;
		screen.x -= this.radius;
		screen.y -= this.radius;
		screen.width += this.radius * 2;
		screen.height += this.radius * 2;

		let anyParticlesRendered = false;

		for (let i = 0; i < particles.length; i++) {
			const p = particles[i];
			if (Geometry.pointInsideRect(p.position, screen)) {
				this.particleDraw(gl, p);
				anyParticlesRendered = true;
			}
		}

		PARTICLE_SPAWNER.anyParticlesRendered ||= anyParticlesRendered;

		this.anyParticlesRendered = anyParticlesRendered;

		if (PARTICLE_SPAWNER.anyParticlesRendered) {
			// is next renderable a particle spawner
			const elements = this.scene.main.sceneObjectArray;
			for (let i = 0; i < elements.length - 1; i++) {
				const element = elements[i];
				const next = elements[i + 1];
				if (element === obj) {
					if (next.scripts.has(PARTICLE_SPAWNER)) return;
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