class InputHandler {
	constructor() {
		this.keys = new Map();
		this.keyDownCounts = new Map();
		this.keyUpCounts = new Map();
		this.totalCount = 0;
		this.keysToDeactivate = new Set();
		this.keysToActivate = new Set();
	}
	get allPressed() {
		const result = [];
		for (let [key, pressed] of this.keys) if (pressed) result.push(key);
		return result;
	}
	get allReleased() {
		const result = [];
		for (let [key, pressed] of this.keys) if (!pressed) result.push(key);
		return result;
	}
	get allJustPressed() {
		const result = [];
		for (let [key, count] of this.keyDownCounts) if (count === 1) result.push(key);
		return result;
	}
	get allJustReleased() {
		const result = [];
		for (let [key, count] of this.keyUpCounts) if (count === 1) result.push(key);
		return result;
	}
	activateKey(key) {
		this.keysToActivate.add(key);
	}
	deactivateKey(key) {
		this.keysToDeactivate.add(key);
	}
	pressLength(key) {
		return this.keyDownCounts.get(key) ?? 0;
	}
	releaseLength(key) {
		return this.keyUpCounts.get(key) ?? this.totalCount;
	}
	pressed(keys) {
		if (Array.isArray(keys)) {
			for (let i = 0; i < keys.length; i++) {
				const key = keys[i];
				if (this.keys.get(key)) return true;
			}
			return false;
		}
		return !!this.keys.get(keys);
	}
	released(keys) {
		if (Array.isArray(keys)) {
			for (let i = 0; i < keys.length; i++) {
				const key = keys[i];
				if (!this.keys.get(key)) return true;
			}
			return false;
		}
		return !this.keys.get(keys);
	}
	justPressed(keys) {
		if (Array.isArray(keys)) {
			for (let i = 0; i < keys.length; i++) {
				const key = keys[i];
				if (this.keyDownCounts.get(key) === 1) return true;
			}
			return false;
		}
		return this.keyDownCounts.get(keys) === 1;
	}
	justReleased(keys) {
		if (Array.isArray(keys)) {
			for (let i = 0; i < keys.length; i++) {
				const key = keys[i];
				if (this.keyUpCounts.get(key) === 1) return true;
			}
			return false;
		}
		return this.keyUpCounts.get(keys) === 1;
	}
	update() {
		// activate keys
		for (const key of this.keysToActivate)
			this.keys.set(key, true);
		this.keysToActivate.clear();

		this.totalCount++;
		for (const [key, pressed] of this.keys) {
			if (!this.keyDownCounts.has(key)) this.keyDownCounts.set(key, 0);
			if (pressed) {
				this.keyDownCounts.set(key, this.keyDownCounts.get(key) + 1);
				this.keyUpCounts.set(key, 0);
			} else {
				this.keyUpCounts.set(key, this.keyUpCounts.get(key) + 1);
				this.keyDownCounts.set(key, 0);
			}
		}
	}
	afterUpdate() {
		// deactivate keys
		for (const key of this.keysToDeactivate) {
			if (this.keys.get(key) || !this.keysToActivate.has(key)) {
				this.keys.set(key, false);
				this.keysToDeactivate.delete(key);
			}
		}
	}
}
class KeyboardHandler extends InputHandler {
	constructor() {
		super();
		this.downQueue = [];
		this.upQueue = [];
		document.addEventListener("keydown", e => {
			if (e.key === "Tab") e.preventDefault();
			const sig = this.getKeySignature(e.key);
			this.activateKey(sig);
			this.downQueue.push(new KeyboardHandler.Event(sig, e.key));
		});
		document.addEventListener("keyup", e => {
			const sig = this.getKeySignature(e.key);
			this.deactivateKey(sig);
			this.upQueue.push(new KeyboardHandler.Event(sig, e.key));
		});
		document.body.onblur = () => {
			for (const [key, value] of this.keys) this.deactivateKey(key);
		};
	}
	afterUpdate() {
		super.afterUpdate();
		this.downQueue = [];
		this.upQueue = [];
	}
	getKeySignature(key) {
		return (key.length === 1) ? key.toLowerCase() : key;
	}
}
KeyboardHandler.Event = class {
	constructor(key, text) {
		this.key = key;
		this.text = text;
	}
}
class MouseHandler extends InputHandler {
	constructor(root, engine) {
		super();
		this.mouseMap = ["Left", "Middle", "Right"];
		this.button = "Left";
		this.downQueue = [];
		this.moveQueue = [];
		this.upQueue = [];
		this.wheelDelta = 0;
		
		// Screen
		Vector2.defineReference(this, "screen", Vector2.origin);
		Vector2.defineReference(this, "screenLast", Vector2.origin);
		Vector2.defineReference(this, "screenDragStart", Vector2.origin);
		Vector2.defineReference(this, "screenDragEnd", Vector2.origin);
		
		// World
		Vector2.defineReference(this, "world", Vector2.origin);
		Vector2.defineReference(this, "worldLast", Vector2.origin);
		Vector2.defineReference(this, "worldDragStart", Vector2.origin);
		Vector2.defineReference(this, "worldDragEnd", Vector2.origin);
	
		this.engine = engine;
		this.addListenersTo(root);
	}
	get pageLocation() {
		const bound = this.engine.canvas.canvas.getBoundingClientRect();
		const scale = this.engine.canvas.width / bound.width;
		return this.screen.over(scale).plus(new Vector2(bound.x, bound.y));
	}
	addListenersTo(el) {
		this.listenerRoot = el;
		const handleDown = e => {
			this.button = this.mouseMap[e.button];
			this.updatePosition(e);

			// dragging
			this.worldDragStart = this.engine.scene.camera.screenSpaceToWorldSpace(this.screen);
			this.worldDragEnd = this.worldDragStart.get();
			this.screenDragStart = this.screen.get();
			this.screenDragEnd = this.screenDragStart.get();

			this.activateKey(this.button);
			this.downQueue.push(new MouseHandler.Event(this.button, new Vector2(e.x, e.y)));
		};
		const handleMove = e => {
			this.updatePosition(e);
			
			// dragging
			if (this.pressed(["Left", "Middle", "Right"])) {
				this.worldDragEnd = this.engine.scene.camera.screenSpaceToWorldSpace(this.screen);
				this.screenDragEnd = this.screen.get();
			}

			this.moveQueue.push(new MouseHandler.Event(this.button, new Vector2(e.x, e.y)));
		};
		const handleUp = e => {
			this.updatePosition(e);
			
			// dragging
			this.worldDragEnd = this.engine.scene.camera.screenSpaceToWorldSpace(this.screen);
			this.screenDragEnd = this.screen.get();
			
			for (const [key, value] of this.keys) this.deactivateKey(key);
			this.upQueue.push(new MouseHandler.Event(this.button, new Vector2(e.x, e.y)));
		};

		//pointers and touch
		const handle = e => {
			if (e.type === "down") handleDown(e);
			if (e.type === "up") handleUp(e);
			if (e.type === "move") handleMove(e);
		};
		const mouseHandle = e => {
			if (e.type === "mouseout") handle({
				x: this.pageLocation.x,
				y: this.pageLocation.y,
				button: 0,
				type: "up"
			});
			else handle({
				x: e.x,
				y: e.y,
				button: e.button,
				type: e.type.slice(5)
			});
		};
		const touchHandle = e => {
			e.preventDefault();
			let p = e.targetTouches[0];
			if (!p) handle({
				x: this.pageLocation.x,
				y: this.pageLocation.y,
				button: 0,
				type: "up"
			});
			else {
				let type = { start: "down", end: "up", move: "move" }[e.type.slice(5)];
				handle({
					x: p.pageX,
					y: p.pageY,
					button: 0,
					type
				});
				if (type === "down") {
					this.screenLast = this.screen.get();
					this.worldLast = this.world.get();
				}
			}
		};

		el.addEventListener("mousedown", mouseHandle);
		el.addEventListener("mousemove", mouseHandle);
		el.addEventListener("mouseup", mouseHandle);
		el.addEventListener("mouseout", mouseHandle);
		el.addEventListener("touchstart", touchHandle);
		el.addEventListener("touchmove", touchHandle);
		el.addEventListener("touchend", touchHandle);
		el.addEventListener("touchcancel", touchHandle);

		// non positional listeners
		this.rightClickListener = e => {
			e.preventDefault();
			handleDown(e);
		};
		el.addEventListener("contextmenu", this.rightClickListener);
		el.addEventListener("wheel", e => {
			if (e.deltaY < 0) this.keys.set("WheelUp", true);
			else if (e.deltaY > 0) this.keys.set("WheelDown", true);
			this.wheelDelta += e.deltaY;
		});
	}
	afterUpdate() {
		super.afterUpdate();
		this.screenLast = this.screen.get();
		this.downQueue = [];
		this.moveQueue = [];
		this.upQueue = [];
		this.keys.set("WheelUp", false);
		this.keys.set("WheelDown", false);
		this.wheelDelta = 0;
	}
	update() {
		super.update();
		this.world = this.engine.scene.camera.screenSpaceToWorldSpace(this.screen);
		this.worldLast = this.engine.scene.camera.screenSpaceToWorldSpace(this.screenLast);
	}
	updatePosition(e) {
		this.screen = this.engine.canvas.screenSpaceToCanvasSpace(Vector2.fromPoint(e));
	}
	allowSave() {
		if (this.listenerRoot) this.listenerRoot.removeEventListener("contextmenu", this.rightClickListener);
	}
}
MouseHandler.Event = class {
	constructor(button, location) {
		this.button = button;
		this.location = location;
	}
}
class TouchState {
	constructor(handler) {
		this.handler = handler;
		this.engine = handler.engine;
		this.active = false;

		this.targetState = null;

		this.everActive = false;

		// Screen
		Vector2.defineReference(this, "screen", Vector2.origin);
		Vector2.defineReference(this, "screenLast", Vector2.origin);
		Vector2.defineReference(this, "screenDragStart", Vector2.origin);
		Vector2.defineReference(this, "screenDragEnd", Vector2.origin);
		
		// World
		Vector2.defineReference(this, "world", Vector2.origin);
		Vector2.defineReference(this, "worldLast", Vector2.origin);
		Vector2.defineReference(this, "worldDragStart", Vector2.origin);
		Vector2.defineReference(this, "worldDragEnd", Vector2.origin);
	}
	pressed() {
		return this.active;
	}
	released() {
		return !this.active;
	}
	justPressed() {
		return this.downCount === 1;
	}
	justReleased() {
		return this.everActive && this.upCount === 1;
	}
	pressLength() {
		return this.downCount;
	}
	releasedLength() {
		return this.everActive ? this.upCount : this.handler.totalCount;
	}
	updateState(x, y, targetState) {
		if (targetState !== null) this.targetState = targetState;

		// valid location
		const location = this.engine.canvas.screenSpaceToCanvasSpace(new Vector2(x, y));
		const canvasBounds = new Rect(0, 0, this.engine.canvas.width, this.engine.canvas.height);
		if (!Geometry.pointInsideRect(location, canvasBounds)) return;
		
		this.screen = location;
		if (targetState !== false) {
			if (targetState === true) {
				this.screenLast = this.screen;
				this.screenDragStart = this.screen;
				this.worldDragStart = this.engine.scene.camera.screenSpaceToWorldSpace(this.screen);
			}
			this.screenDragEnd = this.screen;
			this.worldDragEnd = this.engine.scene.camera.screenSpaceToWorldSpace(this.screen);
		}
	}
	update() {
		if (this.targetState === true) {
			this.targetState = null;
			this.active = true;
		}
		this.world = this.engine.scene.camera.screenSpaceToWorldSpace(this.screen);
		this.worldLast = this.engine.scene.camera.screenSpaceToWorldSpace(this.screenLast);

		if (this.active) {
			this.everActive = true;
			this.upCount = 0;
			this.downCount++;
		} else {
			this.downCount = 0;
			this.upCount++;
		}
	}
	afterUpdate() {
		if (this.targetState === false) {
			this.targetState = null;
			this.active = false;
		}
		this.screenLast = this.screen.get();
	}
}
class TouchHandler {
	constructor(root, engine) {
		this.engine = engine;

		this.addListenersTo(root);

		return new Proxy(this, {
			get(object, key) {
				if (typeof key === "symbol") return object[key];
				const index = parseInt(key);
				if (index + "" !== key) return object[key];
				return object.touches[index] ?? (object.touches[index] = new TouchState(object));
			}
		});
	}
	get active() {
		return this.touches.filter(touch => touch.active);
	}
	get length() {
		return this.touches.length;
	}
	*[Symbol.iterator]() {
		yield* this.touches;
	}
	addListenersTo(element) {
		this.listenerRoot = element;
		this.totalCount = 0;

		this.touches = [];
		this.maxTouches = navigator.maxTouchPoints;

		this.touchIndices = new Map();
		this.firstFree = 0;

		const touchStart = e => {
			e.preventDefault();
			this.updateTouches(e.changedTouches, true);
		};
		const touchMove = e => {
			e.preventDefault();
			this.updateTouches(e.changedTouches, null);
		};
		const touchEnd = e => {
			if (e.cancelable) e.preventDefault();
			this.updateTouches(e.changedTouches, false);
		};
		element.addEventListener("touchstart", touchStart, { passive: false });
		element.addEventListener("touchmove", touchMove, { passive: false });
		element.addEventListener("touchend", touchEnd, { passive: false });
		element.addEventListener("touchcancel", touchEnd, { passive: false });
	}
	updateTouches(touches, targetState) {
		for (let i = 0; i < touches.length; i++) {
			const { clientX, clientY, identifier } = touches[i];

			if (targetState === true && !this.touchIndices.has(identifier)) {
				this.touchIndices.set(identifier, this.firstFree);
				let j = this.firstFree + 1;
				for (; j < this.touches.length; j++)
					if (!this.touches[j].pressed) break;
				this.firstFree = j;
			}
			
			const index = this.touchIndices.get(identifier);
			if (index >= this.touches.length)
				this.touches[index] = new TouchState(this);
			const touch = this.touches[index];
			touch.updateState(clientX, clientY, targetState);
			
			if (targetState === false) {
				this.touchIndices.delete(identifier);
				if (identifier < this.firstFree) this.firstFree = identifier;
			}
		}
	}
	update() {
		this.totalCount++;
		for (let i = 0; i < this.touches.length; i++) this.touches[i].update();
	}
	afterUpdate() {
		for (let i = 0; i < this.touches.length; i++) this.touches[i].afterUpdate();
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