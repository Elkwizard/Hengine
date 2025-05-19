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
 * 	<tr><td>sampler2DArray</td><td>ImageType[]</td></tr>
 * 	<tr><td>samplerCube</td><td>CubeMap</td></tr>
 * 	<tr><td>struct</td><td>Object</td></tr>
 * 	<tr><td>fixed-length array</td><td>Array</td></tr>
 *  <tr><td>dynamic-length array</td><td>GPUArray</td></tr>
 * </table>
 * 
 * Though they are not present in any GLSL language standard, the GPUInterface supports dynamic-length, global, uniform struct arrays. 
 * These are specified by omitting the length when declaring the array.
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
 * Dynamic-length arrays are represented by GPUArrays, which are pre-set as the values for these uniforms. These arrays cannot be replaced, only modified. As such, calling `GPUInterface.prototype.setUniform()` on a dynamic-length uniform is equivalent to calling `GPUArray.prototype.set()` on the retrieved array.
 * ```js
 * // gpu is a GPUInterface. The following two lines are equivalent if "linesA" is a dynamic-length array uniform.
 * gpu.setUniform("linesA", lines);
 * gpu.getUniform("linesA").set(lines);
 * ```
 */

/**
 * @name class CubeMap
 * @interface
 * Represents a cube map usable in via a GPUInterface.
 * All faces must be square and equal in size.
 * @name_subs SIDE: negX, posX, negY, posY, negZ, posZ
 * @prop ImageType posX | The face of the cube map on the positive x side
 * @prop ImageType negX | The face of the cube map on the negative x side
 * @prop ImageType posY | The face of the cube map on the positive y side
 * @prop ImageType negY | The face of the cube map on the negative y side
 * @prop ImageType posZ | The face of the cube map on the positive z side
 * @prop ImageType negZ | The face of the cube map on the negative z side 
 */

