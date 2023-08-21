class Animation extends ImageType {
	constructor(src = "", frames = 1, delay = 0, loops = false, onEnd = () => null) {
		super(1, 1);
		this.stopped = false;
		if (!Array.isArray(src)) {
			this.frameCount = frames;
			this.frames = [];

			for (let i = 0; i < frames; i++) {
				this.frames.push(new HImage(`${src}/${i + 1}.png`));
			}
			this.loops = loops;
			this.onEnd = onEnd;
			this.delay = delay;
			Promise.all(this.frames.map(frame => new Promise(resolve => {
				frame.image.addEventListener("load", () => resolve(frame));
			}))).then(() => this.forceLoad());
		} else {
			this.frames = src;
			this.frameCount = this.frames.length;
			this.delay = frames;
			this.loops = delay;
			this.onEnd = loops || function () { };
		}
		this.image = this.frames[0];
		this.timer = 0;
		this.totalTime = this.frames.length * this.delay;
		this.forceLoad();
	}
	get done() {
		return !this.loops && this.timer === this.totalTime - 1;
	}
	get() {
		return new Animation(this.frames, this.delay, this.loops, this.onEnd);
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
			const index = Math.floor(this.timer / this.delay);
			this.image = this.frames[index];
			this.width = this.image.width;
			this.height = this.image.height;
		}
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
	makeImage() {
		this.advance();
		return this.image.image;
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

class AnimationStateMachine extends ImageType {
	constructor(stateAnimations, initialState) {
		super(
			stateAnimations.get(initialState).width,
			stateAnimations.get(initialState).height,
			stateAnimations.get(initialState).pixelRatio,
		);
		this.stateAnimations = stateAnimations;
		this.transitions = new Map();
		this.transition = null;
		this.stateStack = [initialState];
	}
	addTransition(a, b, animation) {
		if (!this.transitions.has(a))
			this.transitions.set(a, new Map());
		this.transitions.get(a).set(b, animation);
	}
	get state() {
		return this.stateStack.last;
	}
	set state(state) {
		if (state !== this.state) {
			const animation = this.stateAnimations.get(state);
			if (animation.loops)
				this.stateStack = [state];
			else {
				animation.reset();
				this.stateStack.push(state);
			}
			
			if (
				this.transitions.has(this.state) &&
				this.transitions.get(this.state).has(state)
			) {
				this.transition = this.transitions.get(this.state).get(state);
				this.transition.reset();
			}
		}
	}
	makeImage() {
		if (this.transition) {
			const image = this.transition.makeImage();
			if (this.transition.done)
				this.transition = null;
			return image;
		}

		const animation = this.stateAnimations.get(this.state);
		const image = animation.makeImage();
		if (animation.done) this.stateStack.pop();
		
		return image;
	}
}