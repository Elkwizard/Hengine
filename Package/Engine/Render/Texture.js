class Texture {
	constructor(width, height) {
		width = Math.floor(width);
		height = Math.floor(height);
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
		this.__image = null;
		this.loops = false;
		this.updateImageData();
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
	setPixel(x, y, clr) {
		if (this.pixels[x] && this.pixels[x][y]) this.pixels[x][y] = clr;
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
		let x = new Frame(this.width, this.height);
		x.c.c.putImageData(this.imageData, 0, 0);
		this.__image = x;
	}
	requestImage(width, height) {
		if (!this.loops) return this.__image.img;
		else {
			let frame = new OffscreenCanvas(width, height);
			let c = frame.getContext("2d");
			let img = this.__image.img;
			for (let i = 0; i < frame.width / this.width; i++) for (let j = 0; j < frame.height / this.height; j++) {
				c.drawImage(img, i * this.width, j * this.height, this.width, this.height);
			}
			return frame;
		}
	}
}