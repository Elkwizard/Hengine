/**
 * Represents the way a canvas scales with changes to the window size.
 * @static_prop ScalingMode STRETCH | The canvas changes size to fill the entire window
 * @static_prop ScalingMode PRESERVE_ASPECT_RATIO | The canvas will be the largest size that can fit in the window while still retaining the same aspect ratio
 * @static_prop ScalingMode INTEGER_MULTIPLE | Same as `ScalingMode.PRESERVE_ASPECT_RATIO`, except the scale factor on the size will always be in the form (n) or (1/n), where n is an integer
 */
const ScalingMode = Enum.define("STRETCH", "PRESERVE_ASPECT_RATIO", "INTEGER_MULTIPLE");

/**
 * @3d CanvasArtist = CanvasArtist2D -> Artist3D
 */

/**
 * Represents the canvas on which the Hengine is rendered.
 * The pixel ratio of the canvas is equal to `window.devicePixelRatio`.
 * The `.width` and `.height` properties of this class are also available on the global object.
 * A vector with components equal to half the dimensions of the canvas is also available on the global object in the `.middle` property.
 * This class is available via the `.canvas` property of both the global object and Hengine.
 * ```js
 * canvas.scalingMode = ScalingMode.STRETCH;
 * 
 * intervals.continuous(() => { // render a circle to the middle of the screen
 * 	renderer.draw(new Color("blue")).circle(middle, 10);
 * });
 * ```
 * @prop CanvasArtist2D ui | A 2D renderer which can draw to the screen. In 3D Mode, rendering to this will act as an overlay for the Scene
 * @prop CanvasArtist renderer | A 2D or 3D renderer which can draw to the screen. WorldObjects will be drawn to this surface. In 2D Mode, this is the same as `.ui`
 * @prop ImageType/String cursor | The cursor icon. This can be either an image or a CSS cursor name
 * @prop ScalingMode scalingMode | The way in which the canvas scales when the window is resized. Starts as `ScalingMode.PRESERVE_ASPECT_RATIO`
 * @prop () => void clearScreen | The function that will be called to clear the screen each frame. Starts as `() => renderer.fill(new Color(255, 255, 255))`
 */
class CanvasImage extends ImageType {	
	constructor(canvas, engine) {
		super(canvas.width, canvas.height, __devicePixelRatio);
		this.canvas = canvas;
		this.engine = engine;

		this.ui = new CanvasArtist2D(this.canvas, this);
		if (IS_3D) {
			this.frame3D = new Frame3D(this.width, this.height, this.pixelRatio);
			this.renderer = this.frame3D.renderer;
		} else {
			this.renderer = this.ui;
		}
		
		this.scalingMode = ScalingMode.PRESERVE_ASPECT_RATIO;

		window.addEventListener("resize", () => {
			if (this.scalingMode === ScalingMode.STRETCH) {
				this.width = innerWidth;
				this.height = innerHeight;
			} else this.updateSize();
		});

		this.clearScreen = () => this.ui.fill(Color.WHITE);

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
	get screenToCanvasOffset() {
		const { x, y } = this.canvas.getBoundingClientRect();
		return new Vector2(-x, -y);
	}
	get screenToCanvasScale() {
		return this.width / this.canvas.getBoundingClientRect().width;
	}
	screenDeltaToCanvas(point) {
		return point.mul(this.screenToCanvasScale);
	}
	screenToCanvas(point) {
		return point
			.plus(this.screenToCanvasOffset)
			.mul(this.screenToCanvasScale);
	}
	onresize(width, height) {
		this.ui.resize(width, height);
		if (IS_3D) {
			this.renderer.resize(width, height);
		} else {
			if (this.engine.scene)
				this.engine.scene.camera.position = this.ui.middle;
		}
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
	startRendering() {
		this.ui.clearTransformations();
		if (IS_3D) {
			this.renderer.clearTransformations();
			this.ui.clear();
			this.clearScreen();
		} else {
			this.clearScreen();
		}
	}
	endRendering() {
		if (IS_3D) {
			this.renderer.render(this.engine.scene.camera);
			this.ui.save();
			this.ui.blendMode = BlendMode.BEHIND;
			this.ui.image(this.frame3D).default(0, 0);
			this.ui.restore();
			this.renderer.clear();
		}
	}
	makeImage() {
		this.endRendering();
		return this.canvas;
	}
}