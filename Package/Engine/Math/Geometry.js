class Geometry {
    static distToLine(p, l) {
        if (l.b.y < l.a.y) [l.a, l.b] = [l.b, l.a];
        let min = Math.min(l.a.x, l.b.x);
        let max = Math.max(l.a.x, l.b.x);
        let dx = l.b.x - l.a.x;
        let dy = l.b.y - l.a.y;
        let b = l.a.y - l.a.x * (dy / dx);
        let x1 = p.x;
        let y1 = p.y;
        let pX = ((dx / dy) * x1 - b + y1) / ((dy * dy + dx * dx) / (dx * dy));
        if (pX < min) pX = min;
        if (pX > max) pX = max;
        let pY = (dy / dx) * pX + b;
        return Geometry.distToPoint(p, new Vector2(pX, pY));
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
    static distToRect(p, r) {
        let d = Geometry.distToPoint(p, Geometry.closestPointOnRectangle(p, r));//Math.sqrt(Geometry.distToRect2(p, r));
        return d;
    }
    static distToRect2(p, r) {
        let ax = p.x - (r.x + r.width / 2);
        let ay = p.y - (r.y + r.height / 2);
        let dx = Math.max(Math.abs(ax) - (r.width / 2), 0);
        let dy = Math.max(Math.abs(ay) - (r.height / 2), 0);
        return (dx ** 2) + (dy ** 2);
    }
    static projectPointOntoLine(p, d) {
		/* --My Own Personal Derivation--
		let x1 = p.x;
		let y1 = p.y;
		let dx = d.x;
		let dy = d.y;
		if (!dx) dx = 0.000000001;
		let xv = ((dx**2) * x1 + (dx * dy * y1)) / (dx**2 + dy**2);
		let yv = (dy / dx) * xv;
		let xrs = Math.sign(xv);
		let xr = Math.sqrt(xv ** 2 + yv ** 2);
		let xfv = xrs * xr;
		//return xfv;*/
        // --Dot Product--
        return p.x * d.x + p.y * d.y;
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
        let x = rightSide / leftCof;
        let y = (dy1 / dx1) * x + y1 - (dy1 / dx1) * x1;
        return new Vector2(x, y);
    }
    static closestPointOnCircle(p, cr) {
        let dif = new Vector2(p.x - cr.x, p.y - cr.y);
        dif.mag = cr.radius;
        dif.add(cr);
        return dif;
    }
    static closestPointOnRectangle(point, r) {
        if (!r.rotation) r.rotation = 0.001;
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
            let p = Geometry.closestPointOnLineObject(point, edge);
            let dist = g.f.getDistance(p, point);
            if (dist < bestDist) {
                bestDist = dist;
                bestPoint = p;
            }
        }
        return bestPoint;
    }
    static closestPointOnLineObject(p, l) {
        if (l.b.y < l.a.y) [l.a, l.b] = [l.b, l.a];
        let min = Math.min(l.a.x, l.b.x);
        let max = Math.max(l.a.x, l.b.x);
        let dx = l.b.x - l.a.x;
        let dy = l.b.y - l.a.y;
        if (!dx) dx = 0.0000001;
        if (!dy) dy = 0.0000001;
        let b = l.a.y - l.a.x * (dy / dx);
        let x1 = p.x;
        let y1 = p.y;
        let pX = ((dx / dy) * x1 - b + y1) / ((dy * dy + dx * dx) / (dx * dy));
        if (pX < min) pX = min;
        if (pX > max) pX = max;
        let pY = (dy / dx) * pX + b;
        return new Vector2(pX, pY);
    }
    static closestPointOnLine(p, d) {
        let x1 = p.x;
        let y1 = p.y;
        let dx = d.x;
        let dy = d.y;
        if (!dx) dx = 0.000000001;
        let xv = ((dx ** 2) * x1 + (dx * dy * y1)) / (dx ** 2 + dy ** 2);
        let yv = (dy / dx) * xv;
        return new Vector2(xv, yv);
    }
    static rayCast(ray, rs, threshold = 100000) {
        let result = [];
        for (let i = 0; i < rs.length; i++) {
            let r = rs[i];
            if (r instanceof PhysicsObject && !(r instanceof CirclePhysicsObject) && r.rotation) {
                let cs = r.getCorners();
                let edges = [
                    new Line(cs[0], cs[1]),
                    new Line(cs[1], cs[2]),
                    new Line(cs[2], cs[3]),
                    new Line(cs[3], cs[0]),
                ];
                for (let edge of edges) edge.shape = r;
                result.push(...edges);
            } else result.push(r);
        }
        rs = result;
        let o = ray.a;
        let origin = new Vector2(ray.a.x, ray.a.y);
        let slope = new Vector2(ray.b.x - ray.a.x, ray.b.y - ray.a.y).normalize();
        if (!slope.x && !slope.y) return { error: "no direction" };
        let minDist = Infinity;
        let steps = 0;
        let maxSteps = Geometry.maxRayMarchSteps;
        let collided = null;
        for (let r of rs) {
            let d;
            if (r.collider instanceof RectCollider) {
                d = Geometry.distToRect(o, r);
            } else if (r.collider instanceof CircleCollider) {
                d = Geometry.distToCircle(o, r);
            } else {
                d = Geometry.distToLine(o, r);
            }
            if (d <= 0) return { error: "inside shape", collidedShape: r, collisionPoint: o };
        }
        while (minDist > 0.1 && steps < maxSteps) {
            minDist = Infinity;
            steps++;
            for (let r of rs) {
                let d;
                if (r.collider instanceof RectCollider) {
                    d = Geometry.distToRect(o, r);
                } else if (r.collider instanceof CircleCollider) {
                    d = Geometry.distToCircle(o, r);
                } else {
                    d = Geometry.distToLine(o, r);
                }
                if (d < minDist) {
                    minDist = d;
                    collided = r;
                }
            }
            if (g.f.getDistance(o, origin) > threshold) {
                o = origin.add((new Vector2(threshold, threshold)).mul(slope));
                steps = maxSteps;
                break;
            }
            if (Geometry.displayRaymarch) c.draw(new Color(255, 255, 255, 0.2)).circle(o.x, o.y, minDist);
            o.x += slope.x * minDist;
            o.y += slope.y * minDist;
        }
        if (steps >= maxSteps) {
            return { collisionPoint: o, collidedShape: collided, error: "no collision" };
        }
        let collidedEdge = null;
        if (collided instanceof Line && collided.shape) {
            collidedEdge = new Line(collided.a, collided.b);
            collided = collided.shape;
        }
        if (collided instanceof Line) {
            return { collisionPoint: o, collidedShape: collided, collidedEdge: collided };
        } else {
            if (collidedEdge) {
                return { collisionPoint: o, collidedShape: collided, collidedEdge: collidedEdge };
            } else return { collisionPoint: o, collidedShape: collided };
        }
    }
    static rayCastBounce(ray, objects, threshold, bounces) {
        let collisionPoints = [];
        let collidedShapes = [];
        let firstCast = Geometry.rayCast(ray, objects, threshold);
        collisionPoints.push(firstCast.collisionPoint);
        collidedShapes.push(firstCast.collidedShape);
        if (firstCast.error == "no collision" || firstCast.error) return {
            error: "no collision",
            collidedShapes,
            collisionPoints
        }
        const getResult = () => ({
            error: "",
            collidedShapes,
            collisionPoints
        });
        if (bounces > 1) {
            let lastResult = firstCast;
            let lastRay = ray;
            for (let bounce = 1; bounce < bounces; bounce++) {
                let shape = lastResult.collidedShape;
                let source = lastResult.collisionPoint;
                let v;
                let p = source;
                if (shape.collider instanceof CircleCollider) {
                    let dir = p.minus({ x: shape.collider.x, y: shape.collider.y });
                    v = dir;
                } else {
                    let ce = lastResult.collidedEdge;
                    let angle = ce.b.minus(ce.a).getAngle();
                    let angle2 = lastRay.b.minus(lastRay.a).getAngle();
                    let correctAngle = angle;
                    if (Math.abs(correctAngle - angle2) > Math.abs(angle2 - correctAngle - Math.PI)) correctAngle += Math.PI;
                    let dif = angle2 - correctAngle;
                    let cor = Math.PI - dif;
                    v = Vector2.fromAngle(cor + correctAngle);
                }
                let line = new Line(source.plus(v), v.times(2).plus(source));
                let cast = Geometry.rayCast(line, objects, threshold);
                collisionPoints.push(cast.collisionPoint);
                collidedShapes.push(cast.collidedShape);
                if (cast.error == "no collision" || cast.error) return getResult();
                lastResult = cast;
                lastRay = line;
            }
        }
        return getResult();
    }
    static rotatePointAround(origin, point, angle) {
        let dif = new Vector2(point.x - origin.x, point.y - origin.y);
        let a = dif.getAngle();
        a += angle;
        let nDif = Vector2.fromAngle(a);
        nDif.mag = dif.mag;
        return new Vector2(origin.x + nDif.x, origin.y + nDif.y);
    }
    static overlapLineLine(l1, l2) {
        let pol = Geometry.projectPointOntoLine;
        let dirs = [
            Vector2.fromAngle(l1.b.minus(l1.a).getAngle() + Math.PI / 2),
            Vector2.fromAngle(l2.b.minus(l2.a).getAngle() + Math.PI / 2),
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
    static pointInsideRectangle(p, r) {
        if (!r.rotation) {
            return p.x > r.x && p.y > r.y && p.x < r.x + r.width && p.y < r.y + r.height;
        } else {
            let col = new RectCollider(r);
            return col.collidePoint(p.x, p.y);
        }
    }
    static overlapCircleRect(c, r) {
        let dist = Geometry.distToRect2(c, r);
        let inside = Geometry.pointInsideRectangle(c, r);
        return (dist < c.radius ** 2) || inside;
    }
    static overlapRectRect(r, r2) {
        return r.x < r2.x + r2.width && r.x + r.width > r2.x && r.y < r2.y + r2.height && r.y + r.height > r2.y;
    }
    static overlapCircleCircle(c, c2) {
        return Geometry.distToPoint2(c, c2) < (c.radius + c2.radius) ** 2;
    }
}
Geometry.displayRaymarch = false;
Geometry.maxRayMarchSteps = 50;