class WebGLRenderer2D {
	constructor(artist) {
		this.artist = artist;
		this.exists = false;
	}
	set fillStyle(a) {
		this._setState("fillStyle", a);
	}
	get fillStyle() {
		return this._getState("fillStyle");
	}
	set globalAlpha(a) {
		this._setState("globalAlpha", a);
	}
	get globalAlpha() {
		return this._getState("globalAlpha");
	}
	// context methods
	clear() {
		const gl = this.c;
		gl.clearColor(1, 1, 1, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);
	}
	scale(x, y) {
		if (x !== 1 || y !== 1) {
			this._setState("xyScale", this._getState("xyScale") * Math.max(x, y));
			this._setState("coordinateTransform", Matrix3.mulMatrix(Matrix3.scale(x, y), this._getState("coordinateTransform")));
		}
	}
	rotate(angle) {
		if (angle) this._setState("coordinateTransform", Matrix3.mulMatrix(Matrix3.rotation(angle), this._getState("coordinateTransform")));
	}
	translate(x, y) {
		if (x || y) this._setState("coordinateTransform", Matrix3.mulMatrix(Matrix3.translation(x, y), this._getState("coordinateTransform")));
	}
	resetTransform() {
		this._setState("xyScale", 1);
		this._setState("coordinateTransform", Matrix3.identity());
	}
	save() {
		this.savedStates.push(this._getCurrentState().get());
	}
	restore() {
		if (this.savedStates.length) {
			const savedState = this.savedStates.pop();
			for (let key in savedState) {
				this._setState(key, savedState[key]);
			}
		}
	}
	fillRect(x, y, w, h) {
		this.drawCalls++;
		const { positionArray, stateIndexArray, indexArray } = this.arrays;
		let I = this.currentIndex;
		const S = this.currentStateIndex;
		positionArray.push(
			x, y,
			x + w, y,
			x, y + h,
			x + w, y + h
		);
		stateIndexArray.push(S, S, S, S);
		indexArray.push(
			I + 0, I + 1, I + 2,
			I + 1, I + 3, I + 2
		);
		I += 4;
		this.currentIndex = I;
	}
	fillArc(x, y, radius, sa, ea) {
		this.drawCalls++;
		const { positionArray, stateIndexArray, indexArray } = this.arrays;
		let I = this.currentIndex;
		const S = this.currentStateIndex;
		const stepSize = 3 / (radius * this._getState("xyScale"));
		const steps = Math.round((ea - sa) / stepSize);

		let points = [];
		for (let i = 0; i < steps; i++) {
			let a = sa + i * stepSize;
			let inx = Math.floor(Math.abs(a / this.arcStepSize) % this.arcVectorMap.length);
			points.push([x + this.arcVectorMap[inx][0] * radius, y + this.arcVectorMap[inx][1] * Math.sign(a) * radius]);
		}

		positionArray.push(x, y);
		stateIndexArray.push(S);
		for (let i = 0; i < steps; i++) {
			positionArray.push(points[i][0], points[i][1]);
			stateIndexArray.push(S);
		}

		for (let i = 0; i < steps; i++) {
			indexArray.push(
				I + i + 1,
				I + (i + 1) % steps + 1,
				I
			);
		}
		I += steps + 1;
		this.currentIndex = I;
	}
	fillPolygon(points) {
		this.drawCalls++;
		if (points.length < 3) return;
		const { positionArray, stateIndexArray, indexArray } = this.arrays;
		let I = this.currentIndex;
		const S = this.currentStateIndex;

		for (let i = 0; i < points.length; i++) {
			positionArray.push(points[i].x, points[i].y);
			stateIndexArray.push(S);
		}

		let startIndex = indexArray.length;
		if (this.cachedTriangulations.has(points)) indexArray.pushArray(this.cachedTriangulations.get(points));
		else {
			let acc = [];
			if (points.length === 3) acc.push(0, 1, 2);
			else {
				for (let i = 0; i < points.length / 2; i++) {
					let a = points.length - 1 - i;
					let b = i ? points.length - i : 0;
					let c = i + 1;
					let d = i + 2;
					if (a !== d) acc.push(a, c, d, a, b, c);
				}
				if (points.length % 2 === 1) {
					acc.pop();
					acc.pop();
					acc.pop();
				}
				this.cachedTriangulations.set(points, acc);
				indexArray.pushArray(acc);
			}
		}
		for (let i = startIndex; i < indexArray.length; i++) indexArray[i] += I;

		I += points.length;

		this.currentIndex = I;
	}
	//internal methods
	initializeDataStructures() {
		this.canvas = new_OffscreenCanvas(this.artist.canvas.width, this.artist.canvas.height);
		this.c = null;
		this.screenTransform = Matrix3.identity();
		this.states = [WebGLRenderer2DState.identity()];
		this.savedStates = [];
		this.currentStateIndex = 0;
		this.maximumStateUniforms = 400;
		this.drawCalls = 0;
		this.shaderProgram = null;
		this.uniforms = {
			screenTransformLocation: null,
			stateLocations: null
		};
		this.buffers = {
			positionBuffer: null,
			stateIndexBuffer: null,
			indexBuffer: null
		};
		this.arrays = {
			positionArray: [],
			stateIndexArray: [],
			indexArray: []
		};
		this.attributes = {
			vertexPositionPointer: null,
			vertexColorPointer: null
		};

		this.currentIndex = 0;

		//arcs
		const ARC_STEP_SIZE = 0.1;
		const ARC_STEPS = Math.PI * 2 / ARC_STEP_SIZE;
		this.arcVectorMap = [];
		this.arcStepSize = ARC_STEP_SIZE;
		for (let i = 0; i < ARC_STEPS; i++) {
			let a = i * ARC_STEP_SIZE;
			this.arcVectorMap.push([Math.cos(a), Math.sin(a)]);
		}

		// context attributes
		this.cachedTriangulations = new Map();
	}
	setup() {
		this.initializeDataStructures();
		this.exists = true;
		this.c = this.canvas.getContext("webgl");

		const gl = this.c;
		if (!gl) exit("Your browser does not have Webgl.");

		this.attributes.vertexPositionPointer = 0;
		this.attributes.vertexStateIndexPointer = 1;
		const vertexSource = `
attribute highp vec2 vertexPosition;
attribute highp float vertexStateIndex;

uniform highp mat3 screenTransform;
// state uniforms
${WebGLRenderer2DState.createUniformDeclarations(this.maximumStateUniforms)}

varying highp vec2 position;
varying highp vec4 color;

void main() {
	highp vec3 modVertexPosition = vec3(vertexPosition, 1.0);
	highp vec4 modVertexColor = vec4(1.0, 0.0, 0.0, 1.0);
	highp int correctIndex = int(vertexStateIndex);
	for (highp int i = 0; i < ${this.maximumStateUniforms}; i++) {
		if (i == correctIndex) {
			${WebGLRenderer2DState.createStateUniformAppliers(this.maximumStateUniforms)}
			break;
		}
	}
	gl_Position = vec4(screenTransform * modVertexPosition, 1.0);
	position = gl_Position.xy;
	color = modVertexColor;

	//from fragmentShader
	color.rgb *= color.a;
}
		`;
		WebGLRenderer2DState.fillEmptyData(this.maximumStateUniforms);
		const pixelSource = `
varying highp vec2 position;
varying highp vec4 color;

void main() {
	gl_FragColor = color;
}
		`;
		//shader programs
		function compileShader(type, source) {
			let shader = gl.createShader(type);
			gl.shaderSource(shader, source);
			gl.compileShader(shader);
			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
				exit(gl.getShaderInfoLog(shader));
				return false;
			}
			return shader;
		}
		const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
		const pixelShader = compileShader(gl.FRAGMENT_SHADER, pixelSource);
		if (!pixelShader) return;
		const shaderProgram = gl.createProgram();
		this.shaderProgram = shaderProgram;

