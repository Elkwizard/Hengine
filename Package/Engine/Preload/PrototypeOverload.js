window.assert = function (condition, name) {
	if (!condition) console.warn(`Assertion "${name}" failed.`);
};
window.define = function (name, value) {
	delete window[name];
	Object.defineProperty(window, name, {
		get() {
			return value();
		}
	});
};
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
(function () {
	function proto(obj, name, value) {
		Object.defineProperty(obj, name, {
			value,
			enumerable: false
		});
	}
	//Function
	proto(Function.prototype, "param", function (...args) {
		return function () {
			this(...args);
		};
	});
	proto(Function.prototype, "performance", function (iter, ...args) {
		const t_1 = performance.now();
		for (let i = 0; i < iter; i++) {
			this(...args);
		}
		const t_2 = performance.now();
		return (t_2 - t_1) / iter;
	});
	//Array
	proto(Array.prototype, "pushArray", function (arr) {
		let len = arr.length;
		for (let i = 0; i < len; i++) this.push(arr[i]);
	});
	proto(Array.prototype, "map", function (fn, ...coords) {
		let result = [];
		for (let i = 0; i < this.length; i++) result.push(fn(this[i], ...coords, i));
		return result;
	});
	proto(Array.prototype, "forEach", function (fn, ...coords) {
		for (let i = 0; i < this.length; i++) fn(this[i], ...coords, i);
	});
	proto(Array.prototype, "flatten", function () {
		return this;
	});
	proto(Array.prototype, "sample", function (index) {
		if (index in this) return this[index];
		return null;
	});
	Array.makeMultidimensional = function (arr) {
		arr.multiDimensional = true;
		arr.sample = function (...indices) {
			let index = indices[0];
			indices.shift();
			if (index in this) return this[index].sample(...indices);
			return null;
		}.bind(arr);
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
	proto(Array.prototype, "test", function (test) {
		for (let i = 0; i < this.length; i++) if (test(this[i])) return true;
		return false;
	});
	proto(Array.prototype, "randomize", function () {
		const result = [];
		const copy = [...this];
		while (copy.length) {
			result.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
		}
		return result;
	});
	proto(Array.prototype, "total", function () {
		return this.reduce((a, b) => a + b);
	});
	//Number
	proto(Number.prototype, "toDegrees", function () {
		return this * (180 / Math.PI);
	});
	proto(Number.prototype, "toRadians", function () {
		return this * (Math.PI / 180);
	});
	proto(Number.prototype, "movedTowards", function (value, ferocity) {
		let dir = ferocity * (value - this) * 2;
		return this + dir;
	});
	proto(Number.prototype, "toMaxed", function (digits) {
		return Math.round(this * 10 ** digits) / 10 ** digits + "";
	});
	//String
	proto(String.prototype, "capitalize", function () {
		return this[0].toUpperCase() + this.slice(1);
	});
	proto(String.prototype, "cut", function (char) {
		const inx = this.indexOf(char);
		if (inx === -1) return [this, ""];
		return [
			this.slice(0, inx),
			this.slice(inx + 1)
		];
	});
	proto(String.prototype, "pad", function (size) {
		return " ".repeat(size - this.length) + this;
	});
	proto(String.prototype, "indent", function () {
		return this.split("\n").map(str => "\t" + str).join("\n");
	});
	proto(String.prototype, "inverseMatchAll", function (regex) {
		let validMap = new Array(this.length).fill(true);

		let result = [];

		let matchAll = this.matchAll(regex);
		for (let match of matchAll) {
			let full = match[0];
			let index = match.index;
			for (let i = 0; i < full.length; i++) validMap[index + i] = false;
		}

		for (let i = 0; i < this.length; i++) {
			let acc = "";
			let startIndex = i;
			while (validMap[i]) {
				acc += this[i];
				i++;
			}
			if (acc.length) {
				let match = [acc];
				match.index = startIndex;
				match.input = this + "";
				match.groups = undefined;
				result.push(match);
			}
		}

		return result;
	});
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
		proto(Object.prototype, "toString", function (depth = 0) {
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
		});
	})();
	proto(Array.prototype, "toString", Object.prototype.toString);
	//Object
	Object.prototype[Symbol.iterator] = function* () {
		for (let x in this) {
			yield [x, this[x]];
		}
	};

	//Make Number behave like Operable
	Number.abs = n => Math.abs(n);
	Number.clamp = (n, a, b) => Math.max(a, Math.min(b, n));
	Number.lerp = (a, b, t) => a * (1 - t) + b * t;
	Number.remap = (n, a, b, a2, b2) => (n - a) / (b - a) * (b2 - a2) + a2;
	Number.min = (a, b) => Math.min(a, b);
	Number.max = (a, b) => Math.max(a, b);
	Object.defineProperty(Number.prototype, "mag", {
		get() {
			return Math.abs(this);
		}
	});
	Object.defineProperty(Number.prototype, "sqrMag", {
		get() {
			return this ** 2;
		}
	})
	proto(Number.prototype, "plus", function (n) { return this + n; });
	proto(Number.prototype, "minus", function (n) { return this - n; });
	proto(Number.prototype, "times", function (n) { return this * n; });
	proto(Number.prototype, "over", function (n) { return this / n; });
	proto(Number.prototype, "get", function () { return this; });
	proto(Number.prototype, "equals", function (n) { return Math.abs(this - n) < 0.00000001; });

	Number.empty = 0;
})();