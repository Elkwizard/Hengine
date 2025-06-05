/**
 * Represents the engine itself. Contains all the main functionality in its properties.
 * All properties of this class are available as properties of the global object. 
 * @prop KeyboardHandler keyboard | The keyboard API
 * @prop MouseHandler mouse | The mouse API
 * @prop TouchHandler touches | The touch screen API
 * @prop ClipboardHandler clipboard | The clipboard API
 * @prop CanvasImage canvas | The canvas associated with the engine
 * @prop CanvasArtist renderer | The 2D (and 3D, in 3D Mode) renderer associated with the canvas. Draws directly on the screen
 * @prop Scene scene | The scene containing all the objects currently in the engine
 * @prop IntervalManager intervals | The interval manager managing the update loop of the engine
 * @prop FileSystem fileSystem | The file system for the engine. This property persists across reloads and different sessions via `localStorage`
 */
class Hengine {
	constructor() {
		const wrapper = document.body;

		//setup canvas and scene
		const canvas = document.createElement("canvas");

		canvas.width = innerWidth;
		canvas.height = innerHeight;

		canvas.id = "hengineCanvas";
		canvas.style.position = "absolute";

		wrapper.style.margin = 0;
		wrapper.style.overflow = "hidden";
		
		wrapper.appendChild(canvas);
		
		// input / output
		this.mouse = new MouseHandler(this);
		this.touches = new TouchHandler(this);
		this.keyboard = new KeyboardHandler(this);
		this.clipboard = new ClipboardHandler();

		// rendering
		this.canvas = new CanvasImage(canvas, this);
		this.renderer = this.canvas.renderer;
		
		this.scene = new Scene(this);
		this.canvas.updateSize(); // requires camera, created by scene

		//update loops
		this.intervals = new IntervalManager(this);

		// create file system
		const segments = location.toString().split("/");
		const storageKey = `HengineFileSystem://${segments[segments.length - 2] ?? segments[segments.length - 1]}`;
		this.fileSystem = storageKey in localStorage ? FileSystem.fromString(localStorage[storageKey]) : new FileSystem();
		addEventListener("beforeunload", () => {
			this.scene.destroy();
			localStorage[storageKey] = this.fileSystem;
		});
	}
	/**
	 * Destroys the engine instance and removes the canvas.
	 */
	end() {
		exit("Hengine.end()");
		let canvas = document.getElementById(this.renderer.canvas.id);
		if (canvas) canvas.remove();
	}
}