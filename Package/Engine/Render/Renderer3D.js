/**
 * Provides a set of methods for creating different types of lights in a 3D scene.
 * This class should not be constructed, and should be accessed via `Artist3D.prototype.light`.
 */
class LightRenderer {
	constructor(renderer) {
		this.renderer = renderer;
		this.color = null;
		this.queue = [];
	}
	get lights() {
		return this.queue;
	}
	setup(color = Color.WHITE) {
		this.color = color.get();
	}
	clear() {
		this.queue = [];
	}
	/**
	 * Queues an ambient light to be rendered.
	 * This light will affect all objects from all sides equally.
	 */
	ambient() {
		this.queue.push({
			color: this.color,
			type: LightRenderer.Types.AMBIENT
		});
	}
	/**
	 * Queues an ambient light to be rendered.
	 * This light will affect all objects outwards from a specific source.
	 * @param Vector3 position | The location of the point light
	 */
	point(position) {
		const { transform } = this.renderer;
		this.queue.push({
			color: this.color,
			type: LightRenderer.Types.POINT,
			position: transform.times(position)
		});
	}
	/**
	 * Queues a directional light to be rendered.
	 * This light emits parallel rays from an infinite distance in a given direction.
	 * @param Vector3 direction | The direction of the light
	 * @param Boolean shadow? | Whether the light casts shadows. Default is true
	 */
	directional(direction, shadow = true) {
		const { transform } = this.renderer;
		this.queue.push({
			color: this.color, shadow,
			type: LightRenderer.Types.DIRECTIONAL,
			direction: Matrix3.normal(transform).times(direction)
		});
	}
}
LightRenderer.Types = Object.fromEntries(["AMBIENT", "DIRECTIONAL", "POINT"].map((n, i) => [n, i]));

/**
 * Provides a set of methods for rendering meshes in various ways in a scene.
 * This class should not be constructed, and should be accessed via `Artist3D.prototype.mesh`.
 */
class MeshRenderer {
	constructor(renderer) {
		this.renderer = renderer;
		this.mesh = null;
		this.clear();
	}
	get meshes() {
		const result = [];
		for (const [mesh, { transforms, castShadows }] of this.queue)
			result.push({ mesh, transforms, castShadows });
		return result;
	}
	setup(mesh) {
		this.mesh = mesh;
	}
	clear() {
		this.queue = new Map();
	}
	enqueue(transform, castShadows = true) {
		const { mesh } = this;
		let meshData = this.queue.get(mesh);
		if (!meshData) {
			meshData = { transforms: [], castShadows: false };
			this.queue.set(mesh, meshData);
		}
		meshData.castShadows ||= castShadows;
		meshData.transforms.push(transform);
	}
	/**
	 * Renders the current mesh at the current transform origin.
	 * @param Boolean castShadows? | Whether the mesh should cast shadows. If the same mesh is rendered multiple times, any of them choosing to cast shadows will lead to all of them casting shadows. Default is true
	 */
	default(castShadows) {
		const matrix = this.renderer.matrix4Pool.alloc();
		this.enqueue(this.renderer.state.transform.get(matrix), castShadows);
	}
	/**
	 * Renders the current mesh at a given transform relative to the current transform.
	 * @param Matrix4 transform | The transform at which the mesh will be rendered
	 * @param Boolean castShadows? | Whether the mesh should cast shadows. If the same mesh is rendered multiple times, any of them choosing to cast shadows will lead to all of them casting shadows. Default is true
	 */
	at(transform, castShadows) {
		const matrix = this.renderer.matrix4Pool.alloc();
		this.enqueue(this.renderer.state.transform.times(transform, matrix), castShadows);
	}
	/**
	 * Renders the current mesh at a variety of different transforms relative to the current transform.
	 * @param Matrix4[] transforms | The transformations to use for each instance
	 * @param Boolean castShadows? | Whether the mesh should cast shadows. If the same mesh is rendered multiple times, any of them choosing to cast shadows will lead to all of them casting shadows. Default is true
	 */
	instance(transforms, castShadows) {
		for (const transform of transforms)
			this.at(transform, castShadows);
	}
}

class PathRenderer3D {
	static MeshCache = class MeshCache {
		constructor(polyhedron) {
			this.polyhedron = polyhedron;
			this.meshes = [];
			this.materialToIndex = new Map();
			this.clear();
		}
		getMesh(material) {
			if (!this.materialToIndex.has(material)) {
				if (this.nextIndex >= this.meshes.length) {
					this.meshes.push(Mesh.fromPolyhedron(this.polyhedron, material));	
				} else {
					this.meshes[this.nextIndex].chunks[0].material = material;
				}
				this.materialToIndex.set(material, this.nextIndex);
				this.nextIndex++;
			}
		
			return this.meshes[this.materialToIndex.get(material)];
		}
		clear() {
			this.materialToIndex.clear();
			this.nextIndex = 0;
		}
	};
	constructor(renderer) {
		this.renderer = renderer;
		this.materialCache = new Map();
		this.meshCaches = [];
	}
	setup(color) {
		this.color = color.get();
		const { hex } = color;
		if (!this.materialCache.has(hex))
			this.materialCache.set(hex, this.createMaterial(color));
		this.material = this.materialCache.get(hex);
	}
	createMeshCache(polyhedron) {
		const cache = new PathRenderer3D.MeshCache(polyhedron);
		this.meshCaches.push(cache);
		return cache;
	}
	clear() {
		this.materialCache.clear();
		for (let i = 0; i < this.meshCaches.length; i++)
			this.meshCaches[i].clear();
	}
}

/**
 * @name class StrokeRenderer3D
 * Provides a set of methods for rendering lines and outlines in various ways in three dimensions.
 * This class should not be constructed, and should be accessed via `Artist3D.prototype.stroke`.
 */
