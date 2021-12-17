class Font {
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
		if (a.toLowerCase().match(/(mono|consolas)/g)) {
			this.getWidthCRC2D = str => str.length * 0.5498046875 * this.size;
		};
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
		return (str + "").replace(/\r/g, "").replace(/\t/g, this.tabReplacement);
	}
	getWidthCRC2D(str) {
		if (str in this.memorizedWidths) return this.memorizedWidths[str];
		const width = this.c.measureText(str).width;
		this.memorizedWidths[str] = width;
		return width;
	}
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
	getTextBounds(str, pack) {
		str = this.processString(str);
		if (pack) str = this.packText(str, pack);
		let spl = str.split("\n");
		let width = Math.max(...spl.map(l => this.getWidthCRC2D(l)));
		let height = spl.length * this.lineHeight;
		return { width, height };
	}
	getTextLineWidth(str) {
		str = this.processString(str);
		return this.getWidthCRC2D(str);
	}
	getTextLineHeight(str) {
		return this.lineHeight;
	}
	getTextWidth(str) {
		str = this.processString(str);
		let spl = str.split("\n");
		return Math.max(...spl.map(l => this.getWidthCRC2D(l)));
	}
	getTextHeight(str, pack) {
		str = this.processString(str);
		if (pack) str = this.packText(str, pack);
		return str.split("\n").length * this.lineHeight;
	}
	toString() {
		const familyString = this.keywordFamily ? this.family : JSON.stringify(this.family);
		return `${this.italic ? "italic" : "normal"} ${this.bold ? "bold" : "normal"} ${this.size}px/${this.lineHeight / this.size} ${familyString}`;
	}
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