class Color extends Operable {
	constructor(r, g, b, a) {
		super();
		let red = 0;
		let green = 0;
		let blue = 0;
		let alpha = 0;
		this.custom = {};
		this.limited = true;
		if (b === undefined && g === undefined && typeof r == "string") {
			if (r.indexOf("rgb") < 0 && r.indexOf("#") < 0) {
				let col = Color.CSSColor(r);
				red = col.red;
				green = col.green;
				blue = col.blue;
				alpha = col.alpha;
			} else if (r[0] == "r") {
				let col = Color.parseRGBA(r);
				red = col.red;
				green = col.green;
				blue = col.blue;
				alpha = col.alpha;
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
				let col = Color.parseRGBA(rgb);
				red = col.red;
				green = col.green;
				blue = col.blue;
				alpha = col.alpha;
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
	static parseRGBA(str) {
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
		let red = parseFloat(rgbaList[0]);
		let green = parseFloat(rgbaList[1]);
		let blue = parseFloat(rgbaList[2]);
		let alpha = (rgbaList.length > 3) ? parseFloat(rgbaList[3]) : 1;
		return { red, green, blue, alpha };
	}
	static CSSColor(word) {
		//processed
		return "#" + Color.CSSColors[word.toLowerCase()];
	}
	static optimizedConstruct(red, green, blue, alpha) {
		return new Color(red, green, blue, alpha);
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
	static rand(seed) {
		return new Color(rand(seed) * 255, rand(seed + 1) * 255, rand(seed + 2) * 255, rand(seed + 3));
	}
	invert() {
		let n = (new Color(255, 255, 255, 1)).sub(this);
		n.alpha = this.alpha;
		return n;
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
	op(fn, v) {
		super.op(fn, v);
		this.constrain();
		return this;
	}
	constrain() {
		if (this.limited) {
			this.red = Number.clamp(this.red, 0, 255);
			this.green = Number.clamp(this.green, 0, 255);
			this.blue = Number.clamp(this.blue, 0, 255);
			this.alpha = Number.clamp(this.alpha, 0, 1);
		}
	}
	dif(color) {
		let red = Math.abs(this.red - color.red) / 255;
		let green = Math.abs(this.green - color.green) / 255;
		let blue = Math.abs(this.blue - color.blue) / 255;
		let alpha = Math.abs(this.alpha - color.alpha) / 255;
		return (((red + green + blue + alpha) * 10) ** 2) / 1600;
	}
	static get empty() {
		return Color.optimizedConstruct(0, 0, 0, 0);
	}
	static avg(c1, c2) {
		return c1.plus(c2).over(2);
	}
	static sum(...colors) {
		let result = Color.optimizedConstruct(0, 0, 0, 0);
		for (let color of colors) result.add(color);
		return result;
	}
	static quadLerp(a, b, c, d, tx, ty) {
		return Color.empty.map((value, channel) => Interpolation.quadLerp(a[channel], b[channel], c[channel], d[channel], tx, ty));
	}
	static alpha(col, alpha) {
		let cl = col.get();
		cl.alpha = alpha;
		return cl;
	}
	static colorScale(col, per) {
		let cl = col.times(per);
		cl.alpha = col.alpha;
		return cl;
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
Color.CSSColors = {
	aliceblue: new Color(240, 248, 255),
	antiquewhite: new Color(250, 235, 215),
	aqua: new Color(0, 255, 255),
	aquamarine: new Color(127, 255, 212),
	azure: new Color(240, 255, 255),
	beige: new Color(245, 245, 220),
	bisque: new Color(255, 228, 196),
	black: new Color(0, 0, 0),
	blanchedalmond: new Color(255, 235, 205),
	blue: new Color(0, 0, 255),
	blueviolet: new Color(138, 43, 226),
	brown: new Color(165, 42, 42),
	burlywood: new Color(222, 184, 135),
	cadetblue: new Color(95, 158, 160),
	chartreuse: new Color(127, 255, 0),
	chocolate: new Color(210, 105, 30),
	coral: new Color(255, 127, 80),
	cornflowerblue: new Color(100, 149, 237),
	cornsilk: new Color(255, 248, 220),
	crimson: new Color(220, 20, 60),
	cyan: new Color(0, 255, 255),
	darkblue: new Color(0, 0, 139),
	darkcyan: new Color(0, 139, 139),
	darkgoldenrod: new Color(184, 134, 11),
	darkgray: new Color(169, 169, 169),
	darkgrey: new Color(169, 169, 169),
	darkgreen: new Color(0, 100, 0),
	darkkhaki: new Color(189, 183, 107),
	darkmagenta: new Color(139, 0, 139),
	darkolivegreen: new Color(85, 107, 47),
	darkorange: new Color(255, 140, 0),
	darkorchid: new Color(153, 50, 204),
	darkred: new Color(139, 0, 0),
	darksalmon: new Color(233, 150, 122),
	darkseagreen: new Color(143, 188, 143),
	darkslateblue: new Color(72, 61, 139),
	darkslategray: new Color(47, 79, 79),
	darkslategrey: new Color(47, 79, 79),
	darkturquoise: new Color(0, 206, 209),
	darkviolet: new Color(148, 0, 211),
	deeppink: new Color(255, 20, 147),
	deepskyblue: new Color(0, 191, 255),
	dimgray: new Color(105, 105, 105),
	dimgrey: new Color(105, 105, 105),
	dodgerblue: new Color(30, 144, 255),
	firebrick: new Color(178, 34, 34),
	floralwhite: new Color(255, 250, 240),
	forestgreen: new Color(34, 139, 34),
	fuchsia: new Color(255, 0, 255),
	gainsboro: new Color(220, 220, 220),
	ghostwhite: new Color(248, 248, 255),
	gold: new Color(255, 215, 0),
	goldenrod: new Color(218, 165, 32),
	gray: new Color(128, 128, 128),
	grey: new Color(128, 128, 128),
	green: new Color(0, 128, 0),
	greenyellow: new Color(173, 255, 47),
	honeydew: new Color(240, 255, 240),
	hotpink: new Color(255, 105, 180),
	indianred: new Color(205, 92, 92),
	indigo: new Color(75, 0, 130),
	ivory: new Color(255, 255, 240),
	khaki: new Color(240, 230, 140),
	lavender: new Color(230, 230, 250),
	lavenderblush: new Color(255, 240, 245),
	lawngreen: new Color(124, 252, 0),
	lemonchiffon: new Color(255, 250, 205),
	lightblue: new Color(173, 216, 230),
	lightcoral: new Color(240, 128, 128),
	lightcyan: new Color(224, 255, 255),
	lightgoldenrodyellow: new Color(250, 250, 210),
	lightgray: new Color(211, 211, 211),
	lightgrey: new Color(211, 211, 211),
	lightgreen: new Color(144, 238, 144),
	lightpink: new Color(255, 182, 193),
	lightsalmon: new Color(255, 160, 122),
	lightseagreen: new Color(32, 178, 170),
	lightskyblue: new Color(135, 206, 250),
	lightslategray: new Color(119, 136, 153),
	lightslategrey: new Color(119, 136, 153),
	lightsteelblue: new Color(176, 196, 222),
	lightyellow: new Color(255, 255, 224),
	lime: new Color(0, 255, 0),
	limegreen: new Color(50, 205, 50),
	linen: new Color(250, 240, 230),
	magenta: new Color(255, 0, 255),
	maroon: new Color(128, 0, 0),
	mediumaquamarine: new Color(102, 205, 170),
	mediumblue: new Color(0, 0, 205),
	mediumorchid: new Color(186, 85, 211),
	mediumpurple: new Color(147, 112, 219),
	mediumseagreen: new Color(60, 179, 113),
	mediumslateblue: new Color(123, 104, 238),
	mediumspringgreen: new Color(0, 250, 154),
	mediumturquoise: new Color(72, 209, 204),
	mediumvioletred: new Color(199, 21, 133),
	midnightblue: new Color(25, 25, 112),
	mintcream: new Color(245, 255, 250),
	mistyrose: new Color(255, 228, 225),
	moccasin: new Color(255, 228, 181),
	navajowhite: new Color(255, 222, 173),
	navy: new Color(0, 0, 128),
	oldlace: new Color(253, 245, 230),
	olive: new Color(128, 128, 0),
	olivedrab: new Color(107, 142, 35),
	orange: new Color(255, 165, 0),
	orangered: new Color(255, 69, 0),
	orchid: new Color(218, 112, 214),
	palegoldenrod: new Color(238, 232, 170),
	palegreen: new Color(152, 251, 152),
	paleturquoise: new Color(175, 238, 238),
	palevioletred: new Color(219, 112, 147),
	papayawhip: new Color(255, 239, 213),
	peachpuff: new Color(255, 218, 185),
	peru: new Color(205, 133, 63),
	pink: new Color(255, 192, 203),
	plum: new Color(221, 160, 221),
	powderblue: new Color(176, 224, 230),
	purple: new Color(128, 0, 128),
	rebeccapurple: new Color(102, 51, 153),
	red: new Color(255, 0, 0),
	rosybrown: new Color(188, 143, 143),
	royalblue: new Color(65, 105, 225),
	saddlebrown: new Color(139, 69, 19),
	salmon: new Color(250, 128, 114),
	sandybrown: new Color(244, 164, 96),
	seagreen: new Color(46, 139, 87),
	seashell: new Color(255, 245, 238),
	sienna: new Color(160, 82, 45),
	silver: new Color(192, 192, 192),
	skyblue: new Color(135, 206, 235),
	slateblue: new Color(106, 90, 205),
	slategray: new Color(112, 128, 144),
	slategrey: new Color(112, 128, 144),
	snow: new Color(255, 250, 250),
	springgreen: new Color(0, 255, 127),
	steelblue: new Color(70, 130, 180),
	tan: new Color(210, 180, 140),
	teal: new Color(0, 128, 128),
	thistle: new Color(216, 191, 216),
	tomato: new Color(255, 99, 71),
	turquoise: new Color(64, 224, 208),
	violet: new Color(238, 130, 238),
	wheat: new Color(245, 222, 179),
	white: new Color(255, 255, 255),
	whitesmoke: new Color(245, 245, 245),
	yellow: new Color(255, 255, 0),
}
Color.modValues = ["red", "green", "blue", "alpha"];
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
		this.PINK = new Color(255, 192, 203)
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