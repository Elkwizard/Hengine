/**
 * Represents an operation that can be executed in parallel with itself on the GPU.
 * The operation's inputs and outputs are represented in as fixed-length arrays of bytes.
 * The main entry point is:
 * ```glsl
 * int[OUTPUT_BYTES] compute(int[INPUT_BYTES] inputs) {
 * 	// your main code here
 * }
 * ```
 * Where `INPUT_BYTES` and `OUTPUT_BYTES` are the sizes of the inputs and outputs of the operation.
 * There are some helper variables and functions provided, specifically:
 * ```glsl
 * #define PROBLEM_INDEX // the index of the operation in the batch
 * #define PROBLEMS // the size of the batch
 * 
 * // returns the input data for a specific operation in the batch
 * int[INPUT_BYTES] getProblem(int index);
 * ```
 * @prop String glsl | The source code of the operation. See the GLSL API
 */
class GPUComputation {
	/**
	 * Creates a new GPUComputation.
	 * @param String glsl | The source code of the operation
	 */
	constructor(glsl) {
		{ // build context
			if (!window.WebGL2RenderingContext) throw new ReferenceError("Your browser doesn't support GPUComputations");

			this.canvas = new_OffscreenCanvas(1, 1);
			this.gl = this.canvas.getContext("webgl2", {
				depth: false,
				stencil: false
			});

			this.hasContext = true;
			this.canvas.addEventListener("webglcontextlost", event => {
				event.preventDefault();
				console.warn("WebGL Context Lost");
				this.hasContext = false;
			});
			this.canvas.addEventListener("webglcontextrestored", event => {
				event.preventDefault();
				console.warn("WebGL Context Restored");
				this.hasContext = true;
				this.compile();
			});
			this.MAX_TEXTURE_SIZE = this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE);

			const { gl } = this;

			this.INTERNAL_FORMAT = gl.RGBA32UI;
			/*
			g l . R G B A 32 U I
			r i   e r l l b  n n
			a b   d e u p i  s t
			p r     e e h t  i e
			h a     n   a s  g g
			i r              n e
			c y              e r
			s                d 
			*/
			this.FORMAT = gl.RGBA_INTEGER;
			this.TYPE = gl.UNSIGNED_INT;
		};

