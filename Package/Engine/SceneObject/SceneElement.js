/**
 * Represents a node of the scene tree.
 * @abstract
 * @prop SceneElement/null container | The parent node of this element
 * @prop String name | The name of this element. This can be anything, but no two children of the same node may have the same name
 * @prop Boolean removed | Whether or not this element has been removed from the scene. Changes to this variable will only remove the object at the end of the update cycle, so it is possible for this to be true while the element still exists. This variable is read-only
 * @prop Boolean inScene | Whether this element is in the scene tree. This is only false if the object is not in the scene, and will still be true while the object is marked for removal but still present. This variable is read-only
 */
class SceneElement {
	constructor(name, container) {
		this.container = container;
		this.name = name;
		this.removed = false;
		this.inScene = true;
	}
	set name(a) {
		if (this.container) {
			this.container.elements.delete(this._name);
			this._name = this.container.genName(this.container.elements, a);
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