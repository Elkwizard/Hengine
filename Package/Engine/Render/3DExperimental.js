class Render3D {
    static rotatePointAround(origin, point, rotation) {

        let x = point.x - origin.x;
        let y = point.y - origin.y;
        let z = point.z - origin.z;
        let r;


        r = Geometry.rotatePointAround(Vector2.origin, new Vector2(y, z), rotation.x);
        y = r.x;
        z = r.y;
        
        r = Geometry.rotatePointAround(Vector2.origin, new Vector2(x, z), rotation.y);
        x = r.x;
        z = r.y;


        r = Geometry.rotatePointAround(Vector2.origin, new Vector2(x, y), rotation.z);
        x = r.x;
        y = r.y;

        return new Vector3(x, y, z).plus(origin);
    }
    static toScreen(p, transform = Render3D.getCameraTransform()) {
        let P = Render3D.projectVector3(Render3D.transformVector3(p, ...transform));
        return new Vector2(P.x * width / 2 + width / 2, P.y * width / 2 + height / 2);
    }
    static projectVector3(v) {
        let x = v.x;
        let y = v.y;
        let z = Math.max(v.z, 1);
        return new Vector3(x / z, y / z, v.z);
    }
    static getCameraTransform() {
        return [-Render3D.camera.position.x, -Render3D.camera.position.y, -Render3D.camera.position.z, Math.cos(Render3D.camera.rotation.x), Math.sin(Render3D.camera.rotation.x), Math.cos(Render3D.camera.rotation.y), Math.sin(Render3D.camera.rotation.y), Math.cos(Render3D.camera.rotation.z), Math.sin(Render3D.camera.rotation.z)];
    }
    static rotateTransformVector3(v, ox, oy, oz, cosx, sinx, cosy, siny, cosz, sinz) {
        let x, t_x, y, t_y, z, t_z;
        x = v.x;
        y = v.y;
        z = v.z;

        t_x = x - ox;
        t_y = y - oy;
        t_z = z - oz;

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

        t_x = x + ox;
        t_y = y + oy;
        t_z = z + oz;

        x = t_x;
        y = t_y;
        z = t_z;

        return new Vector3(x, y, z);
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
        let nr = Render3D.rotatePointAround(Vector3.origin, v, Render3D.camera.rotation.inverse);
        Render3D.camera.position.add(nr);
    }
    static renderScene(c, meshes) {
        let triangles = [];
        for (let m of meshes) {
            triangles.pushArray(m.tris);
        }
        let mesh = new Mesh(triangles);
        mesh.render(c);
    }
    static makePrism(x, y, z, w, h, d, color = Color.WHITE) {
        let mesh = new Mesh([
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
        ]);
        for (let tri of mesh.tris) tri.color = color;
        return mesh;
    }
    static makeSphere(x, y, z, r, color = Color.WHITE, subdivisions = 3) {
        let m = Render3D.makePrism(x, y, z, r * 2, r * 2, r * 2, color);
        for (let i = 0; i < subdivisions; i++) m = m.subdivide();
        for (let tri of m.tris) for (let v of tri.vertices) {
            v.sub(m.middle);
            v.mag = r;
            v.add(m.middle);
        }
        return m;
    }
}
Render3D.WIREFRAME = Symbol("WIREFRAME");
Render3D.SOLID = Symbol("SOLID");
Render3D.VERTEX = Symbol("VERTEX");
Render3D.renderType = Render3D.SOLID;
Render3D.camera = {
    position: new Vector3(0, 0, 0),
    rotation: new Vector3(0, 0, 0)
};
class Tri {
    constructor(a, b, c) {
        this.vertices = [a, b, c];
        this.color = Color.WHITE;
        this.middle = a.plus(b).plus(c).over(3);
        this.sortZ = this.middle.z; //(a.x ** 2 + a.y ** 2 + b.x ** 2 + b.y ** 2 + c.x ** 2 + c.y ** 2) / 3;
    }
    get() {
        let t = new Tri(...this.vertices);
        t.color = this.color;
        return t;
    }
    rotate(r, v = this.middle) {
        let ox = v.x, oy = v.y, oz = v.z;
        let cosx = Math.cos(r.x), sinx = Math.sin(r.x);
        let cosy = Math.cos(r.y), siny = Math.sin(r.y);
        let cosz = Math.cos(r.z), sinz = Math.sin(r.z);
        return this.rotateTransform(ox, oy, oz, cosx, sinx, cosy, siny, cosz, sinz);
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
    rotateTransform(ox, oy, oz, cosx, sinx, cosy, siny, cosz, sinz) {
        return this.each(v => Render3D.rotateTransformVector3(v, ox, oy, oz, cosx, sinx, cosy, siny, cosz, sinz));
    }
}
class Mesh {
    constructor(tris) {
        this.tris = tris;
        this.middle = Vector3.origin;
        if (tris.length) this.middle = Vector3.sum(tris.map(tri => tri.middle)).div(tris.length);
    }
    rotate(r, v = this.middle) {
        let ox = v.x, oy = v.y, oz = v.z;
        let cosx = Math.cos(r.x), sinx = Math.sin(r.x);
        let cosy = Math.cos(r.y), siny = Math.sin(r.y);
        let cosz = Math.cos(r.z), sinz = Math.sin(r.z);
        return this.rotateTransform(ox, oy, oz, cosx, sinx, cosy, siny, cosz, sinz);
    }
    rotateTransform(ox, oy, oz, cosx, sinx, cosy, siny, cosz, sinz) {
        return this.each(tri => tri.rotateTransform(ox, oy, oz, cosx, sinx, cosy, siny, cosz, sinz));
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
        return new Mesh(this.tris.map(tri => tri.get()));
    }
    each(fn) {
        let ary = [];
        for (let tri of this.tris) ary.push(fn(tri));
        return new Mesh(ary);
    }
    color(col) {
        return new Mesh(this.tris.map(e => {
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
    render(c) {
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
            let col = Color.lerp(t.color, Color.BLACK, (1 - light));
            t_2.color = col;


            rTris.push(t_2);
        }
        rTris.sort((a, b) => b.sortZ - a.sortZ);
        if (Render3D.renderType === Render3D.SOLID) {
            for (let i = 0; i < rTris.length; i++) {
                let tri = rTris[i];
                let col = tri.color;
                c.draw(col).shape(tri.vertices);
                c.stroke(col, 1, "round").shape(tri.vertices);
            }
        } else if (Render3D.renderType === Render3D.WIREFRAME) {
            for (let i = 0; i < rTris.length; i++) {
                let tri = rTris[i];
                let col = tri.color;
                c.stroke(col, 1, "round").shape(tri.vertices);
            }
        } else if (Render3D.renderType === Render3D.VERTEX) {
            for (let i = 0; i < rTris.length; i++) {
                let tri = rTris[i];
                let col = tri.color;
                for (let j = 0; j < tri.vertices.length; j++) c.draw(col).circle(tri.vertices[j], 2);
            }
        }
    }
}
Render3D.lightDirection = new Vector3(0, 1, 0);