class GLSL {
	constructor(glsl) {
		this.glsl = glsl;
		this.removeComments();
		this.parseStructs();
		this.parseUniforms();
		this.compileDynamicArrays();
		this.parseMethods();
	}
	parseMethods() {
		this.methods = new Map(
			[...this.glsl.matchAll(/(\w+\s*(?:\[\s*\d+\s*\])?)\s*\b(\w+)\s*\((.*?)\)/g)]
				.map(([, returnType, name, args]) => {
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
			if (pieces[2] === "[") pieces.splice(1, 0, ...pieces.splice(2, 3));
			const [type,, dim,, name] = pieces;
			return { type, name, length: dim };
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
				decls[i] = { type: decls[0].type, name, length: dim };
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
			if (uniform.length === "0") {
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

		this.glsl = this.glsl.replace(`uniform ${type}[0] ${name};`, replacement);
		
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
	static process(string, source) {
		const sourceLines = source.completeSource.split("\n");
		
		let errors = string.split("ERROR: ");
		errors.shift();
		for (let i = 0; i < errors.length; i++) {
			// parse
			const rawString = errors[i];
			const string = rawString.cut(":")[1];
			let [lineStr, descStr] = string.cut(":");
			lineStr = lineStr.trim();
			let line = parseInt(lineStr);
			let desc = descStr;
			if (isNaN(line)) {
				line = 0;
				desc = rawString;
			}
			throw new GLSLError(sourceLines[line - 1], line - source.prefixLines, desc.trim());
		}
	}
}

class ShaderSource {
	constructor(glsl, prefix = "", suffix = "") {
		this.glsl = glsl;
		
		this.prefix = [
			"#version 300 es",
			...["int", "float", "sampler2D", "samplerCube", "sampler2DArray"]
				.map(type => `precision highp ${type};`),
			prefix
		].join("\n");
		this.prefixLines = this.prefix.match(/\n/g).length + 1;
		this.suffix = suffix;
		this.completeSource = this.prefix + this.glsl + this.suffix;
	}
	toString() {
		return this.completeSource;
	}
	static raw(source) {
		return new ShaderSource(new GLSL(""), source);
	}
	static template(strings, ...subs) {
		const index = subs.findIndex(sub => sub instanceof GLSL);
		const prefix = String.raw({ raw: strings.slice(0, index + 1) }, ...subs.slice(0, index));
		const suffix = String.raw({ raw: strings.slice(index + 1) }, ...subs.slice(index + 1));
		return new ShaderSource(subs[index], prefix, suffix);
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
		else this.texture = GLUtils.createTexture(gl);

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
 * gpu.getUniform("circles").append(circle);
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
	constructor(gl, name, unit, struct) {
		super(struct);
		this.gl = gl;
		this.unit = unit;
		this.struct = struct;
		this.name = name;
	}
	setup(program) {
		this.lengthLocation = this.gl.getUniformLocation(program, GPUInputArray.getNames(this.name).length);
		this.texture = new GPUDataTexture(this.gl);
		this.changed = true;
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
	constructor(gl, vs, fs) {
		this.gl = gl;
		this.vs = vs;
		this.fs = fs;
		const dynamicArrayDescriptors = new Map([this.vs, this.fs].flatMap(shader => {
			return [...shader.glsl.dynamicArrays]
				.map(([name, desc]) => [name, { ...desc, origin: shader }]);
		}));
		this.lockedValues = new Set(dynamicArrayDescriptors.keys());
		
		this.compileProgram();

		const originalProgram = gl.getParameter(gl.CURRENT_PROGRAM);
		this.use();

		{ // uniforms
			const uniformCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);

			this.uniforms = {};
			this.uniformValues = {};
			this.uniformsSet = false;
			this.allUniforms = [];

			let nextTextureUnit = 0;
			this.maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);

			this.dynamicArrays = [];
			for (const [name, array] of dynamicArrayDescriptors) {
				const unit = nextTextureUnit++;
				this.checkTextureUnit(unit);
				const gpuArray = new GPUInputArray(gl, name, unit, array.origin.glsl.structs.get(array.type));
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
					if (rows !== columns) setFunctionName += columns + "x" + rows;
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

				const self = this;

				const desc = {
					getLocation() {
						this.location = gl.getUniformLocation(self.program, name);
					},
					setup() { },
					setUniform(...args) {
						if (gl.isContextLost()) return;
						gl[setFunctionName](this.location, ...args);
					},
					set(value) { }
				};

				if (array && (rows !== 1 || columns !== 1)) { // an array of not single values
					const size = rows * columns;

					if (matrix) desc.set = function (values) {
						for (let i = 0; i < values.length; i++)
							dataArray.set(values[i], i * size);
						this.setUniform(false, dataArray);
					};
					else desc.set = function (values) {
						for (let i = 0; i < values.length; i++) {
							const baseIndex = i * size;
							self.getVectorComponents(values[i]);
							for (let j = 0; j < size; j++) dataArray[baseIndex + j] = self.vectorBuffer[j];
						}
						this.setUniform(dataArray);
					};
				} else {
					if (matrix) {
						desc.set = function (value) {
							dataArray.set(value);
							this.setUniform(false, dataArray);
						};
					} else if (dynamicArrayDescriptors.has(name)) {
						const gpuArray = this.uniformValues[name];
						desc.setup = function () {
							gpuArray.setup(self.program);
							this.setUniform(gpuArray.unit);
						};

						desc.set = array => gpuArray.set(array);
					} else if (texture) {
						const textureUnit = nextTextureUnit;
						this.checkTextureUnit(textureUnit + length - 1);
						nextTextureUnit += length;

						const target = {
							array: gl.TEXTURE_2D_ARRAY,
							cube: gl.TEXTURE_CUBE_MAP,
							image: gl.TEXTURE_2D
						}[texture];
						
						const textures = [];

						desc.setup = function () {
							for (let i = 0; i < length; i++) {
								const unit = textureUnit + i;
								const texture = GLUtils.createTexture(gl, {
									unit, target, filter: gl.LINEAR
								});
								textures[i] = { texture, target, unit, smooth: true };
							}

							if (array) this.setUniform(textures.map(tex => tex.unit));
							else this.setUniform(textureUnit);
						};

						if (array) desc.set = images => {
							for (let i = 0; i < images.length; i++)
								if (i < length) this.writeTexture(images[i], textures[i]);
						};
						else desc.set = image => this.writeTexture(image, textures[0]);
					} else {
						if (setWithArrayType) desc.set = function (value) {
							dataArray.set(value);
							this.setUniform(dataArray);
						};
						else if (rows !== 1) {
							desc.set = function (value) {
								self.getVectorComponents(value);
								this.setUniform(...self.vectorBuffer);
							};
						} else desc.set = function (value) {
							this.setUniform(value);
						};
					}
				}

				let currentStruct = this.uniforms;
				for (let i = 0; i < propertyPath.length; i++) {
					const property = propertyPath[i];
					const last = i === propertyPath.length - 1;

					if (last) {
						currentStruct[property] = desc;
					} else {
						if (!(property in currentStruct)) currentStruct[property] = {};
						currentStruct = currentStruct[property];
					}
				}
				this.allUniforms.push(desc);
			}

			this.vectorBuffer = new Float32Array(4);
		};

		{ // attributes
			this.attributes = {};
			this.divisors = new Map();

			let offset = 0;

			const attributeCount = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
			for (let i = 0; i < attributeCount; i++) {
				const { type, name } = gl.getActiveAttrib(this.program, i);
				const { rows, columns } = this.getTypeInformation(type);
				const location = gl.getAttribLocation(this.program, name);
				const columnBytes = rows * 4;
				const bytes = columns * columnBytes;
			
				this.attributes[name] = {
					name, location, rows, columns,
					enabled: true, divisor: -1,
					bytes, columnBytes, offset
				};
				this.setDivisor(name, 0);
				offset += bytes;
			}
		};

		this.initialize();

		gl.useProgram(originalProgram);
		
		gl.canvas.addEventListener("webglcontextrestored", event => {
			event.preventDefault();
			this.compileProgram();
			this.initialize();
		});
	}
	get uniformsChanged() {
		return this.uniformsSet || this.dynamicArrays.some(array => array.changed);
	}
	writeTexture(image, info) {
		const { gl } = this;

		const format = gl.RGBA;
		const type = gl.UNSIGNED_BYTE;
		const internal = gl.RGBA8;
		
		const texImage2D = (binding, image) => {
			gl.texImage2D(binding, 0, internal, format, type, image.makeWebGLImage());
		};
		
		const { target } = info;

		gl.activeTexture(gl.TEXTURE0 + info.unit);
		if (image instanceof WebGLTexture) {
			gl.bindTexture(target, image);
			return;
		}
		
		gl.bindTexture(target, info.texture);
			
		let smooth = false;
		const isSmooth = image => !(image instanceof Texture);

		switch (target) {
			case gl.TEXTURE_2D: {
				smooth = isSmooth(image);
				texImage2D(gl.TEXTURE_2D, image);
			}; break;
			case gl.TEXTURE_CUBE_MAP: {
				smooth = isSmooth(image.posX);

				let size;
				for (const key in image) {
					const face = image[key];
					if (!size) size = face.width;
					if (size !== face.width || size !== face.height)
						this.error("CUBE_MAP", "Cube map faces are non-square or not equal in size");
				}
				texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, image.posX);
				texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, image.negX);
				texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, image.posY);
				texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, image.negY);
				texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, image.posZ);
				texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, image.negZ);
			}; break;
			case gl.TEXTURE_2D_ARRAY: {
				smooth = isSmooth(image[0]);

				const { pixelWidth, pixelHeight } = image[0];
				if (!image.every(img => img.pixelWidth === pixelWidth && img.pixelHeight === pixelHeight))
					this.error("ARRAY_TEXTURE", "Texture array elements are not of equal size");

				gl.texImage3D(gl.TEXTURE_2D_ARRAY, 0, internal, pixelWidth, pixelHeight, image.length, 0, format, type, null);
				for (let i = 0; i < image.length; i++)
					gl.texSubImage3D(
						gl.TEXTURE_2D_ARRAY, 0,
						0, 0, i,
						pixelWidth, pixelHeight, 1,
						format, type,
						image[i].makeWebGLImage()
					);
			}; break;
		}
		
