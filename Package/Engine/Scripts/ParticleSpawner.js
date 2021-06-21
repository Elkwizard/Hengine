const PARTICLE_SPAWNER = new ElementScript("PARTICLE_SPAWNER", {
	init(l, properties = {}) {
		l.particles = new Set();
		l.setProperties(properties);
		const spawner = this;
		const { physicsEngine } = this.engine.scene;
		l.Particle = class Particle {
			constructor(position, others) {
				this.position = position;
				this.velocity = Vector2.origin;
				this.others = others;
				this.timer = 0;
				this.data = {};
				this.spawner = spawner;
			}
			update() {
				if (l.falls) {
					this.velocity.add(physicsEngine.gravity);
				}

				if (l.slows) {
					this.velocity.mul(1 - physicsEngine.drag);
				}

				this.position.add(this.velocity);

				l.update(this);
			}
		};
		l.toRemove = new Set();

		l.lastTransform = this.transform.get();
	},
	removeAllParticles(l) {
		l.particles.clear();
	},
	setProperties(l, p) {
		l.init = p.init ?? l.init ?? (() => null);
		l.update = p.update ?? l.update ?? (() => null);
		l.draw = p.draw ?? l.draw ?? (() => null);
		l.falls = p.falls ?? l.falls ?? false;
		l.slows = p.slows ?? l.slows ?? false;
		l.active = p.active ?? l.active ?? true;
		l.radius = p.radius ?? l.radius ?? 10;
		l.lifeSpan = p.lifeSpan ?? l.lifeSpan ?? 100;
		l.delay = p.delay ?? l.delay ?? 1;
		const imageType = p.imageType ?? FastFrame;
		if (!(l.frame instanceof imageType)) {
			l.frame = new imageType(this.engine.canvas.width, this.engine.canvas.height);
			l.gl = l.frame.renderer;
		}
	},
	explode(l, count) {
		const pos = this.transform.position;

		for (let i = 0; i < count; i++) {
			const p = new l.Particle(pos.get(), l.particles);
			l.init(p);
			l.particles.add(p);
		}
	},
	update(l) {
		if (l.active) {

			if ((l.delay > 1 && this.lifeSpan % Math.ceil(l.delay) === 0) || l.delay <= 1) {

				const pos = this.transform.position;
				const last = l.lastTransform.position;
				const count = Math.max(1, 1 / l.delay);

				for (let i = 0; i < count; i++) {
					const t = (i + 1) / count;
					const p = new l.Particle(Interpolation.lerp(last, pos, t), l.particles);
					l.init(p);
					if (!l.active) break;
					l.particles.add(p);
				}

			}
		}

		this.transform.get(l.lastTransform);
	},
	getBoundingBox(l) {
		const particlePositions = [];
		for (const particle of l.particles) particlePositions.push(particle.position);
		return Rect.bound(particlePositions);
	},
	escapeDraw(l) {
		if (this.hidden) return;
		const { gl, frame } = l;

		gl.clear();

		gl.transform = renderer.transform;

		frame.width = this.engine.canvas.width;
		frame.height = this.engine.canvas.height;

		const screen = scene.camera.screen.get();
		screen.x -= l.radius;
		screen.y -= l.radius;
		screen.width += l.radius * 2;
		screen.height += l.radius * 2;

		const timerIncrement = 1 / l.lifeSpan;

		let renderedParticles = false;

		for (const p of l.particles) {
			p.timer += timerIncrement
			if (p.timer > 1) {
				l.toRemove.add(p);
				continue;
			}

			p.update();

			if (Geometry.pointInsideRect(p.position, screen)) {
				l.draw(gl, p);
				renderedParticles = true;
			}
		}

		for (const p of l.toRemove) l.particles.delete(p);
		l.toRemove.clear();

		if (renderedParticles) this.engine.scene.camera.drawInScreenSpace(() => {
			renderer.image(frame).default(0, 0);
		});

	}
});