function clamp(n, a, b) {
	return Math.max(a, Math.min(b, n));
}
function remap(n, a, b, a2, b2) {
	let t = (n - a) / (b - a);
	return a2 * (1 - t) + b2 * t;
}
function threshold(n, t) {
	return !!(n > t);
}
function assert(condition, name) {
	if (!condition) console.warn(`Assertion "${name}" failed.`);
}
let globalSquareRoots = 0;
let sqrt = Math.sqrt.bind(Math);
Math.sqrt = function(n) {
	globalSquareRoots++;
	return sqrt(n);
}
Function.prototype.add = function (fn = function () { }) {
	let self = this;
	return function (...a) {
		self(...a);
		return fn(...a);
	};
};
Function.prototype.param = function (...args) {
	return function () {
		this(...args);
	};
};
Function.performanceIterations = 100;
Function.prototype.performance = function (...args) {
	const t_1 = performance.now();
	const iter = Function.performanceIterations;
	for (let i = 0; i < iter; i++) {
		this(...args);
	}
	const t_2 = performance.now();
	return (t_2 - t_1) / iter;
};
Array.prototype.map = function (fn, ...coords) {
	let result = [];
	if (this.length && Array.isArray(this[0]) && this.multiDimensional) {
		result.multiDimensional = true;
		for (let i = 0; i < this.length; i++) result.push(this[i].map(fn, ...[...coords, i]));
	} else if (this.length) 
		for (let i = 0; i < this.length; i++) result.push(fn(this[i], ...coords, i));
	return result;
};
Array.prototype.flatten = function () {
	if (this.length) {
		let result = [];
		if (Array.isArray(this[0]) && this.multiDimensional) for (let i = 0; i < this.length; i++) result.push(...this[i].flatten());
		else for (let i = 0; i < this.length; i++) result.push(this[i]);
		return result;
	}
	return [];
}
Array.prototype[Symbol.iterator] = function* () {
	let all = this.flatten();
	for (let i = 0; i < all.length; i++) yield all[i];
};
Array.dim = function (...dims) {
	let ary = [];
	if (dims.length > 1) {
		let dim = dims.shift();
		for (let i = 0; i < dim; i++) ary.push(Array.dim(...dims));
	} else {
		for (let i = 0; i < dims[0]; i++) ary.push(null);
	}
	ary.multiDimensional = true;
	return ary;
};
Array.prototype.test = function (test) {
	for (let i = 0; i < this.length; i++) if (test(this[i])) return true;
	return false;
};
Array.prototype.randomize = function () {
	const result = [];
	const copy = [...this];
	while (copy.length) {
		result.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
	}
	return result;
};
Array.prototype.sum = function () {
	return this.reduce((a, b) => a + b);
};
Number.prototype.toDegrees = function () {
	return this * (180 / Math.PI);
};
Number.prototype.toRadians = function () {
	return this * (Math.PI / 180);
};
Number.prototype.sin01 = function () {
	return (Math.sin(this) + 1) / 2;
};
Number.prototype.cos01 = function () {
	return (Math.cos(this) + 1) / 2;
};
Number.prototype.approxSqrt = function (amt = 5) {
	let g = 1 / this;
	for (let i = 0; i < amt; i++) g = (g + this / g) / 2;
	return g;
};
Number.prototype.movedTowards = function (value, ferocity) {
	let dir = ferocity * (value - this) * 2;
	return this + dir;
};
String.prototype.capitalize = function () {
	return this[0].toUpperCase() + this.slice(1);
};
String.prototype.cut = function (char) {
	const inx = this.indexOf(char);
	if (inx === -1) return [this, ""];
	return [
		this.slice(0, inx),
		this.slice(inx)
	];
};
String.prototype.indent = function () {
	return this.split("\n").map(str => "\t" + str).join("\n");
};
(function () {
	function tabs(str) {
		let tabs = str.match(/(    |\t)/g);
		tabs = tabs ? tabs.length : 0;
		return tabs;
	}
	function cls(obj) {
		return obj.constructor.name;
	}
	function string(value, depth) {
		if (!value) return value + "";
		if (typeof value === "string") return `"${value}"`;
		if (typeof value === "number") return value + "";
		if (typeof value === "function") {
			value += "";
			let lines = value.split("\n");
			if (lines.length <= 1) return value;
			let tbs = tabs(lines[0]);
			let tbs1 = tabs(lines[1]) - 1;
			if (tbs1 <= tbs) return value;
			else {
				while (tabs(lines[1]) - 1 > tbs) {
					lines = lines.map((l, i) => i ? l.replace(/(\t|    )/, "") : l);
				}
				return lines.join("\n");
			}
		}
		return value.toString(depth);
	}
	Object.prototype.toString = function (depth = 0) {
		if (depth < 0) return "[object " + cls(this) + "]";

		let contents = [];
		for (let key in this) {
			let statement = "";
			statement += key + ": " + string(this[key], depth - 1);
			contents.push(statement);
		}
		if (!contents.length) return cls(this) + "(0) { }";
		return `${cls(this)}(${contents.length}) { 
${contents.join(",\n").indent()}
}`.replace(/\t/g, "   ");
	}
})();
Array.prototype.toString = Object.prototype.toString;
Object.prototype[Symbol.iterator] = function* () {
	for (let x in this) {
		yield [x, this[x]];
	}
}