		this._capacity = 1;
		this.glsl = glsl;
	}
	set capacity(a) {
		this._capacity = a;
		this.setupTextures();
	}
	get capacity() {
		return this._capacity;
	}
	set glsl(a) {
		this._glsl = a;
		this.processGLSL();
		this.compile();
	}
	get glsl() {
		return this._glsl;
	}
	processGLSL() {
		this._glsl = GLSLPrecompiler.compile(this.glsl);
	}
	setupTextures() {
		const { ELEMENTS_PER_PIXEL, BYTES_PER_PIXEL } = GPUComputation;
		const { gl, FORMAT, INTERNAL_FORMAT, TYPE } = this;
		
		if (this.inputTexture) { // clean up
			this.inputTexture.delete();
			for (let i = 0; i < this.outputTextures.length; i++)
				this.outputTextures[i].delete();
			gl.deleteFramebuffer(this.framebuffer);
		}

		this.framebuffer = gl.createFramebuffer();

		const getSize = count => Math.ceil(Math.sqrt(count));

		const createTexture = (count, index = 0) => {
			const size = getSize(count);
			const data = new Uint32Array(size * size * ELEMENTS_PER_PIXEL);
			const data8 = new Uint8Array(data.buffer);
			const texture = gl.createTexture();

			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texImage2D(gl.TEXTURE_2D, 0, INTERNAL_FORMAT, size, size, 0, FORMAT, TYPE, null);

			return {
				size, texture, data, data8, index,
				set: (buffer, byteLength) => {
					const pxLength = Math.floor(byteLength / BYTES_PER_PIXEL);
					const completeRows = Math.floor(pxLength / size);
					const lastRowWidth = pxLength % size;
					const pxLeft = byteLength % BYTES_PER_PIXEL;

					gl.activeTexture(gl.TEXTURE0);
					gl.bindTexture(gl.TEXTURE_2D, texture);
					
					let nextX = 0;
					let nextY = completeRows;

					const completeRowsBuffer = new Uint32Array(buffer, 0, completeRows * size * ELEMENTS_PER_PIXEL);
					gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, size, completeRows, FORMAT, TYPE, completeRowsBuffer);

					if (lastRowWidth) {
						const lastRowBuffer = new Uint32Array(buffer, completeRows * size * BYTES_PER_PIXEL, lastRowWidth * ELEMENTS_PER_PIXEL);
						gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, completeRows, lastRowWidth, 1, FORMAT, TYPE, lastRowBuffer);
						nextX = lastRowWidth;
					}

					if (pxLeft) {
						const lastPixelBuffer8 = new Uint8Array(buffer, pxLength * BYTES_PER_PIXEL, pxLeft);
						const lastPixelBuffer = new Uint32Array(ELEMENTS_PER_PIXEL);
						const lastPixelBufferView8 = new Uint8Array(lastPixelBuffer.buffer);
						lastPixelBufferView8.set(lastPixelBuffer8);
						gl.texSubImage2D(gl.TEXTURE_2D, 0, nextX, nextY, 1, 1, FORMAT, TYPE, lastPixelBuffer);
					}
				},
				get: () => {
					gl.readBuffer(gl.COLOR_ATTACHMENT0 + index);
					gl.readPixels(0, 0, size, size, FORMAT, TYPE, data);
					return data8;
				},
				delete: () => gl.deleteTexture(texture)
			};
		};

		
		const totalInputPixels = Math.ceil(this.inputBytes * this.capacity / BYTES_PER_PIXEL);
		this.inputTexture = createTexture(totalInputPixels);
		this.outputTextureSize = getSize(this.capacity);
		this.outputTextures = Array.dim(this.outputPixels).map((_, i) => createTexture(this.capacity, i));

		gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
		for (let i = 0; i < this.outputTextures.length; i++) {
			const { texture } = this.outputTextures[i];
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, texture, 0);
		}

		gl.drawBuffers(this.outputTextures.map((_, i) => gl.COLOR_ATTACHMENT0 + i));

		this.program.setUniform("_inputTextureWidth", this.inputTexture.size);
		this.program.setUniform("_outputTextureWidth", this.outputTextureSize);
	}
	compile() {
		const { BYTES_PER_PIXEL, BYTES_PER_CHANNEL, LITTLE_ENDIAN } = GPUComputation;
		const { gl } = this;

		{ // extract input/output sizes
			const result = this.glsl.match(/int\s*\[\s*(\d+)\s*\]\s*compute\s*\(\s*int\s*\[\s*(\d+)\s*\]/);
			const [_, outputs, inputs] = result.map(num => parseInt(num));
			this.inputBytes = inputs;
			this.outputBytes = outputs;
			this.outputPixels = Math.ceil(this.outputBytes / BYTES_PER_PIXEL);
		};

		{ // program
			const endian = shift => LITTLE_ENDIAN ? shift : (24 - shift);

			this.vertexShaderSource = `#version 300 es
				in highp vec2 uv;

				void main() {
					gl_Position = vec4(uv, 0.0, 1.0);
				}
			`;

			const prefix = `#version 300 es
				precision highp float;
				precision highp int;
				precision highp sampler2D;
				
				uniform highp usampler2D _byteBuffer;
				uniform int _inputTextureWidth;
				uniform int _outputTextureWidth;
				uniform int _problems;

				#define PROBLEM_INDEX (int(gl_FragCoord.y) * _outputTextureWidth + int(gl_FragCoord.x))
				#define PROBLEMS _problems

				uvec4 _fetchPixel(int index) {
					ivec2 texel = ivec2(
						index % _inputTextureWidth,
						index / _inputTextureWidth
					);
					uvec4 pixel = texelFetch(_byteBuffer, texel, 0);
					return pixel;
				}

				int[${this.inputBytes}] getProblem(int problemIndex) {
					int[${this.inputBytes}] problemBytes;

					int firstByteIndex = problemIndex * ${this.inputBytes};
					int lastByteIndex = firstByteIndex + ${this.inputBytes};
					int firstPixelIndex = firstByteIndex / ${BYTES_PER_PIXEL};
					int lastPixelIndex = int(ceil(float(lastByteIndex) / ${BYTES_PER_PIXEL}.0));
					
					int inputIndex = 0;
					for (int pixelIndex = firstPixelIndex; pixelIndex < lastPixelIndex; pixelIndex++) {
						uvec4 pixelColor = _fetchPixel(pixelIndex);
						int byteIndex = pixelIndex * ${BYTES_PER_PIXEL};
						for (int j = 0; j < 4; j++, byteIndex += ${BYTES_PER_CHANNEL}) {
							if (byteIndex >= lastByteIndex) break;
							uint channel = pixelColor[j];
							if (byteIndex + 0 >= firstByteIndex && byteIndex + 0 < lastByteIndex) problemBytes[inputIndex++] = int((channel >> ${endian(0)}u) & 255u);
							if (byteIndex + 1 >= firstByteIndex && byteIndex + 1 < lastByteIndex) problemBytes[inputIndex++] = int((channel >> ${endian(8)}u) & 255u);
							if (byteIndex + 2 >= firstByteIndex && byteIndex + 2 < lastByteIndex) problemBytes[inputIndex++] = int((channel >> ${endian(16)}u) & 255u);
							if (byteIndex + 3 >= firstByteIndex && byteIndex + 3 < lastByteIndex) problemBytes[inputIndex++] = int((channel >> ${endian(24)}u) & 255u);
						}
					}

					return problemBytes;
				}
			`;
			const prefixLength = prefix.split("\n").length;

			this.fragmentShaderSource = `${prefix}
				${this.glsl}

				${Array
					.dim(this.outputPixels)
					.map((_, i) => `\t\t\t\tlayout(location = ${i}) out uvec4 _outputColor${i};`)
					.join("\n")
				}

				void main() {
					int problemIndex = PROBLEM_INDEX;
					if (problemIndex >= PROBLEMS) return;
					int[${this.inputBytes}] inputs = getProblem(problemIndex);
					int[${this.outputBytes}] outputs = compute(inputs);

					${Array
						.dim(this.outputPixels)
						.map((_, index) => {
							const startIndex = index * 4;
							const samples = [];
							for (let i = startIndex; i < startIndex + 4; i++) {
								const byteIndex = i * BYTES_PER_CHANNEL;
								const bytes = Math.min(BYTES_PER_CHANNEL, this.outputBytes - byteIndex);
								if (bytes <= 0) break;
								const ors = Array.dim(bytes)
									.map((_, inx) => `clamp(outputs[${byteIndex + inx}], 0, 255) << ${endian(inx * 8)}`)
									.join(" | ");
								samples.push(ors);
							}
							for (let i = samples.length; i < 4; i++) samples.push("0");
							return `\t\t\t\t\t_outputColor${index} = uvec4(${samples.join(", ")});`;
						})	
						.join("\n")
					}
				}
			`;

			this.program = new GLSLProgram(gl, this.vertexShaderSource, this.fragmentShaderSource, (type, message) => {
				if (type === "FRAGMENT_SHADER")
					GLSLError.process(this.glsl, message, prefixLength);
				else console.warn(message);
			});

			this.program.use();
			const vertexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
				-1, 1,
				1, 1,
				-1, -1,
				1, -1
			]), gl.STATIC_DRAW);
			this.program.setAttributes(vertexBuffer, 0);
		};

		this.setupTextures();
	}
	reserve(length) {
		if (this._capacity === undefined) {
			this._capacity = length;
			this.glsl = this._glsl;
		} else if (length > this._capacity) {
			let newProblems = this._capacity;
			while (newProblems < length)
				newProblems = Math.ceil(newProblems * 1.5 + 1);
			this.capacity = newProblems;
		}
	}
	/**
	 * Evaluates the operation on a batch of inputs simultaneously.
	 * Returns the outputs in a contiguous buffer in the same order as the inputs.
	 * @param ByteBuffer input | The buffer containing the inputs of all the operations. These should be directly contiguous
	 * @param ByteBuffer output? | The buffer to write the output of the operations to. It will be packed contiguously. If not specified, this will be a newly created buffer
	 * @param Number problems? | The number of problems in the batch. This will be based on the size of the input buffer if not specified
	 * @return ByteBuffer
	 */
	compute(input, output = new ByteBuffer(), problems = input.byteLength / this.inputBytes) {
		if (!this.hasContext) return output;

		this.reserve(problems);
		this.program.setUniform("_problems", problems);

		const {
			gl, inputTexture,
			outputTextures,
			outputBytes,
			outputTextureSize
		} = this;

		inputTexture.set(input.data.buffer, problems * this.inputBytes);
		gl.viewport(0, 0, outputTextureSize, outputTextureSize);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

		output.pointer = 0;
		output.alloc(problems * outputBytes);
		const outputData = output.data;
		
		const { BYTES_PER_PIXEL } = GPUComputation;

		// output data array major
		const outputTextureBytes = problems * BYTES_PER_PIXEL;
		for (let i = 0; i < outputTextures.length; i++) {
			const array = outputTextures[i].get();
			const bytes = Math.min(BYTES_PER_PIXEL, outputBytes - i * BYTES_PER_PIXEL);

			let problemOffset = i * BYTES_PER_PIXEL;
			for (let j = 0; j < outputTextureBytes; j += BYTES_PER_PIXEL) {
				for (let k = 0; k < bytes; k++)
					outputData[problemOffset + k] = array[j + k];
				problemOffset += outputBytes;
			}
		}

		return output;
	}
	/**
	 * Returns whether or not the shader contains a given uniform.
	 * @param String name | The name of the uniform to check 
	 * @return Boolean
	 */
	argumentExists(arg) {
		return this.program.hasUniform(arg);
	}
	/**
	 * Returns the current value of a given uniform.
	 * For the return value of this function, see the GLSL API
	 * @param String name | The name of the uniform to retrieve
	 * @return Any
	 */
	getArgument(arg) {
		return this.program.getUniform(arg);
	}
	/**
	 * Sets the value of a given uniform.
	 * @param String name | The name of the uniform to set
	 * @param Any value | The new value for the uniform. For the type of this argument, see the GLSL API
	 */
	setArgument(arg, value) {
		this.setArguments({ [arg]: value });
	}
	/**
	 * Sets the value of one or more uniforms. 
	 * @param Object uniforms | A collection of key-value pairs, where the key is the name of the uniform to set, and the value is the new value for that uniform
	 */
	setArguments(uniformData = {}) {
		for (const key in uniformData)
			this.program.setUniform(key, uniformData[key]);
	}
	static destructure(glsl) {
		return GPUComputation.Structured.destructure(glsl).glsl;
	}
}
GPUComputation.BYTES_PER_PIXEL = 16;
GPUComputation.BYTES_PER_CHANNEL = GPUComputation.BYTES_PER_PIXEL / 4;
GPUComputation.ELEMENTS_PER_PIXEL = GPUComputation.BYTES_PER_PIXEL / GPUComputation.BYTES_PER_CHANNEL;
{
	const buffer = new Uint16Array(2);
	const view = new Uint8Array(buffer.buffer);
	buffer[0] = 1;
	GPUComputation.LITTLE_ENDIAN = !!view[0];
};

