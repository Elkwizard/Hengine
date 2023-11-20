/**
 * Represents a frame-by-frame animation.
 * These should be loaded using HengineAnimationResource and should not be constructed directly.
 * For the purposes of the animation, a frame elapses each time the animation is drawn.
 * ```js
 * const catKnead = loadResource("catKnead"); // load the Animation
 * 
 * intervals.continuous(() => {
 * 	renderer.image(catKnead).default(0, 0); // the animation will advance
 * });
 * ```
 * @prop ImageType[] frames | The images that make up the animation
 * @prop Boolean autoAdvance | Whether or not the animation will advance to the next frame when drawn. Starts as true
 * @prop Boolean loops | Whether or not the animation will reset to the beginning after completing
 * @prop Number delay | The number of frames each animation frame will be visible for
 * @prop Number timer | The current progress (in frames) of the animation
 * @prop Number totalTime | The total amount of frames it will take the animation to complete
 * @prop () => void onEnd | A function to be called when the animation completes (this will be called even if the animation loops)
 */
class Animation extends ImageType {
	constructor(src = "", frames = 1, delay = 0, loops = false, onEnd = () => null) {
		super(1, 1);
		this.stopped = false;
		this.autoAdvance = true;
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
	/**
	 * Returns whether or not the animation has completed.
	 * If the animation loops, this will always return false.
	 * @return Boolean
	 */
	get done() {
		return !this.loops && this.timer === this.totalTime - 1;
	}
	/**
	 * Creates a copy of the animation and optionally stores it in a provided destination.
	 * @param Animation destination? | The destination to copy the animation into.
	 * @return Animation
	 */
	get() {
		return new Animation(this.frames, this.delay, this.loops, this.onEnd);
	}
	forceLoad() {
		this.width = this.image.width;
		this.height = this.image.height;
	}
	/**
	 * Advances the animation by one update cycle.
	 */
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
	/**
	 * Pauses playback of the animation.
	 */
	stop() {
		this.stopped = true;
	}
	/**
	 * Resumes playback of the animation.
	 */
	start() {
		this.stopped = false;
	}
	/**
	 * Restarts the animation. 
	 */
	reset() {
		this.timer = -1;
		this.advance();
	}
	makeImage() {
		if (this.autoAdvance) this.advance();
		return this.image.image;
	}
	/**
	 * Creates a new animation based on a horizontal sprite sheet containing the frames directly next to each other.
	 * @param ImageType spritesheet | The image containing all the frames
	 * @param Number imgWidth | The width (in pixels) of each frame
	 * @param Number imgHeight | The height (in pixels) of each frame
	 * @param Number delay | The amount of frames each animation frame is visible for
	 * @param Boolean loops? | Whether or not the animation loops. Default is true 
	 * @param () => void onEnd? | A function to execute when the animation completes. Default is a no-op
	 * @return Animation
	 */
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

/**
 * Represents a collection of animations that play at different times.
 * This is modelled using a collection of states (which can be of any type(s)), that can have different associated animations.
 * This also allows for transition animations between states.
 */
class AnimationStateMachine extends ImageType {
	/**
	 * Creates a new AnimationStateMachine.
	 * @param Map stateAnimations | The Animations corresponding to each state.
	 * @param Any initialState | The initial state
	 */
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
	/**
	 * Adds an animation to be played when transitioning between two specified states.
	 * @param Any initial | The state being transitioned from 
	 * @param Any final | The state being transitioned to
	 * @param Animation animation | The animation to play during this time. `.loops` must be false
	 */
	addTransition(a, b, animation) {
		if (!this.transitions.has(a))
			this.transitions.set(a, new Map());
		this.transitions.get(a).set(b, animation);
	}
	/**
	 * Returns the current state of the state machine.
	 * @return Any
	 */
	get state() {
		return this.stateStack.last;
	}
	/**
	 * Sets the state of the state machine.
	 * If the specified state's animation doesn't loop, then the state will revert back after the animation completes.
	 * @param Any state | The new state of the state machine
	 */
	set state(state) {
		if (state !== this.state) {
			if (
				this.transitions.has(this.state) &&
				this.transitions.get(this.state).has(state)
			) {
				this.transition = this.transitions.get(this.state).get(state);
				this.transition.reset();
			}

			const animation = this.stateAnimations.get(state);
			if (animation.loops)
				this.stateStack = [state];
			else {
				animation.reset();
				this.stateStack.push(state);
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