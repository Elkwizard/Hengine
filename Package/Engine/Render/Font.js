class Font {
	constructor(size = 15, family = "Arial") {
		this.size = size;
		this.family = family;
	}
	toString() {
		return `${this.size}px ${this.family}`;
	}
}