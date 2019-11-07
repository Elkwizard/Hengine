class Light{
    constructor(name, color, x, y, intensity, radius, home){
        if (color instanceof Color) this.color = color.get_RGBA();
		else this.color = color;
        this.name = name;
        this.x = x;
        this.y = y;
        this.home = home;
        this.radius = radius;
        this.intensity = intensity;
		this.custom = {};
        this.fill = this.home.c.c.createRadialGradient(0, 0, this.intensity, 0, 0, this.radius);
        this.fill.addColorStop(0, this.color);
        this.fill.addColorStop(1, "transparent");
    }
    draw(){
		if(this.home.home.getDistanceWithPoints(this.home.display.middle, this) < this.radius + Math.max(this.home.display.width, this.home.display.height)){
			this.home.c.c.translate(this.x, this.y);
			this.home.c.draw(this.fill).circle(0, 0, this.radius);
			this.home.c.c.translate(-this.x, -this.y);
		}
    }
	centerAt(point){
		this.x = point.x;
		this.y = point.y;
	}
}
class Directions {
	constructor(up, down, left, right, prec){
		this.up = up;
		this.down = down;
		this.left = left;
		this.right = right;
		if(prec === undefined) prec = 0.3;
		this.prec = prec;
	}
	fixH(val){
		if (this.left && this.right) return val;
		if (this.left) return -Math.abs(val);
		if (this.right) return Math.abs(val);
		else return val * this.prec;
	}
	fixV(val){
		if (this.up && this.down) return val;
		if (this.up) return -Math.abs(val);
		if (this.down) return Math.abs(val);
		else return val * this.prec;
	}
}
class InactiveScene {
	constructor(name, gravity, airResistance){
		if(!gravity) gravity = 0.1;
		if(!airResistance) airResistance = 0.025;
		this.gravity = gravity;
        this.airResistance = airResistance
        this.name = name;
        this.rebound = 0;
		this.contains_array = [];
        this.lightsF = {};
        this.lightsB = {};
		this.custom = {};
		this.templates = {};
		this.defaultDraw = function(){
			if (this.radius === undefined) {
				c.draw("#000").rect(this.x, this.y, this.width, this.height);
				c.stroke("cyan", 1).rect(this.x+0.5, this.y+0.5, this.width-1, this.height-1);
			} else {
				c.draw("#000").circle(this.x, this.y, this.radius);
				c.stroke("cyan", 1).circle(this.x, this.y, this.radius - 1);
			}
		}
		this.defaultPhysDraw = function(){
			if (this.radius === undefined) {
				c.draw("#000").rect(this.x, this.y, this.width, this.height);
				c.stroke("red", 1).rect(this.x+0.5, this.y+0.5, this.width-1, this.height-1);
			} else {
				c.draw("#000").circle(this.x, this.y, this.radius);
				c.stroke("red", 1).circle(this.x, this.y, this.radius - 1);
			}
		}
		this.defaultParticleDraw = function(){
			this.home.c.draw("Black").circle(this.middle.x, this.middle.y, this.width / 2);
		}
		this.defaultUpdate = function(){}
		this.contains = {};
	}
	useScript(script){
		let lines = script.split(",");
		let SCENE_P = false;
		let other_P = false;
		for(let line of lines){
			line = line.trim();
			if(line == "SCENE:SCENE"){
				SCENE_P = true;
			}
			else if(SCENE_P){
				if(line == "END"){
					SCENE_P = false;
				} else {
					let prop = line.split("=")[0].trim();
					let value = line.split("=")[1].trim();
					value = eval(value);
					this[prop] = value;
				}
			}
			else if(line.search(/SCENE\:/g) > -1){
				let str = "";
				for(let i = 6; i < line.length; i++){
					str += line[i];
				}
				other_P = this.get(str);
			}
			else if(other_P !== false){
				if(line == "END"){
					other_P = false;
				} else {
					let prop = line.split("=")[0].trim();
					let value = line.split("=")[1].trim();
					value[value.length-1] = "";
					value = eval(value);
					other_P[prop] = value;
				}
			}
		}
	}
    updateArray(){
		this.contains_array = [];
		for(let rect in this.contains){
			let cont = this.contains[rect];
			if (cont instanceof InactiveScene) {
				if (cont.active) {
					let ary = cont.updateArray();
					this.contains_array.push(...ary);
				}
			} else this.contains_array.push(cont);
		}
		return this.contains_array;
    }
	copy(el){
		let n;
		if (el.hasPhysics) {
			if (el.isSpawner) {
				n = this.addParticleSpawner(el.name + " - copy", el.x, el.y, el.particleSize, el.initSpeed, el.delay, el.timer, el.particleDraw, el.pSizeVariance, el.pSpeedVariance, el.dirs);
				n.width = el.width;
				n.height = el.height;
				n.slows = el.slows;
				n.fades = el.fades;
				n.active = el.active;
				n.falls = el.falls;
			} else {
				n = this.addRectElement(el.name + " - copy", el.x, el.y, el.width, el.height, el.applyGravity, {...el.controls}, el.tag);
			}
		} else {
			n = this.addElement(el.name + " - copy", el.x, el.y, el.width, el.height, {...el.controls}, el.tag);
		}
		el.runLog(n);
		for (let ch in el.children) {
			let child = el.children[ch];
			let x = n.addChild(this.copy(child));
		}
		return n;
	}
	hideElement(name){
		this.performFunctionBasedOnType_PRIVATE(name, function(e){
			this.contains[e].hide();
			this.contains[e].logMod(function HIDE(){
				this.hide();
			});
		}.bind(this));
		return this;
	}
	showElement(name){
		this.performFunctionBasedOnType_PRIVATE(name, function(e){
			this.contains[e].show();
			this.contains[e].logMod(function SHOW(){
				this.show();
			});
		}.bind(this));
		return this;
	}
	genName_PRIVATE(database, name){
		let num = 0;
		let n = name;
		function check(){
			n = name;
			if(num) n += " (" + num + ")";
			return n;
		}
		while(database[check()] !== undefined) num++;
		return n;
	}
	addElement(name, x, y, width, height, controls = new Controls(), tag = "", src=""){
		name = this.genName_PRIVATE(this.contains, name);
		if(width < 0){
            width = -width;
            x -= width;
        }
        if(height < 0){
           height = -height;
            y -= height;
        }
		this.contains[name] = new SceneObject(name, x, y, width, height, controls, tag, this);
		let n = this.contains[name];
		let self = this;
		if (src) {
			let img = loadImage(src);
			this.changeElementDraw(n, function(){
				c.drawImage(img, this.x, this.y, this.width, this.height);
			});
		} else n.mod(function(){
			this.draw = self.defaultDraw.bind(this);
			this.update = self.defaultUpdate.bind(this);
		});
		return n;
	}
	addRectElement(name, x = 0, y = 0, width = 0, height = 0, gravity = false, controls = new Controls(), tag = "", src=""){
		name = this.genName_PRIVATE(this.contains, name);
        if(width < 0){
            width = -width;
            x -= width;
        }
        if(height < 0){
           height = -height;
            y -= height;
        }
		this.contains[name] = new PhysicsObject(name, x, y, width, height, gravity, controls, tag, this);
		let n = this.contains[name];
		let self = this;
		if (src) {
			let img = loadImage(src);
			this.changeElementDraw(n, function(){
				c.drawImage(img, this.x, this.y, this.width, this.height);
			});
		} else n.mod(function(){
			this.draw = self.defaultPhysDraw.bind(this);
			this.update = self.defaultUpdate.bind(this);
		});
		return n;
	}
	addCircleElement(name, x = 0, y = 0, radius = 0, gravity = false, controls = new Controls(), tag = "", src=""){
		name = this.genName_PRIVATE(this.contains, name);
		if (radius < 0) {
			radius *= -1;
			x -= radius * 2;
			y -= radius * 2;
		}
		this.contains[name] = new CirclePhysicsObject(name, x, y, radius, gravity, controls, tag, this);
		let n = this.contains[name];
		let self = this;
		if (src) {
			let img = loadImage(src);
			this.changeElementDraw(n, function(){
				c.drawImage(img, this.x - this.radius, this.y - this.radius, this.width, this.height);
			});
		} else n.mod(function(){
			this.draw = self.defaultPhysDraw.bind(this);
			this.update = self.defaultUpdate.bind(this);
		});
		return n;
	}
	addUI(name, x, y, width, height, draw=function(){}){
		let n = this.addElement(name, x, y, width, height, new Controls(), "UI");
		this.UI(n);
		n.draw = draw.bind(n);
		return n;
	}
	addContainer(name, active) {
		name = this.genName_PRIVATE(this.contains, name);
		let x = new InactiveScene(name);
		x.active = active;
		x.home = this.home;
		this.contains[name] = x;
		return x;
	}
	parse(str) {
		let ary = str.split("#");
		let sc = this.addContainer(ary[0], true);
		for (let i = 1; i < ary.length;) {
			let type = ary[i++];
			let name = ary[i++];
			let tag = ary[i++];
			let x = parseFloat(ary[i++]);
			let y = parseFloat(ary[i++]);
			let width = parseFloat(ary[i++]);
			let height = parseFloat(ary[i++]);
			let n;
			let controls;
			function getControls(){
				controls = ary[i++];
				controls = controls.slice(1, controls.length - 1);
				controls = controls.split("%");
				controls = new Controls(controls[0], controls[1], controls[2], controls[3], controls[4], controls[5]);
			}
			function getScripts(){
				let scr = ary[i++];
				if (scr !== "[]"){
					scr = scr.slice(1, scr.length - 1);
					scr = scr.split("%");
					for (let x of scr) {
						let r = window[x];
						r.addTo(n);
					}
				}
			}
			switch (type) {
				case "p":
					getControls();
					let gravity = (ary[i++] === "true");
					n = sc.addRectElement(name, x, y, width, height, gravity, controls, tag);
					getScripts();
					break;
				case "s":
					getControls();
					n = sc.addParticleSpawner(name, x, y, ary[i++], ary[i++], ary[i++], ary[i++], eval(ary[i++]), ary[i++], ary[i++]);
					let dirs = ary[i++];
					dirs = dirs.slice(1, dirs.length - 1);
					dirs = dirs.split("%");
					n.dirs = new Directions(parseFloat(dirs[0]), parseFloat(dirs[1]), parseFloat(dirs[2]), parseFloat(dirs[3]), parseFloat(dirs[4]));
					n.slows = ary[i++];
					n.fades = ary[i++];
					n.falls = ary[i++];
					n.controls = controls;
					n.width = width;
					n.height = height;
					n.tag = tag;
					break;
				case "u":
					n = sc.addUI(name, x, y, width, height);
					getScripts();
					break;
				case "e":
					getControls();
					n = sc.addElement(name, x, y, width, height, controls, tag);
					getScripts();
					break;
			}
		}
		return sc;
	}
	encode(...ary) {
		let resAry = ["Encoded-Scene"];
		for (let x of ary) {
			let l = "";
			if (x.hasPhysics) l = "p";
			else if (x.isUI) l = "u";
			else if (x.isSpawner) l = "s";
			else l = "e";
			resAry.push(l, x.name, x.tag, x.x, x.y, x.width, x.height);
			function f(e){
				let r = x.controls[e];
				if (!r) r = "";
				return r;
			}
			let cont = `[${f("up")}%${f("down")}%${f("left")}%${f("right")}%${f("interact1")}%${f("interact2")}]`;
			if (l !== "u") resAry.push(cont);
			if (l === "p") resAry.push(x.applyGravity);
			if (l === "s") {
				let dirs = `[${x.dirs.up}%${x.dirs.down}%${x.dirs.left}%${x.dirs.right}%${x.dirs.prec}]`;
				resAry.push(x.particleSize, x.initSpeed, x.delay, x.timer, x.particleDraw, x.pSizeVariance, x.pSpeedVariance, dirs, x.slows, x.fades, x.falls);
			} else {
				let scripts = [];
				for (let m in x.scripts) {
					scripts.push(m);
				}
				resAry.push("[" + scripts.join("%") + "]");
			}
		}
		return resAry.join("#");
	}
	addScript(name, opts) {
		window[name] = new ElementScript(name, opts);
		return window[name];
	}
	addParticleSpawner(name, x, y, size = 1, spd = 1, delay = 1, timer = 50, draw, sizeVariance = 0, speedVariance = 0, dirs = new Directions(1, 1, 1, 1)){
		let ns = this.addRectElement(name, x, y, 0, 0, false, false, "Particle-Spawner");
		ns.active = true;
		ns.removeCollisions();
		ns.fades = true;
		ns.slows = true;
		ns.falls = false;
		ns.delay = delay;
		ns.initSpeed = spd;
		ns.timer = timer;
		ns.spawns = {};
		ns.particleSize = size;
		ns.particleDraw = draw;
		ns.pSizeVariance = sizeVariance;
		ns.dirs = dirs;
		ns.isSpawner = true;
		ns.pSpeedVariance = speedVariance;
		ns.particleNumber = 0;
		this.changeElementDraw(ns, e=>e);
		let spawner = new ElementScript("spawning");
		spawner.addMethod("spawn", function(){
			if(this.active && this.lifeSpan % this.delay === 0){
				//spawn
				let pSize = this.particleSize + ((Math.random() - Math.random()) * this.pSizeVariance);
				let sX = (Math.random() * this.width) + this.x - pSize / 2;
				let sY = (Math.random() * this.height) + this.y - pSize / 2;
				let n = this.home.addRectElement("Particle #" + (this.particleNumber++) + " from " + this.name, sX, sY, pSize, pSize, false, false, "Engine-Particle");
				let x1 = Math.random() - Math.random();
				let y1 = ((Math.random() > 0.5)? -1 : 1) * (1 - Math.abs(x1));
				let speed = new Vertex(x1, y1);
				speed.y = this.dirs.fixV(y1);
				speed.x = this.dirs.fixH(speed.x);
				n.speed.x = (this.initSpeed * speed.x) + ((Math.random() - Math.random()) * this.pSpeedVariance);
				n.speed.y = (this.initSpeed * speed.y) + ((Math.random() - Math.random()) * this.pSpeedVariance);
				n.timer = 0;
				n.layer = this.layer;
				this.spawns[n.name] = n;
				n.spawner = this;
				n.engineUpdate = function(){
					if(ns.falls) this.accel.y = this.home.acceleration;
					this.speed.x += this.accel.x;
					this.speed.y += this.accel.y;
					if(ns.slows){
						this.slowDown();
					}
					this.x += this.speed.x * 2;
					this.y += this.speed.y * 2;
					if(this.timer++ > ns.timer) {
						delete this.spawner[this.name];
						this.remove();
					}
				}.bind(n);
				if(this.fades){
					n.engineDraw = function(){
						this.home.c.c.globalAlpha = Math.max(0, 1 - (this.timer / ns.timer));
						this.draw();
						this.home.c.c.globalAlpha = 1;
					}.bind(n);
				} else {
					n.engineDraw = function(){
						this.draw();
					}.bind(n);
				}
				if (this.particleDraw) {
					this.home.changeElementDraw(n, this.particleDraw);
				} else {
					this.home.changeElementDraw(n, this.home.defaultParticleDraw);
				}
			}
		}, "update");
		spawner.addTo(ns);
		return ns;
	}
	removeElement(name){
		this.performFunctionBasedOnType_PRIVATE(name, function(e){
			let x = this.contains[e.name];
			if (x) {
				x.isDead = true;
				delete this.contains[e.name];
			} else {
				e.home.removeElement(e);
			}
		}.bind(this));
	}
	removeAllElements(){
		for(let x in this.contains){
			delete this.contains[x];
		}
	}
	get(name){
		if (typeof name === "object") {
			return name;
		} else {
			return this.contains[name];
		}
	}
	makeTemp(name, el){
		this.templates[name] = {...el};
		return this.templates[name];
	}
	instantiate(name, p){
		let n;
		if(typeof name === "string"){
			n = this.copy(this.templates[name]);
		} else {
			n = this.copy(name);
		}
		n.position(p);
		return n;
	}
	getAllElements(){
		this.updateArray();
		return this.contains_array;
	}
	getElementsWithTag(tag){
		let ary = [];
		let oAry = this.updateArray();
		for(let rect of oAry) {
			if(rect.tag === tag) {
				ary.push(rect);
			}
		}
		return ary;
	}
    addLightB(name, color, x, y, radius, intensity){
		name = this.genName_PRIVATE(this.lightsB, name);
        this.lightsB[name] = new Light(name, color, x, y, radius, intensity, this)
        return this.lightsB[name]
    }
    getLightB(name){
        return this.lightsB[name]
    }
    addLightF(name, color, x, y, radius, intensity){
		name = this.genName_PRIVATE(this.lightsF, name);
        this.lightsF[name] = new Light(name, color, x, y, radius, intensity, this)
        return this.lightsF[name]
    }
    getLightF(name){
        return this.lightsF[name]
    }
    removeLightB(name){
        delete this.lightsB[name];
    }
    removeLightF(name){
    	delete this.lightsF[name];
	}
    isElementColliding(name){
		this.updateArray();
		let isCol = this.get(name).collideAll(this.contains_array, true);
        return isCol !== false;
    }
	performFunctionBasedOnType_PRIVATE(name, func){
		if(typeof name === "object"){
			if(Array.isArray(name)){
				for(let item of name){
					this.performFunctionBasedOnType_PRIVATE(item, func);
				}
			} else {
				func(name);
			}
		} else {
			func(this.get(name));
		}
	}
	UI(name){
		this.performFunctionBasedOnType_PRIVATE(name, function(e){
			let el = e;
			el.offset = new Vertex(el.x, el.y);
			this.home.updateScript.addMethod(e + "__AdjustPosition__", function(){
				if(this.get(e)){
					el.x = el.home.display.x + el.offset.x;
					el.y = el.home.display.y + el.offset.y;
				}
			}.bind(this));
			el.isUI = true;
			e.logMod(function UI(){
				this.home.UI(this);
			});
		}.bind(this));
		return this;
	}
	changeElementDraw(name, newDraw){
		this.performFunctionBasedOnType_PRIVATE(name, function(e){
			e.draw = newDraw.bind(e);
			e.logMod(function CHANGE_DRAW(){
				this.home.changeElementDraw(this, newDraw);
			});
		}.bind(this));
		return this;
	}
	changeElementMethod(name, method, newMethod){
		this.performFunctionBasedOnType_PRIVATE(name, function(e){
			e[method] = newMethod.bind(e);
			e.logMod(function CHANGE_METHOD(){
				this.home.changeElementMethod(this, method, newMethod);
			});
		}.bind(this));
		return this;
	}
	changeElementResponse(name, input, newResponse){
		this.performFunctionBasedOnType_PRIVATE(name, function(e){
			this.contains[e].response.input[input] = newResponse.bind(this.contains[e]);
			this.contains[e].logMod(function CHANGE_INPUT(){
				this.home.changeElementResponse(this, input, newResponse);
			});
		}.bind(this));
		return this;
	}
	changeElementUpdate(name, newUpdate){
		this.performFunctionBasedOnType_PRIVATE(name, function(e){
			e.update = newUpdate.bind(e);
			e.logMod(function CHANGE_UPDATE(){
				this.home.changeElementUpdate(this, newUpdate);
			});
		}.bind(this));
		return this;
	}
	changeElementCollideResponse(name, dir, newResponse){
		this.performFunctionBasedOnType_PRIVATE(name, function(e){
			e.response.collide[dir] = newResponse.bind(e);
			e.logMod(function CHANGE_COLLIDE_RESPONSE(){
				this.home.changeElementCollideResponse(this, dir, newResponse);
			});
		}.bind(this));
		return this;
	}
	changeElementCollideRule(name, newRule){
		this.performFunctionBasedOnType_PRIVATE(name, function(e){
			e.collideBasedOnRule = newRule.bind(e);
			e.logMod(function CHANGE_COLLIDE_RULE(){
				this.home.changeElementCollideRule(this, newRule);
			});
		}.bind(this));
		return this;
	}
	changeElementCollideOptimize(name, newRule){
		this.performFunctionBasedOnType_PRIVATE(name, function(e){
			e.optimize = newRule.bind(e);
			e.logMod(function CHANGE_COLLIDE_OPTIMIZE(){
				this.home.changeElementCollideOptimize(this, newRule);
			});
		}.bind(this));
		return this;
	}
	changeAllElementDraw(newDraw){
		this.defaultDraw = newDraw;
		this.defaultPhysDraw = newDraw;
	}
	changeAllElementUpdate(newUpdate){
		this.defaultUpdate = newUpdate;
	}
	clearAllCollisions(){
		for(let rect of this.updateArray()){
			if(rect.clearCollisions){
				rect.clearCollisions();
			}
		}
	}
	collideBox(box){
        let collideAry = [];
		for(let hitbox of this.updateArray()){
			if(hitbox.collider.collideBox(box)){
				collideAry.push(hitbox);
			}
		}
        return collideAry;
	}
	collidePoint(point){
        let collideAry = [];
		for(let hitbox of this.updateArray()){
			if(hitbox.collider.collidePoint(point.x, point.y)){
				collideAry.push(hitbox);
			}
		}
        return collideAry;
	}
	collidePointBoth(point){
		let collideAry = [];
		let notCollideAry = [];
		for(let hitbox of this.contains_array){
			if(hitbox.collider.collidePoint(point.x, point.y)){
				collideAry.push(hitbox);
			} else {
				notCollideAry.push(hitbox);
			}
		}
        return [collideAry, notCollideAry]
	}
	giveElementSubjectiveMovement(name){
		this.get(name).custom.jumps = 0;
		this.get(name).custom.jumping = false;
		this.changeElementResponse(name, "right", function(){
			this.accel.x = 0.1;
		})
		this.changeElementResponse(name, "left", function(){
			this.accel.x = -0.1;
		})
		this.changeElementResponse(name, "up", function(){
			if(!this.custom.jumping && this.custom.jumps < 1){
				this.speed.y = -Math.sign(this.accel.y) * (10*(this.accel.y*5))
				this.custom.jumping = true;
				this.custom.jumps++;
			}			
		})
		this.changeElementResponse(name, "down", function(){
			this.speed.y += this.accel.y;
		})
		this.changeElementUpdate(name, function(){
			if(!K.P(this.controls.up)) this.custom.jumping = false
            if(!K.P(this.controls.left) && !K.P(this.controls.right)) this.accel.x = 0
		})
		this.changeElementCollideResponse(name, "bottom", function(){
			this.custom.jumps = 0
		})
	}
}
class Scene extends InactiveScene {
	constructor(name, context, gravity, airResistance, home){
		super(name, gravity, airResistance);
		this.c = context;
		this.home = home;
        this.zoom = 1;
        this.cullGraphics = true;
        this.display = new Rect(0, 0, this.c.canvas.width, this.c.canvas.height)
		this.adjustedDisplay = new Rect(this.display.x, this.display.y, this.display.width, this.display.height);
		M.engineClick = function(e){
			let adjusted = this.adjustPointForDisplay(e);
			for(let o of this.collidePoint(adjusted)){
				this.get(o).response.click(adjusted);
			}
		}.bind(this);
		M.engineRightClick = function(e){
			let adjusted = this.adjustPointForDisplay(e);
			for(let o of this.collidePoint(adjusted)){
				this.get(o).response.rightClick(adjusted);
			}
		}.bind(this);
		M.engineMove = function(e){
			let adjusted = this.adjustPointForDisplay(e);
			let collided = this.collidePointBoth(adjusted)
			for(let o of collided[0]){
				if(!o.hovered) o.response.hover(adjusted);
				o.hovered = true;
			}
			for(let o of collided[1]){
				if(o) o.hovered = false;
			}
		}.bind(this);
		this.S = {
			US: this.useScript.bind(this),
			UA: this.updateArray.bind(this),
			DWT: this.drawWithTransformations.bind(this),
			UDA: this.updateDisplayAt.bind(this),
			CDA: this.centerDisplayAt.bind(this),
			ZI: this.zoomIn.bind(this),
			ZO: this.zoomOut.bind(this),
			RZ: this.restoreZoom.bind(this),
			ARE: this.addRectElement.bind(this),
			AE: this.addElement.bind(this),
			APS: this.addParticleSpawner.bind(this),
			RE: this.removeElement.bind(this),
			RAE: this.removeAllElements.bind(this),
			G: this.get.bind(this),
			GAE: this.getAllElements.bind(this),
			GEWT: this.getElementsWithTag.bind(this),
			ALB: this.addLightB.bind(this),
			GLB: this.getLightB.bind(this),
			RLB: this.removeLightB.bind(this),
			ALF: this.addLightF.bind(this),
			GLF: this.getLightF.bind(this),
			RLF: this.removeLightF.bind(this),
			IEC: this.isElementColliding.bind(this),
			CED: this.changeElementDraw.bind(this),
			CEU: this.changeElementUpdate.bind(this),
			CER: this.changeElementResponse.bind(this),
			CECR: this.changeElementCollideResponse.bind(this),
			CAED: this.changeAllElementDraw.bind(this),
			CAEU: this.changeAllElementUpdate.bind(this),
			APFD: this.adjustPointForDisplay.bind(this),
			CP: this.collidePoint.bind(this),
			GESM: this.giveElementSubjectiveMovement.bind(this)
		}
	}
	drawWithTransformations(artist){
        this.c.c.translate(this.c.middle.x, this.c.middle.y)
        this.c.c.scale(this.zoom, this.zoom)
        this.c.c.translate(-this.c.middle.x, -this.c.middle.y)
        this.c.c.translate(-this.display.x, -this.display.y)
        artist();
        this.c.c.translate(this.display.x, this.display.y)
        this.c.c.translate(this.c.middle.x, this.c.middle.y)
        this.c.c.scale(1/this.zoom, 1/this.zoom)
        this.c.c.translate(-this.c.middle.x, -this.c.middle.y)
    }
	repairDisplay(){
		let nMin = new Vertex(this.display.x, this.display.y);
		let nMax = new Vertex(this.display.x + this.display.width, this.display.y + this.display.height);
		nMin = this.adjustPointForZoom(nMin);
		nMax = this.adjustPointForZoom(nMax);
		return new Rect(nMin, nMax);
	}
	enginePhysicsUpdate(){
        this.updateArray();
		this.clearAllCollisions();
		for(let rect of this.contains_array){
			rect.engineUpdate(this.contains_array);
		}
	}
	engineDrawUpdate(){
		this.home.beforeScript.run();
		this.adjustedDisplay = this.repairDisplay();
        this.c.c.translate(this.c.middle.x, this.c.middle.y);
        this.c.c.scale(this.zoom, this.zoom);
        this.c.c.translate(-this.c.middle.x, -this.c.middle.y);
        this.c.c.translate(-this.display.x, -this.display.y);
		this.home.updateScript.run();
        for(let x in this.lightsB){
			this.lightsB[x].draw();
        }
		this.updateArray();
		this.contains_array.sort(function(a, b){
			return a.layer - b.layer;
		});
        for(let rect of this.contains_array){
			rect.engineDraw();
			rect.lifeSpan++;
        }
        for(let x in this.lightsF){
			this.lightsF[x].draw();
        }
        this.c.c.translate(this.display.x, this.display.y);
        this.c.c.translate(this.c.middle.x, this.c.middle.y);
        this.c.c.scale(1/this.zoom, 1/this.zoom);
        this.c.c.translate(-this.c.middle.x, -this.c.middle.y);
		this.home.afterScript.run();
	}
	loadScene(sc){
		sc.updateArray();
		let els = [];
		for(let el of sc.contains_array){
			let n = this.copy(el);
			n.rename(sc.name + "&" + el.name);
			els.push(n);
		}
		return els;
	}
	unloadScene(els){
		this.removeElement(els);
	}
	adjustPointForZoom(point){
		let displayM = this.display.middle; //optimize .middle() calls
		let newX = point.x;
		let newY = point.y;
		let DX = newX - displayM.x; //distance from the middle to the point
		let DY = newY - displayM.y; //distance from the middle to the point
		let distX = Math.abs(DX); //positive distance
		let distY = Math.abs(DY); //positive distance
		newX = this.home.extend(DX, (distX)*((1/this.zoom)-1)); //extend x according to it's distance from the center
		newY = this.home.extend(DY, (distY)*((1/this.zoom)-1)); //extend y according to it's distance from the center
        newX += displayM.x; //re-center x
		newY += displayM.y; //re-center y
		return new Vertex(newX, newY); //return the result
	}
    adjustPointForDisplay(point){
		let displayM = this.display.middle; //optimize .middle() calls
		let newX = point.x + this.display.x //move points to have accurate x with display movement
		let newY = point.y + this.display.y //move points to have accurate y with display movement
		let DX = newX - displayM.x; //distance from the middle to the point
		let DY = newY - displayM.y; //distance from the middle to the point
		let distX = Math.abs(DX); //positive distance
		let distY = Math.abs(DY); //positive distance
		newX = this.home.extend(DX, (distX)*((1/this.zoom)-1)); //extend x according to it's distance from the center
		newY = this.home.extend(DY, (distY)*((1/this.zoom)-1)); //extend y according to it's distance from the center
        newX += displayM.x; //re-center x
		newY += displayM.y; //re-center y
		return new Vertex(newX, newY); //return the result
    }
    updateDisplayAt(x, y, width, height){
        this.display = new Rect(x, y, width, height)
    }
    centerDisplayAt(point){
        this.display.x = point.x - this.c.canvas.width/2;
        this.display.y = point.y - this.c.canvas.height/2;
    }
	moveDisplayTowards(point, ferocity) {
		let goal = P(point.x - this.c.canvas.width / 2, point.y - this.c.canvas.height / 2);
		let pos = P(this.display.x, this.display.y);
		let dif = P(goal.x - pos.x, goal.y - pos.y);
		let move = P(Math.sign(dif.x) * ferocity, Math.sign(dif.y) * ferocity);
		this.display.x = pos.x + move.x;
		this.display.y = pos.y + move.y;
	}
    zoomIn(amount){
        this.zoom *= 1 + amount;
    }
    zoomOut(amount){
        this.zoom /= 1 + amount;
    }
    restoreZoom(){
        this.zoom = 1;
    }
}