		if (smooth !== info.smooth) {
			info.smooth = smooth;
			GLUtils.setTextureFilter(gl, target, smooth ? gl.LINEAR : gl.NEAREST);
		}
	}
	checkTextureUnit(unit) {
		if (unit >= this.maxTextureUnits)
			this.error("TEXTURE", "Too many texture uniforms");
	}
	compileProgram() {
		const { gl } = this;

		this.program = gl.createProgram();

		// vertex shader
		const vertex = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(vertex, this.vs);
		gl.compileShader(vertex);
		gl.attachShader(this.program, vertex);

		// fragment shader
		const fragment = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fragment, this.fs);
		gl.compileShader(fragment);
		gl.attachShader(this.program, fragment);

		// linking
		gl.linkProgram(this.program);
		gl.deleteShader(vertex);
		gl.deleteShader(fragment);

		if (!gl.getShaderParameter(vertex, gl.COMPILE_STATUS)) this.error("VERTEX_SHADER", gl.getShaderInfoLog(vertex));
		if (!gl.getShaderParameter(fragment, gl.COMPILE_STATUS)) this.error("FRAGMENT_SHADER", gl.getShaderInfoLog(fragment));
		if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) this.error("LINKING", gl.getProgramInfoLog(this.program));
	}
	initialize() {
		const { gl } = this;
		const originalProgram = gl.getParameter(gl.CURRENT_PROGRAM);
		
		this.focus();

		// uniforms
		this.uniformsSet = true;
		for (let i = 0; i < this.allUniforms.length; i++) {
			const desc = this.allUniforms[i];
			desc.getLocation();
			desc.setup();
			if (desc.value) desc.set(desc.value);
		}

		gl.useProgram(originalProgram);
	}
	commitUniforms() {
		this.uniformsSet = false;
		for (let i = 0; i < this.dynamicArrays.length; i++)
			this.dynamicArrays[i].commit();
	}
	error(type, message) {
		if (type.endsWith("_SHADER"))
			GLSLError.process(message, type.startsWith("FRAGMENT") ? this.fs : this.vs);
		else console.warn(message);
	}
	getTypeInformation(type) {
		const { gl } = this;

		let integer = false;
		let signed = true;
		let rows = 1;
		let columns = 1;
		let texture = false;
		let dynamicArray = false;

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
			
			case gl.FLOAT_MAT2x3: rows = 3; columns = 2; break;
			case gl.FLOAT_MAT2x4: rows = 4; columns = 2; break;
			case gl.FLOAT_MAT3x2: rows = 2; columns = 3; break;
			case gl.FLOAT_MAT3x4: rows = 4; columns = 3; break;
			case gl.FLOAT_MAT4x2: rows = 2; columns = 4; break;
			case gl.FLOAT_MAT4x3: rows = 3; columns = 4; break;

			case gl.SAMPLER_2D: integer = true; texture = "image"; break;
			case gl.INT_SAMPLER_2D: integer = true; texture = "image"; break;
			case gl.UNSIGNED_INT_SAMPLER_2D: integer = true; texture = "image"; dynamicArray = true; break;

			case gl.SAMPLER_2D_ARRAY: integer = true; texture = "array"; break;
			case gl.SAMPLER_CUBE: integer = true; texture = "cube"; break;

			case gl.UNSIGNED_INT: integer = true; signed = false; break;
			case gl.UNSIGNED_INT_VEC2: integer = true; rows = 2; signed = false; break;
			case gl.UNSIGNED_INT_VEC3: integer = true; rows = 3; signed = false; break;
			case gl.UNSIGNED_INT_VEC4: integer = true; rows = 4; signed = false; break;
		}

		return { integer, signed, rows, columns, texture, dynamicArray };
	}
	getVectorComponents(value) {
		const keys = Vector4.modValues;
		for (let i = 0; i < keys.length; i++)
			this.vectorBuffer[i] = value[keys[i]];
	}
	use() {
		this.gl.useProgram(this.program);
	}
	focus() {
		const { gl } = this;
		if (gl.getParameter(gl.CURRENT_PROGRAM) !== this.program)
			this.use();
	}
	setUniform(name, value, force = true, location = this.uniforms) {
		const child = location[name];
		if (!child && location === this.uniforms) {
			if (force) this.error("UNIFORM_SET", `Uniform '${name}' doesn't exist`);
			return;
		}

		if (location === this.uniforms && !this.lockedValues.has(name))
			this.uniformValues[name] = value;

		if (typeof child.set === "function") { // reached leaf
			this.focus();
			this.uniformsSet = true;
			child.set(value);
			child.value = typeof value === "object" ? value.get?.() ?? value : value;
		} else {
			const keys = Object.getOwnPropertyNames(child);
			for (let i = 0; i < keys.length; i++) {
				const key = keys[i];
				if (key in value) this.setUniform(key, value[key], force, child); // more steps needed
			}
		}
	}
	setUniforms(args, force = true) {
		for (const key in args)
			this.setUniform(key, args[key], force);
	}
	getUniform(name) {
		if (this.hasUniform(name)) return this.uniformValues[name];
		else this.error("UNIFORM_GET", `Uniform '${name}' doesn't exist`);
	}
	hasUniform(name) {
		return name in this.uniforms;
	}
	setDivisor(name, divisor) {
		const attribute = this.attributes[name];
		if (!attribute) {
			this.error("DIVISOR_SET", `Vertex attribute '${name}' doesn't exist`);
			return;
		}

		this.divisors.get(attribute.divisor)?.attributes?.delete?.(name);
		if (!this.divisors.has(divisor)) this.divisors.set(divisor, { attributes: new Map() });
		const div = this.divisors.get(divisor);
		div.attributes.set(name, attribute);

		this.layoutDivisor(attribute.divisor);
		this.layoutDivisor(divisor);

		attribute.divisor = divisor;

		this.focus();
		for (let i = 0; i < attribute.columns; i++)
			this.gl.vertexAttribDivisor(attribute.location + i, divisor); 
	}
	layoutDivisor(divisor) {
		if (this.divisors.has(divisor))
			this.layoutAttributes([...this.divisors.get(divisor).attributes.keys()], divisor);
	}
	layoutAttributes(layout, divisor = 0) {
		const div = this.divisors.get(divisor);
		if (!div) {
			this.error("ATTRIBUTE_LAYOUT", `No attributes with vertex divisor '${divisor}' exist`);
			return;
		}

		for (const [_, attribute] of div.attributes)
			attribute.enabled = false;
		
		let offset = 0;
		for (let i = 0; i < layout.length; i++) {
			const name = layout[i];
			if (typeof name === "number") {
				offset += name;
				continue;
			}

			const attribute = div.attributes.get(name);
			attribute.offset = offset;
			attribute.enabled = true;
			offset += attribute.bytes;
		}

		div.stride = offset;
	}
	setAttributes(buffer, divisor = 0) {
		const div = this.divisors.get(divisor);
		if (!div) {
			this.error("ATTRIBUTE_SET", `No attributes with vertex divisor '${divisor}' exist`);
			return;
		}
		
		const { gl } = this;
			
		this.focus();

		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		
		for (const [_, attribute] of div.attributes) {
			
			for (let j = 0; j < attribute.columns; j++) {
				const pointer = attribute.location + j;
				gl.vertexAttribPointer(
					pointer, attribute.rows, gl.FLOAT, false,
					div.stride, attribute.offset + attribute.columnBytes * j
				);
				if (attribute.enabled) gl.enableVertexAttribArray(pointer);
				else gl.disableVertexAttribArray(pointer);
			}
		}
	}
}

