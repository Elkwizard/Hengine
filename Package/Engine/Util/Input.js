class InputHandler {
	constructor(engine) {
		this.engine = engine;
		this.totalCount = 0;
		this.states = new Map();
		document.addEventListener("visibilitychange", () => {
			if (document.visibilityState === "hidden")
				this.targetAll(false);
		});
		this.addListeners();
	}
	get length() {
		return this.states.size;
	}
	get all() {
		return Array.from(this.states.keys());
	}
	addListeners() {

	}
	preprocess(name) {
		return name;
	}
	get(name) {
		name = this.preprocess(name);
		if (!this.states.has(name))
			this.states.set(name, new this.constructor.State(this, name));
		return this.states.get(name);
	}
	set(name, key, value) {
		const state = this.get(name);
		state[key] = value;
		return state;
	}
	target(name, state) {
		return this.set(name, "targetState", state);
	}
	checkAll(state) {
		const result = [];
		for (const [name, obj] of this.states) {
			const value = obj[state];
			if (value === !!value) {
				if (value) result.push(name);
			} else return;
		}
		return result;
	}
	check(arg, state, signal = InputHandler.or) {
		if (Array.isArray(arg)) {
			let acc;
			for (let i = 0; i < arg.length; i++) {
				const value = this.get(arg[i])[state];
				if (value === signal) return signal;
				if (value !== !!value) {
					acc = [value];
					break;
				}
			}
			if (acc !== undefined) {
				for (let i = 1; i < arg.length; i++) {
					const value = this.get(arg[i])[state];
					acc.push(value);
				}
				return acc;
			}
			return !signal;
		} else return this.get(arg)[state];
	}
	targetAll(target) {
		for (const [_, state] of this.states) state.targetState = target;
	}
	beforeUpdate() {
		this.totalCount++;
		for (const [_, state] of this.states) state.beforeUpdate();
	}
	afterUpdate() {
		for (const [_, state] of this.states) state.afterUpdate();
	}
	static addChecks(keys = []) {
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			this.prototype[key] = function (arg, signal) {
				return this.check(arg, key, signal);
			};
			if (key.indexOf("Length") > -1) continue;
			Object.defineProperty(this.prototype, "all" + key.capitalize(), {
				get() {
					return this.checkAll(key);
				}
			});
		};
	}
}
InputHandler.or = true;
InputHandler.and = false;

InputHandler.State = class State {
	constructor(handler, name) {
		this.handler = handler;
		this.name = name;

		this.turnOff = false;
		this.turnOn = false;

		this.pressed = false;
		this.downCount = 0;
		this.upCount = 0;

		this._targetState = false;
	}
	set targetState(a) {
		if (a === null) return;
		this._targetState = a;
		if (a) {
			this.turnOn = true;
			this.turnOff = false;
		} else
			this.turnOff = true;
	}
	get targetState() {
		return this._targetState;
	}
	set pressed(a) {
		this._pressed = a;
		this.everPressed ||= a;
	}
	get pressed() {
		return this._pressed;
	}
	get released() {
		return !this.pressed;
	}
	get justPressed() {
		return this.downCount === 1;
	}
	get justReleased() {
		return this.everPressed && this.upCount === 1;
	}
	get pressLength() {
		return this.downCount;
	}
	get releaseLength() {
		return this.everPressed ? this.upCount : this.handler.totalCount;
	}
	beforeUpdate() {
		if (this.turnOn) {
			this.turnOn = false;
			this.pressed = true;
		}

		if (this.pressed) {
			this.downCount++;
			this.upCount = 0;
		} else {
			this.upCount++;
			this.downCount = 0;
		}
	}
	afterUpdate() {
		if (this.turnOff) {
			this.turnOff = false;
			this.pressed = false;
		}
	}
};

{
	const checks = [];
	const descs = Object.getOwnPropertyDescriptors(InputHandler.State.prototype);
	for (const key in descs)
		if ("get" in descs[key]) checks.push(key);
	InputHandler.addChecks(checks);
};