/**
 * @name class GPUComputation.Structured extends GPUComputation
 * Represents an operation that can be executed in parallel with itself on the GPU.
 * This behaves much like GPUComputation except that the input and output of the operation are GLSL structs.
 * The values of the input and output structs are represented in JavaScript as objects, whose properties must be in the same order as the fields on the GLSL structs. 
 * The main entry point is:
 * ```glsl
 * OutputStruct compute(InputStruct input) {
 * 	// your main code here
 * }
 * ```
 * The input and output structs may have arbitrary names, and your GLSL must include the declarations of these structs.
 * ```glsl
 * struct InputStruct {
 * 	// your input fields
 * };
 * struct OutputStruct {
 * 	// your output fields
 * };
 * ```
 * The helper functions and variables from GPUComputation are also present, specifically:
 * ```glsl
 * #define PROBLEM_INDEX // the index of the operation in the batch
 * #define PROBLEMS // the size of the batch
 * 
 * // returns the input data for a specific operation in the batch
 * InputStruct getProblem(int index);
 * ```
 * @prop String glsl | The source code of the operation. See the GLSL API
 * @prop ByteBuffer inputBuffer | A buffer containing all of the current input data. This can be freely written to
 * @prop ByteBuffer outputBuffer | A buffer containing the output of the most recent computation. This can be freely read from
 */
