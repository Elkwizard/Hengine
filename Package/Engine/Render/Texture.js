class Texture extends ImageType {
	constructor(width, height) {
		super(width, height, false);
		let self = this;
		this.c = new Artist({ getContext() { return new TextureDrawingContext(self); } }, this.width, this.height);
		this.pixels = [];
		for (let i = 0; i < this.width; i++) {
			this.pixels.push([]);
			for (let j = 0; j < this.height; j++) {
				this.pixels[i].push(new Color(0, 0, 0, 0));
			}
		}
		this[Symbol.iterator] = function* () {
			for (let i = 0; i < this.width; i++) for (let j = 0; j < this.height; j++) {
				yield [i, j];
			}
		}
		this.__image = null;

		//init image data
		let array = new Uint8ClampedArray(4 * this.width * this.height);
		for (let i = 0; i < array.length; i++) array[i] = 0;
		this.imageData = new ImageData(array, this.width, this.height);
		let array2 = new Uint8ClampedArray(4 * this.width * this.height);
		for (let i = 0; i < array.length; i++) array2[i] = 0;
		this.imageData2 = new ImageData(array2, this.width, this.height);
		this.blankImageData = this.imageData2;
		this.blank = this.pixels.map(e => e.map(e => new Color(0, 0, 0, 0)));

		this.updateImageData();

		this.changed = false;
	}
	toString() {
		function channelPair(a, b) {
			let aStr = Math.floor(a).toString(2);
			let bStr = Math.floor(b).toString(2);
			let difA = 8 - aStr.length;
			let difB = 8 - bStr.length;
			return String.fromCharCode(parseInt("0".repeat(difA) + aStr + "0".repeat(difB) + bStr, 2));
		}
		function color(col) {
			return channelPair(col.red, col.green) + channelPair(col.blue, col.alpha * 255);
		}
		function column(col) {
			return col.map(e => color(e)).join("");
		}
		function toString(tex) {
			let result = tex.width + "," + tex.height + ":";
			for (let col of tex.pixels) result += column(col);
			return result;
		}
		return toString(this);
	}
	clear() {
		let height = this.pixels[0].length;
		let width = this.pixels.length;
		for (let i = 0; i < width; i++) for (let j = 0; j < height; j++) this.act_set(i, j, cl.BLANK);
	}
	getPixel(x, y) {
		if (this.pixels[x] && this.pixels[x][y]) return this.pixels[x][y];
		else if (!this.loops) return new Color(0, 0, 0, 0);
		else {
			x = (x % this.pixels.length + this.pixels.length) % this.pixels.length;
			y = (y % this.pixels[0].length + this.pixels[0].length) % this.pixels[0].length;
			return this.pixels[x][y];
		}
	}
	shader(fn, ...args) {
		for (let i = 0; i < this.width; i++) for (let j = 0; j < this.height; j++) this.shader_set(i, j, fn(i, j, ...args));
		this.changed = true;
	}
	act_get(x, y) {
		return this.pixels[x][y];
	}
	act_add(x, y, clr) {
		let t = clr.alpha;
		if (clr.alpha !== 1) {
			let c1 = this.act_get(x, y);
			if (c1.alpha) {
				let col = new Color(clr.red * t + c1.red * (1 - t), clr.green * t + c1.green * (1 - t), clr.blue * t + c1.blue * (1 - t));
				this.act_set(x, y, col);
			} else this.act_set(x, y, clr);
		} else this.act_set(x, y, clr);
	}
	shader_set(x, y, clr) {
		this.pixels[x][y] = clr;
		let inx = (y * this.width + x) * 4;
		let data = this.imageData.data;
		data[inx] = clr.red;
		data[inx + 1] = clr.green;
		data[inx + 2] = clr.blue;
		data[inx + 3] = clr.alpha * 255;
	}
	act_set(x, y, clr) {
		this.changed = true;
		this.shader_set(x, y, clr);
	}
	setPixel(x, y, clr) {
		if (this.pixels[x] && this.pixels[x][y]) this.act_set(x, y, clr);
		return;
	}
	blur(amount = 1) {
		for (let n = 0; n < amount; n++) for (let [x, y] of this) {
			let colors = [];
			for (let i = -1; i < 2; i++) for (let j = -1; j < 2; j++) {
				colors.push(this.getPixel(x + i, y + j));
			}
			let col = new Color(0, 0, 0, 1);
			col.limited = false;
			for (let color of colors) col.add(color);
			col.div(colors.length);
			this.setPixel(x, y, col);
		}
	}
	updateImageData() {
		let x = new Frame(this.width, this.height);
		x.c.c.putImageData(this.imageData, 0, 0);
		this.__image = x;
	}
	makeImage() {
		if (this.changed) {
			this.changed = false;
			this.updateImageData();
		}
		return this.__image.img;
	}
	static async fromDataURI(uri, w_o, h_o) {
		let img = new Image();
		img.src = uri;
		let tex;
		return await new Promise(function (resolve, reject) {
			img.onload = function () {
				let canvas = document.createElement("canvas");
				document.body.appendChild(img);
				let style = getComputedStyle(img);
				let w = w_o ? w_o : parseInt(style.width);
				let h = h_o ? h_o : parseInt(style.height);
				tex = new Texture(w, h);
				canvas.width = w;
				canvas.height = h;
				let ctx = canvas.getContext("2d");
				ctx.imageSmoothingEnabled = false;
				ctx.drawImage(img, 0, 0, w, h);
				let data = ctx.getImageData(0, 0, w, h).data;
				for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) {
					let inx = (j * w + i) * 4;
					let red = data[inx];
					let green = data[inx + 1];
					let blue = data[inx + 2];
					let alpha = data[inx + 3] / 255;
					let col = new Color(red, green, blue, alpha);
					tex.setPixel(i, j, col);
				}
				tex.updateImageData();
				img.outerHTML = "";
				resolve(tex);
			}
		});
	}
	static fromString(str) {
		function inv_channelPair(str) {
			let bin = str.charCodeAt(0).toString(2);
			bin = "0".repeat(16 - bin.length) + bin;
			let a = parseInt(bin.slice(0, 8), 2);
			let b = parseInt(bin.slice(8), 2);
			return [a, b]
		}
		function inv_color(str) {
			let tok = str.split("");
			let rg = inv_channelPair(tok[0]);
			let ba = inv_channelPair(tok[1]);
			return new Color(rg[0], rg[1], ba[0], ba[1] / 255);
		}
		const col_size = 2;
		function inv_column(str) {
			let result = [];
			let acc = "";
			for (let i = 0; i < str.length; i++) {
				acc += str[i];
				if ((i + 1) % col_size === 0) {
					result.push(inv_color(acc));
					acc = "";
				}
			}
			return result;
		}
		function inv_toString(str) {
			let inx = str.indexOf(":");
			let data = str.slice(inx + 1);
			let header = str.slice(0, inx);
			let sp = header.split(",");
			let w = parseFloat(sp[0]);
			let h = parseFloat(sp[1]);
			let tex = new Texture(w, h);
			let acc = "";
			let result = [];
			for (let i = 0; i < data.length; i++) {
				acc += data[i];
				if ((i + 1) % (h * col_size) === 0) {
					result.push(inv_column(acc));
					acc = "";
				}
			}
			for (let [x, y] of tex) tex.setPixel(x, y, result[x][y]);
			tex.updateImageData();
			return tex;
		}
		return inv_toString(str);
	}
}
class TextureDrawingContextPath {
	constructor(ctx, type, ...args) {
		this.ctx = ctx;
		this.type = type;
		this.args = args;
	}
	static fillScanline(ctx, xmin, xmax, y, col) {
		let tex = ctx.tex;
		y = Math.round(y);
		if (y < 0) return;
		if (y > tex.height - 1) return;
		xmin = Math.round(clamp(xmin, 0, tex.width - 1));
		xmax = Math.round(clamp(xmax, 0, tex.width - 1));
		let range = xmax - xmin;
		for (let i = 0; i < range; i++) {
			TextureDrawingContextPath.noCullFillPixel(ctx, xmin + i, y, col);
		}
	}
	static noCullFillPixel(ctx, x, y, col) {
		if (ctx.underly) col = ctx.underly(x, y);
		let tex = ctx.tex;
		tex.act_add(x, y, col);
	}
	static fillPixel(ctx, x, y, col) {
		x = Math.round(x);
		y = Math.round(y);
		if (x >= 0 && x <= ctx.tex.pixels.length - 1)
			if (y >= 0 && y <= ctx.tex.pixels[0].length - 1) {
				TextureDrawingContextPath.noCullFillPixel(ctx, x, y, col);
			}
	}
	static strokePixel(ctx, x, y, col) {
		if (ctx.underly) col = ctx.underly(x, y);
		let w = ctx.lineWidth * ctx.lineWidthFactor;
		let hw = w / 2;
		let tex = ctx.tex;
		for (let i = 0; i < w; i++) {
			let ax = Math.round(x - hw + i);
			if (ax >= 0 && ax <= tex.pixels.length - 1) for (let j = 0; j < w; j++) {
				let ay = Math.round(y - hw + j);
				if (ay >= 0 && ay <= tex.pixels[0].length - 1) {
					tex.act_add(ax, ay, col);
				}
			}
		}
	}
	static stroke_arc(ctx, x, y, radius, startAngle, endAngle) {
		let col = new Color(ctx.strokeStyle);
		for (let i = 0; i < radius * 2; i++) for (let j = 0; j < radius * 2; j++) {
			let ox = i - radius;
			let oy = j - radius;
			if (ox ** 2 + oy ** 2 < radius ** 2 && ox ** 2 + oy ** 2 > (radius - 1) ** 2) {
				TextureDrawingContextPath.strokePixel(ctx, ox + x, oy + y, col);
			}
		}
	}
	static fill_arc(ctx, x, y, radius, startAngle, endAngle) {
		let col = new Color(ctx.fillStyle);
		const form = x => 2 * Math.sqrt(-x * x + 2 * x);
		for (let i = 0; i < radius * 2; i++) {
			let w = form(i / radius) * radius;
			TextureDrawingContextPath.fillScanline(ctx, x - w / 2, x + w / 2, y + i - radius, col);
		}
	}
	static fill_polygon(ctx, lines) {
		let col = new Color(ctx.fillStyle);
		let minY = Infinity;
		let maxY = -Infinity;
		for (let line of lines) {
			if (line[3] < minY) minY = line[3];
			if (line[3] > maxY) maxY = line[3];
		}
		let dif = Math.floor(maxY - minY);
		for (let i = 0; i < dif; i++) {
			let valid = [];
			let y = minY + i;
			for (let line of lines) {
				let min = Math.min(line[1], line[3]);
				let max = Math.max(line[1], line[3]);
				if (min <= y && max >= y && max - min) valid.push(line);
			}
			let intersections = [];
			for (let line of valid) {
				let dx = line[2] - line[0];
				let dy = line[3] - line[1];
				let m = dy / dx;
				let b = line[1] - m * line[0];
				let p = Math.floor((y - b) / m);
				if (!dx) p = line[0];
				if (intersections[intersections.length - 1] !== p) intersections.push(p);
			}
			intersections.sort((a, b) => a - b);
			for (let i = 0; i < intersections.length - 1; i += 3) {
				let min = intersections[i];
				let max = intersections[i + 1];
				TextureDrawingContextPath.fillScanline(ctx, min, max, y, col);
			}
		}
	}
	static stroke_line(ctx, x0, y0, x1, y1) {
		let col = new Color(ctx.strokeStyle);
		let dx = x1 - x0, dy = y1 - y0;
		let mag = Math.sqrt(dx ** 2 + dy ** 2);
		dx /= mag;
		dy /= mag;
		for (let i = 0; i < mag; i++) {
			let x = Math.floor(x0 + dx * i);
			let y = Math.floor(y0 + dy * i);
			TextureDrawingContextPath.strokePixel(ctx, x, y, col);
		}
	}
	fill() {
		TextureDrawingContextPath["fill_" + this.type](this.ctx, ...this.args);
	}
	stroke() {
		TextureDrawingContextPath["stroke_" + this.type](this.ctx, ...this.args);
	}
}
class TextureDrawingContextVertex {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
	get() {
		return new TextureDrawingContextVertex(x, y);
	}
}
class TextureDrawingContextTransform {
	constructor(type, v1, v2) {
		this.x = v1;
		this.y = v2;
		this.type = type;
	}
}
class TextureDrawingContext {
	constructor(home) {
		this.tex = home;
		this.strokeStyle = "rgba(0, 0, 0, 1)";
		this.fillStyle = "rgba(0, 0, 0, 1)";
		this.lineWidth = 1;
		this.path = [];
		this.saveStack = [];
		this.transform = [];
		this.lineStart = null;
		this.cos_sin = [];
		this.lineWidthFactor = 1;
		for (let i = 0; i < 360; i++) {
			this.cos_sin.push(new TextureDrawingContextVertex(Math.cos(i.toRadians()), Math.sin(i.toRadians())));
		}
	}
	getTransformedPoint(x, y) {
		let ax = x;
		let ay = y;
		let others = this.transform.map(e => e).reverse();
		for (let trans of others) {
			if (trans.type === "rotation") {
				let n_x = ax * trans.x - ay * trans.y;
				let n_y = ax * trans.y + ay * trans.x;
				ax = n_x;
				ay = n_y;
			} else if (trans.type === "scale") {
				let n_x = ax * trans.x;
				let n_y = ay * trans.y;
				ax = n_x;
				ay = n_y;
			} else if (trans.type === "translation") {
				ax += trans.x;
				ay += trans.y;
			}
		}
		return new TextureDrawingContextVertex(ax, ay);
	}
	save() {
		this.saveStack.push(this.transform.map(e => new TextureDrawingContextTransform(e.type, e.x, e.y)));
	}
	restore() {
		if (!this.saveStack.length) this.saveStack.push([]);
		this.transform = this.saveStack[this.saveStack.length - 1];
		this.lineWidthFactor = 1;
		for (let t of this.transform) if (t.type === "scale") this.lineWidthFactor *= t.x;
		this.saveStack.pop();
	}
	translate(x, y) {
		if (x || y) {
			this.transform.push(new TextureDrawingContextTransform("translation", x, y));
		}
	}
	rotate(angle) {
		if (Math.abs(angle) > 0.0001) {
			this.transform.push(new TextureDrawingContextTransform("rotation", Math.cos(angle), Math.sin(angle)));
		}
	}
	scale(x, y) {
		if (x !== 1 || y !== 1) {
			this.lineWidthFactor *= x;
			this.transform.push(new TextureDrawingContextTransform("scale", x, y));
		}
	}
	clearRect(x, y, w, h) {
		this.tex.pixels = this.tex.blank.map(e => e.map(e => e));
		for (let i = 0; i < this.tex.imageData.data.length; i++) this.tex.imageData.data[i] = 0;
	}
	rect(x, y, w, h) {
		let corners = [
			new TextureDrawingContextVertex(x, y),
			new TextureDrawingContextVertex(x + w, y),
			new TextureDrawingContextVertex(x + w, y + h),
			new TextureDrawingContextVertex(x, y + h)
		];
		this.moveTo(corners[0].x, corners[0].y);
		this.lineTo(corners[1].x, corners[1].y);
		this.lineTo(corners[2].x, corners[2].y);
		this.lineTo(corners[3].x, corners[3].y);
		this.lineTo(corners[0].x, corners[0].y);
	}
	arc(x, y, r, st, et) {
		let min = this.getTransformedPoint(x, y);
		let max = this.getTransformedPoint(x + r, y);
		this.path.push(new TextureDrawingContextPath(this, "arc", min.x, min.y, Math.sqrt((max.x - min.x) ** 2 + (max.y - min.y) ** 2), st, et));
	}
	beginPath() {
		this.path = [];
	}
	moveTo(x, y) {
		let min = this.getTransformedPoint(x, y);
		this.lineStart = min;
	}
	lineTo(x, y) {
		let min = this.getTransformedPoint(x, y);
		this.path.push(new TextureDrawingContextPath(this, "line", this.lineStart.x, this.lineStart.y, min.x, min.y));
		this.lineStart = min;
	}
	stroke() {
		if (this.path.length) {
			for (let p of this.path) {
				p.stroke();
			}
		}
	}
	fill() {
		if (this.path.length) {
			let polygon = [];
			for (let p of this.path) {
				if (p.type === "arc") {
					if (polygon.length > 2) (new TextureDrawingContextPath(this, "polygon", polygon)).fill();
					polygon = [];
					p.fill();
				} else {
					polygon.push(p.args);
				}
			}
			if (polygon.length > 2) (new TextureDrawingContextPath(this, "polygon", polygon)).fill();
		}
	}
}