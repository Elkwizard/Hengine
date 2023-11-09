/**
 * Represents the way a canvas scales with changes to the window size.
 * @static_prop Symbol STRETCH | The canvas changes size to fill the entire window
 * @static_prop Symbol PRESERVE_ASPECT_RATIO | The canvas will be the largest size that can fit in the window while still retaining the same aspect ratio
 * @static_prop Symbol INTEGER_MULTIPLE | Same as `ScalingMode.PRESERVE_ASPECT_RATIO`, except the scale factor on the size will always be in the form (n) or (1/n), where n is an integer
 */
const ScalingMode = defineEnum("STRETCH", "PRESERVE_ASPECT_RATIO", "INTEGER_MULTIPLE");

/**
 * Represents the canvas on which the Hengine is rendered.
 * The pixel ratio of the canvas is equal to `window.devicePixelRatio`.
 * The `.width` and `.height` properties of this class are also available on the global object.
 * A vector with components equal to half the dimensions of the canvas is also available on the global object in the `.middle` property.
 * ```js
 * canvas.scalingMode = ScalingMode.STRETCH;
 * 
 * intervals.continuous(() => { // render a circle to the middle of the screen
 * 	renderer.draw(new Color("blue")).circle(middle, 10);
 * });
 * ```
 * @prop Artist renderer | A renderer which can draw to the screen
 * @prop ImageType/String cursor | The cursor icon. This can be either an image or a CSS cursor name
 * @prop ScalingMode scalingMode | The way in which the canvas scales when the window is resized. Starts as `ScalingMode.PRESERVE_ASPECT_RATIO`
 * @prop () => void clearScreen | The function that will be called to clear the screen each frame. Starts as `() => renderer.fill(new Color(255, 255, 255))`
 */
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
		this._cursor = a;
		if (a instanceof ImageType) {
			this.canvas.style.cursor = `url('${a.toDataURL()}') ${a.pixelWidth / 2} ${a.pixelHeight / 2}, auto`;
		} else this.canvas.style.cursor = a;
	}
	get cursor() {
		return this._cursor;
	}
	onresize(width, height) {
		this.renderer.resize(width, height);
		if (this.engine.scene) this.engine.scene.camera.position = this.renderer.middle;
		this.updateSize();
	}
	screenSpaceToCanvasSpace(point) {
		const bound = this.canvas.getBoundingClientRect();
		const scale = this.width / bound.width;
		return point.minus(bound).mul(scale);
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