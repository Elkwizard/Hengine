class Hengine {
	constructor() {
		let wrapper = document.body;

		//setup canvas and scene
		let canvas = document.createElement("canvas");

		canvas.width = innerWidth;
		canvas.height = innerHeight;

		canvas.id = "hengineCanvas";
		canvas.style.position = "absolute";

		wrapper.style.margin = 0;
		wrapper.style.overflow = "hidden";
		
		wrapper.appendChild(canvas);
		
		//Input / Output
		this.mouse = new MouseHandler(canvas, this);
		this.keyboard = new KeyboardHandler();
		this.clipboard = new ClipboardHandler();
		this.canvas = new CanvasImage(canvas, this);
		this.renderer = this.canvas.renderer;
		
		this.scene = new Scene(new Vector2(0, 0.4), this);
		
		this.canvas.updateSize();

		//update loops
		this.intervals = new IntervalManager(this);

		// create file system
		const segments = location.toString().split("/");
		const storageKey = `HengineFileSystem://${segments[segments.length - 2] ?? segments[segments.length - 1]}`;
		this.fileSystem = (storageKey in localStorage) ? FileSystem.fromString(localStorage[storageKey]) : new FileSystem();
		addEventListener("beforeunload", () => localStorage[storageKey] = this.fileSystem);
	}
	end() {
		exit("Hengine.end()");
		let canvas = document.getElementById(this.renderer.canvas.id);
		if (canvas) canvas.remove();
	}
}