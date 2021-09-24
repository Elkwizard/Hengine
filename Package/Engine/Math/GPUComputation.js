class GPUComputation {
	constructor(problems, glsl) {
		{ // build context
			if (!window.WebGL2RenderingContext) throw new ReferenceError("Your browser doesn't support WebGL");

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
			this.FORMAT = gl.RGBA_INTEGER;
			this.TYPE = gl.UNSIGNED_INT;
		};

		this._problems = problems;
		this._glsl = glsl;

		this.compile();
	}
	set problems(a) {
		this._problems = a;
		this.compile();
	}
	get problems() {
		return this._problems;
	}
	set glsl(a) {
		this._glsl = a;
		this.compile();
	}
	get glsl() {
		return this._glsl;
	}
	compile() {
		this._glsl = GLSLPrecompiler.compile(this.glsl);
		
		const { ELEMENTS_PER_PIXEL, BYTES_PER_PIXEL, BYTES_PER_CHANNEL, LITTLE_ENDIAN } = GPUComputation;

		{ // extract input/output sizes
			const result = this.glsl.match(/int\s*\[\s*(\d+)\s*\]\s*compute\s*\(\s*int\s*\[\s*(\d+)\s*\]/);
			const [_, outputs, inputs] = result.map(num => parseInt(num));
			this.inputBytes = inputs;
			this.outputBytes = outputs;
			this.outputPixels = Math.ceil(this.outputBytes / BYTES_PER_PIXEL);
			this.totalInputPixels = Math.ceil(this.inputBytes * this.problems / BYTES_PER_PIXEL);
		};

		{ // program
			const { gl } = this;

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

				#define problem (int(gl_FragCoord.y) * _outputTextureWidth + int(gl_FragCoord.x))

				uvec4 _fetchPixel(int index) {
					ivec2 texel = ivec2(
						index % _inputTextureWidth,
						index / _inputTextureWidth
					);
					uvec4 pixel = texelFetch(_byteBuffer, texel, 0);
					return pixel;
				}
			`;
			const prefixLength = prefix.split("\n").length;

			this.fragmentShaderSource = `${prefix}
				${this.glsl}

${Array.dim(this.outputPixels).map((_, i) => `\t\t\t\tlayout(location = ${i}) out uvec4 _outputColor${i};`).join("\n")}

				void main() {
					int[${this.inputBytes}] _inputs;

					ivec2 startIndex = ivec2(gl_FragCoord.xy);
					int firstByteIndex = problem * ${this.inputBytes};
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
							if (byteIndex + 0 >= firstByteIndex && byteIndex + 0 < lastByteIndex) _inputs[inputIndex++] = int((channel >> ${endian(0)}u) & 255u);
							if (byteIndex + 1 >= firstByteIndex && byteIndex + 1 < lastByteIndex) _inputs[inputIndex++] = int((channel >> ${endian(8)}u) & 255u);
							if (byteIndex + 2 >= firstByteIndex && byteIndex + 2 < lastByteIndex) _inputs[inputIndex++] = int((channel >> ${endian(16)}u) & 255u);
							if (byteIndex + 3 >= firstByteIndex && byteIndex + 3 < lastByteIndex) _inputs[inputIndex++] = int((channel >> ${endian(24)}u) & 255u);
						}
					}

					int[${this.outputBytes}] _outputs = compute(_inputs);

${Array.dim(this.outputPixels)
					.map((_, index) => {
						const startIndex = index * 4;
						const samples = [];
						for (let i = startIndex; i < startIndex + 4; i++) {
							const byteIndex = i * BYTES_PER_CHANNEL;
							const bytes = Math.min(BYTES_PER_CHANNEL, this.outputBytes - byteIndex);
							if (bytes <= 0) break;
							const ors = new Array(bytes).fill(0).map((_, inx) => `clamp(_outputs[${byteIndex + inx}], 0, 255) << ${endian(inx * 8)}`).join(" | ");
							samples.push(ors);
						}
						for (let i = samples.length; i < 4; i++) samples.push("0u");
						return `\t\t\t\t\t_outputColor${index} = uvec4(${samples.join(", ")});`
					})
					.join("\n")
				}
				}
			`;

			this.program = new GLSLProgram(gl, this.vertexShaderSource, this.fragmentShaderSource, (type, message) => {
				if (type === "FRAGMENT_SHADER") GLSLError.process(message, prefixLength);
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

		{ // build gl textures
			const { gl } = this;

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
				gl.texImage2D(gl.TEXTURE_2D, 0, this.INTERNAL_FORMAT, size, size, 0, this.FORMAT, this.TYPE, null);

				return {
					size, texture, data, data8, index,
					set: value => {
						const { byteLength, buffer } = value;
						const pxLength = Math.floor(byteLength / BYTES_PER_PIXEL);
						const completeRows = Math.floor(pxLength / size);
						const lastRowWidth = pxLength % size;
						const pxLeft = byteLength % BYTES_PER_PIXEL;
						
						gl.activeTexture(gl.TEXTURE0);
						gl.bindTexture(gl.TEXTURE_2D, texture);
						
						let nextX = 0;
						let nextY = completeRows;

						const completeRowsBuffer = new Uint32Array(buffer, 0, completeRows * size * ELEMENTS_PER_PIXEL);
						gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, size, completeRows, this.FORMAT, this.TYPE, completeRowsBuffer);

						if (lastRowWidth) {
							const lastRowBuffer = new Uint32Array(buffer, completeRows * size * BYTES_PER_PIXEL, lastRowWidth * ELEMENTS_PER_PIXEL);
							gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, completeRows, lastRowWidth, 1, this.FORMAT, this.TYPE, lastRowBuffer);
							nextX = lastRowWidth;
						}

						if (pxLeft) {
							const lastPixelBuffer8 = new Uint8Array(buffer, pxLength * BYTES_PER_PIXEL);
							const lastPixelBuffer = new Uint32Array(ELEMENTS_PER_PIXEL);
							const lastPixelBufferView8 = new Uint8Array(lastPixelBuffer.buffer);
							lastPixelBufferView8.set(lastPixelBuffer8);
							gl.texSubImage2D(gl.TEXTURE_2D, 0, nextX, nextY, 1, 1, this.FORMAT, this.TYPE, lastPixelBuffer);
						}
					},
					get: () => {
						gl.readBuffer(gl.COLOR_ATTACHMENT0 + index);
						gl.readPixels(0, 0, size, size, this.FORMAT, this.TYPE, data);
						return data8;
					}
				};
			};

			this.inputTexture = createTexture(this.totalInputPixels);
			this.outputTextureSize = getSize(this.problems);
			this.outputTextures = Array.dim(this.outputPixels).map((_, i) => createTexture(this.problems, i));

			gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
			for (let i = 0; i < this.outputTextures.length; i++) {
				const { texture } = this.outputTextures[i];
				gl.bindTexture(gl.TEXTURE_2D, texture);
				gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, texture, 0);
			}

			gl.drawBuffers(this.outputTextures.map((_, i) => gl.COLOR_ATTACHMENT0 + i));

			this.program.setUniform("_inputTextureWidth", this.inputTexture.size);
			this.program.setUniform("_outputTextureWidth", this.outputTextureSize);
		};
	}
	compute(input, output = new ByteBuffer()) {
		if (!this.hasContext) return output;

		const {
			gl, inputTexture,
			outputTextures, problems,
			outputBytes, outputTextureSize
		} = this;

		inputTexture.set(input.data);
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

		// problem major
		// let pointer = 0;
		// for (let i = 0; i < problems; i++) {
		// 	for (let j = 0; j < outputBytes; j++) {
		// 		const byte = outputDataArrays[j >> 2][i * 4 + j % 4];
		// 		output.data[pointer++] = byte;
		// 	}
		// }

		return output;
	}
	
	// arguments (from GPUShader)
	argumentExists(arg) {
		return this.program.hasUniform(arg);
	}
	getArgument(arg) {
		return this.program.getUniform(arg);
	}
	setArgument(arg, value) {
		this.program.setUniform(arg, value);
	}
	setArguments(uniformData = {}) {
		for (const key in uniformData) this.program.setUniform(key, uniformData[key]);
		this.loaded = false;
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
			float: `intBitsToFloat(ib[ip] << 24 | ib[ip + 1] << 16 | ib[ip + 2] << 8 | ib[ip + 3])`,
			int: `ib[ip] << 24 | ib[ip + 1] << 16 | ib[ip + 2] << 8 | ib[ip + 3]`,
			bool: `ib[ip] == 1`
		};

		const write = {
			float: `
			int bits = floatBitsToInt(value);
			ob[op] = (bits >> 24) & 255;
			ob[op + 1] = (bits >> 16) & 255;
			ob[op + 2] = (bits >> 8) & 255;
			ob[op + 3] = bits & 255;
		  `,
			int: `
			ob[op] = (value >> 24) & 255;
			ob[op + 1] = (value >> 16) & 255;
			ob[op + 2] = (value >> 8) & 255;
			ob[op + 3] = value & 255;
		  `,
			bool: `
			ob[op] = value ? 1 : 0;
		  `
		};

		function fields(name) {
			const regexp = new RegExp(`struct ${name} { ([^\}]*?) }`);
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
								
								return new Array(length)
									.fill(0)
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

		const userGLSL = originalGLSL.replace(/\bcompute\b/g, "_compute");

		const finalGLSL = `${userGLSL}
	
		  int[${outputBytes}] compute(int[${inputBytes}] ib) {
			// return ib;
			${inputStruct} i;
			int ip = 0;
	
			// read from input buffer
	${ifields.map((field, index) => makeReader(field, getByteOffset(ifields, index))).join("\n")}
			
			int ob[${outputBytes}];
			${outputStruct} o = _compute(i);
			int op = 0;
	
			// write to output buffer
	${ofields.map((field, index) => makeWriter(field, getByteOffset(ofields, index))).join("\n")}
			
			return ob;
		  }
		`;

		return finalGLSL;
	}
}
GPUComputation.BYTES_PER_PIXEL = 16;
GPUComputation.BYTES_PER_CHANNEL = 4;
GPUComputation.ELEMENTS_PER_PIXEL = GPUComputation.BYTES_PER_PIXEL / GPUComputation.BYTES_PER_CHANNEL;
{
	const buffer = new Uint16Array(2);
	const view = new Uint8Array(buffer.buffer);
	buffer[0] = 1;
	GPUComputation.LITTLE_ENDIAN = !!view[0];
};