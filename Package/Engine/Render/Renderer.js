class Vertex {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
	toString() {
		return "(" + this.x + ", " + this.y + ")";
	}
}
const TextModeX = {
	LEFT: Symbol("LEFT"),
	CENTER: Symbol("CENTER"),
	RIGHT: Symbol("RIGHT")
};
const TextModeY = {
	TOP: Symbol("TOP"),
	CENTER: Symbol("CENTER"),
	BOTTOM: Symbol("BOTTOM")
};
const TextMode = { };
for (let x in TextModeX) for (let y in TextModeY) {
	TextMode[y + "_" + x] = [TextModeX[x], TextModeY[y]];
}
class Artist {
	constructor(canvas, width, height) {
		this.canvas = canvas;

		if (this.canvas.style) {
			this.canvas.style.position = "absolute";
		}

		this.c = this.canvas.getContext('2d');

		//Device Pixel Ratio
		if (this.canvas.style) {
			let w = width;
			let h = height;
			this.canvas.style.width = w;
			this.canvas.style.height = h;
			this.canvas.width = w * devicePixelRatio;
			this.canvas.height = h * devicePixelRatio;
			this.c.scale(devicePixelRatio, devicePixelRatio);
		} else {
			this.canvas.width = width;
			this.canvas.height = height;
		}


		this.__c = this.c;
		this._background = new Color(0, 0, 0, 0);
		this.textModeX = TextModeX.LEFT;
		this.textModeY = TextModeY.TOP;
		let pathObj = {
			circle(x, y, radius) {
				radius = Math.abs(radius);
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
				this.c.beginPath();
				this.c.arc(x, y, radius, 0, 2 * Math.PI);
			},
			arc(x, y, radius, startAngle, endAngle, counterClockwise) {
				radius = Math.abs(radius);
				this.c.beginPath();
				this.c.arc(x, y, radius, startAngle, endAngle, counterClockwise);
			},
			sector(x, y, radius, startAngle, endAngle) {
				radius = Math.abs(radius);
				this.c.beginPath();
				this.c.moveTo(x, y);
				this.c.lineTo(x + radius * Math.cos(startAngle), y + radius * Math.sin(startAngle));
				this.c.arc(x, y, radius, startAngle, endAngle);
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
			lineText(font, text, x, y) {
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
				const yOffset =  font.size * .24 - font.lineHeight / 2;
				for (let i = 0; i < blocks.length; i++) {
					let ax = x;
					let ay = y + (i + 1) * font.lineHeight + yOffset;
					let tmw = this.c.measureText(blocks[i]).width;
					if (this.textModeX === TextModeX.LEFT);
					else if (this.textModeX === TextModeX.CENTER) {
						ax -= tmw / 2;
					} else if (this.textModeX === TextModeX.RIGHT) {
						ax -= tmw;
					}
					if (this.textModeY === TextModeY.TOP);
					else if (this.textModeY === TextModeY.CENTER) {
						ay -= tmh / 2;
					} else if (this.textModeY === TextModeY.BOTTOM) {
						ay -= tmh;
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
				pathObj.arc(x, y, radius, startAngle, endAngle);
				this.c.fill();
			},
			sector(x, y, radius, startAngle, endAngle) {
				pathObj.sector(x, y, radius, startAngle, endAngle);
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
			lineText(font, text, x, y) {
				let req = pathObj.lineText(font, text, x, y);
				this.c.fillText(req.text, req.x, req.y);
			},
			shape(v) {
				pathObj.shape(v);
				this.c.fill();
			},
			infer(obj) {
				if (obj.radius !== undefined) {
					this.draw(this.c.fillStyle).circle(obj);
				} else if (obj.width !== undefined) {
					this.draw(this.c.fillStyle).rect(obj);	
				} else if (obj.vertices !== undefined) {
					this.draw(this.c.fillStyle).shape(obj.vertices);
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
				pathObj.arc(x, y, radius, startAngle, endAngle);
				this.c.stroke();
			},
			sector(x, y, radius, startAngle, endAngle) {
				pathObj.sector(x, y, radius, startAngle, endAngle);
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
			lineText(font, text, x, y) {
				let req = pathObj.lineText(font, text, x, y);
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
			spline(spline, prec = 100) {
				let inc = 1 / prec;
				this.c.beginPath();
				this.c.moveTo(spline.a.x, spline.a.y);
				for (let i = 0; i < 1; i += inc) {
					const p = spline.getPoint(i);
					this.c.lineTo(p.x, p.y);
				}
				this.c.lineTo(spline.d.x, spline.d.y);
				this.c.stroke();
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
				this.c.beginPath();
				this.c.moveTo(x, y)
				this.c.lineTo(x1, y1)
				this.c.stroke()
			},
			measure(font, text, x, y, x1, y1) {
				if (typeof x == "object") {
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
			arrow(x, y, x1, y1) {
				if (typeof x == "object") {
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
					this.stroke(this.c.strokeStyle, this.c.lineWidth, this.c.lineCap, this.c.lineJoin).circle(obj);
				} else if (obj.radius !== undefined) {
					this.stroke(this.c.strokeStyle, this.c.lineWidth, this.c.lineCap, this.c.lineJoin).rect(obj);	
				} else if (obj.vertices !== undefined) {
					this.stroke(this.c.strokeStyle, this.c.lineWidth, this.c.lineCap, this.c.lineJoin).shape(obj.vertices);
				} else if (obj instanceof Line) {
					this.stroke(this.c.strokeStyle, this.c.lineWidth, this.c.lineCap, this.c.lineJoin).line(obj);
				} else if (obj instanceof Spline) {
					this.stroke(this.c.strokeStyle, this.c.lineWidth, this.c.lineCap, this.c.lineJoin).spline(obj);
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
			sector(x, y, radius, startAngle, endAngle) {
				pathObj.sector(x, y, radius, startAngle, endAngle);
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
					this.clip().circle(obj);
				} else if (obj.width !== undefined) {
					this.clip().rect(obj);	
				} else if (obj.vertices !== undefined) {
					this.clip().shape(obj.vertices);
				}
			}
		}
		for (let func in this.clipObj) {
			this.clipObj[func] = this.clipObj[func].bind(this);
		}
		this.imageStyle = null;
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
			sector(x, y, radius, startAngle, endAngle) {
				this.clip().sector(x, y, radius, startAngle, endAngle);
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
				this.drawImageInternal(x, y, this.imageStyle.width, this.imageStyle.height);
			},
			inferHeight(x, y, w) {
				let h = this.imageStyle.height;
				if (w !== undefined) h *= w / this.imageStyle.width;
				else w = this.imageStyle.width;
				this.drawImageInternal(x, y, w, h);
			},
			inferWidth(x, y, h) {
				let w = this.imageStyle.width;
				if (h !== undefined) w *= h / this.imageStyle.height;
				else h = this.imageStyle.height;
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
					this.image(this.imageStyle).circle(obj);
				} else if (obj.width !== undefined) {
					this.image(this.imageStyle).rect(obj);	
				} else if (obj.vertices !== undefined) {
					this.image(this.imageStyle).shape(obj.vertices);
				}
			}

		};
		for (let func in this.imageObj) {
			this.imageObj[func] = this.imageObj[func].bind(this);
		}
		this.state = {
			rotation: 0,
			translation: {
				x: 0,
				y: 0
			},
			scale: {
				x: 1,
				y: 1
			}
		}
	}
	set width(a) {
		this.canvas.width = a * devicePixelRatio;
		if (this.canvas.style) this.canvas.style.width = a;
		this.c.scale(devicePixelRatio, devicePixelRatio);
	}
	get width() {
		return this.canvas.width / devicePixelRatio;
	}
	set height(a) {
		this.canvas.height = a * devicePixelRatio;
		if (this.canvas.style) this.canvas.style.height = a;
		this.c.scale(devicePixelRatio, devicePixelRatio);
	}
	get height() {
		return this.canvas.height / devicePixelRatio;
	}
	get middle() {
		return new Vector2(this.width / 2, this.height / 2);
	}
	set textMode(a) {
		this.textModeX = a[0];
		this.textModeY = a[1];
	}
	get textMode() {
		let vx = this.textModeX.toString();
		vx = vx.slice(7, vx.length - 1);
		let vy = this.textModeY.toString();
		vy = vy.slice(7, vy.length - 1);
		return TextMode[vy + "_" + vx];
	}
	set preservePixelart(a) {
		this.c.imageSmoothingEnabled = !a;
	}
	get preservePixelart() {
		return !this.c.imageSmoothingEnabled;
	}
	get background() {
		return this._background;
	}
	set background(a) {
		this._background = a;
		this.setBackground(a);
	}
	set alpha(a) {
		this.c.globalAlpha = a;
	}
	get alpha() {
		return this.c.globalAlpha;
	}
	setCursor(cursor) {
		let style = this.canvas.style;
		if ("cursor" in style) style.cursor = cursor;
	}
	getPixel(x, y) {
		let d = this.c.getImageData(x * devicePixelRatio, y * devicePixelRatio, 1, 1).data;
		return new Color(d[0], d[1], d[2], d[3] / 255);
	}
	setPixel(x, y, col) {
		let data = new Uint8ClampedArray(4);
		data[0] = col.red;
		data[1] = col.green;
		data[2] = col.blue;
		data[3] = col.alpha * 255;
		this.c.putImageData(new ImageData(data, 1, 1), x, y);
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
	stroke(color, lineWidth = 1, endStyle = "flat", lineJoin = "bevel") {
		this.c.strokeStyle = this.getContextColor(color);
		if (endStyle === "flat") endStyle = "butt";
		this.c.lineJoin = lineJoin;
		this.c.lineCap = endStyle;
		this.c.lineWidth = lineWidth;
		return this.strokeObj;
	}
	drawImageInternal(x, y, w, h) {
		if (typeof x === "object") {
			h = x.height;
			w = x.width;
			y = x.y;
			x = x.x;
		}
		this.drawImage(this.imageStyle, x, y, w, h);
	}
	image(img) {
		this.imageStyle = img;
		return this.imageObj;
	}
	clip() {
		this.save();
		return this.clipObj;
	}
	unclip() {
		this.restore();
	}
	embody(frame) {
		this.__c = this.c;
		this.c = frame.c.c;
	}
	unembody() {
		this.c = this.__c;
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
	simpleCircle(color, border) {
		return function () {
			this.home.c.draw(color).circle(this.middle.x, this.middle.y, this.width / 2);
			this.home.c.stroke(border, 2).circle(this.middle.x, this.middle.y, this.width / 2);
		}
	}
	simpleRect(color, border) {
		return function () {
			this.home.c.draw(color).rect(this.x, this.y, this.width, this.height);
			this.home.c.stroke(border, 2).rect(this.x, this.y, this.width, this.height);
		}
	}
	drawCircle(color, x, y, radius) {
		this.c.fillStyle = color;
		this.c.beginPath();
		this.c.arc(x, y, radius, 0, 2 * Math.PI);
		this.c.fill();
	}
	translate(x, y) {
		if (typeof x == "object") {
			y = x.y;
			x = x.x;
		}
		this.state.translation.x += x;
		this.state.translation.x += y;
		this.c.translate(x, y);
	}
	scale(x, y = x) {
		if (typeof x == "object") {
			y = x.y;
			x = x.x;
		}
		this.state.scale.x *= x;
		this.state.scale.x *= y;
		this.c.scale(x, y);
	}
	rotate(a) {
		this.c.rotate(a);
		this.state.rotation += a;
	}
	clearTransformations() {
		this.c.resetTransform();
	}
	save() {
		this.c.save();
	}
	restore() {
		this.c.restore();
	}
	clearRect(x, y, w, h) {
		if (x.width) {
			h = x.height;
			w = x.width;
			y = x.y;
			x = x.x;
		}
		this.c.clearRect(x, y, w, h);
	}
	clear() {
		this.c.clearRect(0, 0, this.width, this.height);
	}
	rotateAround(x, y, r) {
		this.translate(x, y)
		this.rotate(r);
		this.translate(-x, -y);
	}
	drawImage(img, x, y, width, height) {
		let cis = img.makeImage(); //CanvasImageSource
		if (!img.loaded) return;
		this.c.drawImage(cis, x, y, width, height);
	}
	drawWithAlpha(a, shape) {
		this.c.globalAlpha = a;
		shape();
		this.c.globalAlpha = 1;
	}
	setBackground(color) {
		let c = color;
		if (color instanceof Color) c = color.getRGBA();
		if (color instanceof Image) c = "url(" + color.src + ")";
		this.canvas.style.background = c;
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
				let imageStyle = drawArgs[0];
				let [clipX = 0, clipY = 0, clipW = imageStyle.width, clipH = imageStyle.height] = drawArgs.slice(1);
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

				let img = imageStyle;
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