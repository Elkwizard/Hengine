class GPUShader extends ImageType {
	constructor(width, height, glsl) {
		super(width, height);
		this.glsl = glsl;
		this.args = [];
		this.compiled = null;
		this.augmented = null;
		this.lastArguments = [];
		this.image = new_OffscreenCanvas(width, height);
		this.c = this.image.getContext("webgl");
		if (this.c === null) return console.warn("Your browser doesn't support webgl.");
		this.image.addEventListener("webglcontextlost", e => e.preventDefault());
		this.image.addEventListener("webglcontextrestored", () => (this.compile(), this.arguments()));
	}
	resize(width, height) {
		this.width = width;
		this.height = height;
		this.shade();
	}
	shade() {
		const c = this.c;
		let { width, height } = c.canvas;
		c.viewport(0, 0, width, height);
		c.clear(c.COLOR_BUFFER_BIT);
		c.drawArrays(c.TRIANGLE_STRIP, 0, 4);
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
			if (isArray) properties.push(`int ${name}_length`);
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
		let uniformPropertyDeclarations = uniformProperties.map(p => `uniform highp ${p};`).join("\n");
		
		const pixelSource = `
				uniform highp vec2 resolution;
				${uniformPropertyDeclarations}

				varying highp vec2 position;
				
				${this.glsl}

				void main() {
					gl_FragColor = shader();
					gl_FragColor.rgb *= gl_FragColor.a;
				}
			`;
		//shader programs
		function compileShader(type, source) {
			let shader = c.createShader(type);
			c.shaderSource(shader, source);
			c.compileShader(shader);
			if (!c.getShaderParameter(shader, c.COMPILE_STATUS)) return console.warn("Shader didn't compile: " + c.getShaderInfoLog(shader));
			return shader;
		}
		const vertexShader = compileShader(c.VERTEX_SHADER, vertexSource);
		const pixelShader = compileShader(c.FRAGMENT_SHADER, pixelSource);
		const shaderProgram = c.createProgram();
		c.attachShader(shaderProgram, vertexShader);
		c.attachShader(shaderProgram, pixelShader);
		c.linkProgram(shaderProgram);

		//pointer
		let vertexPositionPointer = c.getAttribLocation(shaderProgram, "vertexPosition");

		//square
		const positionBuffer = c.createBuffer();
		c.bindBuffer(c.ARRAY_BUFFER, positionBuffer);
		const positions = [
			-1.0, 1.0,
			1.0, 1.0,
			-1.0, -1.0,
			1.0, -1.0,
		];
		c.bufferData(c.ARRAY_BUFFER, new Float32Array(positions), c.STATIC_DRAW);

		c.clearColor(0, 0, 0, 0);
		c.enable(c.BLEND);
		c.blendFunc(c.SRC_ALPHA, c.ONE_MINUS_SRC_ALPHA);

		//transfer
		c.vertexAttribPointer(vertexPositionPointer, 2, c.FLOAT, false, 0, 0);
		c.enableVertexAttribArray(vertexPositionPointer);

		c.useProgram(shaderProgram);

		this.compiled = { shaderProgram, uniforms };
	}
	arguments(uniformData = this.lastArguments) {
		this.lastArguments = uniformData;
		if (!this.compiled) console.warn("Couldn't apply arguments: Shader wasn't compiled.");
		let { shaderProgram, uniforms } = this.compiled;
		const c = this.c;
		let { width, height } = c.canvas;

		//uniforms in vertex
		c.uniform2f(c.getUniformLocation(shaderProgram, "resolution"), width, height);
		c.uniform1f(c.getUniformLocation(shaderProgram, "halfWidth"), width / 2);
		c.uniform1f(c.getUniformLocation(shaderProgram, "halfHeight"), height / 2);


		//uniforms in shader
		let textureUnit = 0;
		for (let i = 0; i < uniforms.length; i++) {
			let u = uniforms[i];
			let data = uniformData[i];
			let p = u.properties;

			let location = c.getUniformLocation(shaderProgram, u.name);

			if (u.isArray) {
				let arraySize = parseInt(u.arrayCount);
				c.uniform1i(c.getUniformLocation(shaderProgram, p[0]), arraySize);
			}
			if (u.type === "sampler2D") {
				if (u.isArray) {
					let array = [];
					let arraySize = parseInt(u.arrayCount);
					let resolutions = [];
					for (let i = 0; i < arraySize; i++) {
						let unit = textureUnit++;
						let tex = GPUShader.imageTypeToTexture(c, data[i], unit);
						array.push(unit);
						resolutions.push(data[i].width, data[i].height);
					}
					c.uniform1iv(location, new Int32Array(array));
					c.uniform2fv(c.getUniformLocation(shaderProgram, p[1]), new Float32Array(resolutions));
				} else {
					let unit = textureUnit++;
					let tex = GPUShader.imageTypeToTexture(c, data, unit);
					c.uniform1i(location, unit);
					c.uniform2f(c.getUniformLocation(shaderProgram, p[0]), data.width, data.height);
				}
			} else {
				let singleData;
				if (u.isArray) singleData = data[0];
				else singleData = data;

				let dataKeys = [];
				for (let key in singleData) dataKeys.push(key);
				let vector = singleData instanceof Number;
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
		this.augmented = { c };
		this.shade();
	}
	makeImage() {
		return this.image;
	}
	static imageTypeToTexture(c, image, textureUnit) {
		let tex = c.createTexture();
		c.activeTexture(c.TEXTURE0 + textureUnit)
		c.bindTexture(c.TEXTURE_2D, tex);

		c.texParameteri(c.TEXTURE_2D, c.TEXTURE_WRAP_S, c.CLAMP_TO_EDGE);
		c.texParameteri(c.TEXTURE_2D, c.TEXTURE_WRAP_T, c.CLAMP_TO_EDGE);
		c.texParameteri(c.TEXTURE_2D, c.TEXTURE_MIN_FILTER, c.LINEAR);

		c.texImage2D(c.TEXTURE_2D, 0, c.RGBA, c.RGBA, c.UNSIGNED_BYTE, image.makeImage());

		return {
			width: image.width,
			height: image.height,
			texture: tex
		};
	}
}