class GLUtils {
	static createTexture(gl, {
		target = gl.TEXTURE_2D,
		wrap = gl.CLAMP_TO_EDGE,
		filter = gl.NEAREST,
		unit = null,
	} = { }) {
		const texture = gl.createTexture();
		if (unit !== null) gl.activeTexture(gl.TEXTURE0 + unit);
		gl.bindTexture(target, texture);
		this.setTextureFilter(gl, target, filter);
		this.setTextureWrap(gl, target, wrap);
		return texture;
	}
	static setTextureFilter(gl, target, filter) {
		gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, filter);
		gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, filter);
	}
	static setTextureWrap(gl, target, wrap) {
		gl.texParameteri(target, gl.TEXTURE_WRAP_S, wrap);
		gl.texParameteri(target, gl.TEXTURE_WRAP_T, wrap);
	}
	static throwErrors(gl) {
		const getError = gl.getError;
		const constants = new Map();
		for (const key of Reflect.ownKeys(WebGL2RenderingContext.prototype)) {
			const value = gl[key];
			if (typeof value === "function") {
				gl[key] = function (...args) {
					const result = value.apply(this, args);
					const error = getError.apply(this);
					if (error) {
						const argStrings = args.map(arg => {
							if (arg) {
								if (typeof arg === "object")
									return arg.constructor.name;
								if (arg > 100 && typeof arg === "number" && constants.has(arg))
									return `gl.${constants.get(arg)} (${arg})`;
							}
							return String(arg);	
						});
						throw new Error(`${constants.get(error)} from gl.${key}(${argStrings.join(", ")})`);
					}
					return result;
				}
			} else if (typeof value === "number") {
				constants.set(value, key);
			}
		}
	}
}