class StrokeRenderer3D extends PathRenderer3D {
	constructor(renderer) {
		super(renderer);

		this.color = null;
		this.lineRadius = null;

		this.lineMeshCache = this.createMeshCache(
			Polyhedron.fromCylinder(
				new Line3D(
					new Vector3(0, 0, 0),
					new Vector3(0, 0, 1)
				), 1
			)
		);
		this.arrowHeadMeshCache = this.createMeshCache(
			Polyhedron.fromCone(
				new Line3D(
					new Vector3(0, 0, 0),
					new Vector3(0, 0, 1)
				), 3
			)
		);

		this.clear();
	}
	createMaterial(color) {
		return new SimpleMaterial({ albedo: color });
	}
	setup(color, lineWidth = 1) {
		super.setup(color);
		this.lineRadius = lineWidth * 0.5;
	}
	/**
	 * @group line/arrow
	 * Draws a line segment, with an arrow head at the end for the `arrow` variant.
	 * @signature
	 * @param Vector3 a | The start of the line segment to draw
	 * @param Vector3 b | The end of the line segment to draw
	 * @signature
	 * @param Line3D line | The line segment to draw
	 */
	line(a, b, arrow = false) {
		if (a instanceof Line3D) ({ a, b } = a);
		
		const transform = this.renderer.matrix4Pool.alloc();
		
		const vector = b.minus(a);
		const right = vector.normal.normalize().mul(this.lineRadius);
		const up = vector.cross(right).normalize().mul(this.lineRadius);
		const forward = vector;
		
		if (arrow) {
			const arrowVector = vector.normalized.times(this.lineRadius * 8);
			transform.setAxes(right, up, arrowVector, b.minus(arrowVector));

			const arrowHeadMesh = this.arrowHeadMeshCache.getMesh(this.material);
			this.renderer.mesh(arrowHeadMesh).at(transform);
			
			// move line back to arrow start
			forward.sub(arrowVector);
		}

		transform.setAxes(right, up, forward, a);

		const lineMesh = this.lineMeshCache.getMesh(this.material);
		this.renderer.mesh(lineMesh).at(transform);

	}
	arrow(a, b) {
		if (a instanceof Line3D) ({ a, b } = a);

		this.line(a, b, true);
	}
	/**
	 * Draws a 3D wireframe of a given polyhedron
	 * @param Polyhedron polyhedron | The polyhedron to draw a 3D wireframe of
	 */
	shape(polyhedron) {
		const edges = polyhedron.getEdges();
		for (let i = 0; i < edges.length; i++)
			this.line(edges[i]);
	}
}

class StackAllocator {
	constructor(Type) {
		this.Type = Type;
		this.pointer = 0;
		this.stack = [];
		this.objects = [];
	}
	push() {
		this.stack.push(this.pointer);
	}
	pop() {
		this.pointer = this.stack.pop();
	}
	alloc() {
		return this.objects[this.pointer++] ??= new this.Type();
	}
}

class GrowableTypedArray {
	constructor(TypedArray) {
		this.TypedArray = TypedArray;
		this.array = new TypedArray(0);
	}
	getView(length) {
		if (length > this.array.length)
			this.array = new this.TypedArray(length * 2);
		return new this.TypedArray(this.array.buffer, 0, length);
	}
}

/**
 * Represents a 3D renderer for a graphical surface.
 * All transformation-related matrices for this renderer are of type Matrix4.
 */
class Artist3D extends Artist {
	/** @type {WebGL2RenderingContext} */
	gl;
	constructor(canvas, imageType) {
		super();
		this.canvas = canvas;
		this.imageType = imageType;
		this.gl = GLUtils.createContext(canvas, {
			depth: true,
			antialias: false,
			preserveDrawingBuffer: true,
			restored: () => this.compile()
		});

		this.gl.getExtension("EXT_color_buffer_float");
		this.gl.getExtension("OES_texture_float_linear");

		// GLUtils.throwErrors(this.gl);

		this.stateStack = [new Artist3D.State()];
		this.currentStateIndex = 0;
		this.lightObj = new LightRenderer(this);
		this.meshObj = new MeshRenderer(this);
		this.strokeObj = new StrokeRenderer3D(this);
		this.vector3Pool = new StackAllocator(Vector3);
		this.matrix4Pool = new StackAllocator(Matrix4);
		this.matrix4Pool.push();
		this.postProcess = {
			bloom: new Artist3D.Bloom(this, true),
			ssao: new Artist3D.SSAO(this, true),
		};
		this.screenBuffers = [];

		this.hdr = true;
		this.resultBuffer = this.createScreenBuffer({ color: true, depth: true, hdr: true });

		this.compile();
		
		this.resize(canvas.width, canvas.height);
	}
	get state() {
		return this.stateStack[this.currentStateIndex];
	}
	set transform(a) {
		this.state.transform.set(a);
	}
	get transform() {
		return this.state.transform.get();
	}
	createScreenBuffer(settings) {
		settings.hdr &&= this.hdr;
		const buffer = new Artist3D.ScreenBuffer(this.gl, settings);
		this.screenBuffers.push(buffer);
		return buffer;
	}
	createPingPong(settings) {
		return new Artist3D.PingPong(
			this.createScreenBuffer(settings),
			this.createScreenBuffer(settings)
		);
	}
	setupFramebuffer() {
		const { gl } = this;

		const width = gl.drawingBufferWidth;
		const height = gl.drawingBufferHeight;

		this.msFramebuffer = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.msFramebuffer);

		const internalFormat = this.hdr ? gl.RGBA16F : gl.RGBA8;

