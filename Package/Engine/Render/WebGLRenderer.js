/**
 * Represents a 2D renderer based on the WebGL API.
 * This renderer cannot render text or concave polygons.
 * Creating instances of this class is drastically more expensive than creating a CanvasArtist2D, but after it's created, it is generally 10x-100x faster than CanvasArtist2D.
 * Since this is implemented using WebGL, creating a high number of instances of this class should be avoided to prevent context-switching overhead.
 * This should not be constructed directly, and should instead be used in conjunction with FastFrame.
 */
class WebGLArtist2D extends Artist2D {
	constructor(canvas, width, height, imageType, pixelRatio) {
		super();
		this.canvas = canvas;
		this.pixelRatio = pixelRatio;

		this.gl = defineWebGL2DContext({}, true);
		this.gl.create(canvas, true, pixelRatio);

		this.imageType = imageType;

		this.currentColor = Color.BLANK;
		this.currentLineWidth = 1;
		this.currentLineCap = this.gl.LINE_CAP_FLAT;
		this.currentLineJoin = this.gl.LINE_JOIN_MITER;
		
		this.blendModeMap = new Map([
			[BlendMode.COMBINE, this.gl.BLEND_MODE_COMBINE],
			[BlendMode.ADD, this.gl.BLEND_MODE_ADD]
		]);

		this.preservePixelart = true;
		this.alpha = 1;
		this.blendMode = BlendMode.COMBINE;

		this.currentTransform = Matrix3.identity();
		this.transformStackPointer = 0;
		this.transformStack = [];
		this.alphaStack = [];

		this.resize(width, height);

		this.draw = WebGLArtist2D.DrawRenderer.create(this);
		this.stroke = WebGLArtist2D.StrokeRenderer.create(this);
		this.image = WebGLArtist2D.ImageRenderer.create(this);
	}
	get width() {
		return this.canvas.width / this.pixelRatio;
	}
	get height() {
		return this.canvas.height / this.pixelRatio;
	}
	get middle() {
		return new Vector2(this.width / 2, this.height / 2);
	}
	set preservePixelart(a) {
		this._preservePixelart = a;
		this.gl.setImageSmoothing(!a);
	}
	get preservePixelart() {
		return this._preservePixelart;
	}
	set blendMode(a) {
		this._blendMode = a;
		this.gl.setBlendMode(this.blendModeMap.get(a));
	}
	get blendMode() {
		return this._blendMode;
	}
	set alpha(a) {
		this._alpha = a;
		this.gl.setGlobalAlpha(a);
	}
	get alpha() {
		return this._alpha;
	}
	set transform(a) {
		this.gl.setTransform(a.get(this.currentTransform));
	}
	get transform() {
		return this.currentTransform.get();
	}
	resize(width, height) {
		this.gl.resize(width, height);
	}
	useColor(color) {
		this.currentColor = color;
	}
	clearTransformations() {
		this.gl.setTransform(Matrix3.identity(this.currentTransform));
		this.scale(this.pixelRatio);
	}
	addTransform(mat) {
		this.gl.setTransform(this.currentTransform.mul(mat));
	}
	translate(x, y) {
		if (typeof x === "object") ({ x, y } = x);

		// do translate
		const ct = this.currentTransform;

		// optimized matrix multiplication
		ct[6] += x * ct[0] + y * ct[3];
		ct[7] += x * ct[1] + y * ct[4];

		this.gl.setTransform(this.currentTransform);
	}
	scale(x, y = x) {
		if (typeof x === "object") ({ x, y } = x);

		// do scale

		// optimized matrix multiplication	
		const ct = this.currentTransform;
		ct[0] *= x;
		ct[1] *= x;
		ct[3] *= y;
		ct[4] *= y;

		this.gl.setTransform(this.currentTransform);
	}
	rotate(a) {
		// do rotate

		// optimized matrix multiplication
		const c = Math.cos(a);
		const s = Math.sin(a);

		const ct = this.currentTransform;

		const m0 = ct[0];
		const m1 = ct[1];
		const m2 = ct[2];
		const m3 = ct[3];
		const m4 = ct[4];
		const m5 = ct[5];

		ct[0] = m0 * c + m3 * s;
		ct[1] = m1 * c + m4 * s;
		ct[2] = m2 * c + m5 * s;
		ct[3] = m3 * c - m0 * s;
		ct[4] = m4 * c - m1 * s;
		ct[5] = m5 * c - m2 * s;

		this.gl.setTransform(this.currentTransform);
	}
	save() {
		const index = this.transformStackPointer++;
		this.transformStack[index] = this.currentTransform.get(this.transformStack[index]);
		this.alphaStack.push(this.alpha);
	}
	restore() {
		if (this.transformStackPointer) {
			this.transformStack[--this.transformStackPointer].get(this.currentTransform);
			this.gl.setTransform(this.currentTransform);
			this.alpha = this.alphaStack.pop();
			this.gl.setGlobalAlpha(this.alpha);
		}
	}
	clear() {
		this.gl.clear();
	}
	fill(color) {
		this.gl.coloredQuad(0, 0, this.width, this.height, color.red, color.green, color.blue, color.alpha);
	}
}

