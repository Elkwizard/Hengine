class Listener {
	constructor() {
		this.methods = [];
		this[Symbol.iterator] = function* () {
			for (let i = 0; i < this.methods.length; i++) {
				yield this.methods[i];
			}
		}
	}
	clear() {
		this.methods = this.methods.filter(m => m.required);
	}
	listen(fn, required = false) {
		fn.required = required;
		this.methods.push(fn);
	}
}
class InputHandler {
	constructor() {
		this.keys = { };
		this.keyDownCounts = { };
		this.keyUpCounts = { };
	}
	//lengthy
	justPressed(...keys) {
		return this.JP(...keys);
	}
	justReleased(...keys) {
		return this.JR(...keys);
	}
	pressed(...keys) {
		return this.P(...keys);
	}
	released(...keys) {
		return this.R(...keys);
	}
	pressLength(key) {
		return this.PL(key);
	}
	releaseLength(key) {
		return this.RL(key);
	}
	//small
	PL(key) {
		return this.keyDownCounts[key];
	}
	RL(key) {
		return this.keyUpCounts[key];
	}
	P(...keys) {
		return keys.map(key => !!this.keys[key]).includes(true);
	}
	R(...keys) {
		return keys.map(key => !this.keys[key]).includes(true);
	}
	JP(...keys) {
		return keys.map(key => this.keyDownCounts[key] === 1).includes(true);
	}
	JR(...keys) {
		return keys.map(key => this.keyUpCounts[key] === 1).includes(true);
	}
	update() {
		for (let key in this.keys) {
			if (this.keyDownCounts[key] === undefined) this.keyDownCounts[key] = 0;
			if (this.keyUpCounts[key] === undefined) this.keyUpCounts[key] = 2;
			if (this.keys[key]) this.keyDownCounts[key]++;
			else this.keyDownCounts[key] = 0;
			if (!this.keys[key]) this.keyUpCounts[key]++;
			else this.keyUpCounts[key] = 0;
		}
	}
	afterUpdate() { }
}
class KeyboardHandler extends InputHandler {
	constructor() {
		super();
		this.onDown = new Listener();
		this.onUp = new Listener();
		let k = this;
		document.addEventListener("keydown", function (e) {
			for (let ev of k.onDown) ev(e);
			k.keys[e.key] = true;
		});
		document.addEventListener("keyup", function (e) {
			if (e.key.toUpperCase() === e.key) {
				k.keys[e.key.toLowerCase()] = false;
			}
			k.keys[e.key] = false;
			for (let ev of k.onUp) ev(e);
		});
	}
	clearListeners() {
		this.onDown.clear();
		this.onUp.clear();
	}
}
class MouseHandler extends InputHandler {
	constructor(engine, root) {
		super();
		this.keys = {
			"Left": false,
			"Middle": false,
			"Right": false
		};
		this.mouseMap = ["Left", "Middle", "Right"];
		this.button = 0;
		//Screen
		this.screen = Vector2.origin;
		this.screenLast = Vector2.origin;
		this.screenDragStart = Vector2.origin;
		this.screenDragEnd = Vector2.origin;
		//World
		this.world = Vector2.origin;
		this.worldLast = Vector2.origin;
		this.worldDragStart = Vector2.origin;
		this.worldDragEnd = Vector2.origin;
		//Listeners
		this.onDown = new Listener();
		this.onUp = new Listener();
		this.onClick = new Listener();
		this.onRight = new Listener();
		this.onScroll = new Listener();
		this.onMove = new Listener();
		this.engine = engine;
		this.listenerRoot = root;
		this.addListenersTo(this.listenerRoot);
	}
	addListenersTo(el) {
		let m = this;
		this.listenerRoot = el;
		el.addEventListener("click", function (e) {
			m.updatePosition(e, "click");
			for (let ev of m.onClick) ev(e);
		});
		function handleDown(e) {
			m.button = e.button;
			m.updatePosition(e);
			m.worldDragStart = m.engine.scene.camera.screenSpaceToWorldSpace(m.screen);
			m.worldDragEnd = m.worldDragStart.get();
			m.screenDragStart = m.screen.get();
			m.screenDragEnd = m.screenDragStart.get();
			m.keys[m.mouseMap[e.button]] = true;
			for (let ev of m.onDown) ev(e);
		}
		function handleMove(e) {
			m.updatePosition(e);
			if (m.P("Left", "Middle", "Right")) {
				m.worldDragEnd = m.engine.scene.camera.screenSpaceToWorldSpace(m.screen);
				m.screenDragEnd = m.screen.get();
			}
			for (let ev of m.onMove) ev(e);
		};
		function handleUp(e) {
			m.updatePosition(e);
			m.worldDragEnd = m.engine.scene.camera.screenSpaceToWorldSpace(m.screen);
			m.screenDragEnd = m.screen.get();
			for (let inx of m.mouseMap) m.keys[inx] = false;
			for (let ev of m.onUp) ev(e);
		};

		//pointers and touch

		function mouseHandle(e) {
			if (e.type === "mouseout") handle({
				x: m.screen.x,
				y: m.screen.y,
				button: 0,
				type: "up"
			});
			else handle({
				x: e.x,
				y: e.y,
				button: e.button,
				type: e.type.slice(5)
			});
		}
		function touchHandle(e) {
			e.preventDefault();
			let p = e.targetTouches[0];
			if (!p) handle({
				x: m.screen.x, 
				y: m.screen.y,
				button: 0,
				type: "up"
			});
			else handle({
				x: p.pageX,
				y: p.pageY,
				button: 0,
				type: { start: "down", end: "up", move: "move" }[e.type.slice(5)]
			});
		}
		function handle(e) {
			if (e.type === "down") handleDown(e);
			if (e.type === "up") handleUp(e);
			if (e.type === "move") handleMove(e);
		}
		el.addEventListener("mousedown", mouseHandle);
		el.addEventListener("mousemove", mouseHandle);
		el.addEventListener("mouseup", mouseHandle);
		el.addEventListener("mouseout", mouseHandle);
		el.addEventListener("touchstart", touchHandle);
		el.addEventListener("touchmove", touchHandle);
		el.addEventListener("touchend", touchHandle);
		el.addEventListener("touchcancel", touchHandle);

		//end

		this.__right__ = function (e) {
			m.button = e.button;
			e.preventDefault();
			m.updatePosition(e, "right");
			for (let ev of m.onRight) ev(e);
		}
		el.addEventListener("contextmenu", this.__right__);
		el.addEventListener("wheel", function (e) {
			m.button = e.button;
			for (let ev of m.onScroll) ev(e.deltaY);
		});
	}
	afterUpdate() {
		this.screenLast = this.screen.get();
	}
	update() {
		super.update();
		this.world = this.engine.scene.camera.screenSpaceToWorldSpace(this.screen);
		this.worldLast = this.engine.scene.camera.screenSpaceToWorldSpace(this.screenLast);
	}
	clearListeners() {
		this.onDown.clear();
		this.onUp.clear();
		this.onMove.clear();
		this.onRight.clear();
		this.onScroll.clear();
		this.onClick.clear();
	}
	updatePosition(e) {
		try {
			let bound = this.engine.renderer.canvas.getBoundingClientRect();
			this.screen.x = e.x - bound.x;
			this.screen.y = e.y - bound.y;
		} catch (e) {
			this.screen.x = e.x;
			this.screen.y = e.y;
		}
	}
	allowSave() {
		if (this.listenerRoot) this.listenerRoot.removeEventListener("contextmenu", this.__right__);
	}
}