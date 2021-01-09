class ElementScript {
	constructor(name, opts) {
		this.name = name;
		this.staticData = {};
		this.methods = {};
		let local = {};
		let placeholder = arg => arg;

		let implementedMethods = new Set();

		for (let op in opts) {
			let methodName = op;
			let method = opts[op];

			let found = false;

			for (let flag of LocalScript.flags) if (methodName === flag) {
				let localName = `script${methodName.capitalize()}`;
				local[localName] = method;
				found = true;
				implementedMethods.add(localName);
			}

			if (!found) {
				let name = this.name;
				local[methodName] = function (...args) {
					return method.call(this, this.scripts[name], ...args);
				};
			}


			let fn = opts[op];
			fn.flag = op;
			this.methods[op] = fn;
		}

		for (let flag of LocalScript.flags) {
			let name = `script${flag.capitalize()}`;
			if (!(name in local)) local[name] = placeholder;
		}


		this.methodNames = Object.keys(local);
		this.localTemplate = local;
		this.implementedMethods = implementedMethods;
	}
	implements(method) {
		return this.implementedMethods.has("script" + method);
	}
	addTo(el, ...args) {
		el.scripts.add(this, ...args);
	}
}
class LocalScript {
	constructor(source) {
		this.scriptNumber = 0;
		this.scriptSource = source;
	}
}
LocalScript.flags = [
	"init",
	"update",
	"beforeUpdate",
	"afterUpdate",
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
	"activate",
	"deactivate"
];

class ScriptContainer {
	constructor(sceneObject) {
		this.sceneObject = sceneObject;
		this.implementedMethods = new Set();
		this.sortedLocalScripts = [];
	}
	get defaultScript() {
		return this.sceneObject.container.defaultScript;
	}
	add(script, ...args) {
		let local = new LocalScript(script);
		this[script.name] = local;

		for (let i = 0; i < script.methodNames.length; i++) {
			let name = script.methodNames[i];
			local[name] = script.localTemplate[name].bind(this.sceneObject);
		}

		for (let flag of script.implementedMethods) this.implementedMethods.add(flag);

		this.sortedLocalScripts.push(local);
		this.sortedLocalScripts.sort((a, b) => a.scriptNumber - b.scriptNumber);
		
		local.scriptInit(local, ...args);

		this.sceneObject.onAddScript(script);

		this.sceneObject.logMod(function () {
			script.addTo(this, ...args);
		});
	}
	remove(script) {
		this.sortedLocalScripts = this.sortedLocalScripts.filter(v => v.scriptSource !== script);
		this.implementedMethods.clear();
		for (let i = 0; i < this.sortedLocalScripts.length; i++) {
			const m = this.sortedLocalScripts[i].scriptSource;
			for (let flag of m.implementedMethods) this.implementedMethods.add(flag);
		}
	}
	has(script) {
		return !!this.sortedLocalScripts.find(l => l.scriptSource === script);
	}
	removeDefault() {
		const defaultScript = this.defaultScript;
		if (this.has(defaultScript)) this.remove(defaultScript);
	}
	implements(method) {
		return this.implementedMethods.has("script" + method);
	}
	run(str, ...args) {
		if (this.sceneObject.removed && str !== "Remove") return;
		let key = "script" + str;
		if (this.implementedMethods.has(key)) for (let i = 0; i < this.sortedLocalScripts.length; i++) {
			const local = this.sortedLocalScripts[i];
			local[key](local, ...args);
		}
	}
}