/**
 * Represents an object that is able to store a subset of renderable mesh data.
 * @abstract
 */
class Renderable {
	static MAX_RENDERERS = 4;
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
}

/**
 * Represents a 3D mesh composed of chunks with different materials. The following vertex attributes are supported:
 * <table>
 * 	<tr><th>Attribute Name</th><th>Meaning</th><th>Type</th></tr>
 * 	<tr><td>`vertexPosition`</td><td>The world-space location of the vertex</td><td>Vector3</td></tr>
 * 	<tr><td>`vertexUV`</td><td>The UV texture coordinates of the vertex</td><td>Vector2</td></tr>
 * 	<tr><td>`vertexNormal`</td><td>The normalized normal vector of the vertex</td><td>Vector3</td></tr>
 * </table>
 * `"vertexPosition"`, `"vertexUV"`, and `"vertexNormal"`
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

		this.stride = 0;
		this.offsets = new Map();
		for (let i = 0; i < attributes.length; i++) {
			const attr = attributes[i];
			this.offsets.set(attr, this.stride);
			this.stride += ATTRIBUTES[attr].size;
		}

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
	 * Creates a new mesh from a polyhedron.
	 * @param Polyhedron polyhedron | The object to use for the mesh
	 * @param Material material? | The material for the mesh. Default is `Material.DEFAULT` 
	 * @return Mesh
	 */
	static fromPolyhedron(polyhedron, material = Material.DEFAULT) {
		const TRI_KEYS = ["a", "b", "c"];
		const PER_VERTEX = 8;
		const PER_TRIANGLE = PER_VERTEX * 3;

		const uvs = [
			[0, 0],
			[1, 0],
			[0, Math.sqrt(3) / 2]
		];
		
		const triangles = polyhedron.getFaces();
		const vertexData = new Float32Array(triangles.length * PER_TRIANGLE);
		for (let i = 0; i < triangles.length; i++) {
			const triangle = triangles[i];
			const { normal } = triangle;
			const baseIndex = i * PER_TRIANGLE;
			for (let j = 0; j < 3; j++) {
				const vertex = triangle[TRI_KEYS[j]];
				const inx = baseIndex + j * PER_VERTEX;
				vertexData[inx + 0] = vertex.x;
				vertexData[inx + 1] = vertex.y;
				vertexData[inx + 2] = vertex.z;
				vertexData[inx + 3] = normal.x;
				vertexData[inx + 4] = normal.y;
				vertexData[inx + 5] = normal.z;
				vertexData[inx + 6] = uvs[j][0];
				vertexData[inx + 7] = uvs[j][1];
			}
		}
		const indexData = new Uint32Array(triangles.length * 3).map((_, i) => i);
		return new Mesh(
			["vertexPosition", "vertexNormal", "vertexUV"], vertexData,
			[new MeshChunk(material, indexData)]
		);
	}
}
Mesh.ATTRIBUTES = {
	vertexPosition: {
		size: 3,
		type: Vector3
	},
	vertexUV: {
		size: 2,
		type: Vector2
	},
	vertexNormal: {
		size: 3,
		type: Vector3
	}
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
}