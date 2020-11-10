class SceneElement {
	constructor(name, active, container) {
		this.container = container;
		this.name = name;
		this.active = active;
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
	activate() {
		this.active = true;
	}
	deactivate() {
		this.active = false;
	}
	remove() {
		this.removed = true;
	}
}