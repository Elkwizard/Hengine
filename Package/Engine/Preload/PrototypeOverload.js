Number.clamp = function (n, a, b) {
	return Math.max(a, Math.min(b, n));
}
Number.remap = function (n, a, b, a2, b2) {
	return Number.lerp(a2, b2, (n - a) / (b - a));
}
Number.threshold = function (n, t) {
	return !!(n > t);
}
function assert(condition, name) {
	if (!condition) console.warn(`Assertion "${name}" failed.`);
}
function define(name, value) {
	delete window[name];
	Object.defineProperty(window, name, {
		get() {
			return value();
		}
	});
}
Object.defineProperty(window, "title", {
	get() {
		let tag = document.getElementsByTagName("title")[0];
		if (!tag) return "";
		return tag.innerText;
	},
	set(a) {
		let tag = document.getElementsByTagName("title")[0];
		if (!tag) {
			tag = document.createElement("title");
			document.head.appendChild(tag);
		}
		tag.innerText = a;
	}
});
//Function
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
//Array
Array.prototype.pushArray = function (arr) {
	let len = arr.length;
	for (let i = 0; i < len; i++) this.push(arr[i]);
};
Array.prototype.map = function (fn, ...coords) {
	let result = [];
	for (let i = 0; i < this.length; i++) result.push(fn(this[i], ...coords, i));
	return result;
};
Array.prototype.forEach = function (fn, ...coords) {
	for (let i = 0; i < this.length; i++) fn(this[i], ...coords, i);
};
Array.prototype.flatten = function () {
	return this;
};
Array.prototype.sample = function (index) {
	if (index in this) return this[index];
	return null;
}
Array.makeMultidimensional = function (arr) {
	arr.multiDimensional = true;
	arr.sample = function (...indices) {
		let index = indices[0];
		indices.shift();
		if (index in this) return this[index].sample(...indices);
		return null;
	};
	arr.flatten = function () {
		let result = [];
		for (let i = 0; i < this.length; i++) result.pushArray(this[i].flatten());
		return result;
	}.bind(arr);
	arr[Symbol.iterator] = function* () {
		let all = this.flatten();
		for (let i = 0; i < all.length; i++) yield all[i];
	}.bind(arr);
	arr.forEach = function (fn, ...coords) {
		for (let i = 0; i < this.length; i++) this[i].forEach(fn, ...coords, i);
	}.bind(arr);
	arr.map = function (fn, ...coords) {
		let result = [];
		Array.makeMultidimensional(result);
		for (let i = 0; i < this.length; i++) result.push(this[i].map(fn, ...coords, i));
		return result;
	}.bind(arr);
	arr.fill = function (value) {
		for (let i = 0; i < this.length; i++) this[i].fill(value);
		return this;
	}.bind(arr);
}
Array.dim = function (...dims) {
	let ary = [];
	if (dims.length > 1) {
		let dim = dims.shift();
		Array.makeMultidimensional(ary);
		for (let i = 0; i < dim; i++) ary.push(Array.dim(...dims));
	} else {
		for (let i = 0; i < dims[0]; i++) ary.push(null);
	}
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
Array.prototype.total = function () {
	return this.reduce((a, b) => a + b);
};
//Number
Number.prototype.toDegrees = function () {
	return this * (180 / Math.PI);
};
Number.prototype.toRadians = function () {
	return this * (Math.PI / 180);
};
Number.prototype.movedTowards = function (value, ferocity) {
	let dir = ferocity * (value - this) * 2;
	return this + dir;
};
Number.prototype.toMaxed = function (digits) {
	return Math.round(this * 10 ** digits) / 10 ** digits + "";
};
//String
String.prototype.capitalize = function () {
	return this[0].toUpperCase() + this.slice(1);
};
String.prototype.cut = function (char) {
	const inx = this.indexOf(char);
	if (inx === -1) return [this, ""];
	return [
		this.slice(0, inx),
		this.slice(inx + 1)
	];
};
String.prototype.pad = function (size) {
	return " ".repeat(size - this.length) + this;
}
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
		if (typeof value === "string") return JSON.stringify(value);
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
//Object
Object.prototype[Symbol.iterator] = function* () {
	for (let x in this) {
		yield [x, this[x]];
	}
};

//Make Number behave like Operable
Number.prototype.abs = function () { return Math.abs(this); };
Number.lerp = function (a, b, t) { return a * (1 - t) + b * t; };
Number.prototype.plus = function (n) { return this + n; };
Number.prototype.minus = function (n) { return this - n; };
Number.prototype.times = function (n) { return this * n; };
Number.prototype.over = function (n) { return this / n; };
Number.prototype.get = function () { return this; };
Number.prototype.equals = function (n) { return Math.abs(this - n) < 0.00000001; }
Number.empty = 0;