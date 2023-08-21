const RectPriority = defineEnum("SQUARE", "HORIZONTAL", "VERTICAL");

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
	static simplify(polygon, percent) {
		const period = Math.round(1 / percent);
		const vertices = [];
		for (let i = 0; i < polygon.vertices.length; i++)
			if (i % period === 0)
				vertices.push(polygon.vertices[i].get());
		return new Polygon(vertices);
	}
	static inflate(polygon, distance) {
		const edgeNormals = polygon
			.getEdges()
			.map(edge => edge.vector.normal.normalize());
		const vertices = [];
		const { length } = polygon.vertices;
		for (let i = 0; i < length; i++) {
			const left = edgeNormals[(i + length) % length];
			const right = edgeNormals[i];
			const inset = left.plus(right);
			if (inset.sqrMag) inset.mag = distance;
			const v = polygon.vertices[i].minus(inset);
			vertices.push(v);
		}
		return new Polygon(vertices);
	}
	static joinEdges(polygon, dtheta) {
		const edges = polygon.getEdges();
		let finalEdges = [];
		let lastAngle;
		for (let i = 0; i < edges.length; i++) {
			const edge = edges[i];
			if (!finalEdges.length || Math.abs(Geometry.signedAngularDist(edge.vector.angle, lastAngle)) > dtheta) {
				lastAngle = edge.vector.angle;
				finalEdges.push(edge);
			} else {
				const extend = finalEdges.last;
				extend.b = edge.b.minus(extend.a).projectOnto(extend.vector).plus(extend.a);
			}
		}
		return new Polygon(finalEdges.map(edge => edge.a));
	}
	static triangulate(shape) {
		let vertices = shape.vertices;
		const result = [];
		if (vertices.length < 3) return [];
		if (vertices.length === 3) return [[vertices[0], vertices[1], vertices[2]]];
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
	static gridToExactPolygons(sourceGrid, cellSize) {
		const grid = Array.dim(sourceGrid.length + 2, sourceGrid[0].length + 2);
	
		for (let i = 0; i < sourceGrid.length; i++)
		for (let j = 0; j < sourceGrid[0].length; j++)
			grid[i + 1][j + 1] = sourceGrid[i][j];

		const paths = Array.dim(grid.length, grid[0].length)
			.fill(null);
		
		for (let i = 1; i <= sourceGrid.length; i++)
		for (let j = 1; j <= sourceGrid[0].length; j++) {
			if (!grid[i][j]) continue;
			if (!grid[i][j - 1])
				paths[i][j] = Vector2.right;
			if (!grid[i][j + 1])
				paths[i + 1][j + 1] = Vector2.left;
			if (!grid[i - 1][j])
				paths[i][j + 1] = Vector2.up;
			if (!grid[i + 1][j])
				paths[i + 1][j] = Vector2.down;
		}

		for (let i = 0; i < sourceGrid.length; i++)
		for (let j = 0; j < sourceGrid[0].length; j++) {
			const a = grid[i][j];
			const b = grid[i + 1][j];
			const c = grid[i][j + 1];
			const d = grid[i + 1][j + 1];
			if (a !== b && a === d && b === c) {
				paths[i + 1][j + 1] = null;
			}
		}

		const polygons = [];

		for (let i = 0; i < paths.length; i++) 
		for (let j = 0; j < paths[0].length; j++) {
			if (!paths[i][j]) continue;

			const poly = [new Vector2(i, j)];

			let lastDir = null;
			while (true) {
				const { last } = poly;
				const { x, y } = last;
				let path = paths[x][y];
				let next;
				if (paths[x][y]) {
					next = last.plus(path);
					paths[x][y] = null;
				} else {
					path = lastDir.normal;
					next = last.plus(path);
				}
				if (next.equals(poly[0])) break;
				else poly.push(next);

				lastDir = path;
			}

			for (let n = 0; n < poly.length; n++)
				poly[n].sub(1);

			polygons.push(poly);
		}

		return polygons
			.filter(Geometry.isListClockwise)
			.map(poly => new Polygon(poly).scaleAbout(
				Vector2.origin, cellSize
			));
	}
	static isListClockwise(vertices) {
		let signedArea = 0;
		let length = vertices.length;
		for (let i = 0; i < length; i++) {
			let a = vertices[i];
			let b = vertices[(i + 1) % length];
			signedArea += (b.x - a.x) * (a.y + b.y);
		}
		return signedArea < 0;;
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
		return polygons
			.filter(Geometry.isListClockwise)
			.map(vertices => new Polygon(vertices));
	}
	static gridToRects(srcGrid, cellSize, priority = RectPriority.SQUARE) {
		const grid = [];
		for (let i = 0; i < srcGrid.length; i++) {
			grid.push([]);
			for (let j = 0; j < srcGrid[0].length; j++) grid[i].push(srcGrid[i][j]);
		}
		
		const rects = [];

		const validRect = (minX, minY, maxX, maxY) => {
			for (let i = minX; i <= maxX; i++)
			for (let j = minY; j <= maxY; j++)
				if (!grid[i]?.[j]) return false;
			return true;
		};

		const finishRect = (minX, minY, maxX, maxY) => {
			for (let ii = minX; ii <= maxX; ii++)
			for (let jj = minY; jj <= maxY; jj++)
				grid[ii][jj] = false;

			rects.push(new Rect(minX, minY, maxX - minX + 1, maxY - minY + 1));
		};
	

		switch (priority) {
			case RectPriority.HORIZONTAL:
			case RectPriority.SQUARE: {
				for (let i = 0; i < grid.length; i++)
				for (let j = 0; j < grid[0].length; j++) {
					if (grid[i][j]) {
						let maxX = i;
						let maxY = j;
			
						switch (priority) {
							case RectPriority.HORIZONTAL: {
								while (validRect(i, j, maxX, maxY)) maxX++;
								maxX--;
			
								while (validRect(i, j, maxX, maxY)) maxY++;
								maxY--;
							}; break;
							case RectPriority.SQUARE: {
								let change = 0;
								while (validRect(i, j, maxX, maxY)) {
									if (++change % 2) maxX++;
									else maxY++;
								}
								if (change % 2) maxX--;
								else maxY--;
							}; break;
						}
						
						finishRect(i, j, maxX, maxY);
					}
				}
			}; break;
			case RectPriority.VERTICAL: {
				for (let j = 0; j < grid[0].length; j++)
				for (let i = 0; i < grid.length; i++) {
					if (grid[i][j]) {
						let maxX = i;
						let maxY = j;
						while (validRect(i, j, maxX, maxY)) maxY++;
						maxY--;
						
						while (validRect(i, j, maxX, maxY)) maxX++;
						maxX--;

						finishRect(i, j, maxX, maxY);
					}
				}
			}; break;
		}
	
		return rects.map(rect => rect.scaleAbout(Vector2.origin, cellSize));
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
	static normalizeAngle(theta) {
		const pi2 = 2 * Math.PI;
		return (theta % pi2 + pi2) % pi2;
	}
	static signedAngularDist(r1, r2) {
		const pi2 = 2 * Math.PI;
		r1 = (r1 < 0) ? r1 % pi2 + pi2 : r1 % pi2;
		r2 = (r2 < 0) ? r2 % pi2 + pi2 : r2 % pi2;

		let diff = (r2 < r1) ? r1 - r2 : r2 - r1;

		if (Math.abs(diff - pi2) < Math.abs(diff))
			diff -= pi2;

		return (r2 < r1) ? diff : -diff;
	}
	static farthestInDirection(corners, dir) {
		let farthest = corners[0];
		let farthestDist = -Infinity;
		for (let i = 1; i < corners.length; i++) {
			const corner = corners[i];
			const dist = corner.x * dir.x + corner.y * dir.y;
			if (dist > farthestDist) {
				farthest = corner;
				farthestDist = dist;
			}
		}
		return farthest;
	}
	static rayCast(p, r, shapes) {
		let hit = null;
		let hitShape = null;
		let bestDist = Infinity;
		const EPSILON = 0.0001;
		for (let i = 0; i < shapes.length; i++) {
			const shape = shapes[i];
			let nHit = null;
			if (shape instanceof Circle) {
				let normal = r.normal;
				const projP = normal.dot(p);
				const projC = normal.dot(shape);
				if (Math.abs(projP - projC) < shape.radius && p.minus(shape).dot(r) <= 0) {
					const t = (projC + shape.radius - projP) / (shape.radius * 2);
					const upVec = r.inverse;
					const crossVec = upVec.normal;
					const baseP = shape.middle.sub(crossVec.times(shape.radius)).add(crossVec.times(t * shape.radius * 2));
					const y = Math.sqrt(1 - (2 * t - 1) ** 2);
					baseP.add(upVec.times(y * shape.radius));
					if (baseP.minus(p).dot(r) >= 0) nHit = baseP;
				}
			} else if (shape instanceof Polygon) {
				let bestDist = Infinity;
				let bestPoint = null;
				const edges = shape.getEdges().filter(edge => {
					let n = edge.vector.normal;
					return n.dot(r) >= 0 && Math.max(edge.a.minus(p).dot(r), edge.b.minus(p).dot(r)) > 0;
				});
				const { normal } = r;
				const dx = r.x;
				const dy = r.y || EPSILON;
				const b = p.y - p.x * dy / dx;
				for (let j = 0; j < edges.length; j++) {
					const edge = edges[j];
					const projP = normal.dot(p);
					let projA = normal.dot(edge.a);
					let projB = normal.dot(edge.b);
					if (projB < projA)
						[projA, projB] = [projB, projA];
					if (projP >= projA && projP <= projB) {
						const vec = edge.vector;
						const dx2 = vec.x || EPSILON;
						const dy2 = vec.y || EPSILON;
						const b2 = edge.a.y - edge.a.x * dy2 / dx2;
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
						const dist = (x - p.x) ** 2 + (y - p.y) ** 2;
						if (dist < bestDist) {
							bestDist = dist;
							bestPoint = new Vector2(x, y);
						}

					}
					nHit = bestPoint;
				}
			}
			if (nHit) {
				const nDist = (nHit.x - p.x) ** 2 + (nHit.y - p.y) ** 2;
				if (nDist < bestDist && nHit.minus(p).dot(r) >= 0) {
					hit = nHit;
					bestDist = nDist;
					hitShape = shape;
				}
			}
		}
		
		if (!hit)
			return null;
		
		return { hitPoint: hit, hitShape };
	}
	static subdividePolygonList(vertices) {
		vertices = Polygon.removeDuplicates(vertices);

		const getIndex = i => ((i % vertices.length) + vertices.length) % vertices.length;
		const get = i => vertices[getIndex(i)];

		const normals = new Array(vertices.length);
		const getNormal = i => normals[getIndex(i)];
		for (let i = 0; i < vertices.length; i++) {
			const a = get(i - 1);
			const b = get(i);
			normals[i] = a.minus(b).normal.normalize();
		}


		const edges = new Array(vertices.length);
		const getEdge = i => edges[getIndex(i)];
		for (let i = 0; i < vertices.length; i++)
			edges[i] = new Line(get(i - 1), get(i));


		function intersect(sourceIndex, ro, rd) {
			let best = null;
			let bestDist = Infinity;

			for (let i = 0; i < edges.length; i++) {
				if (i === sourceIndex || i === sourceIndex + 1) continue;
				const hit = Geometry.intersectRayLine(ro, rd, edges[i]);
				if (hit === null) continue;

				const dist = Vector2.sqrDist(hit, ro);
				if (dist < bestDist) {
					bestDist = dist;
					best = [i, hit];
				}
			}

			return best;
		}

		for (let i = 0; i < vertices.length; i++) {
			const v1 = getNormal(i);
			const v2 = getNormal(i + 1);
			const crs = v1.cross(v2);
			const convex = crs >= 0;
			if (!convex) { // shape isn't convex

				const ro = get(i);
				const rd = Vector2.avg([v1, v2]).invert();
				const result = intersect(i, ro, rd);

				if (!result) // concave vertex doesn't point to to anything?
					continue;// throw new Error("Poorly formed Polygon");

				const [index, point] = result;

				const sideA = [];
				for (let j = i; j !== index; j = getIndex(j + 1))
					sideA.push(get(j));

				const sideB = [point];
				for (let j = index; j !== i; j = getIndex(j + 1))
					sideB.push(get(j));

				sideB.push(sideA[0]);
				sideA.push(point);

				return [
					...Geometry.subdividePolygonList(sideA),
					...Geometry.subdividePolygonList(sideB)
				];

			}
		}

		return [vertices]; // already convex, go home
	}
	static subdividePolygon(poly) {
		return Geometry.subdividePolygonList(poly.vertices)
			.map(v => new Polygon(v));
	}
	static intersectRayLine(o, r, l) {
		let result = null;
		const EPSILON = 0.0001;
		if (Math.abs(l.a.x - l.b.x) < EPSILON) {
			if (Math.abs(r.x) > EPSILON) {
				let dx = r.x;
				let dy = r.y;
				let b = o.y - dy / dx * o.x;
				let x = l.a.x;
				let y = dy / dx * x + b;
				let minY = Math.min(l.a.y, l.b.y);
				let maxY = Math.max(l.a.y, l.b.y);
				if (y >= minY && y <= maxY) result = new Vector2(x, y);
			} else {
				if (Math.abs(o.x - l.a.x) <= EPSILON) result = new Vector2(o.x, Number.clamp(o.y, Math.min(l.a.y, l.b.y), Math.max(l.a.y, l.b.y)));
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
				if (x >= minX - EPSILON && x <= maxX + EPSILON) result = new Vector2(x, dy / dx * x + b);
			} else {
				let dx2 = l.b.x - l.a.x;
				let dy2 = l.b.y - l.a.y;
				let b2 = l.a.y - dy2 / dx2 * l.a.x;
				let x = o.x;
				let minX = Math.min(l.a.x, l.b.x);
				let maxX = Math.max(l.a.x, l.b.x);
				if (x >= minX - EPSILON && x <= maxX + EPSILON) result = new Vector2(x, dy2 / dx2 * x + b2);
			}
		}
		if (result && result.minus(o).dot(r) <= 0) result = null;
		return result;
	}
}