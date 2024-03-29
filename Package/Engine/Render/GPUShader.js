class GLSLPrecompiler {
	static compile(glsl) {
		// remove comments
		glsl = glsl
			.replace(/\/\/(.*?)(\n|$)/g, "$2") // single line
			.replace(/\/\*((.|\n)*?)\*\//g, ""); // multiline

		return glsl;
	}
	compileVS(glsl) {
		glsl = GLSLPrecompiler.compile(glsl);

		return glsl;
	}
	compileFS(glsl) {
		glsl = GLSLPrecompiler.compile(glsl);

		return glsl;
	}
}

class GLSLError extends Error {
	constructor(source, line, desc) {
		super(`${desc}\n\t» ${source.trim()}\n\n\tat shaderSource.glsl:${line}`);
		this.name = "GLSLError";
		this.line = line;
		this.desc = desc;
		this.source = source;

	}
	toString() {
		return `line ${this.line}: ${this.desc}`;
	}
	static process(source, string, prefixLength) {
		const sourceLines = source.split("\n");
		
		let errors = string.split("ERROR: ");
		errors.shift();
		for (let i = 0; i < errors.length; i++) {
			// parse
			const rawString = errors[i];
			const string = rawString.cut(":")[1];
			let [lineStr, descStr] = string.cut(":");
			lineStr = lineStr.trim();
			let line = parseInt(lineStr) - prefixLength;
			let desc = descStr;
			if (isNaN(line)) {
				line = 0;
				desc = rawString;
			}
			throw new GLSLError(sourceLines[line], line, desc.trim());
		}
	}
}
class GLSLProgram {
	constructor(gl, vs, fs, onerror = () => null) {
		this.onerror = onerror;
		this.gl = gl;
		this.vs = vs;
		this.fs = fs;

		this.program = gl.createProgram();

		// vertex shader
		const vertex = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(vertex, vs);
		gl.compileShader(vertex);
		gl.attachShader(this.program, vertex);

		// fragment shader
		const fragment = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fragment, fs);
		gl.compileShader(fragment);
		gl.attachShader(this.program, fragment);

		// linking
		gl.linkProgram(this.program);
		gl.deleteShader(vertex);
		gl.deleteShader(fragment);

		if (!gl.getShaderParameter(vertex, gl.COMPILE_STATUS)) this.error("VERTEX_SHADER", gl.getShaderInfoLog(vertex));
		if (!gl.getShaderParameter(fragment, gl.COMPILE_STATUS)) this.error("FRAGMENT_SHADER", gl.getShaderInfoLog(fragment));
		if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) this.error("LINKING", gl.getProgramInfoLog(this.program));

		const originalProgram = gl.getParameter(gl.CURRENT_PROGRAM);
		this.use();

		const queuedCalls = [];
		const GL = new Proxy({
			lostCache: {},
			activeCache: {}
		}, {
			get(object, method) {
				return gl.isContextLost() ? 
					object.lostCache[method] ??= (...args) => queuedCalls.push({ method, args })
					: object.activeCache[method] ??= (...args) => gl[method](...args);
			}
		});
		
		gl.canvas.addEventListener("webglcontextrestored", event => {
			event.preventDefault();
			while (queuedCalls.length) {
				const call = queuedCalls.pop();
				gl[call.method](...call.args);
			}
		});
		
		{ // focus
			this.focused = false;
			const useProgram = gl.useProgram.bind(gl);
			gl.useProgram = (program) => {
				this.focused = program === this.program;
				useProgram(program);
			};
		};

		{ // uniforms
			const uniformCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);

			this.uniforms = {};
			this.uniformValues = {};

			let nextTextureUnit = 0;
			const maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);

			for (let i = 0; i < uniformCount; i++) {
				const { size: length, type, name } = gl.getActiveUniform(this.program, i);

				const { integer, signed, rows, columns, texture } = this.getTypeInformation(type);

				const processedName = name.replace(/\[(\d+)\]/g, ".$1");
				const propertyPath = processedName.split(".");
				if (propertyPath[propertyPath.length - 1] === "0") propertyPath.pop();

				const array = name.endsWith("[0]");
				const matrix = columns !== 1;

				let setFunctionName = "uniform";
				if (matrix) {
					setFunctionName += "Matrix";
					if (rows !== columns) setFunctionName += rows + "x" + columns;
					else setFunctionName += rows;
				} else setFunctionName += rows;

				if (!signed) setFunctionName += "u";
				setFunctionName += integer ? "i" : "f";


				const setWithArrayType = array || matrix;
				let dataArray = null;

				if (setWithArrayType) {
					setFunctionName += "v";

					const arrayLength = rows * columns * length;
					if (integer) {
						if (signed) dataArray = new Int32Array(arrayLength);
						else dataArray = new Uint32Array(arrayLength);
					} else dataArray = new Float32Array(arrayLength);
				}

				const location = gl.getUniformLocation(this.program, name);

				let set;
				if (array && (rows !== 1 || columns !== 1)) { // an array of not single values
					const size = rows * columns;

					if (matrix) set = values => {
						for (let i = 0; i < values.length; i++)
							dataArray.set(values[i], i * size);
						GL[setFunctionName](location, false, dataArray);
					};
					else set = values => {
						for (let i = 0; i < values.length; i++) {
							const baseIndex = i * size;
							this.getVectorComponents(values[i]);
							for (let j = 0; j < size; j++) dataArray[baseIndex + j] = this.vectorBuffer[j];
						}
						GL[setFunctionName](location, dataArray);
					};
				} else {
					if (matrix) {
						set = value => {
							dataArray.set(value, 0);
							GL[setFunctionName](location, false, dataArray);
						};
					} else if (texture) {
						const textureUnit = nextTextureUnit;
						const indices = new Int32Array(length).map((_, index) => index + textureUnit);
						if (array) gl[setFunctionName](location, indices);
						else gl[setFunctionName](location, indices[0]);
						
						for (let i = 0; i < length; i++) {
							const texture = gl.createTexture();
							const textureIndex = indices[i];
							gl.activeTexture(gl.TEXTURE0 + textureIndex);
							gl.bindTexture(gl.TEXTURE_2D, texture);

							gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
							gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
							gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
							gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
						}

						let pixelated = false;
						function writeImage(image, index = 0) {
							if (index >= length) return;
							const imagePixelated = image instanceof Texture;
							const imageCIS = (image instanceof Texture) ? image.imageData : image.makeWebGLImage();
							GL.activeTexture(gl.TEXTURE0 + indices[index]);
							if (imagePixelated !== pixelated) {
								pixelated = imagePixelated;
								const param = pixelated ? gl.NEAREST : gl.LINEAR;
								GL.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
								GL.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
							}
							GL.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageCIS);
						}
						if (array) set = images => images.forEach(writeImage);
						else set = image => writeImage(image);
						if (nextTextureUnit + length > maxTextureUnits) this.error("TEXTURE", "Too many texture uniforms");
						nextTextureUnit += length;
					} else {
						if (setWithArrayType) set = value => {
							dataArray.set(value, 0);
							GL[setFunctionName](location, dataArray);
						};
						else set = (...values) => GL[setFunctionName](location, ...values);
					}
				}

				const descriptor = { usesDataArray: !!dataArray, set };

				let currentStruct = this.uniforms;
				for (let i = 0; i < propertyPath.length; i++) {
					const property = propertyPath[i];
					const last = i === propertyPath.length - 1;

					if (last) {
						currentStruct[property] = descriptor;
					} else {
						if (!(property in currentStruct)) currentStruct[property] = {};
						currentStruct = currentStruct[property];
					}
				}
			}

			this.vectorTypes = [
				["x", "y", "z", "w"],
				["r", "g", "b", "a"],
				["red", "green", "blue", "alpha"]
			];

			this.vectorBuffer = new Float32Array(4);
		};

		{ // attributes
			this.attributes = {};
			this.divisors = {};

			const attributeCount = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
			for (let i = 0; i < attributeCount; i++) {
				const { type, name } = gl.getActiveAttrib(this.program, i);
				const { rows, columns } = this.getTypeInformation(type);
				const location = gl.getAttribLocation(this.program, name);
				this.attributes[name] = {
					name, location, rows, columns,
					enabled: false, divisor: -1, isFiller: false
				};
				this.setDivisor(name, 0);
			}
		};

		gl.useProgram(originalProgram);
	}
	error(type, error) {
		this.onerror(type, error);
	}
	getTypeInformation(type) {
		const { gl } = this;

		let integer = false, signed = true, rows = 1, columns = 1, texture = false;
		switch (type) {
			case gl.FLOAT: break;
			case gl.FLOAT_VEC2: rows = 2; break;
			case gl.FLOAT_VEC3: rows = 3; break;
			case gl.FLOAT_VEC4: rows = 4; break;

			case gl.INT: integer = true; break;
			case gl.INT_VEC2: integer = true; rows = 2; break;
			case gl.INT_VEC3: integer = true; rows = 3; break;
			case gl.INT_VEC4: integer = true; rows = 4; break;

			case gl.BOOL: integer = true; break;
			case gl.BOOL_VEC2: integer = true; break;
			case gl.BOOL_VEC3: integer = true; break;
			case gl.BOOL_VEC4: integer = true; break;

			case gl.FLOAT_MAT2: rows = 2; columns = 2; break;
			case gl.FLOAT_MAT3: rows = 3; columns = 3; break;
			case gl.FLOAT_MAT4: rows = 4; columns = 4; break;

			case gl.SAMPLER_2D: integer = true; texture = true; break;
			case gl.INT_SAMPLER_2D: integer = true; texture = true; break;
			case gl.UNSIGNED_INT_SAMPLER_2D: integer = true; texture = true; break;

			case gl.UNSIGNED_INT: integer = true; signed = false; break;
			case gl.UNSIGNED_INT_VEC2: integer = true; rows = 2; signed = false; break;
			case gl.UNSIGNED_INT_VEC3: integer = true; rows = 3; signed = false; break;
			case gl.UNSIGNED_INT_VEC4: integer = true; rows = 4; signed = false; break;

			case gl.FLOAT_MAT2x3: rows = 2; columns = 3; break;
			case gl.FLOAT_MAT2x4: rows = 2; columns = 4; break;
			case gl.FLOAT_MAT3x2: rows = 3; columns = 2; break;
			case gl.FLOAT_MAT3x4: rows = 3; columns = 4; break;
			case gl.FLOAT_MAT4x2: rows = 4; columns = 2; break;
			case gl.FLOAT_MAT4x3: rows = 4; columns = 3; break;
		}

		return { integer, signed, rows, columns, texture };
	}
	getVectorComponents(value) {
		if (value instanceof Color) {
			this.vectorBuffer[0] = value.red / 255;
			this.vectorBuffer[1] = value.green / 255;
			this.vectorBuffer[2] = value.blue / 255;
			this.vectorBuffer[3] = value.alpha;
		} else if (typeof value[Symbol.iterator] === "function") this.vectorBuffer.set(value); // is iterable
		else for (let i = 0; i < this.vectorTypes.length; i++) {
			const type = this.vectorTypes[i];
			if (type[0] in value) {
				for (let j = 0; j < 4; j++) this.vectorBuffer[j] = value[type[j]];
				break;
			}
		}
	}
	layoutAttributes(layout, divisor = 0) {
		const currentAttributesList = this.divisors[divisor].attributes;
		const currentAttributes = {};
		for (let i = 0; i < currentAttributesList.length; i++) {
			const attribute = currentAttributesList[i];
			if (!attribute.isFiller) currentAttributes[attribute.name] = attribute;
		}

		const attributes = [];
		let stride = 0;
		for (let i = 0; i < layout.length; i++) {
			const segment = layout[i];
			const attribute = (typeof segment === "number") ? { rows: segment, columns: 1, isFiller: true } : currentAttributes[segment];
			attributes.push(attribute);
			stride += attribute.rows * attribute.columns * 4 /* bytes per GLFloat */;
		}

		this.divisors[divisor].attributes = attributes;
		this.divisors[divisor].stride = stride;
	}
	use() {
		this.gl.useProgram(this.program);
	}
	focus() {
		if (!this.focused) this.use();
	}
	setUniform(name, value, location = this.uniforms) {
		if (name in location) {
			if (location === this.uniforms) this.uniformValues[name] = value;
			const child = location[name];
			if ("set" in child && typeof child.set === "function") { // reached leaf
				this.focus(); // need to be the gl.CURRENT_PROGRAM
				if (child.usesDataArray) child.set(value);
				else {
					// vector or number
					const type = typeof value;
					if (value instanceof ImageType || type === "boolean" || type === "number") child.set(value);
					else {
						this.getVectorComponents(value);
						child.set(...this.vectorBuffer);
					}
				}
			} else {
				const keys = Object.getOwnPropertyNames(child);
				for (let i = 0; i < keys.length; i++) {
					const key = keys[i];
					if (key in value) this.setUniform(key, value[key], child); // more steps needed
				}
			}
		} else if (location === this.uniforms) this.error("UNIFORM_SET", `Uniform '${name}' doesn't exist`);
	}
	getUniform(name) {
		if (this.hasUniform(name)) return this.uniformValues[name];
		else this.error("UNIFORM_GET", `Uniform '${name}' doesn't exist`);
	}
	hasUniform(name) {
		return name in this.uniforms;
	}
	setDivisor(name, divisor) {
		this.focus();
		if (name in this.attributes) {
			const attribute = this.attributes[name];

			if (attribute.divisor in this.divisors) { // remove from previous
				const previousAttributes = this.divisors[attribute.divisor];
				previousAttributes.attributes.splice(previousAttributes.attributes.indexOf(attribute), 1);
				previousAttributes.stride -= attribute.rows * attribute.columns * 4 /* bytes of GLFloat */;
			}

			if (!(divisor in this.divisors)) { // create divisor
				this.divisors[divisor] = {
					attributes: [],
					stride: 0
				};
			}

			const currentAttributes = this.divisors[divisor];

			currentAttributes.attributes.push(attribute);
			currentAttributes.attributes.sort((a, b) => a.location - b.location);
			currentAttributes.stride += attribute.rows * attribute.columns * 4 /* bytes of GLFloat */;

			this.focus(); // need to be the gl.CURRENT_PROGRAM
			attribute.divisor = divisor;
			for (let i = 0; i < attribute.columns; i++) this.gl.vertexAttribDivisor(attribute.location + i, divisor);
		} else this.error(`Vertex attribute '${name}' doesn't exist`);
	}
	setAttributes(buffer, divisor = 0) {
		if (divisor in this.divisors) {
			const { gl } = this;
			
			this.focus(); // need to be the gl.CURRENT_PROGRAM
			
			const { attributes, stride } = this.divisors[divisor];
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
				
			let offset = 0;
			for (let i = 0; i < attributes.length; i++) {
				const attribute = attributes[i];
				if (attribute.isFiller) offset += attribute.rows * attribute.columns * 4 /* bytes per GLFloat */;
				else {
					const enablingNeeded = !attribute.enabled;
					if (enablingNeeded) attribute.enabled = true;
					for (let j = 0; j < attribute.columns; j++) {
						const pointer = attribute.location + j;
						gl.vertexAttribPointer(pointer, attribute.rows, gl.FLOAT, false, stride, offset);
						if (enablingNeeded) gl.enableVertexAttribArray(pointer);
						offset += attribute.rows * 4 /* bytes per GLFloat */;
					}
				}
			}
		} else this.error("ATTRIBUTE_SET", `No attributes with vertex divisor '${divisor}' exist`);
	}
}

