function clamp(n, a, b) {
	return Math.max(a, Math.min(b, n));
}
function lerp(a, b, t) {
	return a * (1 - t) + b * t;
}
function quadLerp(a, b, c, d, tx, ty) {
	let mDist = 1;
	let distA = Math.max(0, mDist - Math.sqrt(tx ** 2 + ty ** 2));
	let distB = Math.max(0, mDist - Math.sqrt((1 - tx) ** 2 + ty ** 2));
	let distC = Math.max(0, mDist - Math.sqrt(tx ** 2 + (1 - ty) ** 2));
	let distD = Math.max(0, mDist - Math.sqrt((tx - 1) ** 2 + (1 - ty) ** 2));
	let A_T = a * distA;
	let B_T = b * distB;
	let C_T = c * distC;
	let D_T = d * distD;
	let result = (A_T + B_T + C_T + D_T) / (distA + distB + distC + distD);
	return result;
}
class Vertex {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
	toString() {
		return "(" + this.x + ", " + this.y + ")";
	}
}
class Artist {
	constructor(canvasID, width, height) {
		if (typeof canvasID === "object") this.canvas = canvasID;
		else this.canvas = document.getElementById(canvasID);
		if (this.canvas.style) {
			this.canvas.style.position = "absolute";
			this.canvas.style.left = "50%";
			this.canvas.style.top = "50%";
			this.canvas.style.transform = "translate(-50%, -50%)";
		}
		if (width) {
			this.canvas.width = width;
		}
		if (height) {
			this.canvas.height = height;
		}

		this.custom = {};
		this.c = this.canvas.getContext('2d');
		this._background = new Color(0, 0, 0, 0);
		this.textMode = "left";
		this.currentlyClipped = false;
		this.drawObj = {
			circle: function (x, y, radius) {
				radius = Math.abs(radius);
				if (typeof x === "object") {
					radius = x.radius;
					y = x.y;
					x = x.x;
				}
				this.c.beginPath();
				this.c.arc(x, y, radius, 0, 2 * Math.PI);
				this.c.fill();
				this.c.closePath();
			},
			arc: function (x, y, radius, startAngle, endAngle, counterClockwise) {
				radius = Math.abs(radius);
				this.c.beginPath();
				this.c.arc(x, y, radius, startAngle, endAngle, counterClockwise);
				this.c.fill();
			},
			sector: function (x, y, radius, startAngle, endAngle) {
				radius = Math.abs(radius);
				this.c.beginPath();
				this.c.moveTo(x, y);
				this.c.lineTo(x + radius * Math.cos(startAngle), y + radius * Math.sin(startAngle));
				this.c.arc(x, y, radius, startAngle, endAngle);
				this.c.lineTo(x, y);
				this.c.fill();
			},
			ellipse: function (x, y, rx, ry) {
				rx = Math.abs(rx);
				ry = Math.abs(ry);
				this.c.beginPath();
				this.c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
				this.c.fill();
			},
			rect: function (x, y, width, height) {
				if (typeof x === "object") {
					this.c.fillRect(x.x, x.y, x.width, x.height);
				} else {
					this.c.fillRect(x, y, width, height);
				}
			},
			triangle: function (v1, v2, v3) {
				this.c.beginPath();
				if (v1 instanceof Triangle) {
					v2 = v1.vertices[1];
					v3 = v1.vertices[2];
					v1 = v1.vertices[0];
				}
				this.c.moveTo(v1.x, v1.y);
				this.c.lineTo(v2.x, v2.y);
				this.c.lineTo(v3.x, v3.y);
				this.c.lineTo(v1.x, v1.y);
				this.c.fill();
				this.c.closePath();
			},
			text: function (font, text, x, y) {
				text = text + "";
				this.c.font = font;
				let fs = parseInt(font);
				let blocks = text.split("\n");
				for (let i = 0; i < blocks.length; i++) {
					let ax = x;
					let tmb = this.c.measureText(blocks[i]);
					if (this.textMode == "left") {

					} else if (this.textMode == "center") {
						ax -= tmb.width / 2;
					} else if (this.textMode == "right") {
						ax -= tmb.width;
					}
					this.c.fillText(blocks[i], ax, y + ((i + 1) * fs));
				}
			},
			shape: function (...v) {
				if (v.length) {
					this.c.beginPath();
					this.c.moveTo(v[0].x, v[0].y);
					for (let i = 0; i <= v.length; i++) {
						let index = i % v.length;
						this.c.lineTo(v[index].x, v[index].y);
					}
					this.c.fill();
					this.c.closePath();
				}
			},
			infer: function (obj) {
				if (obj.radius !== undefined) {
					this.draw(this.c.fillStyle).circle(obj);
				} else {
					this.draw(this.c.fillStyle).shape(...obj.getCorners());
				}
			}
		}
		for (let func in this.drawObj) {
			this.drawObj[func] = this.drawObj[func].bind(this);
		}
		this.strokeObj = {
			circle: function (x, y, radius) {
				radius = Math.abs(radius);
				if (typeof x === "object") {
					radius = x.radius;
					y = x.y;
					x = x.x;
				}
				this.c.arc(x, y, radius, 0, 2 * Math.PI);
				this.c.stroke();
				this.c.closePath();
			},
			arc: function (x, y, radius, startAngle, endAngle, counterClockwise) {
				radius = Math.abs(radius);
				this.c.beginPath();
				this.c.arc(x, y, radius, startAngle, endAngle, counterClockwise);
				this.c.stroke();
				this.c.closePath();
			},
			sector: function (x, y, radius, startAngle, endAngle) {
				radius = Math.abs(radius);
				this.c.beginPath();
				this.c.moveTo(x, y);
				this.c.lineTo(x + radius * Math.cos(startAngle), y + radius * Math.sin(startAngle));
				this.c.arc(x, y, radius, startAngle, endAngle);
				this.c.lineTo(x, y);
				this.c.stroke();
			},
			ellipse: function (x, y, rx, ry) {
				rx = Math.abs(rx);
				ry = Math.abs(ry);
				this.c.beginPath();
				this.c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
				this.c.stroke();
			},
			rect: function (x, y, width, height) {
				if (x instanceof Shape) {
					this.c.strokeRect(x.x, x.y, x.width, x.height);
				} else {
					this.c.strokeRect(x, y, width, height);
				}
			},
			triangle: function (v1, v2, v3) {
				this.c.beginPath();
				if (v1 instanceof Triangle) {
					v2 = v1.vertices[1];
					v3 = v1.vertices[2];
					v1 = v1.vertices[0];
				}
				this.c.moveTo(v1.x, v1.y);
				this.c.lineTo(v2.x, v2.y);
				this.c.lineTo(v3.x, v3.y);
				this.c.lineTo(v1.x, v1.y);
				this.c.stroke();
				this.c.closePath();
			},
			text: function (font, text, x, y) {
				text = text + "";
				this.c.font = font;
				let fs = parseInt(font);
				let blocks = text.split("\n");
				for (let i = 0; i < blocks.length; i++) {
					let ax = x;
					let tmb = this.c.measureText(blocks[i]);
					if (this.textMode == "left") {

					} else if (this.textMode == "center") {
						ax -= tmb.width / 2;
					} else if (this.textMode == "right") {
						ax -= tmb.width;
					}
					this.c.strokeText(blocks[i], ax, y + ((i + 1) * fs));
				}
			},
			line: function (x, y, x1, y1) {
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
				this.c.moveTo(x, y)
				this.c.lineTo(x1, y1)
				this.c.stroke()
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
				let angle = Math.atan2(y1 - y, x1 - x);
				let mag = Math.sqrt((x1 - x) ** 2 + (y1 - y) ** 2);
				this.translate(x, y);
				this.rotate(angle);
				this.c.moveTo(0, 0);
				this.c.lineTo(mag - this.c.lineWidth * 4 + 0.5, 0);
				this.c.stroke();
				this.draw(this.c.strokeStyle).triangle(
					P(mag - this.c.lineWidth * 4, -this.c.lineWidth * 2),
					P(mag - this.c.lineWidth * 4, this.c.lineWidth * 2),
					P(mag, 0)
				);
				this.rotate(-angle);
				this.translate(-x, -y);
			},
			connector: function (...points) {
				for (let i = 0; i < points.length; i++) {
					let p1 = points[i];
					let p2 = points[i + 1];
					if (p2) this.stroke(this.c.strokeStyle, this.c.lineWidth, this.c.lineCap).line(p1, p2);
				}
			},
			arrowConnector: function (...points) {
				for (let i = 0; i < points.length; i++) {
					let p1 = points[i];
					let p2 = points[i + 1];
					if (p2 && i < points.length - 2) this.stroke(this.c.strokeStyle, this.c.lineWidth, this.c.lineCap).line(p1, p2);
					else if (i == points.length - 2) this.stroke(this.c.strokeStyle, this.c.lineWidth, this.c.lineCap).arrow(p1, p2);
				}
			},
			shape: function (...v) {
				if (v.length) {
					this.c.beginPath();
					this.c.moveTo(v[0].x, v[0].y);
					for (let i = 0; i <= v.length; i++) {
						let index = i % v.length;
						this.c.lineTo(v[index].x, v[index].y);
					}
					this.c.stroke();
					this.c.closePath();
				}
			},
			infer: function (obj) {
				if (obj.radius !== undefined) this.stroke(this.c.strokeStyle, this.c.lineWidth, this.c.lineCap).circle(obj);
				else this.stroke(this.c.strokeStyle, this.c.lineWidth, this.c.lineCap).shape(...obj.getCorners());
			}
		}
		for (let func in this.strokeObj) {
			this.strokeObj[func] = this.strokeObj[func].bind(this);
		}
		this.clipObj = {
			rect(x, y, width, height) {
				if (typeof x === "object") {
					width = x.width;
					height = x.height;
					y = x.y;
					x = x.x;
				}
				this.c.beginPath();
				this.c.rect(x, y, width, height);
				this.c.closePath();
				this.c.clip();
			},
			circle(x, y, radius) {
				radius = Math.abs(radius);
				if (typeof x === "object") {
					radius = x.radius;
					y = x.y;
					x = x.x;
				}
				this.c.beginPath();
				this.c.arc(x, y, radius, 0, 2 * Math.PI);
				this.c.closePath();
				this.c.clip();
			},
			shape: function (...v) {
				if (v.length) {
					this.c.beginPath();
					this.c.moveTo(v[0].x, v[0].y);
					for (let i = 0; i <= v.length; i++) {
						let index = i % v.length;
						this.c.lineTo(v[index].x, v[index].y);
					}
					this.c.closePath();
					this.c.clip();
				}
			},
			text: function (font, text, x, y) {
				text = text + "";
				this.c.font = font;
				let fs = parseInt(font);
				this.c.beginPath();
				let blocks = text.split("\n");
				for (let i = 0; i < blocks.length; i++) {
					let ax = x;
					let tmb = this.c.measureText(blocks[i]);
					if (this.textMode == "left") {

					} else if (this.textMode == "center") {
						ax -= tmb.width / 2;
					} else if (this.textMode == "right") {
						ax -= tmb.width;
					}
					this.c.text(blocks[i], ax, y + ((i + 1) * fs));
				}
				this.c.clip();
			},
			arc: function (x, y, radius, startAngle, endAngle, counterClockwise) {
				radius = Math.abs(radius);
				this.c.beginPath();
				this.c.arc(x, y, radius, startAngle, endAngle, counterClockwise);
				this.c.closePath();
				this.c.clip();
			},
			sector: function (x, y, radius, startAngle, endAngle) {
				radius = Math.abs(radius);
				this.c.beginPath();
				this.c.moveTo(x, y);
				this.c.lineTo(x + radius * Math.cos(startAngle), y + radius * Math.sin(startAngle));
				this.c.arc(x, y, radius, startAngle, endAngle);
				this.c.lineTo(x, y);
				this.c.closePath();
				this.c.clip();
			},
			ellipse: function (x, y, rx, ry) {
				rx = Math.abs(rx);
				ry = Math.abs(ry);
				this.c.beginPath();
				this.c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
				this.c.closePath();
				this.c.clip();
			},
			infer: function (obj) {
				if (obj.radius !== undefined) this.clip().circle(obj);
				else this.clip().shape(...obj.getCorners());
			}
		};
		for (let func in this.clipObj) {
			this.clipObj[func] = this.clipObj[func].bind(this);
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
	getPixel(x, y) {
		let d = this.c.getImageData(x, y, 1, 1).data;
		return new Color(d[0], d[1], d[2], d[3])
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
	scale(x, y) {
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
	scale(x, y) {
		this.c.scale(x, y);
	}
	draw(color) {
		let c = color;
		if (color instanceof Color) c = color.get_RGBA();
		if (color instanceof Fade) c = color.getColor();
		this.c.fillStyle = c;
		return this.drawObj;
	}
	stroke(color, lineWidth = 1, endStyle = "flat") {
		let c = color;
		if (endStyle === "flat") endStyle = "butt";
		if (color instanceof Color) c = color.get_RGBA();
		if (color instanceof Fade) c = color.getColor();
		this.c.strokeStyle = c;
		this.c.lineCap = endStyle;
		this.c.lineWidth = lineWidth;
		this.c.beginPath();
		this.c.fillStyle = "transparent";
		return this.strokeObj;
	}
	save() {
		this.c.save();
	}
	restore() {
		this.c.restore();
	}
	clip() {
		if (!this.currentlyClipped) {
			this.currentlyClipped = true;
			this.c.save();
		}
		return this.clipObj;
	}
	unclip() {
		this.c.restore();
		this.currentlyClipped = false;
	}
	clear() {
		this.c.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}
	color(color) {
		this.c.fillStyle = (this.c.strokeStyle = color);
	}
	noise(x, f = 1, seed = 0) {
		x *= f;
		const s_0 = n => rand(seed + Math.floor(n));
		const n = x => lerp(s_0(x), s_0(x + 1), x % 1);
		return n(x);
	}
	noise2D(x, y, f = 1, seed = 0) {
		x *= f;
		y *= f;
		const s_p = (x, y) => rand(rand(Math.floor(x)) + rand(Math.floor(y) * 2000));
		const n = (x, y) => quadLerp(s_p(x, y), s_p(x + 1, y), s_p(x, y + 1), s_p(x + 1, y + 1), x % 1, y % 1);
		return n(x, y);
	}
	rotateAround(x, y, r) {
		this.translate(x, y)
		this.rotate(r);
		this.translate(-x, -y);
	}
	drawTexture(txr = new Texture(0, 0), x = 0, y = 0, width = txr.width, height = txr.height) {
		if (typeof x === "object") {
			width = x.width;
			height = x.height;
			y = x.y;
			x = x.x;
		}
		let f = txr.requestImage(width, height);
		this.c.drawImage(f, x, y, width, height);
	}
	drawImage(img, x, y, width, height) {
		if (typeof x === "object") {
			width = x.width;
			height = x.height;
			y = x.y;
			x = x.x;
		}
		if (img instanceof Frame) img = img.img;
		if (width === undefined) width = img.width;
		if (height === undefined) height = img.height;
		// console.log(img);
		this.c.drawImage(img, x, y, width, height);
	}
	drawAnimation(animation, x, y, width, height, advance = true) {
		if (typeof x === "object") {
			width = x.width;
			height = x.height;
			y = x.y;
			x = x.x;
			if (y !== undefined && y) animation.advance();
		} else if (advance) animation.advance();
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
		if (color instanceof Color) c = color.get_RGBA();
		if (color instanceof Image) c = "url(" + color.src + ")";
		this.canvas.style.background = c;
	}
}