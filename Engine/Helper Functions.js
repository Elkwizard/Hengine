class FunctionLibrary{
	constructor(){
		
	}
	countProperties(obj){
		let n = 0;
		for(let x in obj){
			n++;
		}
		return n;
	}
	objToAry(obj){
		let ary = [];
		for(let x in obj) {
			ary.push(obj[x]);
		}
		return ary;
	}
	getDistance(x1, y1, x2, y2){
		if(typeof x1 == "object"){
			x2 = y1.x;
			y2 = y1.y;
			y1 = x1.y;
			x1 = x1.x;
		}
		let distance1 = (x2-x1)**2
		let distance2 = (y2-y1)**2
		return Math.sqrt(distance1+distance2)
	}
	getDistance3D(point, point2){
		let distX = (point.x - point2.x) ** 2;
		let distY = (point.y - point2.y) ** 2;
		let distZ = (point.z - point2.z) ** 2;
		return Math.sqrt(distX + distY + distZ);
	}
	getDistance4D(point, point2){
		let distX = (point.x - point2.x) ** 2;
		let distY = (point.y - point2.y) ** 2;
		let distZ = (point.z - point2.z) ** 2;
		let distW = (point.w - point2.w) ** 2;
		return Math.sqrt(distX + distY + distZ + distW);
	}
	extend(a, b){
		return a + (b*Math.sign(a))
	}
	contract(a, b){
		return a - (b*Math.sign(a))
	}
	randIntVal(min, max){
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	randFloatVal(min, max){
		return (Math.random() * (max - min)) + min;
	}
	randBool(){
		return Math.random() > 0.5
	}
	randString(length){
		let chars = "`1234567890-=~!@#$%^&*()_+qwertyuiop[]\\QWERTYUIOP{}|asdfghjkl;'ASDFGHJKL:\"\nzxcvbnm,./ZXCVBNM<>? ".split("");
		let str = "";
		for(let i = 0; i < length; i++){
			str += chars[this.randIntVal(0, chars.length-1)];
		}
		return str;
	}
	parseBool(str){
		if(str.search(/true/g) > -1) return true;
		if(str.search(/false/g) > -1) return false;
		return undefined;
	}
	parseArray(str){
		let aryStr = "";
		let state = 0;
		let objState = 0;
		for(let char of str){
			if(char == "[") state++;
			if(char == "]") state--;
			if(char == "{") objState++;
			if(char == "}") objState--;
			if(state >= 1) {
				if(objState > 0 && char == ",") {
					aryStr += "__C_O_M_M_A__";
				} else { 
					aryStr += char;
				}
			}
		}
		let ary2 = aryStr.slice(1, aryStr.length);
		ary2 = ary2.split(",");
		for(let i = 0; i < ary2.length; i++){
			let x = ary2[i];
			x = x.trim();
			if(x[0] == "\"" || x[0] == "'"){
				ary2[i] = x.slice(1, x.length-1);
			} else if (x[0] == "[") {
				ary2[i] = this.parseArray(x);
			} else if (x[0] == "{"){
				let newX = x.replace(/__C_O_M_M_A__/g, ",");
				ary2[i] = JSON.parse(newX);
			} else if (this.parseBool(x) != undefined){
				ary2[i] = this.parseBool(x);
			} else {
				ary2[i] = parseFloat(x);
			}
		}
		return ary2;
	}
	round(x, y){
		return Math.floor(x * (10 ** y))/(10 ** y);
	}
}