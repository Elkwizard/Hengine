class Script {
	constructor(name, opts) {
		this.name = name;
		this.methods = {};
		for (let op in opts) {
			let fn = opts[op];
			fn.flag = op;
			this.methods[op] = fn;
		}
	}
	addMethod(name, callback, flag) {
		this.methods[name] = callback;
		this.methods[name].flag = flag;
	}
	removeMethod(name) {
		delete this.methods[name];
	}
	attachTo(obj, bindTo, ...args) {
		const exists = (obj instanceof ScriptContainer) ? obj.exists : { };
		obj[this.name] = {
			run: function () {
				for (let x in this) {
					let m = this[x];
					if (x !== "run") m();
				}
			}
		};
		if (bindTo === undefined) bindTo = obj;
        let flags = [
            ["update"],
            ["draw"],
            ["escape", "draw"],
            ["before", "update"],
            ["collide", "rule"],
            ["collide", "general"],
            ["collide", "top"],
            ["collide", "bottom"],
            ["collide", "left"],
            ["collide", "right"],
            ["click"],
            ["right", "click"],
			["hover"],
			["unhover"]
        ]
		let local = obj[this.name];
        local.scriptNumber = 0;
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
                    local[key] = local[key].add(fn);
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
	addTo(obj, ...args) {
		this.attachTo(obj, obj, ...args);
		return this;
	}
}
class ElementScript extends Script {
	constructor(name, opts) {
		super(name, opts);
	}
	addMethod(name, callback, flag) {
		this.methods[name] = callback;
		this.methods[name].flag = flag;
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
class ScriptContainer {
	constructor() {
		this.exists = { };
		this[Symbol.iterator] = function* () {
			let ary = [];
			for (let m in this) {
				let a = this[m];
				if (typeof a !== "function" && m !== "exists") ary.push(a);
			}
			ary = ary.sort((a, b) => a.scriptNumber - b.scriptNumber);
			for (let a of ary) {
				yield a;
			}
		};
	}
	run(str, ...args) {
		let key = "script" + str;
		if (this.exists[key]) for (let m of this) {
			m[key](m, ...args);
		}
    }
}