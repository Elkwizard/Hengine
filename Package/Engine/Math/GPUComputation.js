/**
 * @page GLSL API
 * The version of GLSL used in the Hengine is GLSL ES 3.0.
 * Interactions between GLSL and javascript via GPUInterfaces require associations between types in both the languages.
 * These associations are laid out in the following table:
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
 * 	<tr><td>fixed-length array</td><td>Array</td></tr>
 *  <tr><td>dynamic-length array</td><td>GPUArray</td></tr>
 * </table>
 * 
 * Though they are not present in any GLSL language standard, the GPUInterface supports dynamic-length, global, uniform struct arrays. 
 * hese are specified by omitting the length when declaring the array.
 * Though they can be used like normal arrays (indexed with `array[index]` and measured with `array.length()`), they cannot be cast to normal arrays.
 * Dynamic-length arrays' elements do not count toward the uniform limit, and can freely contain millions of elements on most platforms.
 * 
 * ```glsl
 * struct Line {
 * 	vec2 start, end;
 * };
 * 
 * uniform Line[] linesA; // dynamic length
 * uniform Line[100] linesB; // fixed length
 * ```
 * Dynamic-length arrays are represented by GPUArrays, which are pre-set as the values for these uniforms. These arrays cannot be replaced, only modified. As such, calling `GPUInterface.prototype.setArgument()` on a dynamic-length uniform is equivalent to calling `GPUArray.prototype.set()` on the retrieved array.
 * ```js
 * // gpu is a GPUInterface. The following two lines are equivalent if "linesA" is a dynamic-length array uniform.
 * gpu.setArgument("linesA", lines);
 * gpu.getArgument("linesA").set(lines);
 * ```
 */

