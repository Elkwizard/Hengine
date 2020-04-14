class Fade {
	constructor(color, length, fadeLengthStart, fadeLengthEnd = null) {
		this.color = color;
		this.startTime = performance.now();
		this.length = length;
		this.fadeLengthStart = fadeLengthStart;
		if (fadeLengthEnd == null) fadeLengthEnd = fadeLengthStart;
		this.fadeLengthEnd = fadeLengthEnd;
	}
	get endTime() {
		return this.startTime + this.length;
	}
	set endTime(a) {
		this.length = a - this.startTime;
	}
	stopIn(ms) {
		if (performance.now() <= this.endTime) this.length = performance.now() + ms - this.startTime;
	}
	getColor() {
		let relStart = 0;
		let relEnd = 1;
		let relTime = (performance.now() - this.startTime) / this.length;
		let relOffsetS = this.fadeLengthStart / this.length;
		let relOffsetE = this.fadeLengthEnd / this.length;
		let op;
		if (relTime < 0 || relTime > 1) op = 0;
		else if (relTime < relOffsetS + relStart) {
			op = relTime / relOffsetS;
		} else if (relTime > relEnd - relOffsetE) {
			op = 1 - (relTime - (relEnd - relOffsetE)) / relOffsetE;
		} else op = 1;
		return new Color(this.color.red, this.color.green, this.color.blue, this.color.alpha * op);
	}
}