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
    static getCameraTransform() {
        return [-Render3D.camera.pos.x, -Render3D.camera.pos.y, -Render3D.camera.pos.z, Math.cos(Render3D.camera.rotation.x), Math.sin(Render3D.camera.rotation.x), Math.cos(Render3D.camera.rotation.y), Math.sin(Render3D.camera.rotation.y), Math.cos(Render3D.camera.rotation.z), Math.sin(Render3D.camera.rotation.z)];
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
            new Tri(new Vector3(x - w / 2, y - h / 2, z - d / 2), new Vector3(x + w / 2, y - h / 2, z - d / 2), new Vector3(x + w / 2, y + h / 2, z - d / 2)),
            new Tri(new Vector3(x + w / 2, y + h / 2, z - d / 2), new Vector3(x - w / 2, y + h / 2, z - d / 2), new Vector3(x - w / 2, y - h / 2, z - d / 2)),
            new Tri(new Vector3(x - w / 2, y - h / 2, z + d / 2), new Vector3(x - w / 2, y - h / 2, z - d / 2), new Vector3(x - w / 2, y + h / 2, z - d / 2)),
            new Tri(new Vector3(x - w / 2, y - h / 2, z + d / 2), new Vector3(x - w / 2, y + h / 2, z - d / 2), new Vector3(x - w / 2, y + h / 2, z + d / 2)),
            new Tri(new Vector3(x - w / 2, y - h / 2, z + d / 2), new Vector3(x + w / 2, y - h / 2, z - d / 2), new Vector3(x - w / 2, y - h / 2, z - d / 2)),
            new Tri(new Vector3(x - w / 2, y - h / 2, z + d / 2), new Vector3(x + w / 2, y - h / 2, z + d / 2), new Vector3(x + w / 2, y - h / 2, z - d / 2)),
            new Tri(new Vector3(x + w / 2, y - h / 2, z - d / 2), new Vector3(x + w / 2, y - h / 2, z + d / 2), new Vector3(x + w / 2, y + h / 2, z - d / 2)),
            new Tri(new Vector3(x + w / 2, y - h / 2, z + d / 2), new Vector3(x + w / 2, y + h / 2, z + d / 2), new Vector3(x + w / 2, y + h / 2, z - d / 2)),
            new Tri(new Vector3(x - w / 2, y + h / 2, z + d / 2), new Vector3(x - w / 2, y + h / 2, z - d / 2), new Vector3(x + w / 2, y + h / 2, z - d / 2)),
            new Tri(new Vector3(x + w / 2, y + h / 2, z - d / 2), new Vector3(x + w / 2, y + h / 2, z + d / 2), new Vector3(x - w / 2, y + h / 2, z + d / 2)),
            new Tri(new Vector3(x + w / 2, y - h / 2, z + d / 2), new Vector3(x - w / 2, y - h / 2, z + d / 2), new Vector3(x + w / 2, y + h / 2, z + d / 2)),
            new Tri(new Vector3(x - w / 2, y - h / 2, z + d / 2), new Vector3(x - w / 2, y + h / 2, z + d / 2), new Vector3(x + w / 2, y + h / 2, z + d / 2))
        );
        for (let tri of mesh.tris) tri.color = color;
        return mesh;
    }
    static makeSphere(x, y, z, r, color = cl.WHITE, subdivisions = 3) {
        let m = Render3D.makeCube(x, y, z, 20, 20, 20, color);
        for (let i = 0; i < subdivisions; i++) m = m.subdivide();
        for (let tri of m.tris) for (let v of tri.vertices) {
            v.sub(m.middle);
            v.mag = r;
            v.add(m.middle);
        }
        return m;
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
        this.middle = a.plus(b).plus(c).over(3);
    }
    get() {
        let t = new Tri(...this.vertices);
        t.color = this.color;
        return t;
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
	each(fn) {
		let ary = [];
		for (let vert of this.vertices) ary.push(fn(vert));
		let t = new Tri(...ary);
		t.color = this.color;
		return t;
	}
}
class Mesh {
	constructor(...tris) {
        this.tris = tris;
        this.middle = Vector3.origin;
        if (tris.length) this.middle = Vector3.sum(...tris.map(tri => tri.middle)).div(tris.length);
    }
    rotate(r, v) {
        return this.each(tri => tri.rotate(r, v));
    }
    translate(o) {
        return this.each(tri => tri.translate(o));
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
    cameraTransform(ox, oy, oz, cosx, sinx, cosy, siny, cosz, sinz) {
        return this.each(tri => tri.cameraTransform(ox, oy, oz, cosx, sinx, cosy, siny, cosz, sinz));
    }
	transform(ox, oy, oz, cosx, sinx, cosy, siny, cosz, sinz) {
		return this.each(tri => tri.transform(ox, oy, oz, cosx, sinx, cosy, siny, cosz, sinz));
    }
    project() {
        return this.each(tri => tri.project());
    }
	render(c, camera) {
        const width = c.canvas.width;
        const height = c.canvas.height;
        let cameraTransform = Render3D.getCameraTransform();

        let rTris = [];
        for (let i = 0; i < this.tris.length; i++) {
            let t = this.tris[i];
            //projection

            
            let tv = t.vertices;
            let A = tv[1].minus(tv[0]);
            let B = tv[1].minus(tv[2]);
            let ln = B.cross(A);

            // let t_2 = new Tri(...tv.map(v => {
            //     let m = Render3D.projectVector3(Render3D.transformVector3(v, ...cameraTransform))
            //     m.x *= width / 2;
            //     m.y *= width / 2;
            //     m.x += width / 2;
            //     m.y += height / 2;
            //     return m;
            // }));
            let t_2 = new Tri(...tv.map(v => {
                let m = Render3D.transformVector3(v, ...cameraTransform);
                return m;
            }));

            let mz = Math.max(t_2.vertices[0].z, t_2.vertices[1].z, t_2.vertices[2].z);
            if (mz < 1) continue;


            tv = t_2.vertices;
            A = tv[1].minus(tv[0]);
            B = tv[1].minus(tv[2]);
            let n = B.cross(A);
            let toCamera = t_2.middle;
            if (n.dot(toCamera) <= 0) continue;

            t_2.vertices = t_2.vertices.map(v => {
                let m = Render3D.projectVector3(v);
                m.x *= width / 2;
                m.y *= width / 2;
                m.x += width / 2;
                m.y += height / 2;
                return m;
            });

            //culling
            
            let minX = Infinity;
            let maxX = -Infinity;
            let minY = Infinity;
            let maxY = -Infinity;

            for (let j = 0; j < t_2.vertices.length; j++) {
                let v = t_2.vertices[j];
                if (v.x < minX) minX = v.x;
                if (v.x > maxX) maxX = v.x;
                if (v.y < minY) minY = v.y;
                if (v.y > maxY) maxY = v.y;
            }

            if (minX > width || minY > height || maxX < 0 || maxY < 0) continue;
            
            //lighting

			let light = (ln.normalize().dot(Render3D.lightDirection) + 1) / 2;
			let col = Color.lerp(t.color, cl.BLACK, (1 - light));
            t_2.color = col;


            rTris.push(t_2);
        }
        rTris.sort((a, b) => b.middle.z - a.middle.z);

		for (let i = 0; i < rTris.length; i++) {
            let tri = rTris[i];
            let col = tri.color;
			c.draw(col).shape(...tri.vertices);
			c.stroke(col, 1, "round").shape(...tri.vertices);
			// c.draw(cl.RED).circle(tri.vertices[0].x, tri.vertices[0].y, 3);
			// c.draw(cl.LIME).circle(tri.vertices[1].x, tri.vertices[1].y, 3);
			// c.draw(cl.BLUE).circle(tri.vertices[2].x, tri.vertices[2].y, 3);
			
		};
	}
}
Render3D.lightDirection = new Vector3(0, 1, 0);