/**
 * Scripts in the Hengine are subclasses of ElementScript.
 * These scripts represent collections of behavior for SceneObjects and data related to that behavior.
 * Extending scripts is not allowed.
 * The way the behavior of scripts is specified is via specifying optional listeners for a series of events, which fire at different times over the course of the associated object's lifetime.
 * All methods defined on a script are passed the associated sceneObject as an implicit parameter. This is also true of non-event-listener methods.
 * The available events to listen for, and when they're fired, are specified in the methods section. However, the signatures in the methods section leave out the initial object parameter, which is required for all methods of a script.
 * ```js
 * class ORBIT_AROUND extends ElementScript {
 * 	init(obj, center, radius) {
 * 		obj.scripts.removeDefault(); // remove normal drawing behavior
 * 		this.center = center;
 * 		this.radius = radius;
 * 		this.angle = 0;
 * 	}
 * 
 * 	getOrbitPosition(obj) {
 * 		return Vector2.fromAngle(this.angle)
 * 			.times(this.radius)
 * 			.plus(this.center);
 * 	}
 * 
 * 	update(obj) {
 * 		this.angle += 0.01;
 * 		obj.transform.position = this.getOrbitPosition(); // implicitly passes obj
 * 	}
 * 
 * 	draw(obj, name, shape) {
 * 		renderer.draw(new Color("red")).infer(shape);
 * 	}
 * }
 * 
 * const orbiter = scene.main.addCircleElement("orbiter", 0, 0, 30);
 * orbiter.scripts.add(ORBIT_AROUND, middle, 300);
 * ```
 * @abstract
 * @prop SceneObject sceneObject | The object with the behavior
 * @prop Number scriptNumber | When in the sorting order the handlers of this script should occur. Scripts with higher values for this property will have their handlers executed last
 */
class ElementScript {
	constructor(sceneObject) {
		if (!("functionNames" in this.constructor)) {
			const prototype = Object.getPrototypeOf(this);
			const props = Object.getOwnPropertyNames(prototype)
				.filter(prop => {
					if (prop === "constructor") return false;
					const descriptor = Object.getOwnPropertyDescriptor(prototype, prop);
					return "value" in descriptor && typeof descriptor.value === "function";
				});
			this.constructor.functionNames = props;

			const implementedMethods = new Set();
			for (let i = 0; i < props.length; i++) {
				const prop = props[i];
				if (ElementScript.flags.has(prop)) implementedMethods.add(prop);
			}

			const placeholder = () => undefined;
			for (const flag of ElementScript.flags)
				if (!(flag in this))
					this.constructor.prototype[flag] = placeholder;
				

			this.constructor.implementedMethods = implementedMethods;
			this.constructor.implements = method => implementedMethods.has(method);
		}

		const props = this.constructor.functionNames;

		for (let i = 0; i < props.length; i++) {
			const prop = props[i];
			this[prop] = this[prop].bind(this, sceneObject);
		}

		this.sceneObject = sceneObject;
		this._scriptNumber = 0;
		this.scriptSynced = false;
		this.removed = false;
	}
	set scriptNumber(a) {
		this._scriptNumber = a;
		this.sceneObject.scripts.sort();
	}
	get scriptNumber() {
		return this._scriptNumber;
	}
	/**
	 * @name static implements
	 * Checks if a certain listener is defined in the script.
	 * @param String eventName | The name of the event to check for
	 * @return Boolean
	 */
	/**
	 * @name init
	 * This is called when the script is added to the object.
	 * The non-initial arguments to `ScriptContainer.scripts.add()` are passed to this listener.
	 * The return value of this function will be returned from `ScriptContainer.scripts.add()`.
	 * @param Any[] ...args | The initialization arguments
	 * @return Any
	 */
	/**
	 * @name update
	 * This called each frame during the main update cycle.
	 */
	/**
	 * @name drawRule
	 * This is called prior to rendering to determine whether an object should be rendered on a given camera.
	 * If this is not specified, the object will be rendered for all cameras.
	 * @param Camera camera | The camera to test against
	 * @return Boolean
	 */
	/**
	 * @name draw
	 * This is called once per shape of the object each frame during rendering.
	 * When this is called, the renderer is in the local-space of the object.
	 * If the object is not on-screen or is hidden, this function will not be called.
	 * @param String name | The name of the shape being rendered
	 * @param Shape shape | The shape being rendered, in local-space
	 */
	/**
	 * @name escapeDraw
	 * This is called once per frame during rendering, immediately after the last call to `.draw()` for the object, regardless of whether the object is visible.
	 * When this called, the renderer is in world-space.
	 */
	/**
	 * @name cleanUp
	 * This is called when the script is removed from the object.
	 * This will also occur when the object is removed, and thus this is often more useful than the `.remove()` event.
	 */
	/**
	 * @name remove
	 * This is called when the object is removed from the scene.
	 */
	/**
	 * @name click
	 * This is called when this object is clicked with the mouse.
	 * This will never be called for 3D objects.
	 * @param String key | The identifier of the button used to click
	 * @param Vector2 point | The location of the mouse in world space
	 */
	/**
	 * @name hover
	 * This is called when this object is initially hovered over by the mouse.
	 * This will never be called for 3D objects.
	 * @param Vector2 point | The location of the mouse in world space
	 */
	/**
	 * @name unhover
	 * This is called when this object stops being hovered over by the mouse.
	 * This will never be called for 3D objects.
	 * @param Vector2 point | The location of the mouse in world space
	 */
	/**
	 * @name beforeUpdate
	 * This is called each frame before the screen is cleared.
	 */
	/**
	 * @name afterUpdate
	 * This is called each frame after rendering.
	 */
	/**
	 * @name beforePhysics
	 * This is called immediately before the physics engine runs each frame.
	 */
	/**
	 * @name afterPhysics
	 * This is called immediately after the physics engine runs each frame.
	 */
	/**
	 * @name collideRule
	 * This is called for potential collisions between the object and another object.
	 * If every `.collideRule()` implementation on the objects returns true, it will be detected and potentially resolved.
	 * If the object doesn't have the PHYSICS script, then this won't be called.
	 * @param SceneObject other | The object to check collisions with
	 * @return Boolean
	 */
	/**
	 * @name triggerRule
	 * This is called for potential collisions between the object and another object.
	 * If any `.triggerRule()` implementation returns true, then the collision will be detected but not resolved.
	 * If the object doesn't have the PHYSICS script, then this won't be called.
	 * @param SceneObject other | The object to check collisions with
	 * @return Boolean
	 */
	/**
	 * @group collideGeneral, collideLeft, collideRight, collideTop, collideBottom, collideFront, collideBack
	 * These are called when a collision occurs with the object in a specified direction (or for any direction, for `.collideGeneral()`).
	 * If the SceneObject doesn't have the PHYSICS script, then this won't be called.
	 * The `...Front` and `...Back` variants won't be called in 2D Mode.
	 * @param CollisionData collision | The collision that occurred
	 */
	/**
	 * @name addShape
	 * This is called when a shape is added to the object.
	 * @param String name | The name of the new shape
	 * @param Shape shape | The new shape being added
	 */
	/**
	 * @name removeShape
	 * This is called when a shape is removed from the object.
	 * @param String name | The name of the shape being removed
	 * @param Shape shape | The shape that was just removed
	 */
	/**
	 * @name addScript
	 * @type addScript<T extends ElementScript>(script: Class<T>, ...args: RemainingParams<T["init"]>): void;
	 * This is called when a script (including this one) is added to the object.
	 * @param Class extends ElementScript script | The script being added
	 * @param Any[] ...args | The initialization arguments for the script
	 */
	
