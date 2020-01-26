class Project{
	constructor(wrapperID, width, height, airResistance, gravity, canvasID){
		this.g = new Engine(wrapperID, width, height, airResistance, gravity, canvasID);
		this.s = this.g.scene;
		this.c = this.g.renderer;
		this.C = this.c.c;
		this.custom = {};
		this.cl = new ColorLibrary();
		this.K = K;
		this.M = M;
		window.g = this.g;
		window.s = this.s;
		window.c = this.c;
		window.C = this.C;
		window.cl = this.cl;
		const c = this.c;
		delete window.width;
		delete window.height;
		Object.defineProperty(window, "width", { 
			get: function() {
				return c.canvas.width;
			},
			set: function(a) {
				c.canvas.width = a;
			}
		});
		Object.defineProperty(window, "height", {
			get: function() {
				return c.canvas.height;
			},
			set: function(a) {
				c.canvas.height = a;
			}
		});
		window.custom = this.custom;
		window.loadImage = this.loadImage.bind(this);
		window.loadSound = this.loadSound.bind(this);
		window.rand = this.rand.bind(this);
		window.middle = this.middle.bind(this);
		this.SPRITE_PATH = "../Art/Sprites/";
		this.ANIMATION_PATH = "../Art/Animations/";
		this.SOUND_PATH = "../Sound/";
		
		
		//define additional scripts
		
		s.addScript("TEXT_BOX", {
			init(options, fontSize = 20, fontColor = cl.BLACK, backgroundColor = new Color("#ccc"), borderColor = new Color("#222")) {
				this.scripts.TEXT_BOX.text = "";
				this.scripts.TEXT_BOX.selected = false;
				this.scripts.TEXT_BOX.fontColor = options.fontColor? options.fontColor:cl.BLACK;
				this.scripts.TEXT_BOX.fontSize = options.fontSize? options.fontSize:20;
				this.scripts.TEXT_BOX.selection = {
					start: 0,
					end: 0
				}
				fontSize = options.fontSize? options.fontSize:20;
				if (!options.drawBackground) {
					this.scripts.TEXT_BOX.drawBackground = function() {
						c.draw(options.backgroundColor? options.backgroundColor:"#ccc").rect(this);
						c.stroke(options.borderColor? options.borderColor:"#222", 3).rect(this);
					}.bind(this);
				} else if (options.drawBackground) {
					this.scripts.TEXT_BOX.drawBackground = function() {
						options.drawBackground.bind(this)();
					}.bind(this);
				}
				let previous = c.c.font;
				c.c.font = fontSize + "px monospace";
				this.scripts.TEXT_BOX.fontWidth = c.c.measureText("w").width;
				c.c.font = previous;
				this.scripts.TEXT_BOX.maxChars = g.f.round((this.width - 10) / this.scripts.TEXT_BOX.fontWidth, 0);
				K.onDown.listen(function(e) {
					if (this.scripts.TEXT_BOX.selected && !K.P("Control")) {
						function deleteSelected() {
							if (this.scripts.TEXT_BOX.selection.end > 0 || this.scripts.TEXT_BOX.selection.start > 0) {
								let sel = this.scripts.TEXT_BOX.selection;
								let ary = this.scripts.TEXT_BOX.text.split("");
								let dif = Math.abs(sel.end - sel.start);
								let fArg = 0;
								if (sel.start < sel.end) fArg = sel.start;
								if (sel.end < sel.start) fArg = sel.end;
								if (sel.start === sel.end) fArg = sel.start - 1;
								let spliceArgs = [fArg, Math.max(1, dif)];
								ary.splice(...spliceArgs);
								this.scripts.TEXT_BOX.text = ary.join("");
								if (sel.start < sel.end);
								else if (sel.end < sel.start) sel.start = sel.end;
								else if (sel.start === sel.end) sel.start--;
								sel.start = Math.max(0, sel.start);
								sel.end = sel.start;
							}
						}
						deleteSelected = deleteSelected.bind(this);
						if (e.key.length < 2 && this.scripts.TEXT_BOX.text.length < this.scripts.TEXT_BOX.maxChars) {
							if (this.scripts.TEXT_BOX.selection.start !== this.scripts.TEXT_BOX.selection.end) deleteSelected();
							let ary = this.scripts.TEXT_BOX.text.split("");
							ary.splice(this.scripts.TEXT_BOX.selection.end, 0, e.key);
							this.scripts.TEXT_BOX.text = ary.join("");
							this.scripts.TEXT_BOX.selection.end++;
							this.scripts.TEXT_BOX.selection.start = this.scripts.TEXT_BOX.selection.end;
						}
						if (e.key === "Backspace")
							deleteSelected();
						if (e.key === "ArrowLeft") {
							if (this.scripts.TEXT_BOX.selection.end > 0) this.scripts.TEXT_BOX.selection.end--;
							if (!K.P("Shift")) this.scripts.TEXT_BOX.selection.start = this.scripts.TEXT_BOX.selection.end;
						}
						if (e.key === "ArrowRight") {
							if (this.scripts.TEXT_BOX.selection.end < this.scripts.TEXT_BOX.text.length) this.scripts.TEXT_BOX.selection.end++;
							if (!K.P("Shift")) this.scripts.TEXT_BOX.selection.start = this.scripts.TEXT_BOX.selection.end;
						}
						if (K.P("Control") && e.key == "a") {
							this.scripts.TEXT_BOX.selection.start = 0;
							this.scripts.TEXT_BOX.selection.end = this.scripts.TEXT_BOX.text.length;
						}
					}
				}.bind(this));
				M.onDown.listen(function(e) {
					this.scripts.TEXT_BOX.selected = this.hovered;
					if (this.hovered) {
						let x = this.x;
						let m = s.adjustPointForDisplay(M);
						let xPos = (m.x - x) - 5;
						this.scripts.TEXT_BOX.selection.end = Math.max(0, Math.min(Math.ceil((xPos - 5) / this.scripts.TEXT_BOX.fontWidth), this.scripts.TEXT_BOX.text.split("").length));
						this.scripts.TEXT_BOX.selection.start = this.scripts.TEXT_BOX.selection.end;
					}
				}.bind(this));
				M.onMove.listen(function(e) {
					if (M.down) {
						this.scripts.TEXT_BOX.selected = this.hovered;
						if (this.hovered) {
							let x = this.x;
							let m = s.adjustPointForDisplay(M);
							let xPos = (m.x - x) - 5;
							this.scripts.TEXT_BOX.selection.end = Math.max(0, Math.min(Math.ceil((xPos - 5) / this.scripts.TEXT_BOX.fontWidth), this.scripts.TEXT_BOX.text.split("").length));
						}
					}
				}.bind(this));
				Object.defineProperty(this, "value", {
					set(a) {
						this.scripts.TEXT_BOX.text = a;
					},
					get() {
						return this.scripts.TEXT_BOX.text;
					}
				})
			},
			draw(){
				function getCursorX(pos) {
					return (pos * this.scripts.TEXT_BOX.fontWidth) + 5 + this.x;
				}
				getCursorX = getCursorX.bind(this);
				this.scripts.TEXT_BOX.drawBackground();
				c.draw(this.scripts.TEXT_BOX.fontColor).text(this.scripts.TEXT_BOX.fontSize + "px Monospace", this.scripts.TEXT_BOX.text, this.x + 5, this.y + (this.height - this.scripts.TEXT_BOX.fontSize) / 2);
				if (this.scripts.TEXT_BOX.selected) {
					let sin = Math.sin(g.frameCount / 8);
					let opacity = Math.round(((sin + 1) / 2));
					let cr = this.scripts.TEXT_BOX.fontColor;
					if (!(cr instanceof Color)) cr = new Color(cr);
					let sel = this.scripts.TEXT_BOX.selection;
					if (sel.start != sel.end) {
						let sx = getCursorX(sel.start);
						let ex = getCursorX(sel.end);
						c.draw(new Color(100, 100, 255, 0.5)).rect(sx, this.y + (this.height - this.scripts.TEXT_BOX.fontSize) / 2, ex - sx, this.height - this.scripts.TEXT_BOX.fontSize);
					}
					c.draw(new Color(cr.red, cr.green, cr.blue, opacity)).rect(getCursorX(sel.end), this.y + (this.height - this.scripts.TEXT_BOX.fontSize) / 2, 2, this.scripts.TEXT_BOX.fontSize);
				}
			}
		});
		s.addScript("BUTTON", {
			init(text, options) {
				this.scripts.BUTTON.text = text;
				this.scripts.BUTTON.fontColor = options.fontColor? options.fontColor:cl.BLACK;
				this.scripts.BUTTON.fontSize = options.fontSize? options.fontSize:20;
				if (!options.drawBackground) {
					this.scripts.BUTTON.drawBackground = function() {
						c.draw(options.backgroundColor? options.backgroundColor:"#ccc").rect(this);
						c.stroke(options.borderColor? options.borderColor:"#222", 3).rect(this);
					}.bind(this);
				} else if (options.drawBackground) {
					this.scripts.BUTTON.drawBackground = function() {
						options.drawBackground.bind(this)();
					}.bind(this);
				}
				Object.defineProperty(this, "onclick", {
					set(a) {
						this.response.click = a.bind(this);
					},
					get() {
						return this.response.click;
					}
				})
			},
			draw() {
				this.scripts.BUTTON.drawBackground();
				let previous = c.textMode;
				c.textMode = "center";
				c.draw(this.scripts.BUTTON.fontColor).text(this.scripts.BUTTON.fontSize + "px Monospace", this.scripts.BUTTON.text, this.middle.x, this.y + (this.height - this.scripts.BUTTON.fontSize) / 2);

				c.textMode = previous;
			}
		});
	}
	get width () {
		return this.s.display.width;
	}
	get height () {
		return this.s.display.height;
	}
	loadImage(src){
		let x = new Image;
		x.src = this.SPRITE_PATH + src;
		return x;
	}
	loadSound(src){
		let x = new Audio(this.SOUND_PATH + src);
		return x;
	}
	rand(){
		return Math.random();
	}
	middle(){
		return this.c.middle();
	}
}