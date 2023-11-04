/**
 * Represents a font, including family, side, and styling.
 * Fonts can be used in the text rendering functions of Artist.
 * @prop Number size | The size of the font in CSS pixels
 * @prop String family | The string identifier for the font family
 * @prop Boolean bold | Whether the font is bold
 * @prop Boolean italic | Whether the font is italic
 * @prop Number lineHeight | The height of a line of text in the font. This determines spacing between multiline strings
 * @prop Number tabSize | The number of spaces a tab is equivalent to for this font
 * @static_prop Font [FAMILY][SIZE] | These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
 */
class Font {
	/**
	 * Creates a new font. This operation is fairly expensive and thus should not be done every frame unless necessary.
	 * @param Number size | The size of the font
	 * @param String family | The font family
	 * @param Boolean bold? | Whether the font is bold, default is false
	 * @param Boolean italic? | Whether the font is italic, default is false
	 */
	constructor(size = 15, family = "Arial", bold = false, italic = false) {
		let canvas = new_OffscreenCanvas(1, 1);
		this.c = canvas.getContext("2d");
		this.size = size;
		this.family = family;
		this.bold = bold;
		this.italic = italic;
		this.lineHeight = this.size;
		this.refont();
		this.tabReplacement = "    ";
		this.memorizedWidths = {};
	}
	set family(a) {
		this._family = a;
		const l = a.toLowerCase();
		this.keywordFamily = (
			l === "monospace" ||
			l === "sans-serif" ||
			l === "serif" ||
			l === "cursive" ||
			l === "fantasy" ||
			l === "system-ui"
		);
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
		this.memorizedWidths = {};
		this.c.font = this.toString();
	}
	processString(str) {
		return String(str).replace(/\r/g, "").replace(/\t/g, this.tabReplacement);
	}
	getWidthCRC2D(str) {
		if (str in this.memorizedWidths) return this.memorizedWidths[str];
		const width = this.c.measureText(str).width;
		this.memorizedWidths[str] = width;
		return width;
	}
	/**
	 * Packs a string of text into a fixed width, adding new lines as necessary to prevent overflow.
	 * @param String text | The text to pack 
	 * @param Number maxWidth | The maximum width of a single line in the output text 
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
	 * @param Number maxWidth? | The maximum width of a single line, default is Infinity
	 * @return Object
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
	 * Returns the width of a single line of text. This method is faster than `.getTextWidth()`.
	 * @param String textLine | A single line string of text to measure 
	 * @return Number
	 */
	getTextLineWidth(str) {
		str = this.processString(str);
		return this.getWidthCRC2D(str);
	}
	/**
	 * Returns the height of a single line of text. This method is faster than `.getTextHeight()`.
	 * @param String textLine | A single line string of text to measure
	 * @return Number
	 */
	getTextLineHeight(str) {
		return this.lineHeight;
	}
	/**
	 * Returns the width of a string of text.
	 * @param String text | The text to measure 
	 * @return Number
	 */
	getTextWidth(str) {
		str = this.processString(str);
		let spl = str.split("\n");
		return Math.max(...spl.map(l => this.getWidthCRC2D(l)));
	}
	/**
	 * Returns the height of a string of text.
	 * @param String text | The text to measure 
	 * @return Number
	 */
	getTextHeight(str, pack) {
		str = this.processString(str);
		if (pack) str = this.packText(str, pack);
		return str.split("\n").length * this.lineHeight;
	}
	/**
	 * Converts the Font to a valid CSS font string.
	 * @return String
	 */
	toString() {
		const familyString = this.keywordFamily ? this.family : JSON.stringify(this.family);
		return `${this.italic ? "italic" : "normal"} ${this.bold ? "bold" : "normal"} ${this.size}px/${this.lineHeight / this.size} ${familyString}`;
	}
	/**
	 * Creates a copy of the font and optionally stores it in a provided destination.
	 * @param Font destination? | The destination to copy the font into.
	 * @return Font
	 */
	get(font = new Font(0, "serif", false, false)) {
		font.size = this.size;
		font.family = this.family;
		font.bold = this.bold;
		font.italic = this.italic;
		font.lineHeight = this.lineHeight;
		return font;
	}
}
// setup
Font.defaultFamilies = ["Serif", "Arial", "Cursive", "Monospace"];
Font.defaultSizes = [];
for (let i = 0; i < 20; i++) Font.defaultSizes.push((i + 1) * 5);
for (let i = 0; i < Font.defaultSizes.length; i++) {
	for (let j = 0; j < Font.defaultFamilies.length; j++) {
		const NAME = Font.defaultFamilies[j] + Font.defaultSizes[i];
		Lazy.define(Font, NAME, () => new Font(Font.defaultSizes[i], Font.defaultFamilies[j]));
	}
}