	static stateChangeFlags = new Set([
		"addScript",
		"addShape",
		"removeShape"
	]);
	
	static flags = new Set([
		"init",
		"update",
		"beforeUpdate",
		"afterUpdate",
		"beforePhysics",
		"afterPhysics",
		"drawRule",
		"draw",
		"escapeDraw",
		"collideRule",
		"triggerRule",
		"collideGeneral",
		"collideTop",
		"collideBottom",
		"collideLeft",
		"collideRight",
		"collideFront",
		"collideBack",
		"click",
		"hover",
		"unhover",
		"remove",
		"cleanUp",
		...ElementScript.stateChangeFlags
	]);
}

/**
 * @type type ScriptContainer = 
 * Represents the collection of behaviors on a SceneObject.
 * ```js
 * // create a script which holds an action
 * class ACTION extends ElementScript {
 * 	init(obj, action) {
 * 		this.action = action;
 * 	}
 * }
 * 
 * const object = scene.main.addElement("hello", 0, 0);
 * object.scripts.add(ACTION, () => {
 * 	console.log("Hello World!");
 * });
 * 
 * // call the function from the defined property
 * object.scripts(ACTION).action(); // Hello World!
 * ```
 * @prop SceneObject sceneObject | The associated object
 */
class ScriptContainer {
	constructor(sceneObject) {
		const self = script => self[script.name];
		self.sceneObject = sceneObject;
		self.sortedScriptInstances = [];
		self.implementedMethods = new Set();
		self.scripts = new Map();
		self.toRemove = [];
		Object.defineProperties(self, Object.getOwnPropertyDescriptors(ScriptContainer.prototype));
		return self;
	}
	/**
	 * Returns the highest `.scriptNumber` of all scripts in the container.
	 * @return Number
	 */
	get maxScriptNumber() {
		return this.sortedScriptInstances.last.scriptNumber;
	}
	/**
	 * Returns the lowest `.scriptNumber` of all scripts in the container.
	 * @return Number
	 */
	get minScriptNumber() {
		return this.sortedScriptInstances[0].scriptNumber;
	}
	/**
	 * Returns the default script (`Scene.defaultScript`) of the object's scene.
	 * @return Class extends ElementScript
	 */
	get defaultScript() {
		return this.sceneObject.container.defaultScript;
	}
	sort() {
		this.sortedScriptInstances.sort((a, b) => a.scriptNumber - b.scriptNumber);
	}
	/**
	 * Removes every script from the object.
	 */
	removeAllScripts() {
		const instances = [...this.sortedScriptInstances];
		for (let i = 0; i < instances.length; i++)
			this.remove(instances[i].constructor);
	}
	/**
	 * @type add<T extends ElementScript>(script: Class<T>, ...args: RemainingParams<T["init"]>): ReturnType<T["init"]>;
	 * Adds a new script to the object. Returns the result of the `.init()` listener.
	 * This also defines a property with the name of the script (e.g. `.MY_SCRIPT` for a script defined as `class MY_SCRIPT extends ElementScript { ... }`) containing the script instance.
	 * None of the listeners on this script will be called until the next frame.
	 * If an instance of the script was already on the object, it will be removed.
	 * @param Class extends ElementScript script | The script to add
	 * @param Any[] ...args | The initialization arguments to pass to the `.init()` listener.
	 * @return Any
	 */
	add(script, ...args) {
		if (this.has(script)) this.remove(script);
		const instance = new script(this.sceneObject);
		this[script.name] = instance;
		for (const method of script.implementedMethods)
			this.implementedMethods.add(method);
		this.scripts.set(script, instance);
		const returnValue = instance.init(...args);
		this.run("addScript", script, ...args);
		this.sortedScriptInstances.push(instance);
		this.sort();
		return returnValue;
	}
	/**
	 * Removes the scene's default script from the object.
	 */
	removeDefault() {
		this.remove(this.defaultScript);
	}
	/**
	 * Removes a specific script from the object.
	 * This removal is synchronized, and will only take effect at the end of the frame.
	 * When the script is removed, the `.cleanUp()` listener is called.
	 * @param Class extends ElementScript script | The class of the script instance to remove
	 */
	remove(script) {
		if (!this.has(script)) return;
		const instance = this.scripts.get(script);
		if (!instance.removed) {
			instance.removed = true;
			this.toRemove.push(instance);
		}
	}
	removeQueued() {
		for (let i = 0; i < this.toRemove.length; i++) {
			const instance = this.toRemove[i];
			instance.cleanUp();
			
			const script = instance.constructor;
			if (this.scripts.get(script).removed) { // in case it was re-added
				const instance = this.scripts.get(script);
				this.scripts.delete(script);
				this.sortedScriptInstances.splice(
					this.sortedScriptInstances.indexOf(instance), 1
				);

				this.implementedMethods.clear();
				for (const [script, instance] of this.scripts)
					for (const method of script.implementedMethods) this.implementedMethods.add(method);
			
				delete this[script.name];
			}
		}
		this.toRemove = [];
	}
	/**
	 * Checks whether the object has a specific script.
	 * @param Class extends ElementScript script | The script to check
	 * @return Boolean
	 */
	has(script) {
		return this.scripts.has(script);
	}
	/**
	 * Checks whether the object has any scripts listening for a specific event.
	 * @param String method | The name of the listener to check for
	 * @return Boolean
	 */
	implements(method) {
		return this.implementedMethods.has(method);
	}
	sync() {
		for (let i = 0; i < this.sortedScriptInstances.length; i++)
			this.sortedScriptInstances[i].scriptSynced = true;
	}
	run(method, ...args) {
		if (!this.implementedMethods.has(method)) return;

		const stateChange = ElementScript.stateChangeFlags.has(method);

		const sorted = this.sortedScriptInstances;
		for (let i = 0; i < sorted.length; i++) {
			const script = sorted[i];
			if (stateChange || script.scriptSynced)
				script[method](...args);
		}
	}
	check(goal, method, ...args) {
		if (!this.implementedMethods.has(method)) return goal;

		const fail = !goal;
		const sorted = this.sortedScriptInstances;
		for (let i = 0; i < sorted.length; i++) {
			const script = sorted[i];
			if (script.scriptSynced && script[method](...args) === fail)
				return fail;
		}

		return goal;
	}
	/**
	 * @name 
	 * @type <T extends ElementScript>(script: Class<T>): T;
	 * This function is called when the container is called as a function.
	 * It returns the instance of a given script, if present.
	 * @param Class extends ElementScript script | The script to return the instance of
	 * @return Class extends ElementScript/undefined
	 */
}