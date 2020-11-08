class Tri {
    constructor(a, b, c, color = Color.WHITE) {
        this.vertices = [a, b, c];
        this.color = color;
        this.middle = new Vector3((a.x + b.x + c.x) / 3, (a.y + b.y + c.y) / 3, (a.z + b.z + c.z) / 3);
    }
    get() {
        return new Tri(...this.vertices, this.color);
    }
}

class Mesh {
    constructor(tris) {
        this.tris = tris;
        this.middle = Vector3.origin;
        if (tris.length) this.middle = Vector3.sum(tris.map(tri => tri.middle)).div(tris.length);
        this.vertexCount = this.tris.length * 3;
        this.positionBuffer = null;
        this.indexBuffer = null;
        this.resetTransform();
    }
    resetTransform() {
        this.transform = Matrix4.identity();
        this.normalTransform = Matrix4.identity();
    }
    rotate(r, v = this.middle) {
        this.transform = Matrix4.mulMatrix(
            this.transform,
            Matrix4.mulMatrix(
                Matrix4.translation(-v.x, -v.y, -v.z),
                Matrix4.mulMatrix(
                    Matrix4.glRotation(r.x, r.y, r.z),
                    Matrix4.translation(v.x, v.y, v.z)
                )
            )
        );
        this.normalTransform = Matrix4.mulMatrix(this.normalTransform, Matrix4.glRotation(r.x, r.y, r.z));
    }
    translate(o) {
        this.transform = Matrix4.mulMatrix(
            this.transform,
            Matrix4.translation(o.x, o.y, o.z)
        );
    }
    scale(s, v = this.middle) {
        this.transform = Matrix4.mulMatrix(
            this.transform,
            Matrix4.mulMatrix(
                Matrix4.translation(v.x, v.y, v.z),
                Matrix4.mulMatrix(
                    Matrix4.scale(s.x, s.y, s.z),
                    Matrix4.translation(-v.x, -v.y, -v.z)
                )
            )
        );
    }
    color(col) {
        for (let i = 0; i < this.tris.length; i++) this.tris[i].color = col;
    }
    get() {
        return new Mesh(this.tris.map(tri => tri.get()));
    }
    process(renderer) {
        const { c: gl, shaderProgram, shadeSmooth } = renderer;

        //vertex positions & indices

        const indices = [];
        const positions = [];
        if (shadeSmooth) {
            let currentIndex = 0;
            let vertexMap = {};
            for (let i = 0; i < this.tris.length; i++) {
                let v = this.tris[i].vertices;
                for (let j = 0; j < v.length; j++) {
                    let key = v[j].toString();
                    if (!(key in vertexMap)) {
                        vertexMap[key] = currentIndex++;
                        positions.push(v[j].x, v[j].y, v[j].z);
                    }
                }
            }
            for (let i = 0; i < this.tris.length; i++) {
                let v = this.tris[i].vertices;
                for (let j = 0; j < v.length; j++) indices.push(vertexMap[v[j]]);
            }
        } else {
            for (let i = 0; i < this.tris.length; i++) {
                const v = this.tris[i].vertices;
                positions.push(
                    v[0].x, v[0].y, v[0].z,
                    v[1].x, v[1].y, v[1].z,
                    v[2].x, v[2].y, v[2].z
                );
            }
            for (let i = 0; i < positions.length / 3; i++) indices.push(i);
        }

        let vertexCount = indices.length;

        //vertex normals & colors
        const indexNormals = [];
        for (let i = 0; i < vertexCount; i += 3) {
            let ax = positions[indices[i + 0] * 3 + 0];
            let ay = positions[indices[i + 0] * 3 + 1];
            let az = positions[indices[i + 0] * 3 + 2];
            let bx = positions[indices[i + 1] * 3 + 0];
            let by = positions[indices[i + 1] * 3 + 1];
            let bz = positions[indices[i + 1] * 3 + 2];
            let cx = positions[indices[i + 2] * 3 + 0];
            let cy = positions[indices[i + 2] * 3 + 1];
            let cz = positions[indices[i + 2] * 3 + 2];
            let ux = bx - ax;
            let uy = by - ay;
            let uz = bz - az;
            let vx = bx - cx;
            let vy = by - cy;
            let vz = bz - cz;
            let nx = uy * vz - uz * vy;
            let ny = uz * vx - ux * vz;
            let nz = ux * vy - uy * vx;
            let m = Math.sqrt(nx * nx + ny * ny + nz * nz);
            let x = nx / m;
            let y = ny / m;
            let z = nz / m;
            indexNormals.push(x, y, z);
        }
        let normals = [];
        for (let i = 0; i < positions.length; i++) normals.push(0);
        for (let i = 0; i < vertexCount; i++) {
            let inx = indices[i] * 3;
            let inx2 = Math.floor(i / 3) * 3;
            normals[inx + 0] += indexNormals[inx2 + 0];
            normals[inx + 1] += indexNormals[inx2 + 1];
            normals[inx + 2] += indexNormals[inx2 + 2];
        }
        if (shadeSmooth) for (let i = 0; i < normals.length; i += 3) {
            let x = normals[i + 0];
            let y = normals[i + 1];
            let z = normals[i + 2];
            let m = Math.sqrt(x * x + y * y + z * z);
            normals[i + 0] = x / m;
            normals[i + 1] = y / m;
            normals[i + 2] = z / m;
        }

        //vertex colors
        let amountColorChannels = (positions.length / 3) * 4;
        let indexColors = [];
        let indexColorOverloads = [];
        for (let i = 0; i < amountColorChannels; i++) indexColors.push(0);
        for (let i = 0; i < positions.length / 3; i++) indexColorOverloads.push(0);
        for (let i = 0; i < this.tris.length; i++) {
            let { red, green, blue, alpha } = this.tris[i].color;
            red = Number.clamp(red / 255, 0, 1);
            green = Number.clamp(green / 255, 0, 1);
            blue = Number.clamp(blue / 255, 0, 1);
            alpha = Number.clamp(alpha, 0, 1);

            let i0 = indices[i * 3 + 0] * 4 + 0,
                i1 = indices[i * 3 + 0] * 4 + 1,
                i2 = indices[i * 3 + 0] * 4 + 2,
                i3 = indices[i * 3 + 0] * 4 + 3,
                i4 = indices[i * 3 + 1] * 4 + 0,
                i5 = indices[i * 3 + 1] * 4 + 1,
                i6 = indices[i * 3 + 1] * 4 + 2,
                i7 = indices[i * 3 + 1] * 4 + 3,
                i8 = indices[i * 3 + 2] * 4 + 0,
                i9 = indices[i * 3 + 2] * 4 + 1,
                i10 = indices[i * 3 + 2] * 4 + 2,
                i11 = indices[i * 3 + 2] * 4 + 3;

            //vertex 1
            indexColors[i0] += red;
            indexColors[i1] += green;
            indexColors[i2] += blue;
            indexColors[i3] += alpha;
            indexColors[i4] += red;
            indexColors[i5] += green;
            indexColors[i6] += blue;
            indexColors[i7] += alpha;
            indexColors[i8] += red;
            indexColors[i9] += green;
            indexColors[i10] += blue;
            indexColors[i11] += alpha;

            indexColorOverloads[i0 / 4]++;
            indexColorOverloads[i4 / 4]++;
            indexColorOverloads[i8 / 4]++;
        }
        const colors = [];
        for (let i = 0; i < amountColorChannels; i++) colors.push(indexColors[i] / indexColorOverloads[Math.floor(i / 4)]);



        //buffers
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int32Array(indices), gl.STATIC_DRAW);

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        const normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

