class Geometry {
    static smoothConnector(path) {
        let result = [path[0]];
        for (let i = 0; i < path.length - 2; i++) {
            let a = path[i];
            let b = path[i + 1];
            let c = path[i + 2];
            let M = a.plus(c).plus(b.times(6)).over(8);

            result.push(a.plus(b).over(2), M, c.plus(b).over(2));
        }

        result.push(path[path.length - 1]);

        return result;
    }
    static smoothPolygon(shape) {
        let vertices = shape.vertices;
        if (vertices.length <= 2) return shape.get();
        let result = [];

        for (let i = 0; i < vertices.length; i++) {
            let a = vertices[i];
            let b = vertices[(i + 1) % vertices.length];
            let c = vertices[(i + 2) % vertices.length];
            let M = a.plus(c).plus(b.times(6)).over(8);

            result.push(a.plus(b).over(2), M, c.plus(b).over(2));
        }

        return new Polygon(result);
    }
    static triangulate(shape) {
        let vertices = shape.vertices;
        const result = [];
        if (vertices.length < 3) return [];
        if (vertices.length === 3) return shape.get();
        for (let i = 0; i < vertices.length / 2; i++) {
            let a = vertices[vertices.length - 1 - i];
            let b = i ? vertices[vertices.length - i] : vertices[0];
            let c = vertices[i + 1];
            let d = vertices[i + 2];
            if (a !== d) result.push([a, c, d], [a, b, c]);
        }
        if (vertices.length % 2 === 1) result.pop();
        return result;
    }
    static gridToPolygons(srcGrid, CELL_SIZE) {

        let grid = srcGrid.map(v => v);


        //methods
        function sample(x, y) {
            if (x in grid && y in grid[x]) return grid[x][y];
            return false;
        }

        function set(arr, x, y, v) {
            if (x in arr && y in arr[x]) arr[x][y] = v;
        }
        function point(x, y) {
            return new Vector2(x, y);
        }

        //remove diagonals

        let broken = true;
        while (broken) {
            broken = false;
            for (let i = 0; i < grid.length; i++) for (let j = 0; j < grid[0].length; j++) {
                const V = sample(i, j);
                if (V) {
                    const A = sample(i, j - 1);
                    const B = sample(i + 1, j);
                    const C = sample(i, j + 1);
                    const D = sample(i - 1, j);

                    const A2 = sample(i + 1, j - 1);
                    const B2 = sample(i + 1, j + 1);
                    const C2 = sample(i - 1, j + 1);
                    const D2 = sample(i - 1, j - 1);

                    if (A2) if (!A && !B) {
                        broken = true;
                        grid[i][j - 1] = true;
                    }
                    if (B2) if (!B && !C) {
                        broken = true;
                        grid[i + 1][j] = true;
                    }
                    if (C2) if (!C && !D) {
                        broken = true;
                        grid[i][j + 1] = true;
                    }
                    if (D2) if (!D && !A) {
                        broken = true;
                        grid[i - 1][j] = true;
                    }
                }
            }
        }



        let pathGrid = Array.dim(grid.length + 1, grid[0].length + 2);
        let pointGrid = Array.dim(grid.length + 1, grid[0].length + 2);
        let startingPoints = [];

        for (let i = 0; i < grid.length; i++) for (let j = 0; j < grid[0].length; j++) {
            const V = sample(i, j);
            if (V) {
                const A = sample(i, j - 1);
                const B = sample(i + 1, j);
                const C = sample(i, j + 1);
                const D = sample(i - 1, j);


                if (!A) set(pathGrid, i, j, Vector2.right);
                if (!B) set(pathGrid, i + 1, j, Vector2.down);
                if (!C) set(pathGrid, i + 1, j + 1, Vector2.left);
                if (!D) set(pathGrid, i, j + 1, Vector2.up);


                const A_p = point(i, j - 1);
                const B_p = point(i + 1, j);
                const C_p = point(i, j + 1);
                const D_p = point(i - 1, j);
                const V_p = point(i, j);


                let ul = true;
                let ur = true;
                let ll = true;
                let lr = true;

                if (A) ul = false, ur = false;
                if (B) ur = false, lr = false;
                if (C) ll = false, lr = false;
                if (D) ul = false, ll = false;

                if (ul) set(pointGrid, i, j, true);
                if (ur) set(pointGrid, i + 1, j, true);
                if (ll) set(pointGrid, i, j + 1, true);
                if (lr) set(pointGrid, i + 1, j + 1, true);

                if (ul) startingPoints.push(V_p);
                if (ur) startingPoints.push(B_p);
                if (ll) startingPoints.push(C_p);
                if (lr) startingPoints.push(point(i + 1, j + 1));
            }
        }
        // for (let i = 0; i < pathGrid.length; i++) for (let j = 0; j < pathGrid[0].length; j++) {
        //     let v = pathGrid[i][j];
        //     if (v) {
        //         renderer.stroke(Color.ORANGE, 2).arrow(point(i, j).times(CELL_SIZE), point(i, j).times(CELL_SIZE).plus(v.times(CELL_SIZE)));
        //     }
        // }
        // for (let i = 0; i < pointGrid.length; i++) for (let j = 0; j < pointGrid[0].length; j++) {
        //     let p = pointGrid[i][j];
        //     if (p) {
        //         // renderer.stroke(Color.LIME, 3).circle(point(i, j), 5);
        //     }
        // }
        // for(let p of startingPoints) renderer.draw(Color.PURPLE).circle(p.times(CELL_SIZE), 5);
        let polygons = [];
        // startingPoints = [];
        while (startingPoints.length) {
            let start = startingPoints[0];
            let current = start.get();
            let points = [];
            let lastArrow = null;
            let counter = false;
            do {
                let v = pathGrid[~~current.x][~~current.y];
                if (!v) break;
                lastArrow = v;
                current.add(v);
                let found = startingPoints.find(vec => vec.equals(current));
                if (found) {
                    points.push(found.times(CELL_SIZE));
                    startingPoints.splice(startingPoints.indexOf(found), 1);
                }
            } while (!current.equals(start));
            if (points.length && !counter) polygons.push(points);
        }

        // for (let points of polygons) renderer.stroke(Color.PURPLE, 2).shape(...points);
        return polygons.filter(vertices => {
            // is clockwise ?
            let signedArea = 0;
            let length = vertices.length;
			for (let i = 0; i < length; i++) {
				let a = vertices[i];
				let b = vertices[(i + 1) % length];
				signedArea += (b.x - a.x) * (a.y + b.y);
            }
            return signedArea < 0;
        }).map(vertices => new Polygon(vertices));
    }
    static gridToRects(srcGrid, CELL_SIZE) {
        let grid = [];
        for (let i = 0; i < srcGrid.length; i++) {
            grid.push([]);
            for (let j = 0; j < srcGrid[0].length; j++) grid[i].push(srcGrid[i][j]);
        }
        let result = [];

        function sample(x, y) {
            return x in grid && y in grid[x] && grid[x][y];
        }
        function set(x, y, v) {
            if (x in grid && y in grid[x]) grid[x][y] = v;
        }

        function validRect(r) {
            for (let i = 0; i < r.width; i++) for (let j = 0; j < r.height; j++) if (!sample(r.x + i, r.y + j)) return false;
            return true;
        }
        function clearRect(r) {
            for (let i = 0; i < r.width; i++) for (let j = 0; j < r.height; j++) set(r.x + i, r.y + j, false);
        }

        for (let i = 0; i < grid.length; i++) for (let j = 0; j < grid[0].length; j++) {
            if (!grid[i][j]) continue;
            let currentRect = new Rect(i, j, 1, 1);
            while (validRect(currentRect)) {
                currentRect.width++;
                currentRect.height++;
            }
            currentRect.width--;
            if (validRect(currentRect)) {
                // width is too big
                while (validRect(currentRect)) currentRect.height++;
                currentRect.height--;
            } else {
                currentRect.width++;
                currentRect.height--;
                if (validRect(currentRect)) {
                    // height is too big
                    while (validRect(currentRect)) currentRect.width++;
                    currentRect.width--;
                } else {
                    // square
                    currentRect.width--;
                }
            }
            clearRect(currentRect);
            // while (validRect(currentRect)) currentRect.height++;



            result.push(currentRect);
        }


        for (let i = 0; i < result.length; i++) result[i].mul(CELL_SIZE);

        return result;
    }
    static distToLineObject(p, l) {
        let cp = Geometry.closestPointOnLineObject(p, l);
        return Vector2.dist(p, cp);
    }
    static distToCircle(p, c) {
        return Vector2.dist(p, c) - c.radius;
    }
    static closest(p, points) {
        let bestDist = Infinity;
        let best = null;
        for (let i = 0; i < points.length; i++) {
            let dist = Vector2.sqrDist(points[i], p);
            if (dist < bestDist) {
                bestDist = dist;
                best = points[i];
            }
        }
        return best;
    }
    static farthest(p, points) {
        let bestDist = -Infinity;
        let best = null;
        for (let i = 0; i < points.length; i++) {
            let dist = Vector2.sqrDist(points[i], p);
            if (dist > bestDist) {
                bestDist = dist;
                best = points[i];
            }
        }
        return best;
    }
    static signedAngularDist(r1, r2) {
        const pi2 = 2 * Math.PI;
        r1 = (r1 % pi2 + pi2) % pi2;
        r2 = (r2 % pi2 + pi2) % pi2;
        let dif = r2 - r1;
        if (r2 < r1) dif *= -1;
        if (Math.abs(dif - pi2) < Math.abs(dif)) dif -= pi2;
        if (r2 < r1) dif *= -1;
        return -dif;
    }
    static farthestInDirection(corners, dir) {
        let farthest = corners[0];
        let farthestDist = -Infinity;
        let result = { index: 0, corner: farthest }
        for (let i = 0; i < corners.length; i++) {
            let corner = corners[i];
            let dist = corner.x * dir.x + corner.y * dir.y;
            if (dist > farthestDist) {
                farthest = corner;
                farthestDist = dist;
                result.index = i;
            }
        }
        result.corner = farthest;
        return result;
    }
    static projectPointOntoLine(p, d) {
        return p.x * d.x + p.y * d.y;
    }
    static rayCast(p, r, shapes) {
        let hit = null;
        let hitShape = null;
        let bestDist = Infinity;
        const EPSILON = 0.0001;
        for (let shape of shapes) {
            let nHit = null;
            if (shape instanceof Circle) {
                let normal = r.normal;
                let proj_P = normal.dot(p);
                let proj_C = normal.dot(shape);
                if (Math.abs(proj_P - proj_C) < shape.radius && p.minus(shape).dot(r) <= 0) {
                    let t = (proj_C + shape.radius - proj_P) / (shape.radius * 2);
                    let upVec = r.times(-1);
                    let crossVec = upVec.normal;
                    let baseP = shape.middle.sub(crossVec.times(shape.radius)).add(crossVec.times(t * shape.radius * 2));
                    let y = Math.sqrt(1 - (2 * t - 1) ** 2);
                    baseP.add(upVec.times(y * shape.radius));
                    if (baseP.minus(p).dot(r) >= 0) nHit = baseP;
                }
            } else if (shape instanceof Polygon) {
                let edges = shape.getEdges();
                let bestDist = Infinity;
                let bestPoint = null;
                edges = edges.filter(edge => {
                    let n = edge.vector.normal;
                    return n.dot(r) >= 0 && Math.max(edge.a.minus(p).dot(r), edge.b.minus(p).dot(r)) > 0;
                });
                let normal = r.normal;
                let dx = r.x;
                let dy = r.y || EPSILON;
                let b = p.y - p.x * dy / dx;
                for (let edge of edges) {
                    let proj_P = normal.dot(p);
                    let proj_A = normal.dot(edge.a);
                    let proj_B = normal.dot(edge.b);
                    [proj_A, proj_B] = [Math.min(proj_A, proj_B), Math.max(proj_A, proj_B)];
                    if (proj_P >= proj_A && proj_P <= proj_B) {
                        let vec = edge.vector;
                        let dx2 = vec.x || EPSILON;
                        let dy2 = vec.y || EPSILON;
                        let b2 = edge.a.y - edge.a.x * dy2 / dx2;
                        let x, y;
                        if (Math.abs(dx) > EPSILON) {
                            // dy / dx * x + b = dy2 / dx2 * x + b2
                            // dy / dx * x - dy2 / dx2 * x = b2 - b
                            // (dy / dx - dy2 / dx2) * x = b2 - b
                            // x = (b2 - b) / (dy / dx - dy2 / dx2)
                            x = (b2 - b) / (dy / dx - dy2 / dx2);
                            y = dy / dx * x + b;
                        } else {
                            x = p.x;
                            y = dy2 / dx2 * x + b2;
                        }
                        let dist = (x - p.x) ** 2 + (y - p.y) ** 2;
                        if (dist < bestDist) {
                            bestDist = dist;
                            bestPoint = new Vector2(x, y);
                        }

                    }
                    nHit = bestPoint;
                }
            }
            if (nHit) {
                let nDist = (nHit.x - p.x) ** 2 + (nHit.y - p.y) ** 2;
                if (nDist < bestDist && nHit.minus(p).dot(r) >= 0) {
                    hit = nHit;
                    bestDist = nDist;
                    hitShape = shape;
                }
            }
        }
        return { hitPoint: hit, hitShape };
    }
    static closestPointOnLineObjectInDirection(p, d, l) {
        let x1 = p.x;
        let y1 = p.y;
        let dx1 = d.x;
        let dy1 = d.y;
        let x2 = l.a.x;
        let y2 = l.a.y;
        let dx2 = l.b.x - l.a.x;
        let dy2 = l.b.y - l.a.y;
        let rightSide = (y1 - (dy1 / dx1) * x1) - (y2 - (dy2 / dx2) * x2);
        let leftCof = (dy2 / dx2) - (dy1 / dx1);
        const MIN = Math.min(l.a.x, l.b.x);
        const MAX = Math.max(l.a.x, l.b.x);
        let x = Number.clamp(rightSide / leftCof, MIN, MAX);
        let y = (dy1 / dx1) * x + y1 - (dy1 / dx1) * x1;
        return new Vector2(x, y);
    }
    static closestPointOnLineObject(p, l) {
        return p.Vminus(l.a).projectOnto(l.b.Vminus(l.a)).Vplus(l.a);
    }
    static closestPointOnLineObjectLimited(p, l) {
        let outOfBounds = false;
        let onLine = Geometry.closestPointOnLineObject(p, l);
        let xRange = new Range(l.a.x, l.b.x);
        let yRange = new Range(l.a.y, l.b.y);
        if (!xRange.includes(onLine.x)) outOfBounds = true;
        else if (!yRange.includes(onLine.y)) outOfBounds = true;
        return { result: new Vector2(X, Y), outOfBounds };
    }
    static closestPointOnLine(p, d) {
        let x1 = p.x;
        let y1 = p.y;
        let dx = d.x;
        let dy = d.y;
        let xv = ((dx ** 2) * x1 + (dx * dy * y1)) / (dx ** 2 + dy ** 2);
        let yv = (dy / dx) * xv;
        return new Vector2(xv, yv);
    }
    static subdividePolygonList(vertices) {
        vertices = [...vertices];
        //edges
        let vectors = [];
        let edges = [];
        let middle = Vector2.origin;
        for (let i = 0; i < vertices.length; i++) {
            const A = vertices[i];
            const B = vertices[(i + 1) % vertices.length];
            vectors.push(B.minus(A).normalize());
            edges.push(new Line(A, B));
            middle.add(A);
        }

        //direction
        middle.div(vertices.length);

        const INDEX_DATA = [];
        const CONVEX = [];

        for (let i = 0; i < edges.length; i++) {
            const INX = i;
            const NEXT_INX = (i + 1) % edges.length;
            const A = edges[INX];
            const B = edges[NEXT_INX];
            const VEC_A = vectors[INX];
            const VEC_B = vectors[NEXT_INX];
            const VERT_A = vertices[INX];
            const VERT_B = vertices[NEXT_INX];

            let angle = Math.abs(VEC_B.angle - VEC_A.angle);
            if (VEC_B.angle < VEC_A.angle) angle = Math.PI * 2 - angle;

            let convex = angle <= Math.PI || !angle;

            INDEX_DATA.push({ INX, NEXT_INX, A, B, VEC_A, VEC_B, VERT_A, VERT_B, convex });
            CONVEX.push(convex);
        }

        if (CONVEX.includes(false)) {
            const CONCAVE_INX = CONVEX.indexOf(false);
            const { INX, NEXT_INX, A, B, VEC_A, VEC_B, VERT_A, VERT_B, convex } = INDEX_DATA[CONCAVE_INX];

            const VERTEX = VERT_B;

            const AWAY = VEC_A.minus(VEC_B).normalize();

            const SEGMENTS = [];
            for (let i = 0; i < edges.length; i++) {
                if (i === INX) continue;
                if (i === NEXT_INX) continue;
                const EDGE = edges[i];
                const TO_MIDDLE_A = EDGE.a.minus(VERTEX);
                const TO_MIDDLE_B = EDGE.b.minus(VERTEX);
                if (TO_MIDDLE_A.dot(AWAY) < 0 && TO_MIDDLE_B.dot(AWAY) < 0) continue;
                SEGMENTS.push(edges[i]);
            }
            if (!SEGMENTS.length) return [vertices];

            const EPSILON = 0.00001;

            const dx = AWAY.x || EPSILON;
            const dy = AWAY.y || EPSILON;
            const b = VERTEX.y - dy / dx * VERTEX.x;

            let intersects = [];
            for (let i = 0; i < SEGMENTS.length; i++) {
                const SEG = SEGMENTS[i];
                const SEG_LENGTH = SEG.length;
                const INTERSECT = Geometry.intersectRayLine(VERTEX, AWAY, SEG);
                if (!INTERSECT) continue;
                const DOT = INTERSECT.minus(SEG.a).dot(SEG.vector);

                if (DOT >= 0 && DOT <= SEG_LENGTH) intersects.push({ point: INTERSECT, segment: SEG });
            }
            if (intersects.length) {
                const INTERSECT = intersects.sort((a, b) => a.point.minus(VERTEX).sqrMag - b.point.minus(VERTEX).sqrMag)[0];
                const INX = edges.indexOf(INTERSECT.segment);
                const INX_A = INX;
                const INX_B = (INX + 1) % vertices.length;
                vertices.splice(INX_B, 0, INTERSECT.point);

                const NEW_INX = vertices.indexOf(INTERSECT.point);
                const VERTEX_INX = vertices.indexOf(VERTEX);

                let polyA = [];
                let polyB = [];
                if (NEW_INX < VERTEX_INX) {
                    polyA = [...vertices.slice(VERTEX_INX), ...vertices.slice(0, NEW_INX + 1)];
                    polyB = vertices.slice(NEW_INX, VERTEX_INX + 1);
                } else {
                    polyA = vertices.slice(VERTEX_INX, NEW_INX + 1);
                    polyB = [...vertices.slice(NEW_INX), ...vertices.slice(0, VERTEX_INX + 1)];
                }

                try {
                    let polysA = Geometry.subdividePolygonList(polyA);
                    let polysB = Geometry.subdividePolygonList(polyB);
                    return [...polysA, ...polysB];
                } catch (e) {
                    return [polyB, polyB];
                }
            } else return [vertices];

        } else return [vertices];
    }
    static subdividePolygon(poly) {
        return Geometry.subdividePolygonList(poly.vertices).map(v => new Polygon(v));
    }
    static intersectRayLine(o, r, l) {
        let result = null;
        const EPSILON = 0.0001;
        if (Math.abs(l.a.x - l.b.x) < EPSILON) {
            if (r.x) {
                let dx = r.x;
                let dy = r.y;
                let b = o.y - dy / dx * o.x;
                let x = l.a.x;
                let y = dy / dx * x + b;
                let minY = Math.min(l.a.y, l.b.y);
                let maxY = Math.max(l.a.y, l.b.y);
                if (y >= minY && y <= maxY) result = new Vector2(x, y);
            } else {
                if (o.x === l.a.x) result = new Vector2(o.x, Number.clamp(o.y, Math.min(l.a.y, l.b.y), Math.max(l.a.y, l.b.y)));
            }
        } else {
            if (Math.abs(r.x) > EPSILON) {
                let dx = r.x;
                let dy = r.y;
                let b = o.y - dy / dx * o.x;
                let dx2 = l.b.x - l.a.x;
                let dy2 = l.b.y - l.a.y;
                let b2 = l.a.y - dy2 / dx2 * l.a.x;
                let x = (b2 - b) / (dy / dx - dy2 / dx2);
                let minX = Math.min(l.a.x, l.b.x);
                let maxX = Math.max(l.a.x, l.b.x);
                if (x >= minX && x <= maxX) result = new Vector2(x, dy / dx * x + b);
            } else {
                let dx2 = l.b.x - l.a.x;
                let dy2 = l.b.y - l.a.y;
                let b2 = l.a.y - dy2 / dx2 * l.a.x;
                let x = o.x;
                let minX = Math.min(l.a.x, l.b.x);
                let maxX = Math.max(l.a.x, l.b.x);
                if (x >= minX && x <= maxX) result = new Vector2(x, dy2 / dx2 * x + b2);
            }
        }
        if (result && result.minus(o).dot(r) <= 0) result = null;
        return result;
    }
    static overlapLineLine(l1, l2) {
        let pol = Geometry.projectPointOntoLine;
        let dirs = [
            Vector2.fromAngle(l1.b.Vminus(l1.a).getAngle() + Math.PI / 2),
            Vector2.fromAngle(l2.b.Vminus(l2.a).getAngle() + Math.PI / 2),
        ];
        for (let dir of dirs) {
            let a = pol(l1.a, dir);
            let b = pol(l1.b, dir);
            let a2 = pol(l2.a, dir);
            let b2 = pol(l2.b, dir);
            if (b < a) [a, b] = [b, a];
            if (b2 < a2) [a2, b2] = [b2, a2];
            if (!(b > a2 && a < b2)) return false;
        }
        return true;
    }
    static overlapShapes(r1, r2) {
        return physicsAPIcollideShapes(r1, r2);
    }
    static overlapPoint(p, shape) {
        if (shape instanceof Circle) return Geometry.pointInsideCircle(p, shape);
        else return Geometry.pointInsidePolygon(p, shape);
    }
    // basic shapes
    
