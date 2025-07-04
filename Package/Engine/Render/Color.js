/**
 * Represents a color to be used in rendering.
 * It is stored as an RGB triple with an additional opacity component.
 * @prop Number red | The red component of the color, on [0, 255]
 * @prop Number green | The green component of the color, on [0, 255]
 * @prop Number blue | The blue component of the color, on [0, 255]
 * @prop Number alpha | The alpha (opacity) component of the color, on [0, 1]
 * @prop Boolean limited | Whether or not all the color's channels will be clamped within their respective bounds after all operations. This starts as true
 * @prop Number brightness | The grayscale intensity of the color, on [0, 1]
 * @prop<static, immutable> String[] modValues | The numeric components of the color, `["red", "green", "blue", "alpha"]`
 * @prop<static, immutable> Number EPSILON | The smallest visually meaningful change in alpha, 1/255.
 */
class Color extends Operable {
	static modValues = ["red", "green", "blue", "alpha"];
	
	/**
	 * Creates a new Color.
	 * @signature
	 * @param String color | Any valid CSS color representation
	 * @signature
	 * @param Number red | The red component of the color, on [0, 255]
	 * @param Number green | The green component of the color, on [0, 255]
	 * @param Number blue | The blue component of the color, on [0, 255]
	 * @param Number alpha? | The alpha (opacity) component of the color, on [0, 1]. Default is 1
	 */
	constructor(r, g, b, a, constrained = false) {
		super();
		this.limited = true;
		this.initialize(r, g, b, a);
		if (!constrained) this.constrain();
	}
	initialize(r, g, b, a) {
		if (g === undefined) {
			if (typeof r === "string") {
				if (r[0] === "#" || r[r.length - 1] === ")") {
					// explicit
					let col = r;
					if (col[0] === "#")
						Color.parseHex(col, this);
					else if (col.startsWith("rgb"))
						Color.parseRGBA(col, this);
					else {
						Color.span.style.color = r;
						Color.parseRGBA(Color.span.style.color, this);
					}
				} else {
					// implicit
					Color.CSSColor(r, this);
				}
			} else if (typeof r === "number") { // hexidecimal (6-digit)
				this.red = r >> 16;
				this.green = (r >> 8) & 255;
				this.blue = r & 255;
				this.alpha = 1;
			}
		} else {
			this.red = r ?? 0;
			this.green = g ?? 0;
			this.blue = b ?? 0;
			this.alpha = a ?? 1;
		}
	}
	set x(a) { this.red = a * 255; }
	get x() { return this.red / 255; }
	set y(a) { this.green = a * 255; }
	get y() { return this.green / 255; }
	set z(a) { this.blue = a * 255; }
	get z() { return this.blue / 255; }
	set w(a) { this.alpha = a; }
	get w() { return this.alpha; }
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
	/**
	 * Returns the hexadecimal representation of the color as a 32-bit integer.
	 * In most-to-least significant byte order, the format returned will be `RRGGBBAA`.
	 * @return Number
	 */
	get hex() {
		return this.red << 24 | this.green << 16 | this.blue << 8 | (this.alpha * 255);
	}
	/**
	 * Returns a copy of the color with an alpha of 1.
	 * @return Color
	 */
	get opaque() {
		return new Color(this.red, this.green, this.blue, 1);
	}
	/**
	 * Returns the inverse of the caller, with the same alpha as the caller.
	 * The inverse is defined as white minus the caller.
	 * @return Color
	 */
	get inverse() {
		let n = (new Color(255, 255, 255, 1)).sub(this);
		n.alpha = this.alpha;
		return n;
	}
	/**
	 * Returns the CSS rgba color string representing the color. 
	 * @return String
	 */
	getRGBA() {
		return "rgba(" + Math.floor(this.red) + ", " + Math.floor(this.green) + ", " + Math.floor(this.blue) + ", " + this.alpha + ")";
	}
	/**
	 * Returns the CSS hex color string representing the color. 
	 * @return String
	 */
	getHex() {
		return "#" + Color.numToHex(this.red) + Color.numToHex(this.green) + Color.numToHex(this.blue) + Color.numToHex(this.alpha * 255);
	}
	/**
	 * Returns the GLSL vec4 string representing the color. 
	 * @return String
	 */
	getGLSL() {
		return `vec4(${this.red / 255}, ${this.green / 255}, ${this.blue / 255}, ${this.alpha})`;
	}
	/**
	 * Returns a valid CSS string representation of the color.
	 * @return String
	 */
	toString() {
		return this.getRGBA();
	}
	get(result = new Color(0, 0, 0, 0, true)) {
		result.red = this.red;
		result.green = this.green;
		result.blue = this.blue;
		result.alpha = this.alpha;
		result.limited = this.limited;
		return result;
	}
	op(fn, v, dst) {
		dst ??= Color.zero;
		dst.limited = this.limited && (v.limited ?? true);
		dst = super.op(fn, v, dst);
		dst.constrain();
		return dst;
	}
	constrain() {
		if (this.limited) {
			this.red = Number.clamp(this.red, 0, 255);
			this.green = Number.clamp(this.green, 0, 255);
			this.blue = Number.clamp(this.blue, 0, 255);
			this.alpha = Number.clamp(this.alpha, 0, 1);
		}
	}
	diff(color) {
		const red = Math.abs(this.red - color.red);
		const green = Math.abs(this.green - color.green);
		const blue = Math.abs(this.blue - color.blue);
		return red + green + blue;
	}
	static get empty() {
		return new Color(0, 0, 0, 0);
	}
	static quadLerp(a, b, c, d, tx, ty) {
		return Color.zero.map((value, channel) => Interpolation.quadLerp(a[channel], b[channel], c[channel], d[channel], tx, ty));
	}
	/**
	 * Returns a copy of a specified color with a specified alpha.
	 * @param Color color | The color to use for the RGB portion of the result
	 * @param Number alpha | The new alpha value
	 * @return Color
	 */
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
	/**
	 * Returns a copy of a color with a specified change in saturation.
	 * @param Color color | The base color
	 * @param Number factor | The multiplier on the current saturation of the color
	 * @return Color
	 */
	static saturate(col, a) {
		let b = col.brightness * 255;
		return new Color(b + (col.red - b) * a, b + (col.green - b) * a, b + (col.blue - b) * a, col.alpha);
	}
	/**
	 * Returns a new grayscale color with a specified brightness.
	 * @param Number intensity | The grayscale intensity on [0, 1]
	 * @return Color
	 */
	static grayScale(per) {
		let r = 255 * per;
		let g = 255 * per;
		let b = 255 * per;
		return new Color(r, g, b, 1);
	}
	/**
	 * Creates a new color whose channels aren't clamped within the normal range (`.limited = false`).
	 * @signature
	 * @param String color | Any valid CSS color representation
	 * @signature
	 * @param Number red | The red component of the color, on [0, 255]
	 * @param Number green | The green component of the color, on [0, 255]
	 * @param Number blue | The blue component of the color, on [0, 255]
	 * @param Number alpha? | The alpha (opacity) component of the color, on [0, 1]. Default is 1
	 * @return Color
	 */
	static unlimited(r, g, b, a) {
		const result = new Color();
		result.initialize(r, g, b, a);
		result.limited = false;
		return result;
	}
	static CSSColor(word, destination) {
		destination.set(Color.CSSColors[word.toLowerCase()]);
	}
	static numToHex(num) {
		return Math.floor(num / 16).toString(16) + Math.floor(num % 16).toString(16);
	}
	static parseHex(str, destination) {
		const num = parseInt(str.slice(1), 16);
		
		switch (str.length) {
			case 4: // #rgb
				destination.red = 17 * ((num >> 8) & 0xF);
				destination.green = 17 * ((num >> 4) & 0xF);
				destination.blue = 17 * (num & 0xF);
				destination.alpha = 1;
				break;
			case 5: // #rgba
				destination.red = 17 * ((num >> 24) & 0xFF);
				destination.green = 17 * ((num >> 16) & 0xFF);
				destination.blue = 17 * ((num >> 8) & 0xFF);
				destination.alpha = 17 * (num & 0xFF) / 255;
				break;
			case 7: // #rrggbb
				destination.red = (num >> 16) & 0xFF;
				destination.green = (num >> 8) & 0xFF;
				destination.blue = num & 0xFF;
				destination.alpha = 1;
				break;
			case 9: // #rrggbbaa
				destination.red = (num >> 24) & 0xFF;
				destination.green = (num >> 16) & 0xFF;
				destination.blue = (num >> 8) & 0xFF;
				destination.alpha = (num & 0xFF) / 255;
				break;
		}
	}
	static parseNum(str, limit) {
		const number = parseFloat(str);
		if (str[str.length - 1] === "%") return number * limit / 100;
		return number;
	}
	static parseRGBA(str, destination) {
		const rgba = str.slice(
			str.indexOf("(", 3) + 1,
			str.length - 1
		);

		const rInx = rgba.indexOf(",", 1);
		destination.red = Color.parseNum(rgba.slice(0, rInx), 255);

		const gInx = rgba.indexOf(",", rInx + 2);
		destination.green = Color.parseNum(rgba.slice(rInx + 1, gInx), 255);
		
		const bInx = rgba.indexOf(",", gInx + 2);
		destination.blue = Color.parseNum(rgba.slice(gInx + 1, bInx >= 0 ? bInx : rgba.length), 255);

		destination.alpha = bInx >= 0 ? Color.parseNum(rgba.slice(bInx + 1), 1) : 1;
	}
	
