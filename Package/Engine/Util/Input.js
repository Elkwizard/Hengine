/**
 * Provides an API for interacting with a key-based input device (mouse, keyboard, controller).
 * @abstract
 * @props<immutable>
 */
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
		return String(name);
	}
	/**
	 * Returns the current state of specific key.
	 * @param String name | The name of the key to check
	 * @return InputHandler.State
	 */
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
			} else return null;
		}
		return result;
	}
	check(arg, state, signal = InputHandler.OR) {
		if (Array.isArray(arg)) {
			if (signal === null) {
				const acc = [];
				for (let i = 0; i < arg.length; i++)
					acc.push(this.get(arg[i])[state]);
				return acc;
			}
			
			for (let i = 0; i < arg.length; i++)
				if (this.get(arg[i])[state] === signal)
					return signal;
			return !signal;
		} else return this.get(arg)[state];
	}
	targetAll(target) {
		for (const state of this.states.values()) state.targetState = target;
	}
	beforeUpdate() {
		this.totalCount++;
		for (const state of this.states.values()) state.beforeUpdate();
	}
	afterUpdate() {
		for (const state of this.states.values()) state.afterUpdate();
	}
	/**
	 * @group pressed, released, justPressed, justReleased
	 * Checks whether a key is in a specific state.
	 * @param String name | The name of the key to check
	 * @return Boolean
	 */
	/**
	 * @group pressLength, releaseLength
	 * Returns the specified timing statistic about a specific key.
	 * @param String name | The name of the key to check
	 * @return Number
	 */
	/**
	 * @group get allPressed, get allJustPressed, get allJustReleased
	 * Returns the names of all keys that meet the specified requirement.
	 * If no keys meet the requirement, null is returned instead.
	 * @return String[]/null
	 */
	static addChecks(keys) {
		if (Array.isArray(keys))
			keys = Object.fromEntries(keys.map(key => [key, null]));

		for (const key in keys) {
			const defaultSignal = keys[key];
			this.prototype[key] = function (arg, signal = defaultSignal) {
				return this.check(arg, key, signal);
			};
			if (key.includes("Length")) continue;
			Object.defineProperty(this.prototype, "all" + key.capitalize(), {
				get() {
					return this.checkAll(key);
				}
			});
		};
	}
	
	/**
	 * Converts a collection of InputHandler.States into a single state which represents the union of all involved keys.
	 * For example, if one were to call `InputHandler.merge(keyboard.get("a"), keyboard.get("LeftArrow"))`, the resulting state would permanently provide information about a theoretical key which is pressed when either "a" or "LeftArrow" are pressed.
	 * The returned state doesn't have either of the `.*Length` properties.
	 * @param InputHandler.State[] states | The states to OR together. Must contain at least one element
	 * @return InputHandler.State
	 */
	static merge(states) {
		return new InputHandler.MergedState(states);
	}

	static OR = true;
	static AND = false;
}
InputHandler.addChecks({
	pressed: InputHandler.OR,
	justPressed: InputHandler.OR,
	released: InputHandler.AND,
	justReleased: InputHandler.AND,
	pressLength: null,
	releaseLength: null
});

/**
 * @name class InputHandler.State
 * Represents the current state of a key on an input device.
 * @abstract
 * @props<immutable>
 * @prop InputHandler handler | The handler associated with the input device.
 * @prop String name | The name of the associated key.
 */
InputHandler.State = class State {
	constructor(handler, name) {
		this.handler = handler;
		this.name = name;

		this.turnOff = false;
		this.turnOn = false;

		this.pressed = false;
		this.everPressed = false;
		this.downCount = 0;
		this.upCount = 0;

		this._targetState = false;
	}
	set targetState(a) {
		if (a === null) return;
		this._targetState = a;
		if (a) {
			this.turnOff = false;
			this.turnOn ||= !this.pressed;
		} else {
			this.turnOff ||= this.turnOn || this.pressed;
		}
	}
	get targetState() {
		return this._targetState;
	}
	set pressed(a) {
		this._pressed = a;
		this.everPressed ||= a;
	}
	/**
	 * Returns whether the key is currently pressed.
	 * @return Boolean
	 */
	get pressed() {
		return this._pressed;
	}
	/**
	 * Returns whether the key is not currently pressed.
	 * @return Boolean
	 */
	get released() {
		return !this.pressed;
	}
	/**
	 * Returns whether the key became pressed within the last frame.
	 * @return Boolean
	 */
	get justPressed() {
		return this.pressed && this.downCount === 1;
	}
	/**
	 * Returns whether the key stopped being pressed within the last frame.
	 * @return Boolean
	 */
	get justReleased() {
		return this.everPressed && this.released && this.upCount === 1;
	}
	/**
	 * Returns the duration of the most recent press of the key.
	 * If the key is currently pressed, this returns the time since the key was pressed.
	 * @return Number
	 */
	get pressLength() {
		return this.downCount;
	}
	/**
	 * Returns the duration of the most recent period in which the key was released.
	 * If the key is not currently pressed, this returns the time since the key was released.
	 * @return Number
	 */
	get releaseLength() {
		return this.everPressed ? this.upCount : this.handler.totalCount;
	}
	beforeUpdate() {
		if (this.turnOn) {
			this.turnOn = false;
			this.pressed = true;
			this.downCount = 0;
		}

		if (this.turnOff && this.downCount) {
			this.pressed = false;
			this.turnOff = false;
			this.upCount = 0;
		}

		if (this.pressed) this.downCount++;
		else this.upCount++;
	}
	afterUpdate() {
		if (this.turnOff) {
			this.turnOff = false;
			this.pressed = false;
			this.upCount = 0;
		}
	}
};

