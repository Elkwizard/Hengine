class Vertex {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
	toString() {
		return "(" + this.x + ", " + this.y + ")";
	}
}
class Frame {
	constructor(width, height){
		this.width = width;
		this.height = height;
		this.img = new OffscreenCanvas(width, height);
		this.c = new Artist(this.img);
	}
}
class Texture {
	constructor(width, height) {
		this.width = width;
		this.height = height;
		this.pixels = [];
		for (let i = 0; i < width; i++) {
			this.pixels.push([]);
			for (let j = 0; j < height; j++) {
				this.pixels[i].push(new Color(0, 0, 0, 0));
			}
		}
		this[Symbol.iterator] = function*() {
			for (let i = 0; i < this.width; i++) for (let j = 0; j < this.height; j++) {
				yield [i, j];
			}
		}
		this.updateImageData();
	}
	setPixel(x, y, clr) {
		this.pixels[x][y] = clr;
	}
	updateImageData() {
		let array = new Uint8ClampedArray(4 * this.width * this.height);
		let cntr = 0;
		for (let i = 0; i < this.width; i++) {
			for (let j = 0; j < this.height; j++) {
				let color = this.pixels[j][i];
				array[cntr] = Math.floor(color.red);
				array[cntr + 1] = Math.floor(color.green);
				array[cntr + 2] = Math.floor(color.blue);
				array[cntr + 3] = Math.floor(color.alpha * 255);
				cntr += 4;
			}
		}
		let img = new ImageData(array, this.width, this.height);
		this.imageData = img;
	}
	/*static fromImage(img, width, height) {
		let n = new Texture(width, height);
		let f = new Frame(width, height);
		f.c.drawImage(img, 0, 0, width, height);
		let ID = f.c.c.getImageData(0, 0, width, height).data;
		f.c.canvas.style.border = "2px green solid";
		for (let i = 0; i < n.width * n.height * 4; i += 4) {
			let x = Math.floor((i / 4) / height);
			let y = (i / 4) % height;
			let r = ID[i];
			let g = ID[i + 1];
			let b = ID[i + 2];
			let a = ID[i + 3] / 255;
			let col = new Color(r, g, b, a);
			n.pixels[y][x] = col;
		}
		alert(n.pixels)
		n.updateImageData();
		return n;
	}*/
	toImage() {
		let x = new Frame(this.width, this.height);
		this.updateImageData();
		x.c.c.putImageData(this.imageData, 0, 0);
		return x;
	}
}
class Triangle {
	constructor(p1, p2, p3) {
		this.vertices = [p1, p2, p3];
	}
	middle(){
		function average(ary) {
			let sum = 0;
			for (let num of ary) {
				sum += num;
			}
			sum /= ary.length;
			return sum;
		}
		let res = new Vertex();
		let xs = [];
		let ys = [];
		for (let x of this.vertices) {
			xs.push(x.x);
			ys.push(x.y);
		}
		res.x = average(xs);
		res.y = average(ys);
		return res;
	}
}
class Circle {
	constructor(x, y, radius) {
		this.x = x;
		this.y = y;
		this.radius = radius;
	}
}
class Line {
	constructor(x, y, x2, y2) {
		if (typeof x === "object") {
			this.x2 = y.x;
			this.y2 = y.y;
			this.y1 = x.y;
			this.x1 = x.x;
		} else {
			this.x1 = x;
			this.y1 = y;
			this.x2 = x2;
			this.y2 = y2;
		}
	}
	get p1() {
		return new Vertex(this.x1, this.y1);
	}
	get p2() {
		return new Vertex(this.x2, this.y2);
	}
	get midPoint() {
		let ax = (this.x1 + this.x2) / 2;
		let ay = (this.y1 + this.y2) / 2;
		return new Vertex(ax, ay);
	}
}
class Rect {
    constructor(x, y, width, height){
        this.collider = new RectCollider(x, y, width, height);
		if(typeof x == "object"){
			this.x = x.x;
			this.y = x.y;
			this.width = y.x - x.x;
			this.height = y.y - x.y;
		}
		if(this.width < 0){
			this.width = -this.width;
			this.x -= this.width;
		}
		if(this.height < 0){
			this.height = -this.height;
			this.y -= this.height;
		}
    }
	get x(){
		return this.collider.x;
	}
	get y(){
		return this.collider.y;
	}
	get width(){
		return this.collider.width;
	}
	get height(){
		return this.collider.height;
	}
	set x(e){
		this.collider.x = e;
	}
	set y(e){
		this.collider.y = e;
	}
	set width(e){
		this.collider.width = e;
	}
	set height(e){
		this.collider.height = e;
	}
	get middle(){
		return {x: this.x + (this.width/2), y: this.y + (this.height/2)}
	}
	corners(){
		return [
			new Vertex(this.x, this.y),
			new Vertex(this.x + this.width, this.y),
			new Vertex(this.x + this.width, this.y + this.height),
			new Vertex(this.x, this.y + this.height)
		];
	}
}
class Animation {
    constructor(src, frames, delay, loop, finResponse){
		this.stopped = false;
		if(!Array.isArray(frames)){
			this.frameCount = frames;
			this.frames = [];
			this.img = new Image
			for(let i = 0; i < frames; i++){
				this.frames.push(new Image);
				this.frames[i].src = ("../Art/Animations/" + src + "/" + (i+1) + ".png");
			}
			this.loop = loop;
			this.finResponse = (finResponse !== undefined)? finResponse:function(){};
			this.delay = delay;
		} else {
			this.frames = src;
			this.frameCount = this.frames.length;
			this.delay = frames;
			this.loop = delay;
			this.finResponse = loop || function(){}
		}
        this.timer = 0;
        this.maxTime = this.frames.length * this.delay
    }
    advance(){
		if (!this.stopped) {
			this.timer++
			if(this.timer >= this.maxTime-1){
				this.timer = this.loop? 0:this.maxTime
				this.finResponse()
			}
			this.img = this.frames[Math.floor(this.timer/this.delay)];
		}
    }
	stop(){
		this.stoppped = true;
	}
	start(){
		this.stopped = false;
	}
	reset(){
		this.timer = -1;
		this.advance();
	}
}
class Artist {
	constructor(canvasID, width, height){
		this.canvas = document.getElementById(canvasID);
		if(typeof canvasID === "object") this.canvas = canvasID;
		if(width){
			this.canvas.width = width;
		}
		if(height){
			this.canvas.height = height;
		}
		this.noiseAry = [];
		this.custom = {};
		this.c = this.canvas.getContext('2d');
        this.animations = [];
		this._background = new Color(0, 0, 0, 0);
	}
	get background() {
		return this._background;
	}
	set background(a) {
		this._background = a;
		this.setBackground(a);
	}
    get middle(){
        return {x:this.canvas.width / 2, y:this.canvas.height / 2};
    }
	getPixel(x, y) {
		let d = this.c.getImageData(x, y, 1, 1).data;
		return new Color(d[0], d[1], d[2], d[3])
	}
	contentToFrame(){
		let n = new Frame(this.canvas.width, this.canvas.height);
		n.c.drawImage(this.canvas, 0, 0);
		return n;
	}
	sigmoid(x){
		return 1/(1 + (Math.E**-x));
	}
    invertX(){
		this.c.translate(this.canvas.width, 0);
		this.c.scale(-1, 1);
    }
    invertY(){
		this.c.translate(0, this.canvas.height);
		this.c.scale(1, -1);
    }
	simpleCircle(color, border){
		return function() {
			this.home.c.draw(color).circle(this.middle.x, this.middle.y, this.width / 2);
			this.home.c.stroke(border, 2).circle(this.middle.x, this.middle.y, this.width / 2);
		}
	}
	simpleRect(color, border){
		return function() {
			this.home.c.draw(color).rect(this.x, this.y, this.width, this.height);
			this.home.c.stroke(border, 2).rect(this.x, this.y, this.width, this.height);
		}
	}
    createAnimation(src, frames, delay, loop, response){
        this.animations.push(new Animation(src, frames, delay, loop, response))
        return this.animations[this.animations.length-1]
    }
    drawAnimation(animation, x, y, width, height){
		animation.advance();
		let img = animation.img;
		if(img instanceof Frame) img = img.img;
		if(width === undefined) width = img.width;
		if(height === undefined) height = img.height;
        this.c.drawImage(img, x, y, width, height)
    }
	drawCircle(color, x, y, radius){
		this.c.fillStyle = color;
		this.c.beginPath();
		this.c.arc(x, y, radius, 0, 2 * Math.PI);
		this.c.fill();
	}
	translate(x, y) {
		this.c.translate(x, y);
	}
	rotate(a) {
		this.c.rotate(a);
	}
	scale(x, y) {
		this.c.scale(x, y);
	}
	draw(color){
		let c = color;
		if(typeof color == "object" && color.get_RGBA) c = color.get_RGBA();
		this.c.fillStyle = c;
		let obj = {
			circle: function(x, y, radius){
				radius = Math.abs(radius);
				if (typeof x === "object") {
					radius = x.radius;
					y = x.y;
					x = x.x;
				}
				this.c.beginPath();
				this.c.arc(x, y, radius, 0, 2 * Math.PI);
				this.c.fill();
			},
			rect: function(x, y, width, height){
				if(typeof x === "object"){
					this.c.fillRect(x.x, x.y, x.width, x.height);
				} else {
					this.c.fillRect(x, y, width, height);
				}
			},
			triangle: function(v1, v2, v3){
				this.c.beginPath();
				if(v1 instanceof Triangle) {
					v2 = v1.vertices[1];
					v3 = v1.vertices[2];
					v1 = v1.vertices[0];
				}
				this.c.moveTo(v1.x, v1.y);
				this.c.lineTo(v2.x, v2.y);
				this.c.lineTo(v3.x, v3.y);
				this.c.lineTo(v1.x, v1.y);
				this.c.fill();
				this.c.closePath();
			},
			text: function(font, text, x, y){
				if(typeof text == "object") text = text.toString();
				if(typeof text == "number") text = String(text);
				this.c.font = font;
				let fs = parseInt(font);
				let blocks = text.split("\n");
				for(let i = 0; i < blocks.length; i++){
					this.c.fillText(blocks[i], x, y + ((i+1) * fs));	
				}
			},
			shape: function(...v) {
				this.c.beginPath();
				this.c.moveTo(v[0].x, v[0].y);
				for (let i = 0; i <= v.length; i++) {
					let index = i % v.length;
					this.c.lineTo(v[index].x, v[index].y);
				}
				this.c.fill();
				this.c.closePath();
			}
		}
		for(let func in obj){
			obj[func] = obj[func].bind(this);
		}
		return obj
	}
	stroke(color, lineWidth, endStyle){
		let c = color;
		if (endStyle === "flat") endStyle = "butt";
		if(typeof color == "object" && color.get_RGBA) c = color.get_RGBA();
		this.c.strokeStyle = c;
		this.c.lineCap = endStyle;
		this.c.lineWidth = lineWidth;
		this.c.beginPath();
		this.c.fillStyle = "transparent";
		let obj = {
			circle: function(x, y, radius){
				radius = Math.abs(radius);
				if (typeof x === "object") {
					radius = x.radius;
					y = x.y;
					x = x.x;
				}
				this.c.arc(x, y, radius, 0, 2 * Math.PI);
				this.c.stroke();
				this.c.closePath();
			},
			rect: function(x, y, width, height){
				if(x instanceof Rect){
					this.c.strokeRect(x.x, x.y, x.width, x.height);
				} else {
					this.c.strokeRect(x, y, width, height);
				}
			},
			triangle: function(v1, v2, v3){
				this.c.beginPath();
				if(v1 instanceof Triangle) {
					v2 = v1.vertices[1];
					v3 = v1.vertices[2];
					v1 = v1.vertices[0];
				}
				this.c.moveTo(v1.x, v1.y);
				this.c.lineTo(v2.x, v2.y);
				this.c.lineTo(v3.x, v3.y);
				this.c.lineTo(v1.x, v1.y);
				this.c.stroke();
				this.c.closePath();
			},
			text: function(font, text, x, y){
				if(typeof text == "object") text = text.toString();
				if(typeof text == "number") text = String(text);
				this.c.font = font;
				let fs = parseInt(font);
				let blocks = text.split("\n");
				for(let i = 0; i < blocks.length; i++){
					this.c.strokeText(blocks[i], x, y + ((i+1) * fs));	
				}
			},
			line: function(x, y, x1, y1){
				if(typeof x == "object"){
					x1 = y.x;
					y1 = y.y;
					y = x.y;
					x = x.x;
				}
				this.c.moveTo(x, y)
				this.c.lineTo(x1, y1)
				this.c.stroke()
			},
			shape: function(...v) {
				this.c.beginPath();
				this.c.moveTo(v[0].x, v[0].y);
				for (let i = 0; i <= v.length; i++) {
					let index = i % v.length;
					this.c.lineTo(v[index].x, v[index].y);
				}
				this.c.stroke();
				this.c.closePath();
			}
		}
		for(let func in obj){
			obj[func] = obj[func].bind(this);
		}
		return obj
	}
	clear(){
		this.c.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}
	color(color){
		this.c.fillStyle = (this.c.strokeStyle = color);
	}
	noise(x, freq, min, max){
		if(!freq) freq = 1;
		if(min === undefined) min = -1;
		if(max === undefined) max = 1;
		let last;
		while(this.noiseAry.length - 1 < x){
			last = this.noiseAry[this.noiseAry.length - 1];
			if(last === undefined) last = 0;
			let val = last + ((Math.random()-Math.random()));
			if(val > max) val = max;
			if(val < min) val = min;
			this.noiseAry.push(val);
		}
		return this.noiseAry[Math.floor(x)] * freq;
	}
	drawTexture(txr = new Texture(0, 0), x = 0, y = 0, width = txr.width, height = txr.height) {
		let imagedata = txr.imageData;
		let f = new OffscreenCanvas(txr.width, txr.height);
		f.getContext('2d').putImageData(imagedata, 0, 0);
		this.c.drawImage(f, x, y, width, height);
	}
	drawImage(img, x, y, width, height){
		if(img instanceof Frame) img = img.img;
		if(width === undefined) width = img.width;
		if(height === undefined) height = img.height;
		this.c.drawImage(img, x, y, width, height)
	}
	drawWithAlpha(a, shape){
		this.c.globalAlpha = a;
		shape();
		this.c.globalAlpha = 1;
	}
	setBackground(color){
		let c = color;
		if(color instanceof Color) c = color.get_RGBA();
		this.canvas.style.background = c;
	}
}