function P(x = 0, y = 0) {
	return { x, y };
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
		this.catchErrors = false;
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
		this.clipboard = new ClipboardHandler();

		this.renderer = new Artist(canvas, W, H);
		this.scene = new Scene(new Vector2(0, 0.2), this);
		//update loops
		this.intervals = new IntervalFunctionManager();

		this.FPS_FRAMES_TO_COUNT = 10;

		window.animationFrames.push(this.engineUpdate.bind(this));

		this.resize = true;
		window.addEventListener("resize", function () {
			if (this.resize) {
				let pixelate = this.renderer.preservePixelart;
				let bound = this.wrapper.getClientRects()[0];
				if (this.wrapper === document.body) {
					bound = {
						width: innerWidth,
						height: innerHeight
					};
				}
				this.renderer.width = bound.width - 1;
				this.renderer.height = bound.height - 1;
				this.renderer.preservePixelart = pixelate;
			}
		}.bind(this));
		this.graphs = [];
		// this.fpsGraph = this.makeGraph("FPS", 0, 60, e => Math.floor(this.fpsContinuous), 2000, [
		// 	{
		// 		limit: 50,
		// 		color: "lime"
		// 	},
		// 	{
		// 		limit: 30,
		// 		color: "yellow"
		// 	},
		// 	{
		// 		limit: 15,
		// 		color: "orange"
		// 	},
		// 	{
		// 		color: "red"
		// 	}
		// ]);
	}
	engineUpdate() {
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
			if (Math.abs(this.fpsContinuous - this.fps) > 5) this.fps = Math.min(60, Math.floor(this.fpsContinuous));
			//update
			if (!this.paused) {
				this.keyboard.update();
				this.mouse.update();
				this.intervals.beforeUpdate();
				this.clear();
				this.intervals.update();
				this.scene.engineUpdate();
				this.intervals.afterUpdate();
				this.keyboard.afterUpdate();
				this.scene.updateCaches();
				this.scene.updatePreviousData();
				this.mouse.afterUpdate();
			}
		} catch (e) {
			if (this.catchErrors) this.output("Update Error: " + e);
			else throw e;
		}
	}
	makeGraphPlane(graphs, frameLimit) {
		let f = new GraphPlane(graphs, frameLimit);
		this.graphs.push(f);
		return f;
	}
	updateGraphs() {
		for (let i = 0; i < this.graphs.length; i++) this.graphs[i].update();
	}
	getFPSGraph() {
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