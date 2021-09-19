// Text Modes
const TextModeX = defineEnum("LEFT", "CENTER", "RIGHT");
const TextModeY = defineEnum("TOP", "CENTER", "BOTTOM");

const TextMode = {};
for (let x in TextModeX) for (let y in TextModeY) {
	TextMode[y + "_" + x] = [TextModeX[x], TextModeY[y]];
}

const BlendMode = defineEnum("ADD", "COMBINE");
const LineJoin = defineEnum("MITER", "BEVEL", "ROUND");
const LineCap = defineEnum("FLAT", "SQUARE", "ROUND");

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

		this.resize(width, height);

		let pathObj = {
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
					y = x.y;
					x = x.x;
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
					y = x.y;
					x = x.x;
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
				this.c.beginPath();
				if (typeof x === "object") {
					this.c.rect(x.x, x.y, x.width, x.height);
				} else {
					this.c.rect(x, y, width, height);
				}
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

				if (this.textModeX !== TextModeX.LEFT) {
					let w = this.c.measureText(text).width;
					if (this.textModeX === TextModeX.RIGHT) x -= w;
					else x -= w / 2;
				}
				y += font.size * 0.24 - font.lineHeight / 2;
				if (this.textModeY !== TextModeY.BOTTOM) {
					if (this.textModeY === TextModeY.TOP) y += font.lineHeight;
					else y += font.lineHeight / 2;
				}
				return { text, x, y }
			},
			text(font, text, x, y, pack = false) {
				if (typeof x === "object") {
					pack = y || false;
					y = x.y;
					x = x.x;
				}
				text = font.processString(text);
				if (pack) text = font.packText(text, pack);
				this.c.font = font.toString();
				const tmh = font.getTextHeight(text);
				const blocks = text.split("\n");
				let textRequests = [];
				const yOffset = font.size * .24 - font.lineHeight / 2;
				for (let i = 0; i < blocks.length; i++) {
					let ax = x;
					let ay = y + (i + 1) * font.lineHeight + yOffset;
					if (this.textModeX !== TextModeX.LEFT) {
						let tmw = this.c.measureText(blocks[i]).width;

						if (this.textModeX === TextModeX.CENTER) {
							ax -= tmw / 2;
						} else if (this.textModeX === TextModeX.RIGHT) {
							ax -= tmw;
						}
					}

					if (this.textModeY !== TextModeY.TOP) {
						if (this.textModeY === TextModeY.CENTER) {
							ay -= tmh / 2;
						} else if (this.textModeY === TextModeY.BOTTOM) {
							ay -= tmh;
						}
					}

					textRequests.push({ text: blocks[i], x: ax, y: ay });
				}
				return textRequests
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
			triangle(v1, v2, v3) {
				pathObj.triangle(v1, v2, v3);
				this.c.fill();
			},
			text(font, text, x, y, pack) {
				let req = pathObj.text(font, text, x, y, pack);
				for (let r of req) {
					this.c.fillText(r.text, r.x, r.y);
				}
			},
			textLine(font, text, x, y) {
				let req = pathObj.textLine(font, text, x, y);
				this.c.fillText(req.text, req.x, req.y);
			},
			shape(v) {
				pathObj.shape(v);
				this.c.fill();
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
			triangle(v1, v2, v3) {
				pathObj.triangle(v1, v2, v3);
				this.c.stroke();
			},
			text(font, text, x, y, pack) {
				let req = pathObj.text(font, text, x, y, pack);
				for (let r of req) {
					this.c.strokeText(r.text, r.x, r.y);
				}
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
				this.c.beginPath();
				this.c.moveTo(x, y)
				this.c.lineTo(x1, y1)
				this.c.stroke()
			},
			measure(font, text, x, y, x1, y1) {
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
					y = x.y;
					x = x.x;
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
			triangle(v1, v2, v3) {
				pathObj.triangle(v1, v2, v3);
				this.c.clip();
			},
			shape(v) {
				pathObj.shape(v);
				this.c.clip();
			},
			infer(obj) {
				if (obj.radius !== undefined) {
					this.clipObj.circle(obj);
				} else if (obj.width !== undefined) {
					this.clipObj.rect(obj);
				} else if (obj.vertices !== undefined) {
					this.clipObj.shape(obj.vertices);
				}
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
				if (typeof x === "object") {
					y = x.y;
					x = x.x;
				}
				this.drawImageInternal(x, y, this.currentImage.width, this.currentImage.height);
			},
			inferHeight(x, y, w) {
				if (typeof x === "object") {
					w = y;
					y = x.y;
					x = x.x;
				}
				let h = this.currentImage.height;
				if (w !== undefined) h *= w / this.currentImage.width;
				else w = this.currentImage.width;
				this.drawImageInternal(x, y, w, h);
			},
			inferWidth(x, y, h) {
				if (typeof x === "object") {
					h = y;
					y = x.y;
					x = x.x;
				}
				let w = this.currentImage.width;
				if (h !== undefined) w *= h / this.currentImage.height;
				else h = this.currentImage.height;
				this.drawImageInternal(x, y, w, h);
			},
			rect(x, y, width, height) {
				this.drawImageInternal(x, y, width, height);
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
	set transform(a) {
		const m = a;
		this.c.setTransform(m[0] * this.pixelRatio, m[1] * this.pixelRatio, m[3] * this.pixelRatio, m[4] * this.pixelRatio, m[6] * this.pixelRatio, m[7] * this.pixelRatio);
	}
	get transform() {
		const { a, b, c, d, e, f } = this.c.getTransform();
		const ratio = 1 / this.pixelRatio;
		return Matrix3.create(
			a * ratio, c * ratio, e * ratio,
			b * ratio, d * ratio, f * ratio,
			0, 0, 1
		);
	}
	resize(width, height) {
		const px = this.preservePixelart;
		const al = this.alpha;
		this.width = width;
		this.height = height;
		this.canvas.width = width * this.pixelRatio;
		this.canvas.height = height * this.pixelRatio;
		this.c.scale(this.pixelRatio, this.pixelRatio);
		this.alpha = al;
		this.preservePixelart = px;
	}
	multiplyTransform(newTransform) {
		this.c.transform(newTransform[0], newTransform[1], newTransform[3], newTransform[4], newTransform[6], newTransform[7]);
	}
	setCursor(cursor) {
		let style = this.canvas.style;
		if ("cursor" in style) style.cursor = cursor;
	}
	getPixel(x, y) {
		let d = this.c.getImageData(x * this.pixelRatio, y * this.pixelRatio, 1, 1).data;
		return new Color(d[0], d[1], d[2], d[3] / 255);
	}
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
	draw(color) {
		this.c.fillStyle = this.getContextColor(color);
		return this.drawObj;
	}
	stroke(color, lineWidth = 1, lineCap = LineCap.FLAT, lineJoin = LineJoin.BEVEL) {
		this.c.strokeStyle = this.getContextColor(color);
		this.c.lineJoin = this.lineJoinMap.get(lineJoin);
		this.c.lineCap = this.lineCapMap.get(lineCap);
		this.c.lineWidth = lineWidth;
		return this.strokeObj;
	}
	drawImageInternal(x, y, w, h) {
		if (!this.currentImage.loaded) return;
		if (typeof x === "object") {
			h = x.height;
			w = x.width;
			y = x.y;
			x = x.x;
		}
		this.c.drawImage(this.currentImageCIS, x, y, w, h);
	}
	image(img) {
		this.currentImageCIS = img.makeImage();
		this.currentImage = img;
		return this.imageObj;
	}
	clip() {
		this.save();
		return this.clipObj;
	}
	unclip() {
		this.restore();
	}
	contentToFrame() {
		let n = new Frame(this.width, this.height);
		n.c.drawImage(this.canvas, 0, 0);
		return n;
	}
	sigmoid(x) {
		return 1 / (1 + (Math.E ** -x));
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
		if (typeof x === "object") {
			y = x.y;
			x = x.x;
		}
		this.c.translate(x, y);
	}
	scale(x, y = x) {
		if (typeof x === "object") {
			y = x.y;
			x = x.x;
		}
		this.c.scale(x, y);
	}
	rotate(a) {
		this.c.rotate(a);
	}
	clearTransformations() {
		this.c.resetTransform();
		this.scale(this.pixelRatio);
	}
	save() {
		this.c.save();
	}
	restore() {
		this.c.restore();
		this._alpha = this.c.globalAlpha;
	}
	clearRect(x, y, w, h) {
		if (typeof x === "object") {
			h = x.height;
			w = x.width;
			y = x.y;
			x = x.x;
		}
		this.c.clearRect(x, y, w, h);
	}
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
	fill(color) {
		this.c.fillStyle = this.getContextColor(color);
		this.c.fillRect(0, 0, this.width, this.height);
	}
	rotateAround(x, y, r) {
		this.translate(x, y)
		this.rotate(r);
		this.translate(-x, -y);
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
				let [clipX = 0, clipY = 0, clipW = currentImage.width, clipH = currentImage.height] = drawArgs.slice(1);
				if (clipX instanceof Rect) {
					clipH = clipX.height;
					clipW = clipX.width;
					clipY = clipX.y;
					clipX = clipX.x;
				}

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
						this.c.drawImage(img, clipX, clipY, clipW, clipH, boundX, boundY, boundW, boundH);
					}.bind(this);
				}

				if (shape === "circle") {
					return function () {
						this.c.save();
						this.c.beginPath();
						this.c.arc(shapeArgs.x, shapeArgs.y, shapeArgs.radius, 0, 6.283185307179586);
						this.c.clip();
						this.c.drawImage(img, clipX, clipY, clipW, clipH, boundX, boundY, boundW, boundH);
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
						this.c.drawImage(img, clipX, clipY, clipW, clipH, boundX, boundY, boundW, boundH);
						this.c.restore();
					}.bind(this);
				}

				break;
		}
		return function () { };
	}
}