		const color = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, color);
		gl.renderbufferStorageMultisample(gl.RENDERBUFFER, 4, internalFormat, width, height);

		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, color);

		const depth = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
		gl.renderbufferStorageMultisample(gl.RENDERBUFFER, 4, gl.DEPTH_COMPONENT32F, width, height);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
	}
	compile() {
		const { gl } = this;
		gl.enable(gl.CULL_FACE);
		gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
		this.shadowMaps = [];
		
		this.shaderCache = new WeakMap();
		this.renderCache = new WeakMap();

		this.instanceData = new GrowableTypedArray(Float32Array);

		{ // setup 2D VAO
			this.overlayShader = this.create2DProgram(Artist3D.OVERLAY_FRAGMENT);
			this.copyShader = this.create2DProgram(Artist3D.COPY_FRAGMENT);
			
			const quadVertices = new Float32Array([
				1, -1,
				1, 1,
				-1, -1,
				-1, -1,
				1, 1,
				-1, 1
			]);

			const buffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
			gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

			this.vertexArray2D = gl.createVertexArray();
			gl.bindVertexArray(this.vertexArray2D);
			this.overlayShader.setAttributes(buffer);
			gl.bindVertexArray(null);
		}
		
		for (const key in this.postProcess)
			this.postProcess[key].compile();
		
		this.setupFramebuffer();

		for (let i = 0; i < this.screenBuffers.length; i++)
			this.screenBuffers[i].compile();
	}
	hasCache(key) {
		return this.renderCache.has(key);
	}
	getCache(key) {
		return this.renderCache.get(key);
	}
	setCache(key, value) {
		this.renderCache.set(key, value);
		key.addRenderer(this);
	}
	resize(width, height) {
		this.canvas.width = this.imageType.pixelWidth;
		this.canvas.height = this.imageType.pixelHeight;

		this.setupFramebuffer();
		
		for (let i = 0; i < this.screenBuffers.length; i++)
			this.screenBuffers[i].resize();
	}
	addTransform(transf) {
		this.state.transform.mul(transf);
	}
	getShaderProgram({
		vertexShader: vs,
		fragmentShader: fs
	}) {
		const vsCache = this.shaderCache;
		if (!vsCache.has(vs)) vsCache.set(vs, new WeakMap());

		const fsCache = vsCache.get(vs);
		if (!fsCache.has(fs)) {
			try {
				const program = new GLSLProgram(
					this.gl,
					Artist3D.vertexShader(vs),
					Artist3D.fragmentShader(fs)
				);
				fsCache.set(fs, program);
			} catch (err) {
				exit(err);
			}
		}

		return fsCache.get(fs);
	}
	create2DProgram(fragmentShader) {
		const { gl } = this;
		const program = new GLSLProgram(
			gl, Artist3D.SCREEN_VERTEX,
			Artist3D.fragmentShader2D(fragmentShader)
		);
		return program;
	}
	clearTransformations() {
		Matrix4.identity(this.state.transform);
	}
	save() {
		const { state } = this;
		this.currentStateIndex++;
		if (this.currentStateIndex >= this.stateStack.length)
			this.stateStack.push(new Artist3D.State());
		state.get(this.state);
	}
	restore() {
		if (this.currentStateIndex > 0)
			this.currentStateIndex--;
	}
	translate(x, y, z) {
		if (typeof x === "object") ({ x, y, z } = x);

		const { transform } = this.state;
		transform[12] += x * transform[0] + y * transform[4] + z * transform[8];
		transform[13] += x * transform[1] + y * transform[5] + z * transform[9];
		transform[14] += x * transform[2] + y * transform[6] + z * transform[10];
	}
	scale(...args) {
		this.addTransform(Matrix4.scale(...args));
	}
	rotate(axis, angle) {
		if (angle === undefined) {
			angle = axis.mag;
			if (angle.equals(0)) return;

			axis = axis.over(angle);
		}

		this.addTransform(new Matrix4(Quaternion.fromRotation(axis, angle).toMatrix()));
	}
	getBounds(mesh) {
		const offset = mesh.offsets.get("vertexPosition");
		const { stride, data } = mesh;
		const { length } = mesh.vertices;

		const min = Vector3.filled(Infinity);
		const max = min.inverse;
		
		for (let i = 0; i < length; i++) {
			const index = offset + i * stride;
			const x = data[index + 0];
			const y = data[index + 1];
			const z = data[index + 2];
			
			if (x < min.x) min.x = x;
			if (x > max.x) max.x = x;
			if (y < min.y) min.y = y;
			if (y > max.y) max.y = y;
			if (z < min.z) min.z = z;
			if (z > max.z) max.z = z;
		}

		return { min, max };
	}
	/**
	 * Returns an object with various methods for queueing lights to be rendered.
	 * @param Color color | The color of the light
	 * @return LightRenderer
	 */
	light(color) {
		this.lightObj.setup(color);
		return this.lightObj;
	}
	/**
	 * Returns an object with various methods for queueing meshes to be rendered.
	 * @param Mesh mesh | The mesh to be rendered
	 * @return MeshRenderer
	 */
	mesh(mesh) {
		this.meshObj.setup(mesh);
		return this.meshObj;
	}
	/**
	 * Returns an object with various methods for queueing lines and outlines to be rendered.
	 * @param Color color | The color of the lines to be drawn
	 * @param Number lineWidth? | The width of the lines to be drawn. Default is 1
	 */
	stroke(color, lineWidth) {
		this.strokeObj.setup(color, lineWidth);
		return this.strokeObj;
	}
	pass(camera, meshes, shadowPass, setupMaterial) {
		const { gl } = this;

		const transparent = [];
		const chunks = [];

		for (let i = 0; i < meshes.length; i++) {
			const mesh = meshes[i];

			if (!camera.screen.cullSphere(mesh.boundingSphere) && !(shadowPass && !mesh.castShadows)) {
				transparent.pushArray(mesh.transparent);
				chunks.pushArray(mesh.opaque);
			}
		}

		const transparentIndex = chunks.length;

		chunks.pushArray(transparent);

		gl.useProgram(null);
		gl.depthMask(true);

		for (let i = 0; i < chunks.length; i++) {
			const { chunk, mesh, transforms, uniforms } = chunks[i];

			if (!shadowPass && i === transparentIndex) {
				gl.enable(gl.BLEND);
				gl.depthMask(false);
			}

			const program = setupMaterial(chunk);
			program.setUniforms(uniforms, false, true);
			program.commitUniforms();

			const { indices } = chunk;

			if (!this.hasCache(chunk)) {
				const vertexArray = gl.createVertexArray();
				this.setCache(chunk, vertexArray);
				gl.bindVertexArray(vertexArray);
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
				gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
				const { vertexBuffer, instanceBuffer } = this.getCache(mesh);
				
				program.setDivisor("instanceTransform", 1);
				program.layoutAttributes(mesh.attributes, 0);
				program.setAttributes(vertexBuffer, 0);
				program.setAttributes(instanceBuffer, 1);
			}
			
			gl.bindVertexArray(this.getCache(chunk));

			if (transforms.length < Artist3D.INSTANCE_THRESHOLD) {
				for (let j = 0; j < transforms.length; j++) {
					program.setUniform("transform", transforms[j], false, true);
					gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_INT, 0);
				}
			} else {
				program.setUniform("transform", transforms[0], false, true);
				gl.drawElementsInstanced(gl.TRIANGLES, indices.length, gl.UNSIGNED_INT, 0, transforms.length);
			}
		}

		gl.disable(gl.BLEND);
	}
	processMesh({ mesh, transforms, castShadows }, spheres) {
		const { gl } = this;

		if (!this.hasCache(mesh)) {
			const vertexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, mesh.data, gl.STATIC_DRAW);

			const instanceBuffer = gl.createBuffer();

			const bounds = this.getBounds(mesh);
			
			const { min, max } = bounds;
			const localBoundingSphere = new Sphere(
				min.plus(max).over(2),
				max.minus(min).mag / 2
			);

			this.setCache(mesh, {
				vertexBuffer, instanceBuffer,
				bounds, localBoundingSphere
			});
		}

		const cached = this.getCache(mesh);

		if (transforms.length >= Artist3D.INSTANCE_THRESHOLD) {
			const ELEMENTS_PER_MATRIX = 4 * 3;
			const instanceView = this.instanceData.getView(transforms.length * ELEMENTS_PER_MATRIX);
			let instanceViewIndex = ELEMENTS_PER_MATRIX;

			// technically... the first transform is read from a uniform, so we can skip it
			for (let i = 1; i < transforms.length; i++) {
				const transform = transforms[i];
				for (let c = 0; c < 4; c++) {
					const columnIndex = c * 4;
					for (let r = 0; r < 3; r++) {
						instanceView[instanceViewIndex++] = transform[columnIndex + r];
					}
				}
			}

			gl.bindBuffer(gl.ARRAY_BUFFER, cached.instanceBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, instanceView, gl.DYNAMIC_DRAW);
		}

		const boundingSpheres = [];
		for (let i = 0; i < transforms.length; i++) {
			const transform = transforms[i];

			const boundingSphere = new Sphere(
				transform.times(cached.localBoundingSphere.position, this.vector3Pool.alloc()),
				transform.maxHomogenousScaleFactor * cached.localBoundingSphere.radius
			);
			
			spheres.push(boundingSphere);
			boundingSpheres.push(boundingSphere);
		}

		const boundingSphere = Sphere.composeBoundingBalls(boundingSpheres);

		const opaque = [];
		const transparent = [];

		for (let j = 0; j < mesh.chunks.length; j++) {
			const chunk = mesh.chunks[j];

			const representation = {
				mesh, chunk,
				uniforms: chunk.material.uniforms,
				transforms
			};

			if (chunk.material.transparent) {
				transparent.push(representation);
			} else {
				opaque.push(representation);
			}
		}

		return { boundingSphere, opaque, transparent, castShadows };
	}
	renderShadows(camera, meshes, lights, boundingSpheres) {
		const { gl } = this;
		const { SHADOW_RESOLUTION } = Artist3D;

		const screen = camera.cacheScreen();
		
		// process lights
		const shadowLights = [];
		for (let i = 0; i < lights.length; i++) {
			const light = lights[i];
			if (light.shadow) {
				light.shadowIndex = shadowLights.length;
				shadowLights.push(light);
			} else {
				light.shadowIndex = -1;
			}
		}

		while (this.shadowMaps.length < shadowLights.length)
			this.shadowMaps.push(new Artist3D.ShadowMap(gl));
		
		gl.enable(gl.DEPTH_TEST);
		gl.viewport(0, 0, SHADOW_RESOLUTION, SHADOW_RESOLUTION);
		gl.depthMask(true);
		
		const cascadeProps = Array.dim(Artist3D.SHADOW_CASCADE).map((_, i) => 3 ** i);
		const frusta = Geometry3D.subdivideFrustum(screen, cascadeProps);
		const shadowCascadeDepths = frusta.map(frustum => Math.max(
			...frustum.vertices.map(vertex => vertex.dot(camera.direction))
		));
		for (let i = 0; i < shadowLights.length; i++) {
			const light = shadowLights[i];
			const map = this.shadowMaps[i];
			
			let nearZ = Infinity;
			for (let j = 0; j < boundingSpheres.length; j++) {
				const sphere = boundingSpheres[j];
				const z = sphere.position.dot(light.direction) - sphere.radius;
				if (z < nearZ) nearZ = z;
			}

			for (let j = 0; j < frusta.length; j++) {
				const camera = new Camera3D({
					width: SHADOW_RESOLUTION,
					height: SHADOW_RESOLUTION
				});
				camera.direction = light.direction;

				const frustum = frusta[j];
				const frustumBounds = Prism.bound(
					frustum.vertices.map(vertex => camera.worldToScreen(vertex))
				);
				const { xRange, yRange, zRange } = Prism.fromRanges(
					frustumBounds.xRange, frustumBounds.yRange,
					new Range(nearZ, frustumBounds.max.z + 10)
				);
				const padding = Math.SQRT2 * Math.hypot(xRange.length, yRange.length) / (SHADOW_RESOLUTION - Math.SQRT2);
				xRange.expand(padding);
				yRange.expand(padding);
				zRange.expand(padding);

				camera.projection = Matrix4.orthographic(Prism.fromRanges(
					xRange, yRange, zRange
				));
				if (!camera.cacheScreen()) continue;
				
				const cascade = map.cascades[j];
				cascade.camera = camera;
				cascade.depthBias = Artist3D.SHADOW_BIAS / zRange.length;
				cascade.pixelSize = Math.SQRT2 * Math.hypot(xRange.length, yRange.length) / SHADOW_RESOLUTION;
				cascade.zRange = zRange.length;

				gl.bindFramebuffer(gl.FRAMEBUFFER, cascade.framebuffer);
				gl.clear(gl.DEPTH_BUFFER_BIT);

				this.pass(camera, meshes, true, chunk => {
					const program = this.getShaderProgram({
						vertexShader: chunk.material.vertexShader,
						fragmentShader: Artist3D.SHADOW_FRAGMENT
					});

					if (!program.inUse) {
						program.use();
						program.setUniforms({
							camera
						}, false);
					}
	
					return program;
				});
			}
		}

		return shadowCascadeDepths;
	}
	renderQueues(camera, lightQueue, meshQueue) {
		const { gl } = this;
		this.vector3Pool.push();

		const lights = lightQueue.slice(0, Artist3D.MAX_LIGHTS);

		const boundingSpheres = [];
		const meshes = meshQueue.map(req => this.processMesh(req, boundingSpheres));
		
		// shadow passes
		const shadowCascadeDepths = this.renderShadows(camera, meshes, lights, boundingSpheres);

		// main render pass
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.msFramebuffer);
		gl.enable(gl.DEPTH_TEST);

		this.maximizeViewport();
		this.pass(camera, meshes, false, chunk => {
			const program = this.getShaderProgram(chunk.material);
			if (!program.inUse) {
				program.use();
				program.setUniforms({
					camera: camera,
					lights: lightQueue,
					lightCount: lightQueue.length,
					time: intervals.frameCount,
					shadowTextures: this.shadowMaps.map(map => map.texture),
					shadowInfo: this.shadowMaps.flatMap(map => map.cascades),
					shadowCascadeDepths
				}, false);
			}

			return program;
		});
		
		// copy multisample framebuffer into post-processing buffers
		gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.msFramebuffer);
		gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.resultBuffer.framebuffer);

		gl.blitFramebuffer(
			0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight,
			0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight,
			gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT, gl.NEAREST
		);

		// post processing
		let outputBuffer = this.resultBuffer;
		for (const key in this.postProcess) {
			const effect = this.postProcess[key];
			if (effect.active)
				outputBuffer = effect.draw(outputBuffer, camera);
		}

		// composite
		{
			this.maximizeViewport();
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.disable(gl.DEPTH_TEST);
			this.drawQuad(this.copyShader, { source: outputBuffer.color });
		}

		this.vector3Pool.pop();

		gl.useProgram(null);
	}
	maximizeViewport() {
		this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
	}
	drawQuad(shader, uniforms = { }) {
		const { gl } = this;
		shader.focus();
		shader.setUniforms(uniforms);

		gl.bindVertexArray(this.vertexArray2D);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}
	overlay(overlay) {
		const { gl } = this;
		
		this.maximizeViewport();
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.msFramebuffer);
		gl.enable(gl.BLEND);
		gl.disable(gl.DEPTH_TEST);
		this.drawQuad(this.overlayShader, { overlay });
		gl.disable(gl.BLEND);
	}
	render(camera) {
		const lightQueue = this.lightObj.lights;
		const meshQueue = this.meshObj.meshes;

		if (meshQueue.length)
			this.renderQueues(camera, lightQueue, meshQueue);

		this.emptyQueues();
	}
	emptyQueues() {
		this.meshObj.clear();
		this.lightObj.clear();
		this.strokeObj.clear();
		this.matrix4Pool.pop();
		this.matrix4Pool.push();
	}
	fill({ x, y, z, w }) {
		this.emptyQueues();

		const { gl } = this;
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.msFramebuffer);
		gl.depthMask(true);
		gl.clearColor(x, y, z, w);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	}
	clear() {
		this.fill(Color.BLANK);
	}
	static vertexShader(glsl) {
		return ShaderSource.template`
			layout (location = 0) in vec3 vertexPosition;
			layout (location = 1) in vec3 vertexNormal;
			layout (location = 2) in vec2 vertexUV;
			layout (location = 3) in mat4x3 instanceTransform;

			${Artist3D.CAMERA}

			uniform mat4 transform;

			out vec2 uv;
			out vec3 position;
			out vec3 _normal;

			mat4x3 objectTransform;
			
			${glsl}

			void main() {
				objectTransform = gl_InstanceID == 0 ? mat4x3(transform) : instanceTransform;
				mat3 normalTransform = transpose(inverse(mat3(objectTransform)));
				_normal = normalTransform * vertexNormal;

				vec3 objectPosition = shader();
				position = objectPosition;
				uv = vertexUV;
				gl_Position = camera.pcMatrix * vec4(objectPosition, 1);
				gl_Position.y *= -1.0;
			}
		`;
	}
	static fragmentShader(glsl) {
		return ShaderSource.template`
			in vec3 position;
			in vec2 uv;
			in vec3 _normal;
			vec3 normal;
			
			uniform float time;
			${Artist3D.CAMERA}
			${Artist3D.LIGHTS}

			${glsl}

			out vec4 pixelColor;	

			void main() {
				normal = normalize(_normal);
				pixelColor = shader();
				pixelColor.rgb *= pixelColor.a;
			}
		`;
	}
	static fragmentShader2D(glsl) {
		return ShaderSource.template`
			in vec2 uv;

			out vec4 pixelColor;

			${glsl}

			void main() {
				pixelColor = shader();
			}
		`;
	}

	static PostProcess = class {
		constructor(artist, active) {
			this.artist = artist;
			this.active = active;
		}
		compile() { }
		draw(camera) { }
	};

	static Bloom = class extends Artist3D.PostProcess {
		constructor(...args) {
			super(...args);

			this.settings = {
				intensity: 0.3,
				steps: 8
			};
		}
		compile() {
			this.extractShader = this.artist.create2DProgram(Artist3D.Bloom.EXTRACT_FRAGMENT);
			this.downsampleShader = this.artist.create2DProgram(Artist3D.Bloom.DOWNSAMPLE_FRAGMENT);
			this.upsampleShader = this.artist.create2DProgram(Artist3D.Bloom.UPSAMPLE_FRAGMENT);
			this.pingPong = this.artist.createPingPong({ color: true, hdr: true });
		}
		draw(inputBuffer) {
			const { gl } = this.artist;

			const width = gl.drawingBufferWidth;
			const height = gl.drawingBufferHeight;

			const { steps } = this.settings;
			
			gl.disable(gl.DEPTH_TEST);

			this.pingPong.clear();
			
			// extract bright areas
			this.artist.maximizeViewport();
			this.pingPong.bind();
			this.artist.drawQuad(this.extractShader, { colorTexture: inputBuffer.color });

			const getRect = index => {
				if (!index) return new Rect(0, 0, 1, 1);
				const size = 0.5 ** index;
				const x = 0;
				const y = 1 - size * 2;
				return new Rect(
					x,
					Math.ceil(y * height) / height,
					Math.ceil(size * width) / width,
					Math.ceil(size * height) / height
				);
			};

			const viewRect = index => {
				const rect = getRect(index);
				gl.viewport(
					rect.x * width,
					rect.y * height,
					rect.width * width,
					rect.height * height
				);
			};

			// downsample & blur
			for (let i = 0; i < steps; i++) {
				const large = this.pingPong.swap().color;
				if (i === 1) this.pingPong.dst.clear();
				viewRect(i + 1);
				this.artist.drawQuad(this.downsampleShader, { large, uvBox: getRect(i) });
			}
			
			gl.enable(gl.BLEND);
			for (let i = steps - 1; i > 0; i--) {
				const small = this.pingPong.swap().color;
				viewRect(i);
				this.artist.drawQuad(this.upsampleShader, { small, uvBox: getRect(i + 1), intensity: 1 });
			}

			const bloom = this.pingPong.swap().color;
			const bloomBox = getRect(1);

			gl.depthMask(false);

			this.artist.maximizeViewport();
			inputBuffer.bind();
			this.artist.drawQuad(this.upsampleShader, {
				small: bloom, uvBox: bloomBox,
				intensity: this.settings.intensity
			});
			
			gl.depthMask(true);
			
			return inputBuffer;
		}
		static EXTRACT_FRAGMENT = new GLSL(`
			uniform sampler2D colorTexture;

			vec4 shader() {
				vec4 color = texture(colorTexture, uv);
				if (color.r >= 1.0 || color.g >= 1.0 || color.b >= 1.0)
					return color;
				return vec4(0);
			}
		`);
		static DOWNSAMPLE_FRAGMENT = new GLSL(`
			uniform sampler2D large;
			
			uniform struct {
				vec2 min, max;
			} uvBox;

			vec4 shader() {
				int S = 1;
				vec2 px = 1.0 / vec2(textureSize(large, 0));

				vec4 total = vec4(0);
				for (int i = -S; i <= S; i++)
				for (int j = -S; j <= S; j++) {
					vec2 samplePos = mix(uvBox.min, uvBox.max, uv) + px * vec2(i, j);
					total += texture(large, samplePos);
				}

				total /= pow(float(S) * 2.0 + 1.0, 2.0);

				return total;
			}
		`);
		static UPSAMPLE_FRAGMENT = new GLSL(`
			uniform sampler2D small;
			uniform float intensity;

			uniform struct {
				vec2 min, max;
			} uvBox;

			vec4 shader() {
				return texture(small, mix(uvBox.min, uvBox.max, uv)) * intensity;
			}
		`);
	}

	static SSAO = class extends Artist3D.PostProcess {
		constructor(...args) {
			super(...args);
			this.settings = {
				samples: 8,
				radius: 3,
				blurSamples: 12,
				maxBlurRadius: 20,
				minBlurRadius: 6,
				intensity: 2
			};
		}
		compile() {
			this.occlusionShader = this.artist.create2DProgram(Artist3D.SSAO.OCCLUSION_FRAGMENT);
			this.blurShader = this.artist.create2DProgram(Artist3D.SSAO.BLUR_FRAGMENT);
			this.pingPong = this.artist.createPingPong({ color: true, depth: true });
			this.outputBuffer = this.artist.createScreenBuffer({ color: true, depth: true, hdr: true });
		}
		draw(inputBuffer, camera) {
			const { gl } = this.artist;

			gl.enable(gl.DEPTH_TEST);
			gl.depthFunc(gl.ALWAYS);
			this.artist.maximizeViewport();

			{
				const { depth } = inputBuffer;
				
				// compute occlusion
				this.pingPong.bind();
				this.artist.drawQuad(this.occlusionShader, {
					depthTexture: depth,
					projection: camera.projection,
					sampleRadius: this.settings.radius,
					samples: this.settings.samples
				});
			}

			{ // blur
				const invRes = new Vector2(1 / gl.drawingBufferWidth, 1 / gl.drawingBufferHeight);
				const directions = [Vector2.right, Vector2.down];
				for (let i = 0; i < directions.length; i++) {
					const { color, depth } = this.pingPong.swap();
					
					const uniforms = {
						depthTexture: depth,
						occlusionTexture: color,
						minRadius: this.settings.minBlurRadius,
						maxRadius: this.settings.maxBlurRadius,
						samples: Math.floor(this.settings.blurSamples / 2),
						composite: i === directions.length - 1,
						projection: camera.projection,
						axis: directions[i].times(invRes)
					};

					if (uniforms.composite) {
						uniforms.colorTexture = inputBuffer.color;
						uniforms.intensity = this.settings.intensity;
						this.outputBuffer.bind();
					}
					
					this.artist.drawQuad(this.blurShader, uniforms);
				}
			}

			gl.depthFunc(gl.LEQUAL);

			return this.outputBuffer;
		}

		static LINEAR_Z = `
			uniform mat4 projection;

			float linearZ(float nlz) {
				float zScale = projection[2][2];
				float zOffset = projection[3][2];

				// nlz = (zScale * z + zOffset) / z
				float z = zOffset / (nlz - zScale);

				return z;
			}
			
			vec3 unproject(vec3 screen) {
				vec3 ndc = screen * 2.0 - 1.0;

				float w = linearZ(ndc.z) / ndc.z;
				vec4 fullNdc = vec4(ndc, 1) * w;
				vec4 unprojected = inverse(projection) * fullNdc;
				return unprojected.xyz;
			}

			vec3 project(vec3 world) {
				vec4 proj = projection * vec4(world, 1);
				vec3 ndc = proj.xyz / proj.w;
				return ndc * 0.5 + 0.5;
			}
		`;
		static OCCLUSION_FRAGMENT = new GLSL(`
			uniform sampler2D depthTexture;
			uniform float sampleRadius;
			uniform int samples;

			#define PI ${Math.PI}

			${this.LINEAR_Z}

			float random(inout float seed) {
				seed++;
				float a = mod(seed * 6.12849, 8.7890975);
				float b = mod(a * 256745.4758903, 232.567890);
				return mod(abs(a * b), 1.0);
			}

			vec3 randomInSphere(inout float seed) {
				float theta = (random(seed) - 0.5) * PI;
				float phi = random(seed) * PI * 2.0;
				float radius = random(seed);

				return vec3(
					cos(theta) * cos(phi),
					cos(theta) * sin(phi),
					sin(theta)
				) * radius;
			}

			float getVisibility(vec3 ro, vec3 rd) {
				vec3 endPosition = ro + rd * sampleRadius;
				vec3 endScreenPosition = project(endPosition);

				vec2 endUV = endScreenPosition.xy;
				if (clamp(endUV, vec2(0), vec2(1)) != endUV)
					return -1.0;

				float actualDepth = texture(depthTexture, endUV).r;
				vec3 actualEndPosition = unproject(vec3(endUV, actualDepth));

				float diff = actualEndPosition.z - endPosition.z;
				return diff > 0.0 || abs(diff) > sampleRadius * 1.2 ? 1.0 : 0.0;
			}

			vec4 shader() {				
				float depth = texture(depthTexture, uv).r;

				gl_FragDepth = depth;

				if (depth == 1.0) return vec4(0, 0, 0, 1);

				vec3 ro = unproject(vec3(uv, depth));
				
				vec3 normal = -normalize(cross(dFdx(ro), dFdy(ro)));
				
				float seed = 23.123 * cos(gl_FragCoord.x * 5.2387) + sin(gl_FragCoord.y * 30.0) + gl_FragCoord.z * 10.0;
				
				float occlusion = 0.0;
				float totalWeight = 0.0;

				for (int i = 0; i < samples; i++) {
					vec3 rd = randomInSphere(seed);
					if (dot(rd, normal) < 0.0) rd = -rd;
					float visibility = getVisibility(ro, rd);
					if (visibility >= 0.0) {
						occlusion += 1.0 - visibility;
						totalWeight++;
					}
				}

				if (totalWeight > 0.0) occlusion /= totalWeight;

				return vec4(vec3(occlusion), 1);
			}
		`);
		static BLUR_FRAGMENT = new GLSL(`
			uniform sampler2D depthTexture;
			uniform sampler2D occlusionTexture;
			uniform vec2 axis;
			uniform float minRadius;
			uniform float maxRadius;
			uniform int samples;

			uniform bool composite;
			uniform float intensity;
			uniform sampler2D colorTexture;

			${this.LINEAR_Z}

			vec4 shader() {
				float centerDepth = texture(depthTexture, uv).r;
				float centerZ = linearZ(centerDepth);

				vec3 centerPosition = unproject(vec3(uv, centerDepth));

				gl_FragDepth = centerDepth;

				float totalOcclusion = 0.0;
				float totalWeight = 0.0;

				float zNear = linearZ(-1.0);
				float zFar = linearZ(1.0);

				float z01 = (centerZ - zNear) / (zFar - zNear);

				float radius = mix(maxRadius, minRadius, z01);
				vec2 fullAxis = axis * radius;

				for (int i = -samples; i <= samples; i++) {
					float t = float(i) / float(samples);
					vec2 samplePos = uv + fullAxis * t;
					float sampleZ = linearZ(texture(depthTexture, samplePos).r);
					float zDiff = sampleZ - centerZ;

					float positionalNormalWeight = exp(-t * t);

					float zT = zDiff;
					float zNormalWeight = exp(-zT * zT);

					float weight = positionalNormalWeight * zNormalWeight;
					totalOcclusion += texture(occlusionTexture, samplePos).r * weight;
					totalWeight += weight;
				}

				float occlusion = totalOcclusion / totalWeight;

				if (composite) {
					vec4 color = texture(colorTexture, uv);
					color.rgb *= pow(1.0 - occlusion, intensity);
					return color;
				}

				return vec4(vec3(occlusion), 1.0);
			}
		`);
	};

	static State = class {
		constructor() {
			this.transform = Matrix4.identity();
		}
		get(result = new Artist3D.State()) {
			this.transform.get(result.transform);
			return result;
		}
	};
	
	static ShadowMap = class {
		constructor(gl) {
			const oldBinding = gl.getParameter(gl.TEXTURE_BINDING_2D_ARRAY);
			
			this.texture = GLUtils.createTexture(gl, {
				target: gl.TEXTURE_2D_ARRAY,
				filter: FilterMode.LINEAR
			});
			gl.texStorage3D(
				gl.TEXTURE_2D_ARRAY, 1, gl.DEPTH_COMPONENT32F,
				Artist3D.SHADOW_RESOLUTION, Artist3D.SHADOW_RESOLUTION,
				Artist3D.SHADOW_CASCADE
			);
			gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
			gl.texParameterf(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_COMPARE_FUNC, gl.GEQUAL);

			this.cascades = [];
			for (let i = 0; i < Artist3D.SHADOW_CASCADE; i++) {
				const framebuffer = gl.createFramebuffer();
				
				gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
				gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, this.texture, 0, i);

				this.cascades.push({ framebuffer });
			}
			
			gl.bindTexture(gl.TEXTURE_2D_ARRAY, oldBinding);
		}
	};

	static ScreenBuffer = class {
		constructor(gl, {
			hdr = false,
			color = true,
			depth = false
		} = { }) {
			this.gl = gl;
			this.hdr = hdr;
			this.hasColor = color;
			this.hasDepth = depth;
		}
		compile() {
			const { gl } = this;
			this.framebuffer = gl.createFramebuffer();
			this.resize();
		}
		bind() {
			const { gl } = this;
			gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
		}
		clear() {
			const { gl } = this;

			this.bind();
			let flags = 0;
			if (this.hasColor) flags |= gl.COLOR_BUFFER_BIT;
			if (this.hasDepth) flags |= gl.DEPTH_BUFFER_BIT;
			gl.clearColor(0, 0, 0, 0);
			gl.clear(flags);
		}
		resize() {
			const { gl } = this;
			const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

			this.bind();
			
			if (this.hasColor) {
				this.color = GLUtils.createTexture(gl, { filter: FilterMode.LINEAR });
				const internalFormat = this.hdr ? gl.RGBA16F : gl.RGBA8;
				const type = this.hdr ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE;
				gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, gl.RGBA, type, null);
				gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.color, 0);
			}
			
			if (this.hasDepth) {
				this.depth = GLUtils.createTexture(gl);
				gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT32F, width, height);
				gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depth, 0);
			}
		}
	};

	static PingPong = class {
		constructor(ping, pong) {
			this.buffers = [ping, pong];
			this.dstIndex = 0;
		}
		bind() {
			this.dst.bind();
		}
		swap() {
			this.dstIndex = +!this.dstIndex;
			this.bind();
			return this.src;
		}
		clear() {
			this.buffers[0].clear();
			this.buffers[1].clear();
		}
		get dst() {
			return this.buffers[this.dstIndex];
		}
		get src() {
			return this.buffers[+!this.dstIndex];
		}
	};

	static MAX_LIGHTS = 50;
	static MAX_SHADOWS = 8;
	static SHADOW_RESOLUTION = 2 ** 12;
	static SHADOW_BIAS = 0.5;
	static SHADOW_CASCADE = 4;
	static INSTANCE_THRESHOLD = 10;
}
Artist3D.CAMERA = `
	struct Camera {
		vec3 position;
		vec3 direction;
		vec3 right;
		vec3 up;
		mat4 pcMatrix;
		mat4 projection;
		mat4 inverse;
	};

	uniform Camera camera;
`;
Artist3D.LIGHTS = `
	struct Light {
		vec3 position;
		vec3 direction;
		vec3 color;
		int type;
		int shadowIndex;
	};

	${Object.entries(LightRenderer.Types).map(([n, i]) => `#define ${n} ${i}`).join("\n")}
	#define MAX_LIGHTS ${Artist3D.MAX_LIGHTS}
	#define MAX_SHADOWS ${Artist3D.MAX_SHADOWS}
	#define SHADOW_CASCADE ${Artist3D.SHADOW_CASCADE}
	#define SHADOW_RESOLUTION ${Artist3D.SHADOW_RESOLUTION}

	uniform int lightCount;
	uniform Light[MAX_LIGHTS] lights;
	uniform float[${Artist3D.SHADOW_CASCADE}] shadowCascadeDepths;

	vec3 getLightColor(vec3 position, Light light) {
		if (light.type == POINT) {
			float len = distance(position, light.position);
			return light.color / (len * len);
		}
		
		return light.color;
	}

	vec3 getLightDirection(vec3 position, Light light) {
		if (light.type == POINT) {
			return normalize(position - light.position);
		}
		return light.direction;
	}

	struct ShadowCamera {
		mat4 projection;
		mat4 pcMatrix;
	};
	struct ShadowInfo {
		ShadowCamera camera;	
		float depthBias;
		float pixelSize;
		float zRange;
	};
	uniform ShadowInfo[MAX_SHADOWS * SHADOW_CASCADE] shadowInfo;
	uniform highp sampler2DArrayShadow[MAX_SHADOWS] shadowTextures;

	vec3 implicitNormal(vec3 position) {
		return normalize(cross(dFdx(position), dFdy(position)));
	}

	int _getCascadeRegion(vec3 position) {
		float depth = dot(position, camera.direction);
		for (int i = 0; i < shadowCascadeDepths.length(); i++) {
			if (depth < shadowCascadeDepths[i]) {
				return i;
			}
		}
		return -1;
	}
	
	float getShadow(vec3 position, Light light) {
		if (light.shadowIndex == -1) return 0.0;

		int cascadeRegion = _getCascadeRegion(position);
		if (cascadeRegion == -1) return 0.0;

		ShadowInfo info = shadowInfo[light.shadowIndex * SHADOW_CASCADE + cascadeRegion];
		ShadowCamera camera = info.camera;

		// normal bias
		vec3 n = implicitNormal(position);
		float ldn = dot(getLightDirection(position, light), n);
		float normalBias = info.pixelSize * 0.5 * sqrt(1.0 - ldn * ldn);
		position += n * normalBias;

		vec4 proj = camera.pcMatrix * vec4(position, 1);
		vec3 frag = proj.xyz / proj.w;
		vec2 uv = vec2(
			0.5 + frag.x * 0.5,
			0.5 - frag.y * 0.5
		);

		// depth bias
		frag.z -= 0.01 / info.zRange;

		ivec3 shadowPixel = ivec3(
			uv * vec2(SHADOW_RESOLUTION),
			cascadeRegion
		);

		float fragDepth = frag.z * 0.5 + 0.5;

		vec4 testCoord = vec4(uv, cascadeRegion, fragDepth);

		float depth;
		switch (light.shadowIndex) {${
			Array.dim(Artist3D.MAX_SHADOWS)
				.map((_, i) => `
					case ${i}: return texture(shadowTextures[${i}], testCoord);
				`)
				.join("\n")
		}}
		
		return 0.0;
	}
`;
Artist3D.SHADOW_FRAGMENT = new GLSL(`
	vec4 shader() {
		return vec4(0.0);
	}
`);
Artist3D.SCREEN_VERTEX = new ShaderSource(new GLSL(`
	layout (location = 0) in vec2 position;

	out vec2 uv;

	void main() {
		uv = position * 0.5 + 0.5;
		gl_Position = vec4(position, 0, 1);
	}
`));
Artist3D.OVERLAY_FRAGMENT = new GLSL(`
	uniform sampler2D overlay;

	vec4 shader() {
		vec4 result = texture(overlay, vec2(uv.x, 1.0 - uv.y));
		result.rgb *= result.a;
		return result;
	}
`);
Artist3D.COPY_FRAGMENT = new GLSL(`
	uniform sampler2D source;

	vec4 shader() {
		return texture(source, uv);
	}
`);