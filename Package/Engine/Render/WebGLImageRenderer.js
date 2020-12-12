class WebGLImageRenderer {
	constructor(canvas) {
		this.canvas = canvas;
		this.gl = null;
		this.glState = {
			MAX_TEXTURE_UNITS: null,
			currentQuadIndex: null,
			currentTextureIndex: null,
			positionArray: null,
			positionBuffer: null,
			positionPointer: null,
			resolutionLocation: null,
			textureIndexArray: null,
			textureIndexBuffer: null,
			textureIndexPointer: null,
			textureIndexMap: null,
			textures: null,
			transformArray: null,
			transformLocation: null,
			currentTransform: null
		};
		this.wasSetup = false;
	}
	setup() {
		// create context
		this.gl = this.canvas.getContext("webgl2");
		if (this.gl === null) return exit("Your browser doesn't support webgl.");
		this.canvas.addEventListener("webglcontextlost", e => {
			e.preventDefault();
			console.warn("Webgl Context Lost");
		});
		this.canvas.addEventListener("webglcontextrestored", e => {
			console.warn("Webgl Context Restored");
			e.preventDefault();
			this.setup();
		});

		const { gl, glState } = this;

		this.wasSetup = true;

		glState.MAX_TEXTURE_UNITS = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);

		//sources
		const vertexSource = `#version 300 es
in highp vec2 vertexPosition;
in highp vec2 texturePosition;
in highp float vertexTextureIndex;
in highp float vertexTransformIndex;

uniform highp mat3 vertexTransform[${glState.MAX_TEXTURE_UNITS}];
uniform highp float alpha[${glState.MAX_TEXTURE_UNITS}];
uniform highp vec2 resolution;

out highp vec2 textureCoord;
out highp float textureIndex;
out highp float pixelAlpha;

void main() {
	highp vec3 pos = vertexTransform[int(vertexTransformIndex)] * vec3(vertexPosition, 1.0);
	gl_Position = vec4(pos.x / resolution.x * 2.0 - 1.0, 1.0 - pos.y / resolution.y * 2.0, 0.0, 1.0);
	textureCoord = texturePosition;
	textureIndex = vertexTextureIndex;
	pixelAlpha = alpha[int(vertexTransformIndex)];
}
`;

		const pixelSource = `#version 300 es
in highp vec2 textureCoord;
in highp float textureIndex;
in highp float pixelAlpha;

uniform highp sampler2D image[${glState.MAX_TEXTURE_UNITS}];

out highp vec4 pixelColor;

void main() {
	switch (int(textureIndex)) {
${new Array(glState.MAX_TEXTURE_UNITS).fill(0).map((x, i) => `\t\tcase ${i}:\n\t\t\tpixelColor = texture(image[${i}], textureCoord);\n\t\t\tbreak;`).join("\n")}
	}
	pixelColor.a *= pixelAlpha;
	pixelColor.rgb *= clamp(pixelColor.a, 0.0, 1.0);
}
`;
		//shader programs
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

		const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
		const pixelShader = compileShader(gl.FRAGMENT_SHADER, pixelSource);
		const shaderProgram = gl.createProgram();
		gl.attachShader(shaderProgram, vertexShader);
		gl.attachShader(shaderProgram, pixelShader);
		gl.linkProgram(shaderProgram);
		gl.useProgram(shaderProgram);

		gl.clearColor(0, 0, 0, 0);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

		let amountBufferElements = 2 /* components per vector */ * 3 /* vectors per triangle */ * 2 /* triangles per quad */ * glState.MAX_TEXTURE_UNITS /* As many quads as there are texture units */;

		let bufferQuadSize = 2 /* components per vector */ * 3 /* vectors per triangle */ * 2 /* triangles per quad */;

		glState.positionBuffer = gl.createBuffer();
		glState.positionPointer = gl.getAttribLocation(shaderProgram, "vertexPosition");
		glState.positionArray = new Float32Array(amountBufferElements);

		gl.bindBuffer(gl.ARRAY_BUFFER, glState.positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, glState.positionArray, gl.DYNAMIC_DRAW);
		gl.vertexAttribPointer(glState.positionPointer, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(glState.positionPointer);

		let transformIndexBuffer = gl.createBuffer();
		let transformIndexPointer = gl.getAttribLocation(shaderProgram, "vertexTransformIndex");
		let transformIndexArray = new Float32Array(1 /* components per vector */ * 3 /* vectors per triangle */ * 2 /* triangles per quad */ * glState.MAX_TEXTURE_UNITS /* As many quads as there are texture units */);

		for (let i = 0; i < glState.MAX_TEXTURE_UNITS; i++) {
			let inx = i * 6;
			transformIndexArray[inx + 0] = i;
			transformIndexArray[inx + 1] = i;
			transformIndexArray[inx + 2] = i;
			transformIndexArray[inx + 3] = i;
			transformIndexArray[inx + 4] = i;
			transformIndexArray[inx + 5] = i;
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, transformIndexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, transformIndexArray, gl.STATIC_DRAW);
		gl.vertexAttribPointer(transformIndexPointer, 1, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(transformIndexPointer);


		let textureBuffer = gl.createBuffer();
		let texturePointer = gl.getAttribLocation(shaderProgram, "texturePosition");
		let textureArray = new Float32Array(amountBufferElements);

		// texture sample coordinates don't change, populate now
		for (let i = 0; i < glState.MAX_TEXTURE_UNITS; i++) {
			let inx = i * bufferQuadSize;

			// triangle 1

			//#.
			//..
			textureArray[inx + 0] = 0;
			textureArray[inx + 1] = 0;

			//.#
			//..
			textureArray[inx + 2] = 1;
			textureArray[inx + 3] = 0;

			//..
			//#.
			textureArray[inx + 4] = 0;
			textureArray[inx + 5] = 1;

			// triangle 2

			//.#
			//..
			textureArray[inx + 6] = 1;
			textureArray[inx + 7] = 0;

			//..
			//.#
			textureArray[inx + 8] = 1;
			textureArray[inx + 9] = 1;

			//..
			//#.
			textureArray[inx + 10] = 0;
			textureArray[inx + 11] = 1;

		}

		gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, textureArray, gl.STATIC_DRAW);
		gl.vertexAttribPointer(texturePointer, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(texturePointer);

		// create gl.texture s
		glState.textures = [];
		for (let i = 0; i < glState.MAX_TEXTURE_UNITS; i++) {
			let tex = gl.createTexture();

			gl.bindTexture(gl.TEXTURE_2D, tex);

			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

			glState.textures.push(tex);
		}

		glState.textureIndexMap = new Map();

		// same initialization strategy as for texture buffer, but needs to be updated each frame
		glState.textureIndexBuffer = gl.createBuffer();
		glState.textureIndexPointer = gl.getAttribLocation(shaderProgram, "vertexTextureIndex");
		glState.textureIndexArray = new Float32Array(1 /* components per vector */ * 3 /* vectors per triangle */ * 2 /* triangles per quad */ * glState.MAX_TEXTURE_UNITS /* As many quads as there are texture units */);

		for (let i = 0; i < glState.MAX_TEXTURE_UNITS; i++) {
			let inx = i * 6;
			glState.textureIndexArray[inx + 0] = i;
			glState.textureIndexArray[inx + 1] = i;
			glState.textureIndexArray[inx + 2] = i;
			glState.textureIndexArray[inx + 3] = i;
			glState.textureIndexArray[inx + 4] = i;
			glState.textureIndexArray[inx + 5] = i;
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, glState.textureIndexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, glState.textureIndexArray, gl.STATIC_DRAW);
		gl.vertexAttribPointer(glState.textureIndexPointer, 1, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(glState.textureIndexPointer);

		glState.currentTextureIndex = 0;
		glState.currentQuadIndex = 0;
		glState.resolutionLocation = gl.getUniformLocation(shaderProgram, "resolution");

		let imageLocation = gl.getUniformLocation(shaderProgram, "image");
		let imageLocationArray = new Int32Array(glState.MAX_TEXTURE_UNITS).map((x, i) => i);
		gl.uniform1iv(imageLocation, imageLocationArray);

		glState.transformLocation = gl.getUniformLocation(shaderProgram, "vertexTransform");
		glState.transformArray = new Float32Array(9 /* matrix elements */ * glState.MAX_TEXTURE_UNITS /* one transform per image */);
		/* populate transform array
			-matrices always in the form:
				| x x 0 |
				| x x 0 |
				| x x 1 |
		*/
		for (let i = 0; i < glState.MAX_TEXTURE_UNITS; i++) {
			glState.transformArray[i * 9 + 8] = 1;
		}

		glState.alphaLocation = gl.getUniformLocation(shaderProgram, "alpha");
		glState.alphaArray = new Float32Array(glState.MAX_TEXTURE_UNITS);


		// bind position buffer to all future bufferData calls
		gl.bindBuffer(gl.ARRAY_BUFFER, glState.positionBuffer);

		this.resize(this.canvas.width, this.canvas.height);

	}
	clear() {
		const { gl, glState } = this;

		gl.clear(gl.COLOR_BUFFER_BIT);
	}
	invalidateCache(image) {
		const { gl, glState } = this;

		glState.textureIndexMap.delete(image);
	}
	drawImage(image, x, y, w, h, transform = [1, 0, 0, 0, 1, 0, 0, 0, 1], alpha = 1) {
		const { gl, glState } = this;

		let texIndex = 0;
		if (glState.textureIndexMap.has(image)) texIndex = glState.textureIndexMap.get(image);
		else {
			texIndex = glState.currentTextureIndex++;
			glState.textureIndexMap.set(image, texIndex);
			gl.activeTexture(gl.TEXTURE0 + texIndex);
			gl.bindTexture(gl.TEXTURE_2D, glState.textures[texIndex]);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
			if (glState.currentTextureIndex === glState.MAX_TEXTURE_UNITS) {
				this.render();
				glState.textureIndexMap.clear();
				glState.currentTextureIndex = 0;
			}
		}

		let bufferIndex = glState.currentQuadIndex * 12 /* vector components per quad */;
		let indexBufferIndex = glState.currentQuadIndex * 6 /* vectors per quad */;
		let currentTransformIndex = glState.currentQuadIndex * 9 /* elements per matrix */;
		let alphaIndex = glState.currentQuadIndex * 1 /* alpha per quad */;
		glState.currentQuadIndex++;

		// triangle #1 positions
		glState.positionArray[bufferIndex + 0] = x;
		glState.positionArray[bufferIndex + 1] = y;
		glState.positionArray[bufferIndex + 2] = x + w;
		glState.positionArray[bufferIndex + 3] = y;
		glState.positionArray[bufferIndex + 4] = x;
		glState.positionArray[bufferIndex + 5] = y + h;

		// triangle #2 positions
		glState.positionArray[bufferIndex + 6] = x + w;
		glState.positionArray[bufferIndex + 7] = y;
		glState.positionArray[bufferIndex + 8] = x + w;
		glState.positionArray[bufferIndex + 9] = y + h;
		glState.positionArray[bufferIndex + 10] = x;
		glState.positionArray[bufferIndex + 11] = y + h;

		// texture indices
		glState.textureIndexArray[indexBufferIndex + 0] = texIndex;
		glState.textureIndexArray[indexBufferIndex + 1] = texIndex;
		glState.textureIndexArray[indexBufferIndex + 2] = texIndex;
		glState.textureIndexArray[indexBufferIndex + 3] = texIndex;
		glState.textureIndexArray[indexBufferIndex + 4] = texIndex;
		glState.textureIndexArray[indexBufferIndex + 5] = texIndex;

		// transform elements
		glState.transformArray[currentTransformIndex + 0] = transform[0];
		glState.transformArray[currentTransformIndex + 1] = transform[1];
		glState.transformArray[currentTransformIndex + 3] = transform[3];
		glState.transformArray[currentTransformIndex + 4] = transform[4];
		glState.transformArray[currentTransformIndex + 6] = transform[6];
		glState.transformArray[currentTransformIndex + 7] = transform[7];

		// alpha
		glState.alphaArray[alphaIndex] = alpha;

		if (glState.currentQuadIndex === glState.MAX_TEXTURE_UNITS) this.render();
	}
	setBlendMode(blend) {
		const { gl, glState } = this;

		switch (blend) {
			case "source-over":
				gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
				break;
			case "lighter":
				gl.blendFunc(gl.ONE, gl.ONE);
				break;
		}

	}
	setImageSmoothing(smooth) {
		const { gl, glState } = this;

		let param = smooth ? gl.LINEAR : gl.NEAREST;

		for (let i = 0; i < glState.MAX_TEXTURE_UNITS; i++) {
			gl.bindTexture(gl.TEXTURE_2D, glState.textures[i]);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
		}

		glState.textureIndexMap.clear();
		glState.currentTextureIndex = 0;
	}
	resize(width, height) {
		const { gl, glState } = this;

		this.canvas.width = width;
		this.canvas.height = height;
		gl.uniform2f(glState.resolutionLocation, width, height);
		gl.viewport(0, 0, width, height);
	}
	render() {
		const { gl, glState } = this;

		if (!glState.currentQuadIndex) return;

		gl.bindBuffer(gl.ARRAY_BUFFER, glState.textureIndexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, glState.textureIndexArray, gl.DYNAMIC_DRAW);
		gl.vertexAttribPointer(glState.textureIndexPointer, 1, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, glState.positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, glState.positionArray, gl.DYNAMIC_DRAW);
		gl.vertexAttribPointer(glState.positionPointer, 2, gl.FLOAT, false, 0, 0);

		gl.uniformMatrix3fv(glState.transformLocation, false, glState.transformArray);
		gl.uniform1fv(glState.alphaLocation, glState.alphaArray);

		gl.drawArrays(gl.TRIANGLES, 0, glState.currentQuadIndex * 3 /* vectors per triangle */ * 2 /* triangles per quad */);

		glState.currentQuadIndex = 0;
	}
}