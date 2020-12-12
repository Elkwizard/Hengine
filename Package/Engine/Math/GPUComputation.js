class GPUComputation {
	constructor(dataSize, inputKeys, inputRanges, outputRanges, operation) {
		this.problemSizeExact = dataSize * 4;
		let unitSize = inputKeys.length;
		this.unitSize = unitSize;
		this.glsl = operation;
		this.inputRanges = inputRanges;
		this.outputRanges = outputRanges;
		
		let inputTextures = Math.ceil(unitSize / 4);

		while (this.inputRanges.length < inputTextures * 4) this.inputRanges.push(new Range(0, 255));
		while (this.outputRanges.length < 4	) this.outputRanges.push(new Range(0, 255));
		this.inputMins = this.inputRanges.map(x => x.min);
		this.inputFactors = this.inputRanges.map(x => x.length / 255);
		this.outputMins = this.outputRanges.map(x => x.min);
		this.outputFactors = this.outputRanges.map(x => x.length / 255);

		// get texture size
		const BUFFER = 16;

		this.inputTextureCount = inputTextures;
		this.inputKeys = inputKeys;

		let amountPixels = Math.ceil(dataSize / BUFFER) * BUFFER;

		let problemWidth = 1;
		let problemHeight = 1;

		if (Math.sqrt(amountPixels) % 1) {
			function primeFactors(number) {
				if (number < 2) return [];
				let i = 2;
				while (number % i && number !== i) i++;
				return [i, ...primeFactors(number / i)];
			}

			let factors = primeFactors(amountPixels);

			let mean = factors.reduce((a, b) => a + b) / factors.length;
			for (let i = 0; i < factors.length; i++) {
				let factor = factors[i];
				if (factor > mean) problemHeight *= factor;
				else problemWidth *= factor;
			}
		} else {
			problemWidth = Math.sqrt(amountPixels);
			problemHeight = problemWidth;
		}
		this.problemWidth = problemWidth;
		this.problemHeight = problemHeight;
		this.problemSize = amountPixels;

		// webgl
		this.image = new_OffscreenCanvas(problemWidth, problemHeight);
		this.gl = this.image.getContext("webgl2");
		this.compiled = null;
		if (this.gl === null) return console.warn("Your browser doesn't support webgl.");
		this.image.addEventListener("webglcontextlost", e => {
			e.preventDefault();
			console.warn("Webgl Context Lost");
		});
		this.image.addEventListener("webglcontextrestored", e => {
			console.warn("Webgl Context Restored");
			e.preventDefault();
			if (this._compiled) this.compile();
		});

		this.inputTextures = [];
	}
	set compiled(a) {
		this._compiled = a;
	}
	get compiled() {
		if (!this._compiled) {
			exit("Didn't compile GPUComputation");
			return null;
		} return this._compiled;
	}
	compile() {
		if (this.gl.isContextLost()) return;

		//init
		const gl = this.gl;

		// recreate, or just create input textures
		this.inputTextures = [];

		for (let i = 0; i < this.inputTextureCount; i++) {
			let tex = gl.createTexture();

			gl.activeTexture(gl.TEXTURE0 + i);
			gl.bindTexture(gl.TEXTURE_2D, tex);

			// wrapping and stretching
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

			this.inputTextures.push(tex);
		}

		//sources
		const vertexSource = `#version 300 es
				in vec4 vertexPosition;

				out highp vec2 position;

				void main() {
					gl_Position = vertexPosition;
					position = vec2((vertexPosition.x + 1.0) / 2.0, (vertexPosition.y + 1.0) / 2.0);
				}
			`;

		let minVectorI = [];
		let spanVectorI = [];
		for (let i = 0; i < this.inputRanges.length; i++) {
			minVectorI.push(this.inputRanges[i].min);
			spanVectorI.push(this.inputRanges[i].max - this.inputRanges[i].min);
		}
		minVectorI = minVectorI.map(x => x.toFixed(5));
		spanVectorI = spanVectorI.map(x => x.toFixed(5));

		let inputFieldString = this.inputRanges.slice(0, this.unitSize).map((r, i) => `\thighp float ${this.inputKeys[i]};`).join("\n");
		let textureDeclarationString = [];
		let colorGetterString = [];
		let inputArgString = [];
		for (let i = 0; i < this.inputRanges.length / 4; i++) {
			textureDeclarationString.push(`uniform sampler2D inputTexture${i};`);
			colorGetterString.push(`	vec4 color${i} = texture(inputTexture${i}, position);`);
			let num0 = i * 4 + 0;
			let num1 = i * 4 + 1;
			let num2 = i * 4 + 2;
			let num3 = i * 4 + 3;
			if (num0 < this.unitSize) inputArgString.push(`\t\tcolor${i}.r * ${spanVectorI[num0]} + ${minVectorI[num0]}`);
			if (num1 < this.unitSize) inputArgString.push(`\t\tcolor${i}.g * ${spanVectorI[num1]} + ${minVectorI[num1]}`);
			if (num2 < this.unitSize) inputArgString.push(`\t\tcolor${i}.b * ${spanVectorI[num2]} + ${minVectorI[num2]}`);
			if (num3 < this.unitSize) inputArgString.push(`\t\tcolor${i}.a * ${spanVectorI[num3]} + ${minVectorI[num3]}`);
		}
		textureDeclarationString = textureDeclarationString.join("\n");
		colorGetterString = colorGetterString.join("\n");
		inputArgString = inputArgString.join(",\n");

		const prefix = `#version 300 es
precision highp sampler2D;
precision highp float;
precision highp int;

${textureDeclarationString}
in highp vec2 position;

struct Input {
${inputFieldString}
};

Input getInput() {
${colorGetterString}
	
	return Input(
${inputArgString}
	);
}
`;
		let minVectorO = [];
		let maxVectorO = [];
		for (let i = 0; i < this.outputRanges.length; i++) {
			minVectorO.push(this.outputRanges[i].min);
			maxVectorO.push(this.outputRanges[i].max);
		}
		let minVec4O = `vec4(${minVectorO.map(comp => comp.toFixed(5)).join(", ")})`;
		let spanVec4O = `vec4(${maxVectorO.map((comp, inx) => (comp - minVectorO[inx]).toFixed(5)).join(", ")})`;

		const pixelSource = `${prefix}
				${this.glsl}

				out vec4 pixelColor;

				void main() {
					pixelColor = (compute(getInput()) - ${minVec4O}) / ${spanVec4O};
				}
			`;
		let prefixLength = prefix.split("\n").length + 1;
		//shader programs
		let error = null;
		function compileShader(type, source) {
			let shader = gl.createShader(type);
			gl.shaderSource(shader, source);
			gl.compileShader(shader);
			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
				error = GLSLError.format(gl.getShaderInfoLog(shader), prefixLength);
				return false;
			}
			return shader;
		}
		const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
		const pixelShader = compileShader(gl.FRAGMENT_SHADER, pixelSource);
		if (!pixelShader) {
			this.compileState = { compiled: false, error };
			return false;
		}
		const shaderProgram = gl.createProgram();
		gl.attachShader(shaderProgram, vertexShader);
		gl.attachShader(shaderProgram, pixelShader);
		gl.linkProgram(shaderProgram);
		gl.useProgram(shaderProgram);

		// uniforms

		for (let i = 0; i < this.inputTextures.length; i++) {
			gl.uniform1i(gl.getUniformLocation(shaderProgram, `inputTexture${i}`), i);
		}

		this.compiled = { shaderProgram };

		// position
		const positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		let float32Array = new Float32Array([
			-1, 1,
			1, 1,
			-1, -1,
			1, -1
		]);
		gl.bufferData(gl.ARRAY_BUFFER, float32Array, gl.STATIC_DRAW);
		// console.log(this.problemWidth, this.problemHeight);
		let vertexPositionPointer = gl.getAttribLocation(shaderProgram, "vertexPosition");
		gl.vertexAttribPointer(vertexPositionPointer, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(vertexPositionPointer);

		this.compileState = { compiled: true, error };

		return true;
	}
	compute(buffer) {
		if (!this.compiled) return;

		const gl = this.gl;
		const width = this.problemWidth;
		const height = this.problemHeight;
		const format = gl.RGBA;
		const type = gl.UNSIGNED_BYTE;

		// write to textures
		for (let i = 0; i < this.inputTextureCount; i++) {
			gl.activeTexture(gl.TEXTURE0 + i);
			// console.log(buffer[i].toFloatData(this.inputRanges, new Float32Array(buffer[i].length * 4)).map(x => Math.round(x * 100) / 100));
			gl.bindTexture(gl.TEXTURE_2D, this.inputTextures[i]);
			gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, format, type, buffer[i].buffer);
		}

		// compute with textures
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

		//read result
		gl.readPixels(0, 0, width, height, format, type, buffer[0].buffer);
	}
	createBuffer() {
		let buffer = [];
		for (let i = 0; i < this.inputTextureCount; i++) buffer.push(GPUComputationByteBuffer.create(this.problemSize));
		return buffer;
	}
	writeBufferInput(buffer, inx, data) {
		inx *= 4;
		let keys = this.inputKeys;
		for (let i = 0; i < keys.length; i++) {
			buffer[Math.floor(i / 4)].buffer[inx + i % 4] = (data[keys[i]] - this.inputMins[i]) / this.inputFactors[i];
		}
	}
	readBufferOutput(buffer, inx, keys = ["x", "y", "z", "w"]) {
		let readBuffer = buffer[0].buffer;
		inx *= 4;
		const data = {};
		if (keys[0]) data[keys[0]] = readBuffer[inx] * this.outputFactors[0] + this.outputMins[0];
		if (keys[1]) data[keys[1]] = readBuffer[inx + 1] * this.outputFactors[1] + this.outputMins[1];
		if (keys[2]) data[keys[2]] = readBuffer[inx + 2] * this.outputFactors[2] + this.outputMins[2];
		if (keys[3]) data[keys[3]] = readBuffer[inx + 3] * this.outputFactors[3] + this.outputMins[3];
		return data;
	}
}
class GPUComputationByteBuffer {
	constructor(buffer) {
		this.length = buffer.length / 4;
		this.buffer = buffer;
	}
	setBytes(bytes) {
		for (let i = 0; i < bytes.length; i++) this.buffer[i] = bytes[i];
	}
	setAll(data) {
		for (let i = 0; i < data.length; i++) {
			let dat = data[i];
			let inx = i * 4;
			this.buffer[inx] = dat.x;
			this.buffer[inx + 1] = dat.y;
			this.buffer[inx + 2] = dat.z;
			this.buffer[inx + 3] = dat.w;
		}
	}
	get(index) {
		index *= 4;
		return new Uint8Array([
			this.buffer[index],
			this.buffer[index + 1],
			this.buffer[index + 2],
			this.buffer[index + 3]
		]);
	}
	set(index, value) {
		index *= 4;
		this.buffer[index] = value.x;
		this.buffer[index + 1] = value.y;
		this.buffer[index + 2] = value.z;
		this.buffer[index + 3] = value.w;
	}
	toFloatData(ranges, result) {
		let min0 = ranges[0].min;
		let min1 = ranges[1].min;
		let min2 = ranges[2].min;
		let min3 = ranges[3].min;
		let factor0 = ranges[0].length / 255;
		let factor1 = ranges[1].length / 255;
		let factor2 = ranges[2].length / 255;
		let factor3 = ranges[3].length / 255;

		for (let i = 0; i < this.length; i++) {
			let inx = i * 4;
			if (inx > result.length - 3) break;
			result[inx] = this.buffer[inx] * factor0 + min0,
				result[inx + 1] = this.buffer[inx + 1] * factor1 + min1,
				result[inx + 2] = this.buffer[inx + 2] * factor2 + min2,
				result[inx + 3] = this.buffer[inx + 3] * factor3 + min3
		}

		return result;
	}
	static fromByteArray(arr) {
		return new GPUComputationByteBuffer(arr);
	}
	static create(size) {
		return new GPUComputationByteBuffer(new Uint8Array(size * 4));
	}
	static fromByteData(size, data) {
		let buffer = GPUComputationByteBuffer.create(size);
		buffer.setAll(data);
	}
	static fromFloatData(size, data, ranges) {
		let buffer = GPUComputationByteBuffer.create(size);
		let min0 = ranges[0].min;
		let min1 = ranges[1].min;
		let min2 = ranges[2].min;
		let min3 = ranges[3].min;
		let factor0 = 255 / ranges[0].length;
		let factor1 = 255 / ranges[1].length;
		let factor2 = 255 / ranges[2].length;
		let factor3 = 255 / ranges[3].length;
		let ibuffer = buffer.buffer;
		for (let i = 0; i < data.length; i++) {
			let inx = i * 4;
			ibuffer[inx] = (data[inx] - min0) * factor0;
			ibuffer[inx + 1] = (data[inx + 1] - min1) * factor1;
			ibuffer[inx + 2] = (data[inx + 2] - min2) * factor2;
			ibuffer[inx + 3] = (data[inx + 3] - min3) * factor3;
		}
		return buffer;
	}
}
GPUComputation.SIGNED_BYTES = [new Range(-128, 127), new Range(-128, 127), new Range(-128, 127), new Range(-128, 127)];
GPUComputation.UNSIGNED_BYTES = [new Range(0, 255), new Range(0, 255), new Range(0, 255), new Range(0, 255)];