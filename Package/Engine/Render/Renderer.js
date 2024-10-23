// Text Modes
const TextModeX = Enum.define("LEFT", "CENTER", "RIGHT");
const TextModeY = Enum.define("TOP", "CENTER", "BOTTOM");

/**
 * @name const TextMode = Enum.define
 * Specifies where on a string of text should be considered its origin.
 * @name_subs HORIZONTAL: LEFT, CENTER, RIGHT; VERTICAL: TOP, CENTER, BOTTOM
 * @static_prop TextMode [VERTICAL]_[HORIZONTAL] | Specifies that text should be aligned vertically based on VERTICAL (`TOP`, `CENTER`, or `BOTTOM`), and should be aligned horizontally based on HORIZONTAL (`LEFT`, `CENTER`, `RIGHT`)
 */
const TextMode = {};
for (let x in TextModeX) for (let y in TextModeY) {
	TextMode[y + "_" + x] = [TextModeX[x], TextModeY[y]];
}

/**
 * Represents the way in which colors being added to a surface should interact with those already there.
 * @static_prop BlendMode ADD | New colors should be component-wise added to the existing colors
 * @static_prop BlendMode COMBINE | New colors should be blended with old colors based on opacity
 */
const BlendMode = Enum.define("ADD", "COMBINE");
/**
 * Represents the way in which consecutive line segments should connect.
 * @static_prop LineJoin MITER | The edges of the lines will be extended until they meet
 * @static_prop LineJoin BEVEL | The edges of the lines will be connected straight across
 * @static_prop LineJoin ROUND | The gap between the lines will be filled with an arc
 */
const LineJoin = Enum.define("MITER", "BEVEL", "ROUND");
/**
 * Represents the way the ends of line segments will be displayed.
 * @static_prop LineCap FLAT | The lines will have square ends that extend just to the end of the line
 * @static_prop LineCap SQUARE | The lines will have square ends that extend half their side length past the end of the line
 * @static_prop LineCap ROUND | The lines will end with half-circles
 */
const LineCap = Enum.define("FLAT", "SQUARE", "ROUND");

/**
 * Represents a renderer for a graphical surface.
 * ```js
 * renderer.draw(new Color("blue")).shape(Polygon.regular(5, 100).move(middle));
 * renderer.stroke(new Color("red"), 20, LineCap.SQUARE, LineJoin.ROUND).connector([
 * 	new Vector2(0, 0),
 * 	new Vector2(50, 100),
 * 	new Vector2(150, 200),
 * 	new Vector2(300, 100)
 * ]);
 * 
 * renderer.clip().circle(0, 0, 100);
 * renderer.draw(new Color("lime")).rect(0, 0, 80, 80);
 * renderer.unclip();
 * ```
 * @prop ImageType imageType | The surface on which the renderer renders. This property is read-only
 * @prop TextMode textMode | The current text-alignment mode. Starts as `TextMode.TOP_LEFT`
 * @prop BlendMode blendMode | The current color-blending mode. Starts as `BlendMode.COMBINE`
 * @prop Number alpha | The current global alpha. This will multiply the alpha of all other drawing calls. Starts as 1
 * @prop Boolean preservePixelart | Whether or not image smoothing will be prevented when upscaling. Starts as true
 */
