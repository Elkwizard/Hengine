const ScalingMode = defineEnum("STRETCH", "PRESERVE_ASPECT_RATIO", "INTEGER_MULTIPLE");
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
		this.mouse = new MouseHandler(this, canvas);
		this.keyboard = new KeyboardHandler();
		this.clipboard = new ClipboardHandler();
		this.fileSystem = new FileSystem();

		this.renderer = new Artist(canvas, innerWidth, innerHeight, null, () => {
			this.updateCanvasSizing();
			this.scene.camera.position = this.renderer.middle;
		});
		
		this.scene = new Scene(new Vector2(0, 0.2), this);
		
		this.updateCanvasSizing();

		//update loops
		this.intervals = new IntervalManager(this);

		this.scalingMode = ScalingMode.STRETCH;

		window.addEventListener("resize", function () {
			if (this.scalingMode === ScalingMode.STRETCH) {
				this.renderer.width = innerWidth;
				this.renderer.height = innerHeight;
			}
			this.updateCanvasSizing();
		}.bind(this));
	}
	updateCanvasSizing() {
		let packed = new Rect(0, 0, innerWidth, innerHeight).largestWithin(this.renderer.width, this.renderer.height);
		
		if (this.scalingMode === ScalingMode.INTEGER_MULTIPLE) {
			let scale = packed.width / this.renderer.width;
			if (scale < 1) {
				let newScale = 1 / Math.ceil(1 / scale);
				packed = packed.scale(newScale / scale);
			} else {
				let newScale = Math.floor(scale);
				packed = packed.scale(newScale / scale);
			}
		}

		this.renderer.canvas.style.left = packed.x + "px";
		this.renderer.canvas.style.top = packed.y + "px";
		this.renderer.canvas.style.width = packed.width + "px";
		this.renderer.canvas.style.height = packed.height + "px";
	}
	end() {
		exit("Hengine.end()");
		let canvas = document.getElementById(this.renderer.canvas.id);
		if (canvas) canvas.remove();
	}
}