class Lazy {
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