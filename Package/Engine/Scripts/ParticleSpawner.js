class PARTICLE_SPAWNER extends ElementScript {
	init(obj, properties = {}) {
		this.particles = new Set();
		this.setProperties(properties);
		const spawner = obj;
		const { physicsEngine } = obj.engine.scene;
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
		this.toRemove = new Set();

		this.lastTransform = obj.transform.get();
	}
	removeAllParticles(obj) {
		this.particles.clear();
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
		if (!(this.frame instanceof imageType)) {
			this.frame = new imageType(obj.engine.canvas.width, obj.engine.canvas.height);
			this.gl = this.frame.renderer;
		}
	}
	explode(obj, count) {
		const pos = obj.transform.position;

		for (let i = 0; i < count; i++) {
			const p = new this.Particle(pos.get(), this.particles);
			this.init(p);
			this.particles.add(p);
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
					this.particles.add(p);
				}

			}
		}

		obj.transform.get(this.lastTransform);
	}
	getBoundingBox(obj) {
		const particlePositions = [];
		for (const particle of this.particles) particlePositions.push(particle.position);
		return Rect.bound(particlePositions);
	}
	escapeDraw(obj) {
		if (obj.hidden) return;
		const { gl, frame } = this;

		gl.clear();

		gl.transform = renderer.transform;

		frame.width = obj.engine.canvas.width;
		frame.height = obj.engine.canvas.height;

		const screen = scene.camera.screen.get();
		screen.x -= this.radius;
		screen.y -= this.radius;
		screen.width += this.radius * 2;
		screen.height += this.radius * 2;

		const timerIncrement = 1 / this.lifeSpan;

		let renderedParticles = false;

		for (const p of this.particles) {
			p.timer += timerIncrement
			if (p.timer > 1) {
				this.toRemove.add(p);
				continue;
			}

			p.update();

			if (Geometry.pointInsideRect(p.position, screen)) {
				this.particleDraw(gl, p);
				renderedParticles = true;
			}
		}

		for (const p of this.toRemove) this.particles.delete(p);
		this.toRemove.clear();

		if (renderedParticles) obj.engine.scene.camera.drawInScreenSpace(() => {
			renderer.image(frame).default(0, 0);
		});

	}
}