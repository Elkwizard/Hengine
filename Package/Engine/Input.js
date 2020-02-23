class Listener {
	constructor() {
		this.methods = [];
		this[Symbol.iterator] = function* () {
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
	P: function (key) {
		return !!this.keys[key];
	},
	JP: function(key) {
		return this.keyCounts[key] == 1;
	},
	update: function() {
		for (let key in this.keys) {
			if (!this.keyCounts[key]) this.keyCounts[key] = 0;
			if (this.P(key)) this.keyCounts[key]++;
			else this.keyCounts[key] = 0;
		}
	},
	keyCounts: {},
	keys: {},
	custom: {},
	onDown: new Listener,
	onUp: new Listener
};
let M = {
	down: false,
	x: 0,
	y: 0,
	last: {
		x: 0,
		y: 0
	},
	button: 0,
	dragStart: new Vector2(0, 0),
	dragEnd: new Vector2(0, 0),
	custom: {},
	updatePosition: function (e) {
		this.x = e.clientX - (innerWidth - width) / 2;
		this.y = e.clientY - (innerHeight - height) / 2;
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
};
document.addEventListener("keydown", function (e) {
	for (let ev of K.onDown) ev(e);
	K.keys[e.key] = true;
});
document.addEventListener("keyup", function (e) {
	if (e.key.toUpperCase() === e.key) {
		K.keys[e.key.toLowerCase()] = false;
	}
	K.keys[e.key] = false;
	for (let ev of K.onUp) ev(e);
});
document.addEventListener("click", function (e) {
	M.button = e.button;
	M.engineClick(e);
	for (let ev of M.onClick) ev(e);
});
document.addEventListener("mousedown", function (e) {
	M.button = e.button;
	if (M.engine) M.dragStart = M.dragEnd = M.engine.scene.screenSpaceToWorldSpace(new Vector2(e.x, e.y));
	M.updatePosition(e);
	M.down = true;
	for (let ev of M.onDown) ev(e);
});
document.addEventListener("mousemove", function (e) {
	M.updatePosition(e);
	if (M.engine) M.dragEnd = M.engine.scene.screenSpaceToWorldSpace(new Vector2(e.x, e.y));
	M.engineMove(e);
	for (let ev of M.onMove) ev(e);
});
document.addEventListener("mouseup", function (e) {
	M.button = e.button;
	M.updatePosition(e);
	if (M.engine) M.dragEnd = M.engine.scene.screenSpaceToWorldSpace(new Vector2(e.x, e.y));
	M.down = false;
	for (let ev of M.onUp) ev(e);
});
document.addEventListener("contextmenu", function (e) {
	M.button = e.button;
	e.preventDefault();
	M.updatePosition(e);
	M.down = false;
	for (let ev of M.onRight) ev(e);
	M.engineRightClick(e);
});
document.addEventListener("wheel", function (e) {
	M.button = e.button;
	for (let ev of M.onScroll) ev(e.deltaY);
});