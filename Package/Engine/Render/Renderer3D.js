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
 * @prop<readonly> Artist3D.PostProcessEffects postProcess | The post-processing effects that are applied to the rendered image
 * @prop Number shadowResolution | The side-length of the largest shadow map (in texels). Starts as 4096
 * @prop Number shadowFalloff | The rate at which shadow map side-lengths decrease with distance. Modifying this will change `.shadowResolutions`. Starts as 0.8
 * @prop Number[4] shadowResolutions | The side-lengths of all shadow map cascades (in texels), in order from near to far
 */
class Artist3D extends Artist {
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
		this.lightObj = new Artist3D.LightRenderer(this);
		this.meshObj = new Artist3D.MeshRenderer(this);
		this.strokeObj = new Artist3D.StrokeRenderer(this);
		this.drawObj = new Artist3D.DrawRenderer(this);
		this.vector3Pool = new StackAllocator(Vector3);
		this.matrix4Pool = new StackAllocator(Matrix4);
		this.matrix4Pool.push();
		this.postProcess = {
			before: new Artist3D.CustomEffects(this, true),
			bloom: new Artist3D.Bloom(this, true),
			ssao: new Artist3D.SSAO(this, true),
			after: new Artist3D.CustomEffects(this, true)
		};
		this.screenBuffers = [];

		this.hdr = true;
		this.depthFormat = this.gl.DEPTH_COMPONENT32F;
		this.resultBuffer = this.createScreenBuffer({ color: true, depth: true, hdr: true, depthFormat: this.depthFormat });

		this.compile();
		
		this.resize(canvas.width, canvas.height);

		this.shadowResolution = 4096;
		this.shadowFalloff = 0.8;
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
	set shadowResolution(a) {
		this._shadowResolution = a;
		this.invalidateShadowMaps();
	}
	get shadowResolution() {
		return this._shadowResolution;
	}
	set shadowFalloff(a) {
		this._shadowFalloff = a;
		this.shadowCascadeSizes = Array.dim(Artist3D.SHADOW_CASCADE)
			.map((_, i) => a ** i);
	}
	get shadowFalloff() {
		return this._shadowFalloff;
	}
	set shadowResolutions(a) {
		this.shadowResolution = a[0];
		this.shadowCascadeSizes = a.map(x => x / this.shadowResolution);
		this.invalidateShadowMaps();
	}
	get shadowResolutions() {
		return this.shadowCascadeSizes.map(x => x * this.shadowResolution);
	}
	invalidateShadowMaps() {
		this.shadowMaps = [];
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
		gl.renderbufferStorageMultisample(gl.RENDERBUFFER, 4, this.depthFormat, width, height);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
	}
	compile() {
		const { gl } = this;
		gl.enable(gl.CULL_FACE);
		gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
		this.invalidateShadowMaps();

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
	create2DProgram(fragmentShader, fullScreen = true) {
		const { gl } = this;
		const program = new GLSLProgram(
			gl, Artist3D.SCREEN_VERTEX,
			Artist3D.fragmentShader2D(fragmentShader)
		);
		if (fullScreen) program.setUniform("uvBox", new Rect(0, 0, 1, 1));
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
		this.addTransform(new Matrix4(Quaternion.fromRotation(axis, angle).toMatrix()));
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
	 * @return StrokeRenderer3D
	 */
	stroke(color, lineWidth) {
		this.strokeObj.setup(color, lineWidth);
		return this.strokeObj;
	}
	/**
	 * Returns an object with various methods for queuing solid shapes to be rendered.
	 * @param Color color | The color of the shapes to be drawn
	 * @return DrawRenderer3D
	 */
	draw(color) {
		this.drawObj.setup(color);
		return this.drawObj;
	}
	pass(meshes, visibility, shadowPass, setupMaterial) {
		const { gl } = this;

		const transparent = [];
		const chunks = [];

		meshLoop: for (let i = 0; i < meshes.length; i++) {
			const mesh = meshes[i];
			const { instances } = mesh;
			for (let j = 0; j < instances.length; j++) {
				if (visibility[instances[j].visibilityIndex]) {
					chunks.pushArray(mesh.opaque);
					transparent.pushArray(mesh.transparent);
					continue meshLoop;
				}
			}
		}

		const transparentIndex = chunks.length;

		chunks.pushArray(transparent);

		gl.useProgram(null);
		gl.depthMask(true);

		for (let i = 0; i < chunks.length; i++) {
			const { chunk, mesh, instances, uniforms } = chunks[i];

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

			if (instances.length < Artist3D.INSTANCE_THRESHOLD) {
				for (let j = 0; j < instances.length; j++) {
					const { transform, visibilityIndex } = instances[j];
					if (visibility[visibilityIndex]) {
						program.setUniform("transform", transform, false, true);
						gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_INT, 0);
					}
				}
			} else {
				let lastInstance = instances.length - 1;
				while (lastInstance >= 0 && !visibility[instances[lastInstance].visibilityIndex])
					lastInstance--;
				program.setUniform("transform", instances[0].transform, false, true);
				gl.drawElementsInstanced(gl.TRIANGLES, indices.length, gl.UNSIGNED_INT, 0, lastInstance + 1);
			}
		}

		gl.disable(gl.BLEND);
	}
	setupMesh({ mesh, transforms, castShadows }, bounds) {
		const { gl } = this;

		if (!this.hasCache(mesh)) {
			const instanceBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(12), gl.STATIC_DRAW);

			const vertexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, mesh.data, gl.STATIC_DRAW);

			const localBoundingSphere = mesh.getBoundingBall();

			this.setCache(mesh, {
				vertexBuffer, instanceBuffer,
				bounds, localBoundingSphere
			});
		}

