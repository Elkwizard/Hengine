class Hengine {
	constructor() {
		let wrapper = document.body;

		//setup canvas and scene
		let canvas = document.createElement("canvas");
		canvas.id = "hengineCanvas";
		canvas.style.position = "absolute";

		wrapper.style.margin = 0;
		wrapper.style.overflow = "hidden";
		
		wrapper.appendChild(canvas);
		
		//Input / Output
		this.mouse = new MouseHandler(canvas, this);
		this.keyboard = new KeyboardHandler();
		this.clipboard = new ClipboardHandler();
		this.fileSystem = new FileSystem();
		this.canvas = new CanvasManager(canvas, this);
		this.renderer = this.canvas.renderer;
		
		this.scene = new Scene(new Vector2(0, 0.4), this);
		
		this.canvas.updateSize();

		//update loops
		this.intervals = new IntervalManager(this);
	}
	end() {
		exit("Hengine.end()");
		let canvas = document.getElementById(this.renderer.canvas.id);
		if (canvas) canvas.remove();
	}
}