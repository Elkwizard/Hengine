/**
 * A wrapper for operations that happen over time or after a time.
 * These can generally be created by methods of IntervalManager.
 * ```js
 * const transitionDone = intervals.transition(t => {
 * 	console.log("Progress: " + t);
 * }, 5);
 * 
 * transitionDone.then(() => {
 * 	console.log("The transition has completed");
 * });
 * 
 * // Progress: 0
 * // Progress: 0.2
 * // Progress: 0.4
 * // Progress: 0.6
 * // Progress: 0.8
 * // Progress: 1
 * // The transition has completed
 * ```
 * @prop Function fn | The function to call during the operation
 * @prop Symbol type | When during the update cycle the function updates
 * @prop Promise promise | A promise which resolves when the operation completes
 * @prop Boolean done | Indicates whether the operation has completed
 * @prop Number timer | The amount of frames the IntervalFunction has existed for
 * @prop Number interval | The total duration of the operation. The operation will complete after the timer exceeds this value
 * @static_prop Symbol BEFORE_UPDATE | This symbol indicates that the operation should take place before the screen is cleared
 * @static_prop Symbol UPDATE | This symbol indicates that the operation should take place immediately before the main engine update
 * @static_prop Symbol AFTER_UPDATE | This symbol indicates that the operation should take place immediately after the main engine update
 */
class IntervalFunction {
	constructor(fn, len, type) {
		this.fn = fn;
		this.type = type;
		this.interval = len;
		this.timer = 0;
		this.done = false;
		this.promise = new Promise(resolve => this.resolve = resolve);
	}
	increment() {
		this.respond();
		this.timer++;
		if (this.timer > this.interval) {
			this.done = true;
		}
	}
	respond() { }
}
IntervalFunction.BEFORE_UPDATE = Symbol("BEFORE_UPDATE");
IntervalFunction.UPDATE = Symbol("UPDATE");
IntervalFunction.AFTER_UPDATE = Symbol("AFTER_UPDATE");

/**
 * This IntervalFunction executes an operation once after a specified delay.
 */
class DelayedFunction extends IntervalFunction {
	constructor(fn, wait, type) {
		super(fn, wait, type);
	}
	respond() {
		if (this.timer === Math.round(this.interval)) this.fn();
	}
}

/**
 * This IntervalFunction executes an operation every frame over a duration and is passed a completion percentage.
 */
class TransitionFunction extends IntervalFunction {
	constructor(fn, wait, type) {
		super(fn, wait, type);
	}
	respond() {
		this.fn(this.timer / this.interval);
	}
}

/**
 * This IntervalFunction executes an operation once every frame forever.
 */
class ContinuousFunction extends IntervalFunction {
	constructor(fn, type) {
		super(fn, Infinity, type);
	}
	respond() {
		this.fn(this.timer);
	}
}

/**
 * This IntervalFunction executes an operation once after a provided condition is met.
 * After the condition is met, the WaitUntilFunction finishes.
 */
class WaitUntilFunction extends IntervalFunction {
	constructor(fn, event, type) {
		super(fn, Infinity, type);
		this.event = event;
	}
	respond() {
		if (this.event()) {
			this.fn();
			this.done = true;
		}
	}
}

/**
 * Manages the update loop of the Hengine.
 * This class is available via the `.intervals` property of the global object.
 * ```js
 * // display FPS data
 * intervals.continuous(() => {
 * 	renderer.image(intervals.fpsGraph).default(10, 10);
 * });
 * ```
 * @prop Number rawFps | The FPS based only on the duration of the last frame. This value is read-only
 * @prop GraphPlane fpsGraph | A graph of the FPS for the last 400 frames. This value is read-only
 * @prop Number frameCount | The total number of frames that have elapsed thusfar. This value is read-only
 * @prop Boolean performanceData | Whether or not the interval manager should collect performance data (`.fps`, `.fpsGraph`, etc.)
 */
