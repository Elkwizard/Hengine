function clamp(n, a, b) {
	return Math.max(a, Math.min(b, n));
}
function remap(n, a, b, a2, b2) {
	let t = (n - a) / (b - a);
	return a2 * (1 - t) + b2 * t;
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
		this.__c = this.c;
		this._background = new Color(0, 0, 0, 0);
		this.textMode = "left";
		this.currentlyClipped = false;
		let pathObj = {
			circle(x, y, radius) {
				radius = Math.abs(radius);
				if (typeof x === "object") {
					radius = x.radius;
					y = x.y;
					x = x.x;
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
				if (v1 instanceof Triangle) {
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
				text = text + "";
				this.c.font = font;
				if (pack) {
					let words = text.split(" ");
					let lines = [""];
					for (let word of words) {
						let prevLen = lines[lines.length - 1].length;
						lines[lines.length - 1] += " " + word;
						if (this.c.measureText(lines[lines.length - 1]).width > pack) {
							lines[lines.length - 1] = lines[lines.length - 1].substr(0, prevLen);
							lines.push(word);
						}
						if (word === "\n") lines.push("");
					}
					text = lines.join("\n").slice(1);
				}
				let fs = parseInt(font);
				let blocks = text.split("\n");
				let textRequests = [];
				for (let i = 0; i < blocks.length; i++) {
					let ax = x;
					let tmb = this.c.measureText(blocks[i]);
					if (this.textMode == "left");
					else if (this.textMode == "center") {
						ax -= tmb.width / 2;
					} else if (this.textMode == "right") {
						ax -= tmb.width;
					}
					textRequests.push({ text: blocks[i], x: ax, y: y + ((i + 1) * fs) });
				}
				return textRequests
			},
			shape(...v) {
				this.c.beginPath();
				if (v.length) {
					this.c.moveTo(v[0].x, v[0].y);
					for (let i = 0; i <= v.length; i++) {
						let index = i % v.length;
						this.c.lineTo(v[index].x, v[index].y);
					}
				}
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
			shape(...v) {
				pathObj.shape(...v);
				this.c.fill();
			},
			infer(obj) {
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
				this.save();
				this.translate(x, y);
				this.rotate(angle);
				this.c.beginPath();
				this.c.moveTo(0, 0);
				this.c.lineTo(mag - this.c.lineWidth * 4 + 0.5, 0);
				this.c.stroke();
				this.draw(this.c.strokeStyle).triangle(
					P(mag - this.c.lineWidth * 4, -this.c.lineWidth * 2),
					P(mag - this.c.lineWidth * 4, this.c.lineWidth * 2),
					P(mag, 0)
				);
				this.restore();
			},
			shape(...v) {
				pathObj.shape(...v);
				this.c.stroke();
			},
			infer(obj) {
				if (obj.radius !== undefined) {
					this.stroke(this.c.strokeStyle, this.c.lineWidth, this.c.lineCap).circle(obj);
				} else {
					this.stroke(this.c.strokeStyle, this.c.lineWidth, this.c.lineCap).shape(...obj.getCorners());
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
				pathObj.arc(x, y, radius, startAngle, endAngle);
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
			shape(...v) {
				pathObj.shape(...v);
				this.c.clip();
			},
			infer(obj) {
				if (obj.radius !== undefined) {
					this.clip().circle(obj);
				} else {
					this.clip().shape(...obj.getCorners());
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
				this.drawImage(this.imageStyle, x - radius, y - radius, radius * 2, radius * 2);
				this.unclip();
			},
			arc(x, y, radius, startAngle, endAngle, counterClockwise) {
				this.clip().arc(x, y, radius, startAngle, endAngle, counterClockwise);
				this.drawImage(this.imageStyle, x - radius, y - radius, radius * 2, radius * 2);
				this.unclip();
			},
			sector(x, y, radius, startAngle, endAngle) {
				this.clip().sector(x, y, radius, startAngle, endAngle);
				this.drawImage(this.imageStyle, x - radius, y - radius, radius * 2, radius * 2);
				this.unclip();
			},
			ellipse(x, y, rx, ry) {
				this.clip().ellipse(x, y, rx, ry);
				this.drawImage(this.imageStyle, x - rx, y - ry, rx * 2, ry * 2);
				this.unclip();
			},
			rect(x, y, width, height) {
				this.clip().rect(x, y, width, height);
				this.drawImage(this.imageStyle, x, y, width, height);
				this.unclip();
			},
			triangle(v1, v2, v3) {
				this.clip().triangle(v1, v2, v3);
				let v = [v1, v2, v3];
				let minX = Math.min(...v.map(e => e.x));
				let maxX = Math.max(...v.map(e => e.x));
				let minY = Math.min(...v.map(e => e.y));
				let maxY = Math.max(...v.map(e => e.y));
				this.drawImage(this.imageStyle, minX, minY, maxX - minX, maxY - minY);
				this.unclip();
			},
			shape(...v) {
				this.clip().shape(...v);
				let minX = Math.min(...v.map(e => e.x));
				let maxX = Math.max(...v.map(e => e.x));
				let minY = Math.min(...v.map(e => e.y));
				let maxY = Math.max(...v.map(e => e.y));
				this.drawImage(this.imageStyle, minX, minY, maxX - minX, maxY - minY);
				this.unclip();
			},
			infer(obj) {
				if (obj.radius !== undefined) {
					this.image(this.imageStyle).circle(obj);
				} else {
					this.image(this.imageStyle).shape(...obj.getCorners());
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
	draw(color) {
		let c = color;
		if (color instanceof Color) c = color.getRGBA();
		this.c.fillStyle = c;
		return this.drawObj;
	}
	stroke(color, lineWidth = 1, endStyle = "flat") {
		let c = color;
		if (endStyle === "flat") endStyle = "butt";
		if (color instanceof Color) c = color.getRGBA();
		this.c.strokeStyle = c;
		this.c.lineCap = endStyle;
		this.c.lineWidth = lineWidth;
		this.c.beginPath();
		this.c.fillStyle = "transparent";
		return this.strokeObj;
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
	getTextWidth(font, str) {
		this.c.font = font;
		return this.c.measureText(str).width;
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
	cubeLerp(a, b, c, d, a2, b2, c2, d2, tx, ty, tz) {
		let top = this.quadLerp(a, b, c, d, tx, ty);
		let bottom = this.quadLerp(a2, b2, c2, d2, tx, ty);
		return this.lerp(top, bottom, tz);
	}
	noiseTCorrect(t) {
		const f = (x) => (x - 2) * (x + 2) * x;
		return f(-2.31 * t + 1.155) / 6.158 + 0.5;
	}
	noise(x, f = 1, seed = 0) {
		x *= f;
		const s_0 = n => rand(seed + Math.floor(n));
		const n = x => this.lerp(s_0(x), s_0(x + 1), x % 1);
		return n(x);
	}
	noise2D(x, y, f = 1, seed = 0) {
		x *= f;
		y *= f;
		const s_p = (x, y) => rand(rand(Math.floor(x)) + rand(Math.floor(y) * 2000) + seed * 100000);
		const n = (x, y) => this.quadLerp(s_p(x, y), s_p(x + 1, y), s_p(x, y + 1), s_p(x + 1, y + 1), this.noiseTCorrect(x % 1), this.noiseTCorrect(y % 1));
		return n(x, y);
	}
	noise3D(x, y, z, f = 1, seed = 0) {
		x *= f;
		y *= f;
		z *= f;
		const s_p = (x, y, z) => rand(rand(Math.floor(x)) + rand(Math.floor(y) * 2000) + rand(Math.floor(z) * 2000000) + seed * 100000);
		const n = (x, y, z) => this.cubeLerp(
			s_p(x, y, z), s_p(x + 1, y, z), s_p(x, y + 1, z), s_p(x + 1, y + 1, z),
			s_p(x, y, z + 1), s_p(x + 1, y, z + 1), s_p(x, y + 1, z + 1), s_p(x + 1, y + 1, z + 1),
			x % 1, y % 1, z % 1);
		return n(x, y, z);
	}
	rotateAround(x, y, r) {
		this.translate(x, y)
		this.rotate(r);
		this.translate(-x, -y);
	}
	drawImage(img, x, y, width, height) {
		if (typeof x === "object") {
			this.drawImage(img, x.x, x.y, x.width, x.height);
		}
		if (width === undefined) width = img.width;
		if (height === undefined) height = img.height;
		if (img instanceof Frame) img = img.img;
		if (img instanceof Texture) img = img.requestImage(width, height);
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
}