class Script {
	constructor(name, opts){
		this.name = name;
		this.methods = {};
		for (let op in opts) {
			let fn = opts[op];
			fn.flag = op;
			this.methods[op] = fn;
		}
	}
	addMethod(name, callback, flag){
		this.methods[name] = callback;
		this.methods[name].flag = flag;
	}
	removeMethod(name){
		delete this.methods[name];
	}
	run(){
		for(let x in this.methods){
			this.methods[x]();
		}
	}
	attachTo(obj, bindTo, ...args){
		obj[this.name] = {
			run: function(){
				for(let x in this){
					let m = this[x];
					if(x !== "run") m();
				}
			}
		};
		if(bindTo === undefined) bindTo = obj;
		let local = obj[this.name];
		local.scriptUpdate = e => e;
		local.scriptDraw = e => e;
		local.scriptCollideTop = e => e;
		local.scriptCollideLeft = e => e;
		local.scriptCollideRight = e => e;
		local.scriptCollideBottom = e => e;
		local.scriptCollideGeneral = e => e;
		local.scriptClick = e => e;
		local.scriptRightClick = e => e;
		local.scriptHover = e => e;
		for(let x in this.methods){
			let flag = this.methods[x].flag.toLowerCase();
			if (flag === "init") {
				this.methods[x].bind(bindTo)(...args);
			}
			else if (flag === "update") {
				local.scriptUpdate = local.scriptUpdate.add(this.methods[x].bind(bindTo));
			}
			else if (flag === "draw") {
				local.scriptDraw = local.scriptDraw.add(this.methods[x].bind(bindTo));
			}
			else if (flag === "collide-general" || flag === "collide_general") {
				local.scriptCollideGeneral = local.scriptCollideGeneral.add(this.methods[x].bind(bindTo));
			}
			else if (flag === "collide-top" || flag === "collide_top") {
				local.scriptCollideTop = local.scriptCollideTop.add(this.methods[x].bind(bindTo));
			}
			else if (flag === "collide-bottom" || flag === "collide_bottom") {
				local.scriptCollideBottom = local.scriptCollideBottom.add(this.methods[x].bind(bindTo));
			}
			else if (flag === "collide-left" || flag === "collide_left") {
				local.scriptCollideLeft = local.scriptCollideLeft.add(this.methods[x].bind(bindTo));
			}
			else if (flag === "collide-right" || flag === "collide_right") {
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
			else {
				local[x] = this.methods[x].bind(bindTo);
				local[x].flag = flag;
			}
		}
		return this;
	}
	addTo(obj, ...args){
		this.attachTo(obj, obj, ...args);
		return this;
	}
}
class ElementScript extends Script {
	constructor(name, opts) {
		super(name, opts);
	}
	addMethod(name, callback, flag){
		this.methods[name] = callback;
		this.methods[name].flag = flag;
	}
	addTo(el, ...args){
		this.attachTo(el.scripts, el, ...args);
		let self = this;
		el.logMod(function(){
			let correct = args.map(e => (e instanceof SceneObject)? this.home.copy(e):e);
			self.addTo(this, ...correct);
		});
		return this;
	}
}
//presets
const PLAYER_MOVEMENT = new ElementScript("movement");
PLAYER_MOVEMENT.addMethod("init", function(){
	if(!this.controls.up){
		this.controls = new Controls("w", "s", "a", "d");
	}
	this.applyGravity = true;
}, "init");
PLAYER_MOVEMENT.addMethod("update", function(){
	if (K.P(this.controls.down)) this.speed.y += 0.2;
	if (K.P(this.controls.left)) this.accel.x = -0.1;
	else if (K.P(this.controls.right)) this.accel.x = 0.1;
	else this.accel.x = 0;
	if (K.P(this.controls.up)) {
		if (this.colliding.bottom) {
			this.speed.y = -5;
		}
	}
}, "update");
