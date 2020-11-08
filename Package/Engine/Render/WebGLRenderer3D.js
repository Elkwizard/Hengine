class WebGLRenderer3D {
	constructor(artist) {
		this.artist = artist;
		this.exists = false;
	}
	beforeFrame() {

	}
	afterFrame() {

	}
	initializeDataStructures() {
		this.canvas = new_OffscreenCanvas(this.artist.canvas.width, this.artist.canvas.height);
		this.c = null;
		this.shadeSmooth = false;
		this.camera = {
			position: Vector3.origin,
			rotation: Vector3.origin
		};
		this.cameraTransform = Matrix4.identity();
		this.shaderProgram = null;
		this.uniformLocations = {
			worldLocation: null,
			normalLocation: null
		};
		this.changed = false;
	}
	setup() {
		this.initializeDataStructures();
		this.exists = true;
		this.c = this.canvas.getContext("webgl");

		const gl = this.c;
		if (!gl) exit("Your browser does not have Webgl.");

		//big meshes
		const bigIndicesExt = gl.getExtension("OES_element_index_uint");

		//sources
		const zNear = 0.001;
		const zFar = 100;
		const vertexSource = `
			attribute vec4 vertexPosition;
			attribute vec4 vertexNormal;
			attribute vec4 vertexColor;

			uniform mat4 worldTransform;
			uniform mat4 normalTransform;

			varying highp vec3 position;
			varying highp vec4 color;

			void main() {
				gl_Position = worldTransform * vertexPosition;
				gl_Position.xy /= max(gl_Position.z - ${zNear}, ${zNear});
				gl_Position.z = (gl_Position.z - ${zNear}) / (${zFar}.0 - ${zNear});
				position = gl_Position.xyz;
				color = vertexColor;
				highp float light = (normalTransform * vertexNormal).y * 0.5 + 0.5;
				color.rgb *= light;

				//from fragmentShader
				color.rgb *= color.a;
			}
		`;
		const pixelSource = `
			varying highp vec3 position;
			varying highp vec4 color;

			void main() {
				if (position.z < ${zNear}) discard;
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

		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);

		gl.clearColor(0, 0, 0, 0);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);
		gl.depthRange(zNear, 1);

		gl.useProgram(shaderProgram);

		this.uniformLocations = {
			worldLocation: gl.getUniformLocation(shaderProgram, "worldTransform"),
			normalLocation: gl.getUniformLocation(shaderProgram, "normalTransform")
		};
	}
	render(mesh) {
		const { positionBuffer, indexBuffer, vertexCount } = mesh;

		const { c: gl, canvas, uniformLocations: { normalLocation, worldLocation }, camera: { rotation, position } } = this;

		canvas.width = this.artist.canvas.width;
		canvas.height = this.artist.canvas.height;


		//transform matrix
		const AR = canvas.width / canvas.height;
		const aspectRatioTransform = Matrix4.scale(1, -AR, 1);
		const cameraTransform = Matrix4.glCamera(position.x, position.y, position.z, rotation.x, rotation.y, rotation.z);
		const worldTransform = Matrix4.mulMatrix(
			cameraTransform,
			aspectRatioTransform
		);
		const modelTransform = mesh.transform;
		const transform = Matrix4.mulMatrix(modelTransform, worldTransform);

		this.cameraTransform = worldTransform;

		gl.uniformMatrix4fv(worldLocation, false, new Float32Array(transform));
		gl.uniformMatrix4fv(normalLocation, false, new Float32Array(mesh.normalTransform));

		gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		gl.drawElements(gl.TRIANGLES, vertexCount, gl.UNSIGNED_INT, 0);

		this.changed = true;
	}
}