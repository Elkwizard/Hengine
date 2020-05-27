
Function.prototype.add = function (fn = function () { }) {
	let self = this;
	return function (...a) {
		self(...a);
		return fn(...a);
	};
}
Function.prototype.param = function (...args) {
	return function () {
		this(...args);
	};
}
Function.prototype.performance = function (...args) {
	const t_1 = performance.now();
	const iter = 100;
	for (let i = 0; i < iter; i++) {
		this(...args);
	}
	const t_2 = performance.now();
	return (t_2 - t_1) / iter;
}
Array.prototype.randomize = function() {
	const result = [];
	const copy = [...this];
	while (copy.length) {
		result.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
	}
	return result;
}
Array.prototype.sum = function() {
	return this.reduce((a, b) => a + b);
}
Number.prototype.toDegrees = function () {
	return this * (180 / Math.PI);
}
Number.prototype.toRadians = function () {
	return this * (Math.PI / 180);
}
Number.prototype.sin01 = function () {
	return (Math.sin(this) + 1) / 2;
}
Number.prototype.cos01 = function () {
	return (Math.cos(this) + 1) / 2;
}
Number.prototype.approxSqrt = function (amt = 5) {
	let g = 1 / this;
	for (let i = 0; i < amt; i++) g = (g + this / g) / 2;
	return g;
}
Number.prototype.movedTowards = function (value, ferocity) {
	let dir = ferocity * (value - this) * 2;
	return this + dir;
}
String.prototype.capitalize = function () {
	return this[0].toUpperCase() + this.slice(1);
}
String.prototype.cut = function (char) {
	const inx = this.indexOf(char);
	if (inx === -1) return [this, ""];
	return [
		this.slice(0, inx),
		this.slice(inx)
	];
}
Object.prototype.toString = function (depth = 0) {
	if (depth < 1) {
		let ary = [];
		let ary2 = [];
		for (let x in this) {
			ary2.push(x);
		}
		let thisName = this.constructor.name;
		function getString(item) {
			let toStr = "";
			if (typeof item !== "object") {
				if (typeof item === "string") toStr = `"${item}"`;
				else toStr = (item + "").replace("[native code]", "C++");
			} else {
				if (Array.isArray(item)) {
					if (!item.length) toStr = "Array(0): []";
					else {
						toStr = "Array(" + item.length + "): [\n";
						for (let i of item) {
							if (typeof i === "function") toStr += "\t\t" + getString(i) + ",\n";
							else toStr += "\t" + getString(i) + "\n";
						}
						toStr += "\t]";
					}
				} else if (item !== null) toStr = item.toString(depth + 1)
				else toStr = "null";
			}
			return toStr;
		}
		for (let i = 0; i < ary2.length; i++) {
			let x = ary2[i];
			let toStr = "";
			toStr = getString(this[x]);
			ary.push("\t" + x + ": " + toStr);
		}
		let result = thisName + ": {\n" + ary.join(",\n") + "\n}";
		return result;
	} else {
		return "[object " + this.constructor.name + "]";
	}
}
Object.prototype[Symbol.iterator] = function* () {
	for (let x in this) {
		yield [x, this[x]];
	}
}