		gl.attachShader(shaderProgram, vertexShader);
		gl.attachShader(shaderProgram, pixelShader);
		gl.linkProgram(shaderProgram);

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		gl.useProgram(shaderProgram);

		this.uniforms.screenTransformLocation = gl.getUniformLocation(shaderProgram, "screenTransform");
		this.uniforms.stateLocations = WebGLRenderer2DState.createUniformLocationProfile(gl, shaderProgram);

		//big meshes
		gl.getExtension("OES_element_index_uint");

		this.buffers.positionBuffer = gl.createBuffer();
		this.buffers.stateIndexBuffer = gl.createBuffer();
		this.buffers.indexBuffer = gl.createBuffer();
		gl.enableVertexAttribArray(this.attributes.vertexPositionPointer);
		gl.enableVertexAttribArray(this.attributes.vertexStateIndexPointer);

	}
	beforeFrame() {
		this.canvas.width = this.artist.canvas.width;
		this.canvas.height = this.artist.canvas.height;

		const { width, height } = this.canvas;

		const originTransform = Matrix3.translation(-1, 1);
		const screenSizeTransform = Matrix3.scale(devicePixelRatio * 2 / width, -devicePixelRatio * 2 / height);

		this.screenTransform = Matrix3.mulMatrix(screenSizeTransform, originTransform);
	}
	afterFrame() {
		if (this.arrays.indexArray.length) {
			this.render();
		}
	}
	render() {
		const gl = this.c;

		gl.uniformMatrix3fv(this.uniforms.screenTransformLocation, false, new Float32Array(this.screenTransform));
		WebGLRenderer2DState.setStateUniforms(this.states, gl, this.uniforms.stateLocations);

		gl.viewport(0, 0, this.canvas.width, this.canvas.height);

		const { positionBuffer, indexBuffer } = this.buffers;

		this._updatePositions();
		this._updateStateIndices();
		this._updateIndices();

		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		gl.drawElements(gl.TRIANGLES, this.arrays.indexArray.length, gl.UNSIGNED_INT, 0);

		this._clearPlans();

		this.changed = true;

		// if (!window.renders) window.renders = 0;
		// window.renders++;
	}
	_setState(key, value) {
		if (this.drawCalls > 0) {
			this.currentStateIndex++;
			this.states.push(this._getCurrentState().get());
			this.drawCalls = 0;
		}
		this._getCurrentState()[key] = value;
		if (this.currentStateIndex == this.maximumStateUniforms - 1) this.render();
	}
	_getState(key) {
		return this._getCurrentState()[key];
	}
	_getCurrentState() {
		return this.states[this.states.length - 1];
	}
	_clearPlans() {
		this.currentIndex = 0;
		this.currentStateIndex = 0;
		this.states = [this.states.pop().get()];
		this.drawCalls = 0;
		this.arrays.positionArray = [];
		this.arrays.stateIndexArray = [];
		this.arrays.indexArray = [];
	}
	_color255(r, g, b, a) {
		return [r / 255, g / 255, b / 255, a];
	}
	_updatePositions() {
		const gl = this.c;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.arrays.positionArray), gl.DYNAMIC_DRAW);
		gl.vertexAttribPointer(this.attributes.vertexPositionPointer, 2, gl.FLOAT, false, 0, 0);
	}
	_updateStateIndices() {
		const gl = this.c;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.stateIndexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.arrays.stateIndexArray), gl.DYNAMIC_DRAW);
		gl.vertexAttribPointer(this.attributes.vertexStateIndexPointer, 1, gl.FLOAT, false, 0, 0);
	}
	_updateIndices() {
		const gl = this.c;
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int32Array(this.arrays.indexArray), gl.DYNAMIC_DRAW);
	}
}
class WebGLRenderer2DState {
	constructor(fillStyle, globalAlpha, transform, xyScale) {
		this.fillStyle = fillStyle;
		this.globalAlpha = globalAlpha;
		this.coordinateTransform = transform;
		this.xyScale = xyScale;
	}
	get() {
		return new WebGLRenderer2DState(this.fillStyle, this.globalAlpha, this.coordinateTransform, this.xyScale);
	}
	static fillEmptyData(maximumStateUniforms) {
		for (let i = 0; i < WebGLRenderer2DState.keys.length; i++) {
			let type = WebGLRenderer2DState.types[i];
			let empty;
			switch (type) {
				case "float":
					empty = [0];
					break;
				case "vec4":
					empty = [0, 0, 0, 1];
					break;
				case "mat3":
					empty = Matrix3.identity();
					break;
			}
			let empties = [];
			for (let j = 0; j < maximumStateUniforms; j++) empties.pushArray(empty);
			WebGLRenderer2DState.empties.push(empties);
		}
	}
	static setStateUniforms(states, gl, profile) {
		for (let i = 0; i < WebGLRenderer2DState.keys.length; i++) {
			const key = WebGLRenderer2DState.keys[i];
			const type = WebGLRenderer2DState.types[i];
			let data = [];
			let func = "uniform";
			let ArrayType;
			switch (type) {
				case "mat3":
					for (let j = 0; j < states.length; j++) data.pushArray(states[j][key]);
					func += "Matrix3fv";
					ArrayType = Float32Array;
					break;
				case "vec4":
					for (let j = 0; j < states.length; j++) data.pushArray(states[j][key]);
					func += "4fv";
					ArrayType = Float32Array;
					break;
				case "float":
					for (let j = 0; j < states.length; j++) data.push(states[j][key]);
					func += "1fv";
					ArrayType = Float32Array;
					break;
			}
			const buffer = WebGLRenderer2DState.empties[i].slice(data.length);
			data.pushArray(buffer);
			const glData = new ArrayType(data);
			let uniformLocationName = `${key}Location`;
			const location = profile[uniformLocationName];
			// exit(key, floatData);
			if (func.indexOf("Matrix") > -1) gl[func](location, false, glData);
			else gl[func](location, glData);
		}
	}
	static createUniformLocationProfile(gl, shaderProgram) {
		const result = {};
		for (let i = 0; i < WebGLRenderer2DState.keys.length; i++) {
			const key = WebGLRenderer2DState.keys[i];
			let uniformLocationName = `${key}Location`;
			let uniformName = `state${key.capitalize()}`;
			result[uniformLocationName] = gl.getUniformLocation(shaderProgram, uniformName);
		}
		return result;
	}
	static createUniformDeclarations(maximumStateUniforms) {
		let result = [];
		for (let i = 0; i < WebGLRenderer2DState.keys.length; i++) {
			const key = WebGLRenderer2DState.keys[i];
			let uniformType = WebGLRenderer2DState.types[i];
			let uniformName = `state${key.capitalize()}`;
			result.push(`uniform highp ${uniformType} ${uniformName}[${maximumStateUniforms}];`);
		}
		return result.join("\n");
	}
	static createStateUniformAppliers() {
		let result = [];

		for (let i = 0; i < WebGLRenderer2DState.keys.length; i++) {
			const key = WebGLRenderer2DState.keys[i];
			let uniformName = `state${key.capitalize()}`;
			let code = "";
			switch (key) {
				case "fillStyle":
					code = `modVertexColor = ${uniformName}[i];`;
					break;
				case "globalAlpha":
					code = `modVertexColor.a *= ${uniformName}[i];`;
					break;
				case "coordinateTransform":
					code = `modVertexPosition = ${uniformName}[i] * modVertexPosition;`;
			}
			result.push(code);
		}

		return result.join("\n");
	}
	static identity() {
		return new WebGLRenderer2DState([0, 0, 0, 1], 1, Matrix3.identity(), 1);
	}
}
WebGLRenderer2DState.keys = [
	"fillStyle",
	"globalAlpha",
	"coordinateTransform"
];
WebGLRenderer2DState.types = [
	"vec4",
	"float",
	"mat3"
];
WebGLRenderer2DState.empties = [];