        //attributes

        //vertex positions
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        let vertexPositionPointer = gl.getAttribLocation(shaderProgram, "vertexPosition");
        gl.vertexAttribPointer(vertexPositionPointer, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vertexPositionPointer);

        //vertex normals
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        let vertexNormalPointer = gl.getAttribLocation(shaderProgram, "vertexNormal");
        gl.vertexAttribPointer(vertexNormalPointer, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vertexNormalPointer);

        //vertex colors
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        let vertexColorPointer = gl.getAttribLocation(shaderProgram, "vertexColor");
        gl.vertexAttribPointer(vertexColorPointer, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vertexColorPointer);

        this.positionBuffer = positionBuffer;
        this.vertexCount = vertexCount;
        this.indexBuffer = indexBuffer;

    }
    static subdivide(mesh, sub) {
        let curTris = mesh.tris;
        let tris = [];
        for (let s = 0; s < sub; s++) {
            for (let i = 0; i < curTris.length; i++) {
                let t = curTris[i].get();

                const A = t.vertices[0];
                const B = t.vertices[1];
                const C = t.vertices[2];

                const AB = A.plus(B).over(2);
                const BC = B.plus(C).over(2);
                const CA = C.plus(A).over(2);

                let ts = [
                    new Tri(AB, B, BC),
                    new Tri(BC, C, CA),
                    new Tri(CA, A, AB),
                    new Tri(CA, AB, BC)
                ];
                for (let tri of ts) tri.color = t.color;

                tris.push(...ts);
            }
            curTris = tris;
            tris = [];
        }
        return new Mesh(curTris);
    }
    static combine(meshes) {
        let tris = [];
        for (let i = 0; i < meshes.length; i++) tris.pushArray(meshes[i].tris);
        return new Mesh(tris);
    }
    static plane(x, y, z, w, d, color = Color.WHITE) {
        let mesh = new Mesh([
            new Tri(new Vector3(x - w / 2, y, z - d / 2), new Vector3(x - w / 2, y, z + d / 2), new Vector3(x + w / 2, y, z - d / 2)),
            new Tri(new Vector3(x + w / 2, y, z - d / 2), new Vector3(x - w / 2, y, z + d / 2), new Vector3(x + w / 2, y, z + d / 2)),
            new Tri(new Vector3(x + w / 2, y, z - d / 2), new Vector3(x - w / 2, y, z + d / 2), new Vector3(x - w / 2, y, z - d / 2)),
            new Tri(new Vector3(x + w / 2, y, z + d / 2), new Vector3(x - w / 2, y, z + d / 2), new Vector3(x + w / 2, y, z - d / 2))
        ]);
        mesh.color(color);
        return mesh;
    }
    static prism(x, y, z, w, h, d, color = Color.WHITE) {
        let mesh = new Mesh([
            new Tri(new Vector3(x + w / 2, y + h / 2, z - d / 2), new Vector3(x + w / 2, y - h / 2, z - d / 2), new Vector3(x - w / 2, y - h / 2, z - d / 2)),
            new Tri(new Vector3(x - w / 2, y - h / 2, z - d / 2), new Vector3(x - w / 2, y + h / 2, z - d / 2), new Vector3(x + w / 2, y + h / 2, z - d / 2)),
            new Tri(new Vector3(x - w / 2, y + h / 2, z - d / 2), new Vector3(x - w / 2, y - h / 2, z - d / 2), new Vector3(x - w / 2, y - h / 2, z + d / 2)),
            new Tri(new Vector3(x - w / 2, y + h / 2, z + d / 2), new Vector3(x - w / 2, y + h / 2, z - d / 2), new Vector3(x - w / 2, y - h / 2, z + d / 2)),
            new Tri(new Vector3(x - w / 2, y - h / 2, z - d / 2), new Vector3(x + w / 2, y - h / 2, z - d / 2), new Vector3(x - w / 2, y - h / 2, z + d / 2)),
            new Tri(new Vector3(x + w / 2, y - h / 2, z - d / 2), new Vector3(x + w / 2, y - h / 2, z + d / 2), new Vector3(x - w / 2, y - h / 2, z + d / 2)),
            new Tri(new Vector3(x + w / 2, y + h / 2, z - d / 2), new Vector3(x + w / 2, y - h / 2, z + d / 2), new Vector3(x + w / 2, y - h / 2, z - d / 2)),
            new Tri(new Vector3(x + w / 2, y + h / 2, z - d / 2), new Vector3(x + w / 2, y + h / 2, z + d / 2), new Vector3(x + w / 2, y - h / 2, z + d / 2)),
            new Tri(new Vector3(x + w / 2, y + h / 2, z - d / 2), new Vector3(x - w / 2, y + h / 2, z - d / 2), new Vector3(x - w / 2, y + h / 2, z + d / 2)),
            new Tri(new Vector3(x - w / 2, y + h / 2, z + d / 2), new Vector3(x + w / 2, y + h / 2, z + d / 2), new Vector3(x + w / 2, y + h / 2, z - d / 2)),
            new Tri(new Vector3(x + w / 2, y + h / 2, z + d / 2), new Vector3(x - w / 2, y - h / 2, z + d / 2), new Vector3(x + w / 2, y - h / 2, z + d / 2)),
            new Tri(new Vector3(x + w / 2, y + h / 2, z + d / 2), new Vector3(x - w / 2, y + h / 2, z + d / 2), new Vector3(x - w / 2, y - h / 2, z + d / 2))
        ]);
        mesh.color(color);
        return mesh;
    }
    static octahedron(x, y, z, w, h, d, color = Color.WHITE) {
        let mesh = new Mesh([
            new Tri(new Vector3(x, y - h / 2, z), new Vector3(x - w / 2, y, z - d / 2), new Vector3(x + w / 2, y, z - d / 2)),
            new Tri(new Vector3(x, y + h / 2, z), new Vector3(x + w / 2, y, z - d / 2), new Vector3(x - w / 2, y, z - d / 2)),
            new Tri(new Vector3(x, y - h / 2, z), new Vector3(x + w / 2, y, z - w / 2), new Vector3(x + w / 2, y, z + w / 2)),
            new Tri(new Vector3(x, y + h / 2, z), new Vector3(x + w / 2, y, z + w / 2), new Vector3(x + w / 2, y, z - w / 2)),
            new Tri(new Vector3(x, y - h / 2, z), new Vector3(x + w / 2, y, z + d / 2), new Vector3(x - w / 2, y, z + d / 2)),
            new Tri(new Vector3(x, y + h / 2, z), new Vector3(x - w / 2, y, z + d / 2), new Vector3(x + w / 2, y, z + d / 2)),
            new Tri(new Vector3(x, y - h / 2, z), new Vector3(x - w / 2, y, z + w / 2), new Vector3(x - w / 2, y, z - w / 2)),
            new Tri(new Vector3(x, y + h / 2, z), new Vector3(x - w / 2, y, z - w / 2), new Vector3(x - w / 2, y, z + w / 2)),
        ]);
        mesh.color(color);
        return mesh;
    }
    static hexahedron(x, y, z, w, h, d, color = Color.WHITE) {
        let rx = Math.sqrt(3) / 2;
        let rz = 1 / 2;
        let mesh = new Mesh([
            new Tri(new Vector3(x, y - h / 2, z), new Vector3(x - rx * w / 2, y, z - rz * d / 2), new Vector3(x + rx * w / 2, y, z - rz * d / 2)),
            new Tri(new Vector3(x, y - h / 2, z), new Vector3(x + rx * w / 2, y, z - rz * d / 2), new Vector3(x, y, z + d / 2)),
            new Tri(new Vector3(x, y - h / 2, z), new Vector3(x, y, z + d / 2), new Vector3(x - rx * w / 2, y, z - rz * d / 2)),

            new Tri(new Vector3(x, y + h / 2, z), new Vector3(x + rx * w / 2, y, z - rz * d / 2), new Vector3(x - rx * w / 2, y, z - rz * d / 2)),
            new Tri(new Vector3(x, y + h / 2, z), new Vector3(x - rx * w / 2, y, z - rz * d / 2), new Vector3(x, y, z + d / 2)),
            new Tri(new Vector3(x, y + h / 2, z), new Vector3(x, y, z + d / 2), new Vector3(x + rx * w / 2, y, z - rz * d / 2)),
        ]);
        mesh.color(color);
        return mesh;
    }
    static sphere(x, y, z, r, color = Color.WHITE, subdivisions = 3) {
        let m = Mesh.hexahedron(x, y, z, r * 2, r * 2, r * 2, color);
        m = Mesh.subdivide(m, subdivisions);
        return Mesh.inflate(m);
    }
    static inflate(mesh, r) {
        let tris = [];
        for (let i = 0; i < mesh.tris.length; i++) {
            const v = mesh.tris[i].vertices;
            const v2 = [];
            for (let i = 0; i < v.length; i++) {
                let nv = v[i].minus(mesh.middle);
                nv.mag = r;
                nv.add(mesh.middle);
                v2.push(nv);
            }
            tris.push(new Tri(v2[0], v2[1], v2[2], mesh.tris[i].color));
        }
        return new Mesh(tris);
    }
}