InputHandler.MergedState = class MergedState extends InputHandler.State {
	constructor(states) {
		super(states[0].handler, states.map(state => state.name).join("/"));
		this.states = states;
	}
	set pressed(_) { }
	get pressed() {
		return this.states.reduce((a, b) => a || b.pressed, false);
	}
	get justPressed() {
		let success = false;

		for (let i = 0; i < this.states.length; i++) {
			const state = this.states[i];
			if (state.justPressed) {
				success = true;
			} else if (state.pressed) {
				return false;
			}
		}

		return success;
	}
	get justReleased() {
		let success = false;

		for (let i = 0; i < this.states.length; i++) {
			const state = this.states[i];
			if (state.justReleased) {
				success = true;
			} else if (state.released) {
				return false;
			}
		}

		return success;
	}
};

/**
 * Represents the API for interacting with the user's keyboard.
 * The names of letter keys should always be lowercase, and the names of special keys are same as the identifiers used for <a href="https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values">KeyboardEvent.key</a>.
 * This class is available via the `.keyboard` property of both the global object and Hengine.
 * ```js
 * intervals.continuous(() => { // change circle color based on whether the space bar is pressed
 * 	const color = keyboard.pressed(" ") ? new Color("red") : new Color("blue");
 * 	renderer.draw(color).circle(width / 2, height / 2, 50);
 * });
 * ```
 * @prop String[] downQueue | A list of all the key presses that began in the last frame. Unlike the normal key identifiers, these will include capital letters if a capital letter was typed, and the order will match the order in which the keys were pressed
 */
