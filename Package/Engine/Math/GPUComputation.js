/**
 * @implements GPUInterface
 * Represents a GLSL operation that can be run in parallel on the GPU.
 * The entry point for the GLSL operation is the `compute` function, which returns any struct type and takes no arguments.
 * ```glsl
 * SomeStruct compute() { ... }
 * ```
 * The returned value is considered the output of the operation, and some global variables are provided as the input:
 * ```glsl
 * uniform int problems; // the total number of operations in the current batch
 * int problemIndex; // the index of the current operation in the batch
 * ```
 * Commonly, one or more dynamic array uniforms can be used to store complex input data, as shown in the following example.
 * ```js
 * // computation to move circles toward the middle of the screen
 * const computation = new GPUComputation(`
 * 	struct Circle {
 * 		vec2 position;
 * 		float radius;
 * 	};
 * 
 * 	uniform Circle[] circles;
 * 	uniform vec2 middle;
 * 
 * 	Circle compute() {
 * 		Circle circle = circles[problemIndex];
 * 		circle.position = mix(circle.position, middle, 0.01);
 * 		return circle;
 * 	}
 * `);
 * 
 * const circles = Array.dim(1000).map(() => {
 * 	return { position: Random.inShape(scene.camera.screen), radius: 10 };
 * });
 * 
 * // write, compute, and readback circle data
 * computation.setArguments({ circles, middle });
 * computation.compute(circles.length);
 * computation.output.read(circles);
 * ```
 * @prop GPUArray output | An array storing the output of the most recent batch of operations
 */
class GPUComputation extends GPUInterface {
	constructor(glsl) {
		super(glsl, 1, 1);
		if (this.gl instanceof WebGLRenderingContext)
			throw new Error("Your browser doesn't support WebGL2");
	}
	get prefixLength() {
		return 0;
	}
	get vertexShader() {
		return `
			in highp vec2 uv;

			void main() {
				gl_Position = vec4(uv, 0, 1);
			}
		`;
	}
	get prefix() {
		return `
			precision highp float;
			precision highp int;
			precision highp sampler2D;

			uniform int problems;
			uniform int _width;

			int problemIndex;
		`;
	}
	get fragmentShader() {
		const { SIZE, VECTORS } = GLSL;
		const { PIXEL_BYTES, CHANNEL_BYTES, LITTLE_ENDIAN } = GPUDataTexture;
		const pixels = Math.ceil(this.struct.size / PIXEL_BYTES);
		const outColors = Array.dim(pixels).map((_, i) => `_output${i}`);
		const channels = Color.modValues.map(key => key[0]);

		const WRITE = {
			"bool": (expr, index) => `bytes[${index}] = int(${expr})`,
			"int": (expr, index) => `{ int val = ${expr}; bytes[${index}] = val & 255; bytes[${index + 1}] = (val >> 8) & 255; bytes[${index + 2}] = (val >> 16) & 255; bytes[${index + 3}] = (val >> 24) & 255; }`,
			"float": (expr, index) => WRITE.int(`floatBitsToInt(${expr})`, index)
		};

		for (const key in WRITE) {
			const vecName = VECTORS[key];
			const elSize = SIZE[key];
			const write = WRITE[key];
			for (let i = 2; i <= 4; i++) {
				const name = vecName + i;
				WRITE[name] = (expr, index) => Array.dim(i)
					.map((_, i) => write(`${expr}.${Vector4.modValues[i]}`, index + i * elSize))
					.join("\n");
			}
		}

		let offset = 0;
		const writes = [];
		for (let i = 0; i < this.struct.fields.length; i++) {
			const { name, type } = this.struct.fields[i];
			writes.push(`${WRITE[type](`value.${name}`, offset)};`);
			offset += SIZE[type];
		}

		return `
			${outColors.map((color, i) => `layout (location = ${i}) out uvec4 ${color};`).join("\n")}

			void main() {
				problemIndex = int(gl_FragCoord.x) + int(gl_FragCoord.y) * _width;
				if (problemIndex >= problems) return;
				${this.struct.name} value = compute();

				int[${this.struct.size}] bytes;
				${writes.join("\n")}
				${
					Array.dim(Math.ceil(this.struct.size / CHANNEL_BYTES))
						.map((_, i) => {
							const color = outColors[Math.floor(i / channels.length)];
							const channel = channels[i % channels.length];
							const maxOffset = (CHANNEL_BYTES - 1) * 8;
							const end = Math.min(4, this.struct.size - i * CHANNEL_BYTES);
							const pieces = Array.dim(end)
								.map((_, j) => {
									let offset = j * 8;
									if (!LITTLE_ENDIAN) offset = maxOffset - offset;
									return `bytes[${i * CHANNEL_BYTES + j}]${offset ? ` << ${offset}` : ""}`;
								});

							return `${color}.${channel} = uint(${pieces.join(" | ")});`;
						})
						.join("\n")
				}
			}
		`;
	}
	setup() {
		this.struct = this.parsedGLSL.structs.get(
			this.parsedGLSL.methods.get("compute").signature.type
		);
		this.output = new GPUArray(this.struct);
		super.setup();
	}
	compile() {
		this.vertexData = [
			-1, 1,
			1, 1,
			-1, -1,
			1, -1
		];

		const { gl } = this;
		this.framebuffer = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

		const previousTexture = gl.getParameter(gl.TEXTURE_BINDING_2D);

		const { PIXEL_BYTES } = GPUDataTexture;
		this.textures = Array.dim(Math.ceil(this.struct.size / PIXEL_BYTES))
			.map((_, i) => {
				const texture = new GPUDataTexture(gl);
				texture.bind();
				gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, texture.texture, 0);
				return { texture, attachment: i };
			});

