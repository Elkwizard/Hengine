/**
 * A wrapper for operations that happen over time or after a time.
 * These can generally be created by methods of Intervals.
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
 * @prop<static, immutable> Symbol BEFORE_UPDATE | This symbol indicates that the operation should take place before the screen is cleared
 * @prop<static, immutable> Symbol UPDATE | This symbol indicates that the operation should take place immediately before the main engine update
 * @prop<static, immutable> Symbol AFTER_UPDATE | This symbol indicates that the operation should take place immediately after the main engine update
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
	
	static BEFORE_UPDATE = Symbol("BEFORE_UPDATE");
	static UPDATE = Symbol("UPDATE");
	static AFTER_UPDATE = Symbol("AFTER_UPDATE");
}

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
 * Stores a moving average over a sequence of numeric samples.
 * Samples can be added at any time, and current average can be retrieved for no cost.
 * @prop<immutable> Number average | The current average value. This will be 0 if no samples have been provided
 */
class MovingAverage {
	/**
	 * Creates a new moving average.
	 * @param Number samples? | The number of samples (window size) of the average. Default is 10
	 */
	constructor(sampleCount = 10) {
		this.maxSamples = sampleCount;
		this.clear();
	}
	/**
	 * Returns the value of the most recent sample.
	 * The behavior is undefined if no samples have been added.
	 * @return Number
	 */
	get last() {
		return this.samples[(this.nextSampleIndex + this.samples.length - 1) % this.samples.length];
	}
	/**
	 * Clears the content of the averaging window, resetting the object.
	 */
	clear() {
		this.samples = [];
		this.nextSampleIndex = 0;
		this.average = 0;
	}
	/**
	 * Adds a new sample value. Returns the new average
	 * @param Number sample | The sample to add to the average
	 * @return Number 
	 */
	add(sample) {
		let sum = this.average * this.samples.length;

		if (this.samples.length === this.maxSamples)
			sum -= this.samples[this.nextSampleIndex];
		
		sum += sample;
		this.samples[this.nextSampleIndex] = sample;

		this.nextSampleIndex = (this.nextSampleIndex + 1) % this.maxSamples;

		return this.average = sum / this.samples.length;
	}
}

/**
 * Manages the update loop of the Hengine.
 * This class is available via the `.intervals` property of both the global object and Hengine.
 * ```js
 * // display FPS data
 * intervals.continuous(() => {
 * 	renderer.image(intervals.fpsGraph).default(10, 10);
 * });
 * ```
 * @prop<immutable> Number rawFps | The FPS based only on the duration of the last frame
 * @prop Number targetFPS | The current target/maximum amount of update cycles per second
 * @prop<immutable> GraphPlane fpsGraph | A graph of the FPS for the last 400 frames
 * @prop<immutable> Number frameCount | The total number of frames that have elapsed thusfar
 * @prop Boolean performanceData | Whether or not the interval manager should collect performance data (`.fps`, `.fpsGraph`, etc.)
 */
