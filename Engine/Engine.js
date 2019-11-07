function P(x, y){
	return {x:x,y:y};
}
Function.prototype.add = function(fn = function(){}) {
	let self = this;
	return function (...a) {
		self(...a);
		fn(...a);
	}
}
Object.prototype.toString = function(depth = 0){
	if (depth < 1) {
		let ary = [];
		let ary2 = [];
		for(let x in this){
			ary2.push(x);
		}
		let thisName = this.constructor.name;
		function getString(item){
			let toStr = "";
			if (typeof item !== "object") {
				if(typeof item === "string") toStr = `"${item}"`;
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
		for(let i = 0; i < ary2.length; i++) {
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
Object.prototype[Symbol.iterator] = function*() {
	for (let x in this) {
		yield [x, this[x]]; 
	}
}
class Engine {
    constructor(wrapperID, width, height, airResistance, gravity, canvasID) {
        this.fps = 0;
		this.fpsContinuous = 0;
        this.frameCount = 0;
		//fallbacks
        function f(a, b){
            return (a === undefined)? b:a
        }
        let W = f(width, innerWidth);
        let H = f(height, innerHeight);
        let AR = f(airResistance, 0.025);
        let G = f(gravity, P(0, 0.1));
        this.paused = false;
		this.output = function(m){
			alert(m);
		}
		this.console = new Console();
        this.update = function(){};
        this.beforeUpdate = function(){};
        this.afterUpdate = function(){};
		this.fixedUpdate = function(){};
		try{ 
			if (FunctionLibrary) {
				this.f = new FunctionLibrary();
			}
		} catch(e) {}
		this.custom = {};
		//windows
		this.window = class {
			constructor(x, y, width, height, title, contents){
				let win = document.createElement("div");
				win.className = "engine-window";
				win.style.width = width;
				win.style.height = height;
				win.style.position = "absolute";
				win.style.left = x;
				win.style.top = y;
				win.style.background = "#123456";
				win.style.color = "white";
				win.style.border = "2px black solid";
				win.style.borderRadius = "5px";
				win.innerHTML += "<div class='engine-window-options'>MESSAGE<button class='engine-window-header-button' onclick='this.parentNode.parentNode.outerHTML = '';'>X</button></div>";
				win.innerHTML += "<h1 class='engine-window-header'>" + title + "</h1>";
				win.innerHTML += "<div class='engine-window-wrapper'>" + contents + "</div>";
				document.body.appendChild(win);
			}
		};
		this.fpsOldTime = performance.now();
		//setup canvas and scene
        let canvas = document.getElementById(canvasID);
        if(!document.getElementById(canvasID)){
            canvas = document.createElement('canvas');
            canvas.id = "Engine Canvas";
            if (!wrapperID) document.body.appendChild(canvas);
			else document.getElementById(wrapperID).appendChild(canvas);
        }
        this.renderer = new Artist(canvas.id, W, H);
        this.scene = new Scene("Engine Scene", this.renderer, G, AR, this);
		//update loops
		this.afterScript = new Script("after");
		this.beforeScript = new Script("before");
		this.updateScript = new Script("update");
		//for real this time
		this.engineUpdate = function(){
			try {
				if(!this.paused){
					this.fixedUpdate();
					this.scene.enginePhysicsUpdate();
				}
			} catch(e) {
				this.output("Fixed Update Error: " + e);		  
			}
		}.bind(this);
		setInterval(this.engineUpdate, 16);
        this.animate = function(){
            try {
				requestAnimationFrame(this.animate);
				this.frameCount++;
				let oldTime = this.fpsOldTime
				if (this.frameCount % 30 === 0) this.fps = Math.floor(this.fpsContinuous);
				this.fpsContinuous = 1000 / ((this.fpsOldTime = performance.now())-oldTime);
				if(!this.paused){
					this.beforeUpdate();
					this.clear();
					this.update();
					this.scene.engineDrawUpdate();
					this.afterUpdate();
				}
			} catch(e) {
				this.output("Draw Error: " + e);		  
			}
        }.bind(this);
        this.animate();
		//append text
		this.styling = document.createElement("style");
		this.styling.innerHTML = 
		`
		body{
			margin: 0px;
		}
		.engine-window-options{
			background: #ccc;
			padding: 5px;
			color: black;
			font: 18px Helvetica;
		}
		.engine-window-header{
			padding-left: 10px;
			border-bottom: 3px #ddd solid;
			padding-bottom: 10px;
			font: 25px serif;
		}
		.engine-window-header-button{
			float: right;
			background: red;
			border-radius: 5px;	
			border: 2px black solid;
			font: 15px arial;
		}
		.engine-window-wrapper{
			padding: 10px;
			padding-top: 0px;
		}
		`
		document.head.appendChild(this.styling);
		//title
		let script = document.createElement("script");
		script.src = "./Source.js";
		let t = script.src;
		let st = t.split("/");
		let ti = st[st.length - 3];
		if(!wrapperID) this.setTitle(ti.replace(/%20/g, " "));
		onresize = function(){
			this.renderer.canvas.width = innerWidth;
			this.renderer.canvas.height = innerHeight;
		}.bind(this);
    }
	openWindow(width, height, title, contents){
		let x = (this.renderer.canvas.width / 2) - (width / 2);
		let y = (this.renderer.canvas.height / 2) - (height / 2);
		let window = new this.window(x, y, width, height, title, contents);
	}
	end(){
		this.pause();
		this.animate=a=>a;
		this.engineUpdate=a=>a;
		this.renderer.canvas.outerHTML = "";
	}
    pause(){
        this.paused = true
    }
    play(){
        this.paused = false
    }
	clear(){
		this.renderer.clear();
	}
	setTitle(title){
		document.querySelector("title").innerHTML = title;
		return title;
	}
	getDistance(x1, y1, x2, y2){
		let distance1 = (x2-x1)**2
		let distance2 = (y2-y1)**2
		return Math.sqrt(distance1+distance2)
	}
	getDistanceWithPoints(point, point2){
		return this.getDistance(point.x, point.y, point2.x, point2.y);
	}
	extend(a, b){
		return a + (b*Math.sign(a));
	}
	contract(a, b){
		return a - (b*Math.sign(a));
	}
}