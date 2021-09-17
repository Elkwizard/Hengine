class GPUComputation {
	constructor(problems, glsl) {
		{ // build context
			if (!window.WebGL2RenderingContext) throw new GLSLError(1, "GPUComputations are not supported");
			
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
			this.inputPixels = Math.ceil(this.inputBytes / 4);
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
				uniform int _textureWidth;

				ivec4 _fetchPixel(int index) {
					ivec2 texel = ivec2(
						index % _textureWidth,
						index / _textureWidth
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
					int problemIndex = startIndex.y * _textureWidth + startIndex.x;
					int firstByteIndex = problemIndex * ${this.inputBytes};
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

					ivec4 v = _fetchPixel(firstPixelIndex);
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
				gl.bindTexture(gl.TEXTURE_2D, texture);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
				return {
					size, texture, data, index,
					set: value => {
						const buffer = new Uint8Array(value.buffer, 0, data.length);
						gl.bindTexture(gl.TEXTURE_2D, texture);
						gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, size, size, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
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

			this.program.setUniform("_textureWidth", this.inputTexture.size);
		};
	}
	compute(input, output = new ByteBuffer()) {
		if (!this.hasContext) return output;

		const {
			gl, inputTexture,
			outputTextures, problems,
			outputBytes, outputTextureSize
		} = this;

		const { pointer } = input;
		input.pointer = 0;
		input.alloc(this.inputTexture.data.length);
		input.pointer = pointer;

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
		
		for (let i = 0; i < problems; i++) {
			for (let j = 0; j < outputBytes; j++) {
				const byte = outputDataArrays[j >> 2][i * 4 + j % 4];
				output.data[output.pointer++] = byte;
			}
		}

		output.pointer = 0;

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
}
