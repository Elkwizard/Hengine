/**
 * Represents the engine itself. Contains all the main functionality in its properties.
 * All properties of this class are available as properties of the global object. 
 * @prop KeyboardHandler keyboard | The keyboard API
 * @prop MouseHandler mouse | The mouse API
 * @prop TouchHandler touches | The touch screen API
 * @prop ClipboardHandler clipboard | The clipboard API
 * @prop CanvasImage canvas | The canvas associated with the engine
 * @prop CanvasArtist renderer | The 2D or 3D renderer associated with the canvas. Draws directly on the screen
 * @prop CanvasArtist2D ui | The 2D Screen-Space overlay renderer associated with the canvas. Draws directly on the screen
 * @prop Scene scene | The scene containing all the objects currently in the engine
 * @prop IntervalManager intervals | The interval manager managing the update loop of the engine
 * @prop Files fileSystem | The file system for the engine. This property persists across reloads and different sessions via `localStorage`
 */
class Hengine {
	constructor() {
		// input / output
		this.mouse = new MouseHandler(this);
		this.touches = new TouchHandler(this);
		this.keyboard = new KeyboardHandler(this);
		this.controllers = new Controllers(this);
		this.clipboard = new ClipboardHandler();

		// rendering
		this.canvas = new CanvasImage(document.body, this);
		this.renderer = this.canvas.renderer;
		this.ui = this.canvas.ui;
		
		this.scene = new Scene(this);

		//update loops
		this.intervals = new IntervalManager(this);

		// create file system
		const segments = location.toString().split("/");
		const storageKey = `HengineFiles://${segments[segments.length - 2] ?? segments[segments.length - 1]}`;
		this.fileSystem = storageKey in localStorage ? Files.fromString(localStorage[storageKey]) : new Files();
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