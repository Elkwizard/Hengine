/**
 * Represents an object that is able to store a subset of renderable mesh data.
 * @abstract
 */
class Renderable {
	constructor() {
		this.renderers = [];
		this.rendererSet = new WeakSet();
	}
	cleanRenderers() {
		this.renderers = this.renderers.filter(renderer => renderer.deref());
	}
	leaveRenderer(renderer) {
		renderer.renderCache.delete(this);
		this.rendererSet.delete(renderer);
	}
	addRenderer(renderer) {
		if (this.rendererSet.has(renderer)) return;
		
		this.cleanRenderers();
		this.rendererSet.add(renderer);
		this.renderers.push(new WeakRef(renderer));
		if (this.renderers.length > Renderable.MAX_RENDERERS)
			this.leaveRenderer(this.renderers.shift().deref());
	}
	/**
	 * Pushes post-construction vertex updates to the GPU for rendering.
	 * This function must be called before updates will be visible in rendering. 
	 */
	flush() {
		for (let i = 0; i < this.renderers.length; i++) {
			const renderer = this.renderers[i].deref();
			if (renderer)
				this.leaveRenderer(renderer);
		}
		this.renderers = [];
	}
	
	static MAX_RENDERERS = 4;
}

/**
 * @name class PolyhedronConversionSettings
 * @interface
 * This is an interface representing how a Polyhedron should be converted into a mesh.
 * This is not a class, but rather describes the structure of an object that must be used in certain cases.
 * @prop Boolean smooth? | Whether the normals should be smoothed across vertices. Default is false
 * @prop Number smoothLimit? | The minimum dot product between normals of adjacent faces required for them to be smoothed together. This has no effect is `.smooth` is false. Default is 0 (faces beyond perpendicular aren't smoothed)
 * @prop Vector2[] uvs? | A list of texture coordinates in one-to-one correspondence with the vertices of the Polyhedron. Cannot be specified if `.computeUV` is specified. By default the same UVs will be given to each triangle
 * @prop (Vector3, Vector3) => Vector2 computeUV? | A function to compute the UV coordinates for each vertex, which will recieve the vertex and normal vector as arguments. Cannot be specified if `.smooth` is true. If not specified, either `.uvs` or default UVs will be used
 */

/**
 * Represents a 3D mesh composed of chunks with different materials. The following vertex attributes are supported:
 * <table>
 * 	<tr><th>Attribute Name</th><th>Meaning</th><th>Type</th></tr>
 * 	<tr><td>`vertexPosition`</td><td>The model-space location of the vertex</td><td>Vector3</td></tr>
 * 	<tr><td>`vertexUV`</td><td>The UV texture coordinates of the vertex</td><td>Vector2</td></tr>
 * 	<tr><td>`vertexNormal`</td><td>The normalized normal vector of the vertex</td><td>Vector3</td></tr>
 * </table>
 * @prop<immutable> String[] attributes | The vertex attributes present in the mesh's data
 * @prop Float32Array data | The vertex data of the mesh, interleaved in the order specified by `.attributes`
 * @prop MeshChunk[] chunks | The chunks of the mesh, describing the layout of mesh's faces
 * @prop ArrayLike vertices | A list of each vertex in the vertex data. Each element of this array has a property for each attribute of the mesh. This property is synchronized with `.data`
 * @prop<immutable> Number stride | The number of elements each vertex takes up in the data array
 * @prop<immutable> Map offsets | A map from attribute names to their offset into each vertex in the data array
 */