class KeyboardHandler extends InputHandler {
	constructor(engine) {
		super(engine);
		this.downQueue = [];
	}
	preprocess(name) {
		name += "";
		return (name.length === 1) ? name.toLowerCase() : name;
	}
	addListeners() {
		document.body.onblur = () => this.targetAll(false);
		document.addEventListener("keydown", event => {
			// don't cancel fancy keyboard shortcuts
			if (!event.ctrlKey && !(event.key[0] === "F" && event.key.length > 1))
				event.preventDefault();
			this.target(event.key, true);
			this.downQueue.push(event.key);
		});
		document.addEventListener("keyup", event => void this.target(event.key, false));
	}
	afterUpdate() {
		super.afterUpdate();
		this.downQueue = [];
	}
}

KeyboardHandler.State = class KeyState extends InputHandler.State { };

class MouseHandler extends InputHandler {
	constructor(engine) {
		super(engine);
		this.mouseMap = new Map([
			[0, "Left"],
			[1, "Middle"],
			[2, "Right"]
		]);

		this.wheelDelta = 0;
		Vector2.defineReference(this, "screen", Vector2.origin);
		Vector2.defineReference(this, "screenLast", Vector2.origin);
		Vector2.defineReference(this, "world", Vector2.origin);
		Vector2.defineReference(this, "worldLast", Vector2.origin);
	}
	preprocess(name) {
		if (typeof name === "number") return this.mouseMap.get(name);
		return name;
	}
	addListeners() {
		const handleDown = event => {
			const state = this.target(event.button, true);
			const pos = this.getEventPosition(event);
			if (pos) {
				state.screenDragStart = pos;
				state.screenDragEnd = pos;
				const wpos = this.getWorldPosition(pos);
				state.worldDragStart = wpos;
				state.worldDragEnd = wpos;

				this.screen = pos;
				this.screenLast = pos;
			}
		};
		const handleMove = event => {
			const pos = this.getEventPosition(event);
			if (pos) {
				this.screen = pos;

				const wpos = this.getWorldPosition(pos);
				for (const [_, state] of this.states) {
					if (state.pressed) {
						state.screenDragEnd = pos;
						state.worldDragEnd = wpos;
					}
				}
			}
		};
		const handleUp = event => {
			this.target(event.button, false);
			const pos = this.getEventPosition(event);
			if (pos) this.screen = pos;
		};

		function ifPrimary(handle) {
			return event => {
				if (event.isPrimary) handle(event);
			};
		}

		document.addEventListener("mousedown", handleDown);
		document.addEventListener("mousemove", handleMove);
		document.addEventListener("mouseup", handleUp);

		document.addEventListener("pointerdown", ifPrimary(handleDown));
		document.addEventListener("pointermove", ifPrimary(handleMove));
		document.addEventListener("pointerup", ifPrimary(handleUp));

		document.addEventListener("mouseout", () => this.targetAll(false));
		document.addEventListener("contextmenu", event => event.preventDefault());
		document.addEventListener("wheel", event => {
			this.wheelDelta += event.deltaY;
		});
	}
	getWorldPosition(point) {
		return this.engine.scene.camera.screenSpaceToWorldSpace(point);
	}
	getEventPosition(event) {
		const location = this.engine.canvas.screenSpaceToCanvasSpace(
			new Vector2(event.clientX, event.clientY)
		);
		return this.engine.canvas.contains(location) ? location : null;
	}
	beforeUpdate() {
		super.beforeUpdate();
		this.world = this.getWorldPosition(this.screen);
		this.worldLast = this.getWorldPosition(this.screenLast);
	}
	afterUpdate() {
		super.afterUpdate();

		// post frame
		this.screenLast = this.screen;
		this.wheelDelta = 0;
	}
}

