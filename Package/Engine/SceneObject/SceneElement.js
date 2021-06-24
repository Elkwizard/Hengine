class SceneElement {
	constructor(name, container) {
		this.container = container;
		this.name = name;
		this.removed = false;
	}
	set name(a) {
		if (this.container) {
			this.container.elements.delete(this._name);
			this._name = a;
			this.container.elements.set(this._name, this);
		} else this._name = a;
	}
	get name() {
		return this._name;
	}
	set active(a) {
		if (this._active !== a) {
			if (a) this.activate();
			else if (this._active !== undefined) this.deactivate();
		}
		this._active = a;
	}
	get active() {
		return this._active;
	}
	activate() { }
	deactivate() { }
	remove() {
		this.removed = true;
	}
}