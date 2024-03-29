/**
 * Facilitates the creation of lazily-evaluated expressions.
 * ```js
 * const object = { };
 * Lazy.define(object, "lazy", () => { // an expensive operation
 * 	let result = 0;
 * 	for (let i = 0; i < 1e6; i++)
 * 		result += Random.random();
 * 	return result;
 * });
 * 
 * console.log(object.lazy); // takes a while
 * console.log(object.lazy); // cheap from now on
 * ```
 */
class Lazy {
	/**
	 * Defines a lazy-evaluated property of an object.
	 * The first access to the property will calculate the result, which will be cached and returned on all future accesses.
	 * @param Object obj | The target object for the property
	 * @param String name | The key for the property
	 * @param () => Any calculateValue | The no-argument function used to initially compute the value.
	 */
	static define(obj, name, getValue) {
		let evaluated = false;
		let value = null;
		Object.defineProperty(obj, name, {
			set(newValue) {
				getValue = () => newValue;
			},
			get() {
				if (!evaluated) {
					evaluated = true;
					value = getValue();
				}
				return value;
			}
		});
	}
}