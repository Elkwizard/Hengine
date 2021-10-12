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
	respond() {

	}
}
IntervalFunction.BEFORE_UPDATE = Symbol("BEFORE_UPDATE");
IntervalFunction.UPDATE = Symbol("UPDATE");
IntervalFunction.AFTER_UPDATE = Symbol("AFTER_UPDATE");

class DelayedFunction extends IntervalFunction {
	constructor(fn, wait, type) {
		super(fn, wait, type);
	}
	respond() {
		if (this.timer === this.interval) this.fn();
	}
}
class TransitionFunction extends IntervalFunction {
	constructor(fn, wait, type) {
		super(fn, wait, type);
	}
	respond() {
		this.fn(this.timer / this.interval);
	}
}
class ContinuousFunction extends IntervalFunction {
	constructor(fn, type) {
		super(fn, Infinity, type);
	}
	respond() {
		this.fn(this.timer);
	}
}
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
	set fps(a) {
		this.targetFPS = a;
	}
	get fps() {
		return this._fps;
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
		this.engine.keyboard.update();
		this.engine.mouse.update();
		if (!this.paused) {
			this.engine.renderer.beforeFrame();
			this.updateGraphs();
			this.updateIntervalCalls(IntervalFunction.BEFORE_UPDATE);
			this.engine.canvas.clearScreen();
			this.updateIntervalCalls(IntervalFunction.UPDATE);
			this.engine.scene.engineUpdate();
			this.updateIntervalCalls(IntervalFunction.AFTER_UPDATE);
			this.engine.keyboard.afterUpdate();
			this.engine.scene.updateCaches();
			this.engine.scene.updatePreviousData();
		}
		this.engine.mouse.afterUpdate();
		this.engine.renderer.afterFrame();
		
		this.frameCount++;
	}
	makeGraphPlane(graphs, frameLimit = 400) {
		let f = new GraphPlane(graphs, frameLimit);
		this.graphs.push(f);
		return f;
	}
	updateGraphs() {
		for (let i = 0; i < this.graphs.length; i++) this.graphs[i].update();
	}
	pause() {
		this.paused = true
	}
	play() {
		this.paused = false
	}
	continuous(fn, type = IntervalFunction.AFTER_UPDATE) {
		this.functions.push(new ContinuousFunction(fn, type));
		return this.functions.last.promise;
	}
	transition(fn, frames, type = IntervalFunction.BEFORE_UPDATE) {
		this.functions.push(new TransitionFunction(fn, frames, type));
		return this.functions.last.promise;
	}
	animate(object, property, value, time, curve = Interpolation.linear, type = IntervalFunction.BEFORE_UPDATE) {
		const start = object[property].get();
		return this.transition(t => {
			object[property] = Interpolation.lerp(start, value, curve(t));
		}, time, type);
	}
	delay(fn, frames, type = IntervalFunction.BEFORE_UPDATE) {
		this.functions.push(new DelayedFunction(fn, frames, type));
		return this.functions.last.promise;
	}
	waitUntil(fn, event, type = IntervalFunction.BEFORE_UPDATE) {
		this.functions.push(new WaitUntilFunction(fn, event, type));
		return this.functions.last.promise;
	}
	updateIntervalCalls(type) {
		let remaining = [];
		for (let i = 0; i < this.functions.length; i++) {
			const fn = this.functions[i];
			if (fn.type === type) {
				fn.increment();
			}
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