		gl.drawBuffers(this.textures.map((_, i) => gl.COLOR_ATTACHMENT0 + i));

		gl.bindTexture(gl.TEXTURE_2D, previousTexture);
	}
	/**
	 * Runs a batch of operations.
	 * @param Number problems | The number of operations to run
	 */
	compute(length) {
		if (!this.program.uniformsChanged) return;

		const { gl, textures } = this;
		const { PIXEL_BYTES, FORMAT, TYPE, TypedArray } = GPUDataTexture;

		const previousTexture = gl.getParameter(gl.TEXTURE_BINDING_2D);
		for (let i = 0; i < textures.length; i++) {
			const tex = textures[i];
			tex.texture.bind();
			tex.texture.bytes = PIXEL_BYTES * length;
			if (tex.data8?.length !== tex.texture.bytes) {
				tex.data8 = new Uint8Array(tex.texture.bytes);
				tex.data = new TypedArray(tex.data8.buffer);
			}
		}
		gl.bindTexture(gl.TEXTURE_2D, previousTexture);

		const textureSize = this.textures[0].texture.size;
		
		this.program.setUniform("_width", textureSize);
		this.program.setUniform("problems", length);
		this.program.commitUniforms();
		gl.viewport(0, 0, textureSize, textureSize);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

		const outputBytes = this.struct.size;
		const outputTextureBytes = length * PIXEL_BYTES;
		this.output.length = length;
		const outputData = this.output.buffer.data;
		
		// output data array major
		for (let i = 0; i < textures.length; i++) {
			const texture = textures[i];
			gl.readBuffer(gl.COLOR_ATTACHMENT0 + texture.attachment);
			gl.readPixels(0, 0, textureSize, textureSize, gl[FORMAT], gl[TYPE], texture.data);
			const array = texture.data8;
			const bytes = Math.min(PIXEL_BYTES, outputBytes - i * PIXEL_BYTES);

			let problemOffset = i * PIXEL_BYTES;
			for (let j = 0; j < outputTextureBytes; j += PIXEL_BYTES) {
				for (let k = 0; k < bytes; k++)
					outputData[problemOffset + k] = array[j + k];
				problemOffset += outputBytes;
			}
		}
	}
};