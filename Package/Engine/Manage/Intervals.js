class IntervalFunction {
	constructor(fn, len, type) {
		this.fn = fn;
		this.type = type;
		this.interval = len;
		this.timer = 0;
		this.done = false;
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
		if (this.timer === this.interval) {
			this.fn();
		}
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

		IntervalManager.intervals.push(this.update.bind(this));
	}
	update() {
		this.frameCount++;
		if (this.performanceData) {
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
			this.fps = Math.floor(Number.clamp(this.averageFps, 0, 60));
		}
		//input is necessary
		this.engine.keyboard.update();
		this.engine.mouse.update();
		if (!this.paused) {
			this.engine.renderer.beforeFrame();
			this.updateGraphs();
			this.updateIntervalCalls(IntervalFunction.BEFORE_UPDATE);
			this.engine.canvas.clearScreen();
			this.updateIntervalCalls(IntervalFunction.UPDATE)
			this.engine.scene.engineUpdate();
			this.updateIntervalCalls(IntervalFunction.AFTER_UPDATE);
			this.engine.keyboard.afterUpdate();
			this.engine.scene.updateCaches();
			this.engine.scene.updatePreviousData();
		}
		this.engine.mouse.afterUpdate();
		this.engine.renderer.afterFrame();
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
	}
	transition(fn, frames, type = IntervalFunction.BEFORE_UPDATE) {
		this.functions.push(new TransitionFunction(fn, frames, type));
	}
	animate(object, property, value, time, curve = Interpolation.linear, type = IntervalFunction.BEFORE_UPDATE) {
		let start = object[property].get();
		this.transition(t => {
			object[property] = Interpolation.lerp(start, value, curve(t));
		}, time, type);
	}
	delay(fn, frames, type = IntervalFunction.BEFORE_UPDATE) {
		this.functions.push(new DelayedFunction(fn, frames, type));
	}
	waitUntil(fn, event, type = IntervalFunction.BEFORE_UPDATE) {
		this.functions.push(new WaitUntilFunction(fn, event, type));
	}
	updateIntervalCalls(type) {
		let remaining = [];
		for (let i = 0; i < this.functions.length; i++) {
			const int_fn = this.functions[i];
			if (int_fn.type === type) {
				int_fn.increment();
			}
			if (!int_fn.done) remaining.push(int_fn);
		}
		this.functions = remaining;
	}
}
IntervalManager.FPS_FRAMES_TO_COUNT = 30;
(function () {
	IntervalManager.intervals = [];
	function animate(now) {
		requestAnimationFrame(animate);
		for (let i = 0; i < IntervalManager.intervals.length; i++) {
			IntervalManager.intervals[i]();
		}
	}
	requestAnimationFrame(animate);
})();