class Artist {
	constructor(canvas, width, height, imageType, pixelRatio) {
		this.canvas = canvas;
		this.c = this.canvas.getContext("2d");
		this.pixelRatio = pixelRatio;
		this.width = width;
		this.height = height;
		this.imageType = imageType;

		this.lineJoinMap = new Map([
			[LineJoin.MITER, "miter"],
			[LineJoin.BEVEL, "bevel"],
			[LineJoin.ROUND, "round"]
		]);
		this.lineCapMap = new Map([
			[LineCap.FLAT, "butt"],
			[LineCap.SQUARE, "square"],
			[LineCap.ROUND, "round"]
		]);
		this.blendModeMap = new Map([
			[BlendMode.COMBINE, "source-over"],
			[BlendMode.ADD, "lighter"]
		]);

		this.preservePixelart = true;
		this.c.imageSmoothingQuality = "high";
		this.alpha = 1;
		this.textMode = TextMode.TOP_LEFT;
		this.blendMode = BlendMode.COMBINE;

		this.resize(width, height);

		let pathObj = {
			circle(x, y, radius) {
				if (typeof x === "object") {
					if (x.radius !== undefined) ({ x, y, radius } = x);
					else {
						radius = y;
						({ x, y } = x);
					}
				}
				radius = Math.abs(radius);
				this.c.beginPath();
				this.c.arc(x, y, radius, 0, 2 * Math.PI);
			},
			arc(x, y, radius, sa, ea, counterClockwise) {
				if (typeof x === "object") {
					counterClockwise = ea;
					ea = sa;
					sa = radius;
					radius = y;
					({ x, y } = x);
				}
				radius = Math.abs(radius);
				this.c.beginPath();
				this.c.arc(x, y, radius, sa, ea, counterClockwise);
			},
			sector(x, y, radius, sa, ea, counterClockwise) {
				if (typeof x === "object") {
					counterClockwise = ea;
					ea = sa;
					sa = radius;
					radius = y;
					({ x, y } = x);
				}
				radius = Math.abs(radius);
				this.c.beginPath();
				this.c.moveTo(x, y);
				this.c.lineTo(x + radius * Math.cos(sa), y + radius * Math.sin(sa));
				this.c.arc(x, y, radius, sa, ea, counterClockwise);
				this.c.lineTo(x, y);
			},
			ellipse(x, y, rx, ry) {
				rx = Math.abs(rx);
				ry = Math.abs(ry);
				this.c.beginPath();
				this.c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
			},
			rect(x, y, width, height) {
				if (typeof x === "object") ({ x, y, width, height } = x);
				this.c.beginPath();
				this.c.rect(x, y, width, height);
			},
			roundRect(x, y, width, height, tl, tr, br, bl) {
				if (typeof x === "object") {
					tr = width;
					br = height;
					bl = tl;
					tl = y;
					({ x, y, width, height } = x);
				}

				this.c.beginPath();
				if (tr === undefined) this.c.roundRect(x, y, width, height, tl);
				else this.c.roundRect(x, y, width, height, [tl, tr, br, bl]);
			},
			triangle(v1, v2, v3) {
				this.c.beginPath();
				if (v1 && v1.vertices) {
					v2 = v1.vertices[1];
					v3 = v1.vertices[2];
					v1 = v1.vertices[0];
				}
				this.c.moveTo(v1.x, v1.y);
				this.c.lineTo(v2.x, v2.y);
				this.c.lineTo(v3.x, v3.y);
				this.c.lineTo(v1.x, v1.y);
			},
			textLine(font, text, x, y) {
				if (typeof x === "object") {
					y = x.y;
					x = x.x;
				}

				this.c.font = font.toString();
				text = font.processString(text);

				if (this.textModeX !== TextModeX.LEFT)
					x -= this.c.measureText(text).width * ((this.textModeX === TextModeX.CENTER) ? 0.5 : 1);

				y += font.renderOffsetY;
				if (this.textModeY !== TextModeY.TOP)
					y -= font.getTextHeight(text) * ((this.textModeY === TextModeY.CENTER) ? 0.5 : 1);

				return { text, x, y };
			},
			text(drawText, font, text, x, y, pack = false) {
				if (typeof x === "object") {
					pack = y ?? false;
					({ x, y } = x);
				}
				
				text = font.processString(text);
				if (pack) text = font.packText(text, pack);
				const blocks = text.split("\n");
				
				y += font.renderOffsetY;
				if (this.textModeY !== TextModeY.TOP)
					y -= font.getTextHeight(text) * ((this.textModeY === TextModeY.CENTER) ? 0.5 : 1);

				let widthOffsetFactor = 0;
				if (this.textModeX !== TextModeX.LEFT)
					widthOffsetFactor = (this.textModeX === TextModeX.CENTER) ? 0.5 : 1;

				this.c.font = font;
				for (let i = 0; i < blocks.length; i++) {
					let ax = x;
					if (widthOffsetFactor)
						ax -= this.c.measureText(blocks[i]).width * widthOffsetFactor;

					drawText(blocks[i], ax, y + i * font.lineHeight);
				}
			},
			shape(v) {
				if (v.vertices) v = v.vertices;
				v = this.pathObj.validatePoints(v);
				this.c.beginPath();
				if (v.length) {
					this.c.moveTo(v[0].x, v[0].y);
					for (let i = 1; i <= v.length; i++) {
						let index = i % v.length;
						this.c.lineTo(v[index].x, v[index].y);
					}
				}
			},
			validatePoints(points) {
				return points.filter(e => {
					if (Math.abs(e.x) > 100000) return false;
					if (Math.abs(e.y) > 100000) return false;
					return true;
				});
			}
		}
		this.pathObj = pathObj;
		for (let func in this.pathObj) {
			this.pathObj[func] = this.pathObj[func].bind(this);
		}
		this.drawObj = {
			circle(x, y, radius) {
				pathObj.circle(x, y, radius);
				this.c.fill();
			},
			arc(x, y, radius, startAngle, endAngle, counterClockwise) {
				pathObj.arc(x, y, radius, startAngle, endAngle, counterClockwise);
				this.c.fill();
			},
			sector(x, y, radius, startAngle, endAngle, counterClockwise) {
				pathObj.sector(x, y, radius, startAngle, endAngle, counterClockwise);
				this.c.fill();
			},
			ellipse(x, y, rx, ry) {
				pathObj.ellipse(x, y, rx, ry);
				this.c.fill();
			},
			rect(x, y, width, height) {
				pathObj.rect(x, y, width, height);
				this.c.fill();
			},
			roundRect(x, y, width, height, tl, tr, br, bl) {
				pathObj.roundRect(x, y, width, height, tl, tr, br, bl);
				this.c.fill();
			},
			triangle(v1, v2, v3) {
				pathObj.triangle(v1, v2, v3);
				this.c.fill();
			},
			text(font, text, x, y, pack) {
				pathObj.text(this.c.fillText.bind(this.c), font, text, x, y, pack);
			},
			textLine(font, text, x, y) {
				const req = pathObj.textLine(font, text, x, y);
				this.c.fillText(req.text, req.x, req.y);
			},
			shape(v) {
				pathObj.shape(v);
				this.c.fill();
			},
			infer(obj) {
				if (obj.radius !== undefined)
					this.drawObj.circle(obj);
				else if (obj.width !== undefined)
					this.drawObj.rect(obj);
				else if (obj.vertices !== undefined)
					this.drawObj.shape(obj.vertices);
			}
		}
		for (let func in this.drawObj) {
			this.drawObj[func] = this.drawObj[func].bind(this);
		}
		this.strokeObj = {
			circle(x, y, radius) {
				pathObj.circle(x, y, radius);
				this.c.stroke();
			},
			arc(x, y, radius, startAngle, endAngle, counterClockwise) {
				pathObj.arc(x, y, radius, startAngle, endAngle, counterClockwise);
				this.c.stroke();
			},
			sector(x, y, radius, startAngle, endAngle, counterClockwise) {
				pathObj.sector(x, y, radius, startAngle, endAngle, counterClockwise);
				this.c.stroke();
			},
			ellipse(x, y, rx, ry) {
				pathObj.ellipse(x, y, rx, ry);
				this.c.stroke();
			},
			rect(x, y, width, height) {
				pathObj.rect(x, y, width, height);
				this.c.stroke();
			},
			roundRect(x, y, width, height, tl, tr, br, bl) {
				pathObj.roundRect(x, y, width, height, tl, tr, br, bl);
				this.c.stroke();
			},
			triangle(v1, v2, v3) {
				pathObj.triangle(v1, v2, v3);
				this.c.stroke();
			},
			text(font, text, x, y, pack) {
				pathObj.text(this.c.strokeText.bind(this.c), font, text, x, y, pack);
			},
			textLine(font, text, x, y) {
				let req = pathObj.textLine(font, text, x, y);
				this.c.strokeText(req.text, req.x, req.y);
			},
			connector(points) {
				if (points.length) {
					points = this.pathObj.validatePoints(points);
					this.c.beginPath();
					this.c.moveTo(points[0].x, points[0].y);
					for (let i = 1; i < points.length; i++) {
						this.c.lineTo(points[i].x, points[i].y);
					}
					this.c.stroke();
				}
			},
			spline(spline) {
				this.c.beginPath();
				this.c.moveTo(spline.a.x, spline.a.y);
				this.c.bezierCurveTo(spline.b.x, spline.b.y, spline.c.x, spline.c.y, spline.d.x, spline.d.y);
				this.c.stroke();
			},
			line(x, y, x1, y1) {
				if (typeof x === "object") {
					if (!x) return;
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
				this.c.beginPath();
				this.c.moveTo(x, y)
				this.c.lineTo(x1, y1)
				this.c.stroke()
			},
			measure(font, text, x, y, x1, y1) {
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

				let width = font.getTextWidth(text);
				let height = font.getTextHeight(text);

				let dx = x1 - x;
				let dy = y1 - y;
				let nx = -dy;
				let ny = dx;
				let m = Math.sqrt((dx ** 2) + (dy ** 2));

				if (!m) return;

				nx *= height / m / 2;
				ny *= height / m / 2;

				let length = (m - (width + font.size)) / 2;
				dx *= length / m;
				dy *= length / m;

				this.c.beginPath();
				this.c.moveTo(x, y);
				this.c.lineTo(x + dx, y + dy);
				this.c.stroke();


				this.c.beginPath();
				this.c.moveTo(x1, y1);
				this.c.lineTo(x1 - dx, y1 - dy);
				this.c.stroke();

				let rot = Math.atan2(dy, dx);

				dx = (x1 - x) / 2;
				dy = (y1 - y) / 2;
				this.c.save();
				this.c.translate(x + dx, y + dy);
				this.c.rotate(rot);
				this.c.translate(-width / 2, height / 4);
				this.c.fillStyle = this.c.strokeStyle;
				this.c.font = font.toString();
				this.c.fillText(text, 0, 0);
				this.c.restore();

				//Left
				this.c.beginPath();
				this.c.moveTo(x + nx, y + ny);
				this.c.lineTo(x - nx, y - ny);
				this.c.stroke();

				//Right
				this.c.beginPath();
				this.c.moveTo(x1 + nx, y1 + ny);
				this.c.lineTo(x1 - nx, y1 - ny);
				this.c.stroke();

			},
			arcArrow(x, y, radius, sa, ea, counterClockwise) {
				if (typeof x === "object") {
					counterClockwise = ea;
					ea = sa;
					sa = radius;
					radius = y;
					({ x, y } = x);
				}
				this.c.beginPath();
				this.c.arc(x, y, radius, sa, ea, counterClockwise);
				this.c.stroke();
				this.c.fillStyle = this.c.strokeStyle;
				let ox = Math.cos(ea);
				let oy = Math.sin(ea);
				let px = x + ox * radius;
				let py = y + oy * radius;
				let nx = -oy;
				let ny = ox;
				if (counterClockwise) {
					nx *= -1;
					ny *= -1;
				}
				this.c.beginPath();
				let l2 = this.c.lineWidth * 2;
				this.c.moveTo(px + nx * l2 * 2, py + ny * l2 * 2);
				this.c.lineTo(px - ox * l2, py - oy * l2);
				this.c.lineTo(px + ox * l2, py + oy * l2);
				this.c.fill();
			},
			splineArrow(spline) {
				let { d: { x: Dx, y: Dy } } = spline;
				const pointA = spline.evaluate(0.95);
				const dx = Dx - pointA.x;
				const dy = Dy - pointA.y;
				const m = Math.sqrt(dx ** 2 + dy ** 2);
				const ndx = dx / m;
				const ndy = dy / m;
				const nndx = -ndy;
				const nndy = ndx;
				const l2 = this.c.lineWidth * 2;
				Dx -= ndx * l2 * 2;
				Dy -= ndy * l2 * 2;
				
				this.c.beginPath();
				this.c.moveTo(spline.a.x, spline.a.y);
				this.c.bezierCurveTo(spline.b.x, spline.b.y, spline.c.x, spline.c.y, Dx + ndx * l2, Dy + ndy * l2);
				this.c.stroke();

				this.c.fillStyle = this.c.strokeStyle;
				this.c.beginPath();
				this.c.moveTo(Dx + nndx * l2, Dy + nndy * l2);
				this.c.lineTo(Dx - nndx * l2, Dy - nndy * l2);
				this.c.lineTo(Dx + ndx * l2 * 2, Dy + ndy * l2 * 2);
				this.c.fill();
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
			shape(v) {
				pathObj.shape(v);
				this.c.stroke();
			},
			infer(obj) {
				if (obj.radius !== undefined)
					this.strokeObj.circle(obj);
				else if (obj.radius !== undefined)
					this.strokeObj.rect(obj);
				else if (obj.vertices !== undefined)
					this.strokeObj.shape(obj.vertices);
				else if (obj instanceof Line)
					this.strokeObj.line(obj);
				else if (obj instanceof Spline)
					this.strokeObj.spline(obj);
			}
		}
		for (let func in this.strokeObj) {
			this.strokeObj[func] = this.strokeObj[func].bind(this);
		}
		this.clipObj = {
			circle(x, y, radius) {
				pathObj.circle(x, y, radius);
				this.c.clip();
			},
			arc(x, y, radius, startAngle, endAngle, counterClockwise) {
				pathObj.arc(x, y, radius, startAngle, endAngle, counterClockwise);
				this.c.clip();
			},
			sector(x, y, radius, startAngle, endAngle, counterClockwise) {
				pathObj.sector(x, y, radius, startAngle, endAngle, counterClockwise);
				this.c.clip();
			},
			ellipse(x, y, rx, ry) {
				pathObj.ellipse(x, y, rx, ry);
				this.c.clip();
			},
			rect(x, y, width, height) {
				pathObj.rect(x, y, width, height);
				this.c.clip();
			},
			roundRect(x, y, width, height, tl, tr, br, bl) {
				pathObj.roundRect(x, y, width, height, tl, tr, br, bl);
				this.c.clip();
			},
			triangle(v1, v2, v3) {
				pathObj.triangle(v1, v2, v3);
				this.c.clip();
			},
			shape(v) {
				pathObj.shape(v);
				this.c.clip();
			},
			infer(obj) {
				if (obj.radius !== undefined)
					this.clipObj.circle(obj);
				else if (obj.width !== undefined)
					this.clipObj.rect(obj);
				else if (obj.vertices !== undefined)
					this.clipObj.shape(obj.vertices);
			}
		}
		for (let func in this.clipObj) {
			this.clipObj[func] = this.clipObj[func].bind(this);
		}
		this.currentImage = null;
		this.currentImageCIS = null;
		this.imageObj = {
			circle(x, y, radius) {
				this.clip().circle(x, y, radius);
				if (x instanceof Circle) {
					radius = x.radius;
					y = x.y;
					x = x.x;
				}
				this.drawImageInternal(x - radius, y - radius, radius * 2, radius * 2);
				this.unclip();
			},
			arc(x, y, radius, startAngle, endAngle, counterClockwise) {
				this.clip().arc(x, y, radius, startAngle, endAngle, counterClockwise);
				this.drawImageInternal(x - radius, y - radius, radius * 2, radius * 2);
				this.unclip();
			},
			sector(x, y, radius, startAngle, endAngle, counterClockwise) {
				this.clip().sector(x, y, radius, startAngle, endAngle, counterClockwise);
				this.drawImageInternal(x - radius, y - radius, radius * 2, radius * 2);
				this.unclip();
			},
			ellipse(x, y, rx, ry) {
				this.clip().ellipse(x, y, rx, ry);
				this.drawImageInternal(x - rx, y - ry, rx * 2, ry * 2);
				this.unclip();
			},
			default(x, y) {
				if (typeof x === "object") ({ x, y } = x);
				this.drawImageInternal(x, y, this.currentImage.width, this.currentImage.height);
			},
			inferHeight(x, y, width) {
				if (typeof x === "object") {
					width = y;
					({ x, y } = x);
				}
				this.drawImageInternal(x, y, width, this.currentImage.inferHeight(width));
			},
			inferWidth(x, y, height) {
				if (typeof x === "object") {
					height = y;
					({ x, y } = x);
				}
				this.drawImageInternal(x, y, this.currentImage.inferWidth(height), height);
			},
			rect(x, y, width, height) {
				this.drawImageInternal(x, y, width, height);
			},
			roundRect(x, y, width, height, tl, tr, br, bl) {
				this.clip().roundRect(x, y, width, height, tl, tr, br, bl);
				this.drawImageInternal(x, y, width, height);
				this.unclip();
			},
			triangle(v1, v2, v3) {
				this.clip().triangle(v1, v2, v3);
				let v = [v1, v2, v3];
				let bound = Rect.bound(v);
				this.drawImageInternal(bound.x, bound.y, bound.width, bound.height);
				this.unclip();
			},
			shape(v) {
				if (v.vertices) v = v.vertices;
				this.clip().shape(v);
				let bound = Rect.bound(v);
				this.drawImageInternal(bound.x, bound.y, bound.width, bound.height);
				this.unclip();
			},
			infer(obj) {
				if (obj.radius !== undefined)
					this.imageObj.circle(obj);
				else if (obj.width !== undefined)
					this.imageObj.rect(obj);
				else if (obj.vertices !== undefined)
					this.imageObj.shape(obj.vertices);
			}

		};
		for (let func in this.imageObj) {
			this.imageObj[func] = this.imageObj[func].bind(this);
		}
	}
	get middle() {
		return new Vector2(this.width / 2, this.height / 2);
	}
	set textMode(a) {
		this.textModeX = a[0];
		this.textModeY = a[1];
		this._textMode = a;
	}
	get textMode() {
		return this._textMode;
	}
	set preservePixelart(a) {
		this._preservePixelart = a;
		this.c.imageSmoothingEnabled = !a;
	}
	get preservePixelart() {
		return this._preservePixelart;
	}
	set blendMode(a) {
		this._blendMode = a;
		this.c.globalCompositeOperation = this.blendModeMap.get(a);
	}
	get blendMode() {
		return this._blendMode;
	}
	set alpha(a) {
		this._alpha = a;
		this.c.globalAlpha = a;
	}
	get alpha() {
		return this._alpha;
	}
	/**
	 * Sets the current coordinate transform of the renderer.
	 * @param Matrix3 transform | The new transform
	 */
	set transform(a) {
		const m = a;
		this.c.setTransform(m[0] * this.pixelRatio, m[1] * this.pixelRatio, m[3] * this.pixelRatio, m[4] * this.pixelRatio, m[6] * this.pixelRatio, m[7] * this.pixelRatio);
	}
	/**
	 * Returns the current coordinate transform of the renderer.
	 * @return Matrix3
	 */
	get transform() {
		const { a, b, c, d, e, f } = this.c.getTransform();
		const ratio = 1 / this.pixelRatio;
		return Matrix3.create(
			a * ratio, c * ratio, e * ratio,
			b * ratio, d * ratio, f * ratio,
			0, 0, 1
		);
	}
	/**
	 * Manipulates the current coordinate transform. For an Artist `a` and Matrix3 `m`, `a.addTransform(m)` is equivalent to `a.transform = m.times(a.transform)`.
	 * @param Matrix3 transform | The coordinate transform to compose with the existing transform
	 */
	addTransform(mat) {
		this.c.transform(mat[0], mat[1], mat[3], mat[4], mat[6], mat[7]);
	}
	/**
	 * Calls a function while using a specified coordinate transform
	 * @param Matrix3 transform | The specific coordinate transform to use
	 * @param () => void draw | The function that will be called while using the specified transform
	 * @param Boolean global? | Whether the transform should be applied in place of all current transforms (true), or composed with the current transform (false). Default is true.
	 */
	drawThrough(mat, draw, global = true) {
		this.save();
		if (global) this.transform = mat;
		else this.addTransform(mat);
		draw();
		this.restore();
	}
	resize(width, height) {
		const px = this.preservePixelart;
		const al = this.alpha;
		this.width = width;
		this.height = height;
		this.canvas.width = this.imageType.pixelWidth;
		this.canvas.height = this.imageType.pixelHeight;
		this.c.scale(this.pixelRatio, this.pixelRatio);
		this.alpha = al;
		this.preservePixelart = px;
	}
	setCursor(cursor) {
		let style = this.canvas.style;
		if ("cursor" in style) style.cursor = cursor;
	}
	/**
	 * Returns the color of a specific pixel in natural-space.
	 * @param Number x | The x coordinate of the pixel
	 * @param Number y | The y coordinate of the pixel
	 * @return Color
	 */
	getPixel(x, y) {
		let d = this.c.getImageData(x * this.pixelRatio, y * this.pixelRatio, 1, 1).data;
		return new Color(d[0], d[1], d[2], d[3] / 255);
	}
	/**
	 * Sets the color of a specific pixel in natural-space.
	 * @param Number x | The x coordinate of the pixel
	 * @param Number y | The y coordinate of the pixel
	 * @param Color color | The new color for the pixel 
	 */
	setPixel(x, y, col) {
		let data = new Uint8ClampedArray(4);
		data[0] = col.red;
		data[1] = col.green;
		data[2] = col.blue;
		data[3] = col.alpha * 255;
		this.c.putImageData(new ImageData(data, 1, 1), x * this.pixelRatio, y * this.pixelRatio);
	}
	createRadialGradient(x, y, radius, cols) {
		let grd = this.c.createRadialGradient(x, y, 0.00000001, x, y, radius);
		for (let i = 0; i < cols.length; i++) grd.addColorStop(i / (cols.length - 1), this.getContextColor(cols[i]));
		return grd;
	}
	createLinearGradient(x, y, x2, y2, cols) {
		let grd = this.c.createLinearGradient(x, y, x2, y2);
		for (let i = 0; i < cols.length; i++) grd.addColorStop(i / (cols.length - 1), this.getContextColor(cols[i]));
		return grd;
	}
	getContextColor(color) {
		let c = color;
		if (color instanceof Color) c = color.getRGBA();
		return c;
	}
	/**
	 * Returns a drawing API that uses a specified color.
	 * @param Color color | The fill color
	 * @return DrawRenderer
	 */
	draw(color) {
		this.c.fillStyle = this.getContextColor(color);
		return this.drawObj;
	}
	/**
	 * Returns a stroke API that uses specific settings.
	 * @param Color color | The outline color
	 * @param Number lineWidth? | The width of the outline in pixels. Default is 1
	 * @param LineCap lineCap? | The line cap to use. Default is `LineCap.FLAT`
	 * @param LineJoin lineJoin? | The line join to use for connected segments. Default is `LineJoin.BEVEL`
	 * @return StrokeRenderer
	 */
	stroke(color, lineWidth = 1, lineCap = LineCap.FLAT, lineJoin = LineJoin.BEVEL) {
		this.c.strokeStyle = this.getContextColor(color);
		this.c.lineJoin = this.lineJoinMap.get(lineJoin);
		this.c.lineCap = this.lineCapMap.get(lineCap);
		this.c.lineWidth = lineWidth;
		return this.strokeObj;
	}
	drawImageInternal(x, y, width, height) {
		if (!this.currentImage.renderable) return;
		if (typeof x === "object") ({ x, y, width, height } = x);
		if (width * height === 0) return;
		this.c.drawImage(this.currentImageCIS, x, y, width, height);
	}
	/**
	 * Returns an image rendering API that uses a specified image.
	 * @param ImageType image | The image to render
	 * @return ImageRenderer
	 */
	image(img) {
		this.currentImageCIS = img.makeImage();
		this.currentImage = img;
		return this.imageObj;
	}
	/**
	 * Returns a clipping API.
	 * @return ClipRenderer
	 */
	clip() {
		this.save();
		return this.clipObj;
	}
	/**
	 * Undoes the last clipping operation performed in the current state stack.
	 */
	unclip() {
		this.restore();
	}
	/**
	 * Multiplies the current coordinate transform in-place by a matrix on the right side.
	 * @param Matrix3 newTransform | The matrix to multiply the current transform by
	 */
	multiplyTransform(newTransform) {
		this.c.transform(newTransform[0], newTransform[1], newTransform[3], newTransform[4], newTransform[6], newTransform[7]);
	}
	/**
	 * In a transform with no translation, rotation, or scaling, this flips the x axis about the middle of the screen.
	 */
	invertX() {
		this.translate(this.width, 0);
		this.scale(-1, 1);
	}
	/**
	 * In a transform with no translation rotation, or scaling, this flips the y axis about the middle of the screen.
	 */
	invertY() {
		this.translate(0, this.height);
		this.scale(1, -1);
	}
	/**
	 * Changes the coordinate transform by displacing it.
	 * @signature
	 * @param Vector2 displacement | The displacement
	 * @signature
	 * @param Number x | The displacement along the x axis
	 * @param Number y | The displacement along the y axis
	 */
	translate(x, y) {
		if (typeof x === "object") ({ x, y } = x);
		this.c.translate(x, y);
	}
	/**
	 * Changes the coordinate transform by scaling it.
	 * @signature
	 * @param Vector2 factors | The scaling factors for both axes
	 * @signature
	 * @param Number x | The scaling along the x axis
	 * @param Number y | The scaling along the y axis.
	 * @signature
	 * @param Number factor | The scaling factor for both axes
	 */
	scale(x, y = x) {
		if (typeof x === "object") ({ x, y } = x);
		this.c.scale(x, y);
	}
	/**
	 * Changes the coordinate transform by rotating it clockwise by a specified angle.
	 * @param Number angle | The amount to rotate by, in radians
	 */
	rotate(a) {
		this.c.rotate(a);
	}
	/**
	 * Changes the coordinate transform by rotating it clockwise about a specified point.
	 * @signature
	 * @param Vector2 point | The point to rotate about
	 * @param Number angle | The angle to rotate by
	 * @signature
	 * @param Number x | The x coordinate to rotate about
	 * @param Number y | The y coordinate to rotate about
	 * @param Number angle | The angle to rotate by
	 */
	rotateAround(x, y, r) {
		if (typeof x === "object") {
			r = y;
			({ x, y } = x);
		}
		this.translate(x, y);
		this.rotate(r);
		this.translate(-x, -y);
	}
	/**
	 * Returns the renderer to the identity coordinate transform.
	 */
	clearTransformations() {
		this.c.resetTransform();
		this.scale(this.pixelRatio);
	}
	/**
	 * Pushes the current rendering state onto the state stack.
	 * This state includes `.alpha` and `.transform`, 
	 */
	save() {
		this.c.save();
	}
	/**
	 * Puts the renderer into the state on top of the state stack, then removes it from the stack.
	 */
	restore() {
		this.c.restore();
		this._alpha = this.c.globalAlpha;
	}
	/**
	 * Clears a rectangular region of the surface to transparent black.
	 * @signature
	 * @param Rect region | The region to clear
	 * @signature
	 * @param Number x | The x coordinate of the region to clear
	 * @param Number y | The y coordinate of the region to clear
	 * @param Number width | The width of the region to clear 
	 * @param Number height | The height of the region to clear 
	 */
	clearRect(x, y, width, height) {
		if (typeof x === "object") ({ x, y, width, height } = x);
		this.c.clearRect(x, y, width, height);
	}
	/**
	 * Clears the rendering surface to transparent black.
	 */
	clear() {
		this.c.save();
		this.c.resetTransform();
		this.c.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.c.restore();
	}
	beforeFrame() {
		this.clearTransformations();
	}
	afterFrame() {

	}
	/**
	 * Assuming that the current transform is the identity transformation, this fills the surface with a single color. If the color is transparent, it will simply layer on top of the current content.
	 * @param Color color | The color to fill with
	 */
	fill(color) {
		this.c.fillStyle = this.getContextColor(color);
		this.c.fillRect(0, 0, this.width, this.height);
	}
	drawWithAlpha(a, shape) {
		const prev = this.alpha;
		this.alpha *= a;
		shape();
		this.alpha = prev;
	}
	compileCommand(drawType, drawArgs, shapeArgs) {
		let color;

		let shape;
		if (shapeArgs instanceof Polygon) shape = "shape";
		if (shapeArgs instanceof Rect) shape = "rect";
		if (shapeArgs instanceof Circle) shape = "circle";

		switch (drawType) {
			case "stroke":
				color = drawArgs[0];
				if (color instanceof Color) color = color.getRGBA();
				let lineWidth = drawArgs[1] || 1;
				let lineCap = drawArgs[2] || "flat";
				if (lineCap === "flat") lineCap = "butt";

				if (shape === "rect") {
					return function () {
						this.c.lineWidth = lineWidth;
						this.c.lineCap = lineCap;
						this.c.strokeStyle = color;
						this.c.strokeRect(shapeArgs.x, shapeArgs.y, shapeArgs.width, shapeArgs.height);
					}.bind(this);
				}

				if (shape === "circle") {
					return function () {
						this.c.lineWidth = lineWidth;
						this.c.lineCap = lineCap;
						this.c.strokeStyle = color;
						this.c.beginPath();
						this.c.arc(shapeArgs.x, shapeArgs.y, shapeArgs.radius, 0, 6.283185307179586);
						this.c.stroke();
					}.bind(this);
				}

				if (shape === "shape") {
					let vert = shapeArgs.vertices;
					let len = vert.length;
					let lines = [];
					for (let i = 0; i < len; i++) lines.push(vert[(i + 1) % len]);
					return function () {
						this.c.lineWidth = lineWidth;
						this.c.lineCap = lineCap;
						this.c.strokeStyle = color;
						this.c.beginPath();
						this.c.moveTo(vert[0].x, vert[0].y);
						for (let i = 0; i < lines.length; i++) this.c.lineTo(lines[i].x, lines[i].y);
						this.c.stroke();
					}.bind(this);
				}

				break;
			case "draw":
				color = drawArgs[0];
				if (color instanceof Color) color = color.getRGBA();

				if (shape === "rect") {
					return function () {
						this.c.fillStyle = color;
						this.c.fillRect(shapeArgs.x, shapeArgs.y, shapeArgs.width, shapeArgs.height);
					}.bind(this);
				}

				if (shape === "circle") {
					return function () {
						this.c.fillStyle = color;
						this.c.beginPath();
						this.c.arc(shapeArgs.x, shapeArgs.y, shapeArgs.radius, 0, 6.283185307179586);
						this.c.fill();
					}.bind(this);
				}

				if (shape === "shape") {
					let vert = shapeArgs.vertices;
					let len = vert.length;
					let lines = [];
					for (let i = 0; i < len; i++) lines.push(vert[(i + 1) % len]);
					return function () {
						this.c.fillStyle = color;
						this.c.beginPath();
						this.c.moveTo(vert[0].x, vert[0].y);
						for (let i = 0; i < lines.length; i++) this.c.lineTo(lines[i].x, lines[i].y);
						this.c.fill();
					}.bind(this);
				}

				break;
			case "image":
				let currentImage = drawArgs[0];

				let boundW, boundH, boundX, boundY;
				if (shape === "rect") {
					boundW = shapeArgs.width;
					boundH = shapeArgs.height;
					boundX = shapeArgs.x;
					boundY = shapeArgs.y;
				}
				if (shape === "circle") {
					boundW = shapeArgs.radius * 2;
					boundH = boundW;
					boundX = shapeArgs.x - boundW / 2;
					boundY = shapeArgs.y - boundH / 2;
				}
				let v;
				if (shape === "shape") {
					v = shapeArgs.vertices;
					let minX = Math.min(...v.map(e => e.x));
					let maxX = Math.max(...v.map(e => e.x));
					let minY = Math.min(...v.map(e => e.y));
					let maxY = Math.max(...v.map(e => e.y));
					boundX = minX;
					boundY = minY;
					boundW = maxX - minX;
					boundH = maxY - minY;
				}

				let img = currentImage;
				if (img instanceof ImageType) img = img.makeImage();

				if (shape === "rect") {
					return function () {
						this.c.drawImage(img, boundX, boundY, boundW, boundH);
					}.bind(this);
				}

				if (shape === "circle") {
					return function () {
						this.c.save();
						this.c.beginPath();
						this.c.arc(shapeArgs.x, shapeArgs.y, shapeArgs.radius, 0, 6.283185307179586);
						this.c.clip();
						this.c.drawImage(img, boundX, boundY, boundW, boundH);
						this.restore();
					}.bind(this);
				}

				if (shape === "shape") {
					let len = v.length;
					let lines = [];
					for (let i = 0; i < len; i++) lines.push(v[(i + 1) % len]);
					return function () {
						this.c.save();
						this.c.beginPath();
						this.c.moveTo(v[0].x, v[0].y);
						for (let i = 0; i < lines.length; i++) this.c.lineTo(lines[i].x, lines[i].y);
						this.c.clip();
						this.c.drawImage(img, boundX, boundY, boundW, boundH);
						this.c.restore();
					}.bind(this);
				}

				break;
		}
		return function () { };
	}
}

/**
 * @name class PathRenderer
 * Represents a generic drawing API of an Artist.
 * The exact operation used to render the paths is specified in subclasses, but this class which shapes are possible and how they are specified.
 * @abstract
 */

/**
 * @name circle
 * Creates a circular path.
 * @signature
 * @param Circle circle | The shape of the circle
 * @signature
 * @param Vector2 center | The center of the circle
 * @param Number radius | The radius of the circle
 * @signature
 * @param Number x | The x coordinate of the circle's center
 * @param Number y | The y coordinate of the circle's center
 * @param Number radius | The radius of the circle
 */

/**
 * @name ellipse
 * Creates an elliptical path.
 * @param Number x | The x coordinate of the ellipse's center
 * @param Number y | The y coordinate of the ellipse's center
 * @param Number radiusX | The x-axis radius of the ellipse
 * @param Number radiusY | The y-axis radius of the ellipse
 */

/**
 * @name rect
 * Creates a rectangular path.
 * @signature
 * @param Rect rectangle | The shape of the rectangle
 * @signature
 * @param Number x | The x coordinate of the rectangle's upper-left corner
 * @param Number y | The y coordinate of the rectangle's upper-left corner
 * @param Number width | The width of the rectangle
 * @param Number height | The height of the rectangle
 */

/**
 * @name roundRect
 * Creates a rectangular path with rounded corners.
 * @signature
 * @param Rect rectangle | The shape of the rectangle
 * @param Number topLeft | The radius of the top-left corner
 * @param Number topRight? | The radius of the top-right corner. Defaults to be the same as the top-left
 * @param Number bottomRight? | The radius of the bottom-right corner. Defaults to be the same as the top-left
 * @param Number bottomLeft? | The radius of the bottom-left corner. Defaults to be the same as the top-left
 * @signature
 * @param Number x | The x coordinate of the rectangle's upper-left corner
 * @param Number y | The y coordinate of the rectangle's upper-left corner
 * @param Number width | The width of the rectangle
 * @param Number height | The height of the rectangle
 * @param Number topLeft | The radius of the top-left corner
 * @param Number topRight? | The radius of the top-right corner. Defaults to be the same as the top-left
 * @param Number bottomRight? | The radius of the bottom-right corner. Defaults to be the same as the top-left
 * @param Number bottomLeft? | The radius of the bottom-left corner. Defaults to be the same as the top-left
 */

/**
 * @name triangle
 * Creates a triangular path.
 * @signature
 * @param Polygon triangle | The shape of the path
 * @signature
 * @param Vector2 a | The first point of the triangle
 * @param Vector2 b | The second point of the triangle
 * @param Vector2 c | The last point of the triangle
 */

/**
 * @name shape
 * Creates a polygonal path.
 * @signature
 * @param Vector2[] vertices | The vertices of the polygon
 * @signature
 * @param Polygon polygon | The shape of the polygon
 */

/**
 * @name infer
 * Creates a path with a shape based on the type of its argument.
 * @param Shape shape | The shape to render
 */

/**
 * @name text
 * Creates a path in the shape of a sequence of characters.
 * @signature
 * @param Font font | The font to use in rendering the text
 * @param String text | The text to render
 * @param Vector2 origin | The location of the text's origin. How this is interpreted depends on the current text-alignment mode.
 * @param Number packWidth? | The maximum allowed width of a single line of the text. Specifying this parameter will cause the newlines to be added to enforce this requirement. If this parameter is not specified, the text will not be packed
 * @signature
 * @param Font font | The font to use in rendering the text
 * @param String text | The text to render
 * @param Number x | The x coordinate of the text's origin. How this is interpreted depends on the current text-alignment mode.
 * @param Number y | The y coordinate of the text's origin. How this is interpreted depends on the current text-alignment mode.
 * @param Number packWidth? | The maximum allowed width of a single line of the text. Not specifying this will prevent packing
 */

/**
 * @name textLine
 * Creates a path in the shape of a single-line sequence of characters.
 * This method is faster than `.text()`.
 * @signature
 * @param Font font | The font to use in rendering the text
 * @param String text | The text to render
 * @param Vector2 origin | The location of the text's origin. How this is interpreted depends on the current text-alignment mode.
 * @signature
 * @param Font font | The font to use in rendering the text
 * @param String text | The text to render
 * @param Number x | The x coordinate of the text's origin. How this is interpreted depends on the current text-alignment mode.
 * @param Number y | The y coordinate of the text's origin. How this is interpreted depends on the current text-alignment mode.
 */

/**
 * @group sector, arc
 * Creates a path in the shape of a section (sector or arc) of a circle. If an arc is filled, it will first have the endpoints connected.
 * @signature
 * @param Vector2 center | The center of the circle
 * @param Number radius | The radius of the circle
 * @param Number begin | The initial clockwise angle (in radians) from the horizontal of the section
 * @param Number end | The final clockwise angle (in radians) from the horizontal of the section
 * @param Boolean counterClockwise? | Whether the path from the initial to final angle should be counter-clockwise. Default is false
 * @signature
 * @param Number x | The x coordinate of the circle's center
 * @param Number y | The y coordinate of the circle's center
 * @param Number radius | The radius of the circle
 * @param Number begin | The initial clockwise angle (in radians) from the horizontal of the section
 * @param Number end | The final clockwise angle (in radians) from the horizontal of the section
 * @param Boolean counterClockwise? | Whether the path from the initial to final angle should be counter-clockwise. Default is false
 */

/**
 * @name class DrawRenderer extends PathRenderer
 * Represents the draw API of an Artist.
 * This fills various paths.
 */

/**
 * @name class StrokeRenderer extends PathRenderer
 * Represents the stroke API of an Artist.
 * This outlines various paths.
 */

/**
 * @name connector
 * Renders a series of connected line segments.
 * @param Vector2[] points | The points to connect
 */

/**
 * @name spline/splineArrow
 * Renders a quartic spline. For `.splineArrow()`, there is also an arrow-head at the end.
 * @param Spline spline | The spline to render
 */

/**
 * @name line/arrow
 * Renders a line segment. For `.arrow()`, there is also an arrow-head at the end.
 * @signature
 * @param Line line | The line segment
 * @signature
 * @param Vector2 a | The first point
 * @param Vector2 b | The second point
 * @signature
 * @param Number x1 | The x coordinate of the first point
 * @param Number y1 | The y coordinate of the first point
 * @param Number x2 | The x coordinate of the second point
 * @param Number y2 | The y coordinate of the second point
 */

/**
 * @name measure
 * Renders a line segment with a line of text displayed in its center.
 * @signature
 * @param Font font | The font to use for the text
 * @param String text | The text to render
 * @param Line line | The line segment
 * @signature
 * @param Font font | The font to use for the text
 * @param String text | The text to render
 * @param Vector2 a | The first point
 * @param Vector2 b | The second point
 * @signature
 * @param Font font | The font to use for the text
 * @param String text | The text to render
 * @param Number x1 | The x coordinate of the first point
 * @param Number y1 | The y coordinate of the first point
 * @param Number x2 | The x coordinate of the second point
 * @param Number y2 | The y coordinate of the second point
 */

/**
 * @name arcArrow
 * Renders an arrow-head at the end of an arc on a circle.
 * @signature
 * @param Vector2 center | The center of the circle
 * @param Number radius | The radius of the circle
 * @param Number begin | The initial clockwise angle (in radians) from the horizontal of the arc
 * @param Number end | The final clockwise angle (in radians) from the horizontal of the arc
 * @param Boolean counterClockwise? | Whether the path from the initial to final angle should be counter-clockwise. Default is false
 * @signature
 * @param Number x | The x coordinate of the circle's center
 * @param Number y | The y coordinate of the circle's center
 * @param Number radius | The radius of the circle
 * @param Number begin | The initial clockwise angle (in radians) from the horizontal of the arc
 * @param Number end | The final clockwise angle (in radians) from the horizontal of the arc
 * @param Boolean counterClockwise? | Whether the path from the initial to final angle should be counter-clockwise. Default is false
 */

/**
 * @name class ImageRenderer extends PathRenderer
 * Represents the image drawing API of an Artist.
 * This draws images in various paths. 
 * For non-rectangular shapes, the image is scaled to be the size of the shape's bounding box, and then only the portion of the image inside the shape is shown.
 */

/**
 * @name default
 * Renders an image at its natural dimensions.
 * @signature
 * @param Vector2 point | The upper-left corner of the image
 * @signature
 * @param Number x | The x coordinate of the upper-left corner of the image
 * @param Number y | The y coordinate of the upper-left corner of the image
 */

/**
 * @name inferWidth
 * Renders an image with a specified height, while still maintaining its natural aspect ratio.
 * @signature
 * @param Vector2 point | The upper-left corner of the image
 * @param Number height | The height of the image
 * @signature
 * @param Number x | The x coordinate of the upper-left corner of the image
 * @param Number y | The y coordinate of the upper-left corner of the image
 * @param Number height | The height of the image
 */

/**
 * @name inferHeight
 * Renders an image with a specified width, while still maintaining its natural aspect ratio.
 * @signature
 * @param Vector2 point | The upper-left corner of the image
 * @param Number width | The width of the image
 * @signature
 * @param Number x | The x coordinate of the upper-left corner of the image
 * @param Number y | The y coordinate of the upper-left corner of the image
 * @param Number width | The width of the image
 */

/**
 * @name class ClipRenderer extends PathRenderer
 * Represents the clipping API of an Artist.
 * This adds various shapes to the current clipping mask.
 * Each path created will be added to the current clipping state, which means that future draw calls will be able to modify the pixels outside the current clipped area.
 */