class Mesh extends Renderable {
	/**
	 * Creates a new mesh.
	 * @param String[] attributes | The vertex attributes in the mesh data
	 * @param Float32Array/ArrayLike data | The vertex data of the mesh, either as a float buffer or a list of vertex objects
	 * @param MeshChunk[] chunks | The chunks of the mesh
	 */
	constructor(attributes, data, chunks) {
		super();
		this.attributes = attributes;
		this.data = data instanceof Float32Array ? data : new Float32Array();
		this.chunks = chunks;

		const { ATTRIBUTES } = Mesh;

		const { stride, offsets } = Mesh.layoutAttributes(attributes);
		this.stride = stride;
		this.offsets = offsets;

		// add proxy interface
		objectUtils.proxyBuffer(this, "data", "vertices", this.stride, inx => {
			const result = { };
			for (let i = 0; i < attributes.length; i++) {
				const attr = attributes[i];
				const { type, size } = ATTRIBUTES[attr];
				const base = inx + this.offsets.get(attr);
				type.defineReference(result, attr).proxy(
					this.data, Array.dim(size).map((_, i) => i + base)
				);
			}
			return result;
		}, (inx, value) => {
			const vertex = this.vertices[inx / this.stride];
			for (let i = 0; i < attributes.length; i++) {
				const attr = attributes[i];
				vertex[attr] = value[attr];
			}
		});

		if (data.length && !this.data.length)
			this.vertices = data;
	}
	/**
	 * Creates a deep copy of the mesh.
	 * @return Mesh
	 */
	get() {
		return new Mesh(this.attributes, new Float32Array(this.data), this.chunks.map(chunk => chunk.get()));
	}
	/**
	 * Returns the smallest Prism that contains all the `vertexPosition`s of the mesh.
	 * @return Prism
	 */
	getBoundingBox() {
		const offset = this.offsets.get("vertexPosition");
		const { stride, data } = this;

		const min = Vector3.filled(Infinity);
		const max = Vector3.filled(-Infinity);
		
		for (let i = offset; i < data.length; i += stride) {
			const x = data[i + 0];
			const y = data[i + 1];
			const z = data[i + 2];
			
			if (x < min.x) min.x = x;
			if (x > max.x) max.x = x;
			if (y < min.y) min.y = y;
			if (y > max.y) max.y = y;
			if (z < min.z) min.z = z;
			if (z > max.z) max.z = z;
		}

		return new Prism(min, max);
	}
	/**
	 * Returns a small Sphere that contains all the `vertexPosition`s of the mesh.
	 * @return Sphere
	 */
	getBoundingBall() {
		const { middle } = this.getBoundingBox();

		const offset = this.offsets.get("vertexPosition");
		const { stride, data } = this;

		let maxRadius = 0;
		for (let i = offset; i < data.length; i += stride) {
			const x = data[i + 0] - middle.x;
			const y = data[i + 1] - middle.y;
			const z = data[i + 2] - middle.z;

			const radius = x ** 2 + y ** 2 + z ** 2;
			if (radius > maxRadius) maxRadius = radius;
		}

		return new Sphere(middle, Math.sqrt(maxRadius));
	}
	/**
	 * Transforms the `vertexPosition` of the mesh in-place by a given matrix and flushes the changes.
	 * Returns the caller.
	 * @param Matrix4 transform | The homogenous transformation to apply to each vertex position
	 * @return Mesh
	 */
	transform(transform) {
		const { data, stride } = this;
		
		if (this.offsets.has("vertexPosition")) {
			const offset = this.offsets.get("vertexPosition");
			const [
				a, d, g, _0,
				b, e, h, _1,
				c, f, i, _2,
				tx, ty, tz
			] = transform;
	
			for (let n = offset; n < data.length; n += stride) {
				const x = data[n + 0];
				const y = data[n + 1];
				const z = data[n + 2];
				data[n + 0] = x * a + y * b + z * c + tx;
				data[n + 1] = x * d + y * e + z * f + ty;
				data[n + 2] = x * g + y * h + z * i + tz;
			}
		}

		if (this.offsets.has("vertexNormal")) {
			const offset = this.offsets.get("vertexNormal");
			const [
				a, d, g,
				b, e, h,
				c, f, i
			] = Matrix3.normal(transform);

			for (let n = offset; n < data.length; n += stride) {
				const x = data[n + 0];
				const y = data[n + 1];
				const z = data[n + 2];
				data[n + 0] = x * a + y * b + z * c;
				data[n + 1] = x * d + y * e + z * f;
				data[n + 2] = x * g + y * h + z * i;
			}
		}

		this.flush();
		return this;
	}
	/**
	 * Creates a Polyhedron that has the same shape as the mesh, using the `vertexPosition` attribute.
	 * @param MeshChunk[] chunks? | The chunks to create the polyhedron from. This must be a subset of the `.chunks` property. Default is all chunks
	 * @param Boolean lazy? | Whether the Polyhedron should be constructed lazily. See the `lazy` parameter to the Polyhedron constructor. Default is false
	 * @return Polyhedron
	 */
	toPolyhedron(chunks = this.chunks, lazy = false) {
		const { data, stride } = this;
		const indices = chunks.flatMap(chunk => [...chunk.indices]);
		const indexSet = new Set(indices);
		const vertices = [];
		const indexMap = new Map();

		for (let pointer = this.offsets.get("vertexPosition"), i = 0; pointer < data.length; pointer += stride, i++) {
			if (indexSet.has(i)) {
				indexMap.set(i, vertices.length);
				vertices.push(new Vector3(
					data[pointer + 0],
					data[pointer + 1],
					data[pointer + 2]
				));
			}
		}
		
		const mappedIndices = indices.map(index => indexMap.get(index));

		return new Polyhedron(vertices, mappedIndices, lazy);
	}
	/**
	 * Downloads the mesh as an `.obj` file, without materials.
	 * @param String name | The pre-extension part of the downloaded file's name
	 */
	download(name) {
		const lines = [];

		const { data, stride } = this;

		const exportAttribute = (name, objName) => {
			const offset = this.offsets.get(name);
			if (offset === null) return false;
			const { size } = Mesh.ATTRIBUTES[name];

			for (let i = offset; i < data.length; i += stride) {
				let line = objName;
				for (let j = 0; j < size; j++)
					line += ` ${data[i + j]}`;
				lines.push(line);
			}

			return true;
		};
		
		const hasPosition = exportAttribute("vertexPosition", "v");
		const hasNormal = exportAttribute("vertexNormal", "vn");
		const hasUV = exportAttribute("vertexUV", "vt");

		const vertexEncodings = Array.dim(data.length / stride).map((_, i) => {
			i++;
			let result = "";
			if (hasPosition) result += i;
			result += "/";
			if (hasNormal) result += i;
			result += "/";
			if (hasUV) result += i;
			return result;
		});

		for (let i = 0; i < this.chunks.length; i++) {
			lines.push(`g chunk_${i}`);
			const { indices } = this.chunks[i];
			for (let j = 0; j < indices.length; j += 3) {
				const a = vertexEncodings[indices[j + 0]];
				const b = vertexEncodings[indices[j + 1]];
				const c = vertexEncodings[indices[j + 2]];
				lines.push(`f ${a} ${b} ${c}`);
			}
		}

		return lines.join("\n").download(name, "obj");
	}
	/**
	 * Creates a new mesh from a Shape3D, inferring many settings to produce generally acceptable results.
	 * @param Shape3D shape | The shape to create a mesh for
	 * @param Material material? | The material to use for the mesh. Default is `Material.DEFAULT`
	 * @param Number resolution? | An relevant amount of vertices to use. Default is 8 
	 * @return Mesh
	 */
	static fromShape(shape, material = Material.DEFAULT, resolution = 8) {
		let smooth = false;
		if (!(shape instanceof Polyhedron)) {
			switch (shape.constructor) {
				case Sphere: {
					shape = Polyhedron.fromSphere(shape, resolution);
					smooth = true;
				} break;
				case Capsule: {
					shape = Polyhedron.fromCapsule(shape, resolution);
					smooth = true;
				} break;
			}
		}
			
		return Mesh.fromPolyhedron(shape, material, { smooth });
	}
	/**
	 * Creates a new mesh from a Polyhedron.
	 * @param Polyhedron polyhedron | The object to use for the mesh
	 * @param Material material? | The material for the mesh. Default is `Material.DEFAULT`
	 * @param PolyhedronConversionSettings settings? | Conversion settings. Default is an empty object
	 * @return Mesh
	 */
	static fromPolyhedron(polyhedron, material = Material.DEFAULT, {
		smooth = false,
		smoothLimit = 0,
		uvs = null,
		computeUV = null
	} = { }) {
		const TRI_KEYS = ["a", "b", "c"];

		const attributes = ["vertexPosition", "vertexNormal", "vertexUV"];
		const { stride } = Mesh.layoutAttributes(attributes);

		let vertexData, indexData;

		const setVertex = (index, vertex, normal, uv) => {
			index *= stride;
			vertexData[index + 0] = vertex.x;
			vertexData[index + 1] = vertex.y;
			vertexData[index + 2] = vertex.z;
			vertexData[index + 3] = normal.x;
			vertexData[index + 4] = normal.y;
			vertexData[index + 5] = normal.z;
			vertexData[index + 6] = uv.x;
			vertexData[index + 7] = uv.y;
		};

		if (smooth) {
			const vertexToNormals = Array.dim(polyhedron.vertices.length).map(() => []);
			const faceData = Array.dim(polyhedron.faceCount).map((_, i) => {
				const [a, b, c] = polyhedron.getFaceIndices(i);
				const { normal } = polyhedron.getFace(i);
				return { a, b, c, normal };
			});
			for (let i = 0; i < faceData.length; i++) {
				const { a, b, c, normal } = faceData[i];
				vertexToNormals[a].push(normal);
				vertexToNormals[b].push(normal);
				vertexToNormals[c].push(normal);
			}

			const vertexToIndex = new Map();
			vertexData = [];
			let nextVertexIndex = 0;

			const guaranteeVertex = (index, faceNormal) => {
				const normals = vertexToNormals[index];
				const matchingNormals = normals.filter(normal => normal.dot(faceNormal) > smoothLimit);
				const vertexNormal = Vector3.avg(matchingNormals).normalized;

				if (matchingNormals.length === normals.length) {
					if (vertexToIndex.has(index)) return vertexToIndex.get(index);
					vertexToIndex.set(index, nextVertexIndex);
				}

				const thisIndex = nextVertexIndex;
				setVertex(thisIndex, polyhedron.vertices[index], vertexNormal, Vector2.zero);

				nextVertexIndex++;

				return thisIndex;
			};

			indexData = new Uint32Array(polyhedron.indices);

			for (let i = 0; i < polyhedron.faceCount; i++) {
				const { a, b, c, normal } = faceData[i];
				const start = i * 3;
				indexData[start + 0] = guaranteeVertex(a, normal);
				indexData[start + 1] = guaranteeVertex(b, normal);
				indexData[start + 2] = guaranteeVertex(c, normal);
			}

			vertexData = new Float32Array(vertexData);
		} else {	
			const defaultUVs = [
				new Vector2(0, 0),
				new Vector2(1, 0),
				new Vector2(0, 1)
			];

			const { vertices, indices } = polyhedron;
			
			vertexData = new Float32Array(polyhedron.faceCount * stride * 3);
			indexData = new Uint32Array(polyhedron.faceCount * 3).map((_, i) => i);

			for (let i = 0; i < indices.length; i += 3) {
				const triangleIndices = indices.slice(i, i + 3);
				const triangle = new Triangle(
					vertices[triangleIndices[0]],
					vertices[triangleIndices[1]],
					vertices[triangleIndices[2]]
				);
				const { normal } = triangle;
				for (let j = 0; j < 3; j++) {
					const vertex = triangle[TRI_KEYS[j]];
					let uv;
					if (computeUV) {
						uv = computeUV(vertex, normal);
					} else if (uvs) {
						uv = uvs[triangleIndices[j]];
					} else {
						uv = defaultUVs[j];
					}
					setVertex(i + j, vertex, normal, uv);
				}
			}
		}
		
		return new Mesh(attributes, vertexData, [new MeshChunk(material, indexData)]);
	}
	/**
	 * Creates a new mesh containing all the pieces of a collection of meshes
	 * @param Mesh[] meshes | The meshes to combine
	 * @return Mesh
	 */
	static merge(meshes) {
		const { ATTRIBUTES } = Mesh;

		const attributes = Object.keys(ATTRIBUTES)
			.filter(attr => meshes.every(mesh => mesh.attributes.includes(attr)));
		
		const { stride, offsets } = Mesh.layoutAttributes(attributes);

		const totalVertexData = meshes
			.map(mesh => mesh.data.length / mesh.stride * stride)
			.reduce((a, b) => a + b, 0);
		
		const vertexData = new Float32Array(totalVertexData);
		
		let startingVertexIndex = 0;

		const materialMap = new Map();

		for (let i = 0; i < meshes.length; i++) {
			const mesh = meshes[i];

			for (let j = 0; j < mesh.chunks.length; j++) {
				const { material, indices } = mesh.chunks[j];

				if (!materialMap.has(material))
					materialMap.set(material, []);
				
				const currentChunks = materialMap.get(material);
				
				for (let k = 0; k < indices.length; k++)
					currentChunks.push(indices[k] + startingVertexIndex);
			}

			const vertexCount = mesh.data.length / mesh.stride;
			
			const sameLayout =	mesh.attributes.length === attributes.length &&
								mesh.attributes.every((attr, i) => attr === attributes[i]);

			if (sameLayout) { // exact layout match
				vertexData.set(mesh.data, startingVertexIndex * stride);
			} else { // mismatch
				for (let j = 0; j < attributes.length; j++) {
					const attr = attributes[j];
					const { size } = ATTRIBUTES[attr];
	
					let destinationIndex = startingVertexIndex * stride + offsets.get(attr);
					let sourceIndex = mesh.offsets.get(attr);
	
					for (let k = 0; k < vertexCount; k++) {
						for (let l = 0; l < size; l++) {
							vertexData[destinationIndex + l] = mesh.data[sourceIndex + l];
						}
	
						destinationIndex += stride;
						sourceIndex += mesh.stride;
					}
				}
			}


			startingVertexIndex += vertexCount;
		}

		const chunks = [];
		for (const [material, indices] of materialMap)
			chunks.push(new MeshChunk(material, new Uint32Array(indices)));

		return new Mesh(attributes, vertexData, chunks);
	}
	static layoutAttributes(attributes) {
		let stride = 0;
		const offsets = new Map();
		for (let i = 0; i < attributes.length; i++) {
			const attr = attributes[i];
			offsets.set(attr, stride);
			stride += Mesh.ATTRIBUTES[attr].size;
		}
		return { stride, offsets };
	}