class KeyboardHandler extends InputHandler {
	constructor(engine) {
		super(engine);
		this.downQueue = [];
	}
	preprocess(name) {
		name = super.preprocess(name);
		return name.length === 1 ? name.toLowerCase() : name;
	}
	addListeners() {
		document.body.addEventListener("blur", () => this.targetAll(false));
		document.addEventListener("keydown", event => {
			// don't cancel fancy keyboard shortcuts
			if (!(event.ctrlKey || (event.key[0] === "F" && event.key.length > 1)))
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

/**
 * Represents the API for interacting with the user's mouse.
 * The names of keys for the mouse are Left, Middle, and Right, for the associated buttons.
 * This class is available via the `.mouse` property of both the global object and Hengine.
 * ```js
 * intervals.continuous(() => { // display a circle at the cursor position when pressing the left mouse button
 * 	if (mouse.pressed("Left"))
 * 		renderer.draw(new Color("red")).circle(mouse.screen, 10).
 * });
 * ```
 * @prop Number wheelDelta | The scroll displacement (in pixels) from the mouse wheel during the last frame.
 * @prop Vector2 screen | The current cursor position, in Screen-Space
 * @prop Vector2 screenLast | The cursor position last frame, in Screen-Space
 * @prop Vector2 screenDelta | The change in the cursor's Screen-Space position over the last frame
 * @prop Vector2 world | The current cursor position, in World-Space. This is only available in 2D Mode
 * @prop Vector2 worldLast | The cursor position last frame, in World-Space.  This is only available in 2D Mode
 * @prop Vector2 worldDelta | The change in the cursor's World-Space position over the last frame. This is only available in 2D Mode
 * @prop Boolean locked | Whether the mouse is currently locked and unable to move
 */
class MouseHandler extends InputHandler {
	constructor(engine) {
		super(engine);
		this.mouseMap = new Map([
			[0, "Left"],
			[1, "Middle"],
			[2, "Right"]
		]);

		Vector2.defineReference(this, "screen");
		Vector2.defineReference(this, "screenLast");
		Vector2.defineReference(this, "screenDelta");
		Vector2.defineReference(this, "world");
		Vector2.defineReference(this, "worldLast");
		Vector2.defineReference(this, "worldDelta");
		this.wheelDelta = 0;
	}
	get locked() {
		return !!document.pointerLockElement;
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
				this.screenDelta.add(this.getEventMovement(event));

				const wpos = this.getWorldPosition(pos);
				for (const state of this.states.values()) {
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

		const ifPrimary = handle => event => {
			if (event.isPrimary) handle(event);
		};

		document.addEventListener("mousedown", handleDown);
		document.addEventListener("mousemove", handleMove);
		document.addEventListener("mouseup", handleUp);

		document.addEventListener("pointerdown", ifPrimary(handleDown));
		document.addEventListener("pointermove", ifPrimary(handleMove));
		document.addEventListener("pointerup", ifPrimary(handleUp));

		document.addEventListener("mouseout", () => this.targetAll(false));
		document.addEventListener("contextmenu", event => event.preventDefault());
		document.addEventListener("wheel", event => {
			event.preventDefault();
			this.wheelDelta += event.deltaY * [1, 16, innerHeight][event.deltaMode];
		}, { passive: false });
	}
	/**
	 * Locks the user's cursor in place and hides it.
	 * This can only be called after a user gesture.
	 * Changes in mouse position can still be read via the `.deltaScreen` and `.deltaWorld`.
	 */
	lock() {
		if (!this.locked)
			this.engine.canvas.canvases.ui.requestPointerLock({
				unadjustedMovement: true
			});
	}
	/**
	 * Unlocks the user's cursor.
	 * This can only be called after a successful call to `.lock()`.
	 */
	unlock() {
		document.exitPointerLock();
	}
	getWorldPosition(point) {
		if (IS_3D) return point;
		return this.engine.scene.camera.screenToWorld(point);
	}
	getEventPosition(event) {
		const location = this.engine.canvas.screenToCanvas(
			new Vector2(event.clientX, event.clientY)
		);
		return this.engine.canvas.contains(location) ? location : null;
	}
	getEventMovement(event) {
		return this.engine.canvas.screenDeltaToCanvas(
			new Vector2(event.movementX, event.movementY)
		);
	}
	beforeUpdate() {
		super.beforeUpdate();
		this.world = this.getWorldPosition(this.screen);
		this.worldLast = this.getWorldPosition(this.screenLast);
		this.worldDelta = this.screenDelta.over(this.engine.scene.camera.zoom);
	}
	afterUpdate() {
		super.afterUpdate();

		// post frame
		this.screenLast = this.screen;
		this.wheelDelta = 0;
		this.screenDelta.mul(0);
		this.worldDelta.mul(0);
	}
	/**
	 * @group screenDragStart, screenDragEnd, worldDragStart, worldDragEnd
	 * Returns a location associated with a given key.
	 * @param String name | The name of the key to check
	 * @return Vector2
	 */
}

/**
 * @name class MouseHandler.State extends InputHandler.State
 * The state of a given key on a mouse.
 * @prop Vector2 screenDragStart | The beginning of the most recent click-and-drag motion with this key, in Screen-Space
 * @prop Vector2 screenDragEnd | The end of the most recent click-and-drag motion with this key, in Screen-Space. If such a gesture is ongoing, this will be the current cursor position
 * @prop Vector2 worldDragStart | The beginning of the most recent click-and-drag motion with this key, in World-Space
 * @prop Vector2 worldDragEnd | The end of the most recent click-and-drag motion with this key, in World-Space. If such a gesture is ongoing, this will be the current cursor position
 */
MouseHandler.State = class ButtonState extends InputHandler.State {
	constructor(handler, name) {
		super(handler, name);

		Vector2.defineReference(this, "screenDragStart");
		Vector2.defineReference(this, "screenDragEnd");
		Vector2.defineReference(this, "worldDragStart");
		Vector2.defineReference(this, "worldDragEnd");
	}
};

MouseHandler.addChecks([
	"screenDragStart",
	"screenDragEnd",
	"worldDragStart",
	"worldDragEnd"
]);

/**
 * Represents the API for interacting with the user's touch screen.
 * This class is available via the `.touches` property of both the global object and Hengine.
 * The names for keys in this API are arbitrary numbers, rather than Strings.
 * Getting these key names should be done with the `.allPressed`, `.allJustPressed`, and `.allJustReleased` getters, rather than specifying them directly.
 * ```js
 * intervals.continuous(() => {
 * 	const activeTouches = touches.allPressed;
 * 	if (activeTouches.length >= 2) {
 * 		// retrieve the positions of the first two touches
 * 		const a = touches.get(activeTouches[0]).screen;
 * 		const b = touches.get(activeTouches[1]).screen;
 * 		const dist = Vector2.dist(a, b);
 * 		
 * 		// shows the distance between the them
 * 		renderer.stroke(new Color("black"), 3).measure(
 * 			Font.Arial15, `Distance: ${Math.round(dist)} px`, a, b
 * 		);
 * 	}
 * });
 * ```
 * @prop Number maxTouches | The maximum number of simultaneous touch points supported by the touch screen
 * @prop Number count | The number of currently active touches
 */
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
				if (eventName !== "pointerdown" && event.cancelable)
					event.preventDefault();
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
		return this.engine.scene.camera.screenToWorld(point);
	}
	getEventPosition(event) {
		const location = this.engine.canvas.screenToCanvas(
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
	/**
	 * @group get allPressed, get allJustPressed, get allJustReleased
	 * Returns the names of each touch meeting a specific requirement.
	 * If none meet the requirement, this returns null.
	 * @return String[]/null
	 */
}

/**
 * @name class TouchHandler.State extends MouseHandler.State
 * The state of a specific touch on the user's screen.
 * @prop Vector2 screen | The current position of the touch, in Screen-Space
 * @prop Vector2 screenLast | The position of the touch last frame, in Screen-Space
 * @prop Vector2 world | The current position of the touch, in World-Space
 * @prop Vector2 worldLast | The position of the touch last frame, in World-Space
 */
TouchHandler.State = class TouchState extends MouseHandler.State {
	constructor(handler, name) {
		super(handler, name);

		Vector2.defineReference(this, "screen");
		Vector2.defineReference(this, "screenLast");
		Vector2.defineReference(this, "world");
		Vector2.defineReference(this, "worldLast");
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

/**
 * Allows access to any number of connected Gamepad controllers.
 * This class should not be constructed directly, and should instead be acquired via the `.controllers` property of both the global object and Hengine.
 * ```js
 * let players = [];
 * intervals.continuous(() => {
 * 	// connect as many players as possible
 * 	while (controllers.available) players.push(controllers.nextController());
 * 	renderer.draw(new Color("black")).text(Font.Arial30, `${players.length} controllers connected`, 10, 10);
 * });
 * ```
 */
class Controllers {
	constructor(engine) {
		this.engine = engine;
		this.gamepads = [];
		this.handlers = [];
		this.activeHandlers = new Map();

		window.addEventListener("gamepadconnected", ({ gamepad }) => {
			this.gamepads.push(gamepad.index);
			this.tryResolve();
		});

		window.addEventListener("gamepaddisconnected", ({ gamepad: { index } }) => {
			if (this.activeHandlers.has(index)) {
				const handler = this.activeHandlers.get(index);
				handler.disconnect();
				this.activeHandlers.delete(index);
			} else {
				const index = this.gamepads.indexOf(index);
				if (index > -1) this.gamepads.splice(index, 1);
			}
		});
	}
	/**
	 * Returns the amount of currently connected controllers which are not associated with ControllerHandlers.
	 * @return Number
	 */
	get available() {
		return this.gamepads.length;
	}
	tryResolve() {
		if (this.gamepads.length >= 1 && this.handlers.length >= 1) {
			const index = this.gamepads.shift();
			const handler = this.handlers.shift();
			handler.connect(() => navigator.getGamepads()[index]);
			this.activeHandlers.set(index, handler);
		}
	}
	/**
	 * Creates a ControllerHandler for the next connected Gamepad controller.
	 * While a controller is not connected, the handler will not provide any inputs.
	 * @return ControllerHandler
	 */
	nextController() {
		const handler = new ControllerHandler(this.engine);
		this.handlers.push(handler);
		this.tryResolve();
		return handler;
	}
	beforeUpdate() {
		for (const handler of this.activeHandlers.values())
			handler.beforeUpdate();
	}
	afterUpdate() {
		for (const handler of this.activeHandlers.values())
			handler.afterUpdate();
	}
}

/**
 * Represents the API for interacting with a specific Gamepad controller.
 * This class should not be constructed directly, and should instead be acquired via a Controllers object.
 * ```js
 * const { XB } = ControllerHandler;
 * const controller = await new HengineControllerResource("whatever").load();
 * const position = middle;
 * intervals.continuous(() => {
 * 	position.add(controller.leftStick.times(7));
 * 	const color = controller.pressed(XB.A) ? new Color("red") : new Color("blue");
 * 	renderer.draw(color).circle(position, 50);
 * });
 * ```
 * @prop Vector2 leftStick | The current displacement of the left controller stick from its equilibrium position
 * @prop Vector2 rightStick | The current displacement of the right controller stick from its equilibrium position
 * @prop Boolean connected | Whether the controller is currently connected to the computer. Reconnecting a disconnected controller will cause it to be seen as a new device, so this property can never change from false to true
 * @prop Promise ready | A promise which resolves to the ControllerHandler when it is connects
 * @prop<static, immutable> Object XB | A mapping from button names to API key names, based on the names used on XBox controllers. The keys are A, B, X, Y, LB, RB, LT, RT, Select, Start, LeftStick, RightStick, Up, Down, Left, and Right. The stick keys correspond to the act of pushing in the stick, and the directional keys refer to the D-pad.
 */
class ControllerHandler extends InputHandler {
	constructor(engine) {
		super(engine);
		this.connected = false;
		this.ready = new Promise(resolve => this.resolveReady = resolve);
	}
	get gamepad() {
		if (!this.connected) return {
			buttons: [],
			axes: [0, 0, 0, 0]
		};
		return this.getGamepad();
	}
	get leftStick() {
		const { axes } = this.gamepad;
		return new Vector2(axes[0], axes[1]);
	}
	get rightStick() {
		const { axes } = this.gamepad;
		return new Vector2(axes[2], axes[3]);
	}
	connect(getGamepad) {
		this.getGamepad = getGamepad;
		this.connected = true;
		this.resolveReady(this);
	}
	disconnect() {
		this.connected = false;
	}
	beforeUpdate() {
		const { buttons } = this.gamepad;
		for (let i = 0; i < buttons.length; i++) {
			const button = buttons[i];
			const state = this.get(i);
			if (state.pressed === button.pressed) continue;
			if (button.pressed) {
				state.turnOn = true;
			} else {
				state.turnOff = true;
			}
		}
		super.beforeUpdate();
	}

	static XB = {
		A: 0,
		B: 1,
		X: 2,
		Y: 3,
		LB: 4,
		RB: 5,
		LT: 6,
		RT: 7,
		Select: 8,
		Start: 9,
		LeftStick: 10,
		RightStick: 11,
		Up: 12,
		Down: 13,
		Left: 14,
		Right: 15,
		Power: 16
	};
	static PS = { }; // TODO: fill in
}

/**
 * @name class ControllerHandler.State extends InputHandler.State
 * The state of a specific button on a Gamepad controller, as retrieved from a ControllerHandler.
 * @prop Number amount | The extent to which the button is being pressed, on [0, 1]. For binary buttons, this will only ever take on the values 0 or 1, but for analog buttons (like "triggers"), it can take on a continuous value.
 */
ControllerHandler.State = class ControllerState extends InputHandler.State {
	constructor(handler, name) {
		super(handler, name);
	}
	get amount() {
		return this.handler.gamepad.buttons[this.name]?.value ?? 0;
	}
};

ControllerHandler.addChecks(["amount"]);

/**
 * Represents the API for interacting with the user's clipboard.
 * This class should not be constructed directly, and can be accessed from the `.clipboard` property of both the global object and Hengine.
 * ```js
 * intervals.continuous(() => {
 * 	if (mouse.justPressed("Middle")) { // copies a message when middle clicking
 * 		clipboard.write("Hello World!");
 * 	}
 * });
 * ```
 */
class ClipboardHandler {
	constructor() {
		this.data = "";
		document.body.addEventListener("paste", event => {
			this.data = event.clipboardData.getData("text/plain");
		});
	}
	/**
	 * Writes a value to the clipboard.
	 * @signature
	 * @param String text | The text to write to the clipboard 
	 * @signature
	 * @param ImageType image | The image to write to the clipboard
	 */
	write(value) {
		if (value instanceof ImageType) {
			const image = value.makeImage();
			let canvas = image;
			if (!(image instanceof HTMLCanvasElement || image instanceof OffscreenCanvas)) {
				canvas = new_OffscreenCanvas(value.width, value.height);
				canvas.getContext("2d").drawImage(
					image, 0, 0, value.width, value.height
				);
			}
			
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
	/**
	 * Returns the text content of the clipboard.
	 * This value only updates after paste operations.
	 * @return String
	 */
	read() {
		return this.data;
	}
}