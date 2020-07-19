class Render3D {
    static rotatePointAround(origin, point, rotation) {
        let x = point.x;
        let y = point.y;
        let z = point.z;
        let r;
    
        r = Geometry.rotatePointAround(new Vector2(origin.x, origin.z), new Vector2(x, z), rotation.y);
        x = r.x;
        z = r.y;
        
        r = Geometry.rotatePointAround(new Vector2(origin.y, origin.z), new Vector2(y, z), rotation.x);
        y = r.x;
        z = r.y;
        
        r = Geometry.rotatePointAround(new Vector2(origin.x, origin.y), new Vector2(x, y), rotation.z);
        x = r.x;
        y = r.y;
    
        return new Vector3(x, y, z);
    }
    static toScreen(p) {
        let P = Render3D.projectVector3(Render3D.transformVector3(p, ...Render3D.getCameraTransform(Render3D.camera)));
        return new Vector2(P.x + width / 2, P.y + height / 2);
    }
    static projectVector3(v) {
        let x = v.x;
        let y = v.y;
        let z = Math.max(v.z, 1);
        return new Vector3(x / z, y / z, v.z);
    }
    static getCameraTransform(camera) {
        return [-camera.pos.x, -camera.pos.y, -camera.pos.z, Math.cos(camera.rotation.x), Math.sin(camera.rotation.x), Math.cos(camera.rotation.y), Math.sin(camera.rotation.y), Math.cos(camera.rotation.z), Math.sin(camera.rotation.z)];
    }
    static transformVector3(v, ox, oy, oz, cosx, sinx, cosy, siny, cosz, sinz) {
        let x, t_x, y, t_y, z, t_z;
        x = v.x;
        y = v.y;
        z = v.z;

        t_x = x + ox;
        t_y = y + oy;
        t_z = z + oz;

        x = t_x;
        y = t_y;
        z = t_z;

        t_x = x * cosy - z * siny;
        t_z = x * siny + z * cosy;
        x = t_x;
        z = t_z;
        
        t_y = y * cosx - z * sinx;
        t_z = y * sinx + z * cosx;
        y = t_y;
        z = t_z;
        
        t_x = x * cosz - y * sinz;
        t_y = x * sinz + y * cosz;
        x = t_x;
        y = t_y;

        return new Vector3(x, y, z);
    }
    static cameraRotationFromMouse(mouse) {
        Render3D.camera.rotation.x = Math.PI * (mouse.y - height / 2) / height;
        Render3D.camera.rotation.y = Math.PI * (mouse.x - width / 2) / width;
    }
    static moveCameraAlongRotation(v) {
        let nr = Render3D.rotatePointAround(Vector3.origin, v, Render3D.camera.rotation.inverse());
        Render3D.camera.pos.add(nr);   
    }
    static renderScene(c, ...meshes) {
        let triangles = [];
        for (let m of meshes) {
            triangles.push(...m.tris);
        }
        let mesh = new Mesh(...triangles);
        mesh.render(c, Render3D.camera);
    }
    static makeCube(x, y, z, w, h, d, color = cl.WHITE) {
        let mesh = new Mesh(
            new Tri(new Vector3(x, y, z), new Vector3(x + w, y, z), new Vector3(x + w, y + h, z)),
            new Tri(new Vector3(x + w, y + h, z), new Vector3(x, y + h, z), new Vector3(x, y, z)),
            new Tri(new Vector3(x, y, z + d), new Vector3(x, y, z), new Vector3(x, y + h, z)),
            new Tri(new Vector3(x, y, z + d), new Vector3(x, y + h, z), new Vector3(x, y + h, z + d)),
            new Tri(new Vector3(x, y, z + d), new Vector3(x + w, y, z), new Vector3(x, y, z)),
            new Tri(new Vector3(x, y, z + d), new Vector3(x + w, y, z + d), new Vector3(x + w, y, z)),
            new Tri(new Vector3(x + w, y, z), new Vector3(x + w, y, z + d), new Vector3(x + w, y + h, z)),
            new Tri(new Vector3(x + w, y, z + d), new Vector3(x + w, y + h, z + d), new Vector3(x + w, y + h, z)),
            new Tri(new Vector3(x, y + h, z + d), new Vector3(x, y + h, z), new Vector3(x + w, y + h, z)),
            new Tri(new Vector3(x + w, y + h, z), new Vector3(x + w, y + h, z + d), new Vector3(x, y + h, z + d)),
            new Tri(new Vector3(x + w, y, z + d), new Vector3(x, y, z + d), new Vector3(x + w, y + h, z + d)),
            new Tri(new Vector3(x, y, z + d), new Vector3(x, y + h, z + d), new Vector3(x + w, y + h, z + d))
        );
        for (let tri of mesh.tris) tri.color = color;
        return mesh;
    }
    static makeCylinder(X, Y, Z, r, h, color = cl.WHITE, RES = 10) {
        let tris = [];
        let total = RES;
        let radius = r;
        let y = 0;
        let start = new Vector3(-radius, 0, 0);
        for (let i = 0; i < total; i++) {
            let angle = Math.PI * 2 * i / total;
            let angle2 = Math.PI * 2 * (i + 1) / total;
            let v = Vector2.fromAngle(angle + Math.PI).times(radius);
            let v2 = Vector2.fromAngle(angle2 + Math.PI).times(radius);
            if (i < total - 1 && !start.equals(v2) && !start.equals(v)) {
                tris.push(new Tri(
                    new Vector3(start.x, y - h, start.z),
                    new Vector3(v2.x, y - h, v2.y),
                    new Vector3(v.x, y - h, v.y)
                ));
                tris.push(new Tri(
                    new Vector3(v.x, y, v.y),
                    new Vector3(v2.x, y, v2.y),
                    new Vector3(start.x, y, start.z)
                ));
            }
            tris.push(new Tri(
                new Vector3(v.x, y, v.y),
                new Vector3(v.x, y - h, v.y),
                new Vector3(v2.x, y, v2.y)
            ));
            tris.push(new Tri(
                new Vector3(v.x, y - h, v.y),
                new Vector3(v2.x, y - h, v2.y),
                new Vector3(v2.x, y, v2.y)
            ));
        }
        let offset = new Vector3(X, Y, Z);
        return new Mesh(...tris.map(e => {
            e = e.each(vert => {
                return vert.plus(offset);
            });
            e.color = color;
            return e;
        }));
    }
}
Render3D.camera = {
	pos: new Vector3(0, 0, 0),
	rotation: new Vector3(0, 0, 0)
};
class Tri {
	constructor(a, b, c) {
		this.vertices = [a, b, c];
        this.color = cl.WHITE;
        this.calculateNormals();
    }
    calculateNormals() {
		let A = this.vertices[1].minus(this.vertices[2]);
		let B = this.vertices[1].minus(this.vertices[0]);
		this.normal = A.cross(B).normalize();
		this.lightNormal = this.normal;
        this.middle = Vector.sum(...this.vertices).over(3);
        let az = this.vertices[0].z;
        let bz = this.vertices[1].z;
        let cz = this.vertices[2].z;
        this.sortZ = (az + bz + cz) / 3;
        this.maxZ = Math.max(az, bz, cz);
    }
    get() {
        let t = new Tri(...this.vertices);
        t.color = this.color;
        return t;
    }
	t_rotate(r, v) {
		let tri = this.rotate(r, v);
		tri.lightNormal = this.lightNormal;
		tri.color = this.color;
		return tri;
	}
	rotate(r, v) {
		let nVerts = [];
		let origin = v;
		for (let v of this.vertices) {
			nVerts.push(Render3D.rotatePointAround(origin, v, r));
		}
		let tri = new Tri(...nVerts);
		tri.color = this.color;
		return tri;
	}
	translate(v) {
		let nVerts = [];
		for (let vert of this.vertices) nVerts.push(vert.plus(v));
		let tri = new Tri(...nVerts);
		tri.color = this.color;
		return tri;
    }
    each_t(fn) {
		let ary = [];
		for (let vert of this.vertices) ary.push(fn(vert));
		let t = new Tri(...ary);
		t.lightNormal = this.lightNormal;
		t.color = this.color;
		return t;
    }
	each(fn) {
		let ary = [];
		for (let vert of this.vertices) ary.push(fn(vert));
		let t = new Tri(...ary);
		t.normal = this.normal;
		t.middle = this.middle;
		t.lightNormal = this.lightNormal;
		t.color = this.color;
		return t;
	}
}
class Mesh {
	constructor(...tris) {
        this.tris = tris;
		this.middle = this.tris.length ? Vector.sum(...this.tris.map(e => e.middle)).over(this.tris.length) : Vector3.origin;
    }
    rotate(r, v) {
        return this.each(tri => tri.rotate(r, v));
    }
    translate(o) {
        return this.each(tri => tri.translate(o));
    }
    calculateNormals() {
        for (let tri of this.tris) tri.calculateNormals();
    }
    subdivide() {
        let m = this.get();
		let tris = [];
		for (let i = 0; i < m.tris.length; i++) {
			let t = m.tris[i].get();

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
		m.tris = tris;
        return m;
    }
    get() {
        return new Mesh(...this.tris.map(tri => tri.get()));
    }
	each(fn) {
		let ary = [];
		for (let tri of this.tris) ary.push(fn(tri));
		return new Mesh(...ary);
    }
    color(col) {
        return new Mesh(...this.tris.map(e => {
            e.color = col;
            return e;
        }));
    }
	transform(ox, oy, oz, cosx, sinx, cosy, siny, cosz, sinz) {
		return this.each(tri => tri.each_t(v => Render3D.transformVector3(v, ox, oy, oz, cosx, sinx, cosy, siny, cosz, sinz)));
    }
    project() {
        return this.each(tri => tri.each(v => Render3D.projectVector3(v)));
    }
	render(c, camera) {
        const width = c.canvas.width;
        const height = c.canvas.height;
		let m_1 = this.transform(...Render3D.getCameraTransform(camera));
		m_1.tris = m_1.tris.filter(tri => {
			let toCamera = tri.middle;
			let dot = toCamera.dot(tri.normal);
            let max = tri.maxZ;
			if (max < 1) {
				return false;
			}
			return dot >= 0;
		});
		m_1.tris.sort((a, b) => b.sortZ - a.sortZ);
		let m_0 = m_1.project();
		m_0 = m_0.each(tri => tri.each(v => {
			return new Vector3((width / 2) * v.x + width / 2, (width / 2) * v.y + height / 2, v.z);
        }));
        let screen = new Rect(0, 0, width, height);
		m_0.tris = m_0.tris.filter(tri => {
            let minX = Infinity;
            let maxX = -Infinity;
            let minY = Infinity;
            let maxY = -Infinity;

            for (let i = 0; i < tri.vertices.length; i++) {
                let v = tri.vertices[i];
                if (v.x < minX) minX = v.x;
                if (v.x > maxX) maxX = v.x;
                if (v.y < minY) minY = v.y;
                if (v.y > maxY) maxY = v.y;
            }

            return minX < screen.x + screen.width && minY < screen.y + screen.height && maxX > screen.x && maxY > screen.y;
        })
		m_0.each(tri => {
			let light = (tri.lightNormal.dot(Render3D.lightDirection) + 1) / 2;
			let col = Color.lerp(tri.color, cl.BLACK, (1 - light));
			c.draw(col).shape(...tri.vertices);
			c.stroke(col, 1, "round").shape(...tri.vertices);
			// c.draw(cl.RED).circle(tri.vertices[0].x, tri.vertices[0].y, 3);
			// c.draw(cl.LIME).circle(tri.vertices[1].x, tri.vertices[1].y, 3);
			// c.draw(cl.BLUE).circle(tri.vertices[2].x, tri.vertices[2].y, 3);
			return tri;
		});
	}
}
Render3D.lightDirection = new Vector3(0, 1, 0);