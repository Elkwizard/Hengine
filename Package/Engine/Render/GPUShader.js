class GLSLError {
	constructor(string, prefixLength) {
		string = string.cut(":")[1];
		let [lineStr, descStr] = string.cut(":");
		lineStr = lineStr.trim();
		this.line = parseInt(lineStr) - prefixLength;
		this.desc = descStr.trim();
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
		this.image = new_OffscreenCanvas(width * devicePixelRatio, height * devicePixelRatio);
		this.c = this.image.getContext("webgl");
		if (this.c === null) return console.warn("Your browser doesn't support webgl.");
		this.image.addEventListener("webglcontextlost", e => {
			e.preventDefault();
			console.warn("Webgl Context Lost");
		});
		this.image.addEventListener("webglcontextrestored", e => {
			console.warn("Webgl Context Restored");
			e.preventDefault();
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
		this.uniformLocations = {
			halfWidth: null,
			halfHeight: null,
			resolution: null
		};
	}
	set compiled(a) {
		this._compiled = a;
	}
	get compiled() {
		if (!this._compiled) exit("Didn't compile GPUShader");
		return this._compiled;
	}
	setShadeRects(rects) {
		if (this.c.isContextLost()) return;

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
		if (this.c.isContextLost()) return;

		const c = this.c;
		const positionBuffer = c.createBuffer();
		c.bindBuffer(c.ARRAY_BUFFER, positionBuffer);
		const positions = this.shadingRectPositions;
		c.bufferData(c.ARRAY_BUFFER, new Float32Array(positions), c.STATIC_DRAW);
		let vertexPositionPointer = c.getAttribLocation(this.compiled.shaderProgram, "vertexPosition");
		c.vertexAttribPointer(vertexPositionPointer, 2, c.FLOAT, false, 0, 0);
		c.enableVertexAttribArray(vertexPositionPointer);
	}
	updateResolutionUniforms() {
		if (!this.compiled) return;
		if (this.c.isContextLost()) return;

		const c = this.c;
		c.uniform2f(this.uniformLocations.resolution, this.width, this.height);
		c.uniform1f(this.uniformLocations.halfWidth, this.width / 2);
		c.uniform1f(this.uniformLocations.halfHeight, this.height / 2);
		c.viewport(0, 0, this.image.width, this.image.height);
	}
	resize(width, height) {
		width = Math.max(1, Math.abs(Math.ceil(width)));
		height = Math.max(1, Math.abs(Math.ceil(height)));
		this.image.width = width * devicePixelRatio;
		this.image.height = height * devicePixelRatio;
		this.width = width;
		this.height = height;
		this.updateResolutionUniforms();
		this.loaded = false;
	}
	shade() {
		if (this.c.isContextLost()) return;

		this.loaded = true;
		this.c.clear(this.c.COLOR_BUFFER_BIT);
		this.c.drawArrays(this.c.TRIANGLE_STRIP, 0, this.amountVertices);
	}
	compile() {
		if (this.c.isContextLost()) return;

		//init
		const gl = this.c;

		//sources
		const vertexSource = `
				attribute vec4 vertexPosition;

				uniform highp float halfWidth;
				uniform highp float halfHeight;

				varying highp vec2 position;

				void main() {
					gl_Position = vertexPosition;
					position = vec2((vertexPosition.x + 1.0) * halfWidth, (1.0 - vertexPosition.y) * halfHeight);
				}
			`;
		this.glsl = GLSLPrecompiler.compile(this.glsl);

		// study glsl

		// end studying

		const prefix = `uniform highp vec2 resolution;
varying highp vec2 position;`;
		const pixelSource = `
				${prefix}
				${this.glsl}

				void main() {
					gl_FragColor = shader();
					gl_FragColor.rgb *= clamp(gl_FragColor.a, 0.0, 1.0);
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

		// uniforms

		for (let key in this.uniformLocations) this.uniformLocations[key] = gl.getUniformLocation(shaderProgram, key);

		// user uniforms
		let uniformMap = {};
		let uniformTypeMap = new Map();
		uniformTypeMap.set(gl.FLOAT, { type: "float", integer: false });
		uniformTypeMap.set(gl.FLOAT_VEC2, { type: "vec2", integer: false });
		uniformTypeMap.set(gl.FLOAT_VEC3, { type: "vec3", integer: false });
		uniformTypeMap.set(gl.FLOAT_VEC4, { type: "vec4", integer: false });
		uniformTypeMap.set(gl.INT, { type: "int", integer: true });
		uniformTypeMap.set(gl.INT_VEC2, { type: "ivec2", integer: true });
		uniformTypeMap.set(gl.INT_VEC3, { type: "ivec3", integer: true });
		uniformTypeMap.set(gl.INT_VEC4, { type: "ivec4", integer: true });
		uniformTypeMap.set(gl.SAMPLER_2D, { type: "sampler2D", integer: false });
		let uniformCount = gl.getProgramParameter(shaderProgram, gl.ACTIVE_UNIFORMS);
		let currentTextureUnit = 0;
		for (let i = 0; i < uniformCount; i++) {
			let uniform = gl.getActiveUniform(shaderProgram, i);
			if (uniform.name === "resolution" || uniform.name === "halfWidth" || uniform.name === "halfHeight") continue;
			let arrayCount = uniform.size;
			let inx = uniform.name.indexOf("[");
			let name = uniform.name.slice(0, (inx > -1) ? inx : uniform.name.length);
			let isArray = inx > -1;
			let { type, integer } = uniformTypeMap.get(uniform.type);
			let textureUnit = null;
			let textures = [];
			let isTexture = type === "sampler2D";
			let location = gl.getUniformLocation(shaderProgram, uniform.name);
			if (isTexture) {
				textureUnit = currentTextureUnit;
				currentTextureUnit += arrayCount;
				for (let i = 0; i < arrayCount; i++) {
					// setup textures
					let tex = gl.createTexture();
					
					gl.bindTexture(gl.TEXTURE_2D, tex);

					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

					textures.push(tex);
				}
			}

			uniformMap[name] = { type, name, location, isArray, arrayCount, integer, isTexture, textureUnit, textures };

		}
		console.log(uniformMap);

		gl.clearColor(0, 0, 0, 0);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		gl.useProgram(shaderProgram);

		this.compiled = { shaderProgram, uniformMap };

		this.updatePositionBuffer();
		this.updateResolutionUniforms();

		this.loaded = false;

		this.compileState = { compiled: true, error };
		return true;
	}
	argumentExists(arg) {
		return arg in this.compiled.uniformMap;
	}
	getArgument(arg) {
		if (arg in this.args) return this.args[arg];
		else return console.warn("Webgl uniform '" + arg + "' doesn't exist.");
	}
	setArguments(uniformData = {}) {
		if (this.c.isContextLost()) return;

		let { shaderProgram, uniformMap } = this.compiled;
		const c = this.c;

		//uniforms in shader
		for (let arg in uniformData) {
			let u = uniformMap[arg];
			if (u === undefined) {
				console.warn("Webgl uniform '" + arg + "' doesn't exist.");
				continue;
			}
			let data = uniformData[arg];
			let p = u.properties;
			this.args[arg] = data;

			let location = u.location;

			if (u.type === "sampler2D") {
				if (u.isArray) {
					let array = [];
					let arraySize = u.arrayCount;
					let resolutions = [];
					let textureUnit = u.textureUnit;
					let tex = u.textures;
					for (let i = 0; i < arraySize; i++) {
						let unit = textureUnit++;
						this.writeTexture(unit, tex[i], data[i]);
						array.push(unit);
						resolutions.push(data[i].width, data[i].height);
					}
					c.uniform1iv(location, new Int32Array(array));
				} else {
					let unit = u.textureUnit;
					let tex = u.textures[0];
					this.writeTexture(unit, tex, data);
					c.uniform1i(location, unit);
				}
			} else {

				if (u.isArray && data[0] instanceof Color) data = data.map(color => ({ red: color.red / 255, green: color.green / 255, blue: color.blue / 255, alpha: color.alpha }));
				else if (data instanceof Color) data = { red: data.red / 255, green: data.green / 255, blue: data.blue / 255, alpha: data.alpha };

				let singleData;
				if (u.isArray) singleData = data[0];
				else singleData = data;

				let dataKeys = [];
				for (let key in singleData) dataKeys.push(key);
				let vector = !(typeof singleData === "number");
				let setFunctionName = "uniform";
				setFunctionName += vector ? dataKeys.length : 1;
				setFunctionName += u.integer ? "i" : "f";


				if (u.isArray) {
					setFunctionName += "v";
					let bufferData = [];
					let arraySize = u.arrayCount;
					for (let i = 0; i < arraySize; i++) {
						if (vector) for (let j = 0; j < dataKeys.length; j++) bufferData.push(data[i][dataKeys[j]]);
						else bufferData.push(data[i]);
					}
					let buffer = new Float32Array(bufferData);
					c[setFunctionName](location, buffer);
				} else {
					if (vector) c[setFunctionName](location, ...dataKeys.map(key => data[key]));
					else c[setFunctionName](location, data);
				}
			}
		}
		this.loaded = false;
	}
	makeImage() {
		if (!this.loaded) this.shade();
		return this.image;
	}
	writeTexture(textureUnit, texture, data) {
		const gl = this.c;
		gl.activeTexture(gl.TEXTURE0 + textureUnit);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data.makeImage());
	}
}