	static ATTRIBUTES = {
		vertexPosition: {
			size: 3,
			type: Vector3
		},
		vertexNormal: {
			size: 3,
			type: Vector3
		},
		vertexUV: {
			size: 2,
			type: Vector2
		}
	};
}

/**
 * Represents the faces of a piece of a 3D Mesh with a single material.
 * @prop Material material | The material of the chunk
 * @prop Uint32Array indices | The index buffer for the chunk. Every 3 consecutive elements of this array represent a triangular face of the mesh, where the each element is an index into the vertices of the mesh
 * @prop ArrayLike faces | A list of the faces of the chunk, as 3-length arrays of numbers. This property is synchronized with `.indices`
 */
class MeshChunk extends Renderable {
	/**
	 * Creates a new mesh chunk.
	 * @param Material material | The material for the chunk
	 * @param Uint32Array/ArrayLike faces | A list of 3-length arrays of numbers or an int buffer, representing the triangles of the chunk
	 */
	constructor(material, faces = new Uint32Array()) {
		super();
		this.material = material;
		this.indices = faces instanceof Uint32Array ? faces : new Uint32Array();

		const stride = 3;
		objectUtils.proxyBuffer(this, "indices", "faces", stride, inx => {
			const result = [];
			for (let i = 0; i < stride; i++) {
				const index = inx + i;
				Object.defineProperty(result, i, {
					get: () => this.indices[index],
					set: value => this.indices[index] = value
				});
			}
			return result;
		}, (inx, value) => {
			this.indices.set(value, inx);
		});

		if (faces.length && !this.indices.length)
			this.faces = faces;
	}
	/**
	 * Creates a deep copy of the mesh chunk.
	 * @return MeshChunk
	 */
	get() {
		return new MeshChunk(this.material, new Uint32Array(this.indices));
	}
}