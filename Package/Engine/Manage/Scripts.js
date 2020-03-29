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
		let local = obj[this.name];
		local.scriptNumber = 1;
		local.scriptUpdate = (l, e) => e;
		local.scriptBeforeUpdate = (l, e) => e;
		local.scriptDraw = (l, e) => e;
		local.scriptCollideTop = (l, e) => e;
		local.scriptCollideLeft = (l, e) => e;
		local.scriptCollideRight = (l, e) => e;
		local.scriptCollideBottom = (l, e) => e;
		local.scriptCollideGeneral = (l, e) => e;
		local.scriptClick = (l, e) => e;
		local.scriptRightClick = (l, e) => e;
		local.scriptHover = (l, e) => e;
		local.scriptCollideRule = (l, e) => e;
		for (let x in this.methods) {
			let flag = this.methods[x].flag.toLowerCase();
			if (flag === "init") {
				this.methods[x].bind(bindTo)(local, ...args);
			}
			else if (flag === "update") {
				local.scriptUpdate = local.scriptUpdate.add(this.methods[x].bind(bindTo));
			}
			else if (flag === "before_update" || flag === "beforeupdate" || flag === "before-update") {
				local.scriptBeforeUpdate = local.scriptBeforeUpdate.add(this.methods[x].bind(bindTo));
			}
			else if (flag === "draw") {
				local.scriptDraw = local.scriptDraw.add(this.methods[x].bind(bindTo));
			}
			else if (flag === "collide-general" || flag === "collide_general" || flag === "collidegeneral") {
				local.scriptCollideGeneral = local.scriptCollideGeneral.add(this.methods[x].bind(bindTo));
			}
			else if (flag === "collide-top" || flag === "collide_top" || flag === "collidetop") {
				local.scriptCollideTop = local.scriptCollideTop.add(this.methods[x].bind(bindTo));
			}
			else if (flag === "collide-bottom" || flag === "collide_bottom" || flag === "collidebottom") {
				local.scriptCollideBottom = local.scriptCollideBottom.add(this.methods[x].bind(bindTo));
			}
			else if (flag === "collide-left" || flag === "collide_left" || flag === "collideleft") {
				local.scriptCollideLeft = local.scriptCollideLeft.add(this.methods[x].bind(bindTo));
			}
			else if (flag === "collide-right" || flag === "collide_right" || flag === "collideright") {
				local.scriptCollideRight = local.scriptCollideRight.add(this.methods[x].bind(bindTo));
			}
			else if (flag === "onrightclick" || flag === "on_right_click" || flag === "right_click") {
				local.scriptRightClick = local.scriptRightClick.add(this.methods[x].bind(bindTo));
			}
			else if (flag === "onclick" || flag === "on_click" || flag === "click") {
				local.scriptClick = local.scriptClick.add(this.methods[x].bind(bindTo));
			}
			else if (flag === "onhover" || flag === "on_hover" || flag === "hover") {
				local.scriptHover = local.scriptHover.add(this.methods[x].bind(bindTo));
			}
			else if (flag === "collide-rule" || flag === "collide_rule" || flag === "colliderule") {
				local.scriptCollideRule = local.scriptCollideRule.add(this.methods[x].bind(bindTo));
			}
			else {
				local[x] = function (...params) {
					return this.methods[x].bind(bindTo)(local, ...params);
				}.bind(this);
				local[x].flag = flag;
			}
		}
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
//presets
const PLAYER_MOVEMENT = new ElementScript("movement", {
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
