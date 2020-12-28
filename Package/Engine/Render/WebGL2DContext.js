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
	
	// LINE JOIN
	const LINE_JOIN_ROUND = 0x02;
	const LINE_JOIN_MITER = 0x03;
	const LINE_JOIN_BEVEL = 0x04;

	// LINE CAP
	const LINE_CAP_FLAT = 0x05;
	const LINE_CAP_ROUND = 0x06;
	const LINE_CAP_SQUARE = 0x07;
	const LINE_CAP_NOT_APPLICABLE = 0x08;

	//#endregion

	//#region attributes
	function createAttribute(name, unitSize) {
		let attr = {
			name,
			buffer: gl.createBuffer(),
			pointer: 0,
			data: new Float32Array(unitSize * glState.MAX_BATCH_TRIS * 3),
			unitSize,
			unitSizex3: unitSize * 3, 
			changed: false,
			enabled: false
		};
		glAttributes[name] = attr;
	}

	function setAttribute(name) {
		let attr = glAttributes[name];

		if (!attr.enabled) {
			attr.enabled = true;
			attr.pointer = gl.getAttribLocation(glState.program.shaderProgram, name),
			gl.enableVertexAttribArray(attr.pointer);
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
		
		const nwidth = Math.floor(width * devicePixelRatio);
		const nheight = Math.floor(height * devicePixelRatio);
		if (nwidth !== gl.canvas.width) gl.canvas.width = nwidth;
		if (nheight !== gl.canvas.height) gl.canvas.height = nheight;
		
		if (glState.usedProgram) {
			updateResolution();
		}
	}

	function updateResolution() {
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		gl.uniform2f(getUniformLocation("resolution"), gl.canvas.width / devicePixelRatio, gl.canvas.height / devicePixelRatio);
	}
	//#endregion

	//#region basic
	
	function create(canvas, pixelRatioHandled = false) {
		gl = canvas.getContext("webgl2", {
			depth: false,
			stencil: false
		});

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

		setup(pixelRatioHandled);

		if (debug) bound.gl = gl;
	}

	function setup(pixelRatioHandled) {
		glState.derivativeExt = gl.getExtension("OES_standard_derivatives");

		const MAX_VECTORS = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS) - 1;
		const MAX_3X3_MATRICES = Math.floor(MAX_VECTORS / 3);

		glState.MAX_BATCH_TRIS = 10000;
		glState.MAX_BATCH_TRANSFORMS = MAX_3X3_MATRICES;
		glState.currentTriIndex = 0;

		// textures
		glState.MAX_TEXTURE_UNITS = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);

		setupShaderProgram();

		// initialize texture resources
		glState.imageTextureMap = new Map();
		glState.textureIndexMap = new Map();
		glState.currentTextureIndex = 0;
		glState.activeTextureIndex = 0;
		glState.textures = [];

		const textureIndexList = new Int32Array(glState.MAX_TEXTURE_UNITS).fill(0).map((v, i) => i);

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

		// transforms
		glState.transformData = new Float32Array(glState.MAX_BATCH_TRANSFORMS * 9);
		glState.currentTransformIndex = 0;
		glState.shouldIncrementTransform = false;

		for (let i = 0; i < glState.MAX_BATCH_TRIS; i++) {
			glState.transformData[i * 9 + 0] = 1;
			glState.transformData[i * 9 + 4] = 1;
			glState.transformData[i * 9 + 8] = 1;
		}

		// triangulation cache
		glState.vertexCountTriangulationMap = new Map();

		gl.enable(gl.BLEND);

		// initialize state
		setBlendMode(glState.blendMode ?? BLEND_MODE_COMBINE);
		setImageSmoothing(glState.imageSmoothing ?? false);
		setGlobalAlpha(glState.globalAlpha ?? 1);
		setTransform(glState.currentTransform ?? [
			1, 0, 0,
			0, 1, 0,
			0, 0, 1
		]);

		if (pixelRatioHandled) {
			glState.width = gl.canvas.width / devicePixelRatio;
			glState.height = gl.canvas.height / devicePixelRatio;
		} else {
			glState.width = gl.canvas.width;
			glState.height = gl.canvas.height;
		}

		glState.miterLimit = 0.9;

		gl.clearColor(0, 0, 0, 0);

		glState.usedProgram = false;
	}

	function destroy() {
		for (let name in glAttributes) destroyAttribute(name);
		for (let i = 0; i < glState.textures.length; i++) gl.deleteTexture(glState.textures[i]);
		gl.useProgram(null);
		gl.deleteProgram(glState.program.shaderProgram);
		gl.deleteShader(glState.program.vertexShader);
		gl.deleteShader(glState.program.fragmentShader);
	}
	
	function getUniformLocation(uniform) {
		if (uniform in glState.program.uniforms) return glState.program.uniforms[uniform];
		return glState.program.uniforms[uniform] = gl.getUniformLocation(glState.program.shaderProgram, uniform);
	}

	function setupShaderProgram(vsName, fsName) {
		const textureSelectionGLSL = `
switch (int(textureIndex)) {
${new Array(glState.MAX_TEXTURE_UNITS).fill(0).map((v, i) => {
			return `\tcase ${i}:\n\t\tpixelColor = texture(textures[${i}], textureCoord);\n\t\tbreak;`;
		}).join("\n")}
}
			`;

		// colors

		const vertexShaderSource = `#version 300 es
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
				out highp vec2 scaleFactor;

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

					highp mat3 transf = vertexTransforms[int(vertexTransformIndex)];
					pos = (transf * vec3(pos, 1.0)).xy;
					scaleFactor.y = length(transf * vec3(0.0, 1.0, 0.0));
					scaleFactor.x = length(transf * vec3(1.0, 0.0, 0.0));
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

		const fragmentShaderSource = `#version 300 es
				in highp vec2 position;
				in highp vec3 color;
				in highp float alpha;
				in highp float circleRadius;
				in highp float textureIndex;
				in highp vec2 textureCoord;
				in highp float type;
				in highp vec2 uv;
				in highp float lineWidth;
				in highp vec2 scaleFactor;

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

						UV.x /= 1.0 - slope(UV.x) * lineWidth * scaleFactor.x * 2.5;
						UV.y /= 1.0 - slope(UV.y) * lineWidth * scaleFactor.y * 2.5;

						if (circleRadius < 0.0) {
							if (UV.x < 0.5 && UV.y < 0.5 && UV.x > -0.5 && UV.y > -0.5) {
								highp float ox = slope(UV.x) * 0.07;
								highp float oy = slope(UV.y) * 0.07;
								antialias *= 1.0 - smoothstep(abs(UV.x), 0.5, 0.5 - ox) + 1.0 - smoothstep(abs(UV.y), 0.5, 0.5 - oy);
								if (antialias < 0.01) discard;
							}
						} else if (circleRadius > 0.0) {
							highp float circleRadius = 1.0 / min(slope(UV.x), slope(UV.y));

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

		function compileShader(type, source) {
			let shader = gl.createShader(type);
			gl.shaderSource(shader, source);
			gl.compileShader(shader);
			return shader;
		}

		const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
		const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
		const shaderProgram = gl.createProgram();
		gl.attachShader(shaderProgram, vertexShader);
		gl.attachShader(shaderProgram, fragmentShader);
		gl.linkProgram(shaderProgram);

		const uniforms = {
			// textures: gl.getUniformLocation(shaderProgram, "textures"),
			// resolution: gl.getUniformLocation(shaderProgram, "resolution"),
			// vertexTransforms: gl.getUniformLocation(shaderProgram, "vertexTransforms")
		};

		glState.program = {
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
		transformData[transformIndex + 3] = matrix[3];
		transformData[transformIndex + 4] = matrix[4];
		transformData[transformIndex + 6] = matrix[6];
		transformData[transformIndex + 7] = matrix[7];
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

		if (!glState.usedProgram) {
			glState.usedProgram = true;
			gl.useProgram(glState.program.shaderProgram);
			resize(glState.width, glState.height);
		}

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

		gl.uniformMatrix3fv(getUniformLocation("vertexTransforms"), false, glState.transformData);

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
	let avData, avaData, avrData, avtriData, avtData;
	function writeTriangleAttributeData(ax, ay, bx, by, cx, cy, alpha, radius, vertexType) {
		if (!glState.contextExists) return;

		const av = glAttributes.vertexPosition;
		const avr = glAttributes.vertexCircleRadius;
		const avtri = glAttributes.vertexTransformIndex;
		const avt = glAttributes.vertexType;
		const ava = glAttributes.vertexAlpha;
		const vertexPositionIndex = glState.currentTriIndex * av.unitSizex3;
		const vertexAlphaIndex = glState.currentTriIndex * ava.unitSizex3;
		const vertexTransformIndexIndex = glState.currentTriIndex * avtri.unitSizex3;
		const vertexRadiusIndex = glState.currentTriIndex * avr.unitSizex3;
		const vertexTypeIndex = glState.currentTriIndex * avt.unitSizex3;

		glState.currentTriIndex++;

		// vertex positions
		avData = av.data;
		avData[vertexPositionIndex + 0] = ax;
		avData[vertexPositionIndex + 1] = ay;
		avData[vertexPositionIndex + 2] = bx;
		avData[vertexPositionIndex + 3] = by;
		avData[vertexPositionIndex + 4] = cx;
		avData[vertexPositionIndex + 5] = cy;

		// globalAlpha and vertex alpha
		const computedAlpha = alpha * glState.globalAlpha;
		avaData = ava.data;
		avaData[vertexAlphaIndex + 0] = computedAlpha;
		avaData[vertexAlphaIndex + 1] = computedAlpha;
		avaData[vertexAlphaIndex + 2] = computedAlpha;

		// circle radius
		avrData = avr.data;
		avrData[vertexRadiusIndex + 0] = radius;
		avrData[vertexRadiusIndex + 1] = radius;
		avrData[vertexRadiusIndex + 2] = radius;

		// transform index
		avtriData = avtri.data;
		const currentTransformIndex = glState.currentTransformIndex;
		avtriData[vertexTransformIndexIndex + 0] = currentTransformIndex;
		avtriData[vertexTransformIndexIndex + 1] = currentTransformIndex;
		avtriData[vertexTransformIndexIndex + 2] = currentTransformIndex;

		// vertex booleans
		avtData = avt.data;
		avtData[vertexTypeIndex + 0] = vertexType;
		avtData[vertexTypeIndex + 1] = vertexType;
		avtData[vertexTypeIndex + 2] = vertexType;


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
		const vertexColorIndex = glState.currentTriIndex * avc.unitSizex3;

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
		const vertexColorIndex = glState.currentTriIndex * avc.unitSizex3;
		const vertexLineNormalIndex = glState.currentTriIndex * avn.unitSizex3;
		const vertexLineWidthIndex = glState.currentTriIndex * avlw.unitSizex3;

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

	function lineSegment(ax, ay, bx, by, lineWidth, lineCap, r, g, b, a) {

		let nx = ay - by;
		let ny = bx - ax;
		const m = getMagnitude(nx, ny);
		nx /= m;
		ny /= m;

		if (lineCap === LINE_CAP_SQUARE) {
			const radius = lineWidth / 2;
			let dx = ny * radius;
			let dy = -nx * radius;
			ax -= dx;
			ay -= dy;
			bx += dx;
			by += dy;
		} else if (lineCap === LINE_CAP_ROUND) {
			const radius = lineWidth / 2;
			coloredEllipse(ax, ay, radius, radius, r, g, b, a);
			coloredEllipse(bx, by, radius, radius, r, g, b, a);
		}

		drawLineTriangle(ax, ay, bx, by, lineWidth, nx, ny, nx, ny, r, g, b, a);
		drawLineTriangle(bx, by, ax, ay, lineWidth, -nx, -ny, -nx, -ny, r, g, b, a);
	}

	function lineSegments(segments, lineWidth, lineCap, lineJoin, r, g, b, a, closed = false, noDuplicates = false, copy = true) {
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

		// line cap
		if (!closed) {
			if (lineCap === LINE_CAP_SQUARE) {
				const radius = lineWidth / 2;
				segments[0] -= vectors[0] * radius;
				segments[1] -= vectors[1] * radius;
				segments[segments.length - 2] += vectors[vectors.length - 4] * radius;
				segments[segments.length - 1] += vectors[vectors.length - 3] * radius;
			} else if (lineCap === LINE_CAP_ROUND) {
				const radius = lineWidth / 2;
				coloredEllipse(segments[0], segments[1], radius, radius, r, g, b, a);
				coloredEllipse(segments[segments.length - 2], segments[segments.length - 1], radius, radius, r, g, b, a);
			}
		}

		// line join round
		if (lineJoin === LINE_JOIN_ROUND) {
			const radius = lineWidth / 2;
			for (let i = 0; i < segments.length - 2; i += 2) {
				const ax = segments[i + 0];
				const ay = segments[i + 1];
				const bx = segments[i + 2];
				const by = segments[i + 3];

				let nx = -vectors[i + 1];
				let ny = vectors[i];
				const m = getMagnitude(nx, ny);
				nx /= m;
				ny /= m;

				drawLineTriangle(ax, ay, bx, by, lineWidth, nx, ny, nx, ny, r, g, b, a);
				drawLineTriangle(bx, by, ax, ay, lineWidth, -nx, -ny, -nx, -ny, r, g, b, a);

				if (i < segments.length - 4 || closed) coloredEllipse(segments[i + 2], segments[i + 3], radius, radius, r, g, b, a);
			}
			return;
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

			const miterSuccessDot = getDot(dx, dy, dxLast, dyLast);

			let unitMiterSuccess = -miterSuccessDot < glState.miterLimit;
			if (unitMiterSuccess && lineJoin !== LINE_JOIN_BEVEL) {
				miterSuccess.push(true);
			} else {
				// bevel
				miterSuccess.push(false);
				const ax = segments[i];
				const ay = segments[i + 1];
				const vmx = vertexNormalAX;
				const vmy = vertexNormalAY;
				let v1x = -dy;
				let v1y = dx;
				let v2x = -dyLast;
				let v2y = dxLast;

				if (getDot(vmx, vmy, v1x, v1y) < 0) {
					v1x = -v1x;
					v1y = -v1y;
					v2x = -v2x;
					v2y = -v2y;
				}

				const radius = lineWidth / 2;

				coloredTriangle(ax, ay, ax + radius * v1x, ay + radius * v1y, ax + radius * v2x, ay + radius * v2y, r, g, b, a);
			}
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

			const miterSuccessDot = getDot(dx, dy, dxLast, dyLast);

			let unitMiterSuccess = -miterSuccessDot < glState.miterLimit;
			if (unitMiterSuccess && lineJoin !== LINE_JOIN_BEVEL) {
				closingMiterSuccess = true;
			} else {
				// bevel
				closingMiterSuccess = false;
				const ax = segments[0];
				const ay = segments[1];
				const vmx = vertexNormalAX;
				const vmy = vertexNormalAY;
				let v1x = -dy;
				let v1y = dx;
				let v2x = -dyLast;
				let v2y = dxLast;

				if (getDot(vmx, vmy, v1x, v1y) < 0) {
					v1x = -v1x;
					v1y = -v1y;
					v2x = -v2x;
					v2y = -v2y;
				}

				const radius = lineWidth / 2;

				coloredTriangle(ax, ay, ax + radius * v1x, ay + radius * v1y, ax + radius * v2x, ay + radius * v2y, r, g, b, a);
			}
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

	function outlinedTriangle(ax, ay, bx, by, cx, cy, lineWidth, lineJoin, r, g, b, a) {
		lineSegments([
			ax, ay,
			bx, by,
			cx, cy
		], lineWidth, LINE_CAP_NOT_APPLICABLE, lineJoin, r, g, b, a, true, true, false);
	}

	function outlinedQuad(x, y, w, h, lineWidth, r, g, b, a) {
		beforeBufferWrite(2);

		const avc = glAttributes.vertexColor;
		const avlw = glAttributes.vertexLineWidth;
		const vertexColorIndex = glState.currentTriIndex * avc.unitSizex3;
		const vertexLineWidthIndex = glState.currentTriIndex * avlw.unitSizex3;

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
		const vertexColorIndex = glState.currentTriIndex * avc.unitSizex3;
		const vertexLineWidthIndex = glState.currentTriIndex * avlw.unitSizex3;

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

	function outlinedPolygon(vertices, lineWidth, lineJoin, r, g, b, a) {
		lineSegments(vertices, lineWidth, LINE_CAP_NOT_APPLICABLE, lineJoin, r, g, b, a, true, false, true);
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
		const vertexTextureBufferIndex = glState.currentTriIndex * avt.unitSizex3;
		const vertexTextureIndexBufferIndex = glState.currentTriIndex * avti.unitSizex3;

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

		BLEND_MODE_COMBINE, BLEND_MODE_ADD,

		LINE_JOIN_MITER, LINE_JOIN_BEVEL, LINE_JOIN_ROUND,

		LINE_CAP_FLAT, LINE_CAP_ROUND, LINE_CAP_SQUARE
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