/**
 * @page GLSL API
 * The version of GLSL used in the Hengine is GLSL ES 3.0.
 * Interactions between GLSL and javascript (such as GPUShader and GPUComputation) require associations between types in both the languages. These associations are laid out in the following table:
 * <table>
 * 	<tr><th>GLSL Type</th><th>JS Type</th></tr>
 * 	<tr><td>int, uint, float</td><td>Number</td></tr>
 * 	<tr><td>bool</td><td>Boolean</td></tr>
 * 	<tr><td>vec2, ivec2, uvec2</td><td>Vector2</td></tr>
 * 	<tr><td>vec3, ivec3, uvec3</td><td>Vector3</td></tr>
 * 	<tr><td>ivec4, uvec4</td><td>Vector4</td></tr>
 * 	<tr><td>vec4</td><td>Vector4, Color</td></tr>
 * 	<tr><td>sampler2D</td><td>ImageType</td></tr>
 * 	<tr><td>struct</td><td>Object</td></tr>
 * 	<tr><td>array</td><td>Array</td></tr>
 * </table>
 */

/**
 * Represents the renderable result of a GLSL fragment shader invoked for every pixel in a rectangular region. The entry point for the shader is a function of the form:
 * ```glsl
 * vec4 shader() {
 * 	// your main code here
 * }
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
 * @prop String glsl | The GLSL source code of the shader
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
		this.shadeRects = [new Rect(0, 0, width, height)];
		this.compiled = false;
		this.image = new_OffscreenCanvas(this.pixelWidth, this.pixelHeight);
		this.gl = this.image.getContext("webgl2");
		if (this.gl === null) throw new ReferenceError("Your browser doesn't support WebGL");
		this.hasContext = true;
		this.image.addEventListener("webglcontextlost", event => {
			event.preventDefault();
			console.warn("WebGL Context Lost");
			this.hasContext = false;
		});
		this.image.addEventListener("webglcontextrestored", event => {
			event.preventDefault();
			console.warn("WebGL Context Restored");
			this.hasContext = true;
			this.compile();
			this.setShadeRects(this.shadeRects);
			this.setArguments(this.args);
		});
		this.shadingRectPositions = [
			-1, 1,
			1, 1,
			-1, -1,
			1, -1
		];
		this.amountVertices = 4;
		this.loaded = false;

		this.glsl = glsl;
	}
	set glsl(a) {
		this._glsl = a;
		this.compile();
	}
	get glsl() {
		return this._glsl;
	}
	setShadeRects(rects) {
		if (!this.hasContext) return;

		this.shadeRects = rects;
		let a = Vector2.origin;
		let b = new Vector2(this.width, this.height);
		let a2 = new Vector2(-1, 1);
		let b2 = new Vector2(1, -1);
		let screen = new Rect(0, 0, this.width, this.height);
		rects = rects
			.map(r => r.clip(screen))
			.filter(r => r.area > 0.1)
			.map(r => {
				let min = Vector2.remap(r.min, a, b, a2, b2);
				let max = Vector2.remap(r.max, a, b, a2, b2);
				return [min.x, min.y, max.x, min.y, min.x, max.y, max.x, max.y];
			});
		let positions = [];
		for (let i = 0; i < rects.length; i++) {
			let r = rects[i];
			if (i) {
				let rl = rects[i - 1];
				positions.push(rl[6], rl[7], r[0], r[1]);
			}
			positions.push(...r);
		}
		this.shadingRectPositions = positions;
		this.amountVertices = this.shadingRectPositions.length / 2;
		this.updatePositionBuffer();
		this.loaded = false;
	}
	updatePositionBuffer() {
		if (!this.hasContext) return;

		const { gl, program } = this;
		const positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		const positions = this.shadingRectPositions;
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
		
		program.setAttributes(positionBuffer);
	}
	updateResolutionUniforms() {
		if (!this.hasContext) return;

		const { gl, program } = this;
		program.setUniform("halfWidth", this.width / 2);
		program.setUniform("halfHeight", this.height / 2);
		program.setUniform("resolution", new Vector2(this.width, this.height));
		gl.viewport(0, 0, this.image.width, this.image.height);
	}
	onresize(width, height) {
		this.image.width = this.pixelWidth;
		this.image.height = this.pixelHeight;
		this.updateResolutionUniforms();
		this.loaded = false;
	}
	shade() {
		if (!this.hasContext) return;

		const { gl } = this;

		this.loaded = true;
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.amountVertices);
		gl.flush();
	}
	compile() {
		if (!this.hasContext) return;

		//init
		const { gl } = this;

		//sources
		const vertexSource = `#version 300 es
				in highp vec2 vertexPosition;

				uniform highp float halfWidth;
				uniform highp float halfHeight;

				out highp vec2 position;

				void main() {
					gl_Position = vec4(vertexPosition, 0.0, 1.0);
					position = vec2((vertexPosition.x + 1.0) * halfWidth, (1.0 - vertexPosition.y) * halfHeight);
				}
		`;
		this._glsl = GLSLPrecompiler.compile(this.glsl);

		const prefix = `#version 300 es
			precision highp float;
			precision highp int;
			precision highp sampler2D;

			uniform vec2 resolution;

			in vec2 position;
		`;
		const pixelSource = `${prefix}
			${this.glsl}

			out highp vec4 pixelColor;

			void main() {
				resolution; // guarentee reference
				pixelColor = shader();
				pixelColor.rgb *= clamp(pixelColor.a, 0.0, 1.0);
			}
		`;
		let prefixLength = prefix.split("\n").length + 1;

		//shader programs
		this.program = new GLSLProgram(gl, vertexSource, pixelSource, (type, message) => {
			if (type === "FRAGMENT_SHADER")
				GLSLError.process(this.glsl, message, prefixLength);
			else console.warn(message);
		});
		this.program.use();

		gl.clearColor(0, 0, 0, 0);
		// gl.enable(gl.BLEND);
		// gl.blendFunc(gl.ONE, gl.ZERO);

		this.compiled = true;

		this.updatePositionBuffer();
		this.updateResolutionUniforms();

		this.loaded = false;

		return true;
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
		this.loaded = false;
	}
	makeImage() {
		if (!this.loaded) this.shade();
		return this.image;
	}
}
