class GLSLPrecompiler {
	static compile(glsl) {
		// remove comments

		//single line
		glsl = glsl.replace(/\/\/(.*?)(\n|$)/g, "$2");
		
		//multiline
		glsl = glsl.replace(/\/\*((.|\n)*?)\*\//g, "");

		// find and replace #defines
		let preDefineMatches = [...glsl.matchAll(/#define (\w+) (.*?)(?:\n|$)/g)];

		glsl = glsl.replace(/[\t ]*#define (\w+) (.*?)(?:\n|$)/g, "");

		for (let i = 0; i < preDefineMatches.length; i++) {
			let match = preDefineMatches[i];
			let name = match[1];
			let value = match[2];
			let regex = new RegExp("\\b" + name + "\\b", "g");

			glsl = glsl.replace(regex, value);
		}

		return glsl;
	}
}
class GLSLError {
	constructor(rawString, prefixLength) {
		const string = rawString.cut(":")[1];
		let [lineStr, descStr] = string.cut(":");
		lineStr = lineStr.trim();
		this.line = parseInt(lineStr) - prefixLength;
		this.desc = descStr.trim();
		if (isNaN(this.line)) {
			this.line = 0;
			this.desc = rawString;
		}
	}
	toString() {
		return `line ${this.line}: ${this.desc}`;
	}
	static format(string, prefixLength) {
		let errors = string.split("ERROR: ");
		errors.shift();
		return errors.map(string => new GLSLError(string, prefixLength));
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
				const lost = gl.isContextLost();
				if (lost) {
					if (method in object.lostCache) return object.lostCache[method];
					return object.lostCache[method] = (...args) => queuedCalls.push({ method, args });
				} else {
					if (method in object.activeCache) return object.activeCache[method];
					return object.activeCache[method] = (...args) => gl[method](...args);
				}
			}
		});
		
		gl.canvas.addEventListener("webglcontextrestored", event => {
			event.preventDefault();
			while (queuedCalls.length) {
				const call = queuedCalls.pop();
				gl[call.method](...call.args);
			}
		});

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
							const imageCIS = imagePixelated ? image.updateImageData() : image.makeImage();
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
	gl_dot(method, ...args) {
		if (this.gl.isContextLost()) this.queuedCalls.push({ method, args });
		else this.gl[method](...args);
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
		if (this.gl.getParameter(this.gl.CURRENT_PROGRAM) !== this.program) this.use();
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
					if (value instanceof ImageType) child.set(value);
					else if (typeof value === "number") child.set(value);
					else {
						this.getVectorComponents(value);
						child.set(...this.vectorBuffer);
					}
				}
			} else {
				const keys = Object.getOwnPropertyNames(value);
				for (let i = 0; i < keys.length; i++) {
					const key = keys[i];
					this.setUniform(key, value[key], child); // more steps needed
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
class GPUShader extends ImageType {
	constructor(width, height, glsl) {
		super(width, height);
		this.glsl = glsl;
		this.shadeRects = [new Rect(0, 0, width, height)];
		this.compiled = false;
		this.image = new_OffscreenCanvas(width * __devicePixelRatio, height * __devicePixelRatio);
		this.gl = this.image.getContext("webgl2");
		if (this.gl === null) return console.warn("Your browser doesn't support WebGL.");
		this.image.addEventListener("webglcontextlost", event => {
			event.preventDefault();
			console.warn("WebGL Context Lost");
		});
		this.image.addEventListener("webglcontextrestored", event => {
			event.preventDefault();
			console.warn("WebGL Context Restored");
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

		this.compile();
	}
	set compiled(a) {
		this._compiled = a;
	}
	get compiled() {
		if (!this._compiled) {
			exit("Didn't compile GPUShader", this.compileState.error);
			return null;
		} return this._compiled;
	}
	setShadeRects(rects) {
		if (this.gl.isContextLost()) return;

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
		if (this.gl.isContextLost()) return;

		const { gl, program } = this;
		const positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		const positions = this.shadingRectPositions;
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
		
		program.setAttributes(positionBuffer);
	}
	updateResolutionUniforms() {
		if (!this.compiled) return;
		if (this.gl.isContextLost()) return;

		const { gl, program } = this;
		program.setUniform("halfWidth", this.width / 2);
		program.setUniform("halfHeight", this.height / 2);
		program.setUniform("resolution", new Vector2(this.width, this.height));
		gl.viewport(0, 0, this.image.width, this.image.height);
	}
	resize(width, height) {
		width = Math.max(1, Math.abs(Math.ceil(width)));
		height = Math.max(1, Math.abs(Math.ceil(height)));
		this.image.width = width * __devicePixelRatio;
		this.image.height = height * __devicePixelRatio;
		this.width = width;
		this.height = height;
		this.updateResolutionUniforms();
		this.loaded = false;
	}
	shade() {
		if (this.gl.isContextLost()) return;
		if (!this.compiled) return;

		const { gl } = this;

		this.loaded = true;
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.amountVertices);
		gl.flush();
	}
	compile() {
		if (this.gl.isContextLost()) return;

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
		this.glsl = GLSLPrecompiler.compile(this.glsl);

		const prefix = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;

uniform vec2 resolution;

in vec2 position;`;
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
			if (type === "FRAGMENT_SHADER") {
				const errors = GLSLError.format(message, prefixLength);
				console.warn("Compilation Error", errors);
			}// else console.warn(message);
		});
		this.program.use();

		gl.clearColor(0, 0, 0, 0);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		this.compiled = true;

		this.updatePositionBuffer();
		this.updateResolutionUniforms();

		this.loaded = false;

		this.compileState = { compiled: true };
		return true;
	}
	argumentExists(arg) {
		return this.program.hasUniform(arg);
	}
	getArgument(arg) {
		return this.program.getUniform(arg);
	}
	setArgument(arg, value) {
		this.setArguments({ [arg]: value });
	}
	setArguments(uniformData = {}) {
		for (const key in uniformData) this.program.setUniform(key, uniformData[key]);
		this.loaded = false;
	}
	makeImage() {
		if (!this.loaded) this.shade();
		return this.image;
	}
}