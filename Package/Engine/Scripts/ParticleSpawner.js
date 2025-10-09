/**
 * @name class Particle
 * Every instance of PARTICLE_SPAWNER has a `.Particle` member class with an identical structure.
 * This represents a single particle in a particle system.
 * The Vector type used for `.position` and `.velocity` is of the same dimension as the particle spawner. 
 * @prop Vector position | The World-Space position of the particle
 * @prop Vector velocity | The velocity per frame of the particle
 * @prop Number timer | The proportion of the particle's lifespan that has elapsed. Setting this to 1 will remove the particle
 * @prop Object data | This object is not used by the engine, and can be modified in any way to represent particle-specific data
 * @prop PARTICLE_SPAWNER spawner | The particle system that created the particle
 */

/**
 * @name class SpawnerProperties
 * @interface
 * This is an interface for the parameters to various property-setting methods on PARTICLE_SPAWNER.
 * @prop Boolean slows? | Whether or not particles will have air resistance applied
 * @prop Boolean falls? | Whether or not particles will have gravity applied
 * @prop Boolean active? | Whether or not particles will be spawned passively over time
 * @prop Number delay? | The delay (in frames) between particle spawns. This can be less than 1
 * @prop Number lifeSpan? | The duration (in frames) of each particle's lifetime
 * @prop Number radius? | The effective radius of each particle used to compute culling. This does not affect the appearance of the particles
 * @prop Boolean cullGraphics? | Whether or not particles should be checked for visibility before rendering
 * @prop Class extends ImageType imageType? | This specifies how particles should be rendered. If this is FastFrame, they will be rendered on a separate surface and then be copied over. If this is CanvasImage, they will be rendered directly to the screen
 */

/**
 * @name init?
 * The function that is called to initialize particles.
 * @param Particle particle | The particle to initialize
 */

/**
 * @name update?
 * The function that is called to update particles each frame.
 * Since this function is not culled, all non-rendering logic should be here.
 * This property may instead be a String containing the source code for a GPUComputation that outputs a struct matching any inclusive subset of the structure of a Particle in the system. The source code also must include a `particles[]` uniform whose type is the same as the output of the computation. This uniform will reflect the state of the particles in the system.
 * If this property is set to a String, it will add a computation to the particle system that operates on every particle each frame and prevents them from being updated in any other way, including timer changes. For particles to disappear when using a custom update computation, the timer property must be manually changed by the provided `float timerIncrement` uniform.
 * Setting this property to a function will remove the computation.
 * @param Particle particle | The particle being updated
 */

/**
 * @name draw?
 * The function that is called to render particles each frame.
 * This function should minimize side effects and, if possible, should be pure.
 * @param Artist2D renderer | The renderer to draw the particle to. Its transform will be in World-Space, unless the spawner is a UIObject
 * @param Particle particle | The particle to render
 */

/**
 * Adds particle emitting functionality to a SceneObject.
 * @props<immutable>
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
 * @prop (Particle) => void particleInit | The function that is called to initialize particles. This will be passed the particle object for each particle created. Default is a no-op
 * @prop (Particle) => void particleUpdate | The function that is called to update particles each frame. This will be passed each particle object each frame. Since this function is not culled, all non-rendering logic should be here. This function will not run if the spawner has an active GPU computation. Default is a no-op.
 * @prop (Artist, Particle) => void particleDraw | The function that is called to render particles each frame. This will be passed an Artist and a particle object for each particle object on-screen each frame. Default is a no-op
 * @prop Boolean slows | Whether or not particles will have air resistance applied. Default is false
 * @prop Boolean falls | Whether or not particles will have gravity applied. Default is false
 * @prop Boolean active | Whether or not particles will be spawned passively over time. Default is true
 * @prop Number delay | The delay (in frames) between particle spawns. This can be less than 1. Default is 1
 * @prop Number lifeSpan | The duration (in frames) of each particle's lifetime. Default is 100
 * @prop Number radius | The effective radius of each particle used to compute culling. This does not affect the appearance of the particles. Default is 10
 * @prop Boolean cullGraphics | Whether particles should be checked for visibility before rendering. Default is true
 */
