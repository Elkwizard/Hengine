/**
 * Represents an offscreen image onto which 3D graphics can be drawn.
 * By default, rendering will be done in the frame's World-Space, though this can be changed via `.camera.drawInCameraSpace()`.
 * @prop<readonly> Artist3D renderer | The renderer which can be used to add meshes and lights to the frame
 * @prop Camera3D camera | The view from which the objects will be rendered
 */
class Frame3D extends ImageType {
	/**
	 * Creates a new Frame3D.
	 * @param Number width | The natural width of the canvas
	 * @param Number height | The natural height of the canvas
	 * @param Number pixelRatio? | The width, in pixels, of a single unit of natural width in the image. Default is the pixel ratio for the user's monitor 
	 */
	constructor(width, height, pixelRatio = __devicePixelRatio) {
		super(width, height, pixelRatio);
		this.image = new_OffscreenCanvas(this.pixelWidth, this.pixelHeight);
		this.renderer = new Artist3D(this.image, this);
		this.camera = new Camera3D(this);
	}
	onresize(width, height) {
		this.renderer.resize(width, height);
	}
	makeImage() {
		this.renderer.render(this.camera);
		return this.image;
	}
}