class WebGLArtist {
	constructor(canvas, width, height, imageType, onresize = () => null) {
		this.canvas = canvas;

		this.onresize = onresize;

		this.gl = defineWebGL2DContext();
		this.gl.create(canvas);

		this.imageType = imageType || new ArtistImage(this);

		this.preservePixelart = true;
		this.alpha = 1;
		this.textMode = TextMode.TOP_LEFT;

		this.currentRed = 0;
		this.currentGreen = 0;
		this.currentBlue = 0;
		this.currentAlpha = 0;
		this.currentColor = Color.BLANK;
		this.currentLineWidth = 1;
		this.currentTransform = Matrix3.identity();
		this.transformStack = [];

		this.resize(width, height, false);

		this.drawObj = {
			circle(x, y, radius) {
				if (typeof x === "object") {
					radius = y;
					y = x.y;
					x = x.x;
				}
				this.gl.coloredEllipse(x, y, radius, radius, this.currentRed, this.currentGreen, this.currentBlue, this.currentAlpha);
			},
			ellipse(x, y, rx, ry) {
				if (typeof x === "object") {
					ry = rx;
					rx = y;
					y = x.y;
					x = x.x;
				}
				this.gl.coloredEllipse(x, y, rx, ry, this.currentRed, this.currentGreen, this.currentBlue, this.currentAlpha);
			},
			rect(x, y, width, height) {
				if (typeof x === "object") {
					height = x.height;
					width = x.width;
					y = x.y;
					x = x.x;
				}
				this.gl.coloredQuad(x, y, width, height, this.currentRed, this.currentGreen, this.currentBlue, this.currentAlpha);
			},
			triangle(v1, v2, v3) {
				this.gl.coloredTriangle(v1.x, v1.y, v2.x, v2.y, v3.x, v3.y, this.currentRed, this.currentGreen, this.currentBlue, this.currentAlpha);
			},
			shape(points) {
				if (points.vertices) points = points.vertices;
				if (points.length) {
					let vertices = [];
					for (let i = 0; i < points.length; i++) {
						vertices.push(points[i].x, points[i].y);
					}
					this.gl.coloredPolygon(vertices, this.currentRed, this.currentGreen, this.currentBlue, this.currentAlpha);
				}
			},
			infer(obj) {
				if (obj.radius !== undefined) {
					this.draw(this.currentColor).circle(obj);
				} else if (obj.width !== undefined) {
					this.draw(this.currentColor).rect(obj);
				} else if (obj.vertices !== undefined) {
					this.draw(this.currentColor).shape(obj.vertices);
				}
			}
		}
		for (let func in this.drawObj) {
			this.drawObj[func] = this.drawObj[func].bind(this);
		}
		this.strokeObj = {
			circle(x, y, radius) {
				if (typeof x === "object") {
					radius = y;
					y = x.y;
					x = x.x;
				}
				this.gl.outlinedEllipse(x, y, radius, radius, this.currentLineWidth, this.currentRed, this.currentGreen, this.currentBlue, this.currentAlpha);
			},
			ellipse(x, y, rx, ry) {
				if (typeof x === "object") {
					ry = rx;
					rx = y;
					y = x.y;
					x = x.x;
				}
				this.gl.outlinedEllipse(x, y, rx, ry, this.currentLineWidth, this.currentRed, this.currentGreen, this.currentBlue, this.currentAlpha);
			},
			rect(x, y, width, height) {
				if (typeof x === "object") {
					height = x.height;
					width = x.width;
					y = x.y;
					x = x.x;
				}
				this.gl.outlinedQuad(x, y, width, height, this.currentLineWidth, this.currentRed, this.currentGreen, this.currentBlue, this.currentAlpha);
			},
			triangle(v1, v2, v3) {
				this.gl.outlinedTriangle(v1.x, v1.y, v2.x, v2.y, v3.x, v3.y, this.currentLineWidth, this.currentRed, this.currentGreen, this.currentBlue, this.currentAlpha);
			},
			connector(points) {
				if (points.length) {
					let vertices = [];
					for (let i = 0; i < points.length; i++) {
						vertices.push(points[i].x, points[i].y);
					}
					this.gl.lineSegments(vertices, this.currentLineWidth, this.currentRed, this.currentGreen, this.currentBlue, this.currentAlpha, false, false, false);
				}
			},
			spline(spline, prec = 100) {
				let inc = 1 / prec;
				let vertices = [spline.a.x, spline.a.y];
				for (let i = 0; i < 1; i += inc) {
					const p = spline.getPoint(i);
					vertices.push(p.x, p.y);
				}
				vertices.push(spline.b.x, spline.b.y);
				this.gl.lineSegments(vertices, this.currentLineWidth, this.currentRed, this.currentGreen, this.currentBlue, this.currentAlpha, false, false, false);
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
				this.gl.lineSegment(x, y, x1, y1, this.currentLineWidth, this.currentRed, this.currentGreen, this.currentBlue, this.currentAlpha);
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
				this.c.beginPath();
				this.c.moveTo(x, y);
				this.c.lineTo(x1, y1);
				this.c.stroke();
				this.c.fillStyle = this.c.strokeStyle;
				let l2 = this.c.lineWidth * 2;
				this.c.beginPath();
				x1 -= v_x * l2;
				y1 -= v_y * l2;
				this.c.moveTo(x1 + n_x * l2, y1 + n_y * l2);
				this.c.lineTo(x1 - n_x * l2, y1 - n_y * l2);
				this.c.lineTo(x1 + v_x * l2 * 2, y1 + v_y * l2 * 2);
				this.c.lineTo(x1 + n_x * l2, y1 + n_y * l2);
				this.c.fill();
			},
			shape(points) {
				if (points.vertices) points = points.vertices;
				if (points.length) {
					let vertices = [];
					for (let i = 0; i < points.length; i++) {
						vertices.push(points[i].x, points[i].y);
					}
					this.gl.outlinedPolygon(vertices, this.currentLineWidth, this.currentRed, this.currentGreen, this.currentBlue, this.currentAlpha);
				}
			},
			infer(obj) {
				if (obj.radius !== undefined) {
					this.stroke(this.currentColor, this.currentLineWidth).circle(obj);
				} else if (obj.radius !== undefined) {
					this.stroke(this.currentColor, this.currentLineWidth).rect(obj);
				} else if (obj.vertices !== undefined) {
					this.stroke(this.currentColor, this.currentLineWidth).shape(obj.vertices);
				} else if (obj instanceof Line) {
					this.stroke(this.currentColor, this.currentLineWidth).line(obj);
				} else if (obj instanceof Spline) {
					this.stroke(this.currentColor, this.currentLineWidth).spline(obj);
				}
			}
		}
		for (let func in this.strokeObj) {
			this.strokeObj[func] = this.strokeObj[func].bind(this);
		}
		this.currentImage = null;
		this.imageObj = {
			circle(x, y, radius) {
				if (typeof x === "object") {
					radius = y;
					y = x.y;
					x = x.x;
				}
				this.gl.texturedEllipse(x, y, radius, radius, 0, 0, 1, 1, this.currentImage.makeImage());
			},
			ellipse(x, y, rx, ry) {
				if (typeof x === "object") {
					ry = rx;
					rx = y;
					y = x.y;
					x = x.x;
				}
				this.gl.texturedEllipse(x, y, rx, ry, 0, 0, 1, 1, this.currentImage.makeImage());
			},
			rect(x, y, width, height) {
				if (typeof x === "object") {
					height = x.height;
					width = x.width;
					y = x.y;
					x = x.x;
				}
				this.gl.texturedQuad(x, y, width, height, 0, 0, 1, 1, this.currentImage.makeImage());
			},
			triangle(v1, v2, v3) {
				this.imageObj.shape([v1, v2, v3]);
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

					this.gl.texturedPolygon(vertices, textureVertices, this.currentImage.makeImage());
				}
			},
			default(x, y) {
				if (typeof x === "object") {
					y = x.y;
					x = x.x;
				}
				this.texturedQuad(x, y, this.currentImage.width, this.currentImage.height, 0, 0, 1, 1, this.currentImage.makeImage());
			},
			inferHeight(x, y, w) {
				if (typeof x === "object") {
					w = y;
					y = x.y;
					x = x.x;
				}
				this.gl.texturedQuad(x, y, w, this.currentImage.inferHeight(w), 0, 0, 1, 1, this.currentImage.makeImage());
			},
			inferWidth(x, y, h) {
				if (typeof x === "object") {
					h = y;
					y = x.y;
					x = x.x;
				}
				this.gl.texturedQuad(x, y, this.currentImage.inferWidth(h), h, 0, 0, 1, 1, this.currentImage.makeImage());
			},
			infer(obj) {
				if (obj.radius !== undefined) {
					this.image(this.currentImage).circle(obj);
				} else if (obj.width !== undefined) {
					this.image(this.currentImage).rect(obj);
				} else if (obj.vertices !== undefined) {
					this.image(this.currentImage).shape(obj.vertices);
				}
			}
		};
		for (let func in this.imageObj) {
			this.imageObj[func] = this.imageObj[func].bind(this);
		}
	}
	set width(a) {
		this.resize(a, this.height);
	}
	get width() {
		return this.canvas.width / devicePixelRatio;
	}
	set height(a) {
		this.resize(this.width, a);
	}
	get height() {
		return this.canvas.height / devicePixelRatio;
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
		this.gl.setBlendMode({
			[BlendMode.COMBINE]: this.gl.BLEND_MODE_COMBINE,
			[BlendMode.ADD]: this.gl.BLEND_MODE_ADD
		}[a]);

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
		Matrix3.copy(a, this.currentTransform);
		this.gl.setTransform(this.currentTransform);
	}
	get transform() {
		return Matrix3.copy(this.currentTransform);
	}
	resize(width, height, trigger = true) {
		let px = this.preservePixelart;
		let al = this.alpha;
		this.gl.resize(width, height);
		this.imageType.width = width;
		this.imageType.height = height;
		this.alpha = al;
		this.preservePixelart = px;
		if (trigger) this.onresize();
	}
	setCursor(cursor) {
		let style = this.canvas.style;
		if ("cursor" in style) style.cursor = cursor;
	}
	useColor(color) {
		this.currentRed = color.red / 255;
		this.currentGreen = color.green / 255;
		this.currentBlue = color.blue / 255;
		this.currentAlpha = color.alpha;
		this.currentColor = color;
	}
	draw(color) {
		this.useColor(color);
		return this.drawObj;
	}
	stroke(color, lineWidth = 1) {
		this.useColor(color);
		this.currentLineWidth = lineWidth;
		return this.strokeObj;
	}
	image(img) {
		this.currentImage = img;
		return this.imageObj;
	}
	contentToFrame() {
		let n = new Frame(this.width, this.height);
		n.c.drawImage(this.canvas, 0, 0);
		return n;
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
		Matrix3.mulMatrix(this.currentTransform, Matrix3.translation(x, y, Matrix3.temp[0]), this.currentTransform);
		this.gl.setTransform(this.currentTransform);
	}
	scale(x, y = x) {
		if (typeof x == "object") {
			y = x.y;
			x = x.x;
		}
		// do scale
		Matrix3.mulMatrix(this.currentTransform, Matrix3.scale(x, y, Matrix3.temp[0]), this.currentTransform);
		this.gl.setTransform(this.currentTransform);
	}
	rotate(a) {
		// do rotate
		Matrix3.mulMatrix(this.currentTransform, Matrix3.rotation(a, Matrix3.temp[0]), this.currentTransform);
		this.gl.setTransform(this.currentTransform);
	}
	save() {
		this.transformStack.push(Matrix3.copy(this.currentTransform));
	}
	restore() {
		if (this.transformStack.length) {
			this.currentTransform = this.transformStack.pop();
			this.gl.setTransform(this.currentTransform);
		}
	}
	clear() {
		this.gl.clear();
	}
	clearScreen() {
		this.fill(Color.WHITE);
	}
	beforeFrame() {

	}
	afterFrame() {

	}
	fill(color) {
		this.gl.coloredRect(0, 0, this.width, this.height, color.red / 255, color.green / 255, color.blue / 255, color.alpha);
	}
	rotateAround(x, y, r) {
		this.translate(x, y)
		this.rotate(r);
		this.translate(-x, -y);
	}
	drawWithAlpha(a, shape) {
		this.alpha = a;
		shape();
		this.alpha = 1;
	}
}

class WebGLFrame extends ImageType {
	constructor(width, height) {
		super(width, height);
		this.image = new_OffscreenCanvas(this.width, this.height);
		this.renderer = new WebGLArtist(this.image, this.width, this.height, this);
		this.renderer.preservePixelart = true;
	}
	stretch(w, h) {
		if (!h) h = this.inferHeight(w);
		let f = new WebGLFrame(w, h);
		f.renderer.gl.texturedQuad(0, 0, w, h, 0, 0, 1, 1, this.makeImage());
		return f;
	}
	makeImage() {
		this.renderer.gl.render();
		return this.image;
	}
	clip(x, y, w, h) {
		return WebGLFrame.fromImageType(this, x, y, w, h);
	}
	get() {
		let f = new WebGLFrame(this.width, this.height);
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

		let f = new WebGLFrame(w, h);
		f.renderer.gl.texturedQuad(0, 0, width, height, x / img.width, y / img.height, w / img.width, h / img.height, img.makeImage());
		return f;
	}
}