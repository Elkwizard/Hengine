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
class GPUShader extends ImageType {
	constructor(width, height, glsl) {
		super(width, height);
		this.glsl = glsl;
		this.compiled = null;
		this.compileState = { compiled: false, error: null };
		this.args = {};
		this.shadeRects = [new Rect(0, 0, width, height)];
		this.image = new_OffscreenCanvas(width * __devicePixelRatio, height * __devicePixelRatio);
		this.gl = this.image.getContext("webgl2");
		if (this.gl === null) return console.warn("Your browser doesn't support webgl.");
		this.image.addEventListener("webglcontextlost", e => {
			e.preventDefault();
			console.warn("Webgl Context Lost");
		});
		this.image.addEventListener("webglcontextrestored", e => {
			console.warn("Webgl Context Restored");
			e.preventDefault();
			if (this._compiled) {
				this.compile();
				this.setShadeRects(this.shadeRects);
				this.setArguments(this.args);
			}
		});
		this.shadingRectPositions = [
			-1, 1,
			1, 1,
			-1, -1,
			1, -1
		];
		this.amountVertices = 4;
		this.loaded = false;
		this.uniformLocations = {
			resolution: null,
			halfWidth: null,
			halfHeight: null
		};

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

		const { gl } = this;
		const positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		const positions = this.shadingRectPositions;
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
		let vertexPositionPointer = gl.getAttribLocation(this.compiled.shaderProgram, "vertexPosition");
		gl.vertexAttribPointer(vertexPositionPointer, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(vertexPositionPointer);
	}
	updateResolutionUniforms() {
		if (!this.compiled) return;
		if (this.gl.isContextLost()) return;

		const { gl } = this;
		gl.uniform1f(this.uniformLocations.halfWidth, this.width / 2);
		gl.uniform1f(this.uniformLocations.halfHeight, this.height / 2);
		gl.uniform2f(this.uniformLocations.resolution, this.width, this.height);
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
		// make sure it exists
		if (!this.compiled) return;

		this.loaded = true;
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.amountVertices);
	}
	compile() {
		if (this.gl.isContextLost()) return;

		//init
		const { gl } = this;

		//sources
		const vertexSource = `#version 300 es
				in highp vec4 vertexPosition;

				uniform highp float halfWidth;
				uniform highp float halfHeight;

				out highp vec2 position;

				void main() {
					gl_Position = vertexPosition;
					position = vec2((vertexPosition.x + 1.0) * halfWidth, (1.0 - vertexPosition.y) * halfHeight);
				}
			`;
		this.glsl = GLSLPrecompiler.compile(this.glsl);

		// study glsl

		this.allUniformNames = [...this.glsl.matchAll(/uniform\s+(?:.*?)\s+(\w+)(?:\[\d+\])?(?:\s+\=\s+(?:.*?))?;/g)].map(match => match[1]);

		// end studying

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
	pixelColor = shader();
	pixelColor.rgb *= clamp(pixelColor.a, 0.0, 1.0);
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

		// user uniforms
		let uniformMap = {};
		let uniformTypeMap = new Map();
		uniformTypeMap.set(gl.FLOAT, { type: "float", size: 1, integer: false });
		uniformTypeMap.set(gl.FLOAT_VEC2, { type: "vec2", size: 2, integer: false });
		uniformTypeMap.set(gl.FLOAT_VEC3, { type: "vec3", size: 3, integer: false });
		uniformTypeMap.set(gl.FLOAT_VEC4, { type: "vec4", size: 4, integer: false });
		uniformTypeMap.set(gl.INT, { type: "int", size: 1, integer: true });
		uniformTypeMap.set(gl.INT_VEC2, { type: "ivec2", size: 2, integer: true });
		uniformTypeMap.set(gl.INT_VEC3, { type: "ivec3", size: 3, integer: true });
		uniformTypeMap.set(gl.INT_VEC4, { type: "ivec4", size: 4, integer: true });
		uniformTypeMap.set(gl.UNSIGNED_INT, { type: "int", size: 1, integer: true });
		uniformTypeMap.set(gl.UNSIGNED_INT_VEC2, { type: "ivec2", size: 2, integer: true });
		uniformTypeMap.set(gl.UNSIGNED_INT_VEC3, { type: "ivec3", size: 3, integer: true });
		uniformTypeMap.set(gl.UNSIGNED_INT_VEC4, { type: "ivec4", size: 4, integer: true });
		uniformTypeMap.set(gl.SAMPLER_2D, { type: "sampler2D", size: 1, integer: false });
		let uniformCount = gl.getProgramParameter(shaderProgram, gl.ACTIVE_UNIFORMS);
		let currentTextureUnit = 0;
		for (let i = 0; i < uniformCount; i++) {
			let uniform = gl.getActiveUniform(shaderProgram, i);
			if (uniform.name === "resolution") continue;
			let arrayCount = uniform.size;
			let inx = uniform.name.indexOf("[");
			let name = uniform.name.slice(0, (inx > -1) ? inx : uniform.name.length);
			let isArray = inx > -1;
			let { type, size, integer } = uniformTypeMap.get(uniform.type);
			let textureUnit = null;
			let textures = [];
			let isTexture = type === "sampler2D";
			let location = gl.getUniformLocation(shaderProgram, uniform.name);
			if (isTexture) {
				textureUnit = currentTextureUnit;
				for (let i = 0; i < arrayCount; i++) {
					// setup textures
					let tex = gl.createTexture();
					gl.activeTexture(gl.TEXTURE0 + currentTextureUnit++);
					gl.bindTexture(gl.TEXTURE_2D, tex);

					// wrapping and stretching
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

					textures.push(tex);
				}
				if (isArray) {
					let units = new Int32Array(arrayCount);
					for (let i = 0; i < units.length; i++) units[i] = textureUnit + i;
					gl.uniform1iv(location, units);
				} else gl.uniform1i(location, textureUnit);
			}

			uniformMap[name] = { type, name, location, isArray, arrayCount, integer, isTexture, textureUnit, textures, size };

		}

		gl.clearColor(0, 0, 0, 0);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		this.compiled = { shaderProgram, uniformMap };

		this.updatePositionBuffer();
		this.updateResolutionUniforms();

		this.loaded = false;

		this.compileState = { compiled: true, error };
		return true;
	}
	configureTexture(arg, config) {
		if (arg in this.compiled.uniformMap) {
			const { textures, isTexture, textureUnit } = this.compiled.uniformMap[arg];
			if (!isTexture) return console.warn("Webgl uniform '" + arg + "' isn't a texture");
			const { gl } = this;
			for (let i = 0; i < textures.length; i++) {
				const texture = textures[i];
				gl.activeTexture(gl.TEXTURE0 + textureUnit + i);
				gl.bindTexture(gl.TEXTURE_2D, texture);
				if ("pixelated" in config) {
					const value = config.pixelated ? gl.NEAREST : gl.LINEAR;
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, value);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, value);
				}
			}
		} else return console.warn("Webgl uniform '" + arg + "' doesn't exist.");
	}
	argumentExists(arg) {
		return arg in this.compiled.uniformMap;
	}
	getArgument(arg) {
		if (arg in this.compiled.uniformMap) return this.args[arg];
		else return console.warn("Webgl uniform '" + arg + "' doesn't exist.");
	}
	setArgument(arg, value) {
		this.setArguments({ [arg]: value });
	}
	setArguments(uniformData = {}) {
		if (this.gl.isContextLost()) return;

		let { uniformMap } = this.compiled;
		const { gl } = this;

		//uniforms in shader
		for (let arg in uniformData) {
			let u = uniformMap[arg];
			if (u === undefined) {
				console.warn("Webgl uniform '" + arg + "' doesn't exist.");
				continue;
			}
			let data = uniformData[arg];
			this.args[arg] = data;

			let location = u.location;

			if (u.isTexture) {
				if (u.isArray) {
					for (let i = 0; i < u.arrayCount; i++) 
						this.writeTexture(u.textureUnit + i, u.textures[i], data[i]);
				} else this.writeTexture(u.textureUnit, u.textures[0], data);
			} else {
				const COLOR_CONVERT = color => new Vector4(color.red / 255, color.green / 255, color.blue / 255, color.alpha);
				if (u.isArray && data[0] instanceof Color) data = data.map(COLOR_CONVERT);
				else if (data instanceof Color) data = COLOR_CONVERT(data);

				let singleData;
				if (u.isArray) singleData = data[0];
				else singleData = data;

				if (singleData === undefined) continue;

				let dataKeys = [];
				const vector = u.size > 1;
				const components = u.size;
				if (vector) {
					const availableKeys = ["x", "y", "z", "w"].slice(0, components);
					for (const key of availableKeys) 
						if (key in singleData) dataKeys.push(key);
				}
				let setFunctionName = "uniform";
				setFunctionName += components;
				setFunctionName += u.integer ? "i" : "f";

				if (u.isArray) {
					setFunctionName += "v";
					let arraySize = u.arrayCount;
					let buffer = new (u.integer	? Int32Array : Float32Array)(arraySize * components);
					let bufferIndex = 0;
					for (let i = 0; i < data.length; i++) {
						if (vector) for (let j = 0; j < dataKeys.length; j++) buffer[bufferIndex++] = data[i][dataKeys[j]];
						else buffer[bufferIndex++] = data[i];
					}
					gl[setFunctionName](location, buffer);
				} else {
					if (vector) gl[setFunctionName](location, ...dataKeys.map(key => data[key]));
					else gl[setFunctionName](location, data);
				}
			}
		}
		this.loaded = false;
	}
	writeTexture(textureUnit, texture, data) {
		const { gl } = this;
		gl.activeTexture(gl.TEXTURE0 + textureUnit);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		if (data instanceof Texture) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, data.width, data.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data.updateImageData());
		else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data.makeImage());
	}
	makeImage() {
		if (!this.loaded) this.shade();
		return this.image;
	}
}