	static EPSILON = 1 / 255;
	static span = document.createElement("span");

	static RED = new Color("#f00");
	static BLUE = new Color("#00f");
	static YELLOW = new Color("#ff0");
	static GOLD = new Color("#d4af37");
	static GREEN = new Color("#090");
	static ORANGE = new Color("#f90");
	static PURPLE = new Color("#909");
	static MAGENTA = new Color("#f0f");
	static PINK = new Color(255, 192, 203);
	static BLANK = new Color(0, 0, 0, 0);
	static BLACK = new Color(0, 0, 0, 1);
	static WHITE = new Color(255, 255, 255, 1);
	static CYAN = new Color(0, 255, 255, 1);
	static GRAY = new Color(128, 128, 128, 1);
	static DARK_GRAY = new Color("#222");
	static LIGHT_GRAY = new Color("#ccc");
	static CREAM = new Color("#fff185");
	static LIME = new Color(0, 255, 0, 1);
	static BROWN = new Color("#7d5314");
	static DARK_BROWN = new Color("#5a2000");
	static SKY_BLUE = new Color("#87ceeb");
	static TOBIN = new Color("#20a02a");
	static ZOË = new Color("#261550");
	static MAX = new Color("#161616");
	static MOLLY = new Color("#8b8");
	static SAND = new Color("#d6c692");
	static LAVENDER = new Color("#b36cb8");
	static PERIWINKLE = new Color("#78e");
	static QUINN = new Color("#35063E");

	static CSSColors = {
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
	};
}