/**
 * @interface
 * Represents a GLSL program.
 * @prop String glsl | The source code of the program
 */
class GPUInterface {
	constructor(glsl, width, height) {
		this.image = new_OffscreenCanvas(width, height);
		this.gl = this.image.getContext("webgl2");
		if (!this.gl)
			throw new Error("Your browser doesn't support WebGL");

		this.vertexSource = ShaderSource.raw(this.vertexShader);
		this.glsl = glsl;
		
		this.image.addEventListener("webglcontextlost", event => {
			event.preventDefault();
			console.warn("WebGL Context Lost");
		});
		this.image.addEventListener("webglcontextrestored", event => {
			event.preventDefault();
			console.warn("WebGL Context Restored");
			this.compile();
		});
	}
	set glsl(a) {
		this._glsl = a;
		this.parsedGLSL = new GLSL(a);
		this.setup();
		this.compile();
	}
	get glsl() {
		return this._glsl;
	}
	set vertexData(data) {
		const { gl } = this;
		const vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
		this.program.setAttributes(vertexBuffer);
	}
	setup() {
		this.fragmentSource = this.fragmentShader(this.parsedGLSL);
		this.program = new GLSLProgram(this.gl, this.vertexSource, this.fragmentSource);
		this.program.use();
	}
	compile() {

	}
	/**
	 * Sets the value of a uniform in the program.
	 * @param String name | The name of the uniform
	 * @param Any value | The new value for the uniform. For the type of this argument, see the GLSL API
	 */
	setUniform(name, value) {
		this.program.setUniform(name, value);
	}
	setArgument(name, value) {
		this.setUniform(name, value);
	}
	/**
	 * Sets the value of many uniforms at once.
	 * @param Object uniforms | A set of key-value pairs, where the key represents the uniform name, and the value represents the uniform value
	 */
	setUniforms(args) {
		this.program.setUniforms(args);
	}
	setArguments(args) {
		return this.setUniforms(args);
	}
	/**
	 * Retrieves the current value of a given uniform.
	 * For the return type of this function, see the GLSL API.
	 * @param String name | The name of the uniform
	 * @return Any
	 */
	getUniform(name) {
		return this.program.getUniform(name);
	}
	getArgument(name) {
		return this.getUniform(name);
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