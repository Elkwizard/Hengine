class Font {
	constructor(size = 15, family = "Arial", bold = false, italic = false) {
		this.size = size;
		this.family = family;
		this.bold = bold;
		this.italic = italic;
		this.lineHeight = this.size;
	}
	set size(a) {
		this.lineHeight = this.lineHeight / this.size * a;
		this._size = a;
	}
	get size() {
		return this._size;
	}
	toString() {
		return `${this.italic ? "italic" : "normal"} ${this.bold ? "bold" : "normal"} ${this.size}px/${this.lineHeight / this.size} ${this.family}`;
	}
}