WebGLArtist2D.ImageDispatcher = class extends Artist2D.ImageDispatcher {
	warp(ax, ay, bx, by, cx, cy, dx, dy) {
		if (typeof ax === "object") {
			if (ax.vertices) [{ x: ax, y: ay }, { x: bx, y: by }, { x: cx, y: cy }, { x: dx, y: dy }] = ax.vertices;
			else [ax, ay, bx, by, cx, cy, dx, dy] = [ax.x, ax.y, ay.x, ay.y, bx.x, bx.y, by.x, by.y];
		}

		this.impl.warp(ax, ay, bx, by, cx, cy, dx, dy);
	}
	warpRegion(ax, ay, bx, by, cx, cy, dx, dy, tx, ty, tw, th) {
		if (typeof ax === "object") {
			if (ax.vertices) {
				({ x: tx, y: ty, width: tw, height: th } = ay);
				[{ x: ax, y: ay }, { x: bx, y: by }, { x: cx, y: cy }, { x: dx, y: dy }] = ax.vertices;
			} else {
				[tx, ty, tw, th] = [cx, cy, dx, dy];
				[ax, ay, bx, by, cx, cy, dx, dy] = [ax.x, ax.y, ay.x, ay.y, bx.x, bx.y, by.x, by.y];
			}
		}

		this.impl.warpRegion(ax, ay, bx, by, cx, cy, dx, dy, tx, ty, tw, th);
	}
};

WebGLArtist2D.Renderer = class extends Artist.Renderer {
	constructor(renderer) {
		super(renderer);
		this.gl = renderer.gl;
	}
};

WebGLArtist2D.DrawRenderer = class extends WebGLArtist2D.Renderer {
	static Dispatcher = Artist2D.Dispatcher;
	setup(color) {
		this.color = color;
	}
	circle(x, y, radius) {
		this.gl.coloredEllipse(x, y, radius, radius, this.color.red, this.color.blue, this.color.green, this.color.alpha);
	}
	ellipse(x, y, rx, ry) {
		this.gl.coloredEllipse(x, y, rx, ry, this.color.red, this.color.blue, this.color.green, this.color.alpha);
	}
	rect(x, y, width, height) {
		this.gl.coloredQuad(x, y, width, height, this.color.red, this.color.blue, this.color.green, this.color.alpha);
	}
	shape(vertices) {
		this.gl.coloredPolygon(vertices, this.color.red, this.color.blue, this.color.green, this.color.alpha);
	}
};