class GLSL {
	constructor(glsl, {
		comments = true,
		uniforms = true,
		structs = true,
		dynamicArrays = true,
		methods = true
	} = { }) {
		this.glsl = glsl;
		if (comments) this.removeComments();
		if (structs) this.parseStructs();
		if (uniforms) this.parseUniforms();
		if (dynamicArrays) this.compileDynamicArrays();
		if (methods) this.parseMethods();
	}
	parseMethods() {
		this.methods = new Map(
			[...this.glsl.matchAll(/(\w+(\s*\[\s*\d+\s*\])?)\s*\b(\w+)\s*\((.*?)\)/g)]
				.map(([, returnType,, name, args]) => {
					const signature = this.parseDeclaration(`${returnType} ${name}`);
					args = args.split(",").map(arg => this.parseDeclaration(arg));
					return [signature.name, { signature, args }];
				})
		);
	}
	normalizeString(str) {
		return str
			.replace(/\b/g, " ")
			.replace(/\s+/g, " ")
			.replace("[]", "[ 0 ]")
			.trim();
	}
	parseDeclaration(str) {
		str = this.normalizeString(str);
			
		const pieces = str.split(" ");

		if (pieces.length === 5) {
			if (pieces[2] === "[")  pieces.splice(1, 0, ...pieces.splice(2, 3));
			const [type,, dim,, name] = pieces;
			return { type, name, length: +dim };
		}
		
		const [type, name] = pieces;
		return { type, name };
	}
	parseDeclarations(str) {
		const decls = str.split(",").map(decl => this.normalizeString(decl));
		decls[0] = this.parseDeclaration(decls[0]);

		for (let i = 1; i < decls.length; i++) {
			const pieces = decls[i].split(" ");
			if (pieces.length === 1) {
				decls[i] = { type: decls[0].type, name: pieces[0], length: decls[0].length };
			} else {
				const [name,, dim] = pieces;
				decls[i] = { type: decls[0].type, name, length: +dim };
			}
		}
		
		return decls;
	}
	parseUniforms() {
		this.uniforms = [];
		this.glsl = this.glsl.replace(/\buniform\b(.*?);/g, (_, decl) => {
			const declarations = this.parseDeclarations(decl);
			this.uniforms.pushArray(declarations);
			return declarations
				.map(({ type, name, length }) => `uniform ${type}${length ? `[${length}]` : ""} ${name};`)
				.join("\n");
		});
		this.uniforms = new Map(this.uniforms.map(decl => [decl.name, decl]));
	}
	removeComments() {
		this.glsl = this.glsl
			.replace(/\/\/(.*?)(\n|$)/g, "$2") // single line
			.replace(/\/\*((.|\n)*?)\*\//g, ""); // multiline
	}
	compileDynamicArrays() {
		this.dynamicArrays = new Map();
		for (const [name, uniform] of this.uniforms)
			if (uniform.length === 0) {
				this.dynamicArrays.set(name, uniform);
				this.compileDynamicArray(uniform);
			}
	}
	compileDynamicArray({ type, name }) {
		const struct = this.structs.get(type);

		const bytes = struct.size;
		const { VECTORS, SIZE } = GLSL;
		const { PIXEL_BYTES, CHANNEL_BYTES, LITTLE_ENDIAN } = GPUDataTexture;
		const channels = Vector4.modValues;

		const READ = {
			"bool": index => `bool(bytes[${index}])`,
			"int": index => `bytes[${index}] | bytes[${index + 1}] << 8 | bytes[${index + 2}] << 16 | bytes[${index + 3}] << 24`,
			"float": index => `intBitsToFloat(${READ.int(index)})`
		};

		for (const key in READ) {
			const vecName = VECTORS[key];
			const elSize = SIZE[key];
			const read = READ[key];
			for (let i = 2; i <= 4; i++) {
				const name = vecName + i;
				READ[name] = index => `${name}(${
					Array.dim(i)
						.map((_, i) => read(index + i * elSize))
						.join(", ")
				})`;
			}
		}

		let offset = 0;
		const reads = [];
		for (let i = 0; i < struct.fields.length; i++) {
			const { name, type } = struct.fields[i];
			reads.push(`result.${name} = ${READ[type](offset)};`);
			offset += SIZE[type];
		}

		const identifiers = GPUInputArray.getNames(name);

		const replacement = `
			uniform highp usampler2D ${identifiers.texture};
			uniform int ${identifiers.length};

			${struct.name} ${identifiers.read}(int index) {
				int firstByte = index * ${bytes};
				int pixelIndex = firstByte / ${PIXEL_BYTES};
				int endPixelIndex = (firstByte + ${bytes - 1}) / ${PIXEL_BYTES};
				int width = textureSize(${name}, 0).x;
				int[${(Math.ceil(bytes / PIXEL_BYTES) + 1) * PIXEL_BYTES}] paddedBytes;
				for (int i = pixelIndex; i <= endPixelIndex; i++) {
					uvec4 pixel = texelFetch(${identifiers.texture}, ivec2(i % width, i / width), 0);
					int byte = (i - pixelIndex) * ${PIXEL_BYTES};\n${
						channels
							.map((key, i) => {
								const channel = `pixel.${key}`;
								const baseIndex = i * CHANNEL_BYTES;
								const maxOffset = (CHANNEL_BYTES - 1) * 8;
								return Array.dim(CHANNEL_BYTES)
									.map((_, i) => {
										let offset = i * 8;
										if (!LITTLE_ENDIAN) offset = maxOffset - offset;
										let expr = channel;
										if (offset) expr += ` >> ${offset}u`;
										if (offset < maxOffset) expr += " & 255u";
										return `paddedBytes[byte + ${baseIndex + i}] = int(${expr});`;
									})
									.join("\n");
							})
							.join("\n")
					}
				}
				
				int[${bytes}] bytes;
				int startIndex = firstByte - pixelIndex * ${PIXEL_BYTES};
				for (int i = 0; i < ${bytes}; i++)
					bytes[i] = paddedBytes[i + startIndex];

				${struct.name} result;\n${reads.join("\n")}

				return result;
			}
		`;

		this.glsl = this.glsl.replace(`uniform ${type} ${name};`, replacement);
		
		const lengthRegex = new RegExp(String.raw`\b${name}\s*\.\s*length\s*\(\s*\)`, "g");
		this.glsl = this.glsl.replace(lengthRegex, identifiers.length);

		const arrayIndex = ` ${identifiers.read}[`;
		this.glsl = this.glsl.replace(new RegExp(String.raw`\b${name}\s*\[`, "g"), arrayIndex);

		while (this.glsl.includes(arrayIndex)) {
			const index = this.glsl.indexOf(arrayIndex);
			const startIndex = index + arrayIndex.length;
			let depth = 1;
			let content = "";
			for (let i = startIndex; i < this.glsl.length && depth; i++) {
				const char = this.glsl[i];
				if (char === "[") depth++;
				else if (char === "]") depth--;
				content += char;
			}
			
			this.glsl = this.glsl.set(startIndex - 1, "(");
			this.glsl = this.glsl.set(startIndex + content.length - 1, ")");
		}
	}
	parseStructs() {
		this.structs = new Map(
			[...this.glsl.matchAll(/struct(.*?)\{(.*?)\}/gs)]
				.map(([, name, fields]) => {
					name = name.trim();
					fields = fields
						.trim()
						.slice(0, -1)
						.split(";")
						.flatMap(line => this.parseDeclarations(line));
					return [name, { name, fields }];
				})
		);

		// resolve nested structs
		let expanded = false;
		do {
			expanded = false;
			for (const [, struct] of this.structs) {
				struct.fields = struct.fields.flatMap(field => {
					if (this.structs.has(field.type)) {
						expanded = true;
						return this.structs.get(field.type).fields
							.map(f => ({ type: f.type, name: field.name + "." + f.name }));
					}
					return [field];
				});
			}
		} while (expanded);

		const operations = {
			float: [["float32", ""]],
			int: [["int32", ""]],
			bool: [["bool", ""]]
		};

		for (const key in GLSL.VECTORS) {
			const vecName = GLSL.VECTORS[key];
			const op = operations[key];
			for (let n = 2; n <= 4; n++) {
				const name = vecName + n;
				operations[name] = Array.dim(n).map((_, i) => [op[0][0], "." + Vector4.modValues[i]]);
			}
		}

		for (const [, struct] of this.structs) {
			const { fields } = struct;
			struct.write = new Function("value", "write", fields.flatMap(field => {
				return operations[field.type].map(([op, suffix]) => {
					return `write.${op}(value.${field.name}${suffix});`;
				});
			}).join("\n"));
			struct.read = new Function("value", "read", fields.flatMap(field => {
				return operations[field.type].map(([op, suffix]) => {
					return `value.${field.name}${suffix} = read.${op}();`;
				});
			}).join("\n"));
			struct.size = Number.sum(fields.map(field => GLSL.SIZE[field.type]));
		}
	}
	toString() {
		return this.glsl;
	}
}
GLSL.SIZE = {
	float: 4,
	int: 4,
	bool: 1
};
GLSL.VECTORS = {
	float: "vec",
	int: "ivec",
	bool: "bvec"
};
for (const key in GLSL.VECTORS) {
	const vecName = GLSL.VECTORS[key];
	const elSize = GLSL.SIZE[key];
	for (let n = 2; n <= 4; n++)
		GLSL.SIZE[vecName + n] = elSize * n;
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

class GPUDataTexture {
	constructor(gl) {
		this.gl = gl;
	}
	set bytes(count) {
		if (count <= this.bytes) return;
		const { INTERNAL_FORMAT, FORMAT, TYPE, PIXEL_BYTES } = GPUDataTexture;
		const { gl } = this;
		this.size = Math.ceil(Math.sqrt(count / PIXEL_BYTES));
		gl.texImage2D(
			gl.TEXTURE_2D, 0, gl[INTERNAL_FORMAT],
			this.size, this.size, 0,
			gl[FORMAT], gl[TYPE], null
		);
	}
	get bytes() {
		return GPUDataTexture.PIXEL_BYTES * this.size ** 2;
	}
	bind(unit) {
		const { gl } = this;
		if (unit !== undefined) gl.activeTexture(gl.TEXTURE0 + unit);
		
		if (this.texture) gl.bindTexture(gl.TEXTURE_2D, this.texture);
		else {
			this.texture = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, this.texture);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		}

		return this.texture;
	}
}
GPUDataTexture.TypedArray = Uint32Array;
GPUDataTexture.INTERNAL_FORMAT = "RGBA32UI";
GPUDataTexture.FORMAT = "RGBA_INTEGER";
GPUDataTexture.TYPE = "UNSIGNED_INT";
GPUDataTexture.CHANNEL_BYTES = GPUDataTexture.TypedArray.BYTES_PER_ELEMENT;
GPUDataTexture.PIXEL_BYTES = GPUDataTexture.CHANNEL_BYTES * 4;
GPUDataTexture.LITTLE_ENDIAN = !!new Uint8Array(new Uint32Array([1]).buffer)[0];

/**
 * Represents an array of GLSL structs.
 * These structs may be nested.
 * These are used to represent GLSL dynamic-length array uniforms and the output of GPUComputations, but should not be constructed directly.
 * For a struct such as:
 * ```glsl
 * struct Circle {
 * 	vec2 position;
 * 	float radius;
 * 	vec3 color;
 * };
 * ```
 * A GPUArray could be used as follows:
 * ```js
 * // gpu is a GPUInterface
 * const circle = {
 * 	position: new Vector2(100, 200),
 * 	radius: 22.5,
 * 	color: new Color("magenta")
 * };
 * gpu.getArgument("circles").append(circle);
 * ```
 * @prop ByteBuffer buffer | A buffer containing all the structs' data. This can be read from freely at any location, but cannot be written to
 */
class GPUArray {
	constructor(struct) {
		this.struct = struct;
		this.buffer = new ByteBuffer();
		this.set([]);
	}
	set length(length) {
		this._length = length;
		this.buffer.reserve(length * this.struct.size);
		this.changed = true;
	}
	/**
	 * Retrieves the number of structs in the array.
	 * @return Number
	 */
	get length() {
		return this._length;
	}
	/**
	 * Sets the value of the array and returns the caller.
	 * This will overwrite all previous data.
	 * @signature
	 * @param Object[] value | An array of objects with the same structure as the struct
	 * @signature
	 * @param GPUArray value | Another GPU array to copy from. This must represent the same type of structs. Using this signature is faster, and should be done whenever possible
	 * @return GPUArray
	 */
	set(value) {
		if (value instanceof GPUArray) {
			this.changed = true;
			value.buffer.get(this.buffer);
			this.length = value.length;
		} else {
			this.length = 0;
			this.write(value);
		}
		return this;
	}
	/**
	 * Appends a struct to the end of the array and returns the caller.
	 * @param Object value | An object with the same structure as the struct
	 * @return GPUArray
	 */
	append(value) {
		return this.write([value], this.length, 1, 0);
	}
	/**
	 * Writes to a specified location in the array and returns the caller.
	 * This may increase the size of the array, but cannot be used to create holes.
	 * @param Object[] data | An array of objects with the same structure as the struct
	 * @param Number offset? | The first index to write to in the array. Default is 0
	 * @param Number length? | The amount of elements to write. If not specified, this will be as many as possible
	 * @param Number srcOffset? | The first index to read from the data argument. If not specified, this will be the same as the offset argument
	 * @return GPUArray
	 */
	write(data, offset = 0, length, srcOffset = offset) {
		length ??= data.length - srcOffset;

		const { write } = this.buffer;
		const writeFunction = this.struct.write;
		
		this.buffer.pointer = offset * this.struct.size;
		
		const end = srcOffset + length;
		for (let i = srcOffset; i < end; i++)
			writeFunction(data[i], write);
		
		this.length = Math.max(this.length, offset + length);

		return this;
	}
	/**
	 * Reads from a specified location in the array into a provided array of objects, and returns the destination array.
	 * @param Object[] data | An array of objects with the same structure as the struct
	 * @param Number offset? | The first index to read from in the array. Default is 0
	 * @param Number length? | The amount of elements to read. If not specified, this will be as many as possible
	 * @param Number dstOffset? | The first index to write to in the data argument. If not specified, this will be the same as the offset argument
	 * @return Object[]
	 */
	read(data, offset = 0, length, dstOffset = offset) {
		length ??= data.length - dstOffset;
		
		const { read } = this.buffer;
		const readFunction = this.struct.read;
		
		this.buffer.pointer = offset * this.struct.size;

		const end = dstOffset + length;
		for (let i = dstOffset; i < end; i++)
			readFunction(data[i], read);
		
		return data;
	}
}

class GPUInputArray extends GPUArray {
	constructor(gl, program, name, unit, struct) {
		super(struct);
		this.gl = gl;
		this.unit = unit;
		this.struct = struct;
		this.lengthLocation = gl.getUniformLocation(program, GPUInputArray.getNames(name).length);
		this.texture = new GPUDataTexture(gl);
	}
	commit() {
		if (this.changed) {
			this.changed = false;
			this.gl.uniform1i(this.lengthLocation, this.length);
			this.writeTexture();
		}
	}
	writeTexture() {
		if (!this.length) return;
		
		const { PIXEL_BYTES, CHANNEL_BYTES, FORMAT, TYPE, TypedArray } = GPUDataTexture;
		const { gl } = this;

		const bytes = this.length * this.struct.size;
		
		this.texture.bind(this.unit);		
		this.texture.bytes = bytes;

		const ROW_BYTES = this.texture.size * PIXEL_BYTES;

		const writeRect = (x, y, width, height) => {
			const byteOffset = x * PIXEL_BYTES + y * ROW_BYTES;
			const byteLength = width * height * PIXEL_BYTES;
			const paddedByteLength = Math.ceil(byteLength / PIXEL_BYTES) * PIXEL_BYTES;
			const data = new Uint8Array(this.buffer.data.buffer, byteOffset, paddedByteLength);
			const typedArray = new TypedArray(
				data.buffer, data.byteOffset,
				data.byteLength / CHANNEL_BYTES
			);
			gl.texSubImage2D(
				gl.TEXTURE_2D, 0,
				x, y, width, height,
				gl[FORMAT], gl[TYPE],
				typedArray
			);
		};

		const completeRows = Math.floor(bytes / ROW_BYTES);
		const completePixels = Math.floor((bytes % ROW_BYTES) / PIXEL_BYTES);
		const remainder = bytes % PIXEL_BYTES;

		if (completeRows) writeRect(0, 0, this.texture.size, completeRows);
		if (completePixels) writeRect(0, completeRows, completePixels, 1);
		if (remainder) writeRect(completePixels, completeRows, 1, 1);		
	}
	static getNames(name) {
		return {
			length: `_length_${name}`,
			read: `_read_${name}`,
			texture: name
		};
	}
}

class GLSLProgram {
	constructor(gl, glsl, vs, fs, onerror = () => null) {
		this.onerror = onerror;
		this.gl = gl;
		this.vs = vs;
		this.fs = fs;
		this.lockedValues = new Set(glsl.dynamicArrays.keys());

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
		const GL = new Proxy(gl, {
			get(gl, method) {
				if (typeof gl[method] === "function")
					return gl.isContextLost() ? (...args) => queuedCalls.push({ method, args }) : gl[method].bind(gl);
				return gl[method];
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
			this.uniformsSet = false;

			let nextTextureUnit = 0;
			const maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
			
			this.dynamicArrays = [];
			for (const [name, array] of glsl.dynamicArrays) {
				const gpuArray = new GPUInputArray(GL, this.program, name, nextTextureUnit++, glsl.structs.get(array.type));
				this.uniformValues[name] = gpuArray;
				this.dynamicArrays.push(gpuArray);
			}

			for (let i = 0; i < uniformCount; i++) {
				const { size: length, type, name } = gl.getActiveUniform(this.program, i);

				const { integer, signed, rows, columns, texture } = this.getTypeInformation(type);

				const processedName = name.replace(/\[(\d+)\]/g, ".$1");
				const propertyPath = processedName.split(".");
				if (propertyPath.last === "0") propertyPath.pop();

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
					} else if (glsl.dynamicArrays.has(name)) {
						const gpuArray = this.uniformValues[name];
						gl[setFunctionName](location, gpuArray.unit);

						set = array => gpuArray.set(array);
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
						const writeImage = (image, index = 0) => {
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
	get uniformsChanged() {
		return this.uniformsSet || this.dynamicArrays.some(array => array.changed);
	}
	commitUniforms() {
		this.uniformsSet = false;
		for (let i = 0; i < this.dynamicArrays.length; i++)
			this.dynamicArrays[i].commit();
	}
	error(type, error) {
		this.onerror(type, error);
	}
	getTypeInformation(type) {
		const { gl } = this;

		let integer = false, signed = true, rows = 1, columns = 1, texture = false, dynamicArray = false;
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
			case gl.UNSIGNED_INT_SAMPLER_2D: integer = true; texture = true; dynamicArray = true; break;

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

		return { integer, signed, rows, columns, texture, dynamicArray };
	}
	getVectorComponents(value) {
		const keys = Vector4.modValues;
		for (let i = 0; i < keys.length; i++)
			this.vectorBuffer[i] = value[keys[i]];
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
	setUniform(name, value, force = true, location = this.uniforms) {
		if (name in location) {
			if (location === this.uniforms && !this.lockedValues.has(name))
				this.uniformValues[name] = value;
			const child = location[name];
			if (typeof child.set === "function") { // reached leaf
				this.focus(); // need to be the gl.CURRENT_PROGRAM
				this.uniformsSet = true;
				if (value instanceof Operable) {
					this.getVectorComponents(value);
					child.set(...this.vectorBuffer);
				} else child.set(value);
			} else {
				const keys = Object.getOwnPropertyNames(child);
				for (let i = 0; i < keys.length; i++) {
					const key = keys[i];
					if (key in value) this.setUniform(key, value[key], force, child); // more steps needed
				}
			}
		} else if (location === this.uniforms && force) this.error("UNIFORM_SET", `Uniform '${name}' doesn't exist`);
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
 * @type interface GPUInterface
 * Represents a GLSL program.
 * @abstract
 * @prop String glsl | The source code of the program
 */
class GPUInterface {
	constructor(glsl, width, height) {
		this.image = new_OffscreenCanvas(width, height);
		this.gl = this.image.getContext("webgl2");
		if (!this.gl)
			throw new Error("Your browser doesn't support WebGL");
		this.image.addEventListener("webglcontextlost", event => {
			event.preventDefault();
			console.warn("WebGL Context Lost");
		});
		this.image.addEventListener("webglcontextrestored", event => {
			event.preventDefault();
			console.warn("WebGL Context Restored");
			this.compile();
		});

		this.glsl = glsl;
	}
	set glsl(a) {
		this._glsl = a;
		this.parsedGLSL = new GLSL(a);
		this.compile();
	}
	get glsl() {
		return this._glsl;
	}
	get prefix() {
		return "";
	}
	set vertexData(data) {
		const { gl } = this;
		const vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
		this.program.setAttributes(vertexBuffer, 0);
	}
	compile() {
		const { vertexShader, prefix, fragmentShader } = this;
		const version = "#version 300 es";
		const glsl = this.parsedGLSL.toString();
		const vs = version + vertexShader;
		const fs = version + prefix + glsl + fragmentShader;
		this.program = new GLSLProgram(this.gl, this.parsedGLSL, vs, fs, (type, message) => {
			if (type === "FRAGMENT_SHADER")
				GLSLError.process(glsl, message, prefix.split("\n").length);
			else console.warn(message);
		});
		this.program.use();
	}
	/**
	 * Sets the value of a uniform in the program.
	 * @param String name | The name of the uniform
	 * @param Any value | The new value for the uniform. For the type of this argument, see the GLSL API
	 */
	setArgument(name, value) {
		this.program.setUniform(name, value);
	}
	/**
	 * Sets the value of many uniforms at once.
	 * @param Object uniforms | A set of key-value pairs, where the key represents the uniform name, and the value represents the uniform value
	 */
	setArguments(args) {
		for (const key in args)
			this.setArgument(key, args[key]);
	}
	/**
	 * Retrieves the current value of a given uniform.
	 * For the return type of this function, see the GLSL API.
	 * @param String name | The name of the uniform
	 * @return Any
	 */
	getArgument(name) {
		return this.program.getUniform(name);
	}
	/**
	 * Checks whether a given uniform exists.
	 * @param String name | The name of the uniform to check
	 * @return Boolean
	 */
	argumentExists(name) {
		return this.program.hasUniform(name);
	}
}

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
	compile() {
		this.struct = this.parsedGLSL.structs.get(
			this.parsedGLSL.methods.get("compute").signature.type
		);
		this.output = new GPUArray(this.struct);
		
		super.compile();
		
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