class IntervalManager {
	constructor(engine) {
		this.engine = engine;
		this.paused = false;
		this.functions = [];
		this.performanceData = true;
		this.frameCount = 0;
		this.fps = 60;
		this.averageFps = 60;
		this.rawFps = 60;
		this.lastTime = performance.now();
		this.currentTime = performance.now();
		this.frameLengths = [];

		this.graphs = [];
		this.fpsGraph = this.makeGraphPlane([
			new Graph("FPS", () => this.averageFps, 0, 60, Color.LIME, 1)
		], 400);
	}
	/**
	 * Sets the target/maximum update cycles per second.
	 * @param Number fps | The new target FPS
	 */
	set fps(a) {
		this.targetFPS = a;
	}
	/**
	 * Returns the current number of update cycles per second.
	 * @return Number 
	 */
	get fps() {
		return this._fps;
	}
	set paused(a) {
		this.pauseLevel = a ? 1 : 0;
	}
	/**
	 * Returns whether or not the update loop is currently paused.
	 * @return Boolean
	 */
	get paused() {
		return this.pauseLevel > 0;
	}
	start() {
		// deal with system frame length
		let lastFrameTime = performance.now();
		let timeSinceLastFrame = 0;
		IntervalManager.intervals.push(() => {
			const targetFrameLength = 1000 / this.targetFPS;
			const now = performance.now();

			timeSinceLastFrame += now - lastFrameTime;
			lastFrameTime = now;
			
			while (timeSinceLastFrame > targetFrameLength) {
				timeSinceLastFrame -= targetFrameLength;
				this.update();
				if (performance.now() - now > targetFrameLength) break;
			}

			timeSinceLastFrame %= targetFrameLength * 2;
		});
	}
	updatePerformanceData() {
		if (!this.performanceData) return;

		this.currentTime = performance.now();
		//fps
		this.frameLengths.push(this.currentTime - this.lastTime);
		this.lastTime = this.currentTime;
		if (this.frameLengths.length > IntervalManager.FPS_FRAMES_TO_COUNT) this.frameLengths.shift();
		const getFPSRange = n => {
			let arr = this.frameLengths.slice(Math.max(0, this.frameLengths.length - n));
			return arr.length * 1000 / arr.reduce((a, b) => a + b);
		}
		this.averageFps = getFPSRange(IntervalManager.FPS_FRAMES_TO_COUNT);
		this.rawFps = getFPSRange(1);
		this._fps = Math.floor(Number.clamp(this.averageFps, 0, this.targetFPS));
	}
	update() {
		this.updatePerformanceData();

		//input is necessary
		this.engine.keyboard.beforeUpdate();
		this.engine.mouse.beforeUpdate();
		this.engine.touches.beforeUpdate();
		if (!this.paused) {
			this.engine.renderer.beforeFrame();
			this.updateGraphs();
			this.updateIntervalCalls(IntervalFunction.BEFORE_UPDATE);
			this.engine.canvas.clearScreen();
			this.updateIntervalCalls(IntervalFunction.UPDATE);
			this.engine.scene.engineUpdate();
			this.updateIntervalCalls(IntervalFunction.AFTER_UPDATE);
			this.engine.scene.updateCaches();
			this.engine.scene.updatePreviousData();
		}
		this.engine.keyboard.afterUpdate();
		this.engine.mouse.afterUpdate();
		this.engine.touches.afterUpdate();
		this.engine.renderer.afterFrame();
		
		if (!this.paused) this.frameCount++;
	}
	/**
	 * Creates a new GraphPlane.
	 * @param Graph[] graphs | The graphs to display on the plane
	 * @param Number frameLimit? | The number of frames to be graphed at once. Default is 400 
	 * @return GraphPlane 
	 */
	makeGraphPlane(graphs, frameLimit = 400) {
		let f = new GraphPlane(graphs, frameLimit);
		this.graphs.push(f);
		return f;
	}
	updateGraphs() {
		for (let i = 0; i < this.graphs.length; i++) this.graphs[i].update();
	}
	/**
	 * Stops the update loop.
	 */
	pause() {
		this.pauseLevel++;
	}
	/**
	 * Resumes the update loop if this function has been called as many times as `.pause()`.  
	 */
	play() {
		if (this.pauseLevel > 0)
			this.pauseLevel--;
	}
	/**
	 * Creates a new ContinuousFunction.
	 * @param () => void fn | The function to be executed every frame
	 * @param Symbol type? | When during the update cycle to execute the function. Default is `IntervalFunction.AFTER_UPDATE`
	 */
	continuous(fn, type = IntervalFunction.AFTER_UPDATE) {
		this.functions.push(new ContinuousFunction(fn, type));
	}
	/**
	 * Creates a new TransitionFunction. Returns a promise that resolves when the transition completes.
	 * @param Number => void fn | The function to execute over the duration. This function will be passed the completion proportion
	 * @param Number frames | The duration of the transition
	 * @param Symbol type | When during the update cycle to execute the function. Default is `IntervalFunction.BEFORE_UPDATE`
	 * @return Promise
	 */
	transition(fn, frames, type = IntervalFunction.BEFORE_UPDATE) {
		this.functions.push(new TransitionFunction(fn, frames, type));
		return this.functions.last.promise;
	}
	/**
	 * Animates the value of a Operable or Number property from its current value to another over a specified interval.
	 * Returns a promise that resolves when the animation completes.
	 * @param Object object | The object which has the animated property
	 * @param String/Symbol property | The key of the animated property
	 * @param Operable/Number finalValue | The value to animate to
	 * @param Number duration | The duration of the animation
	 * @param Number => Number curve? | The easing function. Default is `Interpolation.linear`
	 * @param Symbol type? | When during the update cycle to update the animation. Default is `IntervalFunction.BEFORE_UPDATE`
	 * @return Promise
	 */
	animate(object, property, value, time, curve = Interpolation.linear, type = IntervalFunction.BEFORE_UPDATE) {
		const start = object[property].get();
		return this.transition(t => {
			object[property] = Interpolation.lerp(start, value, curve(t));
		}, time, type);
	}
	/**
	 * Creates a new DelayedFunction.
	 * Returns a promise that resolves when the function executes.
	 * @param () => void fn | The function to execute after the delay
	 * @param Number frames | The length of the delay
	 * @param Symbol type | When during the update cycle to execute the function. Default is `IntervalFunction.BEFORE_UPDATE`
	 * @return Promise
	 */
	delay(fn, frames, type = IntervalFunction.BEFORE_UPDATE) {
		this.functions.push(new DelayedFunction(fn, frames, type));
		return this.functions.last.promise;
	}
	/**
	 * Creates a new WaitUntilFunction.
	 * Returns a promise that resolves when the function executes.
	 * @param () => void fn | The function to execute when the event occurs
	 * @param () => Boolean event | The event function. When this function returns true, the function will execute
	 * @param Symbol type | When during the update cycle to execute the function. Default is `IntervalFunction.BEFORE_UPDATE`
	 * @return Promise
	 */
	waitUntil(fn, event, type = IntervalFunction.BEFORE_UPDATE) {
		this.functions.push(new WaitUntilFunction(fn, event, type));
		return this.functions.last.promise;
	}
	updateIntervalCalls(type) {
		let remaining = [];
		for (let i = 0; i < this.functions.length; i++) {
			const fn = this.functions[i];
			if (fn.type === type)
				fn.increment();
			if (fn.done) fn.resolve();
			else remaining.push(fn);
		}
		this.functions = remaining;
	}
}

class ExitError {
	constructor(message) {
		this.message = message;
	}
}

/**
 * Instantly crashes the engine and logs something to the console.
 * @param Any[] ...messages | Data to be logged
 */
function exit(...msg) {
	IntervalManager.intervals = [];
	if (IntervalManager.inInterval) throw new ExitError(msg);
	else {
		console.warn("EXITED", ...msg);
		throw "";
	}
}

IntervalManager.FPS_FRAMES_TO_COUNT = 30;
(function () {
	IntervalManager.intervals = [];
	IntervalManager.inInterval = false;
	function animate(now) {
		requestAnimationFrame(animate);
		IntervalManager.inInterval = true;
		try {
			for (let i = 0; i < IntervalManager.intervals.length; i++)
				IntervalManager.intervals[i]();
		} catch (err) {
			if (err instanceof ExitError) console.warn("EXITED", ...err.message);
			else throw err;
		}
		IntervalManager.inInterval = false;
	}
	requestAnimationFrame(animate);
})();