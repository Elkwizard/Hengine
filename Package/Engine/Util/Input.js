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
	pressLength(key) {
		return this.keyDownCounts[key];
	}
	releaseLength(key) {
		return this.keyUpCounts[key];
	}
	pressed(keys) {
		return (Array.isArray(keys) ? keys : [keys]).map(key => !!this.keys[key]).includes(true);
	}
	released(keys) {
		return (Array.isArray(keys) ? keys : [keys]).map(key => !this.keys[key]).includes(true);
	}
	justPressed(keys) {
		return (Array.isArray(keys) ? keys : [keys]).map(key => this.keyDownCounts[key] === 1 && this.keyUpCounts[key] === 0).includes(true);
	}
	justReleased(keys) {
		return (Array.isArray(keys) ? keys : [keys]).map(key => this.keyUpCounts[key] === 1).includes(true);
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
	afterUpdate() { 
		
	}
}
class KeyboardHandler extends InputHandler {
	constructor() {
		super();
		this.onDown = new Listener();
		this.onUp = new Listener();
		this.downQueue = [];
		this.upQueue = [];
		let k = this;
		document.addEventListener("keydown", function (e) {
			if (e.key === "Tab") e.preventDefault();
			let sig = k.getKeySignature(e.key);
			k.keys[sig] = true;
			for (let ev of k.onDown) ev(sig);
			k.downQueue.push(new KeyboardHandler.Event(sig, e.key));
		});
		document.addEventListener("keyup", function (e) {
			let sig = k.getKeySignature(e.key);
			k.keys[sig] = false;
			for (let ev of k.onUp) ev(sig);
			k.upQueue.push(new KeyboardHandler.Event(sig, e.key));
		});
	}
	afterUpdate() {
		super.afterUpdate();
		this.downQueue = [];
		this.upQueue = [];
	}
	getKeySignature(key) {
		return (key.length === 1) ? key.toLowerCase() : key;
	}
	clearListeners() {
		this.onDown.clear();
		this.onUp.clear();
	}
}
KeyboardHandler.Event = class {
	constructor(key, text) {
		this.key = key;
		this.text = text;
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
		this.downQueue = [];
		this.moveQueue = [];
		this.upQueue = [];
		//Screen
		Vector2.defineReference(this, "screen", Vector2.origin);
		Vector2.defineReference(this, "screenLast", Vector2.origin);
		Vector2.defineReference(this, "screenDragStart", Vector2.origin);
		Vector2.defineReference(this, "screenDragEnd", Vector2.origin);
		//World
		Vector2.defineReference(this, "world", Vector2.origin);
		Vector2.defineReference(this, "worldLast", Vector2.origin);
		Vector2.defineReference(this, "worldDragStart", Vector2.origin);
		Vector2.defineReference(this, "worldDragEnd", Vector2.origin);
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
			let sig = m.mouseMap[e.button];
			m.keys[sig] = true;
			for (let ev of m.onDown) ev(sig);
			m.downQueue.push(new MouseHandler.Event(sig, new Vector2(e.x, e.y)));
		}
		function handleMove(e) {
			m.updatePosition(e);
			if (m.pressed("Left", "Middle", "Right")) {
				m.worldDragEnd = m.engine.scene.camera.screenSpaceToWorldSpace(m.screen);
				m.screenDragEnd = m.screen.get();
			}
			let sig = m.mouseMap[m.button];
			for (let ev of m.onMove) ev(sig);
			m.moveQueue.push(new MouseHandler.Event(sig, new Vector2(e.x, e.y)));	
		};
		function handleUp(e) {
			m.updatePosition(e);
			m.worldDragEnd = m.engine.scene.camera.screenSpaceToWorldSpace(m.screen);
			m.screenDragEnd = m.screen.get();
			for (let inx of m.mouseMap) m.keys[inx] = false;
			let sig = m.mouseMap[m.button];
			for (let ev of m.onUp) ev(sig);
			m.upQueue.push(new MouseHandler.Event(sig, new Vector2(e.x, e.y)));
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
		super.afterUpdate();
		this.screenLast = this.screen.get();
		this.downQueue = [];
		this.moveQueue = [];
		this.upQueue = [];
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
MouseHandler.Event = class {
	constructor(button, location) {
		this.button = button;
		this.location = location;
	}
}
class ClipboardHandler {
	constructor() {
		this.data = "";
		document.body.addEventListener("paste", e => {
			this.data = e.clipboardData.getData("text/plain");
		});
	}
	write(value) {
		navigator.clipboard.writeText(value);
	}
	read() {
		return this.data;
	}
}