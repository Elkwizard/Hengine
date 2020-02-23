class Vertex {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
	toString() {
		return "(" + this.x + ", " + this.y + ")";
	}
}
class Frame {
	constructor(width, height) {
		this.width = width;
		this.height = height;
		this.img = new OffscreenCanvas(width, height);
		this.c = new Artist(this.img);
	}
}
class Fade {
	constructor(color, length, fadeLengthStart, fadeLengthEnd = null) {
		this.color = color;
		this.startTime = performance.now();
		this.length = length;
		this.fadeLengthStart = fadeLengthStart;
		if (fadeLengthEnd == null) fadeLengthEnd = fadeLengthStart;
		this.fadeLengthEnd = fadeLengthEnd;
	}
	get endTime() {
		return this.startTime + this.length;
	}
	set endTime(a) {
		this.length = a - this.startTime;
	}
	stopIn(ms) {
		if (performance.now() <= this.endTime) this.length = performance.now() + ms - this.startTime;
	}
	getColor() {
		let relStart = 0;
		let relEnd = 1;
		let relTime = (performance.now() - this.startTime) / this.length;
		let relOffsetS = this.fadeLengthStart / this.length;
		let relOffsetE = this.fadeLengthEnd / this.length;
		let op;
		if (relTime < 0 || relTime > 1) op = 0;
		else if (relTime < relOffsetS + relStart) {
			op = relTime / relOffsetS;
		} else if (relTime > relEnd - relOffsetE) {
			op = 1 - (relTime - (relEnd - relOffsetE)) / relOffsetE;
		} else op = 1;
		return new Color(this.color.red, this.color.green, this.color.blue, this.color.alpha * op);
	}
}
class Texture {
	constructor(width, height) {
		this.width = width;
		this.height = height;
		this.pixels = [];
		for (let i = 0; i < width; i++) {
			this.pixels.push([]);
			for (let j = 0; j < height; j++) {
				this.pixels[i].push(new Color(0, 0, 0, 0));
			}
		}
		this[Symbol.iterator] = function* () {
			for (let i = 0; i < this.width; i++) for (let j = 0; j < this.height; j++) {
				yield [i, j];
			}
		}
		this.updateImageData();
	}
	setPixel(x, y, clr) {
		this.pixels[x][y] = clr;
	}
	updateImageData() {
		let array = new Uint8ClampedArray(4 * this.width * this.height);
		let cntr = 0;
		for (let i = 0; i < this.height; i++) {
			for (let j = 0; j < this.width; j++) {
				let color = this.pixels[j][i];
				array[cntr] = Math.floor(color.red);
				array[cntr + 1] = Math.floor(color.green);
				array[cntr + 2] = Math.floor(color.blue);
				array[cntr + 3] = Math.floor(color.alpha * 255);
				cntr += 4;
			}
		}
		let img = new ImageData(array, this.width, this.height);
		this.imageData = img;
	}
	toImage() {
		let x = new Frame(this.width, this.height);
		this.updateImageData();
		x.c.c.putImageData(this.imageData, 0, 0);
		return x;
	}
}
class Triangle {
	constructor(p1, p2, p3) {
		this.vertices = [p1, p2, p3];
	}
	middle() {
		function average(ary) {
			let sum = 0;
			for (let num of ary) {
				sum += num;
			}
			sum /= ary.length;
			return sum;
		}
		let res = new Vertex();
		let xs = [];
		let ys = [];
		for (let x of this.vertices) {
			xs.push(x.x);
			ys.push(x.y);
		}
		res.x = average(xs);
		res.y = average(ys);
		return res;
	}
}
class Circle {
	constructor(x, y, radius) {
		this.collider = new CircleCollider(x, y, radius);
		this.x = x;
		this.y = y;
		this.radius = radius;
	}
	get x() {
		return this.collider.x;
	}
	get y() {
		return this.collider.y;
	}
	get radius() {
		return this.collider.radius
	}
	set x(a) {
		this.collider.x = a;
	}
	set y(a) {
		this.collider.y = a;
	}
	set radius(a) {
		this.collider.radius = a;
	}
}
class Line {
	constructor(x, y, x2, y2) {
		this.collider = new LineCollider(x, y, x2, y2);
	}
	get a() {
		return this.collider.a;
	}
	get b() {
		return this.collider.b;
	}
	set a(a) {
		this.collider.a = new Vector2(a.x, a.y);
	}
	set b(a) {
		this.collider.b = new Vector2(a.x, a.y);
	}
	get midPoint() {
		let ax = (this.a.x + this.b.x) / 2;
		let ay = (this.a.y + this.b.y) / 2;
		return new Vector2(ax, ay);
	}
}
class Rect {
	constructor(x, y, width, height) {
		this.collider = new RectCollider(x, y, width, height);
		if (typeof x == "object") {
			this.x = x.x;
			this.y = x.y;
			this.width = y.x - x.x;
			this.height = y.y - x.y;
		}
		if (this.width < 0) {
			this.width = -this.width;
			this.x -= this.width;
		}
		if (this.height < 0) {
			this.height = -this.height;
			this.y -= this.height;
		}
	}
	get x() {
		return this.collider.x;
	}
	get y() {
		return this.collider.y;
	}
	get width() {
		return this.collider.width;
	}
	get height() {
		return this.collider.height;
	}
	set x(e) {
		this.collider.x = e;
	}
	set y(e) {
		this.collider.y = e;
	}
	set width(e) {
		this.collider.width = e;
	}
	set height(e) {
		this.collider.height = e;
	}
	set middle(a) {
		this.x = a.x - this.width / 2;
		this.y = a.y - this.height / 2;
	}
	get middle() {
		return { x: this.x + (this.width / 2), y: this.y + (this.height / 2) }
	}
	corners() {
		return [
			new Vertex(this.x, this.y),
			new Vertex(this.x + this.width, this.y),
			new Vertex(this.x + this.width, this.y + this.height),
			new Vertex(this.x, this.y + this.height)
		];
	}
}
class Animation {
	constructor(src = "", frames = 1, delay = 0, loop = false, finResponse = e => e) {
		this.stopped = false;
		if (!Array.isArray(src)) {
			this.frameCount = frames;
			this.frames = [];
			this.img = new Image
			for (let i = 0; i < frames; i++) {
				this.frames.push(new Image);
				this.frames[i].src = ("../Art/Animations/" + src + "/" + (i + 1) + ".png");
			}
			this.loop = loop;
			this.finResponse = finResponse;
			this.delay = delay;
		} else {
			this.frames = src;
			this.frameCount = this.frames.length;
			this.delay = frames;
			this.loop = delay;
			this.finResponse = loop || function () { }
		}
		this.timer = 0;
		this.maxTime = this.frames.length * this.delay
	}
	advance() {
		if (!this.stopped) {
			this.timer++
			if (this.timer >= this.maxTime - 1) {
				this.timer = this.loop ? 0 : this.maxTime;
				this.finResponse();
			}
			this.img = this.frames[Math.floor(this.timer / this.delay)];
		}
	}
	stop() {
		this.stoppped = true;
	}
	start() {
		this.stopped = false;
	}
	reset() {
		this.timer = -1;
		this.advance();
	}
}
class Artist {
	constructor(canvasID, width, height) {
		this.canvas = document.getElementById(canvasID);
		if (typeof canvasID === "object") this.canvas = canvasID;
		if (width) {
			this.canvas.width = width;
		}
		if (height) {
			this.canvas.height = height;
		}
		this.noiseAry = [];
		this.custom = {};
		this.c = this.canvas.getContext('2d');
		this.animations = [];
		this._background = new Color(0, 0, 0, 0);
		this.textMode = "left";
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
				if (!v.length) return;
				this.c.beginPath();
				this.c.moveTo(v[0].x, v[0].y);
				for (let i = 0; i <= v.length; i++) {
					let index = i % v.length;
					this.c.lineTo(v[index].x, v[index].y);
				}
				this.c.fill();
				this.c.closePath();
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
				if (x instanceof Rect) {
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
			connector(...points) {
				for (let i = 0; i < points.length; i++) {
					let p1 = points[i];
					let p2 = points[i + 1];
					if (p2) this.stroke(this.c.strokeStyle, this.c.lineWidth, this.c.lineCap).line(p1, p2);
				}
			},
			arrowConnector(...points) {
				for (let i = 0; i < points.length; i++) {
					let p1 = points[i];
					let p2 = points[i + 1];
					if (p2 && i < points.length - 2) this.stroke(this.c.strokeStyle, this.c.lineWidth, this.c.lineCap).line(p1, p2);
					else if (i == points.length - 2) this.stroke(this.c.strokeStyle, this.c.lineWidth, this.c.lineCap).arrow(p1, p2);
				}
			},
			shape: function (...v) {
				this.c.beginPath();
				this.c.moveTo(v[0].x, v[0].y);
				for (let i = 0; i <= v.length; i++) {
					let index = i % v.length;
					this.c.lineTo(v[index].x, v[index].y);
				}
				this.c.stroke();
				this.c.closePath();
			}
		}
		for (let func in this.strokeObj) {
			this.strokeObj[func] = this.strokeObj[func].bind(this);
		}
		this.clipObj = {
			rect(x, y, width, height) {
				this.c.beginPath();
				this.c.rect(x, y, width, height);
				this.c.closePath();
				this.c.clip();
			},
			circle(x, y, radius) {
				this.c.beginPath();
				this.c.arc(x, y, radius, 0, 2 * Math.PI);
				this.c.closePath();
				this.c.clip();
			},
			shape: function (...v) {
				this.c.beginPath();
				this.c.moveTo(v[0].x, v[0].y);
				for (let i = 0; i <= v.length; i++) {
					let index = i % v.length;
					this.c.lineTo(v[index].x, v[index].y);
				}
				this.c.closePath();
				this.c.clip();
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
				x: 0,
				y: 0
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
	createAnimation(src, frames, delay, loop, response) {
		this.animations.push(new Animation(src, frames, delay, loop, response))
		return this.animations[this.animations.length - 1]
	}
	drawAnimation(animation, x, y, width, height) {
		animation.advance();
		let img = animation.img;
		if (img instanceof Frame) img = img.img;
		if (width === undefined) width = img.width;
		if (height === undefined) height = img.height;
		this.c.drawImage(img, x, y, width, height)
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
	clip() {
		this.c.save();
		return this.clipObj; 
	}
	unclip() {
		this.c.restore();
	}
	clear() {
		this.c.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}
	color(color) {
		this.c.fillStyle = (this.c.strokeStyle = color);
	}
	noise(x, freq, min, max) {
		if (!freq) freq = 1;
		if (min === undefined) min = -1;
		if (max === undefined) max = 1;
		let last;
		while (this.noiseAry.length - 1 < x) {
			last = this.noiseAry[this.noiseAry.length - 1];
			if (last === undefined) last = 0;
			let val = last + ((Math.random() - Math.random()));
			if (val > max) val = max;
			if (val < min) val = min;
			this.noiseAry.push(val);
		}
		return this.noiseAry[Math.floor(x)] * freq;
	}
	rotateAround(x, y, r) {
		this.translate(x, y)
		this.rotate(r);
		this.translate(-x, -y);
	}
	drawTexture(txr = new Texture(0, 0), x = 0, y = 0, width = txr.width, height = txr.height) {
		let imagedata = txr.imageData;
		let f = new OffscreenCanvas(txr.width, txr.height);
		f.getContext('2d').putImageData(imagedata, 0, 0);
		this.c.drawImage(f, x, y, width, height);
	}
	drawImage(img, x, y, width, height) {
		if (img instanceof Frame) img = img.img;
		if (width === undefined) width = img.width;
		if (height === undefined) height = img.height;
		this.c.drawImage(img, x, y, width, height)
	}
	drawWithAlpha(a, shape) {
		this.c.globalAlpha = a;
		shape();
		this.c.globalAlpha = 1;
	}
	setBackground(color) {
		let c = color;
		if (color instanceof Color) c = color.get_RGBA();
		this.canvas.style.background = c;
	}
}