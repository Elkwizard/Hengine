/**
 * @implements Copyable
 * Represents a font, including family, side, and styling.
 * Fonts can be used in the text rendering functions of Artist.
 * ```js
 * const font = new Font(15, "Consolas", false, true); // italic 15px Consolas
 * 
 * renderer.draw(new Color("black")).text(font, "Hello World!", 0, 0);
 * ```
 * @prop Number size | The size of the font in CSS pixels
 * @prop String family | The string identifier for the font family
 * @prop Boolean bold | Whether the font is bold
 * @prop Boolean italic | Whether the font is italic
 * @prop Number lineHeight | The height of a line of text in the font. This determines spacing between multiline strings
 * @prop Number tabSize | The number of spaces a tab is equivalent to for this font
 * @prop<static, immutable> Font [FAMILY][SIZE] | These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
 * @name_subs FAMILY: Serif, Arial, Cursive, Monospace; SIZE: 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100
 */
class Font {
	/**
	 * Creates a new font.
	 * @param Number size | The size of the font
	 * @param String family | The font family
	 * @param Boolean bold? | Whether the font is bold, default is false
	 * @param Boolean italic? | Whether the font is italic, default is false
	 */
	constructor(size = 15, family = "Arial", bold = false, italic = false) {
		this.size = size;
		this.family = family;
		this.bold = bold;
		this.italic = italic;
		this.lineHeight = this.size;
		this.refont();
		this.tabSize = 4;
		this.memorizedWidths = {};
	}
	set family(a) {
		this._family = a;
		const l = a.toLowerCase();
		this.keywordFamily = Font.keywordFamilies.includes(l);
		this.refont();
		if (a.match(/mono|consolas/g)) {
			const charWidth = this.getWidthCRC2D("m");
			this.getWidthCRC2D = text => text.length * charWidth;
		}
	}
	get family() {
		return this._family;
	}
	set bold(a) {
		this._bold = a;
		this.refont();
	}
	get bold() {
		return this._bold;
	}
	set italic(a) {
		this._italic = a;
		this.refont();
	}
	get italic() {
		return this._italic;
	}
	set tabSize(a) {
		this.tabReplacement = " ".repeat(a);
	}
	set lineHeight(a) {
		this._lineHeight = a;
		this.refont();
	}
	get lineHeight() {
		return this._lineHeight;
	}
	get tabSize() {
		return this.tabReplacement.length;
	}
	set size(a) {
		this.lineHeight = this.lineHeight / this.size * a;
		this._size = a;
		this.refont();
	}
	get size() {
		return this._size;
	}
	refont() {
		this.memorizedWidths = { };
		const familyString = this.keywordFamily ? this.family : JSON.stringify(this.family);
		this.fontString = `${this.italic ? "italic" : "normal"} ${this.bold ? "bold" : "normal"} ${this.size}px/${this.lineHeight / this.size} ${familyString}`;
		
		// measure font placement
		Font.context.font = this.fontString;
		const metrics = Font.context.measureText("0");
		this.boundingAscent = metrics.actualBoundingBoxAscent;
		this.boundingDescent = metrics.actualBoundingBoxDescent;
	}
	processString(str) {
		return String(str).replace(/\r/g, "").replace(/\t/g, this.tabReplacement);
	}
	getWidthCRC2D(str) {
		if (str in this.memorizedWidths) return this.memorizedWidths[str];
		Font.context.font = this.fontString;
		const width = Font.context.measureText(str).width;
		this.memorizedWidths[str] = width;
		return width;
	}
	/**
	 * Packs a string of text into a fixed width, adding new lines as necessary to prevent overflow.
	 * @param String text | The text to pack 
	 * @param Number maxWidth | The maximum allowed width of a single line in the output text 
	 * @return String
	 */
	packText(str, maxWidth) {
		str = this.processString(str);
		return str
			.split("\n")
			.map(line => {
				let lineStart = true;
				const words = line.split(" ");
				const lines = [];
				let acc = "";
				for (let i = 0; i < words.length; i++) {
					const word = words[i];
					if (this.getWidthCRC2D(acc + (lineStart ? "" : " ") + word) > maxWidth) {
						lines.push(acc);
						acc = "";
						lineStart = true;
					}
					acc += (lineStart ? "" : " ") + word;
					lineStart = false;
				}
				if (acc) lines.push(acc);
				return lines.join("\n");
			})
			.join("\n");
	}
	/**
	 * Returns the width and height of a string of text, optionally after being packed into a fixed max width.
	 * The return value contains `.width` and `.height` properties, both of which are Numbers.
	 * @param String text | The text to be measured
	 * @param Number maxWidth? | The maximum allowed width of a single line before wrapping occurs. Default is Infinity
	 * @return { width: Number, height: Number }
	 */
	getTextBounds(str, pack) {
		str = this.processString(str);
		if (pack) str = this.packText(str, pack);
		let spl = str.split("\n");
		let width = Math.max(...spl.map(l => this.getWidthCRC2D(l)));
		let height = spl.length * this.lineHeight;
		return { width, height };
	}
	/**
	 * Returns the width of a string of text.
	 * @param String text | The text to measure 
	 * @return Number
	 */
	getTextWidth(str) {
		str = this.processString(str);
		if (str.includes("\n")) {
			const lines = str.split("\n");
			return Math.max(...lines.map(l => this.getWidthCRC2D(l)));
		}

		return this.getWidthCRC2D(str);
	}
	/**
	 * Returns the height of a string of text.
	 * @param String text | The text to measure
	 * @param Number packWidth? | The maximum allowed width of a single line before wrapping occurs. Default is Infinity
	 * @return Number
	 */
	getTextHeight(str, pack = false) {
		let innerLines = 0;
		if (str.includes("\n") || pack) {
			str = this.processString(str);
			if (pack) str = this.packText(str, pack);
			innerLines = str.split("\n").length - 1;
		}
		return this.boundingAscent + this.boundingDescent + innerLines * this.lineHeight;
	}
	/**
	 * Converts the Font to a valid CSS font string.
	 * @return String
	 */
	toString() {
		return this.fontString;
	}
	get(font = new Font(0, "serif", false, false)) {
		font.size = this.size;
		font.family = this.family;
		font.bold = this.bold;
		font.italic = this.italic;
		font.lineHeight = this.lineHeight;
		return font;
	}
	
	static context = new_OffscreenCanvas(1, 1).getContext("2d");
	static keywordFamilies = ["monospace", "sans-serif", "serif", "cursive", "fantasy", "system-ui"];
	static defaultFamilies = ["Serif", "Arial", "Cursive", "Monospace"];
	static defaultSizes = [];
}
// setup
for (let i = 0; i < 20; i++) Font.defaultSizes.push((i + 1) * 5);
for (let i = 0; i < Font.defaultSizes.length; i++) {
	for (let j = 0; j < Font.defaultFamilies.length; j++) {
		const NAME = Font.defaultFamilies[j] + Font.defaultSizes[i];
		Lazy.define(Font, NAME, () => new Font(Font.defaultSizes[i], Font.defaultFamilies[j]));
	}
}