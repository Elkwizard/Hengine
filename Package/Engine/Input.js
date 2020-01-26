class Listener {
	constructor() {
		this.methods = [];
		this[Symbol.iterator] = function*(){
			for (let i = 0; i < this.methods.length; i++) {
				yield this.methods[i];
			}
		}
	}
	listen(fn) {
		this.methods.push(fn);
	}
}
let K = {
	P: function(key){
		if(this.keys[key] == undefined) {
			this.keys[key] = false;
		}
		return this.keys[key];
	},
	keys: {},
	custom: {},
	onDown: new Listener,
	onUp: new Listener
}
let M = {
	down: false,
	x: 0,
	y: 0,
	button: 0,
	dragStart: new Vector2(0, 0),
	dragEnd: new Vector2(0, 0),
	custom: {},
	updatePosition: function(e){
		this.x = e.clientX;
		this.y = e.clientY;
	},
	onDown: new Listener,
	onUp: new Listener,
	onClick: new Listener,
	onRight: new Listener,
	onScroll: new Listener,
	onMove: new Listener,
	engine: null,
	engineClick: e => e,
	engineRightClick: e => e,
	engineMove: e => e
}
onkeydown = function(e) {
	K.keys[e.key] = true;
	for (let ev of K.onDown) ev(e);
}
onkeyup = function(e) {
	if (e.key.toUpperCase() === e.key) {
		K.keys[e.key.toLowerCase()] = false;
	}
	K.keys[e.key] = false;
	for (let ev of K.onUp) ev(e);
}
onclick = function(e){
	M.button = e.button;
	M.engineClick(e);
	for (let ev of M.onClick) ev(e);
}
onmousedown = function(e){
	M.button = e.button;
	if (M.engine) M.dragStart = M.dragEnd = M.engine.scene.adjustPointForDisplay(new Vector2(e.x, e.y));
	M.updatePosition(e);
	M.down = true;
	for (let ev of M.onDown) ev(e);
}
onmousemove = function(e){
	M.updatePosition(e);
	if (M.engine) M.dragEnd = M.engine.scene.adjustPointForDisplay(new Vector2(e.x, e.y));
	M.engineMove(e);
	for (let ev of M.onMove) ev(e);
}
onmouseup = function(e){
	M.button = e.button;
	M.updatePosition(e);
	if (M.engine) M.dragEnd = M.engine.scene.adjustPointForDisplay(new Vector2(e.x, e.y));
	M.down = false;
	for (let ev of M.onUp) ev(e);
}
oncontextmenu = function(e){
	M.button = e.button;
	e.preventDefault();
	M.updatePosition(e);
	M.down = false;
	for (let ev of M.onRight) ev(e);
	M.engineRightClick(e);
}
onwheel = function(e) {
	M.button = e.button;
	for (let ev of M.onScroll) ev(e.deltaY);
}