WebGLArtist2D.StrokeRenderer = class extends WebGLArtist2D.Renderer {
	static Dispatcher = Artist2D.StrokeDispatcher;
	constructor(renderer) {
		super(renderer);
		this.lineJoinMap = new Map([
			[LineJoin.MITER, this.gl.LINE_JOIN_MITER],
			[LineJoin.BEVEL, this.gl.LINE_JOIN_BEVEL],
			[LineJoin.ROUND, this.gl.LINE_JOIN_ROUND]
		]);
		this.lineCapMap = new Map([
			[LineCap.FLAT, this.gl.LINE_CAP_FLAT],
			[LineCap.SQUARE, this.gl.LINE_CAP_SQUARE],
			[LineCap.ROUND, this.gl.LINE_CAP_ROUND]
		]);
	}
	setup(color, lineWidth = 1, lineCap = LineCap.FLAT, lineJoin = LineJoin.BEVEL) {
		this.color = color;
		this.lineWidth = lineWidth;
		this.lineCap = this.lineCapMap.get(lineCap);
		this.lineJoin = this.lineJoinMap.get(lineJoin);
	}
	rect(x, y, width, height) {
		this.gl.outlinedQuad(x, y, width, height, this.lineWidth, this.color.red, this.color.green, this.color.blue, this.color.alpha);
	}
	circle(x, y, radius) {
		this.gl.outlinedEllipse(x, y, radius, radius, this.lineWidth, this.color.red, this.color.green, this.color.blue, this.color.alpha)
	}
	ellipse(x, y, rx, ry) {
		this.gl.outlinedEllipse(x, y, rx, ry, this.lineWidth, this.color.red, this.color.green, this.color.blue, this.color.alpha);
	}
	connector(points) {
		this.gl.lineSegments(points, this.lineWidth, this.lineCap, this.lineJoin, this.color.red, this.color.green, this.color.blue, this.color.alpha);
	}
	spline(spline, prec = 100) {
		const inc = 1 / prec;
		const vertices = [spline.a];
		for (let i = 0; i < 1; i += inc)
			vertices.push(spline.evaluate(i));
		vertices.push(spline.d);
		this.gl.lineSegments(vertices, this.lineWidth, this.lineCap, this.lineJoin, this.color.red, this.color.green, this.color.blue, this.color.alpha, false, false, false);
	}
	splineArrow(spline, prec = 100) {
		this.spline(spline, prec);
		const { c, d } = spline;
		this.arrowHead(d.x, d.y, d.x - c.x, d.y - c.y);
	}
	line(x, y, x1, y1) {
		this.gl.lineSegment(x, y, x1, y1, this.lineWidth, this.lineCap, this.color.red, this.color.green, this.color.blue, this.color.alpha);
	}
	arrowHead(x, y, dx, dy) {
		const invMag = 1 / Math.hypot(dx, dy);
		dx *= invMag;
		dy *= invMag;
		const nx = -dy;
		const ny = dx;
		
		const l2 = this.lineWidth * 2;
		const ox = x - dx * l2;
		const oy = y - dy * l2;

		this.gl.coloredTriangle(
			ox - nx * l2, oy - ny * l2,
			ox + dx * l2 * 2, oy + dy * l2 * 2,
			ox + nx * l2, oy + ny * l2,
			this.color.red, this.color.green, this.color.blue, this.color.alpha
		);
	}
	arrow(x, y, x1, y1) {
		this.line(x, y, x1, y1);
		this.arrowHead(x1, y1, x1 - x, y1 - y);
	}
	shape(vertices) {
		this.gl.outlinedPolygon(vertices, this.lineWidth, this.lineJoin, this.color.red, this.color.green, this.color.blue, this.color.alpha);
	}
};

