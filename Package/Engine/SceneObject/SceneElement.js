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
	remove() {
		this.removed = true;
	}
}