		const cached = this.getCache(mesh);

		const instances = [];
		for (let i = 0; i < transforms.length; i++) {
			const transform = transforms[i];

			const boundingSphere = new Sphere(
				transform.times(cached.localBoundingSphere.position, this.vector3Pool.alloc()),
				transform.maxHomogenousScaleFactor * cached.localBoundingSphere.radius
			);

			if (isNaN(boundingSphere.position.x)) continue;
			
			instances.push({ transform, visibilityIndex: bounds.length });
			bounds.push(boundingSphere);
		}

		const opaque = [];
		const transparent = [];

		for (let j = 0; j < mesh.chunks.length; j++) {
			const chunk = mesh.chunks[j];

			const representation = {
				mesh, chunk,
				uniforms: chunk.material.uniforms,
				instances
			};

			if (chunk.material.transparent) {
				transparent.push(representation);
			} else {
				opaque.push(representation);
			}
		}

		return { mesh, instances, opaque, transparent, castShadows };
	}
	setupMeshInstances(mesh, visibilityCounts) {
		const { instances } = mesh;
		if (instances.length >= Artist3D.INSTANCE_THRESHOLD) {
			const { gl } = this;

			const cached = this.getCache(mesh.mesh);

			instances.sort((a, b) => visibilityCounts[b.visibilityIndex] - visibilityCounts[a.visibilityIndex]);
			
			const ELEMENTS_PER_MATRIX = 4 * 3;
			const instanceView = this.instanceData.getView(instances.length * ELEMENTS_PER_MATRIX);
			let instanceViewIndex = ELEMENTS_PER_MATRIX;

			// technically... the first transform is read from a uniform, so we can skip it
			for (let i = 1; i < instances.length; i++) {
				const { transform } = instances[i];
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
	}
	setupShadows(camera, lights, bounds) {
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
			this.shadowMaps.push(new Artist3D.ShadowMap(this));
		
		const cascadeProps = Array.dim(Artist3D.SHADOW_CASCADE).map((_, i) => 3 ** i);
		const frusta = Geometry3D.subdivideFrustum(screen, cascadeProps);
		const shadowCascadeDepths = frusta.map(frustum => Math.max(
			...frustum.vertices.map(vertex => vertex.dot(camera.direction))
		));

		for (let i = 0; i < shadowLights.length; i++) {
			const light = shadowLights[i];
			const map = this.shadowMaps[i];
			
			let nearZ = Infinity;
			for (let j = 0; j < bounds.length; j++) {
				const sphere = bounds[j];
				const z = sphere.position.dot(light.direction) - sphere.radius;
				if (z < nearZ) nearZ = z;
			}

			for (let j = 0; j < frusta.length; j++) {
				const scale = this.shadowCascadeSizes[j];
				const resolution = Math.ceil(this.shadowResolution * scale);
				const viewport = new Rect(0, 0, resolution, resolution);
				const camera = new Camera3D(() => viewport);
				camera.direction = light.direction;

				const frustum = frusta[j];
				const frustumBounds = Prism.bound(
					frustum.vertices.map(vertex => camera.worldToScreen(vertex))
				);
				const { xRange, yRange, zRange } = Prism.fromRanges(
					frustumBounds.xRange, frustumBounds.yRange,
					new Range(nearZ, frustumBounds.max.z)
				);
				const padding = Math.SQRT2 * Math.hypot(xRange.length, yRange.length) / (resolution - Math.SQRT2);
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
				cascade.pixelSize = Math.SQRT2 * Math.hypot(xRange.length, yRange.length) / resolution;
				cascade.zRange = zRange.length;
				cascade.scale = resolution / this.shadowResolution;
			}
		}

		return { shadowCascadeDepths, shadowLights };
	}
	renderShadows(meshes, shadowLights, visibilities) {
		const { gl } = this;
		
		gl.enable(gl.DEPTH_TEST);
		gl.depthMask(true);
		for (let i = 0; i < shadowLights.length; i++) {
			const { cascades } = this.shadowMaps[i];
			for (let j = 0; j < cascades.length; j++) {
				const cascade = cascades[j];
				const { viewport } = cascade.camera;

				gl.bindFramebuffer(gl.FRAMEBUFFER, cascade.framebuffer);
				GLUtils.setViewport(gl, viewport);
				gl.clear(gl.DEPTH_BUFFER_BIT);

				if (!cascade.camera) continue;

				this.pass(meshes, visibilities.get(cascade.camera), true, chunk => {
					const program = this.getShaderProgram({
						vertexShader: chunk.material.vertexShader,
						fragmentShader: Artist3D.SHADOW_FRAGMENT
					});

					if (!program.inUse) {
						program.use();
						program.setUniform("camera", cascade.camera, false, true);
					}
	
					return program;
				});
			}
		}
	}
	computeVisibility(camera, shadowLights, meshes, bounds) {
		const allCameras = [];
		for (let i = 0; i < shadowLights.length; i++) {
			const { cascades } = this.shadowMaps[i];
			for (let j = 0; j < cascades.length; j++) {
				const { camera } = cascades[j];
				if (camera) allCameras.push(camera);
			}
		}
		allCameras.push(camera);

		const visibilities = new Map();
		const visibilityCounts = new Array(bounds.length).fill(0);
		for (let i = 0; i < allCameras.length; i++) {
			const camera = allCameras[i];
			const isShadowCamera = i < allCameras.length - 1;
			const frustum = camera.screen;
			const visibility = new Array(bounds.length).fill(false);
			for (let j = 0; j < meshes.length; j++) {
				const { instances, castShadows } = meshes[j];
				if (!castShadows && isShadowCamera) continue;
				for (let k = 0; k < instances.length; k++) {
					const index = instances[k].visibilityIndex;
					const bound = bounds[index];
					const visible = !frustum.cullBall(bound);
					visibility[index] = visible;
					visibilityCounts[index] += visible;
				}
			}
			visibilities.set(camera, visibility);
		}


		return { visibilities, visibilityCounts };
	}
	renderQueues(camera, meshQueue, lightQueue) {
		const { gl } = this;
		this.vector3Pool.push();

		const lights = lightQueue.slice(0, Artist3D.MAX_LIGHTS);

		const bounds = [];
		const meshes = meshQueue
			.map(req => this.setupMesh(req, bounds))
			.filter(mesh => mesh.instances.length);
		
		// setup shadow cameras
		const { shadowCascadeDepths, shadowLights } = this.setupShadows(camera, lights, bounds);

		// optimize culling
		const { visibilities, visibilityCounts } = this.computeVisibility(camera, shadowLights, meshes, bounds);

		for (let i = 0; i < meshes.length; i++)
			this.setupMeshInstances(meshes[i], visibilityCounts);
		
		// shadow pass
		this.renderShadows(meshes, shadowLights, visibilities);

		// main render pass
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.msFramebuffer);
		gl.enable(gl.DEPTH_TEST);

		this.setViewport(camera);
		this.pass(meshes, visibilities.get(camera), false, chunk => {
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

		this.vector3Pool.pop();

		gl.useProgram(null);
	}
	maximizeViewport() {
		this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
	}
	getCameraViewport(camera) {
		const { pixelRatio } = this.imageType;
		const { x, y, width, height } = camera.viewport;
		return new Rect(
			Math.floor(x * pixelRatio),
			Math.floor(y * pixelRatio),
			Math.ceil(width * pixelRatio),
			Math.ceil(height * pixelRatio)
		);
	}
	setViewport(camera) {
		GLUtils.setViewport(this.gl, this.getCameraViewport(camera));
	}
	getUVBox(rect) {
		const {
			drawingBufferWidth: width,
			drawingBufferHeight: height
		} = this.gl;

		return new Rect(
			rect.x / width,
			rect.y / height,
			rect.width / width,
			rect.height / height
		);
	}
	drawQuad(shader, uniforms = { }) {
		const { gl } = this;
		shader.focus();
		shader.setUniforms(uniforms, false);

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
	afterRendering(camera) {
		const { gl } = this;
		
		// copy multisample framebuffer into post-processing buffers
		gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.msFramebuffer);
		gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.resultBuffer.framebuffer);

		const view = this.getCameraViewport(camera);
		const { min, max } = view;
		gl.blitFramebuffer(
			min.x, min.y, max.x, max.y,
			min.x, min.y, max.x, max.y,
			gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT, gl.NEAREST
		);

		// post processing
		let outputBuffer = this.resultBuffer;
		for (const key in this.postProcess) {
			const effect = this.postProcess[key];
			if (effect.active)
				outputBuffer = effect.draw(outputBuffer, camera, view);
		}

		// composite
		GLUtils.setViewport(gl, view);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.disable(gl.DEPTH_TEST);
		this.drawQuad(this.copyShader, { source: outputBuffer.color, region: view });
	}
	render(camera) {
		const lightQueue = this.lightObj.lights;
		const meshQueue = this.meshObj.meshes;

		if (meshQueue.length)
			this.renderQueues(camera, meshQueue, lightQueue);

		this.emptyQueues();

		this.afterRendering(camera);
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

	static MAX_LIGHTS = 50;
	static MAX_SHADOWS = 8;
	static SHADOW_BIAS = 0.5;
	static SHADOW_CASCADE = 4;
	static INSTANCE_THRESHOLD = 10;
	static LightTypes = Object.fromEntries(["AMBIENT", "DIRECTIONAL", "POINT"].map((n, i) => [n, i]));
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

	${Object.entries(Artist3D.LightTypes).map(([n, i]) => `#define ${n} ${i}`).join("\n")}
	#define MAX_LIGHTS ${Artist3D.MAX_LIGHTS}
	#define MAX_SHADOWS ${Artist3D.MAX_SHADOWS}
	#define SHADOW_CASCADE ${Artist3D.SHADOW_CASCADE}

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
		float scale;
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

		float fragDepth = frag.z * 0.5 + 0.5;

		vec4 testCoord = vec4(uv * info.scale, cascadeRegion, fragDepth);

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

	uniform struct {
		vec2 min, max;
	} uvBox;

	out vec2 uv;

	void main() {
		uv = mix(uvBox.min, uvBox.max, position * 0.5 + 0.5);
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
	uniform struct {
		vec2 min, max;
	} region;	

	vec4 shader() {
		vec2 size = vec2(textureSize(source, 0));
		return texture(source, mix(region.min, region.max, uv) / size);
	}
`);

/**
 * @name class Artist3D.PostProcessEffects
 * Represents the complete collection of post-processing effects that are applied to a given Artist3D.
 * This class should not be constructed, and should be accessed via the `.postProcess` property of an Artist3D instance.
 * @prop<readonly> Artist3D.CustomEffects before | A collection of user-defined post-processing effects which will be applied before built-in effects. This is active, but empty, by default
 * @prop<readonly> Artist3D.SSAO ssao | Screen-space ambient occlusion. This is active by default
 * @prop<readonly> Artist3D.Bloom bloom | A light-bleeding effect. This is active by default
 * @prop<readonly> Artist3D.CustomEffects after | A collection of user-defined post-processing effects which will be applied after built-in effects. This is active, but empty, by default
 */

/**
 * @name class Artist3D.PostProcess
 * Represents an optional post-processing effect that can be applied to an Artist3D's rendered result.
 * This class, along with its subclasses should not be constructed.
 * @prop Boolean active | Whether the effect is currently active. The initial value of this property depends the effect
 */
Artist3D.PostProcess = class {
	constructor(artist, active) {
		this.artist = artist;
		this.active = active;
	}
	compile() { }
	draw(inputBuffer, camera, view) { }
};

/**
 * @name class Artist3D.Bloom extends Artist3D.PostProcess
 * Represents an optional "bloom" post-processing effect. This will cause bright areas to bleed into adjacent areas, to give the impression of the light overwhelming the camera.
 * @prop Number intensity | The intensity of the bloom effect, on [0, 1]. This starts as 0.3
 * @prop Number steps | The integer number of scaling steps. Lower values will limit the maximum range of the bloom. This starts as 8
 */
Artist3D.Bloom = class extends Artist3D.PostProcess {
	constructor(...args) {
		super(...args);

		this.intensity = 0.3;
		this.steps = 8;
	}
	compile() {
		this.extractShader = this.artist.create2DProgram(Artist3D.Bloom.EXTRACT_FRAGMENT, false);
		this.downsampleShader = this.artist.create2DProgram(Artist3D.Bloom.DOWNSAMPLE_FRAGMENT, false);
		this.upsampleShader = this.artist.create2DProgram(Artist3D.Bloom.UPSAMPLE_FRAGMENT, false);
		this.pingPong = this.artist.createPingPong({ color: true, hdr: true });
	}
	draw(inputBuffer, _, view) {
		const { gl } = this.artist;

		const width2 = 2 ** Math.floor(Math.log2(view.width));
		const height2 = 2 ** Math.floor(Math.log2(view.height));

		const { steps } = this;
		
		const getRect = index => {
			if (!index) return view;
			const size = 0.5 ** index;
			const w = (width2 / view.width) * size;
			const h = (height2 / view.height) * size;
			const x = 0;
			const y = 1 - h * 2;
			return new Rect(
				Math.ceil(x * view.width) + view.x,
				Math.ceil(y * view.height) + view.y,
				Math.ceil(w * view.width),
				Math.ceil(h * view.height)
			);
		};

		const viewRect = index => GLUtils.setViewport(gl, getRect(index));
		const uvRect = index => this.artist.getUVBox(getRect(index));

		gl.disable(gl.DEPTH_TEST);

		this.pingPong.clear();
		
		// extract bright areas
		GLUtils.setViewport(gl, view);
		this.pingPong.bind();
		this.artist.drawQuad(this.extractShader, { colorTexture: inputBuffer.color, uvBox: uvRect(0) });
		
		// downsample & blur
		for (let i = 0; i < steps; i++) {
			const large = this.pingPong.swap().color;
			if (i === 1) this.pingPong.dst.clear();
			viewRect(i + 1);
			this.artist.drawQuad(this.downsampleShader, { large, uvBox: uvRect(i) });
		}
		
		gl.enable(gl.BLEND);
		for (let i = steps - 1; i > 0; i--) {
			const small = this.pingPong.swap().color;
			viewRect(i);
			this.artist.drawQuad(this.upsampleShader, { small, uvBox: uvRect(i + 1), intensity: 1 });
		}

		const bloom = this.pingPong.swap().color;
		const bloomBox = uvRect(1);

		gl.depthMask(false);

		GLUtils.setViewport(gl, view);
		inputBuffer.bind();
		this.artist.drawQuad(this.upsampleShader, {
			small: bloom, uvBox: bloomBox,
			intensity: this.intensity
		});
		
		gl.depthMask(true);
		gl.disable(gl.BLEND);
		
		return inputBuffer;
	}
	static EXTRACT_FRAGMENT = new GLSL(`
		uniform sampler2D colorTexture;

		vec4 shader() {
			vec4 color = texture(colorTexture, uv);
			if (color.r > 1.0 || color.g > 1.0 || color.b > 1.0)
				return color;
			return vec4(0);
		}
	`);
	static DOWNSAMPLE_FRAGMENT = new GLSL(`
		uniform sampler2D large;

		vec4 shader() {
			int S = 1;
			vec2 px = 1.0 / vec2(textureSize(large, 0));

			vec4 total = vec4(0);
			for (int i = -S; i <= S; i++)
			for (int j = -S; j <= S; j++) {
				vec2 samplePos = uv + px * vec2(i, j);
				total += texture(large, samplePos);
			}

			total /= pow(float(S) * 2.0 + 1.0, 2.0);

			return total;
		}
	`);
	static UPSAMPLE_FRAGMENT = new GLSL(`
		uniform float intensity;
		uniform sampler2D small;

		vec4 shader() {
			return texture(small, uv) * intensity;
		}
	`);
}

/**
 * @name class Artist3D.SSAO extends Artist3D.PostProcess
 * Represents an optional ambient occlusion post-processing effect, which will darken enclosed areas and create contact shadows.
 * @prop Number samples | The number of rays to cast for each pixel, which cannot exceed 64. This starts as 8
 * @prop Number radius | The world-space radius of the occlusion sampling sphere. This starts as 3
 * @prop Number blurSamples | The number of samples along the diameter of the blur. This starts as 12
 * @prop Number maxBlurRadius | The maximum radius of the blur step in pixels. This starts as 10
 * @prop Number minBlurRadius | The minimum radius of the blur step in pixels. This starts as 4
 * @prop Number intensity | An exponent to apply to the final occlusion value. This starts as 2
 */
Artist3D.SSAO = class extends Artist3D.PostProcess {
	constructor(...args) {
		super(...args);
		this.samples = 8;
		this.radius = 3;
		this.blurSamples = 12;
		this.maxBlurRadius = 10;
		this.minBlurRadius = 4;
		this.intensity = 2;
	}
	compile() {
		const { gl } = this.artist;
		
		this.occlusionShader = this.artist.create2DProgram(Artist3D.SSAO.OCCLUSION_FRAGMENT, false);
		this.blurShader = this.artist.create2DProgram(Artist3D.SSAO.BLUR_FRAGMENT, false);
		this.pingPong = this.artist.createPingPong({
			color: true,
			colorFormat: {
				type: gl.UNSIGNED_BYTE,
				internalFormat: gl.R8,
				format: gl.RED
			}
		});
		this.outputBuffer = this.artist.createScreenBuffer({ color: true, depth: true, hdr: true });
	
		const rng = new Random(12345);
		const normal = new Vector3(0, 0, 1);
		const hemisphere = Array.dim(Artist3D.SSAO.MAX_SAMPLES).map(() => rng.hemisphere(normal, rng.random() ** 2));
		this.occlusionShader.setUniform("hemisphere", hemisphere);
	}
	draw(inputBuffer, camera, view) {
		const { gl } = this.artist;

		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.ALWAYS);
		GLUtils.setViewport(gl, view);

		const uvBox = this.artist.getUVBox(view);

		const { projection } = camera;
		const invProjection = projection.inverse;

		const { depth } = inputBuffer;
		
		{ // compute occlusion	
			this.pingPong.bind();
			this.artist.drawQuad(this.occlusionShader, {
				depthTexture: depth,
				samples: this.samples,
				uvBox, projection, invProjection,
				sampleRadius: this.radius
			});
		}

		{ // blur
			const invRes = new Vector2(1 / gl.drawingBufferWidth, 1 / gl.drawingBufferHeight);
			const directions = [Vector2.right, Vector2.down];
			for (let i = 0; i < directions.length; i++) {
				const { color } = this.pingPong.swap();
				
				const uniforms = {
					uvBox, depthTexture: depth,
					occlusionTexture: color,
					minRadius: this.minBlurRadius,
					maxRadius: this.maxBlurRadius,
					samples: Math.floor(this.blurSamples / 2),
					composite: i === directions.length - 1,
					projection, invProjection,
					axis: directions[i].times(invRes)
				};

				if (uniforms.composite) {
					uniforms.colorTexture = inputBuffer.color;
					uniforms.intensity = this.intensity;
					this.outputBuffer.bind();
				}
				
				this.artist.drawQuad(this.blurShader, uniforms);
			}
		}

		gl.depthFunc(gl.LEQUAL);

		return this.outputBuffer;
	}

	static MAX_SAMPLES = 64;

	static LINEAR_Z = `
		#define PI ${Math.PI}

		uniform mat4 projection;
		uniform mat4 invProjection;

		float linearZ(float nlz) {
			float zScale = projection[2][2];
			float zOffset = projection[3][2];

			// nlz = (zScale * z + zOffset) / z
			float z = zOffset / (nlz - zScale);

			return z;
		}

		float projectedZ(float nlz) {
			float zScale = projection[2][2];
			float zOffset = projection[3][2];

			return zScale * linearZ(nlz) + zOffset;
		}
		
		vec3 unproject(vec3 screen) {
			vec3 ndc = screen * 2.0 - 1.0;

			float w = projectedZ(ndc.z) / ndc.z;
			vec4 fullNdc = vec4(ndc, 1) * w;
			vec4 unprojected = invProjection * fullNdc;
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
		uniform vec3 hemisphere[${this.MAX_SAMPLES}];
		uniform int samples;

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
			) * (radius * radius);
		}

		float getOcclusion(vec3 ro, vec3 rd, float tolerance) {
			vec3 endPosition = ro + rd * sampleRadius;
			vec3 endScreenPosition = project(endPosition);

			vec2 endUV = endScreenPosition.xy;
			if (clamp(endUV, vec2(0), vec2(1)) != endUV)
				return -1.0;

			float actualDepth = texture(depthTexture, endUV).r;
			vec3 actualEndPosition = unproject(vec3(endUV, actualDepth));

			float diff = actualEndPosition.z - endPosition.z;

			if (diff < -sampleRadius) return -1.0;

			return diff > -tolerance ? 0.0 : 1.0;
		}

		vec4 shader() {
			float depth = texture(depthTexture, uv).r;

			if (depth == 1.0) return vec4(0);

			vec3 screen = vec3(uv, depth);
			vec3 ro = unproject(screen);
			
			// compute tangent space
			vec3 tangent = dFdy(ro);
			vec3 bitangent = dFdx(ro);
			vec3 normal = normalize(cross(tangent, bitangent));
			if (dot(normal, normal) < 0.99) return vec4(0);
			tangent = normalize(tangent);
			bitangent = normalize(cross(normal, tangent));
			mat3 toSurface = mat3(tangent, bitangent, normal);
			
			// compute kernel rotation
			float seed = 23.123 * cos(gl_FragCoord.x * 5.2387) + sin(gl_FragCoord.y * 30.0);
			float angle = random(seed) * 2.0 * PI;
			float c = cos(angle);
			float s = sin(angle);
			mat3 rotate = mat3(
				c, s, 0,
				-s, c, 0,
				0, 0, 1
			);

			mat3 fromLocal = toSurface * rotate;

			float tolerance = min(fwidth(ro.z), sampleRadius * 0.5);
			
			float totalOcclusion = 0.0;
			float totalWeight = 0.0;

			for (int i = 0; i < samples; i++) {
				vec3 rd = fromLocal * hemisphere[i];
				float occlusion = getOcclusion(ro, rd, tolerance);
				if (occlusion >= 0.0) {
					totalOcclusion += occlusion;
					totalWeight++;
				}
			}

			if (totalWeight > 0.0) totalOcclusion /= totalWeight;

			return vec4(totalOcclusion);
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

				float nearFactor = abs(i) <= 1 ? 0.1 : 1.0;
				float zT = zDiff * nearFactor;
				float zNormalWeight = exp(-zT * zT);

				float weight = positionalNormalWeight * zNormalWeight;
				totalOcclusion += texture(occlusionTexture, samplePos).r * weight;
				totalWeight += weight;
			}

			float occlusion = totalOcclusion / totalWeight;

			if (composite) {
				// return vec4(vec3(occlusion), 1.0);
				vec4 color = texture(colorTexture, uv);
				color.rgb *= pow(1.0 - occlusion, intensity);
				return color;
			}

			return vec4(vec3(occlusion), 1.0);
		}
	`);
};

/**
 * @name class Artist3D.CustomEffects extends Artist3D.PostProcess
 * Represents a collection of user-defined post-processing effects.
 * Effects can be defined using a full-screen GLSL program, which will be provided with information about the current state of the rendering.
 * This class should not be constructed, and should instead be accessed via the `.before` and `.after` properties of an Artist3D.PostProcessEffects.
 * ```js
 * // chromatic abberation effect
 * renderer.postProcess.after.addEffect("abberation", `
 * 	vec4 shader() {
 * 		vec2 resolution = vec2(textureSize(colorTexture, 0));
 * 		vec2 position = resolution * uv;
 * 		
 * 		return vec4(
 * 			texture(colorTexture, (position + vec2(-3, 0)) / resolution).r,
 * 			texture(colorTexture, (position + vec2(0, 3)) / resolution).g,
 * 			texture(colorTexture, (position + vec2(3, 0)) / resolution).b,
 * 			1
 * 		);
 * 	}
 * `);
 * ```
 */
Artist3D.CustomEffects = class extends Artist3D.PostProcess {
	constructor(...args) {
		super(...args);
		this.effects = new Map();
	}
	/**
	 * Re-orders the way in which the effects are applied.
	 * @param String[] order | The names of the effects to be applied, in the order to apply them. Any names omitted will be removed from the list of effects
	 */
	reorder(order) {
		const effects = new Map(this.effects);
		this.effects.clear();
		for (let i = 0; i < order.length; i++)
			this.effects.set(order[i], effects.get(order[i]));
	}
	/**
	 * Adds a new full-screen post-processing effect after the existing effects.
	 * The shader program will be provided with several inputs, specifically the following:
	 * <table>
	 * 	<tr><th>Input</th><th>Description</th></tr>
	 * 	<tr><td>`vec2 uv`</td><td>The UV coordinates of the current pixel in screen space</td></tr>
	 * 	<tr><td>`sampler2D colorTexture`</td><td>The current color content of the screen</td></tr>
	 * 	<tr><td>`sampler2D depthTexture`</td><td>The current depth content of the screen</td></tr>
	 * 	<tr><td>`Camera camera`</td><td>The camera being used for rendering, with the properties of a JS Camera object</td></tr>
	 * </table> 
	 * @param String name | The name of the new effect
	 * @param String glsl | The source code for the full-screen fragment shader effect. This must define a `vec4 shader()` entry-point function
	 * @param Object uniforms? | An object containing uniform values to pass to this effect. Changes to the object will be reflected in the uniform values. Default is an empty object
	 */
	addEffect(name, glsl, uniforms = { }) {
		glsl = new GLSL(Artist3D.CustomEffects.FRAGMENT_PREFIX + " " + glsl);
		const { artist } = this;
		const effect = {
			uniforms,
			compile() {
				this.program = artist.create2DProgram(glsl, false);
			}
		};
		effect.compile();
		this.effects.set(name, effect);
	}
	/**
	 * Removes the effect with a given name.
	 * @param String name | The name of the effect to remove
	 */
	removeEffect(name) {
		this.effects.delete(name);
	}
	compile() {
		for (const effect of this.effects.values())
			effect.compile();
		this.pingPong = this.artist.createPingPong({ hdr: true, depth: true });
	}
	draw(inputBuffer, camera, view) {
		if (!this.effects.size) return inputBuffer;

		const { gl } = this.artist;

		GLUtils.setViewport(gl, view);

		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.ALWAYS);

		const uvBox = this.artist.getUVBox(view);

		let useInput = true;
		for (const effect of this.effects.values()) {
			let source;
			if (useInput) {
				useInput = false;
				source = inputBuffer;
			} else {
				source = this.pingPong.swap();
			}
			this.pingPong.bind();

			this.artist.drawQuad(effect.program, {
				...effect.uniforms,
				uvBox, camera,
				colorTexture: source.color,
				depthTexture: source.depth
			});
		}

		gl.depthFunc(gl.LEQUAL);

		return this.pingPong.dst;
	}

	static FRAGMENT_PREFIX = `
		uniform sampler2D colorTexture;
		uniform sampler2D depthTexture;
		${Artist3D.CAMERA}
	`.replaceAll(/\s+/g, " ").trim();
};

Artist3D.State = class {
	constructor() {
		this.transform = Matrix4.identity();
	}
	get(result = new Artist3D.State()) {
		this.transform.get(result.transform);
		return result;
	}
};

Artist3D.ShadowMap = class {
	constructor(artist) {
		const { gl } = artist;
		const oldBinding = gl.getParameter(gl.TEXTURE_BINDING_2D_ARRAY);
		
		this.texture = GLUtils.createTexture(gl, {
			target: gl.TEXTURE_2D_ARRAY,
			filter: FilterMode.LINEAR
		});
		gl.texStorage3D(
			gl.TEXTURE_2D_ARRAY, 1, gl.DEPTH_COMPONENT32F,
			artist.shadowResolution, artist.shadowResolution,
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

Artist3D.ScreenBuffer = class {
	constructor(gl, {
		hdr = false,
		color = true,
		depth = false,
		colorFormat = null,
		depthFormat = gl.DEPTH_COMPONENT32F
	} = { }) {
		this.gl = gl;
		this.hdr = hdr;
		this.hasColor = color;
		this.hasDepth = depth;
		this.colorFormat = colorFormat;
		this.depthFormat = depthFormat;
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
			const {
				internalFormat = this.hdr ? gl.RGBA16F : gl.RGBA8,
				type = this.hdr ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE,
				format = gl.RGBA
			} = this.colorFormat ?? { };
			gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, null);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.color, 0);
		}
		
		if (this.hasDepth) {
			this.depth = GLUtils.createTexture(gl);
			gl.texStorage2D(gl.TEXTURE_2D, 1, this.depthFormat, width, height);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depth, 0);
		}
	}
};

Artist3D.PingPong = class {
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

/**
 * @name class LightRenderer
 * Provides a set of methods for creating different types of lights in a 3D scene.
 * This class should not be constructed, and should be accessed via `Artist3D.prototype.light`.
 */
Artist3D.LightRenderer = class LightRenderer {
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
			type: Artist3D.LightTypes.AMBIENT
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
			type: Artist3D.LightTypes.POINT,
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
			type: Artist3D.LightTypes.DIRECTIONAL,
			direction: Matrix3.normal(transform).times(direction)
		});
	}
};

/**
 * @name class MeshRenderer
 * Provides a set of methods for rendering meshes in various ways in a scene.
 * This class should not be constructed, and should be accessed via `Artist3D.prototype.mesh`.
 */
Artist3D.MeshRenderer = class MeshRenderer {
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
};

Artist3D.PathRenderer = class PathRenderer {
	static MeshCache = class MeshCache {
		constructor(polyhedron, config) {
			this.polyhedron = polyhedron;
			this.meshes = [];
			this.materialToIndex = new Map();
			this.config = config;
			this.clear();
		}
		getMesh(material) {
			if (!this.materialToIndex.has(material)) {
				if (this.nextIndex >= this.meshes.length) {
					this.meshes.push(Mesh.fromPolyhedron(this.polyhedron, material, this.config));	
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
	createMeshCache(polyhedron, config) {
		const cache = new Artist3D.PathRenderer.MeshCache(polyhedron, config);
		this.meshCaches.push(cache);
		return cache;
	}
	clear() {
		this.materialCache.clear();
		for (let i = 0; i < this.meshCaches.length; i++)
			this.meshCaches[i].clear();
	}
};

/**
 * @name class DrawRenderer3D
 * Provides a set of methods for rendering solid shapes in three dimensions.
 * This class should not be constructed, and should be accessed via `Artist3D.prototype.draw`.
 */
Artist3D.DrawRenderer = class DrawRenderer extends Artist3D.PathRenderer {
	static MAX_CACHED_POLYHEDRA = 128;
	constructor(renderer) {
		super(renderer);
		
		this.color = null;

		this.sphereMeshCache = this.createMeshCache(
			Polyhedron.fromSphere(new Sphere(Vector3.zero, 1), 16),
			{ smooth: true }
		);

		this.prismMeshCache = this.createMeshCache(new Prism(
			Vector3.zero, new Vector3(1)
		));

		this.polyhedronMeshCache = new Map();
	}
	createMaterial(color) {
		return new SimpleMaterial({ albedo: color });
	}
	/**
	 * Renders a sphere in a solid color.
	 * @signature
	 * @param Vector3 center | The center of the sphere
	 * @param Number radius | The radius of the sphere
	 * @signature
	 * @param Sphere sphere | The sphere to render
	 */
	sphere(position, radius) {
		if (position instanceof Sphere)
			({ position, radius } = position);

		const transform = this.renderer.matrix4Pool.alloc();
		Matrix4.scale(radius, radius, radius, transform);
		transform[12] = position.x;
		transform[13] = position.y;
		transform[14] = position.z;

		const mesh = this.sphereMeshCache.getMesh(this.material);
		this.renderer.mesh(mesh).at(transform);
	}
	/**
	 * Renders a rectangular Prism in a solid color.
	 * @signature
	 * @param Vector3 min | The back-top-left corner of the rectangular prism
	 * @param Vector3 max | The front-bottom-right corner of the rectangular prism
	 * @signature
	 * @param Prism prism | The rectangular prism to render
	 */
	prism(min, max) {
		if (min instanceof Prism)
			({ min, max } = min);

		const transform = this.renderer.matrix4Pool.alloc();
		Matrix4.scale(
			max.x - min.x,
			max.y - min.y,
			max.z - min.z,
			transform
		);
		transform[12] = min.x;
		transform[13] = min.y;
		transform[14] = min.z;

		const mesh = this.prismMeshCache.getMesh(this.material);
		this.renderer.mesh(mesh).at(transform);
	}
	/**
	 * Renders an arbitrary Polyhedron in a solid color.
	 * @param Polyhedron poly | The Polyhedron to render
	 */
	shape(polyhedron) {
		if (!this.polyhedronMeshCache.has(polyhedron)) {
			if (this.polyhedronMeshCache.size > Artist3D.MAX_CACHED_POLYHEDRA) {
				const anyKey = this.polyhedronMeshCache[Symbol.iterator]().next().value[0];
				this.polyhedronMeshCache.delete(anyKey);
			}
			this.polyhedronMeshCache.set(polyhedron, new Map());
		}

		const specificCache = this.polyhedronMeshCache.get(polyhedron);
		const { hex } = this.color;
		if (!specificCache.has(hex))
			specificCache.set(hex, Mesh.fromPolyhedron(polyhedron, this.material));
		
		const mesh = specificCache.get(hex);
		this.renderer.mesh(mesh).default();
	}
};

/**
 * @name class StrokeRenderer3D
 * Provides a set of methods for rendering lines and outlines in various ways in three dimensions.
 * This class should not be constructed, and should be accessed via `Artist3D.prototype.stroke`.
 */
Artist3D.StrokeRenderer = class StrokeRenderer extends Artist3D.PathRenderer {
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
};