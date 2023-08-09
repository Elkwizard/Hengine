class ElementScript {
	constructor(sceneObject) {
		let props;
		if ("functionNames" in this.constructor) props = this.constructor.functionNames;
		else {
			const prototype = Object.getPrototypeOf(this);
			props = Object.getOwnPropertyNames(prototype)
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

			this.constructor.implementedMethods = implementedMethods;
			this.constructor.implements = method => implementedMethods.has(method);
		}

		for (let i = 0; i < props.length; i++) {
			const prop = props[i];
			this[prop] = this[prop].bind(this, sceneObject);
		}

		const placeholder = () => true;
		for (const flag of ElementScript.flags)
			if (!(flag in this)) this[flag] = placeholder;

		this.sceneObject = sceneObject;
		this.scriptNumber = 0;
		this.scriptSynced = !sceneObject.engine.scene.updating;
	}
}

ElementScript.flags = new Set([
	"init",
	"update",
	"beforeUpdate",
	"afterUpdate",
	"beforePhysics",
	"afterPhysics",
	"draw",
	"escapeDraw",
	"collideRule",
	"collideGeneral",
	"collideTop",
	"collideBottom",
	"collideLeft",
	"collideRight",
	"click",
	"hover",
	"unhover",
	"message",
	"remove",
	"cleanUp",
	"addShape",
	"removeShape",
	"addScript"
]);

class ScriptContainer {
	constructor(sceneObject) {
		this.sceneObject = sceneObject;
		this.sortedScriptInstances = [];
		this.implementedMethods = new Set();
		this.scripts = new Map();
	}
	get defaultScript() {
		return this.sceneObject.container.defaultScript;
	}
	add(script, ...args) {
		if (this.has(script)) return null;
		const instance = new script(this.sceneObject);
		this[script.name] = instance;
		for (const method of script.implementedMethods) this.implementedMethods.add(method);
		this.scripts.set(script, instance);
		const returnValue = instance.init(...args);
		this.run("addScript", script, ...args);
		this.sortedScriptInstances.push(instance);
		this.sortedScriptInstances.sort((a, b) => a.scriptNumber - b.scriptNumber);
		return returnValue;
	}
	removeDefault() {
		this.remove(this.defaultScript);
	}
	remove(script) {
		if (!this.has(script)) return;
		const instance = this.scripts.get(script);
		instance.cleanUp();
		this.scripts.delete(script);
		this.sortedScriptInstances.splice(this.sortedScriptInstances.indexOf(instance), 1);

		this.implementedMethods.clear();
		for (const [script, instance] of this.scripts)
			for (const method of script.implementedMethods) this.implementedMethods.add(method);
	}
	has(script) {
		return this.scripts.has(script);
	}
	implements(method) {
		return this.implementedMethods.has(method);
	}
	sync() {
		for (let i = 0; i < this.sortedScriptInstances.length; i++)
			this.sortedScriptInstances[i].scriptSynced = true;
	}
	run(method, ...args) {
		// if (this.sceneObject.removed && method !== "remove" && method !== "cleanUp") return;
		if (this.implementedMethods.has(method))
			for (let i = 0; i < this.sortedScriptInstances.length; i++) {
				const script = this.sortedScriptInstances[i];
				if (script.scriptSynced)
					script[method](...args);
			}
	}
}