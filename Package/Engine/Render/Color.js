class Color {
	constructor(r, g, b, a) {
		let red = 0;
		let green = 0;
		let blue = 0;
		let alpha = 0;
		this.custom = {};
		this.limited = true;
		if (b === undefined && g === undefined && typeof r == "string") {
			if (r.indexOf("rgb") < 0 && r.indexOf("#") < 0) {
				r = Color.CSSColor(r);
			}
			function parseRGBA(str) {
				let rgba = "";
				let state = false;
				for (let char of str) {
					if (char == ")" || char == "(") {
						state = !state;
					}
					else if (state) {
						rgba += char;
					}
				}
				let rgbaList = rgba.split(",");
				red = parseFloat(rgbaList[0]);
				green = parseFloat(rgbaList[1]);
				blue = parseFloat(rgbaList[2]);
				alpha = (rgbaList.length > 3) ? parseFloat(rgbaList[3]) : 1;
			}
			if (r[0] == "r") {
				parseRGBA(r);
			} else if (r[0] == "#") {
				function hexToNum(hex) {
					if (isNaN(parseInt(hex))) {
						switch (hex) {
							case "a":
								return 10;
							case "b":
								return 11;
							case "c":
								return 12;
							case "d":
								return 13;
							case "e":
								return 14;
							case "f":
								return 15;
						}
					} else {
						return parseInt(hex);
					}
				}
				function parseHex(chars) {
					let c1 = chars[0];
					let c2 = chars[1];
					let result = 0;
					result += hexToNum(c1) * 16;
					result += hexToNum(c2);
					return result;
				}
				let rgb = "rgb(";
				let groups = ["", "", ""];
				let n = 0;
				if (r.length === 4) {
					let newR = "";
					for (let char of r) {
						if (char !== "#") {
							newR += char + char;
						}
					}
					r = "#" + newR;
				}
				for (let char of r) {
					if (char != "#") {
						n++;
						groups[Math.floor((n - 1) / 2)] += char;
					}
				}
				n = 0;
				for (let group of groups) {
					n++;
					rgb += parseHex(group) + ((n == 3) ? "" : ", ");
				}
				rgb += ")";
				parseRGBA(rgb);
			}
		} else {
			red = (r === undefined) ? 0 : r;
			green = (g === undefined) ? 0 : g;
			blue = (b === undefined) ? 0 : b;
			alpha = (a === undefined) ? 1 : a;
		}
		this.red = red;
		this.green = green;
		this.blue = blue;
		this.alpha = alpha;
		this.constrain();
	}
	static CSSColor(word) {
		//processed
		let colorMap = {
			aliceblue: "f0f8ff",
			antiquewhite: "faebd7",
			aqua: "00ffff",
			aquamarine: "7fffd4",
			azure: "f0ffff",
			beige: "f5f5dc",
			bisque: "ffe4c4",
			black: "000000",
			blanchedalmond: "ffebcd",
			blue: "0000ff",
			blueviolet: "8a2be2",
			brown: "a52a2a",
			burlywood: "deb887",
			cadetblue: "5f9ea0",
			chartreuse: "7fff00",
			chocolate: "d2691e",
			coral: "ff7f50",
			cornflowerblue: "6495ed",
			cornsilk: "fff8dc",
			crimson: "dc143c",
			cyan: "00ffff",
			darkblue: "00008b",
			darkcyan: "008b8b",
			darkgoldenrod: "b8860b",
			darkgray: "a9a9a9",
			darkgrey: "a9a9a9",
			darkgreen: "006400",
			darkkhaki: "bdb76b",
			darkmagenta: "8b008b",
			darkolivegreen: "556b2f",
			darkorange: "ff8c00",
			darkorchid: "9932cc",
			darkred: "8b0000",
			darksalmon: "e9967a",
			darkseagreen: "8fbc8f",
			darkslateblue: "483d8b",
			darkslategray: "2f4f4f",
			darkslategrey: "2f4f4f",
			darkturquoise: "00ced1",
			darkviolet: "9400d3",
			deeppink: "ff1493",
			deepskyblue: "00bfff",
			dimgray: "696969",
			dimgrey: "696969",
			dodgerblue: "1e90ff",
			firebrick: "b22222",
			floralwhite: "fffaf0",
			forestgreen: "228b22",
			fuchsia: "ff00ff",
			gainsboro: "dcdcdc",
			ghostwhite: "f8f8ff",
			gold: "ffd700",
			goldenrod: "daa520",
			gray: "808080",
			grey: "808080",
			green: "008000",
			greenyellow: "adff2f",
			honeydew: "f0fff0",
			hotpink: "ff69b4",
			indianred: "cd5c5c",
			indigo: "4b0082",
			ivory: "fffff0",
			khaki: "f0e68c",
			lavender: "e6e6fa",
			lavenderblush: "fff0f5",
			lawngreen: "7cfc00",
			lemonchiffon: "fffacd",
			lightblue: "add8e6",
			lightcoral: "f08080",
			lightcyan: "e0ffff",
			lightgoldenrodyellow: "fafad2",
			lightgray: "d3d3d3",
			lightgrey: "d3d3d3",
			lightgreen: "90ee90",
			lightpink: "ffb6c1",
			lightsalmon: "ffa07a",
			lightseagreen: "20b2aa",
			lightskyblue: "87cefa",
			lightslategray: "778899",
			lightslategrey: "778899",
			lightsteelblue: "b0c4de",
			lightyellow: "ffffe0",
			lime: "00ff00",
			limegreen: "32cd32",
			linen: "faf0e6",
			magenta: "ff00ff",
			maroon: "800000",
			mediumaquamarine: "66cdaa",
			mediumblue: "0000cd",
			mediumorchid: "ba55d3",
			mediumpurple: "9370db",
			mediumseagreen: "3cb371",
			mediumslateblue: "7b68ee",
			mediumspringgreen: "00fa9a",
			mediumturquoise: "48d1cc",
			mediumvioletred: "c71585",
			midnightblue: "191970",
			mintcream: "f5fffa",
			mistyrose: "ffe4e1",
			moccasin: "ffe4b5",
			navajowhite: "ffdead",
			navy: "000080",
			oldlace: "fdf5e6",
			olive: "808000",
			olivedrab: "6b8e23",
			orange: "ffa500",
			orangered: "ff4500",
			orchid: "da70d6",
			palegoldenrod: "eee8aa",
			palegreen: "98fb98",
			paleturquoise: "afeeee",
			palevioletred: "db7093",
			papayawhip: "ffefd5",
			peachpuff: "ffdab9",
			peru: "cd853f",
			pink: "ffc0cb",
			plum: "dda0dd",
			powderblue: "b0e0e6",
			purple: "800080",
			rebeccapurple: "663399",
			red: "ff0000",
			rosybrown: "bc8f8f",
			royalblue: "4169e1",
			saddlebrown: "8b4513",
			salmon: "fa8072",
			sandybrown: "f4a460",
			seagreen: "2e8b57",
			seashell: "fff5ee",
			sienna: "a0522d",
			silver: "c0c0c0",
			skyblue: "87ceeb",
			slateblue: "6a5acd",
			slategray: "708090",
			slategrey: "708090",
			snow: "fffafa",
			springgreen: "00ff7f",
			steelblue: "4682b4",
			tan: "d2b48c",
			teal: "008080",
			thistle: "d8bfd8",
			tomato: "ff6347",
			turquoise: "40e0d0",
			violet: "ee82ee",
			wheat: "f5deb3",
			white: "ffffff",
			whitesmoke: "f5f5f5",
			yellow: "ffff00"
		};
		return "#" + colorMap[word.toLowerCase()];
	}
	static numToHex(num) {
		let a = Math.floor(num / 16);
		let b = Math.floor(num % 16);
		let hexAry = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
		return hexAry[a] + hexAry[b];
	}
	static random() {
		return new Color(Math.random() * 255, Math.random() * 255, Math.random() * 255, Math.random());
	}

	static add(c1, c2) {
		let mixer = new Color(0, 0, 0, 0);
		mixer.add(c1);
		mixer.add(c2);
		return mixer;
	}
	static sub(c1, c2) {
		let mixer = new Color(0, 0, 0, 0);
		mixer.add(c1);
		mixer.sub(c2);
		return mixer;
	}
	static div(c1, c2) {
		let mixer = new Color(0, 0, 0, 0);
		mixer.add(c1);
		mixer.div(c2);
		return mixer;
	}
	static mul(c1, c2) {
		let mixer = new Color(0, 0, 0, 0);
		mixer.add(c1);
		mixer.mul(c2);
		return mixer;
	}
	static avg(c1, c2) {
		let mixer = new Color(0, 0, 0, 0);
		mixer.add(c1);
		mixer.add(c2);
		mixer.div(2);
		return mixer;
	}
	invert() {
		let n = (new Color(255, 255, 255, 1)).sub(this);
		n.alpha = this.alpha;
		return n;
	}
	static rangeAround(color, dist) {
		let colorAry = [];
		for (let i = -dist; i < dist + 1; i++) {
			let a = color.red + (i * 10);
			let b = color.green + (i * 10);
			let c = color.blue + (i * 10);
			let n = new Color(a, b, c, color.alpha);
			n.constrain();
			colorAry.push(n);
		}
		return colorAry;
	}
	static copy(color) {
		return new Color(color.red, color.green, color.blue, color.alpha);
	}
	static sum(...colors) {
		let result = new Color(0, 0, 0, 0);
		for (let color of colors) result.add(color);
		return result;
	}
	static lerp(color1, color2, per) {
		return color1.times(1 - per).plus(color2.times(per));
	}
	static quadLerp(a, b, c, d, tx, ty) {
		const l = a.times(1 - ty).plus(c.times(ty));
		const r = b.times(1 - ty).plus(d.times(ty));
		let per = l.times(1 - tx).plus(r.times(tx));
		return per;
	}
	getRGBA() {
		return "rgba(" + this.red + ", " + this.green + ", " + this.blue + ", " + this.alpha + ")";
	}
	getHEX() {
		return "#" + Color.numToHex(this.red) + Color.numToHex(this.green) + Color.numToHex(this.blue);
	}
	toString() {
		return this.getRGBA();
	}
	equals(color) {
		const th = 0.1;
		if (Math.abs(this.red - color.red) < th && Math.abs(this.green - color.green) < th && Math.abs(this.blue - color.blue) < th && Math.abs(this.alpha - color.alpha) < th) {
			return true;
		} else {
			return false;
		}
	}
	constrain() {
		if (this.limited) {
			function con(min, max, val) {
				if (val < min) return min;
				else if (val > max) return max;
				else return val;
			}
			this.red = con(0, 255, this.red);
			this.green = con(0, 255, this.green);
			this.blue = con(0, 255, this.blue);
			this.alpha = con(0, 1, this.alpha);
		}
	}
	static isColorOrNumber(color) {
		let col = color;
		if (color instanceof Color) {
			col = color;
		} else {
			col = new Color(color, color, color, color);
		}
		return col;
	}
	add(color) {
		let col = Color.isColorOrNumber(color);
		this.red += col.red;
		this.green += col.green;
		this.blue += col.blue;
		this.alpha += col.alpha;
		this.constrain();
		return this;
	}
	sub(color) {
		let col = Color.isColorOrNumber(color);
		this.red -= col.red;
		this.green -= col.green;
		this.blue -= col.blue;
		this.alpha -= col.alpha;
		this.constrain();
		return this;
	}
	mul(color) {
		let col = Color.isColorOrNumber(color);
		this.red *= col.red;
		this.green *= col.green;
		this.blue *= col.blue;
		this.alpha *= col.alpha;
		this.constrain();
		return this;
	}
	div(color) {
		let col = Color.isColorOrNumber(color);
		this.red /= col.red;
		this.green /= col.green;
		this.blue /= col.blue;
		this.alpha /= col.alpha;
		this.constrain();
		return this;
	}
	mod(color) {
		let col = Color.isColorOrNumber(color);
		this.red %= col.red;
		this.green %= col.green;
		this.blue %= col.blue;
		this.alpha %= col.alpha;
		this.constrain();
		return this;
	}
	get() {
		// console.log(this.red,this.green,this.blue,this.alpha);
		return new Color(this.red, this.green, this.blue, this.alpha);
	}
	plus(col) {
		let x = this.get();
		x.add(col);
		return x;
	}
	minus(col) {
		let x = this.get();
		x.sub(col);
		return x;
	}
	times(col) {
		let x = this.get();
		x.mul(col);
		return x;
	}
	over(col) {
		let x = this.get();
		x.div(col);
		return x;
	}
	dif(color) {
		let red = Math.abs(this.red - color.red) / 255;
		let green = Math.abs(this.green - color.green) / 255;
		let blue = Math.abs(this.blue - color.blue) / 255;
		let alpha = Math.abs(this.alpha - color.alpha) / 255;
		return (red + green + blue + alpha) / 4;
	}
	static grayScale(per) {
		let r = 255 * per;
		let g = 255 * per;
		let b = 255 * per;
		return new Color(r, g, b, 1);
	}
	get brightness() {
		return (this.red + this.blue + this.green) / (3 * 255);
	}
}
class ColorLibrary {
	constructor() {
		this.RED = new Color("#f00");
		this.BLUE = new Color("#00f");
		this.YELLOW = new Color("#ff0");
		this.GOLD = new Color("#d4af37");
		this.GREEN = new Color("#090");
		this.ORANGE = new Color("#f90");
		this.PURPLE = new Color("#909");
		this.MAGENTA = new Color("#f0f");
		this.BLANK = new Color(0, 0, 0, 0);
		this.BLACK = new Color(0, 0, 0, 1);
		this.WHITE = new Color(255, 255, 255, 1);
		this.CYAN = new Color(0, 255, 255, 1);
		this.GRAY = new Color(128, 128, 128, 1);
		this.LIGHT_GRAY = new Color("#ccc");
		this.RAZZMATAZZ = new Color("#e3256b");
		this.CREAM = new Color("#fff185");
		this.LIME = new Color(0, 255, 0, 1);
		this.BROWN = new Color("#7d5314");
		this.DARK_BROWN = new Color("#5a2000");
		this.SKY_BLUE = new Color("#87ceeb");
		this.TOBIN = new Color("#20a02a");
		this.ZOE = new Color("#261550");
		this.MAX = new Color("#161616");
		this.MOLLY = new Color("#8b8");
	}
	add(name, color) {
		this[name.toUpperCase()] = color;
	}
}