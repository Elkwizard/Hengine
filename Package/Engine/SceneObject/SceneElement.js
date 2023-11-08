/**
 * Represents a node of the scene tree.
 * @abstract
 * @prop SceneElement/null container | The parent node of this element
 * @prop String name | The name of this element. This can be anything, but no two children of the same node may have the same name
 * @prop Boolean removed | Whether or not this element exists in the scene. Changes to this variable will only remove the object at the end of the update cycle, so it is possible for this to be true while the element still exists. This cannot be set back to true once it is false
 */
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
	/**
	 * Removes the element from the parent element. This will take until the end of the update cycle to take effect. 
	 */
	remove() {
		this.removed = true;
	}
}