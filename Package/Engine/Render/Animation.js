class Animation extends ImageType {
	constructor(src = "", frames = 1, delay = 0, loops = false, onEnd = () => null) {
		super(1, 1);
		this.stopped = false;
		let promise;
		if (!Array.isArray(src)) {
			this.frameCount = frames;
			this.frames = [];

			for (let i = 0; i < frames; i++) {
				this.frames.push(new HImage(`${src}/${i + 1}.png`));
			}
			this.loops = loops;
			this.onEnd = onEnd;
			this.delay = delay;
			promise = Promise.all(this.frames.map(frame => new Promise(resolve => {
				frame.image.addEventListener("load", () => resolve(frame));
			})));
		} else {
			this.frames = src;
			this.frameCount = this.frames.length;
			this.delay = frames;
			this.loops = delay;
			this.onEnd = loops || function () { }
			promise = Promise.resolve(this.frames);
		}
		this.image = this.frames[0];
		this.timer = 0;
		this.totalTime = this.frames.length * this.delay;
		promise.then(this.forceLoad.bind(this));
	}
	forceLoad() {
		this.width = this.image.width;
		this.height = this.image.height;
	}
	advance() {
		if (!this.stopped) {
			this.timer++;
			if (this.timer >= this.totalTime - 1) {
				this.timer = this.loops ? 0 : this.totalTime - 1;
				this.onEnd();
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
	get(animation = new Animation([], 0, false, () => null)) {
		animation.frames = this.frames;
		animation.delay = this.delay;
		animation.loops = this.loops;
		animation.onEnd = this.onEnd;
		return animation;
	}
	static fromImage(frame, imgWidth, imgHeight, delay = 0, loops = true, onEnd = () => null) {
		const frames = frame.width / imgWidth;
		const frameImg = frame.makeImage();
		const frameImgs = [];
		for (let i = 0; i < frames; i++) {
			const img = new Frame(imgWidth, imgHeight);
			img.renderer.c.drawImage(frameImg, i * imgWidth, 0, imgWidth, imgHeight, 0, 0, imgWidth, imgHeight);
			frameImgs.push(img);
		}
		return new Animation(frameImgs, delay, loops, onEnd);
	}
}