    // closest point
    static closestPointOnRect(point, rect) {
        return Vector2.clamp(point, rect.min, rect.max);
    }
    static closestPointOnCircle(p, circle) {
        let dif = new Vector2(p.x - circle.x, p.y - circle.y);
        dif.mag = circle.radius;
        dif.add(circle);
        return dif;
    }
    static closestPointOnPolygon(point, polygon) {
        let toB = polygon.middle.Vminus(point);
        let edges = polygon.getEdges().filter(e => {
            let v = e.b.Vminus(e.a).normal;
            return v.dot(toB) > 0;
        })
        let bestPoint = null;
        let bestDist = Infinity;
        for (let edge of edges) {
            let p = Geometry.closestPointOnLineObject(point, edge);
            let dist = Vector2.sqrDist(p, point);
            if (dist < bestDist) {
                bestDist = dist;
                bestPoint = p;
            }
        }
        return bestPoint;
    }
    // dist
    static distToRect(p, rect) {
        return Vector2.dist(p, Geometry.closestPointOnRect(p, rect));
    }
    static distToCircle(p, circle) {
        return Vector2.dist(p, Geometry.closestPointOnCircle(p, circle));
    }
    static distToPolygon(p, polygon) {
        return Vector2.dist(p, Geometry.closestPointOnPolygon(p, polygon));
    }
    // point inside
    static pointInsideRect(p, rect) {
        return p.x > rect.x && p.y > rect.y && p.x < rect.x + rect.width && p.y < rect.y + rect.height;
    }
    static pointInsideCircle(p, circle) {
        return Vector2.sqrDist(p, circle) < circle.radius ** 2;
    }
    static pointInsidePolygon(p, polygon) {
        let axes = [];
        let poly = polygon.vertices;
        for (let i = 0; i < poly.length; i++) {
            axes.push(poly[(i + 1) % poly.length].Vminus(poly[i]).normal.normalize())
        }
        for (let i = 0; i < axes.length; i++) {
            let axis = axes[i];
            let range = Range.fromValues(poly.map(v => v.dot(axis)));
            let proj = p.dot(axis);
            if (!range.includes(proj)) return false;
        }
        return true;
    }
    // overlap
    static overlapPolygonPolygon(polygon, polygon2) {
        return physicsAPIcollideShapes(polygon, polygon2);
    }
    static overlapRectRect(rect, rect2) {
        if (!rect || !rect2) return false;
        return rect.x < rect2.x + rect2.width && rect.x + rect.width > rect2.x && rect.y < rect2.y + rect2.height && rect.y + rect.height > rect2.y;
    }
    static overlapCircleCircle(circle, circle2) {
        return Vector2.sqrDist(circle, circle2) < (circle.radius + circle2.radius) ** 2;
    }
}