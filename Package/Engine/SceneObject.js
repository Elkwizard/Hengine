class SceneObject extends Rect{
	constructor(name, x, y, width, height, controls, tag, home){
		super(x, y, width, height);
		this.name = name;
		this.home = home;
		this.tag = tag;
		this.controls = controls;
		this.hidden = false;
		this.update = function(){};
		this.draw = function(){};
		this.custom = {};
		this.hasPhysics = false;
		this.isRectangle = true;
		this.hovered = false;
		this.layer = 0;
		this.scripts = {};
		this.lifeSpan = 0;
		this.log = [];
		this.isDead = false;
		this.cullGraphics = true;
		this.response = {
			click: e => e,
			rightClick: e => e,
			hover: e => e
		}
		this.response.input = {
			up: function(){},
			down: function(){},
			left: function(){},
			right: function(){},
			interact1: function(){},
			interact2: function(){}
		};
		this.isBeingUpdated = false;
	}
	rename(name){
		delete this.home.contains[this.name];
		this.home.contains[name] = this;
		this.name = name;
		this.logMod(function(){
			this.rename(name);
		});
	}
	hide(){
		this.hidden = true;
		this.logMod(function(){
			this.hide();
		});
	}
	show(){
		this.hidden = false;
		this.logMod(function(){
			this.show();
		});
	}
	position(p){
		this.x = p.x;
		this.y = p.y;
	}
	scriptUpdate(){
		for(let m in this.scripts){
			let script = this.scripts[m];
			script.scriptUpdate();
		}
	}
	scriptDraw(){
		for (let m in this.scripts) {
			let scripts = this.scripts[m];
			scripts.scriptDraw();
		}
	}
	logMod(func){
		this.log.push(func);
	}
	mod(func){
		func.bind(this)();
		this.logMod(func);
	}
	runLog(el){
		for(let x of this.log) x.bind(el)();
		return el;
	}
	collidePoint(x, y){
		return this.collider.collidePoint(x, y);
	}
	engineDraw(){
		this.update();
		if(!this.hidden){
			this.draw();
			this.scriptDraw();
		}
	}
	engineUpdate(hitboxes){
		if(this.controls){
			this.move();
		}
		this.scriptUpdate();
	}
	pushToRemoveQueue(x) {
		return null;
	}
	remove(){
		if (this.isBeingUpdated) this.pushToRemoveQueue(this);
		else this.home.removeElement(this);
	}
	move(){
		if(K.P(this.controls.up)){
			this.response.input.up()
		}
		if(K.P(this.controls.down)){
			this.response.input.down()
		}
		if(K.P(this.controls.left)){
			this.response.input.left()
		}
		if(K.P(this.controls.right)){
			this.response.input.right()
		}
		if(K.P(this.controls.interact1)){
			this.response.input.interact1()
		}
		if(K.P(this.controls.interact2)){
			this.response.input.interact2()
		}
	}
}