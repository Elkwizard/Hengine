class WebGLArtist {
	constructor(canvas, width, height, imageType, pixelRatio) {
		this.canvas = canvas;
		this.pixelRatio = pixelRatio;

		this.gl = defineWebGL2DContext();
		this.gl.create(canvas, true, pixelRatio);

		this.imageType = imageType;

		this.preservePixelart = true;
		this.alpha = 1;

		this.currentColor = Color.BLANK;
		this.currentLineWidth = 1;
		this.currentLineCap = this.gl.LINE_CAP_FLAT;
		this.currentLineJoin = this.gl.LINE_JOIN_MITER;

		this.lineJoinMap = new Map([
			[LineJoin.MITER, this.gl.LINE_JOIN_MITER],
			[LineJoin.BEVEL, this.gl.LINE_JOIN_BEVEL],
			[LineJoin.ROUND, this.gl.LINE_JOIN_ROUND]
		]);
		this.lineCapMap = new Map([
			[LineCap.FLAT, this.gl.LINE_CAP_FLAT],
			[LineCap.SQUARE, this.gl.LINE_CAP_SQUARE],
			[LineCap.ROUND, this.gl.LINE_CAP_ROUND]
		]);
		this.blendModeMap = new Map([
			[BlendMode.COMBINE, this.gl.BLEND_MODE_COMBINE],
			[BlendMode.ADD, this.gl.BLEND_MODE_ADD]
		]);
		this.currentTransform = Matrix3.identity();
		this.transformStack = [];
		this.alphaStack = [];

		this.resize(width, height);

		this.drawObj = {
			circle(x, y, radius) {
				if (typeof x === "object") {
					if (x.radius !== undefined) {
						radius = x.radius;
						y = x.y;
						x = x.x;
					} else {
						radius = y;
						y = x.y;
						x = x.x;
					}
				}
				this.gl.coloredEllipse(x, y, radius, radius, this.currentColor.red, this.currentColor.green, this.currentColor.blue, this.currentColor.alpha);
			},
			ellipse(x, y, rx, ry) {
				if (typeof x === "object") {
					ry = rx;
					rx = y;
					y = x.y;
					x = x.x;
				}
				this.gl.coloredEllipse(x, y, rx, ry, this.currentColor.red, this.currentColor.green, this.currentColor.blue, this.currentColor.alpha);
			},
			rect(x, y, width, height) {
				if (typeof x === "object") {
					height = x.height;
					width = x.width;
					y = x.y;
					x = x.x;
				}
				this.gl.coloredQuad(x, y, width, height, this.currentColor.red, this.currentColor.green, this.currentColor.blue, this.currentColor.alpha);
			},
			triangle(v1, v2, v3) {
				this.gl.coloredTriangle(v1.x, v1.y, v2.x, v2.y, v3.x, v3.y, this.currentColor.red, this.currentColor.green, this.currentColor.blue, this.currentColor.alpha);
			},
			shape(points) {
				if (points.vertices) points = points.vertices;
				if (points.length) {
					let vertices = [];
					for (let i = 0; i < points.length; i++) {
						vertices.push(points[i].x, points[i].y);
					}
					this.gl.coloredPolygon(vertices, this.currentColor.red, this.currentColor.green, this.currentColor.blue, this.currentColor.alpha);
				}
			},
			infer(obj) {
				if (obj.radius !== undefined) {
					this.drawObj.circle(obj);
				} else if (obj.width !== undefined) {
					this.drawObj.rect(obj);
				} else if (obj.vertices !== undefined) {
					this.drawObj.shape(obj.vertices);
				}
			}
		}
		for (let func in this.drawObj) {
			this.drawObj[func] = this.drawObj[func].bind(this);
		}
		this.strokeObj = {
			circle(x, y, radius) {
				if (typeof x === "object") {
					if (x.radius !== undefined) {
						radius = x.radius;
						y = x.y;
						x = x.x;
					} else {
						radius = y;
						y = x.y;
						x = x.x;
					}
				}
				this.gl.outlinedEllipse(x, y, radius, radius, this.currentLineWidth, this.currentColor.red, this.currentColor.green, this.currentColor.blue, this.currentColor.alpha);
			},
			ellipse(x, y, rx, ry) {
				if (typeof x === "object") {
					ry = rx;
					rx = y;
					y = x.y;
					x = x.x;
				}
				this.gl.outlinedEllipse(x, y, rx, ry, this.currentLineWidth, this.currentColor.red, this.currentColor.green, this.currentColor.blue, this.currentColor.alpha);
			},
			rect(x, y, width, height) {
				if (typeof x === "object") {
					height = x.height;
					width = x.width;
					y = x.y;
					x = x.x;
				}
				this.gl.outlinedQuad(x, y, width, height, this.currentLineWidth, this.currentColor.red, this.currentColor.green, this.currentColor.blue, this.currentColor.alpha);
			},
			triangle(v1, v2, v3) {
				this.gl.outlinedTriangle(v1.x, v1.y, v2.x, v2.y, v3.x, v3.y, this.currentLineWidth, this.currentLineJoin, this.currentColor.red, this.currentColor.green, this.currentColor.blue, this.currentColor.alpha);
			},
			connector(points) {
				if (points.length) {
					let vertices = [];
					for (let i = 0; i < points.length; i++) {
						vertices.push(points[i].x, points[i].y);
					}
					this.gl.lineSegments(vertices, this.currentLineWidth, this.currentLineCap, this.currentLineJoin, this.currentColor.red, this.currentColor.green, this.currentColor.blue, this.currentColor.alpha, false, false, false);
				}
			},
			spline(spline, prec = 100) {
				let inc = 1 / prec;
				let vertices = [spline.a.x, spline.a.y];
				for (let i = 0; i < 1; i += inc) {
					const p = spline.evaluate(i);
					vertices.push(p.x, p.y);
				}
				vertices.push(spline.d.x, spline.d.y);
				this.gl.lineSegments(vertices, this.currentLineWidth, this.currentLineCap, this.currentLineJoin, this.currentColor.red, this.currentColor.green, this.currentColor.blue, this.currentColor.alpha, false, false, false);
			},
			line(x, y, x1, y1) {
				if (typeof x == "object") {
					if (!x) return;
					if (x instanceof Line) {
						x1 = x.b.x;
						y1 = x.b.y;
						y = x.a.y;
						x = x.a.x;
					} else {
						x1 = y.x;
						y1 = y.y;
						y = x.y;
						x = x.x;
					}
				}
				this.gl.lineSegment(x, y, x1, y1, this.currentLineWidth, this.currentLineCap, this.currentColor.red, this.currentColor.green, this.currentColor.blue, this.currentColor.alpha);
			},
			arrow(x, y, x1, y1) {
				if (typeof x === "object") {
					if (x instanceof Line) {
						x1 = x.b.x;
						y1 = x.b.y;
						y = x.a.y;
						x = x.a.x;
					} else {
						x1 = y.x;
						y1 = y.y;
						y = x.y;
						x = x.x;
					}
				}
				let v_x = x1 - x;
				let v_y = y1 - y;
				let mag = Math.sqrt(v_x ** 2 + v_y ** 2);
				v_x /= mag;
				v_y /= mag;
				let n_x = -v_y;
				let n_y = v_x;
				this.gl.lineSegment(x, y, x1, y1, this.currentLineWidth, this.currentLineCap, this.currentColor.red, this.currentColor.green, this.currentColor.blue, this.currentColor.alpha);
				let l2 = this.currentLineWidth * 2;
				x1 -= v_x * l2;
				y1 -= v_y * l2;
				this.gl.coloredTriangle(
					x1 + n_x * l2, y1 + n_y * l2,
					x1 - n_x * l2, y1 - n_y * l2,
					x1 + v_x * l2 * 2, y1 + v_y * l2 * 2,
					this.currentColor.red, this.currentColor.green, this.currentColor.blue, this.currentColor.alpha
				);
			},
			shape(points) {
				if (points.vertices) points = points.vertices;
				if (points.length) {
					let vertices = [];
					for (let i = 0; i < points.length; i++) {
						vertices.push(points[i].x, points[i].y);
					}
					this.gl.outlinedPolygon(vertices, this.currentLineWidth, this.currentLineJoin, this.currentColor.red, this.currentColor.green, this.currentColor.blue, this.currentColor.alpha);
				}
			},
			infer(obj) {
				if (obj.radius !== undefined) {
					this.strokeObj.circle(obj);
				} else if (obj.radius !== undefined) {
					this.strokeObj.rect(obj);
				} else if (obj.vertices !== undefined) {
					this.strokeObj.shape(obj.vertices);
				} else if (obj instanceof Line) {
					this.strokeObj.line(obj);
				} else if (obj instanceof Spline) {
					this.strokeObj.spline(obj);
				}
			}
		}
		for (let func in this.strokeObj) {
			this.strokeObj[func] = this.strokeObj[func].bind(this);
		}
		this.currentImage = null;
		this.currentImageCIS = null; // Canvas Image Source
		this.imageObj = {
			circle(x, y, radius) {
				if (typeof x === "object") {
					if (x.radius !== undefined) {
						radius = x.radius;
						y = x.y;
						x = x.x;
					} else {
						radius = y;
						y = x.y;
						x = x.x;
					}
				}
				this.gl.texturedEllipse(x, y, radius, radius, 0, 0, 1, 1, this.currentImageCIS);
			},
			ellipse(x, y, rx, ry) {
				if (typeof x === "object") {
					ry = rx;
					rx = y;
					y = x.y;
					x = x.x;
				}
				this.gl.texturedEllipse(x, y, rx, ry, 0, 0, 1, 1, this.currentImageCIS);
			},
			rect(x, y, width, height) {
				if (typeof x === "object") {
					height = x.height;
					width = x.width;
					y = x.y;
					x = x.x;
				}
				this.gl.texturedQuad(x, y, width, height, 0, 0, 1, 1, this.currentImageCIS);
			},
			triangle(v1, v2, v3) {
				this.imageObj.shape([v1, v2, v3]);
			},
			warp(ax, ay, bx, by, cx, cy, dx, dy) {
				if (typeof ax === "object") {
					if (ax.vertices) [{ x: ax, y: ay }, { x: bx, y: by }, { x: cx, y: cy }, { x: dx, y: dy }] = ax.vertices;
					else {
						[ax, ay, bx, by, cx, cy, dx, dy] = [ax.x, ax.y, ay.x, ay.y, bx.x, bx.y, by.x, by.y];
					}
				}
				
				this.gl.texturedTriangle(ax, ay, bx, by, cx, cy, 0, 0, 1, 0, 1, 1, this.currentImageCIS);
				this.gl.texturedTriangle(ax, ay, dx, dy, cx, cy, 0, 0, 0, 1, 1, 1, this.currentImageCIS);
			},
			warpRegion(ax, ay, bx, by, cx, cy, dx, dy, tx, ty, tw, th) {
				const pixelRatio = this.currentImageCIS.width / this.currentImage.width;
				tx /= this.currentImageCIS.width / pixelRatio;
				ty /= this.currentImageCIS.height / pixelRatio;
				tw /= this.currentImageCIS.width / pixelRatio;
				th /= this.currentImageCIS.height / pixelRatio;
				this.gl.texturedTriangle(ax, ay, bx, by, cx, cy, tx, ty, tx + tw, ty, tx + tw, ty + th, this.currentImageCIS);
				this.gl.texturedTriangle(ax, ay, dx, dy, cx, cy, tx, ty, tx, ty + th, tx + tw, ty + th, this.currentImageCIS);
			},
			shape(points) {
				if (points.vertices) points = points.vertices;
				if (points.length) {
					let vertices = [];
					let textureVertices = [];
					let minX = Infinity;
					let minY = Infinity;
					let maxX = -Infinity;
					let maxY = -Infinity;
					for (let i = 0; i < points.length; i++) {
						const { x, y } = points[i];
						vertices.push(x, y);
						if (x < minX) minX = x;
						if (y < minY) minY = y;
						if (x > maxX) maxX = x;
						if (y > maxY) maxY = y;
					}
					let width = maxX - minX;
					let height = maxY - minY;
					for (let i = 0; i < vertices.length; i += 2) {
						textureVertices.push((vertices[i] - minX) / width, (vertices[i + 1] - minY) / height);
					}

					this.gl.texturedPolygon(vertices, textureVertices, this.currentImageCIS);
				}
			},
			default(x, y) {
				if (typeof x === "object") {
					y = x.y;
					x = x.x;
				}
				this.gl.texturedQuad(x, y, this.currentImage.width, this.currentImage.height, 0, 0, 1, 1, this.currentImageCIS);
			},
			inferHeight(x, y, w) {
				if (typeof x === "object") {
					w = y;
					y = x.y;
					x = x.x;
				}
				this.gl.texturedQuad(x, y, w, this.currentImage.inferHeight(w), 0, 0, 1, 1, this.currentImageCIS);
			},
			inferWidth(x, y, h) {
				if (typeof x === "object") {
					h = y;
					y = x.y;
					x = x.x;
				}
				this.gl.texturedQuad(x, y, this.currentImage.inferWidth(h), h, 0, 0, 1, 1, this.currentImageCIS);
			},
			infer(obj) {
				if (obj.radius !== undefined) {
					this.imageObj.circle(obj);
				} else if (obj.width !== undefined) {
					this.imageObj.rect(obj);
				} else if (obj.vertices !== undefined) {
					this.imageObj.shape(obj.vertices);
				}
			}
		};
		for (let func in this.imageObj) {
			this.imageObj[func] = this.imageObj[func].bind(this);
		}
	}
	get width() {
		return this.canvas.width / this.pixelRatio;
	}
	get height() {
		return this.canvas.height / this.pixelRatio;
	}
	get middle() {
		return new Vector2(this.width / 2, this.height / 2);
	}
	set preservePixelart(a) {
		this._preservePixelart = a;
		this.gl.setImageSmoothing(!a);
	}
	get preservePixelart() {
		return this._preservePixelart;
	}
	set blendMode(a) {
		this._blendMode = a;
		this.gl.setBlendMode(this.blendModeMap.get(a));

	}
	get blendMode() {
		return this._blendMode;
	}
	set alpha(a) {
		this._alpha = a;
		this.gl.setGlobalAlpha(a);
	}
	get alpha() {
		return this._alpha;
	}
	set transform(a) {
		this.gl.setTransform(a.get(this.currentTransform));
	}
	get transform() {
		return this.currentTransform.get();
	}
	resize(width, height) {
		let px = this.preservePixelart;
		let al = this.alpha;
		this.gl.resize(width, height);
		this.alpha = al;
		this.preservePixelart = px;
	}
	setCursor(cursor) {
		let style = this.canvas.style;
		if ("cursor" in style) style.cursor = cursor;
	}
	useColor(color) {
		this.currentColor = color;
	}
	draw(color) {
		this.useColor(color);
		return this.drawObj;
	}
	stroke(color, lineWidth = 1, lineCap = LineCap.FLAT, lineJoin = LineJoin.BEVEL) {
		this.useColor(color);
		this.currentLineWidth = lineWidth;
		this.currentLineCap = this.lineCapMap.get(lineCap);
		this.currentLineJoin = this.lineJoinMap.get(lineJoin);
		return this.strokeObj;
	}
	image(img) {
		this.currentImageCIS = img.makeImage();
		this.currentImage = img;
		return this.imageObj;
	}
	contentToFrame() {
		let n = new Frame(this.width, this.height);
		n.c.drawImage(this.canvas, 0, 0);
		return n;
	}
	clearTransformations() {
		this.gl.setTransform(Matrix3.identity(this.currentTransform));
		this.scale(this.pixelRatio);
	}
	invertX() {
		this.translate(this.width, 0);
		this.scale(-1, 1);
	}
	invertY() {
		this.translate(0, this.height);
		this.scale(1, -1);
	}
	translate(x, y) {
		if (typeof x == "object") {
			y = x.y;
			x = x.x;
		}
		// do translate
		const ct = this.currentTransform;

		// optimized matrix multiplication
		ct[6] += x * ct[0] + y * ct[3];
		ct[7] += x * ct[1] + y * ct[4];

		this.gl.setTransform(this.currentTransform);
	}
	scale(x, y = x) {
		if (typeof x == "object") {
			y = x.y;
			x = x.x;
		}

		// do scale

		const ct = this.currentTransform;

		// Matrix3.mulMatrix(
		// 	this.currentTransform,
			
		// 	[
		// 		x, 0, 0,
		// 		0, y, 0,
		// 		0, 0, 1,
		// 	], 
		// 	this.currentTransform
		// );

		// let m00 = ct[0] * x;
		// let m01 = ct[3] * y;
		// let m02 = ct[6];
		// let m10 = ct[1] * x;
		// let m11 = ct[4] * y;
		// let m12 = ct[7];
		// let m20 = ct[2] * x;
		// let m21 = ct[5] * y;
		// let m22 = ct[8];
		
		this.currentTransform[0] *= x;
		this.currentTransform[1] *= x;
		this.currentTransform[3] *= y;
		this.currentTransform[4] *= y;

		
		// Matrix3.create(
		// 	m00, m01, m02,
		// 	m10, m11, m12,
		// 	m20, m21, m22,
		// 	this.currentTransform
		// );

		this.gl.setTransform(this.currentTransform);
	}
	rotate(a) {
		// do rotate

		// optimized matrix multiplication
		const c = Math.cos(a);
		const s = Math.sin(a);

		const ct = this.currentTransform;
		
		const [m0, m1, m2, m3, m4, m5] = ct;
		
		ct[0] = m0 * c + m3 * s;
		ct[1] = m1 * c + m4 * s;
		ct[2] = m2 * c + m5 * s;
		ct[3] = -m0 * s + m3 * c;
		ct[4] = -m1 * s + m4 * c;
		ct[5] = -m2 * s + m5 * c;

		this.gl.setTransform(this.currentTransform);
	}
	save() {
		this.transformStack.push(this.currentTransform.get());
		this.alphaStack.push(this.alpha);
	}
	restore() {
		if (this.transformStack.length) {
			this.currentTransform = this.transformStack.pop();
			this.gl.setTransform(this.currentTransform);
			this.alpha = this.alphaStack.pop();
			this.gl.setGlobalAlpha(this.alpha);
		}
	}
	clear() {
		this.gl.clear();
	}
	beforeFrame() {
		this.clearTransformations();
		this.scale(this.pixelRatio, this.pixelRatio);
	}
	afterFrame() {

	}
	fill(color) {
		this.gl.coloredQuad(0, 0, this.width, this.height, color.red, color.green, color.blue, color.alpha);
	}
	rotateAround(x, y, r) {
		this.translate(x, y)
		this.rotate(r);
		this.translate(-x, -y);
	}
	drawWithAlpha(a, shape) {
		let prev = this.alpha;
		this.alpha *= a;
		shape();
		this.alpha = prev;
	}
}

