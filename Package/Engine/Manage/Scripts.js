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
	run() {
		for (let x in this.methods) {
			this.methods[x]();
		}
	}
	attachTo(obj, bindTo, ...args) {
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
		el.mod(function () {
			sc.attachTo(this.scripts, this, ...args);
		});
		return this;
	}
}
class ScriptContainer {
	constructor() {
		this[Symbol.iterator] = function* () {
			let ary = [];
			for (let m in this) {
				let a = this[m];
				if (typeof a !== "function") ary.push(a);
			}
			ary = ary.sort((a, b) => a.scriptNumber - b.scriptNumber);
			for (let a of ary) {
				yield a;
			}
		};
	}
    run(str, ...args) {
		for (let m of this) {
			let key = "script" + str.capitalize();
			m[key](m, ...args);
		}
    }
}
//presets
const PLAYER_MOVEMENT = new ElementScript("PLAYER_MOVEMENT", {
	init() {
		if (!this.controls.up) {
			this.controls = new Controls("w", "s", "a", "d");
		}
		this.completelyStatic = false;
		this.hasGravity = true;
	},
	update() {
		if (K.P(this.controls.down)) this.speed.y += 0.2;
		if (K.P(this.controls.left)) this.accel.x = -0.1;
		else if (K.P(this.controls.right)) this.accel.x = 0.1;
		else this.accel.x = 0;
		if (K.P(this.controls.up)) {
			if (this.colliding.bottom) {
				this.speed.y = -5;
			}
		}
	}
});
