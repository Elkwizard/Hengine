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