WebGLArtist2D.ImageRenderer = class extends WebGLArtist2D.Renderer {
	static Dispatcher = WebGLArtist2D.ImageDispatcher;
	setup(image, changed = false) {
		this.image = image;
		this.canvasImage = image.makeWebGLImage();
		if (!this.image.renderable) return new Proxy({}, { get: () => () => null }); // throw away calls
		if (changed) this.gl.updateTextureCache(this.currentImageCIS);
	}
	circle(x, y, radius) {
		this.gl.texturedEllipse(x, y, radius, radius, 0, 0, 1, 1, this.canvasImage);
	}
	ellipse(x, y, rx, ry) {
		this.gl.texturedEllipse(x, y, rx, ry, 0, 0, 1, 1, this.canvasImage);
	}
	rect(x, y, width, height) {
		this.gl.texturedQuad(x, y, width, height, 0, 0, 1, 1, this.canvasImage);
	}
	wrap(ax, ay, bx, by, cx, cy, dx, dy) {
		this.gl.texturedTriangle(ax, ay, bx, by, cx, cy, 0, 0, 1, 0, 1, 1, this.canvasImage);
		this.gl.texturedTriangle(ax, ay, dx, dy, cx, cy, 0, 0, 0, 1, 1, 1, this.canvasImage);
	}
	warpRegion(ax, ay, bx, by, cx, cy, dx, dy, tx, ty, tw, th) {
		const pixelRatio = this.canvasImage.width / this.image.width;
		tx *= pixelRatio / this.canvasImage.width;
		ty *= pixelRatio / this.canvasImage.height;
		tw *= pixelRatio / this.canvasImage.width;
		th *= pixelRatio / this.canvasImage.height;
		this.gl.texturedTriangle(ax, ay, bx, by, cx, cy, tx, ty, tx + tw, ty, tx + tw, ty + th, this.canvasImage);
		this.gl.texturedTriangle(ax, ay, dx, dy, cx, cy, tx, ty, tx, ty + th, tx + tw, ty + th, this.canvasImage);
	}
	shape(vertices) {
		const textureVertices = [];
		const { min, max } = Rect.bound(vertices);
		const dim = max.minus(min);
		for (let i = 0; i < vertices.length; i++) {
			const { x, y } = vertices[i];
			textureVertices.push(new Vector2(
				(x - min.x) / dim.x,
				(y - min.y) / dim.y
			));
		}
		this.gl.texturedPolygon(vertices, textureVertices, this.canvasImage);
	}
	default(x, y) {
		this.rect(x, y, this.image.width, this.image.height);
	}
	inferWidth(x, y, height) {
		this.rect(x, y, this.image.inferWidth(height), height);
	}
	inferHeight(x, y, width) {
		this.rect(x, y, width, this.image.inferHeight(width));
	}
};
/**
 * @name class FastFrame extends Frame
 * Represents a WebGL-based implementation of Frame.
 * @prop WebGLArtist2D renderer | The renderer for the frame
 */
class FastFrame extends ImageType {
	constructor(width, height, pixelRatio = __devicePixelRatio) {
		super(width, height, pixelRatio);
		this.image = new_OffscreenCanvas(this.pixelWidth, this.pixelHeight);
		this.renderer = new WebGLArtist2D(this.image, this.width, this.height, this, pixelRatio);
	}
	onresize(width, height) {
		this.renderer.resize(width, height);
	}
	stretch(w, h) {
		if (!h) h = this.inferHeight(w);
		let f = new FastFrame(w, h, this.pixelRatio);
		f.renderer.gl.texturedQuad(0, 0, w, h, 0, 0, 1, 1, this.makeWebGLImage());
		return f;
	}
	clip(x, y, width, height) {
		return FastFrame.fromImageType(this, x, y, width, height);
	}
	makeImage() {
		this.renderer.gl.render();
		return this.image;
	}
	get(f = new FastFrame(this.width, this.height, this.pixelRatio)) {
		f.renderer.resize(this.width, this.height);
		f.renderer.gl.texturedQuad(0, 0, this.width, this.height, 0, 0, 1, 1, this.makeWebGLImage());
		return f;
	}
	static fromImageType(img, x, y, width, height) {
		if (typeof x === "object") ({ x, y, width, height } = x);

		x ??= 0;
		y ??= 0;
		width ??= img.width;
		height ??= img.height;

		const offscreen = img.makeWebGLImage();
		const frame = new FastFrame(width, height, offscreen.width / img.width);
		frame.renderer.gl.texturedQuad(0, 0, width, height, x / img.width, y / img.height, width / img.width, height / img.height, offscreen);
		return frame;
	}
}

if (!window.WebGLRenderingContext || new_OffscreenCanvas(1, 1).getContext("webgl", { failIfMajorPerformanceCaveat: true }) === null) FastFrame = Frame;