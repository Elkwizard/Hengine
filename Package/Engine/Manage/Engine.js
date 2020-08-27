function P(x = 0, y = 0) {
	return { x, y };
}
class ScreenRecording {
	constructor(name) {
		this.name = name;
		this.frames = [];
		this.isRecording = false;
	}
	start() {
		this.isRecording = true;
	}
	stop() {
		this.isRecording = false;
	}
	getAnimation() {
		if (!this.frames.length) return null;
		return c.createAnimation(this.frames, 1, true);
	}
}
class IntervalFunction {
	constructor(fn, len, type) {
		this.fn = fn;
		this.type = type;
		this.interval = len;
		this.timer = 0;
		this.done = false;
	}
	increment() {
		this.timer++;
		this.respond();
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
IntervalFunction.FIXED_UPDATE = Symbol("FIXED_UPDATE");
IntervalFunction.AFTER_FIXED_UPDATE = Symbol("AFTER_FIXED_UPDATE");

class DelayedFunction extends IntervalFunction {
	constructor(fn, wait, type) {
		super(fn, wait, type);
	}
	respond() {
		if (this.timer > this.interval) {
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
class Engine {
	constructor(utility, wrapper = document.body) {
		this.fps = 60;
		this.fpsContinuous = 0;
		this.lastTime = performance.now();
		this.currentTime = performance.now();
		this.frameLengths = [];
		this.frameLength = 0;
		this.frameCount = 0;
		
		
		this.paused = false;
		this.output = function (m) {
			alert(m);
		}
		this.console = new Console();
		this.update = function () { };
		this.beforeUpdate = function () { };
		this.afterUpdate = function () { };
		this.fixedUpdate = function () { };
        this.afterFixedUpdate = function () { };
		this.catchErrors = false;
		this.hasFixedPhysicsUpdateCycle = true;
		try {
			if (FunctionLibrary) {
				this.f = new FunctionLibrary();
			}
		} catch (e) { }

		//setup canvas and scene
		let canvas;
		let bound = wrapper.getClientRects()[0];
		let W = bound.width;
		let H = bound.height;
		if (wrapper === document.body) {
			W = innerWidth;
			H = innerHeight;
		}
		let wrp = document.body;
		if (!utility) {
			canvas = document.createElement("canvas");
			canvas.id = "Engine Canvas";
			wrapper.appendChild(canvas);
			this.wrapper = wrapper;
			wrp = canvas;
		} else {
			this.wrapper = document.body;
			canvas = new OffscreenCanvas(1, 1);
		}

		this.mouse = new MouseHandler(this, wrp);
		this.keyboard = new KeyboardHandler();

		this.renderer = new Artist(canvas, W, H);
		this.scene = new Scene("Engine Scene", this.renderer, new Vector2(0, 0.2), this);
		//update loops
		this.afterScript = new Script("after");
		this.fixedScript = new Script("fixed");
		this.beforeScript = new Script("before");
		this.updateScript = new Script("update");
		this.intervalFns = [];

		this.FPS_FRAMES_TO_COUNT = 10;
				
		window.intervals.push(this.engineFixedUpdate.bind(this));
		window.animationFrames.push(this.engineDrawUpdate.bind(this));

		this.resize = true;
		window.addEventListener("resize", function () {
			if (this.resize) {
				let pixelate = this.renderer.c.imageSmoothingEnabled;
				let bound = this.wrapper.getClientRects()[0];
				if (this.wrapper === document.body) {
					bound = {
						width: innerWidth,
						height: innerHeight
					};
				}
				this.renderer.canvas.width = bound.width - 1;
				this.renderer.canvas.height = bound.height - 1;
				this.renderer.c.imageSmoothingEnabled = pixelate;
			}
		}.bind(this));
		this.recordings = {};

		let grh = true;
		try { Graph; } catch (e) { grh = false; };
		this.hasGraphs = grh;
		if (this.hasGraphs) {
			this.graphs = [];
			this.fpsGraph = this.makeGraph("FPS", 0, 60, e => Math.floor(this.fpsContinuous), 2000, [
				{
					limit: 50,
					color: "lime"
				},
				{
					limit: 30,
					color: "yellow"
				},
				{
					limit: 15,
					color: "orange"
				},
				{
					color: "red"
				}
			]);
		}
	}
	engineFixedUpdateInternal() {
		this.updateIntervalCalls(IntervalFunction.FIXED_UPDATE);
		this.fixedUpdate();
		this.fixedScript.run();
		this.scene.engineFixedUpdate();
		this.afterFixedUpdate();
		this.updateIntervalCalls(IntervalFunction.AFTER_FIXED_UPDATE);
	}
	engineDrawUpdate() {
		try {
			this.frameCount++;
			this.currentTime = performance.now();
			//fps
			this.frameLength = this.currentTime - this.lastTime;
			this.lastTime = this.currentTime;
			this.frameLengths.push(this.frameLength);
			if (this.frameLengths.length > this.FPS_FRAMES_TO_COUNT) {
				this.frameLengths.shift();
				let val = this.frameLengths.reduce((p, c) => p + c) / this.FPS_FRAMES_TO_COUNT;
				this.fpsContinuous = 1000 / val;
			}
			this.updateGraphs();
			if (Math.abs(this.fpsContinuous - this.fps) > 5 && Math.abs(this.fpsContinuous - this.fps) < 40) this.fps = Math.min(60, Math.floor(this.fpsContinuous));
			//update
			if (!this.paused) {
				K.update();
				M.update();
				this.updateIntervalCalls(IntervalFunction.BEFORE_UPDATE);
				this.beforeUpdate();
				this.clear();
				this.updateIntervalCalls(IntervalFunction.UPDATE);
				this.update();
				this.scene.engineDrawUpdate();
				if (!this.hasFixedPhysicsUpdateCycle) this.engineFixedUpdateInternal();
				this.updateIntervalCalls(IntervalFunction.AFTER_UPDATE);
				this.afterUpdate();
				this.updateScreenRecordings();
				K.afterUpdate();
				M.afterUpdate();
			}
		} catch (e) {
			if (this.catchErrors) this.output("Draw Error: " + e);
			else throw e;
		}
	}
	engineFixedUpdate() {
		try {
			if (this.hasFixedPhysicsUpdateCycle) if (!this.paused) this.engineFixedUpdateInternal();
		} catch (e) {
			if (this.catchErrors) this.output("Fixed Update Error: " + e);
			else throw e;
		}
	}
	set HFPUC(a) {
		this.hasFixedPhysicsUpdateCycle = a;
	}
	get HFPUC() {
		return this.hasFixedPhysicsUpdateCycle;
	}
	createScreenRecording(name) {
		this.recordings[name] = new ScreenRecording(name);
		return this.recordings[name];
	}
	updateScreenRecordings() {
		let f;
		for (let key in this.recordings) {
			if (!f) f = this.renderer.contentToFrame();
			let r = this.recordings[key];
			if (r.isRecording) r.frames.push(f);
		}
	}
	continuous(fn, type = IntervalFunction.AFTER_UPDATE) {
		this.intervalFns.push(new ContinuousFunction(fn, type));
	}
	transition(fn, frames, type = IntervalFunction.BEFORE_UPDATE) {
		this.intervalFns.push(new TransitionFunction(fn, frames, type));
	}
	delay(fn, frames, type = IntervalFunction.BEFORE_UPDATE) {
		this.intervalFns.push(new DelayedFunction(fn, frames, type));
	}
	updateIntervalCalls(type) {
		let remaining = [];
		for (let i = 0; i < this.intervalFns.length; i++) {
			const int_fn = this.intervalFns[i];
			if (int_fn.type === type) {
				int_fn.increment();
			}
			if (!int_fn.done) remaining.push(int_fn);
		}
		this.intervalFns = remaining;
	}
	makeGraph(yName, minValue, maxValue, getY, msLimit = 5000, colors) {
		if (this.hasGraphs) {
			let f = new Graph(yName, minValue, maxValue, getY, msLimit, colors, this);
			return f;
		}
	}
	parseGraphData(data) {
		let result = data.split(" ").map(e => {
			let split = e.split(",");
			return P(parseFloat(split[0]), parseFloat(split[1]));
		});
		result.pop();
		return result;
	}
	updateGraphs() {
		if (!this.hasGraphs) return;
		let t = performance.now();
		for (let graph of this.graphs) {
			for (let key in graph.vars) {
				let data = P(t, graph.vars[key].getY(t));
				graph.vars[key].data.push(data);
				if (graph.vars[key].data.length > graph.msLimit / 16) graph.vars[key].data.shift();
			}
			if (t > graph.msLimit) graph.timeOffset = t - graph.msLimit;
		}
	}
	getFPSGraph() {
		if (!this.hasGraphs) return;
		return this.fpsGraph.get();
	}
	end() {
		this.pause();
		this.animate = a => a;
		this.engineUpdate = a => a;
		M.clearListeners();
		K.clearListeners();
		let canvas = document.getElementById(this.renderer.canvas.id);
		if (canvas) canvas.outerHTML = "";
	}
	pause() {
		this.paused = true
	}
	play() {
		this.paused = false
	}
	clear() {
		this.renderer.clear();
	}
}