class WebGLArtist {
	constructor(canvas, width, height, imageType, pixelRatio) {
		this.canvas = canvas;
		this.pixelRatio = pixelRatio;

		this.gl = defineWebGL2DContext({}, true);
		this.gl.create(canvas, true, pixelRatio);

		this.imageType = imageType;

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

		this.preservePixelart = true;
		this.alpha = 1;
		this.blendMode = BlendMode.COMBINE;

		this.currentTransform = Matrix3.identity();
		this.transformStackPointer = 0;
		this.transformStack = [];
		this.alphaStack = [];

		this.resize(width, height);

		this.drawObj = {
			circle(x, y, radius) {
				if (typeof x === "object") {
					if (x.radius !== undefined) ({ x, y, radius } = x);
					else {
						radius = y;
						({ x, y } = x);
					}
				}
				this.gl.coloredEllipse(x, y, radius, radius, this.currentColor.red, this.currentColor.green, this.currentColor.blue, this.currentColor.alpha);
			},
			ellipse(x, y, rx, ry) {
				if (typeof x === "object") {
					ry = rx;
					rx = y;
					({ x, y } = x);
				}
				this.gl.coloredEllipse(x, y, rx, ry, this.currentColor.red, this.currentColor.green, this.currentColor.blue, this.currentColor.alpha);
			},
			rect(x, y, width, height) {
				if (typeof x === "object") ({ x, y, width, height } = x);
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
					if (x.radius !== undefined) ({ x, y, radius } = x);
					else {
						radius = y;
						({ x, y } = x);
					}
				}
				this.gl.outlinedEllipse(x, y, radius, radius, this.currentLineWidth, this.currentColor.red, this.currentColor.green, this.currentColor.blue, this.currentColor.alpha);
			},
			ellipse(x, y, rx, ry) {
				if (typeof x === "object") {
					ry = rx;
					rx = y;
					({ x, y } = x);
				}
				this.gl.outlinedEllipse(x, y, rx, ry, this.currentLineWidth, this.currentColor.red, this.currentColor.green, this.currentColor.blue, this.currentColor.alpha);
			},
			rect(x, y, width, height) {
				if (typeof x === "object") ({ x, y, width, height } = x);
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
				if (typeof x === "object") {
					if (x instanceof Line) {
						const { a, b } = x;
						x1 = b.x;
						y1 = b.y;
						y = a.y;
						x = a.x;
					} else {
						({ x: x1, y: y1 } = y);
						({ x, y } = x);
					}
				}
				this.gl.lineSegment(x, y, x1, y1, this.currentLineWidth, this.currentLineCap, this.currentColor.red, this.currentColor.green, this.currentColor.blue, this.currentColor.alpha);
			},
			arrow(x, y, x1, y1) {
				if (typeof x === "object") {
					if (x instanceof Line) {
						const { a, b } = x;
						x1 = b.x;
						y1 = b.y;
						y = a.y;
						x = a.x;
					} else {
						({ x: x1, y: y1 } = y);
						({ x, y } = x);
					}
				}
				this.gl.lineSegment(x, y, x1, y1, this.currentLineWidth, this.currentLineCap, this.currentColor.red, this.currentColor.green, this.currentColor.blue, this.currentColor.alpha);
				let v_x = x1 - x;
				let v_y = y1 - y;
				let mag = Math.sqrt(v_x ** 2 + v_y ** 2);
				v_x /= mag;
				v_y /= mag;
				let n_x = -v_y;
				let n_y = v_x;
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
					if (x.radius !== undefined) ({ x, y, radius } = x);
					else {
						radius = y;
						({ x, y } = x);
					}
				}
				this.gl.texturedEllipse(x, y, radius, radius, 0, 0, 1, 1, this.currentImageCIS);
			},
			ellipse(x, y, rx, ry) {
				if (typeof x === "object") {
					ry = rx;
					rx = y;
					({ x, y } = x);
				}
				this.gl.texturedEllipse(x, y, rx, ry, 0, 0, 1, 1, this.currentImageCIS);
			},
			rect(x, y, width, height) {
				if (typeof x === "object") ({ x, y, width, height } = x);
				this.gl.texturedQuad(x, y, width, height, 0, 0, 1, 1, this.currentImageCIS);
			},
			triangle(v1, v2, v3) {
				this.imageObj.shape([v1, v2, v3]);
			},
			warp(ax, ay, bx, by, cx, cy, dx, dy) {
				if (typeof ax === "object") {
					if (ax.vertices) [{ x: ax, y: ay }, { x: bx, y: by }, { x: cx, y: cy }, { x: dx, y: dy }] = ax.vertices;
					else [ax, ay, bx, by, cx, cy, dx, dy] = [ax.x, ax.y, ay.x, ay.y, bx.x, bx.y, by.x, by.y];
				}

				this.gl.texturedTriangle(ax, ay, bx, by, cx, cy, 0, 0, 1, 0, 1, 1, this.currentImageCIS);
				this.gl.texturedTriangle(ax, ay, dx, dy, cx, cy, 0, 0, 0, 1, 1, 1, this.currentImageCIS);
			},
			warpRegion(ax, ay, bx, by, cx, cy, dx, dy, tx, ty, tw, th) {
				if (typeof ax === "object") {
					if (ax.vertices) {
						({ x: tx, y: ty, width: tw, height: th } = ay);
						[{ x: ax, y: ay }, { x: bx, y: by }, { x: cx, y: cy }, { x: dx, y: dy }] = ax.vertices;
					} else {
						[tx, ty, tw, th] = [cx, cy, dx, dy];
						[ax, ay, bx, by, cx, cy, dx, dy] = [ax.x, ax.y, ay.x, ay.y, bx.x, bx.y, by.x, by.y];
					}
				}

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
				if (typeof x === "object") ({ x, y } = x);
				this.gl.texturedQuad(x, y, this.currentImage.width, this.currentImage.height, 0, 0, 1, 1, this.currentImageCIS);
			},
			inferHeight(x, y, width) {
				if (typeof x === "object") {
					width = y;
					({ x, y } = x);
				}
				this.gl.texturedQuad(x, y, width, this.currentImage.inferHeight(width), 0, 0, 1, 1, this.currentImageCIS);
			},
			inferWidth(x, y, height) {
				if (typeof x === "object") {
					height = y;
					({ x, y } = x);
				}
				this.gl.texturedQuad(x, y, this.currentImage.inferWidth(height), height, 0, 0, 1, 1, this.currentImageCIS);
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
		this.dummyImageObj = {};
		for (const func in this.imageObj) {
			this.imageObj[func] = this.imageObj[func].bind(this);
			this.dummyImageObj[func] = () => undefined;
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
	drawThrough(transform, draw) {
		this.save();
		this.transform = transform;
		draw();
		this.restore();
	}
	resize(width, height) {
		this.gl.resize(width, height);
	}
	multiplyTransform(newTransform) {
		this.gl.setTransform(this.currentTransform.times(newTransform, this.currentTransform));
	}
	setCursor(cursor) {
		const { style } = this.canvas;
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
	image(img, changed = false) {
		this.currentImage = img;
		this.currentImageCIS = img.makeWebGLImage();
		if (!this.currentImage.renderable) return this.dummyImageObj;
		if (changed) this.gl.updateTextureCache(this.currentImageCIS);
		return this.imageObj;
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
		if (typeof x === "object") ({ x, y } = x);

		// do translate
		const ct = this.currentTransform;

		// optimized matrix multiplication
		ct[6] += x * ct[0] + y * ct[3];
		ct[7] += x * ct[1] + y * ct[4];

		this.gl.setTransform(this.currentTransform);
	}
	scale(x, y = x) {
		if (typeof x === "object") ({ x, y } = x);

		// do scale

		// optimized matrix multiplication	
		const ct = this.currentTransform;
		ct[0] *= x;
		ct[1] *= x;
		ct[3] *= y;
		ct[4] *= y;

		this.gl.setTransform(this.currentTransform);
	}
	rotate(a) {
		// do rotate

		// optimized matrix multiplication
		const c = Math.cos(a);
		const s = Math.sin(a);

		const ct = this.currentTransform;

		const m0 = ct[0];
		const m1 = ct[1];
		const m2 = ct[2];
		const m3 = ct[3];
		const m4 = ct[4];
		const m5 = ct[5];

		ct[0] = m0 * c + m3 * s;
		ct[1] = m1 * c + m4 * s;
		ct[2] = m2 * c + m5 * s;
		ct[3] = m3 * c - m0 * s;
		ct[4] = m4 * c - m1 * s;
		ct[5] = m5 * c - m2 * s;

		this.gl.setTransform(this.currentTransform);
	}
	save() {
		const index = this.transformStackPointer++;
		this.transformStack[index] = this.currentTransform.get(this.transformStack[index]);
		this.alphaStack.push(this.alpha);
	}
	restore() {
		if (this.transformStackPointer) {
			this.transformStack[--this.transformStackPointer].get(this.currentTransform);
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

/**
 * This class has the same behavior as Frame, except that the renderer for this class cannot render text or concave polygons.
 * Creating instances of this class is drastically more expensive than creating a Frame, but after it's created, it is generally 10x-100x faster than Frame.
 * Since this is implemented using WebGL, creating a high number of instances of this class should be avoided to prevent context-switching overhead.
 */
class FastFrame extends ImageType {
	constructor(width, height, pixelRatio = __devicePixelRatio) {
		super(width, height, pixelRatio);
		this.image = new_OffscreenCanvas(this.pixelWidth, this.pixelHeight);
		this.renderer = new WebGLArtist(this.image, this.width, this.height, this, pixelRatio);
	}
	onresize(width, height) {
		this.renderer.resize(width, height);
	}
	stretch(w, h) {
		if (!h) h = this.inferHeight(w);
		let f = new FastFrame(w, h, this.pixelRatio);
		f.renderer.gl.texturedQuad(0, 0, w, h, 0, 0, 1, 1, this.makeWebGLImage());
		return f;
	}
	clip(x, y, width, height) {
		return FastFrame.fromImageType(this, x, y, width, height);
	}
	makeImage() {
		this.renderer.gl.render();
		return this.image;
	}
	get(f = new FastFrame(this.width, this.height, this.pixelRatio)) {
		f.renderer.resize(this.width, this.height);
		f.renderer.gl.texturedQuad(0, 0, this.width, this.height, 0, 0, 1, 1, this.makeWebGLImage());
		return f;
	}
	static fromImageType(img, x, y, width, height) {
		if (typeof x === "object") ({ x, y, width, height } = x);

		x ??= 0;
		y ??= 0;
		width ??= img.width;
		height ??= img.height;

		const offscreen = img.makeWebGLImage();
		const frame = new FastFrame(width, height, offscreen.width / img.width);
		frame.renderer.gl.texturedQuad(0, 0, width, height, x / img.width, y / img.height, width / img.width, height / img.height, offscreen);
		return frame;
	}
}

if (!window.WebGLRenderingContext || new_OffscreenCanvas(1, 1).getContext("webgl", { failIfMajorPerformanceCaveat: true }) === null) FastFrame = Frame;