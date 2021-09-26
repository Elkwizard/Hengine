const ScalingMode = defineEnum("STRETCH", "PRESERVE_ASPECT_RATIO", "INTEGER_MULTIPLE");

class CanvasImage extends ImageType {	
	constructor(canvas, engine) {
		super(canvas.width, canvas.height, __devicePixelRatio);
		this.canvas = canvas;
		this.engine = engine;

		this.renderer = new Artist(this.canvas, this.width, this.height, this, __devicePixelRatio);

		this.scalingMode = ScalingMode.PRESERVE_ASPECT_RATIO;

		window.addEventListener("resize", () => {
			if (this.scalingMode === ScalingMode.STRETCH) {
				this.width = innerWidth;
				this.height = innerHeight;
			} else this.updateSize();
		});

		this.clearScreen = () => this.renderer.fill(Color.WHITE);

		this.cursor = "default";
	}
	set scalingMode(a) {
		this._scalingMode = a;
		
		if (this.scalingMode === ScalingMode.STRETCH) {
			this.width = innerWidth;
			this.height = innerHeight;
		} else this.updateSize();
	}
	get scalingMode() {
		return this._scalingMode;
	}
	set cursor(a) {
		this.canvas.style.cursor = a;
	}
	get cursor() {
		return this.canvas.style.cursor;
	}
	onresize(width, height) {
		this.renderer.resize(width, height);
		if (this.engine.scene) this.engine.scene.camera.position = this.renderer.middle;
		this.updateSize();
	}
	updateSize() {
		let packed = new Rect(0, 0, innerWidth, innerHeight).largestWithin(this.width, this.height);

		if (this.scalingMode === ScalingMode.INTEGER_MULTIPLE) {
			let scale = packed.width / this.width;
			if (scale < 1) {
				const newScale = 1 / Math.ceil(1 / scale);
				packed = packed.scale(newScale / scale);
			} else {
				const newScale = Math.floor(scale);
				packed = packed.scale(newScale / scale);
			}
		}

		this.canvas.style.left = packed.x + "px";
		this.canvas.style.top = packed.y + "px";
		this.canvas.style.width = packed.width + "px";
		this.canvas.style.height = packed.height + "px";
	}
	makeImage() {
		return this.canvas;
	}
}