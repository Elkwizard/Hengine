class Geometry {
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
        return polygons.filter(poly => Geometry.isClockwise(poly));
    }
    static reimann(fn, a, b, iter = 1000, RRAM = false) {
        let sum = 0;
        let dif = (b - a) / iter;
        RRAM = +RRAM * dif;
        for (let i = 0; i < iter; i++) {
            sum += fn(dif * i + a + RRAM);
        }
        return sum * dif;
    }
    static reimannTerms(fn, a, b, iter = 1000, RRAM = false) {
        let sum = 0;
        let acc = [];
        let dif = (b - a) / iter;
        RRAM = +RRAM * dif;
        for (let i = 0; i < iter; i++) {
            let v = fn(dif * i + a + RRAM);
            sum += v;
            acc.push((v * dif).toFixed(3));
        }
        return acc.join(" + ") + " = " + (sum * dif).toFixed(3);
    }
    static distToLineObject(p, l) {
        let cp = Geometry.closestPointOnLineObject(p, l);
        return Geometry.distToPoint(p, cp);
    }
    static distToCircle(p, c) {
        return Math.sqrt(Geometry.distToPoint2(p, c)) - c.radius;
    }
    static distToPoint2(p, p2) {
        let dx = p2.x - p.x;
        let dy = p2.y - p.y;
        let sum = (dx ** 2) + (dy ** 2);
        return sum;
    }
    static distToPoint(p, p2) {
        return Math.sqrt(Geometry.distToPoint2(p, p2));
    }
    static closest(p, points) {
        let bestDist = Infinity;
        let best = null;
        for (let i = 0; i < points.length; i++) {
            let dist = Geometry.distToPoint2(points[i], p);
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
            let dist = Geometry.distToPoint2(points[i], p);
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
    static distToRect(p, r) {
        let d = Math.sqrt(Geometry.distToRect2);
        return d;
    }
    static distToRect2(p, r) {
        return Geometry.distToPoint2(p, Geometry.closestPointOnPolygon(p, r));
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
    static closestPointOnLineObjectInDirectionLimited(p, d, l) {
        let x1 = p.x;
        let y1 = p.y;
        let dx1 = d.x;
        let dy1 = d.y;
        let x2 = l.a.x;
        let y2 = l.a.y;
        let dx2 = l.b.x - l.a.x;
        let dy2 = l.b.y - l.a.y;
        if (!dx1) dx1 = 0.000001;
        if (!dx2) dx2 = 0.000001;
        let rightSide = (y1 - (dy1 / dx1) * x1) - (y2 - (dy2 / dx2) * x2);
        let leftCof = (dy2 / dx2) - (dy1 / dx1);
        const MIN = Math.min(l.a.x, l.a.x + dx2);
        const MAX = Math.max(l.a.x, l.a.x + dx2);
        let x = rightSide / leftCof;
        let outOfBounds = false;
        if (x < MIN || x > MAX) {
            outOfBounds = true;
            x = Number.clamp(x, MIN, MAX);
        }
        let y = (dy1 / dx1) * x + y1 - (dy1 / dx1) * x1;
        let dirX = x - p.x;
        let dirY = y - p.y;
        if (dirX * d.x + dirY * d.y < 0) outOfBounds = true;
        return { result: new Vector2(x, y), outOfBounds };
    }
    static closestPointOnCircle(p, cr) {
        let dif = new Vector2(p.x - cr.x, p.y - cr.y);
        dif.mag = cr.radius;
        dif.add(cr);
        return dif;
    }
    static closestPointOnPolygonInDirection(point, dir, r) {
        let edges = [];
        let corners = r.vertices;
        let bestPoint = null;
        let bestDist = Infinity;
        for (let i = 0; i < corners.length; i++) {
            let a = corners[i];
            let b = corners[(i + 1) % corners.length];
            edges.push(new Line(a, b));
        }
        for (let edge of edges) {
            let p = Geometry.closestPointOnLineObjectInDirectionLimited(point, dir, edge);
            if (!p.outOfBounds) {
                let dist = Geometry.distToPoint2(p, point);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestPoint = p;
                }
            }
        }
        return bestPoint;
    }
    static closestPointOnPolygon(point, r) {
        let toB = r.middle.Vminus(point);
        let edges = r.getEdges().filter(e => {
            let v = e.b.Vminus(e.a).normal;
            return v.dot(toB) > 0;
        })
        let bestPoint = null;
        let bestDist = Infinity;
        for (let edge of edges) {
            let p = Geometry.closestPointOnLineObject(point, edge);
            let dist = Geometry.distToPoint2(p, point);
            if (dist < bestDist) {
                bestDist = dist;
                bestPoint = p;
            }
        }
        return bestPoint;
    }
    static closestPointOnLineObject(p, l) {
        return p.Vminus(l.a).projectOnto(l.b.Vminus(l.a)).Vplus(l.a);
    }
    static closestPointOnLineObjectLimited(p, l) {
        let outOfBounds = false;
        if (l.b.y < l.a.y) [l.a, l.b] = [l.b, l.a];
        const A = l.a;
        const B = l.b;
        const SIGN_X = (A.x < B.x) ? -1 : 1;
        const SIGN_Y = (A.y < B.y) ? -1 : 1;
        if (Math.abs(A.x - B.x) < 0.001) A.x += SIGN_X * 0.0001;
        if (Math.abs(A.y - B.y) < 0.001) A.y += SIGN_Y * 0.0001;
        const MIN = Math.min(A.x, B.x);
        const MAX = Math.max(A.x, B.x);
        const m_1 = (B.y - A.y) / (B.x - A.x);
        const m_2 = (B.x - A.x) / (B.y - A.y);
        let X = (p.y + m_2 * p.x + m_1 * A.x - A.y) / (m_1 + m_2);
        if (X < MIN || X > MAX) {
            outOfBounds = true;
            X = Number.clamp(X, MIN, MAX);
        }
        const Y = m_1 * X + A.y - m_1 * A.x;
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
    static rotatePointAround(origin, point, angle) {
        let dif = new Vector2(point.x - origin.x, point.y - origin.y);
        let sin = Math.sin(angle);
        let cos = Math.cos(angle);
        let nDif = new Vector2(cos * dif.x - sin * dif.y, sin * dif.x + cos * dif.y);
        return new Vector2(origin.x + nDif.x, origin.y + nDif.y);
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
                // let ix = VERTEX.x;
                // let iy = VERTEX.y;

                // const dx_2 = (SEG.b.x - SEG.a.x) || EPSILON;
                // const dy_2 = (SEG.b.y - SEG.a.y) || EPSILON;
                // const b_2 = SEG.a.y - dy_2 / dx_2 * SEG.a.x;

                // ix = (b - b_2) / (dy_2 / dx_2 - dy / dx);
                // iy = dy / dx * ix + b;

                // const INTERSECT = new Vector2(ix, iy);
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
                // renderer.draw(Color.RED).circle(vertices[INX_A], 5);
                // renderer.draw(Color.RED).circle(vertices[INX_B], 5);
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

                // renderer.stroke(Color.PURPLE, 4).shape(...polyA);
                // renderer.stroke(Color.GREEN, 4).shape(...polyB);
                // console.log(NEW_INX);

                // renderer.draw(Color.ORANGE).circle(INTERSECT.point, 5);
                // renderer.draw(Color.YELLOW).circle(vertices[NEW_INX], 5);
                try {
                    let polysA = Geometry.subdividePolygonList(polyA);
                    let polysB = Geometry.subdividePolygonList(polyB);
                    return [...polysA, ...polysB];
                } catch (e) {
                    return [polyB, polyB];
                }
            } else return [vertices];

            // for (let seg of SEGMENTS) renderer.stroke(Color.PURPLE, 2).arrow(seg);

            // renderer.stroke(Color.ORANGE, 2).arrow(VERT_B, VERT_B.plus(AWAY.times(F)));

            // renderer.draw(convex ? Color.RED : Color.GREEN).circle(VERT_B, 3);
        } else return [vertices];
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
    static getMiddle(verts) {
        return Vector2.sum(verts).over(verts.length);
    }
    static isClockwise(verts) {
        //DAD_ALG
        if (verts.length < 3) return true;
        let bestY = Infinity;
        let best = null;
        for (let i = 0; i < verts.length; i++) {
            if (verts[i].y < bestY) {
                bestY = verts[i].y;
                best = verts[i];
            }
            if (best && verts[i].y === bestY && verts[i].x < best.x) best = verts[i]; 
        }
        if (!best) return true;

        let greater = false;
        for (let i = 0; i < verts.length; i++) {
            if (verts[i].x > best.x) {
                greater = true;
                break;
            }
        }
        let inxA = (verts.indexOf(best) + 1) % verts.length;
        if (greater) {
            let nextBestY = Infinity;
            let nextBest = null;
            for (let i = 0; i < verts.length; i++) {
                if (verts[i] !== best && verts[i].y < nextBestY && verts[i].x > best.x) {
                    nextBestY = verts[i].y;
                    nextBest = verts[i];
                }
            }
            let inxB = verts.indexOf(nextBest);
            return inxA === inxB;
        } else {
            let nextBestY = Infinity;
            let nextBest = null;
            for (let i = 0; i < verts.length; i++) {
                if (verts[i] !== best && verts[i].y < nextBestY) {
                    nextBestY = verts[i].y;
                    nextBest = verts[i];
                }
                if (nextBest && verts[i].y === nextBestY && verts[i].x < nextBest.x) nextBest = verts[i]; 
            }
            for (let i = 0; i < verts.length; i++)
                if (verts[i] !== best && verts[i].x > nextBest.x && i === inxA) return true;
            return false;
        }
    }
    static clockwise(verts) {
        return Geometry.isClockwise(verts) ? verts : [...verts].reverse();
    }
    static vertexDirection(verts) {
        let middle = Geometry.getMiddle(verts);
        let dif = 0;
        verts = verts.map(e => e.Vminus(middle).getAngle());
        for (let i = 0; i < verts.length - 1; i++) {
            dif += verts[i + 1] - verts[i];
        }
        return dif > 0;
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
    static isOverlapping(r1, r2) {
        if (r1.a) return Geometry.overlapLineLine(r1, r2);
        if (r1.radius === undefined) {
            if (r2.radius === undefined) {
                return Geometry.overlapRectRect(r1, r2)
            } else {
                return Geometry.overlapCircleRect(r2, r1);
            }
        } else {
            if (r2.radius === undefined) {
                return Geometry.overlapCircleRect(r1, r2)
            } else {
                return Geometry.overlapCircleCircle(r1, r2);
            }
        }
    }
    static overlapPoint(poly, p) {
        if (poly instanceof Circle) {
            let dx = p.x - poly.x;
            let dy = p.y - poly.y;
            return dx * dx + dy * dy < poly.radius ** 2;
        } else {
            let axes = [];
            poly = poly.vertices;
            for (let i = 0; i < poly.length; i++) {
                axes.push(poly[(i + 1) % poly.length].Vminus(poly[i]).normal.normalize())
            }
            let col = true;
            for (let i = 0; i < axes.length; i++) {
                let axis = axes[i];
                let min = Infinity;
                let max = -Infinity;
                for (let i = 0; i < poly.length; i++) {
                    let dot = poly[i].dot(axis);
                    if (dot < min) min = dot;
                    if (dot > max) max = dot;
                }
                let proj = p.dot(axis);
                if (proj < min || proj > max) return false;
            }
            return col;
        }
    }
    static pointInsideRect(p, r) {
        return p.x > r.x && p.y > r.y && p.x < r.x + r.width && p.y < r.y + r.height;
    }
    static pointInsideCircle(p, c) {
        return Geometry.distToPoint(p, c) ** 2 < c.radius ** 2;
    }
    static overlapCircleRect(c, r) {
        let dist = Geometry.distToRect2(c, r);
        let inside = Geometry.pointInsideRect(c, r);
        return (dist < c.radius ** 2) || inside;
    }
    static overlapShapes(poly, poly2) {
        if (r instanceof Rect) {
            
        } else {

        }
    }
    static overlapRectRect(r, r2) {
        if (!r || !r2) return false;
        return r.x < r2.x + r2.width && r.x + r.width > r2.x && r.y < r2.y + r2.height && r.y + r.height > r2.y;
    }
    static overlapCircleCircle(c, c2) {
        return Geometry.distToPoint2(c, c2) < (c.radius + c2.radius) ** 2;
    }
}
Geometry.displayRaymarch = false;
Geometry.maxRayMarchSteps = 50;