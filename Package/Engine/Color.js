class Color{
	constructor(r, g, b, a){
		let red = 0;
		let green = 0;
		let blue = 0;
		let alpha = 0;
		this.custom = {};
		if (b === undefined && g === undefined && typeof r == "string") {
			function parseRGBA(str){
				let rgba = "";
				let state = false;
				for(let char of str){
					if(char == ")" || char == "("){
						state = !state;
					}
					else if(state){
						rgba += char;
					}
				}
				let rgbaList = rgba.split(",");
				red = parseFloat(rgbaList[0]);
				green = parseFloat(rgbaList[1]);
				blue = parseFloat(rgbaList[2]);
				alpha = (rgbaList.length > 3)? parseFloat(rgbaList[3]):1;
			}
			if (r[0] == "r") {
				parseRGBA(r);
			} else if (r[0] == "#") {
				function hexToNum(hex){
					if(isNaN(parseInt(hex))){
						switch(hex){
							case "a":
								return 10;
							case "b":
								return 11;
							case "c":
								return 12;
							case "d": 
								return 13;
							case "e":
								return 14;
							case "f":
								return 15;
						}
					} else {
						return parseInt(hex);
					}
				}
				function parseHex(chars){
					let c1 = chars[0];
					let c2 = chars[1];
					let result = 0;
					result += hexToNum(c1) * 16;
					result += hexToNum(c2);
					return result;
				}
				let rgb = "rgb(";
				let groups = ["", "", ""];
				let n = 0;
				if(r.length === 4){
					let newR = "";
					for(let char of r){
						if(char !== "#"){
							newR += char + char;
						}
					}
					r = "#" + newR;
				}
				for(let char of r){
					if(char != "#"){
						n++;
						groups[Math.floor((n-1)/2)] += char;
					}
				}
				n = 0;
				for(let group of groups){
					n++;
					rgb += parseHex(group) + ((n == 3)? "":", ");
				}
				rgb += ")";
				parseRGBA(rgb);
			}
		} else {
			red = (r === undefined)? 0:r;
			green = (g === undefined)? 0:g;
			blue = (b === undefined)? 0:b;
			alpha = (a === undefined)? 1:a;
		}
		this.red = red;
		this.green = green;
		this.blue = blue;
		this.alpha = alpha;
		this.constrain();
	}
	static numToHex(num){
		let a = Math.floor(num / 16);
		let b = Math.floor(num % 16);
		let hexAry = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
		return hexAry[a] + hexAry[b];
	}
	static random(){
		return new Color(Math.random()*255, Math.random()*255, Math.random()*255, Math.random());
	}
	static add(c1, c2){
		let mixer = new Color(0, 0, 0, 0);
		mixer.add(c1);
		mixer.add(c2);
		return mixer;
	}
	static sub(c1, c2){
		let mixer = new Color(0, 0, 0, 0);
		mixer.add(c1);
		mixer.sub(c2);
		return mixer;
	}
	static div(c1, c2){
		let mixer = new Color(0, 0, 0, 0);
		mixer.add(c1);
		mixer.div(c2);
		return mixer;
	}
	static mul(c1, c2){
		let mixer = new Color(0, 0, 0, 0);
		mixer.add(c1);
		mixer.mul(c2);
		return mixer;
	}
	static avg(c1, c2){
		let mixer = new Color(0, 0, 0, 0);
		mixer.add(c1);
		mixer.add(c2);
		mixer.div(2);
		return mixer;
	}
	invert(){
		let n = (new Color(255, 255, 255, 1)).sub(this);
		n.alpha = this.alpha;
		return n;
	}
	static rangeAround(color, dist){
		let colorAry = [];
		for(let i = -dist; i < dist+1; i++){
			let a = color.red + (i*10);
			let b = color.green + (i*10);
			let c = color.blue + (i*10);
			let n = new Color(a, b, c, color.alpha);
			n.constrain();
			colorAry.push(n);
		}
		return colorAry;
	}
	static copy(color){
		return new Color(color.red, color.green, color.blue, color.alpha);
	}
	static lerp(color1, color2, per){
		let c1 = Color.copy(color1);
		let c2 = Color.copy(color2);
		return c1.mul(1-per).add(c2.mul(per));
	}
	get_RGBA(){
		return "rgba(" + this.red + ", " + this.green + ", " + this.blue + ", " + this.alpha + ")";
	}
	get_HEX(){
		return "#" + Color.numToHex(this.red) + Color.numToHex(this.green) + Color.numToHex(this.blue);
	}
	toString() {
		return this.get_RGBA();
	}
	equals(color){
		if(this.red == color.red && this.green == color.green && this.blue == color.blue && this.alpha == color.alpha){
			return true;
		} else {
			return false;
		}
	}
	constrain(){
		function con(min, max, val){
			if(val < min) return min;
			else if(val > max) return max;
			else return val;
		}
		this.red = con(0, 255, this.red);
		this.green = con(0, 255, this.green);
		this.blue = con(0, 255, this.blue);
		this.alpha = con(0, 1, this.alpha);
	}
	static isColorOrNumber(color){
		let col = color;
		if(color instanceof Color){
			col = color;
		} else {
			col = new Color(color, color, color, color);
		}
		return col;
	}
	add(color){
		let col = Color.isColorOrNumber(color);
		this.red += col.red;
		this.green += col.green;
		this.blue += col.blue;
		this.alpha += col.alpha;
		this.constrain();
		return this;
	}
	sub(color){
		let col = Color.isColorOrNumber(color);
		this.red -= col.red;
		this.green -= col.green;
		this.blue -= col.blue;
		this.alpha -= col.alpha;
		this.constrain();
		return this;
	}
	mul(color){
		let col = Color.isColorOrNumber(color);
		this.red *= col.red;
		this.green *= col.green;
		this.blue *= col.blue;
		this.alpha *= col.alpha;
		this.constrain();
		return this;
	}
	div(color){
		let col = Color.isColorOrNumber(color);
		this.red /= col.red;
		this.green /= col.green;
		this.blue /= col.blue;
		this.alpha /= col.alpha;
		this.constrain();
		return this;
	}
	mod(color){
		let col = Color.isColorOrNumber(color);
		this.red %= col.red;
		this.green %= col.green;
		this.blue %= col.blue;
		this.alpha %= col.alpha;
		this.constrain();
		return this;
	}
	static grayScale(per){
		let r = 255 * per;
		let g = 255 * per;
		let b = 255 * per;
		return new Color(r, g, b, 1);
	}
}
class ColorLibrary{
	constructor(){
		this.RED = new Color("#f00");
		this.BLUE = new Color("#00f");
		this.YELLOW = new Color("#ff0");
		this.GREEN = new Color("#090");
		this.ORANGE = new Color("#f90");
		this.PURPLE = new Color("#909");
		this.BLANK = new Color(0, 0, 0, 0);
		this.BLACK = new Color(0, 0, 0, 1);
		this.WHITE = new Color(255, 255, 255, 1);
		this.CYAN = new Color(0, 255, 255, 1);
		this.GRAY = new Color(128, 128, 128, 1);
		this.RAZZMATAZZ = new Color("#e3256b");
		this.CREAM = new Color("#fff185");
		this.LIME = new Color(0, 255, 0, 1);
		this.BROWN = new Color("#7d5314");
	}
	add(name, color){
		this[name.toUpperCase()] = color;
	}
}