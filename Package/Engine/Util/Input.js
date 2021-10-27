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
			} else result.push(value);
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
			Object.defineProperty(this.prototype, key, {
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

		this.targetState = null;

		this.pressed = false;
		this.downCount = 0;
		this.upCount = 0;
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
		if (this.targetState === true) {
			this.pressed = true;
			this.targetState = null;
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
		if (this.targetState === false) {
			this.pressed = false;
			this.targetState = null;
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
	}
	preprocess(name) {
		name += "";
		return (name.length === 1) ? name.toLowerCase() : name;
	}
	addListeners() {
		document.body.onblur = () => void this.targetAll(false);
		document.addEventListener("keydown", event => void this.target(event.key, true));
		document.addEventListener("keyup", event => void this.target(event.key, false));
	}
}

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
		document.addEventListener("mousedown", event => {
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
		});
		document.addEventListener("mousemove", event => {
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
		});
		document.addEventListener("mouseup", event => {
			this.target(event.button, false);
			const pos = this.getEventPosition(event);
			if (pos) this.screen = pos;
		});
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
		this.maxTouches = navigator.maxTouchPoints;
		this.touchIndices = new Map();
		this.firstFree = 0;
	}
	addListeners() {
		document.addEventListener("touchstart", event => {
			event.preventDefault();
			this.updateTouches(event.changedTouches, true);
		}, { passive: false });

		document.addEventListener("touchmove", event => {
			event.preventDefault();
			this.updateTouches(event.changedTouches, null);
		}, { passive: false });
		
		document.addEventListener("touchend", event => {
			if (event.cancelable) event.preventDefault();
			this.updateTouches(event.changedTouches, false);
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
			
			const touch = this.get(index);
			touch.targetState = targetState;
			touch.screen = this.getEventPosition(touches[i]);
			
			if (targetState === false) {
				this.touchIndices.delete(identifier);
				if (identifier < this.firstFree) this.firstFree = identifier;
			} else {
				if (targetState === true) {
					touch.screenLast = touch.screen;
					touch.screenDragStart = touch.screen;
					touch.worldDragStart = touch.getWorldPosition(touch.screen);
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
		this.world = this.handler.getWorldPosition(this.screen);
		this.worldLast = this.handler.getWorldPosition(this.screenLast);
	}
	afterUpdate() {
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
		navigator.clipboard.writeText(value);
	}
	read() {
		return this.data;
	}
}