class PARTICLE_SPAWNER extends ElementScript {
	static images = { };
	static anyParticlesRendered = false;

	/**
	 * Makes an object a particle system.
	 * @param SpawnerProperties properties | The settings to specify on the spawner. Those not specified will retain their default values
	 */
	init(obj, properties = {}) {
		// built-in caches
		this.scene = obj.engine.scene;
		this.camera = this.scene.camera;
		this.canvas = obj.renderer.imageType;
		this.physics = this.scene.physics;
		
		// dimensionality
		this.is3d = IS_3D && !(obj instanceof UIObject);
		this.Vector = this.is3d ? Vector3 : Vector2;

		this.particles = [];
		this.setProperties(properties);
		this.Particle = class Particle {
			constructor(position, spawner) {
				this.position = position;
				this.velocity = spawner.Vector.zero;
				this.timer = 0;
				this.data = {};
				this.spawner = spawner;
			}
			update() {
				const self = this.spawner;
				if (self.falls) this.velocity.add(self.physics.gravity);
				if (self.slows) this.velocity.mul(1 - self.physics.airResistance);
				this.position.add(this.velocity);
				self.particleUpdate(this);
			}
		};

		this.anyParticlesRendered = false;
		this.accumulatedTime = 0;
	}
	/**
	 * Sets the number of particles in the system.
	 * @param Number count | The new amount of particles
	 */
	set particleCount(count) {
		if (count === this.particles.length) return;
		if (count < this.particles.length) {
			this.particles.length = count;
			if (this.computation)
				this.computation.getUniform("particles").set(this.particles);
		} else {
			this.explode(count - this.particles.length);
		}
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
	 * @param SpawnerProperties properties | A collection of new setting values. Any settings not specified will be left as they were previously
	 */
	setProperties(obj, p) {
		this.particleInit = p.init ?? this.particleInit ?? (() => null);
		this.particleDraw = p.draw ?? this.particleDraw ?? (() => null);
		this.falls = p.falls ?? this.falls ?? false;
		this.slows = p.slows ?? this.slows ?? false;
		this.active = p.active ?? this.active ?? true;
		this.radius = p.radius ?? this.radius ?? 10;
		this.lifeSpan = p.lifeSpan ?? this.lifeSpan ?? 100;
		this.delay = p.delay ?? this.delay ?? 1;
		this.cullGraphics = p.cullGraphics ?? this.cullGraphics ?? true;
		const imageType = p.imageType ?? this.frame?.constructor ?? FastFrame;
		this.separateFrame = imageType !== CanvasImage && !this.is3d;
		if (this.separateFrame) {
			this.frame = PARTICLE_SPAWNER.images[imageType.name] ??= new imageType(
				this.canvas.width, this.canvas.height,
				this.canvas.pixelRatio
			);
			this.gl = this.frame.renderer;
		} else {
			this.frame = this.canvas;
			this.gl = obj.renderer;
		}
		this.data = { ...this.data, ...p.data };
		
		if ("update" in p) {
			const { update } = p;
			if (typeof update === "function") {
				this.particleUpdate = update;
				this.computation = null;
			} else {
				this.computation = new GPUComputation(`uniform float timerIncrement;\n${update}`);
				this.computation.output = this.computation.getUniform("particles");
				this.computation.setUniform("particles", this.particles);
			}
		} else {
			this.particleUpdate ??= () => null;
		}
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
	 * @param Vector position? | The location to create the particles at. The dimension of this vector is the same as that of the spawner. Default is the location of the spawner
	 */
	explode(obj, count, position = obj.transform.position) {
		const pos = position;

		const initial = this.particles.length;

		for (let i = 0; i < count; i++)
			this.addParticle(pos.get());

		if (this.computation)
			this.computation.getUniform("particles").write(this.particles, initial);
	}
	update(obj) {
		if (this.active && isFinite(this.delay)) {
			if (this.accumulatedTime > this.delay)
				this.accumulatedTime = this.delay;
			this.accumulatedTime++;
			const count = Math.floor(this.accumulatedTime / this.delay) || 0;
			this.accumulatedTime -= count * this.delay;

			const pos = obj.transform.position;
			const last = obj.lastTransform.position;

			const initial = this.particles.length;

			for (let i = 1; i <= count; i++) {
				const t = i / count;
				this.addParticle(Interpolation.lerp(last, pos, t));
				if (!this.active) break;
			}

			if (this.computation)
				this.computation.getUniform("particles").write(this.particles, initial);
		}
		obj.transform.get(obj.lastTransform);

		const { particles } = this;
		const timerIncrement = 1 / this.lifeSpan;

		let end = particles.length - 1;
		if (this.computation)
			this.computation.setUniform("timerIncrement", timerIncrement, false);

		if (this.computation) {
			const array = this.computation.getUniform("particles");
			loop: for (let i = 0; i <= end; i++) {
				while (particles[i].timer >= 1) {
					particles[i] = particles[end--];
					array.write(particles, i, 1);
					if (i > end) continue loop;
				}
			}
		} else {
			loop: for (let i = 0; i <= end; i++) {
				while (particles[i].timer >= 1) {
					particles[i] = particles[end--];
					if (i > end) continue loop;
				}
				const p = particles[i];
				p.timer += timerIncrement;
				p.update();
			}
		}
		
		particles.length = end + 1;
		
		if (this.computation) {
			this.computation.compute(particles.length);
			this.computation.output.read(particles);
		}
	}
	/**
	 * Returns the smallest axis-aligned World-Space rectangle that contains all of the particles in the system.
	 * @return Prism/Rect
	 */
	getBoundingBox(obj) {
		const particlePositions = [];
		for (const particle of this.particles) particlePositions.push(particle.position);
		return (this.is3d ? Prism : Rect).bound(particlePositions);
	}
	escapeDraw(obj) {
		if (obj.hidden) return;

		const { gl, frame, particles, cullGraphics } = this;

		if (this.separateFrame) {
			frame.resize(this.canvas.width, this.canvas.height);
			gl.transform = obj.renderer.transform;
		}

		let bounds;
		if (obj instanceof UIObject) {
			bounds = new Rect(
				0, 0,
				this.canvas.width,
				this.canvas.height
			);
		} else {
			bounds = this.camera.screen;
		}

		const particleBall = new (this.is3d ? Sphere : Circle)(this.Vector.zero, this.radius);
		
		let anyParticlesRendered = false;

		gl.save();

		for (let i = 0; i < particles.length; i++) {
			const p = particles[i];
			
			if (cullGraphics) {
				p.position.get(particleBall.position);
				if (bounds.cullBall(particleBall)) continue;
			}
			
			this.particleDraw(gl, p);
			anyParticlesRendered = true;
		}

		gl.restore();

		PARTICLE_SPAWNER.anyParticlesRendered ||= anyParticlesRendered;

		this.anyParticlesRendered = anyParticlesRendered;

		if (PARTICLE_SPAWNER.anyParticlesRendered && this.separateFrame) {
			// is next renderable a particle spawner
			const elements = this.scene.renderOrder;
			const index = elements.indexOf(obj);
			const next = elements[index + 1];

			if (
				!next || next.hidden || !next.scripts.has(PARTICLE_SPAWNER) ||
				next.scripts.PARTICLE_SPAWNER.frame.constructor !== frame.constructor ||
				obj.renderer !== next.renderer
			) {
				obj.renderer.overlay(frame);
				gl.clear();
				PARTICLE_SPAWNER.anyParticlesRendered = false;
			}
		}
	}
}