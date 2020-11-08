class Animation extends ImageType {
	constructor(src = "", frames = 1, delay = 0, loops = false, onend = () => null) {
		super(1, 1);
		this.stopped = false;
		if (!Array.isArray(src)) {
			this.frameCount = frames;
			this.frames = [];
			for (let i = 0; i < frames; i++) {
				this.frames.push(new HImage(`${src}/${i + 1}.png`));
			}
			this.loops = loops;
			this.onend = onend;
			this.delay = delay;
		} else {
			this.frames = src;
			this.frameCount = this.frames.length;
			this.delay = frames;
			this.loops = delay;
			this.onend = loops || function () { }
		}
		this.image = this.frames[0];
		this.width = this.image.width;
		this.height = this.image.height;
		this.timer = 0;
		this.totalTime = this.frames.length * this.delay;
	}
	set onload(fn) {
		fn();
	}
	advance() {
		if (!this.stopped) {
			this.timer++;
			if (this.timer >= this.totalTime - 1) {
				this.timer = this.loops ? 0 : this.totalTime - 1;
				this.onend();
			}
			let index = Math.floor(this.timer / this.delay);
			this.image = this.frames[index];
			this.width = this.image.width;
			this.height = this.image.height;
		}
	}
	makeImage() {
		this.advance();
		return this.image.image;
	}
	stop() {
		this.stopped = true;
	}
	start() {
		this.stopped = false;
	}
	reset() {
		this.timer = -1;
		this.advance();
	}
	get() {
		return new Animation(this.frames, this.delay, this.loops, this.onend);
	}
	static fromImage(frame, imgWidth, imgHeight, delay = 0, loops = true, onend = () => null) {
		const frames = frame.width / imgWidth;
		const frameImg = frame.makeImage();
		const frameImgs = [];
		for (let i = 0; i < frames; i++) {
			const img = new Frame(imgWidth, imgHeight);
			img.renderer.c.drawImage(frameImg, i * imgWidth, 0, imgWidth, imgHeight, 0, 0, imgWidth, imgHeight);
			frameImgs.push(img);
		}
		return new Animation(frameImgs, delay, loops, onend);
	}
}