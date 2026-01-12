
/**
 * Subclasses of this class represent a set of unique symbolic values.
 * @abstract
 * ```js
 * const Options = Enum.define("YES", "NO", "MAYBE");
 * const answer = Options.YES;
 * ```
 * @prop<immutable> String name | The name of the symbol
 */
class Enum {
	constructor(name) {
		this.name = name;
	}

	/**
	 * Returns the name of the symbolic value.
	 * @return String
	 */
	toString() {
		return this.name;
	}

	/**
	 * Creates a new subclass of Enum based on a specific set of unique names.
	 * Static properties with these names will be defined on the return value and will contain the associated symbolic values.
	 * @param String[] ...names | The names for the symbolic values
	 * @return Class extends Enum
	 */
	static define(...names) {
		const enumeration = class extends Enum { };
		for (let i = 0; i < names.length; i++) {
			const name = names[i];
			Object.defineProperty(enumeration, name, {
				value: new enumeration(name),
				writable: false,
				enumerable: true
			});
		}
		return Object.freeze(enumeration);
	}
}