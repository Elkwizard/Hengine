class Hengine {
	constructor(wrapper = document.body) {
		//setup canvas and scene
		let canvas = document.createElement("canvas");
		canvas.id = "hengineCanvas";

		this.wrapper = wrapper;
		this.wrapper.style.margin = 0;
		this.wrapper.style.overflow = "hidden";
		let bound = wrapper.getClientRects()[0];
		let W = bound.width;
		let H = bound.height;
		this.wrapper.appendChild(canvas);
		
		//Input / Output
		this.mouse = new MouseHandler(this, canvas);
		this.keyboard = new KeyboardHandler();
		this.clipboard = new ClipboardHandler();
		this.fileSystem = new FileSystem();

		this.renderer = new Artist(canvas, W, H);
		this.scene = new Scene(new Vector2(0, 0.2), this);

		//update loops
		this.intervals = new IntervalManager(this);

		this.resize = true;
		window.addEventListener("resize", function () {
			if (this.resize) {
				let pixelate = this.renderer.preservePixelart;
				let bound = this.wrapper.getClientRects()[0];
				if (this.wrapper === document.body) {
					bound = {
						width: innerWidth,
						height: innerHeight
					};
				}
				this.renderer.width = bound.width;
				this.renderer.height = bound.height;
				this.renderer.preservePixelart = pixelate;
			}
		}.bind(this));
	}
	end() {
		exit("HALTED");
		let canvas = document.getElementById(this.renderer.canvas.id);
		if (canvas) canvas.outerHTML = "";
	}
}