GPUComputation.Structured = class StructuredGPUComputation extends GPUComputation {
	/**
	 * Creates a new structured GPU Computation.
	 * @param String glsl | The source code for the operation
	 */
	constructor(glsl) {
		super(glsl);
		this.inputBuffer = new ByteBuffer();
		this.outputBuffer = new ByteBuffer();
	}
	processGLSL() {
		({
			glsl: this._glsl,
			inputFields: this.inputFields,
			outputFields: this.outputFields
		} = GPUComputation.Structured.destructure(this.glsl));
		super.processGLSL();
	}
	compile() {
		super.compile();
		this.writeFunction = this.readFunction = null;
	}
	guaranteeWrite(input) {
		if (this.writeFunction) return;
			
		const types = {
			float: [["float32", ""]],
			int: [["int32", ""]],
			bool: [["bool", ""]]
		};

		for (const type in GPUComputation.Structured.VECTORS) {
			const vecName = GPUComputation.Structured.VECTORS[type];
			const elType = types[type][0][0];
			for (let n = 2; n <= 4; n++) {
				const name = vecName + n;
				const inxs = Array.dim(n).map((_, i) => i);
				types[name] = [
					inxs.map(i => [elType, `.${Vector4.modValues[i]}`]),
					inxs.map(i => [elType, `.${Color.modValues[i]}${i === 3 ? "" : " / 255"}`])
				];
			}
		}

		const source = this.inputFields.flatMap(({ name, type }) => {
			let pieces = types[type];
			const value = input[0][name];
			if (typeof value === "object")
				pieces = value instanceof Color ? pieces[1] : pieces[0];
			return pieces.map(([write, suffix]) => `write.${write}(obj.${name}${suffix});`);
		}).join("\n");

		this.writeFunction = new Function("obj", "write", source);
	}
	/**
	 * Writes an array of objects into the input buffer of the computation.
	 * The objects' structure must correspond to the structure of the GLSL input struct.
	 * @param Object[] input | The objects to read the data from
	 */
	writeInput(input) {
		this.problems = input.length;
		if (!this.problems) return;
		this.guaranteeWrite(input);

		const { writeFunction } = this;
		const { write } = this.inputBuffer;
		const { length } = input;

		this.inputBuffer.pointer = 0;
		for (let i = 0; i < length; i++)
			writeFunction(input[i], write);
	}
	/**
	 * Appends an array of objects after the existing input data.
	 * The objects' structure must correspond to the structure the GLSL input struct.
	 * @param Object[] input | The objects to read the data from
	 */
	appendInput(input) {
		this.guaranteeWrite(input);
		
		const { writeFunction } = this;
		const { write } = this.inputBuffer;
		const { length } = input;

		this.inputBuffer.pointer = this.problems * this.inputBytes;
		for (let i = 0; i < length; i++)
			writeFunction(input[i], write);
		this.problems += length;
	}
	guaranteeRead(output) {
		if (this.readFunction) return;

		const types = {
			float: [["", "float32", ""]],
			int: [["", "int32", ""]],
			bool: [["", "bool", ""]]
		};

		for (const type in GPUComputation.Structured.VECTORS) {
			const vecName = GPUComputation.Structured.VECTORS[type];
			const elType = types[type][0][1];
			for (let n = 2; n <= 4; n++) {
				const name = vecName + n;
				const inxs = Array.dim(n).map((_, i) => i);
				types[name] = [
					inxs.map(i => [`.${Vector4.modValues[i]}`, elType, ""]),
					inxs.map(i => [`.${Color.modValues[i]}`, elType, i === 3 ? "" : " * 255"])
				];
			}
		}

		const source = this.outputFields.flatMap(({ name, type }) => {
			let pieces = types[type];
			const value = output[0][name];
			if (typeof value === "object")
				pieces = value instanceof Color ? pieces[1] : pieces[0];
			return pieces.map(([prop, read, suffix]) => `obj.${name}${prop} = read.${read}()${suffix};`);
		}).join("\n");

		this.readFunction = new Function("obj", "read", source);
	}
	/**
	 * Reads the output buffer into an array of objects, where the structure of the objects corresponds to the structure of the GLSL output struct.
	 * Returns the passed array.
	 * @param Object[] output | The objects to write the output to
	 * @return Object[]
	 */
	readOutput(output) {
		this.problems = output.length;
		if (!output.length) return;
		this.guaranteeRead(output);

		const { readFunction } = this;
		const { read } = this.outputBuffer;
		const { length } = output;
		
		this.outputBuffer.pointer = 0;
		for (let i = 0; i < length; i++)
			readFunction(output[i], read);

		return output;
	}
	/**
	 * Runs the computation on a given input array and writes the result to a given output array.
	 * The output parameter is returned.
	 * @param Object[] input | The data to use as the input to the computation. If this is omitted, the data already in the input buffer will be used
	 * @param Object[] output | The location to place the output data. If this is omitted, the result will be placed into the input buffer. This parameter can only be omitted when the GLSL input and output structs are the same
	 * @return Object[]/void
	 */
	compute(input, output = input) {
		if (input !== undefined)
			this.writeInput(input);
		
		super.compute(this.inputBuffer, this.outputBuffer, this.problems);

		if (output === undefined)
			this.outputBuffer.get(this.inputBuffer);
		else this.readOutput(output);

		return output;
	}
	static destructure(glsl) {
		const originalGLSL = glsl;

		glsl = GLSLPrecompiler.compile(glsl);
		glsl = glsl
			.replace(/\s+/g, " ")
			.split(/\b/g)
			.map(token => token.trim())
			.filter(token => token)
			.join(" ");

		const signature = glsl
			.match(/(\w+?) compute \( (\w+?) /g);

		if (signature === null) throw new GLSLError(1, "There is no compute() function");

		const [outputStruct, , , inputStruct] = signature[0].split(" ");

		const size = {
			float: 4,
			int: 4,
			bool: 1
		};

		const read = {
			float: `intBitsToFloat(ib[ip] | ib[ip + 1] << 8 | ib[ip + 2] << 16 | ib[ip + 3] << 24)`,
			int: `ib[ip] | ib[ip + 1] << 8 | ib[ip + 2] << 16 | ib[ip + 3] << 24`,
			bool: `ib[ip] == 1`
		};

		const write = {
			float: `
				int bits = floatBitsToInt(value);
				ob[op] = bits & 255;
				ob[op + 1] = (bits >> 8) & 255;
				ob[op + 2] = (bits >> 16) & 255;
				ob[op + 3] = (bits >> 24) & 255;
		    `,
			int: `
				ob[op] = value & 255;
				ob[op + 1] = (value >> 8) & 255;
				ob[op + 2] = (value >> 16) & 255;
				ob[op + 3] = (value >> 24) & 255;
		  	`,
			bool: `
				ob[op] = value ? 1 : 0;
		  	`
		};

		for (const type in GPUComputation.Structured.VECTORS) {
			const vecName = GPUComputation.Structured.VECTORS[type];
			const elSize = size[type];
			const readEl = read[type];
			const writeEl = write[type];
			for (let n = 2; n <= 4; n++) {
				const name = vecName + n;
				size[name] = elSize * n;
				read[name] = `${name}(${
					Array.dim(n)
						.map((_, i) => readEl.replaceAll("ip", `ip + ${i * elSize}`))
						.join(", ")
				})`;
				write[name] = Array.dim(n)
					.map((_, i) => {
						return "{" + writeEl
							.replaceAll("op", `op + ${i * elSize}`)
							.replace("value", `value[${i}]`) + "}";
					})
					.join("\n");
			}
		}

		function fields(name) {
			const regexp = new RegExp(`struct ${name} { ([^\}]*?) };`);
			const contents = glsl.match(regexp)[1];
			const fields = contents
				.split(";")
				.map(line => line.trim())
				.filter(line => line.length)
				.map(field => {
					const array = field.indexOf("[") > -1;
					let arrayLength;

					field = field.split(" ");
					const type = field[0];
					if (field[1] === "[") {
						arrayLength = parseInt(field[2]);
						field = field.slice(4);
					} else field = field.slice(1);

					const names = field
						.join("")
						.split(",")
						.map(name => {
							if (array) {
								let length = arrayLength;
								if (length === undefined) {
									const index = name.indexOf("[");
									length = parseInt(name.slice(index + 1));
									name = name.slice(0, index);
								}
								
								return Array.dim(length)
									.map((_, i) => ({ type, name: `${name}[${i}]`}));
							}

							return [{ type, name }];
						})
						.reduce((a, b) => [...a, ...b], []);

					return names;
				})
				.reduce((a, b) => [...a, ...b], []);

			return fields;
		}

		function getByteOffset(fields, index = fields.length) {
			let offset = 0;
			for (let i = 0; i < index; i++) {
				const { type } = fields[i];
				if (type in size) offset += size[type];
				else throw new GLSLError(1, `Fields of type '${type}' are not supported`);
			}
			return offset;
		}

		function makeReader({ type, name }, byteOffset) {
			if (type in read) return `
			ip = ${byteOffset};
			i.${name} = ${read[type]};
		  `;
			else throw new GLSLError(1, `Input fields of type '${type}' are not supported`);
		}

		function makeWriter({ type, name }, byteOffset) {
			if (type in write) return `
			op = ${byteOffset};
			{
			  ${type} value = o.${name};
			  ${write[type]}
			};
		  `;
			else throw new GLSLError(1, `Output fields of type '${type}' are not supported`);
		}

		const ifields = fields(inputStruct);
		const ofields = (inputStruct === outputStruct) ? ifields : fields(outputStruct);

		const inputBytes = getByteOffset(ifields);
		const outputBytes = getByteOffset(ofields);
		
		const readerGLSL = "int " + ifields.map((field, index) => makeReader(field, getByteOffset(ifields, index))).join("\n");
		const writerGLSL = "int " + ofields.map((field, index) => makeWriter(field, getByteOffset(ofields, index))).join("\n");

		let userGLSL = originalGLSL
			.replace(/\bcompute\b/g, "_compute")
			.replace(/\bgetProblem\b/g, "_getProblem");

		{
			const regexp = new RegExp(String.raw`struct\s+${inputStruct}\s+\{((.|\n)*?)\};`);
			const result = userGLSL.match(regexp);
			const lastIndex = result.index + result[0].length;
			const infix = `
				${inputStruct} _getProblem(int problemIndex) {
					${inputStruct} i;
					int[${inputBytes}] ib = getProblem(problemIndex);
					${readerGLSL}
					return i;
				}
			`;
			userGLSL = userGLSL.slice(0, lastIndex) + infix.replace(/\s+/g, " ") + userGLSL.slice(lastIndex);
		};

		const finalGLSL = `${userGLSL}

			int[${outputBytes}] compute(int[${inputBytes}] ib) {
				${inputStruct} i;
				${readerGLSL}
				
				${outputStruct} o = _compute(i);
				int ob[${outputBytes}];
				${writerGLSL}
				
				return ob;
			}
		`;

		return {
			glsl: finalGLSL,
			inputFields: ifields,
			outputFields: ofields
		};
	}
}
GPUComputation.Structured.VECTORS = {
	"float": "vec",
	"int": "ivec",
	"bool": "bvec"
};