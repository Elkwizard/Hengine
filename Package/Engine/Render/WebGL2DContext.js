function defineWebGL2DContext(bound = { }, debug = false) {
	let gl = null;
	const glState = {};
	const glAttributes = {};
	const glShaders = {};
	let drawCallCount = 0;
	let clearCount = 0;

	//#region constants

	// DRAW_TYPE:
	const GL_COLORED = 0b00000000;
	const GL_TEXTURED = 0b00000001;
	const GL_LINE = 0b00000010;
	const GL_OUTLINED_QUAD = 0b00000011;

	// DRAW_SPEC:
	const GL_TRIANGLE_1 = 0b00000000;
	const GL_TRIANGLE_2 = 0b00010000;

	// BLEND MODE
	const BLEND_MODE_COMBINE = 0x00;
	const BLEND_MODE_ADD = 0x01;

	//#endregion

	//#region attributes
	function createAttribute(name, unitSize) {
		let attr = {
			name,
			buffer: gl.createBuffer(),
			pointer: gl.getAttribLocation(glState.program.shaderProgram, name),
			data: new Float32Array(unitSize * glState.MAX_BATCH_TRIS * 3),
			unitSize,
			changed: false
		};
		glAttributes[name] = attr;


		// enable attribute
		setAttribute(name, true);
		gl.enableVertexAttribArray(attr.pointer);

	}

	function setAttribute(name, initialize = false) {
		let attr = glAttributes[name];

		if (!initialize) {
			if (!attr.changed) return;
			attr.changed = false;
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer);
		gl.bufferData(gl.ARRAY_BUFFER, attr.data, gl.DYNAMIC_DRAW);

		gl.vertexAttribPointer(attr.pointer, attr.unitSize, gl.FLOAT, false, 0, 0);
	}

	function destroyAttribute(name) {
		const attr = glAttributes[name];
		gl.deleteBuffer(attr.buffer);
	}
	//#endregion

	//#region resolution
	function resize(width, height) {
		glState.width = width;
		glState.height = height;
		gl.canvas.width = width * devicePixelRatio;
		gl.canvas.height = height * devicePixelRatio;
		updateResolution();
	}

	function updateResolution() {
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		gl.uniform2f(glState.program.uniforms.resolution, gl.canvas.width / devicePixelRatio, gl.canvas.height / devicePixelRatio);
	}
	//#endregion

	//#region basic
	
	function create(canvas) {
		gl = canvas.getContext("webgl2");

		glState.contextExists = true;

		gl.canvas.addEventListener("webglcontextlost", e => {
			e.preventDefault();
			glState.contextExists = false;
			console.warn("WebGL context lost");
		});
		gl.canvas.addEventListener("webglcontextrestored", e => {
			setup(canvas);
			glState.contextExists = true;
			console.warn("WebGL context restored");
		});

		setup();

		const loseContext = gl.getExtension("WEBGL_lose_context");
		// loseContext.loseContext();
		// loseContext.restoreContext();

		window.lc = loseContext;

		if (debug) bound.gl = gl;
	}

	function setup() {
		glState.derivativeExt = gl.getExtension("OES_standard_derivatives");


		const MAX_VECTORS = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS) - 1;
		const MAX_3X3_MATRICES = Math.floor(MAX_VECTORS / 3);

		glState.MAX_BATCH_TRIS = 10000;
		glState.MAX_BATCH_TRANSFORMS = MAX_3X3_MATRICES;
		glState.currentTriIndex = 0;

		// textures
		glState.MAX_TEXTURE_UNITS = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);

		const textureSelectionGLSL = `
switch (int(textureIndex)) {
${new Array(glState.MAX_TEXTURE_UNITS).fill(0).map((v, i) => {
			return `\tcase ${i}:\n\t\tpixelColor = texture(textures[${i}], textureCoord);\n\t\tbreak;`;
		}).join("\n")}
}
			`;

		// colors

		glShaders.vertex = `#version 300 es
				in highp vec2 vertexPosition;
				in highp float vertexTransformIndex;
				in highp vec3 vertexColor;
				in highp float vertexAlpha;
				in highp float vertexCircleRadius;
				in highp float vertexTextureIndex;
				in highp vec2 vertexTexturePosition;
				in highp float vertexType;
				in highp float vertexLineWidth;
				in highp vec2 vertexLineNormal;

				uniform highp mat3 vertexTransforms[${glState.MAX_BATCH_TRANSFORMS}];
				uniform highp vec2 resolution;

				out highp vec3 color;
				out highp float circleRadius;
				out highp float textureIndex;
				out highp vec2 textureCoord;
				out highp float type;
				out highp vec2 uv;
				out highp vec2 position;
				out highp float alpha;
				out highp float lineWidth;

				void main() {
					highp vec2 pos = vertexPosition;
	
					highp int DRAW_TYPE = int(vertexType) & 15;
					highp int DRAW_SPEC = int(vertexType) >> 4;

					highp int vertexIndex = int(mod(float(gl_VertexID), 3.0));

					if (DRAW_TYPE == ${GL_LINE}) {
						// not a circle, turn vertices into line segments
						pos += vertexLineNormal * vertexLineWidth / 2.0;
					}

					if (DRAW_SPEC == ${GL_TRIANGLE_1}) {
						if (vertexIndex == 0) uv = vec2(0.0, 0.0);
						else if (vertexIndex == 1) uv = vec2(1.0, 0.0);
						else if (vertexIndex == 2) uv = vec2(0.0, 1.0);
					} else {
						if (vertexIndex == 0) uv = vec2(1.0, 1.0);
						else if (vertexIndex == 1) uv = vec2(1.0, 0.0);
						else if (vertexIndex == 2) uv = vec2(0.0, 1.0);
					}

					highp float some = vertexTransformIndex;
					pos = (vertexTransforms[int(vertexTransformIndex)] * vec3(pos, 1.0)).xy;
					gl_Position = vec4(pos.x / resolution.x * 2.0 - 1.0, 1.0 - pos.y / resolution.y * 2.0, 0.0, 1.0);

					// out
					color = vertexColor;
					circleRadius = vertexCircleRadius;
					textureIndex = vertexTextureIndex;
					textureCoord = vertexTexturePosition;
					position = vertexPosition;
					alpha = vertexAlpha;
					type = vertexType;
					lineWidth = vertexLineWidth;


				}
			`;

		glShaders.fragment = `#version 300 es
				in highp vec2 position;
				in highp vec3 color;
				in highp float alpha;
				in highp float circleRadius;
				in highp float textureIndex;
				in highp vec2 textureCoord;
				in highp float type;
				in highp vec2 uv;
				in highp float lineWidth;

				uniform highp sampler2D textures[${glState.MAX_TEXTURE_UNITS}];

				out highp vec4 pixelColor;

				highp float slope(highp float value) {
					return length(vec2(dFdx(value), dFdy(value)));
				}

				void main() {
					highp int DRAW_TYPE = int(type) & 15;
					highp int DRAW_SPEC = int(type) >> 4;

					if (DRAW_TYPE == ${GL_COLORED} || DRAW_TYPE == ${GL_LINE} || DRAW_TYPE == ${GL_OUTLINED_QUAD}) {
						pixelColor = vec4(color, alpha);	
					} else if (DRAW_TYPE == ${GL_TEXTURED}) {
						${textureSelectionGLSL}
						pixelColor.a *= alpha;
					}
					
					highp float antialias = 1.0;

					if (DRAW_TYPE == ${GL_OUTLINED_QUAD}) {

						highp vec2 UV = uv - 0.5;

						UV.x /= 1.0 - slope(UV.x) * lineWidth * 2.5;
						UV.y /= 1.0 - slope(UV.y) * lineWidth * 2.5;

						
						if (circleRadius < 0.0) {
							if (UV.x < 0.5 && UV.y < 0.5 && UV.x > -0.5 && UV.y > -0.5) {
								highp float o = max(slope(UV.x), slope(UV.y)) * 0.1;
								antialias *= 1.0 - smoothstep(abs(UV.x), 0.5, 0.5 - o) + 1.0 - smoothstep(abs(UV.y), 0.5, 0.5 - o);
							}
						} else if (circleRadius > 0.0) {
							highp float o = 0.5 / circleRadius;
						
							highp float ilen = length(UV);

							if (ilen < 0.5 - o) discard;
							antialias *= smoothstep(0.5 - o, 0.5 + o, ilen);
						}
					}


					if (circleRadius >= 0.0) {
						highp vec2 UV = uv - 0.5;

						highp float circleRadius = min(1.0 / slope(UV.x), 1.0 / slope(UV.y));

						highp float len = length(UV); 
						
						highp float o = 0.5 / circleRadius;
						
						if (len > 0.5 + o) discard; 
						antialias *= smoothstep(0.5 + o, 0.5 - o, len);
					}
					pixelColor.a *= antialias; 
					pixelColor.rgb *= clamp(pixelColor.a, 0.0, 1.0);
				}
			`;

		glState.program = createProgram("vertex", "fragment", ["vertexTransforms", "textures", "resolution"]);


		glState.imageTextureMap = new Map();
		glState.textureIndexMap = new Map();
		glState.currentTextureIndex = 0;
		glState.activeTextureIndex = 0;
		glState.textures = [];

		const textureIndexList = new Int32Array(glState.MAX_TEXTURE_UNITS).fill(0).map((v, i) => i);

		gl.useProgram(glState.program.shaderProgram);

		gl.uniform1iv(glState.program.uniforms.textures, textureIndexList);

		// general attributes
		createAttribute("vertexPosition", 2);
		createAttribute("vertexTransformIndex", 1);
		createAttribute("vertexCircleRadius", 1);
		createAttribute("vertexType", 1);
		createAttribute("vertexAlpha", 1);

		// color attributes
		createAttribute("vertexColor", 3);

		// outline attributes
		createAttribute("vertexLineWidth", 1);
		createAttribute("vertexLineNormal", 2);

		// texture attributes
		createAttribute("vertexTexturePosition", 2);
		createAttribute("vertexTextureIndex", 1);

		// uniforms
		glState.transformData = new Float32Array(glState.MAX_BATCH_TRANSFORMS * 9);
		glState.currentTransformIndex = 0;
		glState.shouldIncrementTransform = false;

		glState.vertexCountTriangulationMap = new Map();

		for (let i = 0; i < glState.MAX_BATCH_TRIS; i++) {
			glState.transformData[i * 9 + 0] = 1;
			glState.transformData[i * 9 + 4] = 1;
			glState.transformData[i * 9 + 8] = 1;
		}

		gl.enable(gl.BLEND);

		setBlendMode(glState.blendMode ?? BLEND_MODE_COMBINE);
		setImageSmoothing(glState.imageSmoothing ?? false);
		setGlobalAlpha(glState.globalAlpha ?? 1);
		setTransform(glState.currentTransform ?? [
			1, 0, 0,
			0, 1, 0,
			0, 0, 1
		]);
		resize(glState.width ?? gl.canvas.width, glState.height ?? gl.canvas.height);

		glState.miterLimit = 0.1;

		gl.clearColor(0, 0, 0, 0);
	}

	function destroy() {
		for (let name in glAttributes) destroyAttribute(name);
		for (let i = 0; i < glState.textures.length; i++) gl.deleteTexture(glState.textures[i]);
		gl.useProgram(null);
		gl.deleteProgram(glState.program.shaderProgram);
		gl.deleteShader(glState.program.vertexShader);
		gl.deleteShader(glState.program.fragmentShader);
	}
	
	function createProgram(vsName, fsName, uniformNames = []) {
		let error = null;

		function compileShader(type, source) {
			let shader = gl.createShader(type);
			gl.shaderSource(shader, source);
			gl.compileShader(shader);
			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
				error = gl.getShaderInfoLog(shader);
				return false;
			}
			return shader;
		}

		const vertexShader = compileShader(gl.VERTEX_SHADER, glShaders[vsName]);
		if (error) console.log("vertex error: " + error);
		error = null;
		const fragmentShader = compileShader(gl.FRAGMENT_SHADER, glShaders[fsName]);
		if (error) console.log("fragment error: " + error);
		const shaderProgram = gl.createProgram();
		gl.attachShader(shaderProgram, vertexShader);
		gl.attachShader(shaderProgram, fragmentShader);
		gl.linkProgram(shaderProgram);

		let uniforms = {};

		for (let i = 0; i < uniformNames.length; i++) {
			uniforms[uniformNames[i]] = gl.getUniformLocation(shaderProgram, uniformNames[i]);
		}

		return {
			vertexShaderName: vsName,
			fragmentShaderName: fsName,
			vertexShader,
			fragmentShader,
			shaderProgram,
			uniforms
		};
	}

	//#endregion

	//#region set state
	function setTransform(matrix, rowMajor = false) {
		if (glState.shouldIncrementTransform) {
			glState.currentTransformIndex++;
			glState.shouldIncrementTransform = false;

			if (glState.currentTransformIndex * 9 === glState.transformData.length) {
				// overflow!
				render();
				glState.currentTransformIndex = 0;
			}
		}


		const transformIndex = glState.currentTransformIndex * 9;
		const transformData = glState.transformData;

		if (rowMajor) matrix = [
			matrix[0], matrix[3], matrix[6],
			matrix[1], matrix[4], matrix[7],
			matrix[2], matrix[5], matrix[8]
		];

		glState.currentTransform = matrix;

		// write to uniform buffer
		transformData[transformIndex + 0] = matrix[0];
		transformData[transformIndex + 1] = matrix[1];
		// transformData[transformIndex + 2] = matrix[2];
		transformData[transformIndex + 3] = matrix[3];
		transformData[transformIndex + 4] = matrix[4];
		// transformData[transformIndex + 5] = matrix[5];
		transformData[transformIndex + 6] = matrix[6];
		transformData[transformIndex + 7] = matrix[7];
		// transformData[transformIndex + 8] = matrix[8];
	}

	function setImageSmoothing(smooth) {
		const param = smooth ? gl.LINEAR : gl.NEAREST;
		for (let i = 0; i < glState.textures.length; i++) {
			let tex = glState.textures[i];

			gl.bindTexture(gl.TEXTURE_2D, tex);

			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
		}

		glState.imageSmoothing = smooth;

		// reset original active texture unit
		gl.bindTexture(gl.TEXTURE_2D, glState.textures[glState.activeTextureIndex]);
	}

	function setBlendMode(mode) {
		glState.blendMode = mode;

		switch (mode) {
			case BLEND_MODE_ADD:
				gl.blendFunc(gl.ONE, gl.ONE);
				break;
			case BLEND_MODE_COMBINE:
				gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
				break;
		}

	}

	function setGlobalAlpha(alpha) {
		glState.globalAlpha = alpha;
	}
	//#endregion

	//#region render commands
	function clear() {
		render();
		gl.clear(gl.COLOR_BUFFER_BIT);
		clearCount++;
		bound.drawCallsPerClear = drawCallCount / clearCount;
	}

	function render() {
		if (!glState.currentTriIndex) return;

		// general
		setAttribute("vertexPosition");
		setAttribute("vertexTransformIndex");
		setAttribute("vertexCircleRadius");
		setAttribute("vertexType");
		setAttribute("vertexAlpha");

		// colored
		setAttribute("vertexColor");

		// outlined
		setAttribute("vertexLineWidth");
		setAttribute("vertexLineNormal");

		// textured
		setAttribute("vertexTexturePosition");
		setAttribute("vertexTextureIndex");

		gl.uniformMatrix3fv(glState.program.uniforms.vertexTransforms, false, glState.transformData);

		gl.drawArrays(gl.TRIANGLES, 0, glState.currentTriIndex * 3);

		glState.currentTriIndex = 0;

		drawCallCount++;
	}
	//#endregion

	//#region geometry
	function getDot(x, y, x2, y2) {
		return x * x2 + y * y2;
	}
	function getMagnitude(x, y) {
		const m2 = x ** 2 + y ** 2;
		return m2 ? Math.sqrt(m2) : Infinity;
	}
	function triangulate(vertexCount) {
		if (vertexCount < 3) return [];

		if (glState.vertexCountTriangulationMap.has(vertexCount)) return glState.vertexCountTriangulationMap.get(vertexCount);

		const result = [];

		const triangleCount = vertexCount - 2;
		for (let i = 0; i < triangleCount; i++) {
			result.push(0, i + 1, i + 2);
		}

		glState.vertexCountTriangulationMap.set(vertexCount, result);

		return result;
	}
	//#endregion

	//#region general
	function writeTriangleAttributeData(ax, ay, bx, by, cx, cy, alpha, radius, vertexType) {
		if (!glState.contextExists) return;

		const av = glAttributes.vertexPosition;
		const avr = glAttributes.vertexCircleRadius;
		const avtri = glAttributes.vertexTransformIndex;
		const avt = glAttributes.vertexType;
		const ava = glAttributes.vertexAlpha;
		const vertexPositionIndex = glState.currentTriIndex * av.unitSize * 3;
		const vertexAlphaIndex = glState.currentTriIndex * ava.unitSize * 3;
		const vertexTransformIndexIndex = glState.currentTriIndex * avtri.unitSize * 3;
		const vertexRadiusIndex = glState.currentTriIndex * avr.unitSize * 3;
		const vertexTypeIndex = glState.currentTriIndex * avt.unitSize * 3;
		const vertexTransformIndex = glState.currentTriIndex * 9 /* size of matrix */;

		glState.currentTriIndex++;

		// vertex positions
		av.data[vertexPositionIndex + 0] = ax;
		av.data[vertexPositionIndex + 1] = ay;
		av.data[vertexPositionIndex + 2] = bx;
		av.data[vertexPositionIndex + 3] = by;
		av.data[vertexPositionIndex + 4] = cx;
		av.data[vertexPositionIndex + 5] = cy;

		// globalAlpha and vertex alpha
		const computedAlpha = alpha * glState.globalAlpha;
		ava.data[vertexAlphaIndex + 0] = computedAlpha;
		ava.data[vertexAlphaIndex + 1] = computedAlpha;
		ava.data[vertexAlphaIndex + 2] = computedAlpha;

		// circle radius
		avr.data[vertexRadiusIndex + 0] = radius;
		avr.data[vertexRadiusIndex + 1] = radius;
		avr.data[vertexRadiusIndex + 2] = radius;

		const tr = glState.transform;

		// transform index
		const currentTransformIndex = glState.currentTransformIndex;
		avtri.data[vertexTransformIndexIndex + 0] = currentTransformIndex;
		avtri.data[vertexTransformIndexIndex + 1] = currentTransformIndex;
		avtri.data[vertexTransformIndexIndex + 2] = currentTransformIndex;

		// vertex booleans
		avt.data[vertexTypeIndex + 0] = vertexType;
		avt.data[vertexTypeIndex + 1] = vertexType;
		avt.data[vertexTypeIndex + 2] = vertexType;


		av.changed = true;
		ava.changed = true;
		avr.changed = true;
		avt.changed = true;
		avtri.changed = true;

		glState.shouldIncrementTransform = true;
	}
	function beforeBufferWrite(amount) {
		if (glState.currentTriIndex + amount >= glState.MAX_BATCH_TRIS) render();
	}
	//#endregion

	//#region colored
	function coloredTriangle(ax, ay, bx, by, cx, cy, r, g, b, a, radius = -1) {
		beforeBufferWrite(1);

		const avc = glAttributes.vertexColor;
		const vertexColorIndex = glState.currentTriIndex * avc.unitSize * 3;

		writeTriangleAttributeData(ax, ay, bx, by, cx, cy, a, radius, GL_COLORED);

		avc.data[vertexColorIndex + 0] = r;
		avc.data[vertexColorIndex + 1] = g;
		avc.data[vertexColorIndex + 2] = b;
		avc.data[vertexColorIndex + 3] = r;
		avc.data[vertexColorIndex + 4] = g;
		avc.data[vertexColorIndex + 5] = b;
		avc.data[vertexColorIndex + 6] = r;
		avc.data[vertexColorIndex + 7] = g;
		avc.data[vertexColorIndex + 8] = b;

		avc.changed = true;
	}

	function coloredQuad(x, y, w, h, r, g, b, a, radius = -1) {
		coloredTriangle(x, y, x + w, y, x, y + h, r, g, b, a, radius);
		coloredTriangle(x + w, y + h, x + w, y, x, y + h, r, g, b, a, radius);
	}

	function coloredEllipse(x, y, rx, ry, r, g, b, a) {
		coloredQuad(x - rx, y - ry, rx * 2, ry * 2, r, g, b, a, Math.max(rx, ry));
	}

	function coloredPolygon(vertices, r, g, b, a) {
		const triangulation = triangulate(vertices.length / 2);

		for (let i = 0; i < triangulation.length; i += 3) {
			const inxA = triangulation[i + 0] * 2;
			const inxB = triangulation[i + 1] * 2;
			const inxC = triangulation[i + 2] * 2;
			coloredTriangle(
				vertices[inxA + 0], vertices[inxA + 1],
				vertices[inxB + 0], vertices[inxB + 1],
				vertices[inxC + 0], vertices[inxC + 1],
				r, g, b, a
			);
		}
	}
	//#endregion

	//#region outlined

	// helpers for drawLineSegments
	function drawLineTriangle(ax, ay, bx, by, lineWidth, vertexNormalAX, vertexNormalAY, vertexNormalBX, vertexNormalBY, r, g, b, a) {
		beforeBufferWrite(1);

		const avc = glAttributes.vertexColor;
		const avn = glAttributes.vertexLineNormal;
		const avlw = glAttributes.vertexLineWidth;
		const vertexColorIndex = glState.currentTriIndex * avc.unitSize * 3;
		const vertexLineNormalIndex = glState.currentTriIndex * avn.unitSize * 3;
		const vertexLineWidthIndex = glState.currentTriIndex * avlw.unitSize * 3;

		writeTriangleAttributeData(ax, ay, bx, by, ax, ay, a, -1, GL_LINE);

		avc.data[vertexColorIndex + 0] = r;
		avc.data[vertexColorIndex + 1] = g;
		avc.data[vertexColorIndex + 2] = b;
		avc.data[vertexColorIndex + 3] = r;
		avc.data[vertexColorIndex + 4] = g;
		avc.data[vertexColorIndex + 5] = b;
		avc.data[vertexColorIndex + 6] = r;
		avc.data[vertexColorIndex + 7] = g;
		avc.data[vertexColorIndex + 8] = b;

		avn.data[vertexLineNormalIndex + 0] = vertexNormalAX;
		avn.data[vertexLineNormalIndex + 1] = vertexNormalAY;
		avn.data[vertexLineNormalIndex + 2] = vertexNormalBX;
		avn.data[vertexLineNormalIndex + 3] = vertexNormalBY;
		avn.data[vertexLineNormalIndex + 4] = -vertexNormalAX;
		avn.data[vertexLineNormalIndex + 5] = -vertexNormalAY;

		avlw.data[vertexLineWidthIndex + 0] = lineWidth;
		avlw.data[vertexLineWidthIndex + 1] = lineWidth;
		avlw.data[vertexLineWidthIndex + 2] = lineWidth;

		avc.changed = true;
		avn.changed = true;
		avlw.changed = true;
	}

	function lineSegment(ax, ay, bx, by, lineWidth, r, g, b, a) {
		let nx = ay - by;
		let ny = bx - ax;
		const m = getMagnitude(nx, ny);
		nx /= m;
		ny /= m;

		drawLineTriangle(ax, ay, bx, by, lineWidth, nx, ny, nx, ny, r, g, b, a);
		drawLineTriangle(bx, by, ax, ay, lineWidth, -nx, -ny, -nx, -ny, r, g, b, a);
	}

	function lineSegments(segments, lineWidth, r, g, b, a, closed = false, noDuplicates = false, copy = true) {
		closed = true;

		if (segments.length < 4) return;

		if (copy) segments = [...segments];

		// if it's a polygon, copy the first vertex to the last
		if (closed) {
			segments.push(segments[0]);
			segments.push(segments[1]);
		}

		let vectors = new Array(segments.length);

		vectors[vectors.length - 1] = 1;
		vectors[vectors.length - 2] = 1;

		// calculate line segment vectors
		for (let i = 0; i < segments.length - 2; i += 2) {
			const ax = segments[i + 0];
			const ay = segments[i + 1];
			const bx = segments[i + 2];
			const by = segments[i + 3];

			const dx = bx - ax;
			const dy = by - ay;
			const m = getMagnitude(dx, dy);

			vectors[i + 0] = dx / m;
			vectors[i + 1] = dy / m;
		}

		// remove duplicates if necessary
		if (!noDuplicates) {
			const duplicateRemove = (v, i) => {
				const inx = Math.floor(i / 2) * 2;
				const result = vectors[inx + 0] !== 0 || vectors[inx + 1] !== 0;
				return result;
			};
			segments = segments.filter(duplicateRemove);
			vectors = vectors.filter(duplicateRemove);
		}

		const miterNormals = [];
		const miterSuccess = [];

		// compute fused normals for non end vertices
		for (let i = 2; i < segments.length - 2; i += 2) {
			const dx = vectors[i + 0];
			const dy = vectors[i + 1];

			let vertexNormalX = -dy;
			let vertexNormalY = dx;

			const dxLast = vectors[i - 2];
			const dyLast = vectors[i - 1];

			vertexNormalAX = dxLast - dx;
			vertexNormalAY = dyLast - dy;

			const dot = getDot(vertexNormalAX, vertexNormalAY, vertexNormalX, vertexNormalY);

			const miterFactor = 1 / dot;

			if (isFinite(miterFactor)) miterNormals.push(miterFactor * vertexNormalAX, miterFactor * vertexNormalAY);
			else miterNormals.push(vertexNormalX, vertexNormalY);

			miterSuccess.push(Math.abs(dot) > glState.miterLimit);
		}

		let closingMiterNormalX;
		let closingMiterNormalY;
		let closingMiterSuccess;

		// compute end to beginning fused normal for closed polygons
		if (closed) {
			const dx = vectors[0];
			const dy = vectors[1];

			let vertexNormalX = -dy;
			let vertexNormalY = dx;

			const dxLast = vectors[vectors.length - 4];
			const dyLast = vectors[vectors.length - 3];

			vertexNormalAX = dxLast - dx;
			vertexNormalAY = dyLast - dy;

			const dot = getDot(vertexNormalAX, vertexNormalAY, vertexNormalX, vertexNormalY);

			const miterFactor = 1 / dot;

			if (isFinite(miterFactor)) {
				closingMiterNormalX = miterFactor * vertexNormalAX;
				closingMiterNormalY = miterFactor * vertexNormalAY;
			} else {
				closingMiterNormalX = vertexNormalX;
				closingMiterNormalY = vertexNormalY;
			}

			closingMiterSuccess = Math.abs(dot) > glState.miterLimit;
		}

		const closingNormalsValid = closed && closingMiterSuccess;

		// select normals for each vertex from previously calculated normals, then write triangle data to buffers
		for (let i = 0; i < segments.length - 2; i += 2) {
			const ax = segments[i + 0];
			const ay = segments[i + 1];
			const bx = segments[i + 2];
			const by = segments[i + 3];

			const dx = vectors[i + 0];
			const dy = vectors[i + 1];

			let vertexNormalX = -dy;
			let vertexNormalY = dx;

			let vertexNormalAX;
			let vertexNormalAY;
			let vertexNormalBX;
			let vertexNormalBY;

			const iOver2 = i / 2;

			if (i > 0 && miterSuccess[iOver2 - 1]) {
				vertexNormalAX = miterNormals[i - 2];
				vertexNormalAY = miterNormals[i - 1];
			} else if (closingNormalsValid && i === 0) {
				vertexNormalAX = closingMiterNormalX;
				vertexNormalAY = closingMiterNormalY;
			} else {
				vertexNormalAX = vertexNormalX;
				vertexNormalAY = vertexNormalY;
			}

			if (i < segments.length - 4 && miterSuccess[iOver2]) {
				vertexNormalBX = miterNormals[i];
				vertexNormalBY = miterNormals[i + 1];
			} else if (closingNormalsValid && i === segments.length - 4) {
				vertexNormalBX = closingMiterNormalX;
				vertexNormalBY = closingMiterNormalY;
			} else {
				vertexNormalBX = vertexNormalX;
				vertexNormalBY = vertexNormalY;
			}

			// drawLineTriangle(ax, ay, bx, by, lineWidth, vertexNormalAX, vertexNormalAY, vertexNormalBX, vertexNormalBY, 1, 0, 0, 0.5);
			// drawLineTriangle(bx, by, ax, ay, lineWidth, -vertexNormalBX, -vertexNormalBY, -vertexNormalAX, -vertexNormalAY, 0, 0, 1, 0.5);
			drawLineTriangle(ax, ay, bx, by, lineWidth, vertexNormalAX, vertexNormalAY, vertexNormalBX, vertexNormalBY, r, g, b, a);
			drawLineTriangle(bx, by, ax, ay, lineWidth, -vertexNormalBX, -vertexNormalBY, -vertexNormalAX, -vertexNormalAY, r, g, b, a);
		}

	}

	function outlinedTriangle(ax, ay, bx, by, cx, cy, lineWidth, r, g, b, a) {
		beforeBufferWrite(1);

		lineSegments([
			ax, ay,
			bx, by,
			cx, cy
		], lineWidth, r, g, b, a, true, true, false);
	}

	function outlinedQuad(x, y, w, h, lineWidth, r, g, b, a) {
		beforeBufferWrite(2);

		const avc = glAttributes.vertexColor;
		const avlw = glAttributes.vertexLineWidth;
		const vertexColorIndex = glState.currentTriIndex * avc.unitSize * 3;
		const vertexLineWidthIndex = glState.currentTriIndex * avlw.unitSize * 3;

		x -= lineWidth / 2;
		y -= lineWidth / 2;
		w += lineWidth;
		h += lineWidth;

		writeTriangleAttributeData(x, y, x + w, y, x, y + h, a, -1, GL_OUTLINED_QUAD | GL_TRIANGLE_1);
		writeTriangleAttributeData(x + w, y + h, x + w, y, x, y + h, a, -1, GL_OUTLINED_QUAD | GL_TRIANGLE_2);


		avc.data[vertexColorIndex + 0] = r;
		avc.data[vertexColorIndex + 1] = g;
		avc.data[vertexColorIndex + 2] = b;
		avc.data[vertexColorIndex + 3] = r;
		avc.data[vertexColorIndex + 4] = g;
		avc.data[vertexColorIndex + 5] = b;
		avc.data[vertexColorIndex + 6] = r;
		avc.data[vertexColorIndex + 7] = g;
		avc.data[vertexColorIndex + 8] = b;
		avc.data[vertexColorIndex + 9] = r;
		avc.data[vertexColorIndex + 10] = g;
		avc.data[vertexColorIndex + 11] = b;
		avc.data[vertexColorIndex + 12] = r;
		avc.data[vertexColorIndex + 13] = g;
		avc.data[vertexColorIndex + 14] = b;
		avc.data[vertexColorIndex + 15] = r;
		avc.data[vertexColorIndex + 16] = g;
		avc.data[vertexColorIndex + 17] = b;

		avlw.data[vertexLineWidthIndex + 0] = lineWidth;
		avlw.data[vertexLineWidthIndex + 1] = lineWidth;
		avlw.data[vertexLineWidthIndex + 2] = lineWidth;
		avlw.data[vertexLineWidthIndex + 3] = lineWidth;
		avlw.data[vertexLineWidthIndex + 4] = lineWidth;
		avlw.data[vertexLineWidthIndex + 5] = lineWidth;

		avc.changed = true;
		avlw.changed = true;
	}

	function outlinedEllipse(x, y, rx, ry, lineWidth, r, g, b, a) {
		beforeBufferWrite(2);

		const avc = glAttributes.vertexColor;
		const avlw = glAttributes.vertexLineWidth;
		const vertexColorIndex = glState.currentTriIndex * avc.unitSize * 3;
		const vertexLineWidthIndex = glState.currentTriIndex * avlw.unitSize * 3;

		rx += lineWidth / 2;
		ry += lineWidth / 2;
		let type = GL_LINE;
		x -= rx;
		y -= ry;
		const w = rx * 2;
		const h = ry * 2;
		const radius = Math.max(rx, ry);
		writeTriangleAttributeData(x, y, x + w, y, x, y + h, a, radius, GL_OUTLINED_QUAD | GL_TRIANGLE_1);
		writeTriangleAttributeData(x + w, y + h, x + w, y, x, y + h, a, radius, GL_OUTLINED_QUAD | GL_TRIANGLE_2);


		avc.data[vertexColorIndex + 0] = r;
		avc.data[vertexColorIndex + 1] = g;
		avc.data[vertexColorIndex + 2] = b;
		avc.data[vertexColorIndex + 3] = r;
		avc.data[vertexColorIndex + 4] = g;
		avc.data[vertexColorIndex + 5] = b;
		avc.data[vertexColorIndex + 6] = r;
		avc.data[vertexColorIndex + 7] = g;
		avc.data[vertexColorIndex + 8] = b;
		avc.data[vertexColorIndex + 9] = r;
		avc.data[vertexColorIndex + 10] = g;
		avc.data[vertexColorIndex + 11] = b;
		avc.data[vertexColorIndex + 12] = r;
		avc.data[vertexColorIndex + 13] = g;
		avc.data[vertexColorIndex + 14] = b;
		avc.data[vertexColorIndex + 15] = r;
		avc.data[vertexColorIndex + 16] = g;
		avc.data[vertexColorIndex + 17] = b;

		avlw.data[vertexLineWidthIndex + 0] = lineWidth;
		avlw.data[vertexLineWidthIndex + 1] = lineWidth;
		avlw.data[vertexLineWidthIndex + 2] = lineWidth;
		avlw.data[vertexLineWidthIndex + 3] = lineWidth;
		avlw.data[vertexLineWidthIndex + 4] = lineWidth;
		avlw.data[vertexLineWidthIndex + 5] = lineWidth;

		avc.changed = true;
		avlw.changed = true;
	}

	function outlinedPolygon(vertices, lineWidth, r, g, b, a) {
		lineSegments(vertices, lineWidth, r, g, b, a, true, false, true);
	}
	//#endregion

	//#region textured

	function writeToCurrentTexture(img) {
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
	}

	function updateImageCache(img) {
		if (glState.imageTextureMap.has(img)) {
			gl.bindTexture(gl.TEXTURE_2D, glState.imageTextureMap.get(img));
			writeToCurrentTexture(img);
			gl.bindTexture(gl.TEXTURE_2D, glState.textures[glState.activeTextureIndex]);
		}
	}

	function createTexture(img) {
		const tex = gl.createTexture();

		const previousTexture = glState.textures[glState.activeTextureIndex];

		gl.bindTexture(gl.TEXTURE_2D, tex);

		const smoothingParam = glState.imageSmoothing ? gl.LINEAR : gl.NEAREST;

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, smoothingParam);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, smoothingParam);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		writeToCurrentTexture(img);

		gl.bindTexture(gl.TEXTURE_2D, previousTexture);

		glState.textures.push(tex);
		glState.imageTextureMap.set(img, tex);
	}

	function activeTexture(tex, inx) {
		gl.activeTexture(gl.TEXTURE0 + inx);
		gl.bindTexture(gl.TEXTURE_2D, tex);
		glState.activeTextureIndex = inx;
	}

	function texturedTriangle(ax, ay, bx, by, cx, cy, atx, aty, btx, bty, ctx, cty, image, radius = -1) {
		beforeBufferWrite(1);
		let textureIndex = null;

		//get associated texture, or create it 
		if (!glState.imageTextureMap.has(image)) {
			if (image instanceof HTMLImageElement && !image.complete) return;
			createTexture(image);
		}
		let texture = glState.imageTextureMap.get(image);

		// find a texture unit to store this texture
		if (glState.textureIndexMap.has(texture)) textureIndex = glState.textureIndexMap.get(texture);
		else {
			textureIndex = glState.currentTextureIndex++;
			glState.textureIndexMap.set(texture, textureIndex);
			if (glState.currentTextureIndex === glState.MAX_TEXTURE_UNITS) {
				render();
				glState.currentTextureIndex = 0;
				glState.textureIndexMap.clear();
			}
			activeTexture(texture, textureIndex);
		}

		const avt = glAttributes.vertexTexturePosition;
		const avti = glAttributes.vertexTextureIndex;
		const vertexTextureBufferIndex = glState.currentTriIndex * avt.unitSize * 3;
		const vertexTextureIndexBufferIndex = glState.currentTriIndex * avti.unitSize * 3;

		writeTriangleAttributeData(ax, ay, bx, by, cx, cy, 1, radius, GL_TEXTURED);

		avt.data[vertexTextureBufferIndex + 0] = atx;
		avt.data[vertexTextureBufferIndex + 1] = aty;
		avt.data[vertexTextureBufferIndex + 2] = btx;
		avt.data[vertexTextureBufferIndex + 3] = bty;
		avt.data[vertexTextureBufferIndex + 4] = ctx;
		avt.data[vertexTextureBufferIndex + 5] = cty;

		avti.data[vertexTextureIndexBufferIndex + 0] = textureIndex;
		avti.data[vertexTextureIndexBufferIndex + 1] = textureIndex;
		avti.data[vertexTextureIndexBufferIndex + 2] = textureIndex;

		avt.changed = true;
		avti.changed = true;
	}

	function texturedQuad(x, y, w, h, tx, ty, tw, th, tex, radius = -1) {
		texturedTriangle(x, y, x + w, y, x, y + h, tx, ty, tx + tw, ty, tx, ty + th, tex, radius);
		texturedTriangle(x + w, y + h, x + w, y, x, y + h, tx + tw, ty + th, tx + tw, ty, tx, ty + th, tex, radius);
	}

	function texturedEllipse(x, y, rx, ry, tx, ty, tw, th, tex) {
		texturedQuad(x - rx, y - ry, rx * 2, ry * 2, tx, ty, tw, th, tex, Math.max(rx, ry));
	}
	
	function texturedPolygon(vertices, textureVertices, img) {
		const triangulation = triangulate(vertices.length / 2);

		for (let i = 0; i < triangulation.length; i += 3) {
			const inxA = triangulation[i + 0] * 2;
			const inxB = triangulation[i + 1] * 2;
			const inxC = triangulation[i + 2] * 2;
			texturedTriangle(
				vertices[inxA + 0], vertices[inxA + 1],
				vertices[inxB + 0], vertices[inxB + 1],
				vertices[inxC + 0], vertices[inxC + 1],
				textureVertices[inxA + 0], textureVertices[inxA + 1],
				textureVertices[inxB + 0], textureVertices[inxB + 1],
				textureVertices[inxC + 0], textureVertices[inxC + 1],
				img
			);
		}
	}
	
	//#endregion

	//#region export
	const components = {
		create, destroy,

		clear, render, resize,

		setTransform, setImageSmoothing, setGlobalAlpha, setBlendMode,

		coloredTriangle, coloredQuad, coloredEllipse, coloredPolygon,

		texturedTriangle, texturedQuad, texturedEllipse, texturedPolygon, updateImageCache,

		outlinedTriangle, outlinedQuad, outlinedEllipse, outlinedPolygon, lineSegment, lineSegments,

		BLEND_MODE_COMBINE, BLEND_MODE_ADD
	};

	for (const key in components) bound[key] = components[key];

	if (debug) {
		const debugComponents = {
			glState, glAttributes, glShaders, gl
		};

		for (const key in debugComponents) bound[key] = debugComponents[key];
	}
	//#endregion

	return bound;
}