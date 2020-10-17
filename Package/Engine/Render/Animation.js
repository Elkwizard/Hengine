class Animation {
	constructor(src = "", frames = 1, delay = 0, loop = false, finResponse = () => null) {
		this.stopped = false;
		if (!Array.isArray(src)) {
			this.frameCount = frames;
			this.frames = [];
			for (let i = 0; i < frames; i++) {
				this.frames.push(new Frame());
				this.frames[i].src = src + "/" + (i + 1) + ".png";
			}
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
		this.img = this.frames[0];
		this.timer = 0;
		this.totalTime = this.frames.length * this.delay;
	}
	fromImage(frame, imgWidth, imgHeight, delay = 0, loop = true, finResponse = () => null) {
		const frames = frame.width / imgWidth;
		const frameImgs = [];
		for (let i = 0; i < frames; i++) {
			const img = new Frame(imgWidth, imgHeight);
			img.renderer.c.drawImage(img, i * imgWidth, 0, imgWidth, imgHeight, 0, 0, imgWidth, imgHeight);
			frameImgs.push(img);
		}
		let anim = new Animation(frameImgs, delay, loop, finResponse);
	}
	set onload(fn) {
		fn();
	}
	advance() {
		if (!this.stopped) {
			this.timer++;
			if (this.timer >= this.totalTime - 1) {
				this.timer = this.loop ? 0 : this.totalTime - 1;
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
	static copy(anim) {
		let a = new Animation(anim.frames, anim.delay, anim.loop, anim.finResponse);
		return a;
	}
}