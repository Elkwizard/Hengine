class ElementScript {
	constructor(name, opts) {
		this.name = name;
		this.methods = {};
		for (let op in opts) {
			let fn = opts[op];
			fn.flag = op;
			this.methods[op] = fn;
		}
	}
	attachTo(obj, bindTo, ...args) {
		const exists = obj.exists;
		obj[this.name] = new LocalScript();
		if (bindTo === undefined) bindTo = obj;
        let flags = LocalScript.flags;
		let local = obj[this.name];
        for (let flag of flags) {
            let result = "script" + flag.map(e => e.capitalize()).join("");
            local[result] = function (l, e) {  };
		}
		let inits = [];
        for (let m in this.methods) {
            let name = m.toLowerCase();
            let fn = this.methods[m].bind(bindTo);
            let found = false;
            for (let flag of flags) {
                if (name === flag.join("") || name === flag.join("_") || name === flag.join("-")) {
					let key = "script" + flag.map(e => e.capitalize()).join("");
					let localFn = local[key].bind(bindTo);
                    local[key] = function (...args) {
						localFn();
						return fn(...args);
					}
                    exists[key] = true;
                    found = true;
                }
            }
            if (!found) {
                if (name === "init" || name === "start") {
					inits.push(() => fn(local, ...args));
                } else {
                    local[m] = function (...params) {
                        return fn(local, ...params);
                    }.bind(bindTo);
                    local[m].flag = m;
                }
			}
		}
		for (let init of inits) init();
		return this;
	}
	addTo(el, ...args) {
		let sc = this;
		sc.attachTo(el.scripts, el, ...args);
		el.onAddScript(this.name);
		el.logMod(function () {
			sc.addTo(this);
		});
		return this;
	}
}
class LocalScript {
	constructor() {
		this.scriptNumber = 0;
	}
}
LocalScript.flags = [
	["update"],
	["before", "update"],
	["after", "update"],
	["draw"],
	["escape", "draw"],
	["collide", "rule"],
	["collide", "general"],
	["collide", "top"],
	["collide", "bottom"],
	["collide", "left"],
	["collide", "right"],
	["click"],
	["right", "click"],
	["hover"],
	["unhover"],
	["message"],
	["remove"],
	["activate"],
	["deactivate"]
];
class ScriptContainer {
	constructor(sceneObject) {
		this.sceneObject = sceneObject;
		this.exists = { };
		this[Symbol.iterator] = function* () {
			let ary = [];
			for (let m in this) {
				let a = this[m];
				if (a instanceof LocalScript) ary.push(a);
			}
			ary = ary.sort((a, b) => a.scriptNumber - b.scriptNumber);
			for (let a of ary) {
				yield a;
			}
		};
	}
	run(str, ...args) {
		if (this.sceneObject.removed && str !== "Remove") return;
		let key = "script" + str;
		if (this.exists[key]) for (let m of this) {
			m[key](m, ...args);
		}
    }
}