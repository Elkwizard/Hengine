const ScalingMode = defineEnum("STRETCH", "PRESERVE_ASPECT_RATIO", "INTEGER_MULTIPLE");

class CanvasManager {
	constructor(canvas, engine) {
		this.canvas = canvas;
		this.engine = engine;
		
		this.renderer = new Artist(canvas, innerWidth, innerHeight, null, () => {
			this.updateSize();
			engine.scene.camera.position = this.renderer.middle;
		});

		this.scalingMode = ScalingMode.STRETCH;

		window.addEventListener("resize", () => {
			if (this.scalingMode === ScalingMode.STRETCH) {
				this.renderer.width = innerWidth;
				this.renderer.height = innerHeight;
			}
			this.updateSize();
		});

		this.clearScreen = () => this.renderer.fill(Color.WHITE);
	}
	
	updateSize() {
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

		this.canvas.style.left = packed.x + "px";
		this.canvas.style.top = packed.y + "px";
		this.canvas.style.width = packed.width + "px";
		this.canvas.style.height = packed.height + "px";
	}
}