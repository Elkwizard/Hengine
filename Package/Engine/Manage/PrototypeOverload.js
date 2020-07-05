window.assert = function(condition, name) {
	if (!condition) console.warn(`Assertion "${name}" failed.`);
};
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
Array.dim2 = function (w, h, fn = (x, y) => null) {
	let ary = [];
	for (let i = 0; i < w; i++) {
		ary.push([]);
		for (let j = 0; j < h; j++) ary[i].push(fn(i, j));
	}
	ary[Symbol.iterator] = function* () {
		for (let i = 0; i < this.length; i++)
			for (let j = 0; j < this[0].length; j++) yield [i, j];
	};
	ary.width = w;
	ary.height = h;
	ary.map = function (fn) {
		let nAry = Array.dim2(w, h);
		for (let i = 0; i < this.length; i++)
			for (let j = 0; j < this[0].length; j++) nAry[i][j] = fn(this[i][j], i, j, this);
		return nAry;
	}
	return ary;
};
Array.dim3 = function (w, h, d, fn = (x, y, z) => null) {
	let ary = [];
	for (let i = 0; i < w; i++) {
		ary.push([]);
		for (let j = 0; j < h; j++) {
			ary[i].push([]);
			for (let k = 0; k < d; k++) ary[i][j].push(fn(i, j, k));
		}
	}
	ary.width = w;
	ary.height = h;
	ary.depth = d;
	ary[Symbol.iterator] = function* () {
		for (let i = 0; i < this.length; i++)
			for (let j = 0; j < this[0].length; j++)
				for (let k = 0; k < this[0][0].length; k++) yield [i, j, k];
	};
	ary.map = function (fn) {
		let nAry = Array.dim3(w, h, d);
		for (let i = 0; i < this.length; i++)
			for (let j = 0; j < this[0].length; j++)
				for (let k = 0; k < this[0][0].length; k++) nAry[i][j][k] = fn(this[i][j][k], i, j, k, this);
		return nAry;
	}
	return ary;
};
Array.dim = function (dimension, ...size) {
	let ary = [];
	if (dimension !== 1) {
		let d = size[0];
		size.shift();
		for (let i = 0; i < d; i++) ary.push(Array.dim(dimension - 1, ...size));
	} else for (let i = 0; i < size[0]; i++) ary.push(null);
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