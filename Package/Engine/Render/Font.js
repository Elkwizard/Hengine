/**
 * Represents a font, including family, side, and styling.
 * Fonts can be used in the text rendering functions of Artist.
 * ```js
 * const font = new Font(15, "Consolas", false, true); // italic 15px Consolas
 * 
 * renderer.draw(new Color("black")).text(font, "Hello World!", 0, 0);
 * ```
 * @props<immutable>
 * @prop Number size | The size of the font in CSS pixels
 * @prop String family | The string identifier for the font family
 * @prop Boolean bolded | Whether the font is bold
 * @prop Boolean italicized | Whether the font is italic
 * @prop Number lineHeight | The height of a line of text in the font. This determines spacing between multi-line strings
 * @prop Number tabSize | The number of spaces a tab is equivalent to for this font
 * @prop<static, immutable> Font [FAMILY][SIZE] | These are premade fonts of four common families ("Serif", "Arial", "Cursive", "Monospace") of every size that is a multiple of 5 and less than 100. e.g. `Font.Arial10`, or `Font.Monospace95`
 * @name_subs FAMILY: Serif, Arial, Cursive, Monospace; SIZE: 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100
 */
class Font {
	/**
	 * Creates a new font which is non-italic and non-bold.
	 * The font will have a tab size of 4.
	 * @param Number size | The size and line height of the font
	 * @param String family | The font family
	 */
	constructor(size, family) {
		this.size = size;
		this.family = family;
		this.bolded = false;
		this.italicized = false;
		this.lineHeight = this.size;
		this.tabSize = 4;
		this.calculateMetrics();
	}
	withProperty(key, value) {
		const result = new Font(this.size, this.family);
		result.bolded = this.bolded;
		result.italicized = this.italicized;
		result.lineHeight = this.lineHeight;
		result.tabSize = this.tabSize;
		result[key] = value;
		result.calculateMetrics();
		return result;
	}
	/**
	 * Returns a copy of the caller with its `.family` property changed to a given value.
	 * @param String family | The new font family
	 * @return Font
	 */
	withFamily(family) {
		return this.withProperty("family", family);
	}
	/**
	 * Returns a copy of the caller with its `.size` property changed to a given value.
	 * The ratio of `.lineHeight` to `.size` will remain constant.
	 * @param Number size | The new font size, in CSS pixels
	 * @return Font
	 */
	withSize(size) {
		const lineHeight = size * this.lineHeight / this.size;
		return this.withProperty("size", size).withLineHeight(lineHeight);
	}
	/**
	 * Returns a copy of the caller with its `.lineHeight` property changed to a given value.
	 * The line height represents the vertical distance between two subsequent lines.
	 * @param Number lineHeight | The new font's line height, in CSS pixels
	 * @return Font
	 */
	withLineHeight(lineHeight) {
		return this.withProperty("lineHeight", lineHeight);
	}
	/**
	 * Returns a copy of the caller with its `.tabSize` property changed to a given value.
	 * @param Number tabSize | The amount of spaces a tab will correspond to
	 * @return Font
	 */
	withTabSize(tabSize) {
		return this.withProperty("tabSize", tabSize);
	}
	/**
	 * Returns a copy of the caller with its `.bolded` property changed to a given value.
	 * @param Boolean bold? | Whether the new font should be bold. Default is true
	 * @return Font
	 */
	bold(bold = true) {
		return this.withProperty("bolded", bold);
	}
	/**
	 * Returns a copy of the caller with its `.italicized` property changed to a given value.
	 * @param Boolean italic? | Whether the new font should be italic. Default is true
	 * @return Font
	 */
	italic(italic = true) {
		return this.withProperty("italicized", italic);
	}
	calculateMetrics() {
		// compute CSS string
		const lowerFamily = this.family.toLowerCase();
		const isKeywordFamily = Font.KEYWORD_FAMILIES.includes(lowerFamily);
		const family = isKeywordFamily ? this.family : JSON.stringify(this.family);
		const italic = this.italicized ? "italic" : "normal";
		const bold = this.bolded ? "bold" : "normal";
		const height = this.lineHeight / this.size;
		const size = this.size;
		this.cssFont = `${italic} ${bold} ${size}px/${height} ${family}`;
		
		// measure font placement
		Font.context.font = this.cssFont;
		const metrics = Font.context.measureText("0");
		this.boundingAscent = metrics.actualBoundingBoxAscent;
		this.boundingDescent = metrics.actualBoundingBoxDescent;
		this.widthCache = new Map();
		this.tabReplacement = " ".repeat(this.tabSize);
		
		if (lowerFamily.match(/mono|consolas/g)) {
			const charWidth = this.getWidthCRC2D("m");
			this.getWidthCRC2D = text => text.length * charWidth;
		}
	}
	processString(str) {
		return String(str)
			.replace(/\r/g, "")
			.replace(/\t/g, this.tabReplacement);
	}
	getWidthCRC2D(str) {
		if (!this.widthCache.has(str)) {
			Font.context.font = this.cssFont;
			const width = Font.context.measureText(str).width;
			this.widthCache.set(str, width);
		}

		return this.widthCache.get(str);
	}
	/**
	 * Packs a string of text into a fixed width, adding new lines as necessary to prevent overflow.
	 * @param String text | The text to pack 
	 * @param Number maxWidth | The maximum allowed width of a single line in the output text 
	 * @return String
	 */
	packText(str, maxWidth) {
		str = this.processString(str);
		
		if (!isFinite(maxWidth)) return str;
		
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
				return lines.join("\n").trim();
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
	getTextBounds(str, packWidth = Infinity) {
		str = this.packText(str, packWidth);
		const lines = str.split("\n");
		const width = Math.max(...lines.map(line => this.getWidthCRC2D(line)));
		const height = lines.length * this.lineHeight;
		return { width, height };
	}
	/**
	 * Returns the width of a string of text.
	 * @param String text | The text to measure 
	 * @param Number maxWidth? | The maximum allowed width of a single line before wrapping occurs. Defaults is Infinity
	 * @return Number
	 */
	getTextWidth(str, packWidth = Infinity) {
		str = this.packText(str, packWidth);
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
	getTextHeight(str, packWidth = Infinity) {
		let innerLines = 0;
		if (str.includes("\n") || isFinite(packWidth)) {
			str = this.packText(str, packWidth);
			innerLines = str.split("\n").length - 1;
		}
		return this.boundingAscent + this.boundingDescent + innerLines * this.lineHeight;
	}
	/**
	 * Converts the Font to a valid CSS font string.
	 * @return String
	 */
	toString() {
		return this.cssFont;
	}
	
	static context = new_OffscreenCanvas(1, 1).getContext("2d");
	static KEYWORD_FAMILIES = ["monospace", "sans-serif", "serif", "cursive", "fantasy", "system-ui"];
	static DEFAULT_FAMILIES = ["Serif", "Arial", "Cursive", "Monospace"];
}

// setup
for (let size = 5; size <= 100; size += 5) {
	for (let j = 0; j < Font.DEFAULT_FAMILIES.length; j++) {
		const NAME = Font.DEFAULT_FAMILIES[j] + size;
		Lazy.define(Font, NAME, () => new Font(size, Font.DEFAULT_FAMILIES[j]));
	}
}