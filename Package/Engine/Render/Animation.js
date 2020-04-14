class Animation {
	constructor(src = "", frames = 1, delay = 0, loop = false, finResponse = e => e) {
		this.stopped = false;
		if (!Array.isArray(src)) {
			this.frameCount = frames;
			this.frames = [];
			for (let i = 0; i < frames; i++) {
				this.frames.push(new Image);
				this.frames[i].src = "../Art/Animations/" + src + "/" + (i + 1) + ".png";
			}
			this.img = this.frames[0];
			this.loop = loop;
			this.finResponse = finResponse;
			this.delay = delay;
		} else {
			this.frames = src;
			this.frameCount = this.frames.length;
			this.delay = frames;
			this.loop = delay;
			this.finResponse = loop || function () { }
		}
		this.timer = 0;
		this.maxTime = this.frames.length * this.delay;
	}
	set onload(fn) {
		fn();
	}
	advance() {
		if (!this.stopped) {
			this.timer++;
			if (this.timer >= this.maxTime - 1) {
				this.timer = this.loop ? 0 : this.maxTime - 1;
				this.finResponse();
			}
			let index = Math.floor(this.timer / this.delay);
			this.img = this.frames[index];
		}
	}
	stop() {
		this.stoppped = true;
	}
	start() {
		this.stopped = false;
	}
	reset() {
		this.timer = -1;
		this.advance();
	}
}