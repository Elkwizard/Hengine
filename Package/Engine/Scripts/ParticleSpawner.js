/**
 * @name class Particle
 * Every instance of PARTICLE_SPAWNER has a `.Particle` member class with an identical structure.
 * This represents a single particle in a particle system.
 * @prop Vector2 position | The world-space position of the particle
 * @prop Vector2 velocity | The velocity per frame of the particle
 * @prop Number timer | The proportion of the particle's lifespan that has elapsed. Setting this to 1 will remove the particle
 * @prop Object data | This object is not used by the engine, and can be modified in any way to represent particle-specific data
 * @prop PARTICLE_SPAWNER spawner | The particle system that created the particle
 */

/**
 * Adds particle emitting functionality to a SceneObject.
 * @readonly
 * ```js
 * const particles = scene.main.addElement("particles", width / 2, height / 2);
 * particles.scripts.add(PARTICLE_SPAWNER, {
 * 	delay: 1,
 * 	lifeSpan: 100,
 * 	init(particle) {
 * 		particle.velocity = Vector2.fromAngle(Random.angle()).times(Random.range(2, 5));
 * 		particle.data.size = Random.range(2, 5);
 * 	},
 * 	draw(renderer, particle) {
 * 		renderer.draw(new Color("black")).circle(particle.position, particle.data.size);
 * 	}
 * });
 * ```
 * @prop Particle => void particleInit | The function that is called to initialize particles. This will be passed the particle object for each particle created. This uses the alternate key `properties.init` when provided in a parameter. Default is a no-op
 * @prop Particle => void particleUpdate | The function that is called to update particles each frame. This will be passed each particle object each frame. Since this function is not culled, all non-rendering logic should be here. This uses the alternate key `properties.update` when provided in a parameter. Default is a no-op
 * @prop (Artist, Particle) => void particleDraw | The function that is called to render particles each frame. This will be passed an Artist and a particle object for each particle object on-screen each frame. This uses the alternate key `properties.draw` when provided in a parameter. Default is a no-op
 * @prop Boolean slows | Whether or not particles will have air resistance applied. Default is false
 * @prop Boolean falls | Whether or not particles will have gravity applied. Default is false
 * @prop Boolean active | Whether or not particles will be spawned passively over time. Default is true
 * @prop Number delay | The delay (in frames) between particle spawns. This can be less than 1. Default is 1
 * @prop Number lifeSpan | The duration (in frames) of each particle's lifetime. Default is 100
 * @prop Number radius | The effective radius of each particle used to compute culling. This does not affect the appearance of the particles. Default is 10
 * @prop Class imageType | This specifies how particles should be rendered. If this is FastFrame, they will be rendered on a separate surface and then be copied over. If this is CanvasImage, they will be rendered directly to the screen. This is not an actual property and can only be specified as a property of a `properties` argument. Default is FastFrame
 */
class PARTICLE_SPAWNER extends ElementScript {
	/**
	 * Makes an object a particle system.
	 * @param Object properties | A collection of settings for the object. The keys of this object can be any of the properties of PARTICLE_SPAWNER. They are all optional
	 */
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
	/**
	 * Sets the number of particles in the system.
	 * @param Number count | The new amount of particles
	 */
	set particleCount(count) {
		if (count === this.particles.length) return;
		if (count < this.particles.length)
			this.particles.length = count;
		else this.explode(count - this.particles.length);
	}
	/**
	 * Returns the current number of particles in the system.
	 * @return Number
	 */
	get particleCount() {
		return this.particles.length;
	}
	/**
	 * Removes all of the particles from the system
	 */
	removeAllParticles(obj) {
		this.particles = [];
	}
	/**
	 * Sets an inclusive subset of the properties of the system.
	 * @param Object properties | A collection of new setting values. These can be any of the properties of PARTICLE_SPAWNER. They are all optional
	 */
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
		this.data = { ...this.data, ...p.data };
		this.gl = this.frame.renderer;
	}
	addParticle(obj, position) {
		const particle = new this.Particle(position, this);
		this.particleInit(particle);
		if (particle.timer >= 1) return;
		this.particles.push(particle);
	}
	/**
	 * Creates a collection of particles at once.
	 * @param Number count | The number of particles to create
	 * @param Vector2 position? | The location to create the particles at. Default is the location of the spawner
	 */
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
	/**
	 * Returns the smallest axis-aligned world-space rectangle that contains all of the particles in the system.
	 * @return Rect
	 */
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
			const index = elements.indexOf(obj);
			const next = elements[index + 1];
			if (
				next && next.scripts.has(PARTICLE_SPAWNER) &&
				next.scripts.PARTICLE_SPAWNER.frame.constructor === frame.constructor
			) return;

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