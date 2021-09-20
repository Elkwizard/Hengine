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

		{ // extract input/output sizes
			const result = this.glsl.match(/int\s*\[\s*(\d+)\s*\]\s*compute\s*\(\s*int\s*\[\s*(\d+)\s*\]/);
			const [_, outputs, inputs] = result.map(num => parseInt(num));
			this.inputBytes = inputs;
			this.outputBytes = outputs;
			this.outputPixels = Math.ceil(this.outputBytes / 4);
			this.totalInputPixels = Math.ceil(this.inputBytes * this.problems / 4);
		};

		{ // program
			const { gl } = this;

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
				
				uniform sampler2D _byteBuffer;
				uniform int _inputTextureWidth;
				uniform int _outputTextureWidth;

				#define problem (int(gl_FragCoord.y) * _outputTextureWidth + int(gl_FragCoord.x))

				ivec4 _fetchPixel(int index) {
					ivec2 texel = ivec2(
						index % _inputTextureWidth,
						index / _inputTextureWidth
					);
					vec4 pixel = texelFetch(_byteBuffer, texel, 0);
					return ivec4(pixel * 255.0);
				}
			`;
			const prefixLength = prefix.split("\n").length;

			this.fragmentShaderSource = `${prefix}
				${this.glsl}

${Array.dim(this.outputPixels).map((_, i) => `\t\t\t\tlayout(location = ${i}) out vec4 _outputColor${i};`).join("\n")}

				void main() {
					int[${this.inputBytes}] _inputs;

					ivec2 startIndex = ivec2(gl_FragCoord.xy);
					int firstByteIndex = problem * ${this.inputBytes};
					int lastByteIndex = firstByteIndex + ${this.inputBytes};
					int firstPixelIndex = firstByteIndex / 4;
					int lastPixelIndex = int(ceil(float(lastByteIndex) / 4.0));
					int bytesCopied = 0;
					int inputIndex = 0;
					for (int pixelIndex = firstPixelIndex; pixelIndex < lastPixelIndex; pixelIndex++) {
						ivec4 pixelColor = _fetchPixel(pixelIndex);
						int byteIndex = pixelIndex * 4;
						for (int j = 0; j < 4; j++, byteIndex++)
							if (byteIndex >= firstByteIndex && byteIndex < lastByteIndex)
								_inputs[inputIndex++] = pixelColor[j];
					}

					int[${this.outputBytes}] _outputs = compute(_inputs);

${Array.dim(this.outputPixels)
					.map((_, index) => {
						const startIndex = index * 4;
						const samples = [];
						for (let i = startIndex; i < this.outputBytes && i < startIndex + 4; i++) samples.push(`_outputs[${i}]`);
						for (let i = samples.length; i < 4; i++) samples.push("0.0");
						return `\t\t\t\t\t_outputColor${index} = vec4(${samples.join(", ")}) / 255.0;`
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
				const data = new Uint8Array(size * size * 4);
				const texture = gl.createTexture();

				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, texture);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

				return {
					size, texture, data, index,
					set: value => {
						const { byteLength, buffer } = value;
						const pxLength = Math.floor(byteLength / 4);
						const completeRows = Math.floor(pxLength / size);
						const lastRowWidth = pxLength % size;
						const pxLeft = byteLength % 4;
						
						gl.activeTexture(gl.TEXTURE0);
						gl.bindTexture(gl.TEXTURE_2D, texture);
						
						let nextX = 0;
						let nextY = completeRows;

						const completeRowsBuffer = new Uint8Array(buffer, 0, completeRows * size * 4);
						gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, size, completeRows, gl.RGBA, gl.UNSIGNED_BYTE, completeRowsBuffer);

						if (lastRowWidth) {
							const lastRowBuffer = new Uint8Array(buffer, completeRows * size * 4, lastRowWidth * 4);
							gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, completeRows, lastRowWidth, 1, gl.RGBA, gl.UNSIGNED_BYTE, lastRowBuffer);
							nextX = lastRowWidth;
						}

						if (pxLeft) {
							const lastPixelBuffer = new Uint8Array(4);
							const lastPixelData = new Uint8Array(buffer, pxLength * 4);
							lastPixelBuffer.set(lastPixelData);
							gl.texSubImage2D(gl.TEXTURE_2D, 0, nextX, nextY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, lastPixelBuffer);
						}
					},
					get: () => {
						gl.readBuffer(gl.COLOR_ATTACHMENT0 + index);
						gl.readPixels(0, 0, size, size, gl.RGBA, gl.UNSIGNED_BYTE, data);
						return data;
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

		const outputDataArrays = [];
		for (let i = 0; i < outputTextures.length; i++) {
			const texture = outputTextures[i];
			const data = texture.get();
			outputDataArrays.push(data);
		}

		output.pointer = 0;
		output.alloc(problems * outputBytes);
		const outputData = output.data;

		// output data array major
		const problems4 = problems * 4;
		for (let i = 0; i < outputDataArrays.length; i++) {
			const array = outputDataArrays[i];
			const bytes = Math.min(4, outputBytes - i * 4);

			let problemOffset = i * 4;
			for (let j = 0; j < problems4; j += 4) {
				for (let k = 0; k < bytes; k++)
					outputData[problemOffset + k] = array[j + k];
				problemOffset += outputBytes
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
			const regexp = new RegExp(`struct ${name} { ([^\}]*?) }`, "g");
			const contents = [...glsl.matchAll(regexp)][0][1];
			const fields = contents
				.split(";")
				.map(line => line.trim())
				.filter(line => line.length)
				.map(field => {
					let [type, names] = field.cut(" ");
					names = names.split(" , ");
					return names.map(name => ({ type, name }));
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
		const ofields = fields(outputStruct);

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
