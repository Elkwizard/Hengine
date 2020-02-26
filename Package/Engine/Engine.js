function P(x, y) {
	return { x: x, y: y };
}
Function.prototype.add = function (fn = function () { }) {
	let self = this;
	return function (...a) {
		self(...a);
		fn(...a);
	}
}
Number.prototype.toDegrees = function () {
	return this * (180 / Math.PI);
}
Number.prototype.toRadians = function () {
	return this * (Math.PI / 180);
}
Number.prototype.movedTowards = function (value, ferocity) {
	let dir = ferocity * (value - this) * 2;
	return this + dir;
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
class ScreenRecording {
	constructor(name, past) {
		this.name = name;
		this.frames = [];
		if (past) this.frames = ScreenRecording.parse(past).frames;
		this.isRecording = false;
	}
	start() {
		this.isRecording = true;
	}
	stop() {
		this.isRecording = false;
	}
	getAnimation() {
		if (!this.frames.length) return null;
		return window.c.createAnimation(this.frames, 1, true);
	}
}
class Engine {
	constructor(wrapperID, width, height, airResistance, gravity, canvasID) {
		setupAlerts();
		this.fps = 60;
		this.fpsContinuous = 0;
		this.lastTime = performance.now();
		this.currentTime = performance.now();
		this.frameLengths = [];
		this.frameLength = 0;
		this.frameCount = 0;
		this.graphs = [];
		//fallbacks
		function f(a, b) {
			return (a === undefined) ? b : a
		}
		let W = f(width, innerWidth);
		let H = f(height, innerHeight);
		let AR = f(airResistance, 0.025);
		let G = f(gravity, new Vector2(0, 0.1));
		this.paused = false;
		this.output = function (m) {
			alert(m);
		}
		this.console = new Console();
		this.update = function () { };
		this.beforeUpdate = function () { };
		this.afterUpdate = function () { };
		this.fixedUpdate = function () { };
		this.catchErrors = true;
		this.hasFixedPhysicsUpdateCycle = true;
		try {
			if (FunctionLibrary) {
				this.f = new FunctionLibrary();
			}
		} catch (e) { }
		//setup canvas and scene
		let canvas = document.getElementById(canvasID);
		if (!document.getElementById(canvasID)) {
			canvas = document.createElement('canvas');
			canvas.id = "Engine Canvas";
			if (!wrapperID) document.body.appendChild(canvas);
			else document.getElementById(wrapperID).appendChild(canvas);
		}
		this.renderer = new Artist(canvas.id, W, H);
		window.g = this;
		this.scene = new Scene("Engine Scene", this.renderer, G, AR, this);
		//update loops
		this.afterScript = new Script("after");
		this.beforeScript = new Script("before");
		this.updateScript = new Script("update");

		M.engine = this;
		//for real this time
		this.engineUpdate = function () {
			try {
				if (this.hasFixedPhysicsUpdateCycle) if (!this.paused) {
					this.fixedUpdate();
					this.scene.enginePhysicsUpdate();
				}
			} catch (e) {
				if (this.catchErrors) this.output("Fixed Update Error: " + e);
				else throw e;
			}
		}.bind(this);
		setInterval(this.engineUpdate, 16);
		this.FPS_FRAMES_TO_COUNT = 10;
		this.animate = function () {
			try {
				requestAnimationFrame(this.animate);
				this.frameCount++;
				this.currentTime = performance.now();
				//fps
				this.frameLength = this.currentTime - this.lastTime;
				this.lastTime = this.currentTime;
				this.frameLengths.push(this.frameLength);
				if (this.frameLengths.length > this.FPS_FRAMES_TO_COUNT) {
					this.frameLengths.shift();
					let val = this.frameLengths.reduce((p, c) => p + c) / this.FPS_FRAMES_TO_COUNT;
					this.fpsContinuous = 1000 / val;
				}
				this.updateGraphs();
				if (Math.abs(this.fpsContinuous - this.fps) > 5 && Math.abs(this.fpsContinuous - this.fps) < 40) this.fps = Math.min(60, Math.floor(this.fpsContinuous));
				//update
				if (!this.paused) {
					K.update();
					this.beforeUpdate();
					this.clear();
					this.update();
					this.scene.engineDrawUpdate();
					if (!this.hasFixedPhysicsUpdateCycle) {
						this.fixedUpdate();
						this.scene.enginePhysicsUpdate();
					}
					this.afterUpdate();
					this.updateScreenRecordings();
					M.last = { x: M.x, y: M.y };
				}
			} catch (e) {
				if (this.catchErrors) this.output("Draw Error: " + e);
				else throw e;
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
		if (!wrapperID) this.setTitle(ti.replace(/%20/g, " "));
		this.resize = true;
		window.addEventListener("resize", function () {
			if (this.resize) {
				let pixelate = this.renderer.c.imageSmoothingEnabled;
				this.renderer.canvas.width = innerWidth;
				this.renderer.canvas.height = innerHeight;
				this.renderer.c.imageSmoothingEnabled = pixelate;
			}
		}.bind(this));
		this.recordings = {};
		
		this.fpsGraph = this.makeGraph("FPS", 0, 60, e => this.fps, 2000, [
			{
				limit: 50,
				color: "lime"
			},
			{
				limit: 30,
				color: "yellow"
			},
			{
				limit: 15,
				color: "orange"
			},
			{
				color: "red"
			}
		]);
	}
	get preservePixelart() {
		return !this.renderer.c.imageSmoothingEnabled;
	}
	set preservePixelart(a) {
		this.renderer.c.imageSmoothingEnabled = !a;
	}
	createScreenRecording(name, past) {
		this.recordings[name] = new ScreenRecording(name, past);
		return this.recordings[name];
	}
	updateScreenRecordings() {
		let f;
		for (let key in this.recordings) {
			if (!f) f = this.renderer.contentToFrame();
			let r = this.recordings[key];
			if (r.isRecording) r.frames.push(f);
		}
	}
	makeGraph(yName, minValue, maxValue, getY, msLimit = 5000, colors) {
		if (!colors) colors = [];
		let c = new Frame(1, 1).c;
		let leftOffset = Math.max(c.c.measureText(maxValue.toString()).width, c.c.measureText(minValue.toString()).width) + 10;
		let bottomTextOffset = 5;
		let mainGraphWidth = 400 - leftOffset;
		let f = new Frame(400, 200 + bottomTextOffset * 3 + 10);
		function drawBasics(black, white) {
			f.c.draw(black).rect(0, 0, f.width, f.height);
			f.c.stroke(white, 2).rect(leftOffset, -2, 422, 200);
			f.c.c.font = "10px Arial";
			f.c.textMode = "center";
			f.c.draw(white).text("10px Arial", maxValue, leftOffset / 2, 2);
			f.c.draw(white).text("10px Arial", minValue, leftOffset / 2, 190);
			let tx = leftOffset / 2;
			let ty = 100;
			if (!Array.isArray(yName)) {
				f.c.translate(tx, ty);
				f.c.rotate(-Math.PI / 2);
				f.c.draw(white).text("10px Arial", yName.split("").join(" "), 0, -5);
				f.c.rotate(Math.PI / 2);
				f.c.translate(-tx, -ty);
			}
			f.c.draw(white).text("10px Arial", "Time", 220, 200 + bottomTextOffset);
			f.c.textMode = "left";
			f.c.draw(white).text("10px Arial", "5000", leftOffset + 370, 200 + bottomTextOffset);
			f.c.draw(white).text("10px Arial", "0", leftOffset, 200 + bottomTextOffset);
		}
		class EQN {
			constructor(getY) {
				this.getY = getY;
				this.data = [];
				this.permanentData = "";
			}
		}
		if (!Array.isArray(yName)) {
			f.vars = {
				[yName]: new EQN(getY)
			};
		} else {
			f.vars = {};
			for (let i = 0; i < yName.length; i++) f.vars[yName[i]] = new EQN(getY[i]);
		}
		f.timeOffset = 0;
		f.msLimit = msLimit;
		let colorScheme = "dark";
		Object.defineProperty(f, "colorScheme", {
			get: function () {
				return colorScheme;
			},
			set(a) {
				colorScheme = a;
				let black = (colorScheme.toLowerCase() == "dark") ? "black" : "white";
				let white = (colorScheme.toLowerCase() == "dark") ? "white" : "black";
				drawBasics(black, white);
			}
		})
		f.colorScheme = "dark";
		let black = (f.colorScheme.toLowerCase() == "dark") ? "black" : "white";
		let white = (f.colorScheme.toLowerCase() == "dark") ? "white" : "black";
		drawBasics(black, white);
		function getColor(n) {
			for (let color of colors) {
				if (n >= color.limit) return color.color;
			}
			return black;
		}
		let graphFrame = new Frame(400, 198);
		let f2 = graphFrame;
		const getYValue = (fV) => clamp(200 - ((fV - minValue) / (maxValue - minValue)) * 200, 0, 198);
		const getXValue = (fV) => mainGraphWidth * ((fV - f.timeOffset) / f.msLimit);
		f.get = function () {
			let black = (f.colorScheme.toLowerCase() == "dark") ? "black" : "white";
			let white = (f.colorScheme.toLowerCase() == "dark") ? "white" : "black";
			f.c.textMode = "left";
			f.c.draw(black).rect(leftOffset + 2, 0, 420, 198);
			f2.c.clear();
			f2.c.c.setLineDash([4, 2]);
			let lastCol = {
				limit: maxValue
			};
			for (let i = 0; i < colors.length; i++) {
				f2.c.c.globalAlpha = 0.1;
				let col = colors[i];
				let dif = lastCol.limit - col.limit;
				if (!col.limit) col.limit = minValue;
				f2.c.draw(col.color).rect(0, getYValue(lastCol.limit), mainGraphWidth, getYValue(col.limit) - getYValue(lastCol.limit));
				f2.c.c.globalAlpha = .5;
				f2.c.stroke(col.color, 2).line(0, getYValue(lastCol.limit), mainGraphWidth, getYValue(lastCol.limit));
				lastCol = col;
			}
			f2.c.c.globalAlpha = 1;
			f2.c.c.setLineDash([]);
			let len = 0;
			for (let key in f.vars) len++;
			for (let key in f.vars) {
				let last = null;
				let fData = f.vars[key].data;
				let step = 1;
				if (fData.length > 300) step = Math.ceil(fData.length / 300);
				for (let i = 0; i - step < fData.length; i += step) {
					let data = fData[Math.min(i, fData.length - 1)];
					if (last) {
						let x1 = getXValue(last.x);
						let y1 = getYValue(last.y);
						let x2 = getXValue(data.x);
						let y2 = getYValue(data.y);
						let col = getColor(data.y);
						f2.c.stroke(col, 3).line(x1, y1, x2, y2);
					}
					last = data;
				}
				f2.c.textMode = "right";
				let y = getYValue(last.y);
				if (y > 185) y -= 15;
				let prefix = key + ": ";
				if (len == 1) prefix = "";
				let text = prefix + last.y;
				let w = f.c.c.measureText(text).width;
				f2.c.draw(black).rect(
					getXValue(last.x) - 10 - w,
					y + 1,
					w + 6,
					16
				);
				f2.c.stroke(white, 1).rect(
					getXValue(last.x) - 10 - w,
					y + 1,
					w + 6,
					16
				);
				f2.c.draw(white).text(
					"10px Arial",
					text,
					getXValue(last.x) - 8,
					y + 3
				);
			}
			f.c.drawImage(f2, leftOffset + 2, 0);
			let timeStart = Time.formatMS(Math.floor(f.timeOffset));
			let timeEnd = Time.formatMS(Math.floor(f.timeOffset) + f.msLimit);
			f.c.draw(black).rect(leftOffset, 200 + bottomTextOffset, f.c.c.measureText(timeStart).width, 200);
			f.c.draw(white).text("10px Arial", timeStart, leftOffset, 200 + bottomTextOffset);
			f.c.draw(black).rect(leftOffset + mainGraphWidth - 10 - f.c.c.measureText(timeEnd).width, 200 + bottomTextOffset, 200, 200);
			f.c.textMode = "right";
			f.c.draw(white).text("10px Arial", timeEnd, mainGraphWidth - 10 + leftOffset, 200 + bottomTextOffset);

			return f;
		}
		this.graphs.push(f);
		return f;
	}
	parseGraphData(data) {
		let result = data.split(" ").map(e => {
			let split = e.split(",");
			return P(parseFloat(split[0]), parseFloat(split[1]));
		});
		result.pop();
		return result;
	}
	updateGraphs() {
		let t = performance.now();
		for (let graph of this.graphs) {
			for (let key in graph.vars) {
				let data = P(t, graph.vars[key].getY(t));
				graph.vars[key].permanentData += data.x + "," + data.y + " ";
				graph.vars[key].data.push(data);
				if (graph.vars[key].data.length > graph.msLimit / 16) graph.vars[key].data.shift();
			}
			if (t > graph.msLimit) graph.timeOffset = t - graph.msLimit;
		}
	}
	getFPSGraph() {
		return this.fpsGraph.get();
	}
	end() {
		this.pause();
		this.animate = a => a;
		this.engineUpdate = a => a;
		this.renderer.canvas.outerHTML = "";
	}
	pause() {
		this.paused = true
	}
	play() {
		this.paused = false
	}
	clear() {
		this.renderer.clear();
	}
	setTitle(title) {
		document.querySelector("title").innerHTML = title;
		return title;
	}
	getDistance(x1, y1, x2, y2) {
		let distance1 = (x2 - x1) ** 2
		let distance2 = (y2 - y1) ** 2
		return Math.sqrt(distance1 + distance2)
	}
	getDistanceWithPoints(point, point2) {
		return this.getDistance(point.x, point.y, point2.x, point2.y);
	}
	extend(a, b) {
		return a + (b * Math.sign(a));
	}
	contract(a, b) {
		return a - (b * Math.sign(a));
	}
}

//alerts
function setupAlerts() {
	let ale = document.createElement("div");
	ale.className = "alert";
	ale.innerHTML = `
	<span class="alert-default-text">This page says</span>
	<div class="alert-content"></div>
	<button class="alert-close-button">OK</button>`;
	document.body.appendChild(ale);
	let styling = document.createElement("style");
	styling.innerHTML = `
	.alert {
		background: #fff;
		border-radius: 2px;
		box-shadow: 0px 3px 5px rgba(0, 0, 0, 0.4);
		position: absolute;
		left: 50%;
		padding: 15px;
		width: 27%;
		min-height: 13%;
		top: -5%;
		transform: translate(-50%, 0);
		opacity: 0;
		padding-bottom: 15px;
		transition: all .15s;
		font-family: sans-serif;
	}
	.alert-default-text {
		color: black;
	}
	.alert-content {
		color: #666;
		font-size: 14px;
		margin-top: 10px;
		overflow: auto;
		max-height: 200px;
	}
	.alert-close-button {
		background: rgba(115, 152, 245, 1);
		border: none;
		border-radius: 5px;
		color: white;
		width: 65px;
		height: 33px;
		position: absolute;
		right: 15px;
		bottom: 15px;
		font-size: 11.5px;
		font-weight: bold;
		box-shadow: 0px 0px 3px rgba(115, 152, 245, 1);
	}`;
	document.head.appendChild(styling);
	let clb = document.querySelector(".alert-close-button");
	let al = document.querySelector(".alert");
	let cont = document.querySelector(".alert-content");
	let alerts = [];
	let alertClosed = true;
	function closeAlert() {
		al.style.top = "-5%";
		al.style.opacity = "0";
		alertClosed = true;
		if (alerts.length > 0) {
			window.alert(alerts[alerts.length - 1], true);
			alerts.pop();
		}
	}
	clb.onclick = function () {
		closeAlert();
	};
	window.alert = function (m, isSequence = false) {
		if (alertClosed) {
			m = m + "";
			m = m.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/\n/g, "<br>");
			al.style.transition = "all 0s";
			let style = { top: "-5%", opacity: "0" };
			if (isSequence) {
				style.top = "-1%";
				style.opacity = "1";
			}
			al.style.top = style.top;
			al.style.opacity = style.opacity;
			alertClosed = false;

			let breaks = m.match(/<br>/g);
			if (breaks) {
				if (breaks.length > 0) al.style.paddingBottom = "60px";
				else al.style.paddingBottom = "15px";
			}
			cont.innerHTML = m;
			window.setTimeout(function () {
				al.style.transition = "all .15s";
				al.style.top = "5px";
				al.style.opacity = "1";
			}, 1);
		} else {
			alerts.unshift(m);
		}
	}
	window.addEventListener("keydown", function (e) {
		if (e.key == "Enter" || e.key == " ") {
			closeAlert();
		}
	})
}