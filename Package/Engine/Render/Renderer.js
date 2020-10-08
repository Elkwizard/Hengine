class Vertex {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
	toString() {
		return "(" + this.x + ", " + this.y + ")";
	}
}
const TextMode = {
	LEFT: Symbol("LEFT"),
	RIGHT: Symbol("RIGHT"),
	CENTER: Symbol("CENTER"),
	TOP: Symbol("TOP"),
	BOTTOM: Symbol("BOTTOM")
};
class Artist {
	constructor(canvasID, width, height) {
		if (typeof canvasID === "object") this.canvas = canvasID;
		else this.canvas = document.getElementById(canvasID);
		if (this.canvas.style) {
			this.canvas.style.position = "absolute";
		}
		if (width) {
			this.canvas.width = width;
		}
		if (height) {
			this.canvas.height = height;
		}

		this.custom = {};
		this.c = this.canvas.getContext('2d');
		this.__c = this.c;
		this._background = new Color(0, 0, 0, 0);
		this.textMode = TextMode.LEFT;
		this.textModeVertical = TextMode.TOP;
		this.currentlyClipped = false;
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
			text(font, text, x, y, pack = false) {
				if (typeof x === "object") {
					y = x.y;
					x = x.x;
					pack = y || false;
				}
				text = (text + "").replace(/\t/, "    ");
				if (pack) text = this.packText(font, text, pack);
				this.c.font = font;
				let fs = this.getFontValue(font);
				let tmh = this.getTextHeight(font, text);
				let blocks = text.split("\n");
				let textRequests = [];
				for (let i = 0; i < blocks.length; i++) {
					let ax = x;
					let ay = y + (i + 1) * fs - fs * 0.26;
					let tmw = this.c.measureText(blocks[i]).width;
					if (this.textMode === TextMode.LEFT);
					else if (this.textMode === TextMode.CENTER) {
						ax -= tmw / 2;
					} else if (this.textMode === TextMode.RIGHT) {
						ax -= tmw;
					}
					if (this.textModeVertical === TextMode.TOP);
					else if (this.textModeVertical === TextMode.CENTER) {
						ay -= tmh / 2;
					} else if (this.textModeVertical === TextMode.BOTTOM) {
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

				let width = this.getTextWidth(font, text);
				let height = this.getTextHeight(font, text);

				let dx = x1 - x;
				let dy = y1 - y;
				let nx = -dy;
				let ny = dx;
				let m = Math.sqrt((dx ** 2) + (dy ** 2));
			
				if (!m) return;

				nx *= height / m / 2;
				ny *= height / m / 2;
				
				let length = (m - (width + this.getFontValue(font))) / 2;
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
				this.c.font = font;
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
		this.canvas.width = a;
	}
	get width() {
		return this.canvas.width;
	}
	set height(a) {
		this.canvas.height = a;
	}
	get height() {
		return this.canvas.height;
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
	get middle() {
		return { x: this.canvas.width / 2, y: this.canvas.height / 2 };
	}
	set alpha(a) {
		this.c.globalAlpha = a;
	}
	get alpha() {
		return this.c.globalAlpha;
	}
	getPixel(x, y) {
		let d = this.c.getImageData(x, y, 1, 1).data;
		return new Color(d[0], d[1], d[2], d[3])
	}
	setPixel(x, y, col) {
		let data = new Uint8ClampedArray(4);
		data[0] = col.red;
		data[1] = col.green;
		data[2] = col.blue;
		data[3] = col.alpha * 255;
		this.c.putImageData(new ImageData(data, 1, 1), x, y);
	}
	getTexture(x = 0, y = 0, w = this.width, h = this.height) {
		let imageData = this.c.getImageData(x, y, w, h);
		let tex = new Texture(w, h);
		tex.imageData = imageData;
		let data = imageData.data;
		for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) {
			let inx = (i + j * w) * 4;
			let r = data[inx + 0];
			let g = data[inx + 1];
			let b = data[inx + 2];
			let a = data[inx + 3];
			tex.pixels[i][j] = new Color(r, g, b, a);
		}
		tex.changed = true;
		return tex;
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
		if (!this.currentlyClipped) {
			this.currentlyClipped = true;
			this.save();
		}
		return this.clipObj;
	}
	unclip() {
		this.restore();
		this.currentlyClipped = false;
	}
	embody(frame) {
		this.__c = this.c;
		this.c = frame.c.c;
	}
	unembody() {
		this.c = this.__c;
	}
	getFontValue(font) {
		return parseInt(font.slice(0, font.indexOf("px")));
	}
	packText(font, str, pack) {
		this.c.font = font;
		let text = str.replace(/\t/g, "    ");
		let words = text.split(" ");
		let lines = [""];
		for (let i = 0; i < words.length; i++) {
			let word = words[i];
			let prevLen = lines[lines.length - 1].length;
			lines[lines.length - 1] += (i ? " " : "") + word;
			if (this.c.measureText(lines[lines.length - 1]).width > pack) {
				lines[lines.length - 1] = lines[lines.length - 1].slice(0, prevLen);
				lines.push(word);
			}
			if (word === "\n") lines.push("");
		}
		return lines.join("\n");
	}
	getTextWidth(font, str) {
		str += "";
		this.c.font = font;
		let spl = str.replace(/\t/g, "    ").split("\n");
		return Math.max(...spl.map(e => this.c.measureText(e).width));
	}
	getTextHeight(font, str, pack) {
		str += "";
		if (pack) str = this.packText(font, str, pack);
		return str.split("\n").length * this.getFontValue(font);
	}
	contentToFrame() {
		let n = new Frame(this.canvas.width, this.canvas.height);
		n.c.drawImage(this.canvas, 0, 0);
		return n;
	}
	sigmoid(x) {
		return 1 / (1 + (Math.E ** -x));
	}
	invertX() {
		this.translate(this.canvas.width, 0);
		this.scale(-1, 1);
	}
	invertY() {
		this.translate(0, this.canvas.height);
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
		this.c.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}
	color(color) {
		this.c.fillStyle = this.c.strokeStyle = color;
	}
	lerp(a, b, t) {
		return a * (1 - t) + b * t;
	}
	quadLerp(a, b, c, d, tx, ty) {
		const l = this.lerp(a, c, ty);
		const r = this.lerp(b, d, ty);
		let per = this.lerp(l, r, tx);
		return per;
	}
	noise(x, f = 1, seed = 0) {
		return Random.perlin(x, f, seed);
	}
	noise2D(x, y, f = 1, seed = 0) {
		return Random.perlin2D(x, y, f, seed);
	}
	rotateAround(x, y, r) {
		this.translate(x, y)
		this.rotate(r);
		this.translate(-x, -y);
	}
	drawImage(img, x, y, width, height) {
		if (img instanceof ImageType) img = img.requestImage(width, height);
		if (width === undefined) width = img.width;
		if (height === undefined) height = img.height;
		this.c.drawImage(img, x, y, width, height);
	}
	drawAnimation(animation, x, y, width, height, advance = true) {
		if (typeof x === "object") {
			this.drawAnimation(animation, x.x, x.y, x.width, x.height, y);
		}
		if (advance) animation.advance();
		let img = animation.img;
		if (img instanceof Frame) img = img.img;
		if (width === undefined) width = img.width;
		if (height === undefined) height = img.height;
		this.c.drawImage(img, x, y, width, height);
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
				if (img instanceof ImageType) img = img.requestImage(boundW, boundH);

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