class FastFrame extends ImageType {
	constructor(width, height, pixelRatio = __devicePixelRatio) {
		super(width, height);
		this.image = new_OffscreenCanvas(this.width * pixelRatio, this.height * pixelRatio);
		this.renderer = new WebGLArtist(this.image, this.width, this.height, this, pixelRatio);
	}
	resize(width, height) {
		this.renderer.resize(width, height);
	}
	stretch(w, h) {
		if (!h) h = this.inferHeight(w);
		let f = new FastFrame(w, h, this.renderer.pixelRatio);
		f.renderer.gl.texturedQuad(0, 0, w, h, 0, 0, 1, 1, this.makeImage());
		return f;
	}
	clip(x, y, w, h) {
		return FastFrame.fromImageType(this, x, y, w, h);
	}
	makeImage() {
		this.renderer.gl.render();
		return this.image;
	}
	get(f = new FastFrame(this.width, this.height, this.renderer.pixelRatio)) {
		f.renderer.resize(this.width, this.height);
		f.renderer.gl.texturedQuad(0, 0, this.width, this.height, 0, 0, 1, 1, this.makeImage());
		return f;
	}
	static fromImageType(img, x, y, w, h) {
		if (typeof x === "object") {
			h = x.height;
			w = x.width;
			y = x.y;
			x = x.x;
		}

		if (!x) x = 0;
		if (!y) y = 0;
		if (!w) w = img.width;
		if (!h) h = img.height;

		const offscreen = img.makeImage();
		let f = new FastFrame(w, h, offscreen.width / img.width);
		f.renderer.gl.texturedQuad(0, 0, w, h, x / img.width, y / img.height, w / img.width, h / img.height, offscreen);
		return f;
	}
}

if (!window.WebGL2RenderingContext || new_OffscreenCanvas(1, 1).getContext("webgl", { failIfMajorPerformanceCaveat: true }) === null) FastFrame = Frame;