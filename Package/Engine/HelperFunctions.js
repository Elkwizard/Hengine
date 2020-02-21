class FunctionLibrary {
	countProperties(obj) {
		let n = 0;
		for (let x in obj) {
			n++;
		}
		return n;
	}
	objToAry(obj) {
		let ary = [];
		for (let x in obj) {
			ary.push(obj[x]);
		}
		return ary;
	}
	getDistance(x1, y1, x2, y2) {
		if (typeof x1 == "object") {
			x2 = y1.x;
			y2 = y1.y;
			y1 = x1.y;
			x1 = x1.x;
		}
		let distance1 = (x2 - x1) ** 2;
		let distance2 = (y2 - y1) ** 2;
		return Math.sqrt(distance1 + distance2);
	}
	getDistance3D(point, point2) {
		let distX = (point.x - point2.x) ** 2;
		let distY = (point.y - point2.y) ** 2;
		let distZ = (point.z - point2.z) ** 2;
		return Math.sqrt(distX + distY + distZ);
	}
	getDistance4D(point, point2) {
		let distX = (point.x - point2.x) ** 2;
		let distY = (point.y - point2.y) ** 2;
		let distZ = (point.z - point2.z) ** 2;
		let distW = (point.w - point2.w) ** 2;
		return Math.sqrt(distX + distY + distZ + distW);
	}
	extend(a, b) {
		return a + (b * Math.sign(a));
	}
	contract(a, b) {
		return a - (b * Math.sign(a));
	}
	randIntVal(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	randFloatVal(min, max) {
		return (Math.random() * (max - min)) + min;
	}
	randBool() {
		return Math.random() > 0.5;
	}
	randString(length) {
		let chars = "`1234567890-=~!@#$%^&*()_+qwertyuiop[]\\QWERTYUIOP{}|asdfghjkl;'ASDFGHJKL:\"\nzxcvbnm,./ZXCVBNM<>? ".split("");
		let str = "";
		for (let i = 0; i < length; i++) {
			str += chars[this.randIntVal(0, chars.length - 1)];
		}
		return str;
	}
	parseBool(str) {
		if (str.search(/true/g) > -1) return true;
		if (str.search(/false/g) > -1) return false;
		return undefined;
	}
	parseArray(str) {
		return JSON.parse(str);
	}
	round(x, y) {
		return Math.floor(x * (10 ** y)) / (10 ** y);
	}
}