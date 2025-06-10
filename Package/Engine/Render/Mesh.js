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
 */

/**
 * Represents a 3D mesh composed of chunks with different materials. The following vertex attributes are supported:
 * <table>
 * 	<tr><th>Attribute Name</th><th>Meaning</th><th>Type</th></tr>
 * 	<tr><td>`vertexPosition`</td><td>The model-space location of the vertex</td><td>Vector3</td></tr>
 * 	<tr><td>`vertexUV`</td><td>The UV texture coordinates of the vertex</td><td>Vector2</td></tr>
 * 	<tr><td>`vertexNormal`</td><td>The normalized normal vector of the vertex</td><td>Vector3</td></tr>
 * </table>
 * @prop String[] attributes | The vertex attributes present in the mesh's data. This value is read-only
 * @prop Float32Array data | The vertex data of the mesh, interleaved in the order specified by `.attributes`
 * @prop MeshChunk[] chunks | The chunks of the mesh, describing the layout of mesh's faces
 * @prop ArrayLike vertices | A list of each vertex in the vertex data. Each element of this array has a property for each attribute of the mesh. This property is synchronized with `.data`
 * @prop Number stride | The number of elements each vertex takes up in the data array. This value is read-only
 * @prop Map offsets | A map from attribute names to their offset into each vertex in the data array. This value is read-only
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
	 * Transforms the `vertexPosition` of the mesh in-place by a given matrix and flushes the changes.
	 * Returns the caller.
	 * @param Matrix4 transform | The homogenous transformation to apply to each vertex position
	 * @return Mesh
	 */
	transform(transform) {
		const offset = this.offsets.get("vertexPosition");
		const { data, stride } = this;
		for (let i = offset; i < data.length; i += stride) {
			const vec = new Vector3(data[i], data[i + 1], data[i + 2]);
			transform.times(vec, vec);
			data[i] = vec.x;
			data[i + 1] = vec.y;
			data[i + 2] = vec.z;
		}
		this.flush();
		return this;
	}
	/**
	 * Creates a Polyhedron that has the same shape as the mesh, using the `vertexPosition` attribute.
	 * @return Polyhedron
	 */
	toPolyhedron() {
		const { data, stride } = this;
		const vertices = [];
		for (let i = this.offsets.get("vertexPosition"); i < data.length; i += stride)
			vertices.push(new Vector3(
				data[i + 0],
				data[i + 1],
				data[i + 2]
			));
		
		const indices = this.chunks.flatMap(chunk => [...chunk.indices]);
		return new Polyhedron(vertices, indices);
	}
	/**
	 * Creates a new mesh from a Polyhedron.
	 * @param Polyhedron polyhedron | The object to use for the mesh
	 * @param Material material? | The material for the mesh. Default is `Material.DEFAULT`
	 * @param PolyhedronConversionSettings settings? | Conversion settings. Default is an empty object
	 * @return Mesh
	 */
	static fromPolyhedron(polyhedron, material = Material.DEFAULT, {
		smooth = false
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
			for (let i = 0; i < polyhedron.faceCount; i++) {
				const [a, b, c] = polyhedron.getFaceIndices(i);
				const { normal } = new Triangle(
					polyhedron.vertices[a],
					polyhedron.vertices[b],
					polyhedron.vertices[c]
				);
				vertexToNormals[a].push(normal);
				vertexToNormals[b].push(normal);
				vertexToNormals[c].push(normal);
			}

			vertexData = new Float32Array(polyhedron.vertices.length * stride);
			indexData = new Uint32Array(polyhedron.indices);

			for (let i = 0; i < polyhedron.vertices.length; i++) {
				const vertex = polyhedron.vertices[i];
				const normal = Vector3.avg(vertexToNormals[i]).normalize();
				setVertex(i, vertex, normal, Vector2.zero);
			}
		} else {	
			const uvs = [
				new Vector2(0, 0),
				new Vector2(1, 0),
				new Vector2(0, Math.sqrt(3) / 2)
			];
			
			const triangles = polyhedron.getFaces();
			
			vertexData = new Float32Array(triangles.length * stride * 3);
			indexData = new Uint32Array(triangles.length * 3).map((_, i) => i);

			for (let i = 0; i < triangles.length; i++) {
				const triangle = triangles[i];
				const { normal } = triangle;
				const baseIndex = i * 3;
				for (let j = 0; j < 3; j++) {
					const vertex = triangle[TRI_KEYS[j]];
					const index = baseIndex + j;
					setVertex(index, vertex, normal, uvs[j])
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

				const currentChunks = materialMap.get(material) ?? [];
				if (!materialMap.has(material))
					materialMap.set(material, []);
				
				for (let k = 0; k < indices.length; k++)
					currentChunks.push(indices[k] + startingVertexIndex);
			}

			const vertexCount = mesh.data.length / mesh.stride;
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
}
Mesh.ATTRIBUTES = {
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
	},
};

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

		this.renderData = new WeakMap();
	}
	/**
	 * Creates a deep copy of the mesh chunk.
	 * @return MeshChunk
	 */
	get() {
		return new MeshChunk(this.material, new Uint32Array(this.indices));
	}
}