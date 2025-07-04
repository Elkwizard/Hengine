function defineWebGL2DContext(bound = {}, debug = false) {
	let gl = null;
	const glState = {};

	const attributes = {};
	const uniforms = {};

	//#region constants
	const MAX_INSTANCES = 100000;

	const BOOLS = {
		NULL: 0,
		CIRCLE: 0b00000001,
		TRIANGLE: 0b00000010,
		LINE_SEGMENT: 0b00000100,
		LEFT_LINE_CAP: 0b00001000,
		RIGHT_LINE_CAP: 0b00010000,
		OUTLINED: 0b00100000,
		TEXTURED: 0b01000000,
		PIXELATED: 0b10000000
	};

	// BLEND MODE
	const BLEND_MODE_COMBINE = 0x00;
	const BLEND_MODE_ADD = 0x01;
	const BLEND_MODE_BEHIND = 0x02;

	// LINE JOIN
	const LINE_JOIN_START_BIT = 8;

	const LINE_JOIN_NOT_APPLICABLE = 0;
	const LINE_JOIN_BEVEL = 1;
	const LINE_JOIN_MITER = 2;
	const LINE_JOIN_ROUND = 3;

	// LINE CAP
	const LINE_CAP_START_BIT = 10;

	const LINE_CAP_NOT_APPLICABLE = 0;
	const LINE_CAP_FLAT = 1;
	const LINE_CAP_SQUARE = 2;
	const LINE_CAP_ROUND = 3;
	//#endregion
	//#region math
	function clamp255(number) {
		if (number < 0) return 0;
		if (number > 255) return 255;
		return number;
	}
	function magnitude(x, y) {
		const sum = x * x + y * y;
		if (sum === 0) return 0;
		return Math.sqrt(sum);
	}
	function dot(x1, y1, x2, y2) {
		return x1 * x2 + y1 * y2;
	}
	function cross(x1, y1, x2, y2) {
		return x1 * y2 - y1 * x2;
	}
	//#endregion
	//#region fundamentals
	function attribute(name, size, instanced, putFunction, data) {
		const attr = {
			name,
			pointer: gl.getAttribLocation(glState.program, name),
			size,
			instanced,
			buffer: gl.createBuffer(),
			data: data ? data : new Float32Array(MAX_INSTANCES * size),
			changed: true,
			enabled: false,
			put: putFunction,
			set(start, end, done) {
				if (this.changed) {
					if (done) this.changed = false;

					if (!this.enabled) {
						this.enabled = true;
						gl.enableVertexAttribArray(this.pointer);
						gl.vertexAttribDivisor(this.pointer, +instanced);
					}
	
					gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
					const byteOffset = start * this.size * Float32Array.BYTES_PER_ELEMENT;
					const length = (end - start) * this.size;
					const view = new Float32Array(this.data.buffer, byteOffset, length);
					
					gl.bufferSubData(gl.ARRAY_BUFFER, 0, view);
					gl.vertexAttribPointer(this.pointer, this.size, gl.FLOAT, false, 0, 0);
				}
			}
		};


		gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer);
		gl.bufferData(gl.ARRAY_BUFFER, attr.data.length * 4, gl.DYNAMIC_DRAW);
		if (data) attr.set(0, data.length / size);

		attributes[name] = attr;

		return attr;
	}
	function create(canvas, pixelRatioHandled = false, pixelRatio = devicePixelRatio) {
		gl = canvas.getContext("webgl2", {
			stencil: false,
			depth: false,
			powerPreference: "low-power"
		});

		if (gl === null) throw new ReferenceError("Your browser doesn't support WebGL");

		// lost context listener
		canvas.addEventListener("webglcontextlost", event => {
			event.preventDefault();
			console.warn("WebGL Context Lost");
			glState.hasContext = false;
			glState.hasWebGLObjects = false;
		});
		canvas.addEventListener("webglcontextrestored", event => {
			event.preventDefault();
			console.warn("WebGL Context Restored");
			glState.hasContext = true;
			glState.hasWebGLObjects = false;
		});
		window.lc = gl.getExtension("WEBGL_lose_context");

		glState.hasContext = true;
		glState.hasWebGLObjects = false;

		glState.pixelRatioHandled = pixelRatioHandled;
		glState.pixelRatio = pixelRatio;
		glState.canvas = canvas;

		{ // do non-webgl related setup
			glState.transformMatrix = [
				1, 0, 0,
				0, 1, 0
			];
			glState.transformScaleX = 1;
			glState.transformScaleY = 1;

			// textured instance list (can't be larger than all instance list)
			glState.texturedInstanceList = new Array(MAX_INSTANCES);
			for (let i = 0; i < MAX_INSTANCES; i++) {
				glState.texturedInstanceList[i] = {
					// general data
					texture: null,
					index: -1,

					// texture coords
					tx: -1,
					ty: -1,
					txx: -1,
					txy: -1,
					tyx: -1,
					tyy: -1
				};
			}
			glState.texturedInstanceListPointer = 0;
		};
	}
	function guarenteeWebGLObjects() {
		if (glState.hasWebGLObjects) return;
		glState.hasWebGLObjects = true;

		{ // shaders
			function makeShader(type, source) {
				const shader = gl.createShader(type);
				gl.shaderSource(shader, source);
				gl.compileShader(shader);
				return shader;
			}
			glState.MAX_TEXTURE_SLOTS = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
			glState.TEXTURE_SLOT_SIZE = Math.min(4096, gl.getParameter(gl.MAX_TEXTURE_SIZE));
			glState.TEXTURE_SLOT_PIXEL_SIZE = 1 / glState.TEXTURE_SLOT_SIZE;
			const debugSlots = 0;//glState.MAX_TEXTURE_SLOTS;
			
			const webgl2 = !!window.WebGL2RenderingContext;
			const macros = `
				#define rshift(a, b) ${webgl2 ? "(a >> b)" : "(a / int(pow(2.0, float(b))))"}
				${webgl2 ? "#define and(a, b) (a & b)" : `
				int and(int a, int b) {
					int result = 0;
					for (int i = 0; i < 23; i++) {
						if (a == 0 && b == 0) return result;
						float fA = mod(float(a), 2.0);
						float fB = mod(float(b), 2.0);
						a /= 2;
						b /= 2;
						result += int(pow(2.0, float(i)) * fA * fB);
					}
					return result;
				}
			`}
				#define boolean(b) (and(iBooleans, b) != 0)
			`;

			const textureSelector = webgl2 ? `						switch (iTextureIndex) {
${new Array(glState.MAX_TEXTURE_SLOTS).fill(0).map((_, i) =>
   `							case ${i}: pixelColor = texture(textures[${i}], tuv); break;`
).join("\n")}
						}` : new Array(glState.MAX_TEXTURE_SLOTS).fill(0).map((_, i) =>
			`						${i ? "else " : ""}if (iTextureIndex == ${i}) pixelColor = texture(textures[${i}], tuv);`
).join("\n");

			const vs = `#version 300 es
				precision highp float;
				precision highp sampler2D;

				uniform vec2 resolution;
				
				in float vertexID;
				in float vertexColor;
				in float vertexAlpha;
				in float vertexLineWidth;
				in vec3 vertexTransformRow1;
				in vec3 vertexTransformRow2;
				in float vertexTextureIndex;
				in vec2 vertexTextureYAxis;
				in vec2 vertexTextureZAxis;
				in float vertexBooleans;
				
				out vec2 uv;
				out vec2 size;
				out vec3 color;
				out float alpha;
				out float lineWidth;
				out vec2 scaleFactor;
				out float textureIndex;
				out vec2 textureCoord;
				out vec2 textureCoordMin;
				out vec2 textureCoordMax;
				out float booleans;

				${macros}

				void main() {
					vec2 vertexPosition = vec2(
						mod(vertexID, 2.0),
						floor(vertexID / 2.0)
					); // generate vertices for square

					mat3 transform = mat3(
						vertexTransformRow1.x, vertexTransformRow2.x, 0.0,
						vertexTransformRow1.y, vertexTransformRow2.y, 0.0,
						vertexTransformRow1.z, vertexTransformRow2.z, 1.0
					);
					vec2 position = (transform * vec3(vertexPosition, 1.0)).xy;
					
					position /= resolution * 0.5;
					position -= 1.0;
					position.y *= -1.0;

					gl_Position = vec4(position, 0.0, 1.0);
					int iColor = int(vertexColor);
					color = vec3(
						rshift(iColor, 16),
						mod(float(rshift(iColor, 8)), 256.0),
						mod(float(iColor), 256.0)
					) / 255.0;
					alpha = vertexAlpha;

					uv = vertexPosition;

					size = vec2(length(transform[0]), length(transform[1]));
					booleans = vertexBooleans;
					lineWidth = vertexLineWidth;
					scaleFactor = vertexTextureYAxis;

					int iBooleans = int(booleans);
					if (boolean(${BOOLS.TEXTURED})) {
						textureIndex = vertexTextureIndex;

						vec2 vertexTextureXAxis = vec2(vertexColor, vertexLineWidth);
						textureCoord = vertexPosition.x * vertexTextureXAxis + vertexPosition.y * vertexTextureYAxis + vertexTextureZAxis;
						bool pixelated = boolean(${BOOLS.PIXELATED});
						
						vec2 tmin = vertexTextureZAxis;
						
						if (boolean(${BOOLS.TRIANGLE})) {
							vec2 tmax1 = vertexTextureZAxis + vertexTextureXAxis;
							vec2 tmax2 = vertexTextureZAxis + vertexTextureYAxis;
							textureCoordMin = min(tmin, min(tmax1, tmax2));
							textureCoordMax = max(tmin, max(tmax1, tmax2));
						} else {
							vec2 tmax = vertexTextureXAxis + vertexTextureYAxis + vertexTextureZAxis;

							textureCoordMin = min(tmin, tmax);
							textureCoordMax = max(tmin, tmax);
						}
						
						float inset = (pixelated ? 0.0001 : 0.5) * ${glState.TEXTURE_SLOT_PIXEL_SIZE};
						textureCoordMin += inset;
						textureCoordMax -= inset;
						
						if (min(textureCoordMin, textureCoordMax) != textureCoordMin) { // sub pixel
							vec2 pixelf = (textureCoordMin + textureCoordMax) * 0.5;
							vec2 pixeli = (floor(pixelf / ${glState.TEXTURE_SLOT_PIXEL_SIZE}) + 0.5) * ${glState.TEXTURE_SLOT_PIXEL_SIZE};
							textureCoordMin = textureCoordMax = pixeli;
						}
					}

				}
			`;
			const fs = `#version 300 es
				precision highp float;
				precision highp sampler2D;

				uniform sampler2D textures[${glState.MAX_TEXTURE_SLOTS}];
				uniform int renderPass;
				
				in vec2 uv;
				in vec2 size;
				in vec3 color;
				in float alpha;
				in float lineWidth;
				in vec2 scaleFactor;
				in float textureIndex;
				in float booleans;
				in vec2 textureCoord;
				in vec2 textureCoordMin;
				in vec2 textureCoordMax;
				
				out vec4 finalColor;

				#define SQRT_2 1.41421356237
				
				${macros}

				void main() {
					int iBooleans = int(booleans);

					float px;
					float antialias = 1.0;

					// finalColor = vec4(0.0, 0.0, 0.0, 0.1);
					// return;

					// // debug (triangulation)
					// finalColor = vec4(0.0, 0.0, 0.0, 0.0);
					// float csc = max(size.x, size.y);
					// if (
					// 	abs(uv.x * csc - (1.0 - uv.y) * csc) < 1.0
					// 	|| abs(uv.x - 0.5) > 0.5 - 1.0 / size.x
					// 	|| abs(uv.y - 0.5) > 0.5 - 1.0 / size.y
					// ) finalColor = vec4(1.0);
					// return;

					// vec3 color = vec3(1.0, 0.0, 0.0);
					// float alpha = 1.0;

					if (boolean(${BOOLS.CIRCLE})) {
						px = length(1.0 / size);
						vec2 cuv = uv - 0.5;
						float len = length(cuv);
						if (len > 0.5) discard;
						antialias *= smoothstep(0.5, 0.5 - px, len);

						if (boolean(${BOOLS.OUTLINED})) {
							vec2 cuv = uv - 0.5;
							cuv /= 1.0 - 2.0 * lineWidth * scaleFactor / size;
							float len = length(cuv);
							if (len < 0.5 - px) discard;
							antialias *= smoothstep(0.5 - px, 0.5, len);
						}
					} else if (boolean(${BOOLS.TRIANGLE})) {
						float d = dot(uv, vec2(SQRT_2));
						px = length(1.0 / size);
						if (d > SQRT_2 + px) discard;
						antialias *= smoothstep(SQRT_2 + px, SQRT_2, d);
					} else if (boolean(${BOOLS.LINE_SEGMENT})) {
						int lineCap = and(rshift(iBooleans, ${LINE_CAP_START_BIT}), ${0b11});
						int lineJoin = and(rshift(iBooleans, ${LINE_JOIN_START_BIT}), ${0b11});
						
						bool lineCapLeft = boolean(${BOOLS.LEFT_LINE_CAP});
						bool lineCapRight = boolean(${BOOLS.RIGHT_LINE_CAP});

						bool lineJoinRound = lineJoin == ${LINE_CAP_ROUND};
						bool lineCapRound = lineCap == ${LINE_CAP_ROUND};

						bool roundLeft = lineCapLeft ? lineCapRound : lineJoinRound;
						bool roundRight = lineCapRight ? lineCapRound : lineJoinRound;
						
						// add rounded edges
						vec2 suv = uv * size;
						float radius = size.y * 0.5;
						
						if (roundLeft && suv.x < radius) {
							float len = length(suv - radius);
							if (len > radius) discard;
							antialias *= smoothstep(radius, radius - 1.0, len);
						}

						if (roundRight && size.x - suv.x < radius) {
							float len = length(suv - vec2(size.x - radius, radius));
							if (len > radius) discard;
							antialias *= smoothstep(radius, radius - 1.0, len);
						}
					} else { // quad
						if (boolean(${BOOLS.OUTLINED})) {
							vec2 d = lineWidth * scaleFactor / size;
							vec2 dist = 0.5 - abs(uv - 0.5);
							vec2 px = 1.0 / size;
							if (dist.x > d.x + px.x && dist.y > d.y + px.y) discard;
							vec2 aa = smoothstep(d + px, d, dist);
							antialias *= min(1.0, aa.x + aa.y);
						}
					}

					vec4 pixelColor = vec4(color, 1.0);
 					if (boolean(${BOOLS.TEXTURED})) {
						vec2 tuv = clamp(textureCoord, textureCoordMin, textureCoordMax);
						if (boolean(${BOOLS.PIXELATED})) tuv = (floor(tuv / ${glState.TEXTURE_SLOT_PIXEL_SIZE}) + 0.5) * ${glState.TEXTURE_SLOT_PIXEL_SIZE};
 						int iTextureIndex = int(textureIndex);
${textureSelector}
					} else {
${new Array(debugSlots).fill(0).map((_, i) =>
				`						{
							float minX = ${(i / debugSlots).toFixed(10)};
							float maxX = ${((i + 1) / debugSlots).toFixed(10)};
							if (uv.x > minX && uv.x < maxX) pixelColor = texture(
								textures[${i}], vec2(
									(uv.x - minX) / (maxX - minX),
									uv.y
								)
							);
						};`
			).join("\n")}
					}

					// pixelColor = vec4(1.0, 0.0, 0.0, 1.0);

					// pixelColor.a += float(renderPass) / 5.0;

					
					finalColor = vec4(pixelColor.rgb, pixelColor.a * alpha * antialias);
					finalColor.a = clamp(finalColor.a, 0.0, 1.0);
					finalColor.rgb *= finalColor.a;
				}
			`;
			const vShader = makeShader(gl.VERTEX_SHADER, vs);
			const fShader = makeShader(gl.FRAGMENT_SHADER, fs);
			glState.program = gl.createProgram();
			gl.attachShader(glState.program, vShader);
			gl.attachShader(glState.program, fShader);
			gl.linkProgram(glState.program);
			gl.deleteShader(vShader);
			gl.deleteShader(fShader);

			if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) console.log(`vertex error: \n${gl.getShaderInfoLog(vShader)}`);
			if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) console.log(`fragment error: \n${gl.getShaderInfoLog(fShader)}`);
			if (!gl.getProgramParameter(glState.program, gl.LINK_STATUS)) console.log(`linking error: \n${gl.getShaderInfoLog(glState.program)}`);
			else gl.useProgram(glState.program);
		};
		{ // uniforms
			for (const name of ["resolution", "textures", "renderPass"]) uniforms[name] = gl.getUniformLocation(glState.program, name);
			gl.uniform1iv(uniforms.textures, new Int32Array(glState.MAX_TEXTURE_SLOTS).map((_, i) => i));
		};
		{ // context setup
			gl.clearColor(0, 0, 0, 0);
			gl.enable(gl.BLEND);

			if (glState.pixelRatioHandled) resize(glState.canvas.width / glState.pixelRatio, glState.canvas.height / glState.pixelRatio);
			else {
				glState.pixelRatioHandled = true;
				resize(glState.canvas.width, glState.canvas.height);
			}

			// custom state
			setBlendMode(glState.blendMode ?? BLEND_MODE_COMBINE);
			setGlobalAlpha(glState.globalAlpha ?? 1);
			setImageSmoothing(glState.imageSmoothing ?? false);

			glState.renderedInstances = 0;
			glState.drawCalls = 0;

			// textures
			if (glState.spriteSheets) {
				const { sheets } = glState.spriteSheets;
				for (let i = 0; i < sheets.length; i++)
					sheets[i].createTexture();
			} else glState.spriteSheets = {
				sheets: [],
				locations: new Map(),
				generation: 0,
			
				evict() {
					let oldestIndex = 0;
					let oldestTime = Infinity;
					for (let i = 0; i < this.sheets.length; i++) {
						const sheet = this.sheets[i];
						if (sheet.lastUse < oldestTime) {
							oldestTime = sheet.lastUse;
							oldestIndex = i;
						}
					}
					this.sheets[oldestIndex].clear();
				},

				update(image) {
					if (this.locations.has(image)) {
						const location = this.locations.get(image);
						const { sheet, width, height } = location;
						if (width === image.width && height === image.height) // overwrite
							sheet.write(image, location);
						else this.locations.delete(image);
					}
				},
			
				place(image) {
					if (this.locations.has(image)) {
						const location = this.locations.get(image);
						location.sheet.use(this.generation++);
						return location;
					}
			
					for (let i = 0; i < glState.MAX_TEXTURE_SLOTS; i++) {
						if (i >= this.sheets.length)
							this.sheets.push(new SpriteSheet(glState.TEXTURE_SLOT_SIZE, i, this.locations));
						const location = this.sheets[i].place(image);
						if (location) {
							location.sheet.use(this.generation++);
							return location;
						}
					}
			
					return null;
				}
			};
		};
		{ // attributes
			glState.instancePointer = 0;

			function putSize1(index, x) {
				this.data[index * this.size] = x;
				this.changed = true;
			}

			function putSize2(index, x, y) {
				index *= this.size;
				this.data[index] = x;
				this.data[index + 1] = y;
				this.changed = true;
			}
			
			function putSize3(index, x, y, z) {
				index *= this.size;
				this.data[index] = x;
				this.data[index + 1] = y;
				this.data[index + 2] = z;
				this.changed = true;
			}

			const position = attribute("vertexID", 1, false, putSize1, new Float32Array([0, 1, 2, 3]));
			glState.vertexCount = position.data.length / position.size;

			const color = attribute("vertexColor", 1, true, putSize1);
			const alpha = attribute("vertexAlpha", 1, true, putSize1);
			const lineWidth = attribute("vertexLineWidth", 1, true, putSize1);
			const textureIndex = attribute("vertexTextureIndex", 1, true, putSize1);
			const textureYAxis = attribute("vertexTextureYAxis", 2, true, putSize2);
			const textureXAxis = attribute("vertexTextureZAxis", 2, true, putSize2);
			const transform1 = attribute("vertexTransformRow1", 3, true, putSize3);
			const transform2 = attribute("vertexTransformRow2", 3, true, putSize3);
			const booleans = attribute("vertexBooleans", 1, true, putSize1);
		};

		glState.gl = gl;
	}
	function coloredInstance(
		m00, m10, m20,
		m01, m11, m21, // transform
		r, g, b, a, // color
		booleans // booleans
	) {
		if (!glState.hasContext) return;
		guarenteeWebGLObjects();

		const { transformMatrix } = glState;
		const M00 = transformMatrix[0];
		const M10 = transformMatrix[1];
		const M20 = transformMatrix[2];
		const M01 = transformMatrix[3];
		const M11 = transformMatrix[4];
		const M21 = transformMatrix[5];

		const index = glState.instancePointer;
		const {
			vertexColor,
			vertexAlpha,
			vertexTransformRow1,
			vertexTransformRow2,
			vertexBooleans
		} = attributes;

		vertexColor.put(index, clamp255(r) << 16 | clamp255(g) << 8 | clamp255(b));
		vertexAlpha.put(index, a * glState.globalAlpha);
		vertexTransformRow1.put(index, M00 * m00 + M10 * m01, M00 * m10 + M10 * m11, M00 * m20 + M10 * m21 + M20);
		vertexTransformRow2.put(index, M01 * m00 + M11 * m01, M01 * m10 + M11 * m11, M01 * m20 + M11 * m21 + M21);
		vertexBooleans.put(index, booleans);

		glState.instancePointer++;
		if (glState.instancePointer === MAX_INSTANCES) render();
	}
	function outlinedInstance(
		m00, m10, m20,
		m01, m11, m21, // transform
		r, g, b, a, // color
		lineWidth, // line width
		booleans // booleans
	) {
		if (!glState.hasContext) return;
		guarenteeWebGLObjects();

		const { transformMatrix } = glState;
		const M00 = transformMatrix[0];
		const M10 = transformMatrix[1];
		const M20 = transformMatrix[2];
		const M01 = transformMatrix[3];
		const M11 = transformMatrix[4];
		const M21 = transformMatrix[5];

		const index = glState.instancePointer;
		const {
			vertexColor,
			vertexAlpha,
			vertexLineWidth,
			vertexTextureYAxis,
			vertexTransformRow1,
			vertexTransformRow2,
			vertexBooleans
		} = attributes;

		const color = clamp255(r) << 16 | clamp255(g) << 8 | clamp255(b);
		vertexColor.put(index, color);
		vertexAlpha.put(index, a * glState.globalAlpha);
		vertexLineWidth.put(index, lineWidth);
		vertexTextureYAxis.put(index, glState.transformScaleX, glState.transformScaleY);
		vertexTransformRow1.put(index, M00 * m00 + M10 * m01, M00 * m10 + M10 * m11, M00 * m20 + M10 * m21 + M20);
		vertexTransformRow2.put(index, M01 * m00 + M11 * m01, M01 * m10 + M11 * m11, M01 * m20 + M11 * m21 + M21);
		vertexBooleans.put(index, booleans | BOOLS.OUTLINED);

		glState.instancePointer++;
		if (glState.instancePointer === MAX_INSTANCES) render();
	}
	function lineInstance(
		ax, ay, bx, by,
		lineWidth, lineCap, lineJoin,
		r, g, b, a,
		leftCap, rightCap
	) {
		if (!glState.hasContext) return;
		guarenteeWebGLObjects();

		// do vector math
		const vx = bx - ax;
		const vy = by - ay;
		const mag = magnitude(vx, vy);
		const mag1 = 1 / mag;
		const nx = -vy * mag1;
		const ny = vx * mag1;
		const lw2 = lineWidth * 0.5;

		const extendedJoin = lineJoin === LINE_JOIN_ROUND;
		const extendedCap = lineCap === LINE_CAP_SQUARE || lineCap === LINE_CAP_ROUND;

		const extendLeft = leftCap ? extendedCap : extendedJoin;
		const extendRight = rightCap ? extendedCap : extendedJoin;

		if (extendLeft || extendRight) {
			const factor = lw2 * mag1;
			const nvx = vx * factor;
			const nvy = vy * factor;

			if (extendLeft) {
				ax -= nvx;
				ay -= nvy;
			}
			if (extendRight) {
				bx += nvx;
				by += nvy;
			}

		}


		// construct transform
		const m00 = bx - ax;
		const m01 = by - ay;
		const m10 = nx * lineWidth;
		const m11 = ny * lineWidth;
		const m20 = ax - nx * lw2;
		const m21 = ay - ny * lw2;

		// create instance
		const { transformMatrix } = glState;
		const M00 = transformMatrix[0];
		const M10 = transformMatrix[1];
		const M20 = transformMatrix[2];
		const M01 = transformMatrix[3];
		const M11 = transformMatrix[4];
		const M21 = transformMatrix[5];

		const index = glState.instancePointer;
		const {
			vertexColor,
			vertexAlpha,
			vertexLineWidth,
			vertexTextureYAxis,
			vertexTransformRow1,
			vertexTransformRow2,
			vertexBooleans
		} = attributes;

		vertexColor.put(index, clamp255(r) << 16 | clamp255(g) << 8 | clamp255(b));
		vertexAlpha.put(index, a * glState.globalAlpha);
		vertexLineWidth.put(index, lineWidth);
		vertexTextureYAxis.put(index, glState.transformScaleX, glState.transformScaleY);
		vertexTransformRow1.put(index, M00 * m00 + M10 * m01, M00 * m10 + M10 * m11, M00 * m20 + M10 * m21 + M20);
		vertexTransformRow2.put(index, M01 * m00 + M11 * m01, M01 * m10 + M11 * m11, M01 * m20 + M11 * m21 + M21);
		vertexBooleans.put(index, BOOLS.LINE_SEGMENT | (leftCap ? BOOLS.LEFT_LINE_CAP : 0) | (rightCap ? BOOLS.RIGHT_LINE_CAP : 0) | lineCap << LINE_CAP_START_BIT | lineJoin << LINE_JOIN_START_BIT);

		glState.instancePointer++;
		if (glState.instancePointer === MAX_INSTANCES) render();
	}
	function texturedInstance(
		m00, m10, m20,
		m01, m11, m21, // transform
		tx, ty,
		txx, txy,
		tyx, tyy, // texture uvs
		image,
		booleans // booleans
	) {
		if (!glState.hasContext) return;
		guarenteeWebGLObjects();

		if (image.width > glState.TEXTURE_SLOT_SIZE || image.height > glState.TEXTURE_SLOT_SIZE) return;

		const { transformMatrix } = glState;
		const M00 = transformMatrix[0];
		const M10 = transformMatrix[1];
		const M20 = transformMatrix[2];
		const M01 = transformMatrix[3];
		const M11 = transformMatrix[4];
		const M21 = transformMatrix[5];

		const index = glState.instancePointer;
		const {
			vertexAlpha,
			vertexTransformRow1,
			vertexTransformRow2,
			vertexBooleans
		} = attributes;

		vertexAlpha.put(index, glState.globalAlpha);
		vertexBooleans.put(index, booleans | BOOLS.TEXTURED | (glState.imageSmoothing ? 0 : BOOLS.PIXELATED));
		vertexTransformRow1.put(index, M00 * m00 + M10 * m01, M00 * m10 + M10 * m11, M00 * m20 + M10 * m21 + M20);
		vertexTransformRow2.put(index, M01 * m00 + M11 * m01, M01 * m10 + M11 * m11, M01 * m20 + M11 * m21 + M21);

		const record = glState.texturedInstanceList[glState.texturedInstanceListPointer++];

		// general data
		record.texture = image;
		record.index = index;

		// texture coords
		record.tx = tx;
		record.ty = ty;
		record.txx = txx;
		record.txy = txy;
		record.tyx = tyx;
		record.tyy = tyy;

		glState.instancePointer++;
		if (glState.instancePointer === MAX_INSTANCES) render();
	}
	//#endregion
	//#region colored
	function coloredQuad(x, y, w, h, r, g, b, a) {
		coloredInstance(
			w, 0, x,
			0, h, y,
			r, g, b, a,
			BOOLS.NULL
		);
	}

	const ELLIPSE_ANTIALIAS_BUFFER = Math.SQRT1_2;

	function coloredEllipse(x, y, rx, ry, r, g, b, a) {
		rx += ELLIPSE_ANTIALIAS_BUFFER;
		ry += ELLIPSE_ANTIALIAS_BUFFER;
		coloredInstance(
			rx * 2, 0, x - rx,
			0, ry * 2, y - ry,
			r, g, b, a,
			BOOLS.CIRCLE
		);
	}
	function coloredTriangle(ax, ay, bx, by, cx, cy, r, g, b, a) {
		coloredInstance(
			bx - ax, cx - ax, ax,
			by - ay, cy - ay, ay,
			r, g, b, a,
			BOOLS.TRIANGLE
		);
	}
	function coloredPolygon(vertices, red, green, blue, alpha) {
		const triangles = vertices.length - 2;

		const { x, y } = vertices[0];

		for (let i = 0; i < triangles; i++) {
			const b = vertices[i + 1];
			const c = vertices[i + 2];
			coloredTriangle(
				x, y,
				b.x, b.y,
				c.x, c.y,
				red, green, blue, alpha
			);
		}
	}
	//#endregion
	//#region outlined
	function outlinedQuad(x, y, w, h, lineWidth, r, g, b, a) {
		const lw2 = lineWidth * 0.5;
		outlinedInstance(
			w + lineWidth, 0, x - lw2,
			0, h + lineWidth, y - lw2,
			r, g, b, a, lineWidth,
			BOOLS.NULL
		);
	}
	function outlinedEllipse(x, y, rx, ry, lineWidth, r, g, b, a) {
		rx += ELLIPSE_ANTIALIAS_BUFFER;
		ry += ELLIPSE_ANTIALIAS_BUFFER;
		const lw2 = lineWidth * 0.5;
		outlinedInstance(
			rx * 2 + lineWidth, 0, x - rx - lw2,
			0, ry * 2 + lineWidth, y - ry - lw2,
			r, g, b, a, lineWidth,
			BOOLS.CIRCLE
		);
	}
	function lineSegment(ax, ay, bx, by, lineWidth, lineCap, r, g, b, a) {
		if (ax === bx && ay === by) {
			const lw2 = lineWidth * 0.5;
			if (lineCap === LINE_CAP_ROUND) coloredEllipse(ax, ay, lw2, lw2, r, g, b, a);
			else if (lineCap === LINE_CAP_SQUARE) coloredQuad(ax - lw2, ay - lw2, lineWidth, lineWidth, r, g, b, a);
		} else lineInstance(
			ax, ay, bx, by,
			lineWidth, lineCap, LINE_JOIN_NOT_APPLICABLE,
			r, g, b, a,
			true, true
		);
	}
	function lineSegments(points, lineWidth, lineCap, lineJoin, red, green, blue, alpha, closed = false, noDuplicates = false, copy = true) {
		if (closed) points.push(points[0]);
		if (!noDuplicates) {
			const newPoints = [points[0]];
			for (let i = 0; i < points.length - 1; i++) {
				const a = points[i];
				const b = points[i + 1];
				if (b.x - a.x || b.y - a.y) newPoints.push(b);
			}
			points = newPoints;
		}
		if (points.length < 2) return;
		if (copy && noDuplicates) points = points.slice();

		const lw2 = lineWidth * 0.5;

		const normals = [];
		if (lineJoin !== LINE_JOIN_ROUND) for (let i = 0; i < points.length - 1; i++) {
			const a = points[i];
			const b = points[i + 1];

			const vx = b.x - a.x;
			const vy = b.y - a.y;
			const mag = magnitude(vx, vy);
			const factor = lw2 / mag;
			const nx = -vy;
			const ny = vx;

			normals.push(nx * factor, ny * factor);
		}

		const open = !closed;

		for (let i = 0; i < points.length - 1; i++) {
			const a = points[i];
			const b = points[i + 1];

			const leftCap = i === 0;
			const rightCap = i === points.length - 4;

			// draw segment
			lineInstance(a.x, a.y, b.x, b.y, lineWidth, lineCap, lineJoin, red, green, blue, alpha, leftCap && open, rightCap && open);

			if ((!rightCap || closed) && lineJoin !== LINE_JOIN_ROUND) {
				// do non round line joins
				const nx1 = normals[i * 2 + 0];
				const ny1 = normals[i * 2 + 1];
				const atLoopPoint = rightCap && closed;
				const nx2 = atLoopPoint ? normals[0] : normals[i * 2 + 2];
				const ny2 = atLoopPoint ? normals[1] : normals[i * 2 + 3];

				// interestingly, beveling and mitering have the same first step
				const sign = -Math.sign(cross(nx1, ny1, nx2, ny2));

				const Ax = b.x + nx1 * sign;
				const Ay = b.y + ny1 * sign;
				const Cx = b.x + nx2 * sign;
				const Cy = b.y + ny2 * sign;
				const Dx = (Ax + Cx) * 0.5;
				const Dy = (Ay + Cy) * 0.5;

				coloredTriangle(Ax, Ay, b.x, b.y, Cx, Cy, red, green, blue, alpha);

				if (lineJoin === LINE_JOIN_MITER) {
					const miterNormalX = Dx - b.x;
					const miterNormalY = Dy - b.y;
					const mag2 = miterNormalX ** 2 + miterNormalY ** 2;

					const factor = (lw2 ** 2) / mag2 - 1;
					const mnx = miterNormalX * factor;
					const mny = miterNormalY * factor;

					coloredTriangle(Dx + mnx, Dy + mny, Ax, Ay, Cx, Cy, red, green, blue, alpha);
				}
			}
		}
	}
	function outlinedTriangle(ax, ay, bx, by, cx, cy, lineWidth, lineJoin, r, g, b, a) {
		lineSegments([
			ax, ay,
			bx, by,
			cx, cy
		], lineWidth, LINE_CAP_NOT_APPLICABLE, lineJoin, r, g, b, a, true, true, false);
	}
	function outlinedPolygon(vertices, lineWidth, lineJoin, r, g, b, a) {
		lineSegments(vertices, lineWidth, LINE_CAP_NOT_APPLICABLE, lineJoin, r, g, b, a, true, false, true);
	}
	//#endregion
	//#region textured
	function texturedQuad(x, y, w, h, tx, ty, tw, th, image) {
		texturedInstance(
			w, 0, x,
			0, h, y,
			tx, ty,
			tw, 0,
			0, th,
			image,
			BOOLS.NULL
		);
	}
	function texturedEllipse(x, y, rx, ry, tx, ty, tw, th, image) {
		rx += ELLIPSE_ANTIALIAS_BUFFER;
		ry += ELLIPSE_ANTIALIAS_BUFFER;
		texturedInstance(
			rx * 2, 0, x - rx,
			0, ry * 2, y - ry,
			tx, ty,
			tw, 0,
			0, th,
			image,
			BOOLS.CIRCLE
		);
	}
	function texturedTriangle(ax, ay, bx, by, cx, cy, tax, tay, tbx, tby, tcx, tcy, image) {
		texturedInstance(
			bx - ax, cx - ax, ax,
			by - ay, cy - ay, ay,
			tax, tay,
			tbx - tax, tby - tay,
			tcx - tax, tcy - tay,
			image,
			BOOLS.TRIANGLE
		);
	}
	function texturedPolygon(vertices, textureVertices, image) {
		const triangles = vertices.length - 2;

		const { x, y } = vertices[0];
		const { x: tx, y: ty } = textureVertices[0];

		for (let i = 0; i < triangles; i++) {
			const b = vertices[i + 1];
			const c = vertices[i + 2];
			const tb = textureVertices[i + 1];
			const tc = textureVertices[i + 2];
			texturedTriangle(
				x, y,
				b.x, b.y,
				c.x, c.y,
				tx, ty,
				tb.x, tb.y,
				tc.x, tc.y,
				image
			);
		}
	}
	//#endregion
	//#region set state
	function setImageSmoothing(smooth) {
		glState.imageSmoothing = smooth;
	}
	function setBlendMode(blendMode) {
		if (!glState.hasContext) return;

		if (glState.blendMode === blendMode) return;
		if (glState.blendMode !== undefined) render();

		glState.blendMode = blendMode;

		switch (blendMode) {
			case BLEND_MODE_ADD:
				gl.blendFunc(gl.ONE, gl.ONE);
				break;
			case BLEND_MODE_COMBINE:
				gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
				break;
			case BLEND_MODE_BEHIND:
				gl.blendFunc(gl.ONE_MINUS_DST_ALPHA, gl.ONE);
				break;
		}
	}
	function setGlobalAlpha(alpha) {
		glState.globalAlpha = alpha;
	}
	function setTransform(transform) {
		const m00 = transform[0];
		const m01 = transform[1];
		const m10 = transform[3];
		const m11 = transform[4];
		const m20 = transform[6];
		const m21 = transform[7];
		
		const matrix = glState.transformMatrix;
		matrix[0] = m00;
		matrix[1] = m10;
		matrix[2] = m20;
		matrix[3] = m01;
		matrix[4] = m11;
		matrix[5] = m21;
		glState.transformScaleX = Math.sqrt(m00 * m00 + m01 * m01);
		glState.transformScaleY = Math.sqrt(m10 * m10 + m11 * m11);
	}
	//#endregion
	//#region large scale canvas changes
	function resize(width, height) {
		gl.canvas.width = Math.floor(width * glState.pixelRatio);
		gl.canvas.height = Math.floor(height * glState.pixelRatio);

		if (!glState.hasContext) return;
		guarenteeWebGLObjects();

		gl.uniform2f(uniforms.resolution, width, height);
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	}
	function clear() {
		if (!glState.hasContext) return;

		gl.clear(gl.COLOR_BUFFER_BIT);
		glState.instancePointer = 0;
		glState.texturedInstanceListPointer = 0;

		// performance stats
		glState.renderedInstances = 0;
		glState.drawCalls = 0;
	}
	function renderRange(start, end, done = false) {
		if (start >= end) return;

		attributes.vertexColor.set(start, end, done);
		attributes.vertexAlpha.set(start, end, done);
		attributes.vertexLineWidth.set(start, end, done);
		attributes.vertexTextureIndex.set(start, end, done);
		attributes.vertexTextureYAxis.set(start, end, done);
		attributes.vertexTextureZAxis.set(start, end, done);
		attributes.vertexTransformRow1.set(start, end, done);
		attributes.vertexTransformRow2.set(start, end, done);
		attributes.vertexBooleans.set(start, end, done);

		// window.batchSizes.push(end - start);
		// window.batchUnits.push([...glState.spriteSheets.activeSpriteSheets].sort((a, b) => a.textureUnit - b.textureUnit).map(sheet => sheet.id));

		gl.uniform1i(uniforms.renderPass, glState.drawCalls);

		const instances = end - start;
		gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, glState.vertexCount, instances);

		// performance stats
		glState.renderedInstances += instances;
		glState.drawCalls++;
	}
	

	class SpriteLocation {
		constructor(image, sheet, x, y) {
			this.sheet = sheet;
			this.x = x;
			this.y = y;
			this.width = image.width;
			this.height = image.height;
			this.tx = x / sheet.size;
			this.ty = y / sheet.size;
			this.tw = image.width / sheet.size;
			this.th = image.height / sheet.size;
		}
	}

	class SpriteSheet {
		constructor(size, unit, locations) {
			this.size = size;
			this.images = [];
			this.unit = unit;
			this.locations = locations;
			this.lastUse = -Infinity;
			this.clear();

			this.createTexture();
		}
		use(time) {
			this.lastUse = time;
		}
		createTexture() {
			const { size } = this;

			this.texture = gl.createTexture();
			gl.activeTexture(gl.TEXTURE0 + this.unit);
			gl.bindTexture(gl.TEXTURE_2D, this.texture);

			// initialize
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		
			for (let i = 0; i < this.images.length; i++) {
				const image = this.images[i];
				this.write(image, this.locations.get(image));
			}
		}
		write(image, location) {
			gl.activeTexture(gl.TEXTURE0 + this.unit);
			gl.texSubImage2D(gl.TEXTURE_2D, 0, location.x, location.y, gl.RGBA, gl.UNSIGNED_BYTE, image);
		}
		clear() {
			for (let i = 0; i < this.images.length; i++)
				this.locations.delete(this.images[i]);
			this.images = [];
			this.spaces = [new Rect(0, 0, this.size, this.size)];
			this.maxArea = Infinity;
		}
		add(image, x, y) {
			this.images.push(image);
			const location = new SpriteLocation(image, this, x, y);
			this.locations.set(image, location);
			this.write(image, location);
			return location;
		}
		place(image) {
			const { spaces } = this;

			if (this.maxArea < image.width * image.height)
				return null;

			this.maxArea = Math.max(...spaces.map(space => space.width * space.height));

			for (let j = spaces.length - 1; j >= 0; j--) {
				const space = spaces[j];
				if (space.width < image.width || space.height < image.height)
					continue;

				const matchWidth = space.width === image.width;
				const matchHeight = space.height === image.height;
				const { x, y } = space;
				if (matchWidth && matchHeight) {
					spaces.splice(j, 1);
					return this.add(image, x, y);
				} else if (matchWidth) {
					space.y += image.height;
					space.height -= image.height;
					return this.add(image, x, y);
				} else if (matchHeight) {
					space.x += image.width;
					space.width -= image.width;
					return this.add(image, x, y);
				} else {
					if ((space.width - image.width) * space.height > (space.height - image.height) * space.width) {
						spaces.push(new Rect(space.x, space.y + image.height, image.width, space.height - image.height));
						space.x += image.width;
						space.width -= image.width;
					} else {
						spaces.push(new Rect(space.x + image.width, space.y, space.width - image.width, image.height));
						space.y += image.height;
						space.height -= image.height;
					}
					return this.add(image, x, y);
				}

			}
			
			return null;
		}
	}

	function updateTextureCache(texture) {
		glState.spriteSheets.update(texture);
	}
	function flush() {
		const { spriteSheets } = glState;

		const {
			vertexTextureIndex,
			vertexColor,
			vertexLineWidth,
			vertexTextureYAxis,
			vertexTextureZAxis
		} = attributes;

		let start = 0;
		let end = 0;

		// window.batchSizes = [];
		// window.batchUnits = [];

		for (let i = 0; i < glState.texturedInstanceListPointer; i++) {
			const { index, texture, tx, ty, txx, txy, tyx, tyy } = glState.texturedInstanceList[i];
			let location = spriteSheets.place(texture);
			if (location === null) {
				renderRange(start, end);
				spriteSheets.evict();
				start = end;
				location = spriteSheets.place(texture);
			}

			// set attribute data
			const { tx: x, ty: y, tw: width, th: height, sheet: { unit } } = location;
			vertexTextureIndex.put(index, unit);
			vertexColor.put(index, txx * width);
			vertexLineWidth.put(index, txy * height);
			vertexTextureYAxis.put(index, tyx * width, tyy * height);
			vertexTextureZAxis.put(index, x + tx * width, y + ty * height);

			// increment instance index
			end = index + 1;
		}

		renderRange(start, glState.instancePointer, true);
	}
	function render() {
		if (!glState.hasContext) return;
		guarenteeWebGLObjects();

		flush();
		// render(0, glState.instancePointer);

		glState.instancePointer = 0;
		glState.texturedInstanceListPointer = 0;
	}
	//#endregion
	//#region export
	const exports = {
		create, resize,
		coloredQuad, coloredEllipse, coloredTriangle, coloredPolygon,
		outlinedQuad, outlinedEllipse, outlinedTriangle, outlinedPolygon, lineSegment, lineSegments,
		texturedQuad, texturedEllipse, texturedTriangle, texturedPolygon, updateTextureCache,
		setTransform, setBlendMode, setGlobalAlpha, setImageSmoothing,
		clear, render,
		BLEND_MODE_ADD, BLEND_MODE_COMBINE, BLEND_MODE_BEHIND,
		LINE_JOIN_MITER, LINE_JOIN_BEVEL, LINE_JOIN_ROUND,
		LINE_CAP_FLAT, LINE_CAP_ROUND, LINE_CAP_SQUARE
	};
	for (const key in exports) bound[key] = exports[key];
	if (debug) {
		bound.attributes = attributes;
		bound.glState = glState;
	}
	//#endregion

	return bound;
}