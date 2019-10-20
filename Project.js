class Project{
	constructor(wrapperID, width, height, airResistance, gravity, canvasID){
		this.g = new Engine(wrapperID, width, height, airResistance, gravity, canvasID);
		this.s = this.g.scene;
		this.c = this.g.renderer;
		this.C = this.c.c;
		this.custom = {};
		this.cl = new ColorLibrary();
		window.g = this.g;
		window.s = this.s;
		window.c = this.c;
		window.C = this.C;
		window.cl = this.cl;
		window.width = this.width;
		window.height = this.height;
		window.custom = this.custom;
		window.loadImage = this.loadImage.bind(this);
		window.loadSound = this.loadSound.bind(this);
		window.rand = this.rand.bind(this);
		window.middle = this.middle.bind(this);
		this.SPRITE_PATH = "../Art/Sprites/";
		this.ANIMATION_PATH = "../Art/Animations/";
		this.SOUND_PATH = "../Sound/";
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