MouseHandler.State = class ButtonState extends InputHandler.State {
	constructor(handler, name) {
		super(handler, name);

		Vector2.defineReference(this, "screenDragStart", Vector2.origin);
		Vector2.defineReference(this, "screenDragEnd", Vector2.origin);
		Vector2.defineReference(this, "worldDragStart", Vector2.origin);
		Vector2.defineReference(this, "worldDragEnd", Vector2.origin);
	}
};

MouseHandler.addChecks([
	"screenDragStart",
	"screenDragEnd",
	"worldDragStart",
	"worldDragEnd"
]);

class TouchHandler extends InputHandler {
	constructor(engine) {
		super(engine);
		this.count = 0;
		this.maxTouches = navigator.maxTouchPoints;
		this.touchIndices = new Map();
		this.firstFree = 0;
	}
	addListeners() {
		const addHandler = (eventName, target) => {
			document.addEventListener(eventName, event => {
				if (eventName !== "pointerdown" && event.cancelable) event.preventDefault();
				this.updateTouch(event, target);
			}, { passive: false });
		};

		addHandler("touchstart", true);
		addHandler("touchmove", null);
		addHandler("touchend", false);
		
		addHandler("pointerdown", true);
		addHandler("pointermove", null);
		addHandler("pointerup", false);
	}
	getWorldPosition(point) {
		return this.engine.scene.camera.screenSpaceToWorldSpace(point);
	}
	getEventPosition(event) {
		const location = this.engine.canvas.screenSpaceToCanvasSpace(
			new Vector2(event.clientX, event.clientY)
		);
		return this.engine.canvas.contains(location) ? location : null;
	}
	updateTouch(event, targetState) {
		const { pointerId } = event;
		if (pointerId === undefined) return;

		if (targetState === true) {
			this.touchIndices.set(pointerId, this.firstFree);
			const states = [...this.states.values()];
			while (states[++this.firstFree]?.targetState);
		}

		const index = this.touchIndices.get(pointerId);
		const touch = this.get(index);
		touch.targetState = targetState;

		if (targetState === false) {
			if (index < this.firstFree) this.firstFree = index;
			this.touchIndices.delete(pointerId);
		} else {
			const location = this.getEventPosition(event);
			if (location) {
				touch.screen = location;
				if (targetState === true) {
					touch.screenLast = touch.screen;
					touch.screenDragStart = touch.screen;
					touch.worldDragStart = this.getWorldPosition(touch.screen);
				}
				touch.screenDragEnd = touch.screen;
				touch.worldDragEnd = this.getWorldPosition(touch.screen);
			}
		}
	}
}

TouchHandler.State = class TouchState extends MouseHandler.State {
	constructor(handler, name) {
		super(handler, name);

		Vector2.defineReference(this, "screen", Vector2.origin);
		Vector2.defineReference(this, "screenLast", Vector2.origin);
		Vector2.defineReference(this, "world", Vector2.origin);
		Vector2.defineReference(this, "worldLast", Vector2.origin);
	}
	beforeUpdate() {
		super.beforeUpdate();
		this.world = this.handler.getWorldPosition(this.screen);
		this.worldLast = this.handler.getWorldPosition(this.screenLast);
	}
	afterUpdate() {
		super.afterUpdate();
		this.screenLast = this.screen;
	}
};

TouchHandler.addChecks([
	"screen", "screenLast",
	"world", "worldLast",
	"screenDragStart",
	"screenDragEnd",
	"worldDragStart",
	"worldDragEnd"
]);

class ClipboardHandler {
	constructor() {
		this.data = "";
		document.body.addEventListener("paste", event => {
			this.data = event.clipboardData.getData("text/plain");
		});
	}
	write(value) {
		if (value instanceof ImageType) {
			const canvas = new_OffscreenCanvas(value.width, value.height);
			canvas
				.getContext("2d")
				.drawImage(value.makeImage(), 0, 0, value.width, value.height);
			
			canvas.toBlob(blob => {
				navigator.clipboard.write([
					new ClipboardItem({
						"image/png": blob
					})
				]);
			});
		} else
			navigator.clipboard.writeText(value);
	}
	read() {
		return this.data;
	}
}