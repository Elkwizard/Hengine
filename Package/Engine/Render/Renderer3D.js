/**
 * Provides a set of methods for creating different types of lights in a 3D scene.
 * This class should not be constructed, and should be accessed via `Artist3D.prototype.light`.
 */
class LightRenderer {
	constructor(renderer) {
		this.renderer = renderer;
		this.color = Color.WHITE;
		this.queue = [];
	}
	get lights() {
		return this.queue;
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
	 * @param Boolean shadow? | The light casts shadows. Default is true
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
		this.matrices = new StackAllocator(Matrix4);
		this.matrices.push();
		this.clear();
	}
	get meshes() {
		const result = [];
		for (const [mesh, { transforms, castShadows }] of this.queue)
			result.push({ mesh, transforms, castShadows });
		return result;
	}
	clear() {
		this.matrices.pop();
		this.matrices.push();
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
		this.enqueue(this.renderer.state.transform.get(this.matrices.alloc()), castShadows);
	}
	/**
	 * Renders the current mesh at a given transform relative to the current transform.
	 * @param Matrix4 transform | The transform at which the mesh will be rendered
	 * @param Boolean castShadows? | Whether the mesh should cast shadows. If the same mesh is rendered multiple times, any of them choosing to cast shadows will lead to all of them casting shadows. Default is true
	 */
	at(transform, castShadows) {
		this.enqueue(this.renderer.state.transform.times(transform, this.matrices.alloc()), castShadows);
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

class ShadowMap {
	constructor(gl) {
		const oldBinding = gl.getParameter(gl.TEXTURE_BINDING_2D_ARRAY);
		
		this.texture = GLUtils.createTexture(gl, {
			target: gl.TEXTURE_2D_ARRAY,
			filter: FilterMode.NEAREST,
		});
		gl.texStorage3D(
			gl.TEXTURE_2D_ARRAY, 1, gl.DEPTH_COMPONENT32F,
			Artist3D.SHADOW_RESOLUTION, Artist3D.SHADOW_RESOLUTION,
			Artist3D.SHADOW_CASCADE
		);

		this.cascades = [];
		for (let i = 0; i < Artist3D.SHADOW_CASCADE; i++) {
			const framebuffer = gl.createFramebuffer();
			
			gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
			gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, this.texture, 0, i);

			this.cascades.push({ framebuffer });
		}
		
		gl.bindTexture(gl.TEXTURE_2D_ARRAY, oldBinding);
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
	constructor(canvas, imageType) {
		super();
		this.canvas = canvas;
		this.imageType = imageType;
		this.gl = GLUtils.createContext(canvas, {
			depth: true,
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
		this.vector3Pool = new StackAllocator(Vector3);

		this.compile();
		
		this.resize(canvas.width, canvas.height);

		return new Proxy(this, {
			get: (target, key, receiver) => {
				if (Artist3D.KEPT_PROPERTIES.has(key)) {
					// console.log(key, target.constructor.name);
					const result = Reflect.get(target, key, receiver);
					if (typeof result === "function")
						return result.bind(target);
					return result;
				}
				// console.log(key, target.target.constructor.name);
				return Reflect.get(target.target, key, receiver);
			},
			set: (target, key, value, receiver) => {
				return Reflect.set(target.target, key, value, receiver);
			}
		});
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
	compile() {
		const { gl } = this;
		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);
		gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
		this.shadowMaps = [];
		
		this.shaderCache = new WeakMap();
		this.renderCache = new Map();

		this.instanceData = new GrowableTypedArray(Float32Array);

		{ // setup 2D VAO
			
			this.overlayShader = this.create2DProgram(Artist3D.OVERLAY_FRAGMENT);
			
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
	}
	get target() {
		return this.inWorldSpace ? this : this.overlayRenderer; 
	}
	get overlayRenderer() {
		this.overlay ??= new Frame(this.imageType.width, this.imageType.height, this.imageType.pixelRatio);
		return this.overlay.renderer;
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
		if (this.overlay)
			this.overlay.resize(this.imageType.width, this.imageType.height);
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
		this.lightObj.color = color;
		return this.lightObj;
	}
	/**
	 * Returns an object with various methods for queueing meshes to be rendered.
	 * @param Mesh mesh | The mesh to be rendered
	 * @return MeshRenderer
	 */
	mesh(mesh) {
		this.meshObj.mesh = mesh;
		return this.meshObj;
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
		gl.disable(gl.BLEND);
		gl.depthMask(true);

		for (let i = 0; i < chunks.length; i++) {
			const { chunk, mesh, transforms, uniforms } = chunks[i];

			if (!shadowPass && i === transparentIndex) {
				gl.enable(gl.BLEND);
				gl.depthMask(false);
			}

			intervals.count("setupMaterial()");

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
			const instanceView = this.instanceData.getView(transforms.length * 12);
			let instanceViewIndex = 0;

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

		const boundingSphere = Sphere.composeBoundingSpheres(boundingSpheres);

		const opaque = [];
		const transparent = [];

		for (let j = 0; j < mesh.chunks.length; j++) {
			const chunk = mesh.chunks[j];

			intervals.count("chunkLoop");

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
	renderQueues(camera, lightQueue, meshQueue) {
		this.vector3Pool.push();
		
		const gl = this.gl;
		const { SHADOW_RESOLUTION } = Artist3D;
		const screen = camera.cacheScreen();

		const shadowLights = [];
		for (let i = 0; i < lightQueue.length; i++) {
			const light = lightQueue[i];
			if (light.shadow) {
				light.shadowIndex = shadowLights.length;
				shadowLights.push(light);
			} else {
				light.shadowIndex = -1;
			}
		}

		while (this.shadowMaps.length < shadowLights.length)
			this.shadowMaps.push(new ShadowMap(gl));
	
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		const boundingSpheres = [];
		const meshes = meshQueue.map(req => this.processMesh(req, boundingSpheres));
		
		gl.viewport(0, 0, SHADOW_RESOLUTION, SHADOW_RESOLUTION);

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

			window.testFrusta ??= [];
			window.testBounds ??= [];

			for (let j = 0; j < frusta.length; j++) {
				const camera = new Camera3D({
					width: SHADOW_RESOLUTION,
					height: SHADOW_RESOLUTION
				});
				camera.direction = light.direction;

				const frustum = frusta[j];
				window.testFrusta[j] ??= frustum.get();
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
				window.testBounds[j] ??= camera.screen.get();
				
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

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		this.maximizeViewport();
		
		const passedLights = lightQueue.slice(0, Artist3D.MAX_LIGHTS);

		this.pass(camera, meshes, false, chunk => {
			const program = this.getShaderProgram(chunk.material);
			if (!program.inUse) {
				program.use();
				program.setUniforms({
					camera: camera,
					lights: passedLights,
					lightCount: passedLights.length,
					time: intervals.frameCount,
					shadowTextures: this.shadowMaps.map(map => map.texture),
					shadowInfo: this.shadowMaps.flatMap(map => map.cascades),
					shadowCascadeDepths
				}, false);
			}

			return program;
		});

		this.vector3Pool.pop();
	}
	maximizeViewport() {
		this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
	}
	compositeOverlay(overlay) {
		const { gl } = this;
			
		this.overlayShader.focus();
		this.overlayShader.setUniform("overlay", overlay);
		
		this.maximizeViewport();
		gl.enable(gl.BLEND);
		gl.bindVertexArray(this.vertexArray2D);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}
	render(camera) {
		const lightQueue = this.lightObj.lights;
		const meshQueue = this.meshObj.meshes;

		if (meshQueue.length) {
			this.renderQueues(camera, lightQueue, meshQueue);
		}

		this.meshObj.clear();
		this.lightObj.clear();

		if (this.overlay) {
			this.compositeOverlay(this.overlay);
			this.overlay.renderer.clearTransformations();
			this.overlay.renderer.clear();
		}
	}
	fill({ x, y, z, w }) {
		const { gl } = this;
		gl.depthMask(true);
		gl.clearColor(x, y, z, w);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		if (this.overlay) this.overlayRenderer.clear();
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
				pixelColor.rgb *= pixelColor.a;
			}
		`;
	}

	static MAX_LIGHTS = 50;
	static MAX_SHADOWS = 8;
	static SHADOW_RESOLUTION = 2 ** 12;
	static SHADOW_BIAS = 0.5;
	static SHADOW_CASCADE = 4;
	static INSTANCE_THRESHOLD = 10;
	static KEPT_PROPERTIES = new Set([
		"enterWorldSpace", "exitWorldSpace", "imageType",
		"render", "clear", "fill"
	]);
}
Artist3D.State = class State {
	constructor() {
		this.transform = Matrix4.identity();
	}
	get(result = new Artist3D.State()) {
		this.transform.get(result.transform);
		return result;
	}
};
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
	uniform sampler2DArray[MAX_SHADOWS] shadowTextures;

	vec3 _implicitNormal(vec3 position) {
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
	
	float _random11(float seed) {
		float a = mod(seed * 6.12849, 8.7890975);
		float b = mod(a * 256745.4758903, 232.567890);
		return mod(abs(a * b), 1.0);
	}

	vec2 _random32(vec3 seed) {
		return vec2(
			_random11(seed.x + seed.y * 9823.1235 + seed.z * 283.2391823),
			_random11(873.21 * seed.x + seed.y + seed.z * 973.12357)
		);
	}

	float sampleShadowMap(Light light, vec3 position, vec3 pixelOffset) {	
		int cascadeRegion = _getCascadeRegion(position);
		if (cascadeRegion == -1) return 0.0;

		ShadowInfo info = shadowInfo[light.shadowIndex * SHADOW_CASCADE + cascadeRegion];
		ShadowCamera camera = info.camera;

		// normal bias
		vec3 n = _implicitNormal(position);
		float ldn = dot(getLightDirection(position, light), n);
		float normalBias = info.pixelSize * 0.5 * sqrt(1.0 - ldn * ldn);
		position += n * normalBias;
		
		position += pixelOffset * info.pixelSize;

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

		float depth;
		switch (light.shadowIndex) {${
			Array.dim(Artist3D.MAX_SHADOWS)
				.map((_, i) => `
					case ${i}: {
						float sampled = texelFetch(shadowTextures[${i}], shadowPixel, 0).r;
						depth = sampled * 2.0 - 1.0;
					} break;
				`)
				.join("\n")
		}}

		return frag.z > depth ? 1.0 : 0.0;
	}

	float getShadow(vec3 position, Light light) {
		if (light.shadowIndex == -1) return 0.0;
		
		vec3 tangent = normalize(dFdx(position));
		vec3 bitangent = normalize(dFdy(position));
		mat2x3 offToLocal = mat2x3(tangent, bitangent);

		float sum = 0.0;
		float total = 0.0;
		int S = 1;
		for (int i = -S; i <= S; i++)
		for (int j = -S; j <= S; j++) {
			vec2 off = vec2(i, j) / (0.0001 + float(S)) * 0.5;
			float weight = exp(-2.0 * dot(off, off));
			off += _random32(position + offToLocal * off + mod(time * 0.01, 10.0)) - 0.5;
			sum += sampleShadowMap(light, position, offToLocal * off) * weight;
			total += weight;
		}

		float shadow = sum / total;

		return shadow;
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
		uv.y = 1.0 - uv.y;
		gl_Position = vec4(position, 0, 1);
	}
`));
Artist3D.OVERLAY_FRAGMENT = new GLSL(`
	uniform sampler2D overlay;

	vec4 shader() {
		return texture(overlay, uv);
	}
`);