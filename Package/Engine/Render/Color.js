class Color extends Operable {
	constructor(r, g, b, a) {
		super();
		let red = 0;
		let green = 0;
		let blue = 0;
		let alpha = 0;
		this.limited = true;
		if (b === undefined && g === undefined && typeof r == "string") {
			let col;
			if (r.match(/[\(#]/g)) {
				// explicit
				let rgb = r;
				if (!r.match(/rgba?/g)) {
					Color.span.style.color = r;
					rgb = Color.span.style.color;
				}
				col = Color.parseRGBA(rgb);
			} else {
				// implicit
				col = Color.CSSColor(r);
			}
			red = col.red;
			green = col.green;
			blue = col.blue;
			alpha = col.alpha;
		} else {
			red = (r !== undefined) ? r : 0;
			green = (g !== undefined) ? g : 0;
			blue = (b !== undefined) ? b : 0;
			alpha = (a !== undefined) ? a : 1;
		}
		this.red = red;
		this.green = green;
		this.blue = blue;
		this.alpha = alpha;
		this.constrain();
	}
	set brightness(n) {
		let scale = n / this.brightness;
		this.red *= scale;
		this.green *= scale;
		this.blue *= scale;
		this.constrain();
	}
	get brightness() {
		return (this.red + this.blue + this.green) / (3 * 255);
	}
	get opaque() {
		return new Color(this.red, this.green, this.blue, 1);
	}
	get inverse() {
		let n = (new Color(255, 255, 255, 1)).sub(this);
		n.alpha = this.alpha;
		return n;
	}
	getRGBA() {
		return "rgba(" + Math.floor(this.red) + ", " + Math.floor(this.green) + ", " + Math.floor(this.blue) + ", " + this.alpha + ")";
	}
	getHex() {
		return "#" + Color.numToHex(this.red) + Color.numToHex(this.green) + Color.numToHex(this.blue);
	}
	getGLSL() {
		return `vec4(${this.red / 255}, ${this.green / 255}, ${this.blue / 255}, ${this.alpha})`;
	}
	toString() {
		return this.getRGBA();
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
		return Color.modValues.map(ch => Math.abs(this[ch] - color[ch])).total();
	}
	static get empty() {
		return new Color(0, 0, 0, 0);
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
	static saturate(col, a) {
		let b = col.brightness * 255;
		return new Color(b + (col.red - b) * a, b + (col.green - b) * a, b + (col.blue - b) * a, col.alpha);
	}
	static grayScale(per) {
		let r = 255 * per;
		let g = 255 * per;
		let b = 255 * per;
		return new Color(r, g, b, 1);
	}
	static CSSColor(word) {
		//processed
		return Color.CSSColors[word.toLowerCase()];
	}
	static numToHex(num) {
		let a = Math.floor(num / 16);
		let b = Math.floor(num % 16);
		let hexAry = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
		return hexAry[a] + hexAry[b];
	}
	static parseNum(str, limit) {
		if (str[str.length - 1] === "%") return parseFloat(str) / 100 * limit;
		return parseFloat(str);
	}
	static parseHSBA(str) {
		let hsb = "";
		let state = false;
		for (let char of str) {
			if (char == ")" || char == "(") {
				state = !state;
			}
			else if (state) {
				hsb += char;
			}
		}
		let hsbaList = hsb.split(",");
		let H = Color.parseNum(hsbaList[0], 360);
		let S = Color.parseNum(hsbaList[1], 1);
		let B = Color.parseNum(hsbaList[2], 1);
		let alpha = (hsbaList.length > 3) ? Color.parseNum(hsbaList[3], 1) : 1;

		H = Math.max(H, 0);
		H %= 360;
		let seg = ~~(H / 120);
		let t = (H % 120) / 120;
		let ot = t + Math.sin(2 * Math.PI * t) / (2 * Math.PI);
		// let ot1 = 2 * 255 * Math.min(1 - t, 0.5);
		// let ot2 = 2 * 255 * Math.min(t, 0.5);
		let st = (3 + Math.sin(2 * Math.PI * t - Math.PI / 2)) / 2;
		let r = 0, g = 0, b = 0;
		switch (seg) {
			case 0:
				g = 255 * ot;
				r = 255 - g;
				break;
			case 1:
				b = 255 * ot;
				g = 255 - b;
				break;
			case 2:
				r = 255 * ot;
				b = 255 - r;
				break;
		}

		let scaleBrightness = st;
		scaleBrightness *= B;
		r *= scaleBrightness;
		g *= scaleBrightness;
		b *= scaleBrightness;
		let middle = (r + g + b) / 3;
		let dr = r - middle;
		let dg = g - middle;
		let db = b - middle;
		r = middle + S * dr;
		g = middle + S * dg;
		b = middle + S * db;

		return { red: r, green: g, blue: b, alpha };
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
		let red = Color.parseNum(rgbaList[0], 255);
		let green = Color.parseNum(rgbaList[1], 255);
		let blue = Color.parseNum(rgbaList[2], 255);
		let alpha = (rgbaList.length > 3) ? Color.parseNum(rgbaList[3], 1) : 1;
		return { red, green, blue, alpha };
	}
}
Color.modValues = ["red", "green", "blue", "alpha"];
Color.EPSILON = 1 / 255;
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
Color.span = document.createElement("span");
Color.RED = new Color("#f00");
Color.BLUE = new Color("#00f");
Color.YELLOW = new Color("#ff0");
Color.GOLD = new Color("#d4af37");
Color.GREEN = new Color("#090");
Color.ORANGE = new Color("#f90");
Color.PURPLE = new Color("#909");
Color.MAGENTA = new Color("#f0f");
Color.PINK = new Color(255, 192, 203);
Color.BLANK = new Color(0, 0, 0, 0);
Color.BLACK = new Color(0, 0, 0, 1);
Color.WHITE = new Color(255, 255, 255, 1);
Color.CYAN = new Color(0, 255, 255, 1);
Color.GRAY = new Color(128, 128, 128, 1);
Color.DARK_GRAY = new Color("#222");
Color.LIGHT_GRAY = new Color("#ccc");
Color.RAZZMATAZZ = new Color("#e3256b");
Color.CREAM = new Color("#fff185");
Color.LIME = new Color(0, 255, 0, 1);
Color.BROWN = new Color("#7d5314");
Color.DARK_BROWN = new Color("#5a2000");
Color.SKY_BLUE = new Color("#87ceeb");
Color.TOBIN = new Color("#20a02a");
Color.ZOE = new Color("#261550");
Color.MAX = new Color("#161616");
Color.MOLLY = new Color("#8b8");