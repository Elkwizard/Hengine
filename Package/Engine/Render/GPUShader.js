/**
 * @name class GPUShader extends ImageType
 * @implements GPUInterface
 * Represents the renderable result of a GLSL fragment shader invoked for every pixel in a rectangular region.
 * The entry point for the shader is a function of the form:
 * ```glsl
 * vec4 shader() { ... }
 * ```
 * Several engine-provided uniforms are given, specifically:
 * ```glsl
 * uniform vec2 position; // the pixel-space coordinates of the pixel, with (0, 0) in the top-left corner
 * uniform vec2 resolution; // the width and height of the image, in pixels
 * ```
 * ```js
 * // grayscale shader
 * const shader = new GPUShader(300, 300, `
 * 	uniform sampler2D image;
 * 
 * 	vec4 shader() {
 * 		vec2 uv = position / resolution;
 * 		vec3 color = texture(image, uv);
 * 		float brightness = (color.r + color.g + color.b) / 3.0;
 * 		return vec4(vec3(brightness), 1.0);
 * 	}
 * `);
 * 
 * const cat = loadResource("cat.png");
 * 
 * shader.setArgument("image", cat); // put image in shader
 * 
 * renderer.image(shader).default(0, 0); // draw grayscale cat
 * ```
 */
class GPUShader extends ImageType {
	/**
	 * Creates a new GPUShader.
	 * @param Number width | The width of the rectangle on which the shader is invoked
	 * @param Number height | The height of the rectangle on which the shader is invoked
	 * @param String glsl | The GLSL source code of the shader 
	 * @param Number pixelRatio? | The pixel ratio of the shader. Higher values will result in more shader invocations. Default is 1 
	 */
	constructor(width, height, glsl, pixelRatio = 1) {
		super(width, height, pixelRatio);
		this.gpu = new GPUShader.Interface(glsl, this);
		Object.shortcut(this, this.gpu, "glsl");
		this.loaded = false;
	}
	onresize() {
		const { image } = this.gpu;
		image.width = this.pixelWidth;
		image.height = this.pixelHeight;
		this.loaded = false;
	}
	makeImage() {
		if (!this.loaded || this.gpu.program.uniformsChanged) {
			this.loaded = true;
			this.gpu.shade();
		}
		return this.gpu.image;
	}
}

for (const key of Object.getOwnPropertyNames(GPUInterface.prototype))
	GPUShader.prototype[key] ??= function () {
		return this.gpu[key].apply(this.gpu, arguments);
	};

GPUShader.Interface = class GPUShaderInterface extends GPUInterface {
	constructor(glsl, shader) {
		super(glsl, shader.pixelWidth, shader.pixelHeight);
		this.shader = shader;
	}
	get vertexShader() {
		return `
			in highp vec2 vertexPosition;

			uniform highp vec2 _halfResolution;

			out highp vec2 position;

			void main() {
				gl_Position = vec4(vertexPosition, 0.0, 1.0);
				position = vec2(vertexPosition.x + 1.0, 1.0 - vertexPosition.y) * _halfResolution;
			}
		`;
	}
	get prefix() {
		return `
			precision highp float;
			precision highp int;
			precision highp sampler2D;

			uniform vec2 resolution;

			in vec2 position;
		`;	
	}
	get fragmentShader() {
		return `
			out highp vec4 pixelColor;

			void main() {
				pixelColor = shader();
				pixelColor.rgb *= clamp(pixelColor.a, 0.0, 1.0);
			}	
		`;
	}
	compile() {
		this.vertexData = [
			-1, 1,
			1, 1,
			-1, -1,
			1, -1
		];
		
		this.gl.clearColor(0, 0, 0, 0);
		if (this.shader) this.shader.loaded = false;
	}
	shade() {
		const resolution = new Vector2(this.shader.width, this.shader.height);
		this.program.setUniform("resolution", resolution, false);
		this.program.setUniform("_halfResolution", resolution.over(2));
		this.program.commitUniforms();
		
		const { gl } = this;

		gl.viewport(0, 0, this.image.width, this.image.height);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		gl.flush();
	}
};