class Intervals {
	static intervals = [];
	static inInterval = false;
	constructor(engine) {
		this.engine = engine;
		this.paused = false;
		this.functions = [];
		this.performanceData = true;
		this.frameCount = 0;
		this.fps = 60;
		this.rawFps = 60;
		this.lastTime = performance.now();
		this.averageFrameLength = new MovingAverage(Intervals.FPS_FRAMES_TO_COUNT);
		this.counters = new Map();
		this.averages = new Map();

		this.graphs = [];
		this.fpsGraph = this.makeGraphPlane([
			new Graph("FPS", () => this.averageFps, 0, 60, Color.LIME, 1)
		], 400);
	}
	get averageFps() {
		return 1000 / this.averageFrameLength.average;
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
		return Number.clamp(Math.round(this.averageFps), 0, this.targetFPS);
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
		Intervals.intervals.push(() => {
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

		for (const key of this.counters.keys())
			this.counters.set(key, 0);

		let now = performance.now();
		this.averageFrameLength.add(now - this.lastTime);
		this.lastTime = now;
	}
	/**
	 * Returns the current value of the moving average with a given name.
	 * @param String key | The name of the moving average
	 * @return Number
	 */
	getAverage(key) {
		return this.averages.get(key)?.average ?? 0;
	}
	/**
	 * Adds a sample value to a given moving average.
	 * If no moving average exists with the given name, a new one will be created with the given window size.
	 * @param String key | The name of the moving average
	 * @param Number value | The new sample for the moving average
	 * @param Number samples? | The window size of the moving average. This will only be used if the key is new. Default is 10
	 */
	average(key, value, samples = 10) {
		if (!this.averages.has(key))
			this.averages.set(key, new MovingAverage(samples));
		this.averages.get(key).add(value);
	}
	/**
	 * Returns the amount of times `.count()` has been called with the given key in the last frame.
	 * @param String key | The name of the counter
	 * @return Number
	 */
	getCount(key) {
		return this.counters.get(key) ?? 0;
	}
	/**
	 * Increments a counter with a given name.
	 * If no counter exists with the given name, a new one will be created prior to incrementing.
	 * @param String key | The name of the counter
	 * @param Number amount? | The amount to increment the counter by. Default is 1
	 */
	count(key, amount = 1) {
		this.counters.set(key, (this.counters.get(key) ?? 0) + amount);
	}
	update() {
		this.updatePerformanceData();

		//input is necessary
		this.engine.keyboard.beforeUpdate();
		this.engine.mouse.beforeUpdate();
		this.engine.touches.beforeUpdate();
		this.engine.controllers.beforeUpdate();
		if (!this.paused) {
			this.updateGraphs();
			this.updateIntervalCalls(IntervalFunction.BEFORE_UPDATE);
			this.engine.canvas.startRendering();
			this.updateIntervalCalls(IntervalFunction.UPDATE);
			this.engine.scene.engineUpdate();
			this.updateIntervalCalls(IntervalFunction.AFTER_UPDATE);
			this.engine.scene.updateCaches();
			this.engine.scene.updatePreviousData();
			this.engine.canvas.endRendering();
		}
		this.engine.keyboard.afterUpdate();
		this.engine.mouse.afterUpdate();
		this.engine.touches.afterUpdate();
		this.engine.controllers.afterUpdate();
		
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
	 * @param (Number) => void fn | The function to be executed every frame. This function will be passed the number of frames since it started being called
	 * @param Symbol type? | When during the update cycle to execute the function. Default is `IntervalFunction.AFTER_UPDATE`
	 */
	continuous(fn, type = IntervalFunction.AFTER_UPDATE) {
		this.functions.push(new ContinuousFunction(fn, type));
	}
	/**
	 * Creates a new TransitionFunction. Returns a promise that resolves when the transition completes.
	 * @param (Number) => void fn | The function to execute over the duration. This function will be passed the completion proportion
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
	 * @param Operable finalValue | The value to animate to
	 * @param Number duration | The duration of the animation
	 * @param (Number) => Number curve? | The easing function. Default is `Interpolation.linear`
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
	static start() {
		Intervals.requestTick(function animate() {
			Intervals.tick();
			Intervals.requestTick(animate);
		});
	}
	static tick() {
		Intervals.inInterval = true;
		try {
			for (let i = 0; i < Intervals.intervals.length; i++)
				Intervals.intervals[i]();
		} catch (err) {
			if (err instanceof ExitError) {
				err.print();
			} else {
				throw err;
			}
		}
		Intervals.inInterval = false;
	}
	static exit(...msg) {
		Intervals.intervals = [];
		const error = new ExitError(msg);

		if (Intervals.inInterval) {
			throw error;
		} else {
			error.print();
			throw "";
		}
	}
	
	static FPS_FRAMES_TO_COUNT = 30;
}

class ExitError {
	constructor(message) {
		this.message = message;
	}
	print() {
		console.warn("EXITED", ...this.message);
	}
}

/**
 * Instantly crashes the engine and logs something to the console.
 * @param Any[] ...messages | Data to be logged
 */
function exit(...msg) {
	Intervals.exit(...msg);
}

Intervals.requestTick = requestAnimationFrame.bind(window);
Intervals.start();