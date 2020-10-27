class GPUShader extends ImageType {
	constructor(width, height, glsl) {
		super(width, height);
		this.glsl = glsl;
		this.errorLog = [];
		this.compiled = null;
		this.arguments = { };
		this.shadeRects = [new Rect(0, width)];
		this.image = new_OffscreenCanvas(width * devicePixelRatio, height * devicePixelRatio);
		this.c = this.image.getContext("webgl");
		if (this.c === null) return console.warn("Your browser doesn't support webgl.");
		this.image.addEventListener("webglcontextrestored", () => (this.compile(), this.setShadeRects(this.shadeRects, false), this.setArguments(this.arguments)));
		this.shadingRectPositions = [
			-1, 1,
			1, 1,
			-1, -1,
			1, -1
		];
		this.amountVertices = 4;
		this.loaded = false;
	}
	setShadeRects(rects) {
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
		const c = this.c;
		const shaderProgram = this.compiled.shaderProgram;
		c.uniform2f(c.getUniformLocation(shaderProgram, "resolution"), this.width, this.height);
		c.uniform1f(c.getUniformLocation(shaderProgram, "halfWidth"), this.width / 2);
		c.uniform1f(c.getUniformLocation(shaderProgram, "halfHeight"), this.height / 2);
		c.viewport(0, 0, this.image.width, this.image.height);
	}
	resize(width, height) {
		width = Math.max(1, Math.abs(Math.floor(width)));
		height = Math.max(1, Math.abs(Math.floor(height)));
		this.image.width = width * devicePixelRatio;
		this.image.height = height * devicePixelRatio;
		this.width = width;
		this.height = height;
		this.updateResolutionUniforms();
		this.loaded = false;
	}
	shade() {
		this.loaded = true;
		this.c.clear(this.c.COLOR_BUFFER_BIT);
		this.c.drawArrays(this.c.TRIANGLE_STRIP, 0, this.amountVertices);
	}
	compile() {
		//init
		const c = this.c;

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
		let uniformMatches = [...this.glsl.matchAll(/uniform(?:\s+(low|medium|high)p)?\s+(sampler2D|int|float|(i?)vec[234])\s+(\w+)\s*(?:\[(\d+)\]|)/g)];
		let uniforms = [];
		let uniformProperties = [];
		let defines = [];
		for (let i = 0; i < uniformMatches.length; i++) {
			let u = uniformMatches[i];
			let args = [];
			for (let j = 1; j < u.length; j++) args.push(u[j]);
			let precision = args[0];
			let type = args[1];
			let integer = type === "int" || !!args[2];
			let name = args[3];
			let isArray = !!args[4];
			let arrayCount = isArray ? args[4] : 0;
			let properties = [];
			if (isArray) defines.push(`${name}_length ${arrayCount}`);
			if (type === "sampler2D") {
				if (isArray) {
					properties.push(`vec2 ${name}_resolution[${arrayCount}]`);
				} else {
					properties.push(`vec2 ${name}_resolution`);
				}
			}
			uniformProperties.push(...properties);
			uniforms.push({ precision, type, name, isArray, arrayCount, integer, properties: properties.map(p => {
				let t = p.split(" ")[1];
				let inx = t.indexOf("[");
				if (inx > -1) return t.slice(0, inx);
				else return t;	
			}) });
		}
		let uniformMap = { };
		for (let i = 0; i < uniforms.length; i++) {
			let u = uniforms[i];
			uniformMap[u.name] = u;
		}

		//composite pixelSource
		let uniformPropertyDeclarations = uniformProperties.map(p => `uniform highp ${p};`).join("\n");
		let defineDeclarations = defines.map(v => `#define ${v}`).join("\n");
		const pixelSource = `
				uniform highp vec2 resolution;
				${defineDeclarations}
				${uniformPropertyDeclarations}

				varying highp vec2 position;
				
				${this.glsl}

				void main() {
					gl_FragColor = shader();
					gl_FragColor.rgb *= gl_FragColor.a;
				}
			`;
		const errorlog = v => (this.errorLog.push(v), false);
		//shader programs
		function compileShader(type, source) {
			let shader = c.createShader(type);
			c.shaderSource(shader, source);
			c.compileShader(shader);
			if (!c.getShaderParameter(shader, c.COMPILE_STATUS)) return errorlog("Shader didn't compile: " + c.getShaderInfoLog(shader));
			return shader;
		}
		const vertexShader = compileShader(c.VERTEX_SHADER, vertexSource);
		const pixelShader = compileShader(c.FRAGMENT_SHADER, pixelSource);
		if (!pixelShader) return false;
		const shaderProgram = c.createProgram();
		c.attachShader(shaderProgram, vertexShader);
		c.attachShader(shaderProgram, pixelShader);
		c.linkProgram(shaderProgram);

		c.clearColor(0, 0, 0, 0);
		c.enable(c.BLEND);
		c.blendFunc(c.SRC_ALPHA, c.ONE_MINUS_SRC_ALPHA);

		c.useProgram(shaderProgram);

		this.compiled = { shaderProgram, uniformMap };

		this.updatePositionBuffer();
		this.updateResolutionUniforms();

		this.loaded = false;

		return true;
	}
	setArguments(uniformData = { }) {
		let { shaderProgram, uniformMap } = this.compiled;
		const c = this.c;

		//uniforms in shader
		let textureUnit = 0;
		for (let arg in uniformData) {
			let u = uniformMap[arg];
			if (u === undefined) {
				console.warn("Webgl uniform '" + arg + "' doesn't exist.");
				continue;
			}
			let data = uniformData[arg];
			let p = u.properties;
			this.arguments[arg] = data;

			let location = c.getUniformLocation(shaderProgram, u.name);

			if (u.type === "sampler2D") {
				if (u.isArray) {
					let array = [];
					let arraySize = parseInt(u.arrayCount);
					let resolutions = [];
					for (let i = 0; i < arraySize; i++) {
						let unit = textureUnit++;
						GPUShader.imageTypeToTexture(c, data[i], unit);
						array.push(unit);
						resolutions.push(data[i].width, data[i].height);
					}
					c.uniform1iv(location, new Int32Array(array));
					c.uniform2fv(c.getUniformLocation(shaderProgram, p[1]), new Float32Array(resolutions));
				} else {
					let unit = textureUnit++;
					GPUShader.imageTypeToTexture(c, data, unit);
					c.uniform1i(location, unit);
					c.uniform2f(c.getUniformLocation(shaderProgram, p[0]), data.width, data.height);
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
					let arraySize = parseInt(u.arrayCount);
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
	static imageTypeToTexture(c, image, textureUnit) {
		let tex = c.createTexture();
		c.activeTexture(c.TEXTURE0 + textureUnit);
		c.bindTexture(c.TEXTURE_2D, tex);

		let gl_image = image.makeImage();
		c.texImage2D(c.TEXTURE_2D, 0, c.RGBA, c.RGBA, c.UNSIGNED_BYTE, gl_image);

		c.texParameteri(c.TEXTURE_2D, c.TEXTURE_MIN_FILTER, c.LINEAR);
		c.texParameteri(c.TEXTURE_2D, c.TEXTURE_MAG_FILTER, c.LINEAR);
		c.texParameteri(c.TEXTURE_2D, c.TEXTURE_WRAP_S, c.CLAMP_TO_EDGE);
		c.texParameteri(c.TEXTURE_2D, c.TEXTURE_WRAP_T, c.CLAMP_TO_EDGE);
		
		return {
			width: image.width,
			height: image.height,
			texture: tex
		};
	}
}