class Geometry {
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
    static rayCastPolygons(rayOrigin, rayDir, polygons) {
        let lines = [];
        for (let polygon of polygons) lines.push(...polygon.getEdges());
        return Geometry.rayCastLines(rayOrigin, rayDir, lines);
    }
    static rayCastLines(rayOrigin, rayDir, lines) {
        let result = null;
        let outOfBounds = true;
        let minDist = Infinity;
        for (let l of lines) {
            let clos = Geometry.closestPointOnLineObjectInDirectionLimited(rayOrigin, rayDir, l);
            if (!clos.outOfBounds) {
                let p = clos.result;
                let dist = Geometry.distToPoint2(p, rayOrigin);
                if (dist < minDist) {
                    minDist = dist;
                    outOfBounds = false;
                    result = clos.result;
                }
            }
        }
        return { result, outOfBounds };
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
        let x = clamp(rightSide / leftCof, MIN, MAX);
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
            x = clamp(x, MIN, MAX);
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
        let corners = r.getCorners();
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
        const X = clamp((p.y + m_2 * p.x + m_1 * A.x - A.y) / (m_1 + m_2), MIN, MAX);
        const Y = m_1 * X + A.y - m_1 * A.x;
        return new Vector2(X, Y);
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
            X = clamp(X, MIN, MAX);
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
        // let a = dif.getAngle();
        // a += angle;
        // let nDif = Vector2.fromAngle(a);
        // nDif.mul(dif.mag);
        let sin = Math.sin(angle);
        let cos = Math.cos(angle);
        let nDif = new Vector2(cos * dif.x - sin * dif.y, sin * dif.x + cos * dif.y);
        return new Vector2(origin.x + nDif.x, origin.y + nDif.y);
    }
    static subdividePolygonList(polygon, direction) {
        let otherPolygons = [];
        let counter = polygon[1].x - polygon[0].x < 0;
        if (direction !== undefined) counter = !direction;
        let slice = null;
        let newPolygon = [...polygon];
        for (let i = 0; i < polygon.length; i++) {
            //recalculate edges
            let edges = [];
            for (let i = 0; i < polygon.length; i++) {
                let a = polygon[i];
                let b = polygon[(i + 1) % polygon.length];
                edges.push(new Line(a, b));
            }

            //everything else
            let point = polygon[i];
            let v1 = point.Vminus(polygon[(i + 1) % polygon.length]).normalize().inverse();
            let v2 = point.Vminus(polygon[(i - 1 + polygon.length) % polygon.length]).normalize().inverse();
            let a1 = v1.getAngle();
            let a2 = v2.getAngle();
            let dif = Math.abs(a2 - a1);
            if (a2 < a1) dif = Math.PI * 2 - dif;
            if (counter) dif = Math.PI * 2 - dif;
            if (dif > Math.PI) {
                let dir = v1.Vplus(v2).Nover(-2).normalize();
                let considerable = [];
                for (let j = 0; j < polygon.length; j++) if (j !== i && j !== (i - 1 + polygon.length) % polygon.length) {
                    edges[j].indices = [j, (j + 1) % polygon.length];
                    considerable.push(edges[j]);
                }
                let bestDist = Infinity;
                let bestPoint = null;
                let bestLine = null;
                for (let line of considerable) {
                    let bp = Geometry.closestPointOnLineObjectInDirectionLimited(point, dir, line);
                    if (!bp.outOfBounds) {
                        let dist = Geometry.distToPoint2(bp.result, point);
                        if (dist < bestDist) {
                            bestDist = dist;
                            bestPoint = bp.result;
                            bestLine = line;
                        }
                    }
                }
                if (bestPoint && bestLine) {
                    slice = new Line(bestPoint, point);
                    newPolygon.splice(bestLine.indices[1], 0, bestPoint);
                    break;
                }
            }
        }
        let leftOvers = newPolygon;
        let currentPolygon = [];
        function getIndex(corner) {
            for (let i = 0; i < leftOvers.length; i++) {
                if (leftOvers[i].equals(corner)) return i;
            }
            return 0;
        }
        if (slice) {
            currentPolygon = [slice.a];
            let otherPolygon = [slice.b];
            let indexA = getIndex(slice.a);
            let indexB = getIndex(slice.b);
            let currentIndex = indexA;
            while (currentIndex !== indexB) {
                currentIndex = (currentIndex + 1) % leftOvers.length;
                currentPolygon.push(leftOvers[currentIndex]);
            }
            while (currentIndex !== indexA) {
                currentIndex = (currentIndex + 1 + leftOvers.length) % leftOvers.length;
                otherPolygon.push(leftOvers[currentIndex]);
            }
            for (let point of currentPolygon) {
                leftOvers.splice(getIndex(point), 1);
            }
            let a = currentPolygon;
            let b = otherPolygon;
            otherPolygons.push(...Geometry.subdividePolygonList(a));
            otherPolygons.push(...Geometry.subdividePolygonList(b));
            return otherPolygons;
        } else return [polygon];
    }
    static subdividePolygon(polygon, direction) {
        return Geometry.subdividePolygonList(polygon.vertices, direction).map(e => new Polygon(e, 0));
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
        poly.cacheBoundingBox(poly.getBoundingBox());
        let col = Physics.collidePoint(poly, p);
        return col.colliding;
    }
    static overlapShapes(poly, poly2) {
        poly.cacheBoundingBox(poly.getBoundingBox());
        poly2.cacheBoundingBox(poly2.getBoundingBox());
        return Physics.collide(poly, poly2).colliding;
    }
    static pointInsideRectangle(p, r) {
        if (!r.rotation) {
            return p.x > r.x && p.y > r.y && p.x < r.x + r.width && p.y < r.y + r.height;
        } else {
            return Physics.collidePolygonPoint(r, p).colliding;
        }
    }
    static pointInsideCircle(p, c) {
        return Geometry.distToPoint(p, c) ** 2 < c.radius ** 2;
    }
    static overlapCircleRect(c, r) {
        let dist = Geometry.distToRect2(c, r);
        let inside = Geometry.pointInsideRectangle(c, r);
        return (dist < c.radius ** 2) || inside;
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