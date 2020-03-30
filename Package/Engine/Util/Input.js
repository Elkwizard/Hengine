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
class KeyboardHandler {
	constructor() {
		this.keyCounts = {};
		this.keys = {};
		this.custom = {};
		this.onDown = new Listener();
		this.onUp = new Listener();
		let k = this;
		document.addEventListener("keydown", function (e) {
			for (let ev of k.onDown) ev(e);
			k.keys[e.key] = true;
		});
		document.addEventListener("keyup", function (e) {
			if (e.key.toUpperCase() === e.key) {
				k.keys[e.key.toLowerCase()] = false;
			}
			k.keys[e.key] = false;
			for (let ev of k.onUp) ev(e);
		});
	}
	P(key) {
		return !!this.keys[key];
	}
	JP(key) {
		return this.keyCounts[key] == 1;
	}
	update() {
		for (let key in this.keys) {
			if (!this.keyCounts[key]) this.keyCounts[key] = 0;
			if (this.P(key)) this.keyCounts[key]++;
			else this.keyCounts[key] = 0;
		}
	}
}
class MouseHandler {
	constructor() {
		this.down = false
		this.x = 0
		this.y = 0
		this.last = {
			x: 0,
			y: 0
		}
		this.button = 0
		this.dragStart = Vector2.origin
		this.dragEnd = Vector2.origin
		this.custom = {}
		this.onDown = new Listener();
		this.onUp = new Listener();
		this.onClick = new Listener();
		this.onRight = new Listener();
		this.onScroll = new Listener();
		this.onMove = new Listener();
		this.engine = null;
		this.engineClick = e => e;
		this.engineRightClick = e => e;
		this.engineMove = e => e;
		let m = this;
		// document.addEventListener("touchstart", function (e) {
		// 	m.button = 0;
		// 	let evt = e.changedTouches[0];
		// 	m.updatePosition(evt, "touch");
		// 	m.down = true;
		// });
		// document.addEventListener("touchmove", function (e) {
		// 	let evt = e.changedTouches[0];
		// 	m.updatePosition(evt, "touch");
		// 	m.engineMove(evt);
		// });
		// document.addEventListener("touchend", function (e) {
		// 	let evt = e.changedTouches[0];
		// 	m.updatePosition(evt, "touch");
		// 	m.engineClick(evt);
		// 	m.down = false;
		// });
		// document.addEventListener("touchcancel", function (e) {
		// 	m.updatePosition("touch");
		// });
		document.addEventListener("click", function (e) {
			m.button = e.button;
			m.updatePosition(e, "click");
			m.engineClick(e);
			for (let ev of m.onClick) ev(e);
		});
		document.addEventListener("mousedown", function (e) {
			m.button = e.button;
			m.updatePosition(e, "down");
			if (m.engine) {
				let adjusted = m.engine.scene.screenSpaceToWorldSpace(m)
				m.dragStart = m.dragEnd = adjusted;
			}
			m.down = true;
			for (let ev of m.onDown) ev(e);
		});
		document.addEventListener("mousemove", function (e) {
			m.updatePosition(e, "move");
			if (m.engine && m.down) {
				let adjusted = m.engine.scene.screenSpaceToWorldSpace(m);
				m.dragEnd = adjusted;
			}
			m.engineMove(e);
			for (let ev of m.onMove) ev(e);
		});
		document.addEventListener("mouseup", function (e) {
			m.button = e.button;
			m.updatePosition(e, "up");
			if (m.engine) {
				let adjusted = m.engine.scene.screenSpaceToWorldSpace(m);
				m.dragEnd = adjusted;
			}
			m.down = false;
			for (let ev of m.onUp) ev(e);
		});
		this.__right__ = function (e) {
			m.button = e.button;
			e.preventDefault();
			m.updatePosition(e, "right");
			m.down = false;
			for (let ev of m.onRight) ev(e);
			m.engineRightClick(e);
		}
		document.addEventListener("contextmenu", this.__right__);
		document.addEventListener("wheel", function (e) {
			m.button = e.button;
			for (let ev of m.onScroll) ev(e.deltaY);
		});
	}
	updatePosition(e, name) {
		try {
			this.x = e.clientX - (innerWidth - width) / 2;
			this.y = e.clientY - (innerHeight - height) / 2;
		} catch (e) {
			this.x = e.clientX;
			this.y = e.clientY;
		}
	}
	allowSave() {
		document.removeEventListener("contextmenu", this.__right__);
	}
}
const K = new KeyboardHandler();
const M = new MouseHandler();