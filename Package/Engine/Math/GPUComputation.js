class GPUComputation {
	constructor(dataSize, unitSize, inputRanges, outputRanges, operation) {
		this.problemSizeExact = dataSize * 4;
		this.unitSize = unitSize;
		this.glsl = operation;
		this.inputRanges = inputRanges;
		this.outputRanges = outputRanges;
		while (this.inputRanges.length < 4) this.inputRanges.push(new Range(0, 255));
		while (this.outputRanges.length < 4) this.outputRanges.push(new Range(0, 255));
		this.inputMins = this.inputRanges.map(x => x.min);
		this.inputFactors = this.inputRanges.map(x => x.length / 255);
		this.outputMins = this.outputRanges.map(x => x.min);
		this.outputFactors = this.outputRanges.map(x => x.length / 255);

		// get texture size
		const BUFFER = 16;

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
		this.gl = this.image.getContext("webgl");
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

		this.uniformLocations = {
			inputTexture: null
		};
		const gl = this.gl;
		this.inputTexture = gl.createTexture();

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.inputTexture);
		
		// wrapping and stretching
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		// pixel buffer
		this.pixelBuffer = new Uint8Array(this.problemSize * 4);
		this.outputBuffer = new Array(this.problemSize * 4);//new Float8Array(this.problemSize * 4);
	}	
	set compiled(a) {
		this._compiled = a;
	}
	get compiled() {
		if (!this._compiled) exit("Didn't compile GPUComputation");
		return this._compiled;
	}
	compile() {
		if (this.gl.isContextLost()) return;

		//init
		const gl = this.gl;

		//sources
		const SCALE = 1.0;
		const SCALE_STR = SCALE.toFixed(2);
		const vertexSource = `
				attribute vec4 vertexPosition;

				varying highp vec2 position;

				void main() {
					gl_Position = vertexPosition;
					position = vec2((vertexPosition.x + 1.0) / 2.0 * ${SCALE_STR}, (vertexPosition.y + 1.0) / 2.0 * ${SCALE_STR});
				}
			`;
		
		let minVectorI = [];
		let maxVectorI = [];
		for (let i = 0; i < this.inputRanges.length; i++) {
			minVectorI.push(this.inputRanges[i].min);
			maxVectorI.push(this.inputRanges[i].max);
		}
		while (minVectorI.length < 4) {
			minVectorI.push(0);
			maxVectorI.push(0);
		}
		let minVec4I = `vec4(${minVectorI.map(comp => comp.toFixed(5)).join(", ")})`;
		let spanVec4I = `vec4(${maxVectorI.map((comp, inx) => (comp - minVectorI[inx]).toFixed(5)).join(", ")})`;

		const prefix = `
uniform highp sampler2D inputTexture;
varying highp vec2 position;
highp vec4 getInput() {
	return texture2D(inputTexture, position / ${SCALE_STR}) * ${spanVec4I} + ${minVec4I};
}
`;
		let minVectorO = [];
		let maxVectorO = [];
		for (let i = 0; i < this.outputRanges.length; i++) {
			minVectorO.push(this.outputRanges[i].min);
			maxVectorO.push(this.outputRanges[i].max);
		}
		while (minVectorO.length < 4) {
			minVectorO.push(0);
			maxVectorO.push(0);
		}
		let minVec4O = `vec4(${minVectorO.map(comp => comp.toFixed(5)).join(", ")})`;
		let spanVec4O = `vec4(${maxVectorO.map((comp, inx) => (comp - minVectorO[inx]).toFixed(5)).join(", ")})`;

		const pixelSource = `
				${prefix}
				${this.glsl}

				void main() {
					gl_FragColor = (compute() - ${minVec4O}) / ${spanVec4O};
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

		for (let key in this.uniformLocations) this.uniformLocations[key] = gl.getUniformLocation(shaderProgram, key);

		gl.uniform1i(this.uniformLocations.inputTexture, 0);

		this.compiled = { shaderProgram };

		// position
		const positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		let float32Array = new Float32Array([
			-1,	 1,
			 1,	 1,
			-1,	-1,
			 1,	-1
		]);
		gl.bufferData(gl.ARRAY_BUFFER, float32Array, gl.STATIC_DRAW);
		// console.log(this.problemWidth, this.problemHeight);
		let vertexPositionPointer = gl.getAttribLocation(shaderProgram, "vertexPosition");
		gl.vertexAttribPointer(vertexPositionPointer, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(vertexPositionPointer);

		this.compileState = { compiled: true, error };
		
		return true;
	}
	toOutputByte(float) {
		float.x = (float.x - this.outputMins[0]) / this.outputFactors[0];
		float.y = (float.y - this.outputMins[1]) / this.outputFactors[1];
		float.z = (float.z - this.outputMins[2]) / this.outputFactors[2];
		float.w = (float.w - this.outputMins[3]) / this.outputFactors[3];
		return float;
	}
	toInputByte(float) {
		float.x = (float.x - this.inputMins[0]) / this.inputFactors[0];
		float.y = (float.y - this.inputMins[1]) / this.inputFactors[1];
		float.z = (float.z - this.inputMins[2]) / this.inputFactors[2];
		float.w = (float.w - this.inputMins[3]) / this.inputFactors[3];
		return float;
	}
	toOutputFloat(byte) {
		byte.x = byte.x * this.outputFactors[0] + this.outputMins[0];
		byte.y = byte.y * this.outputFactors[1] + this.outputMins[1];
		byte.z = byte.z * this.outputFactors[2] + this.outputMins[2];
		byte.w = byte.w * this.outputFactors[3] + this.outputMins[3];
		return byte;
	}
	toInputFloat(byte) {
		byte.x = byte.x * this.inputFactors[0] + this.inputMins[0];
		byte.y = byte.y * this.inputFactors[1] + this.inputMins[1];
		byte.z = byte.z * this.inputFactors[2] + this.inputMins[2];
		byte.w = byte.w * this.inputFactors[3] + this.inputMins[3];
		return byte;
	}
	compute(data) {
		const gl = this.gl;
		const buffer = GPUComputationBuffer.fromFloatData(this.problemSize, data, this.inputRanges);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.problemWidth, this.problemHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, buffer.buffer);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		gl.readPixels(0, 0, this.problemWidth, this.problemHeight, gl.RGBA, gl.UNSIGNED_BYTE, buffer.buffer);
		return buffer.toFloatData(this.outputRanges, new Float32Array(data.length * 4));
	}
	static asFloat32Array(objects, keys) {
		let arr = new Float32Array(objects.length * 4);
		if (keys.length === 1) {
			let [key0] = keys;
			for (let i = 0; i < objects.length; i++) {
				let inx = i * 4;
				arr[inx] = objects[i][key0];
			}
		} else if (keys.length === 2) {
			let [key0, key1] = keys;
			for (let i = 0; i < objects.length; i++) {
				let inx = i * 4;
				arr[inx] = objects[i][key0];
				arr[inx + 1] = objects[i][key1];
			}
		} else if (keys.length === 3) {
			let [key0, key1, key2] = keys;
			for (let i = 0; i < objects.length; i++) {
				let inx = i * 4;
				arr[inx] = objects[i][key0];
				arr[inx + 1] = objects[i][key1];
				arr[inx + 2] = objects[i][key2];
			}
		} else {
			let [key0, key1, key2, key3] = keys;
			for (let i = 0; i < objects.length; i++) {
				let inx = i * 4;
				arr[inx] = objects[i][key0];
				arr[inx + 1] = objects[i][key1];
				arr[inx + 2] = objects[i][key2];
				arr[inx + 3] = objects[i][key3];
			}
		}
		return arr;
	}
	static asObjects(float32Array, keys) {
		let objects = new Array(float32Array.length / 4);
		for (let i = 0; i < objects.length; i++) {
			let inx = i * 4;
			let obj = { };
			for (let j = 0; j < keys.length; j++) obj[keys[j]] = float32Array[inx + j];
			objects[i] = obj;
		}
		return objects;
	}
}
class GPUComputationBuffer {
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
		return new GPUComputationEntry(
			this.buffer[index],
			this.buffer[index + 1],
			this.buffer[index + 2],
			this.buffer[index + 3]
		);
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
		return new GPUComputationBuffer(arr);
	}
	static create(size) {
		return new GPUComputationBuffer(new Uint8Array(size * 4));
	}
	static fromByteData(size, data) {
		let buffer = GPUComputationBuffer.create(size);
		buffer.setAll(data);
	}
	static fromFloatData(size, data, ranges) {
		let buffer = GPUComputationBuffer.create(size);
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
class GPUComputationEntry {
	constructor(x, y, z, w) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;
	}
}