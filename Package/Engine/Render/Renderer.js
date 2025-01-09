/**
 * Represents a renderer for a graphical surface.
 * @abstract
 */
class Artist {
	/**
	 * @name clear
	 * Clears the rendering surface to transparent black.
	 */
	/**
	 * @name fill
	 * Assuming that the current transform is the identity transformation, this fills the surface with a single color. If the color is transparent, it will simply layer on top of the current content.
	 * @param Color color | The color to fill with
	 */
	/**
	 * @name addTransform
	 * Manipulates the current coordinate transform. For an Artist `a` and Matrix `m`, `a.addTransform(m)` is equivalent to `a.transform = m.times(a.transform)`.
	 * @param Matrix transform | The coordinate transform to compose with the existing transform
	 */
	/**
	 * Calls a function while using a specified coordinate transform
	 * @param Matrix transform | The specific coordinate transform to use
	 * @param () => void draw | The function that will be called while using the specified transform
	 * @param Boolean global? | Whether the transform should be applied in place of all current transforms (true), or composed with the current transform (false). Default is true.
	 */
	drawThrough(mat, draw, global = true) {
		this.save();
		if (global) this.transform = mat;
		else this.addTransform(mat);
		draw();
		this.restore();
	}
	/**
	 * @name clearTransformations
	 * Returns the renderer to the identity coordinate transform.
	 */
	/**
	 * @name set transform
	 * Sets the current coordinate transform of the renderer.
	 * @param Matrix transform | The new transform
	 */
	/**
	 * @name get transform
	 * Returns the current coordinate transform of the renderer.
	 * @return Matrix
	 */
	/**
	 * @name save
	 * Pushes the current rendering state onto the state stack.
	 * This state includes `.transform`.
	 */
	/**
	 * @name restore
	 * Puts the renderer into the state on top of the state stack, then removes it from the stack.
	 */
}

Artist.Renderer = class {
	constructor(renderer) {
		this.renderer = renderer;
	}
	static create(renderer) {
		return new this.Dispatcher(new this(renderer));
	}
};

/**
 * Represents a 2D renderer for a graphical surface.
 * All transformation-related matrices for this renderer are of type Matrix3.
 * @abstract
 * ```js
 * renderer.draw(new Color("blue")).shape(Polygon.regular(5, 100).move(middle));
 * renderer.stroke(new Color("red"), 20, LineCap.SQUARE, LineJoin.ROUND).connector([
 * 	new Vector2(0, 0),
 * 	new Vector2(50, 100),
 * 	new Vector2(150, 200),
 * 	new Vector2(300, 100)
 * ]);
 *   
 * renderer.clip().circle(0, 0, 100);
 * renderer.draw(new Color("lime")).rect(0, 0, 80, 80);
 * renderer.unclip();
 * ```
 * @prop ImageType imageType | The surface on which the renderer renders. This property is read-only
 * @prop TextMode textMode | The current text-alignment mode. Starts as `TextMode.TOP_LEFT`
 * @prop BlendMode blendMode | The current color-blending mode. Starts as `BlendMode.COMBINE`
 * @prop Number alpha | The current global alpha. This will multiply the alpha of all other drawing calls. This is included in the save state of `.save()` and `.restore()`. Starts as 1
 * @prop Boolean preservePixelart | Whether or not image smoothing will be prevented when upscaling. Starts as true
 */
class Artist2D extends Artist {
	/**
	 * @name draw
	 * Returns a drawing API that uses a specified color.
	 * @param Color color | The fill color
	 * @return DrawRenderer
	 */
	/**
	 * @name stroke
	 * Returns a stroke API that uses specific settings.
	 * @param Color color | The outline color
	 * @param Number lineWidth? | The width of the outline in pixels. Default is 1
	 * @param LineCap lineCap? | The line cap to use. Default is `LineCap.FLAT`
	 * @param LineJoin lineJoin? | The line join to use for connected segments. Default is `LineJoin.BEVEL`
	 * @return StrokeRenderer
	 */
	/**
	 * @name image
	 * Returns an image rendering API that uses a specified image.
	 * @param ImageType image | The image to render
	 * @return ImageRenderer
	 */
	/**
	 * In a transform with no translation, rotation, or scaling, this flips the x axis about the middle of the screen.
	 */
	invertX() {
		this.translate(this.width, 0);
		this.scale(-1, 1);
	}
	/**
	 * In a transform with no translation rotation, or scaling, this flips the y axis about the middle of the screen.
	 */
	invertY() {
		this.translate(0, this.height);
		this.scale(1, -1);
	}
	/**
	 * @name translate
	 * Changes the coordinate transform by displacing it.
	 * @signature
	 * @param Vector2 displacement | The displacement
	 * @signature
	 * @param Number x | The displacement along the x axis
	 * @param Number y | The displacement along the y axis
	 */
	/**
	 * @name scale
	 * Changes the coordinate transform by scaling it.
	 * @signature
	 * @param Vector2 factors | The scaling factors for both axes
	 * @signature
	 * @param Number x | The scaling along the x axis
	 * @param Number y | The scaling along the y axis.
	 * @signature
	 * @param Number factor | The scaling factor for both axes
	 */
	/**
	 * @name rotate
	 * Changes the coordinate transform by rotating it clockwise by a specified angle.
	 * @param Number angle | The amount to rotate by, in radians
	 */
	/**
	 * Changes the coordinate transform by rotating it clockwise about a specified point.
	 * @signature
	 * @param Vector2 point | The point to rotate about
	 * @param Number angle | The angle to rotate by
	 * @signature
	 * @param Number x | The x coordinate to rotate about
	 * @param Number y | The y coordinate to rotate about
	 * @param Number angle | The angle to rotate by
	 */
	rotateAround(x, y, r) {
		if (typeof x === "object") {
			r = y;
			({ x, y } = x);
		}
		this.translate(x, y);
		this.rotate(r);
		this.translate(-x, -y);
	}
	beforeFrame() {
		this.clearTransformations();
	}
	afterFrame() {

	}
}

Artist2D.Dispatcher = class {
	constructor(impl) {
		const self = (...args) => {
			impl.setup(...args);
			return self;
		};
		self.impl = impl;
		const keys = objectUtils.keys(this.constructor.prototype, Artist2D.Dispatcher);
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			if (key !== "constructor")
				self[key] = this[key];
		}

		self.unpacked = { };
		return self;
	}
	unpackArc(x, y, radius, sa, ea, counterClockwise = false) {
		if (typeof x === "object") {
			if (x.radius === undefined) {
				counterClockwise = ea;
				ea = sa;
				sa = radius;
				radius = y;
				({ x, y } = x);
			} else {
				counterClockwise = sa;
				ea = radius;
				sa = y;
				({ x, y, radius } = x);
			}
		}

		const u = this.unpacked;
		u.x = x;
		u.y = y;
		u.radius = Math.abs(radius);
		u.sa = sa;
		u.ea = ea;
		u.counterClockwise = counterClockwise;
	}
	arc(x, y, radius, sa, ea, counterClockwise) {
		this.unpackArc(x, y, radius, sa, ea, counterClockwise);
		const u = this.unpacked;
		this.impl.arc(u.x, u.y, u.radius, u.sa, u.ea, u.counterClockwise);
	}
	sector(x, y, radius, sa, ea, counterClockwise) {
		this.unpackArc(x, y, radius, sa, ea, counterClockwise);
		const u = this.unpacked;
		this.impl.sector(u.x, u.y, u.radius, u.sa, u.ea, u.counterClockwise);
	}
	ellipse(x, y, rx, ry) {
		if (typeof x === "object") {
			ry = rx;
			rx = y;
			({ x, y } = x);
		}

		this.impl.ellipse(x, y, Math.abs(rx), Math.abs(ry));
	}
	circle(x, y, radius) {
		if (typeof x === "object") {
			if (x.radius === undefined) {
				radius = y;
				({ x, y } = x);
			} else {
				({ position: { x, y }, radius } = x);
			}
		}

		this.impl.circle(x, y, Math.abs(radius));
	}
	rect(x, y, width, height) {
		if (typeof x === "object")
			({ x, y, width, height } = x);

		this.impl.rect(x, y, width, height);
	}
	roundRect(x, y, width, height, tl, tr, br, bl) {
		if (typeof x === "object") {
			tr = width;
			br = height;
			bl = tl;
			tl = y;
			({ x, y, width, height } = x);
		}

		if (tr === undefined)
			tr = br = bl = tl;

		this.impl.roundRect(x, y, width, height, tl, tr, br, bl);
	}
	triangle(a, b, c) {
		this.shape([a, b, c]);
	}
	shape(verts) {
		if (verts.vertices) verts = verts.vertices;

		this.impl.shape(verts);
	}
	text(font, text, x, y, pack = false) {
		if (typeof x === "object") {
			pack = y ?? false;
			({ x, y } = x);
		}

		text = font.processString(text);
		if (pack) text = font.packText(text, pack);
		
		this.impl.text(font, text, x, y);
	}
	infer(shape) {
		if (shape.radius !== undefined) this.circle(shape);
		else if (shape.width !== undefined) this.rect(shape);
		else if (shape.vertices || shape.length !== undefined) this.shape(shape);
		else if (shape.c !== undefined) this.spline(shape);
		else if (shape.a !== undefined) this.line(shape);
	}
}

Artist2D.StrokeDispatcher = class extends Artist2D.Dispatcher {
	unpackLine(x, y, x1, y1) {
		if (typeof x === "object") {
			if (x.a === undefined) {
				({ x: x1, y: y1 } = y);
				({ x, y } = x);
			} else {
				({ a: { x, y }, b: { x: x1, y: y1 } } = x);
			}
		}

		const u = this.unpacked;
		u.x = x;
		u.y = y;
		u.x1 = x1;
		u.y1 = y1;
	}
	line(x, y, x1, y1) {
		this.unpackLine(x, y, x1, y1);
		const u = this.unpacked;
		this.impl.line(u.x, u.y, u.x1, u.y1);
	}
	arrow(x, y, x1, y1) {
		this.unpackLine(x, y, x1, y1);
		const u = this.unpacked;
		this.impl.arrow(u.x, u.y, u.x1, u.y1);
	}
	measure(font, text, x, y, x1, y1) {
		this.unpackLine(x, y, x1, y1);
		const u = this.unpacked;
		this.impl.measure(font, text, u.x, u.y, u.x1, u.y1);
	}
	arcArrow(x, y, radius, sa, ea, counterClockwise) {
		this.unpackArc(x, y, radius, sa, ea, counterClockwise);
		const u = this.unpacked;
		this.impl.arcArrow(u.x, u.y, u.radius, u.sa, u.ea, u.counterClockwise);
	}
	connector(points) {
		this.impl.connector(points);
	}
	spline(a, b, c, d) {
		if (a.a === undefined)
			a = new Spline(a, b, c, d);

		this.impl.spline(a);
	}
	splineArrow(a, b, c, d) {
		if (a.a === undefined)
			a = new Spline(a, b, c, d);

		this.impl.splineArrow(a);
	}
};

Artist2D.ImageDispatcher = class extends Artist2D.Dispatcher {
	default(x, y) {
		if (typeof x === "object")
			({ x, y } = x);

		this.impl.default(x, y);
	}
	inferWidth(x, y, height) {
		if (typeof x === "object") {
			height = y;
			({ x, y } = x);
		}

		this.impl.inferWidth(x, y, height);
	}
	inferHeight(x, y, width) {
		if (typeof x === "object") {
			width = y;
			({ x, y } = x);
		}

		this.impl.inferWidth(x, y, width);
	}
};

// Text Modes
const TextModeX = Enum.define("LEFT", "CENTER", "RIGHT");
const TextModeY = Enum.define("TOP", "CENTER", "BOTTOM");

/**
 * @name const TextMode = Enum.define
 * Specifies where on a string of text should be considered its origin.
 * @name_subs HORIZONTAL: LEFT, CENTER, RIGHT; VERTICAL: TOP, CENTER, BOTTOM
 * @static_prop TextMode [VERTICAL]_[HORIZONTAL] | Specifies that text should be aligned vertically based on VERTICAL (`TOP`, `CENTER`, or `BOTTOM`), and should be aligned horizontally based on HORIZONTAL (`LEFT`, `CENTER`, `RIGHT`)
 */
const TextMode = {};
for (let x in TextModeX) for (let y in TextModeY) {
	TextMode[y + "_" + x] = [TextModeX[x], TextModeY[y]];
}

/**
 * Represents the way in which colors being added to a surface should interact with those already there.
 * @static_prop BlendMode ADD | New colors should be component-wise added to the existing colors
 * @static_prop BlendMode COMBINE | New colors should be blended with old colors based on opacity
 */
const BlendMode = Enum.define("ADD", "COMBINE");
/**
 * Represents the way in which consecutive line segments should connect.
 * @static_prop LineJoin MITER | The edges of the lines will be extended until they meet
 * @static_prop LineJoin BEVEL | The edges of the lines will be connected straight across
 * @static_prop LineJoin ROUND | The gap between the lines will be filled with an arc
 */
const LineJoin = Enum.define("MITER", "BEVEL", "ROUND");
/**
 * Represents the way the ends of line segments will be displayed.
 * @static_prop LineCap FLAT | The lines will have square ends that extend just to the end of the line
 * @static_prop LineCap SQUARE | The lines will have square ends that extend half their side length past the end of the line
 * @static_prop LineCap ROUND | The lines will end with half-circles
 */
const LineCap = Enum.define("FLAT", "SQUARE", "ROUND");

/**
 * Represents a 2D renderer based on the HTML5 Canvas API.
 */
class CanvasArtist2D extends Artist2D {
	static blendModeMap = new Map([
		[BlendMode.COMBINE, "source-over"],
		[BlendMode.ADD, "lighter"]
	]);
	static textModeXMap = new Map([
		[TextModeX.LEFT, "left"],
		[TextModeX.CENTER, "center"],
		[TextModeX.RIGHT, "right"]
	]);
	constructor(canvas, imageType) {
		super();
		this.canvas = canvas;
		this.c = canvas.getContext("2d");
		this.pixelRatio = imageType.pixelRatio;
		this.width = imageType.width;
		this.height = imageType.height;
		this.imageType = imageType;

		this.preservePixelart = true;
		this.c.imageSmoothingQuality = "high";
		this.alpha = 1;
		this.textMode = TextMode.TOP_LEFT;
		this.blendMode = BlendMode.COMBINE;

		this.resize(this.width, this.height);
		
		this.draw = CanvasArtist2D.DrawRenderer.create(this);
		this.stroke = CanvasArtist2D.StrokeRenderer.create(this);
		this.clip = CanvasArtist2D.ClipRenderer.create(this);
		this.image = CanvasArtist2D.ImageRenderer.create(this);
	}
	get middle() {
		return new Vector2(this.width / 2, this.height / 2);
	}
	set textMode(a) {
		this.textModeX = a[0];
		this.textModeY = a[1];
		this._textMode = a;
	}
	get textMode() {
		return this._textMode;
	}
	set preservePixelart(a) {
		this._preservePixelart = a;
		this.c.imageSmoothingEnabled = !a;
	}
	get preservePixelart() {
		return this._preservePixelart;
	}
	set blendMode(a) {
		this._blendMode = a;
		this.c.globalCompositeOperation = CanvasArtist2D.blendModeMap.get(a);
	}
	get blendMode() {
		return this._blendMode;
	}
	set alpha(a) {
		this._alpha = a;
		this.c.globalAlpha = a;
	}
	get alpha() {
		return this._alpha;
	}
	set transform(a) {
		const m = a;
		this.c.setTransform(m[0] * this.pixelRatio, m[1] * this.pixelRatio, m[3] * this.pixelRatio, m[4] * this.pixelRatio, m[6] * this.pixelRatio, m[7] * this.pixelRatio);
	}
	get transform() {
		const { a, b, c, d, e, f } = this.c.getTransform();
		const ratio = 1 / this.pixelRatio;
		return Matrix3.create(
			a * ratio, c * ratio, e * ratio,
			b * ratio, d * ratio, f * ratio,
			0, 0, 1
		);
	}
	addTransform(mat) {
		this.c.transform(mat[0], mat[1], mat[3], mat[4], mat[6], mat[7]);
	}
	resize(width, height) {
		const px = this.preservePixelart;
		const al = this.alpha;
		this.width = width;
		this.height = height;
		this.canvas.width = this.imageType.pixelWidth;
		this.canvas.height = this.imageType.pixelHeight;
		this.c.scale(this.pixelRatio, this.pixelRatio);
		this.alpha = al;
		this.preservePixelart = px;
	}
	/**
	 * Returns the color of a specific pixel in natural-space.
	 * @param Number x | The x coordinate of the pixel
	 * @param Number y | The y coordinate of the pixel
	 * @return Color
	 */
	getPixel(x, y) {
		let d = this.c.getImageData(x * this.pixelRatio, y * this.pixelRatio, 1, 1).data;
		return new Color(d[0], d[1], d[2], d[3] / 255);
	}
	/**
	 * Sets the color of a specific pixel in natural-space.
	 * @param Number x | The x coordinate of the pixel
	 * @param Number y | The y coordinate of the pixel
	 * @param Color color | The new color for the pixel 
	 */
	setPixel(x, y, col) {
		let data = new Uint8ClampedArray(4);
		data[0] = col.red;
		data[1] = col.green;
		data[2] = col.blue;
		data[3] = col.alpha * 255;
		this.c.putImageData(new ImageData(data, 1, 1), x * this.pixelRatio, y * this.pixelRatio);
	}
	drawImageInternal(x, y, width, height) {
		if (!this.currentImage.renderable) return;
		if (typeof x === "object") ({ x, y, width, height } = x);
		if (width * height === 0) return;
		this.c.drawImage(this.currentImageCIS, x, y, width, height);
	}
	/**
	 * @name clip
	 * Returns a clipping API.
	 * @return ClipRenderer
	 */
	/**
	 * Undoes the last clipping operation performed in the current state stack.
	 */
	unclip() {
		this.restore();
	}
	translate(x, y) {
		if (typeof x === "object") ({ x, y } = x);
		this.c.translate(x, y);
	}
	scale(x, y = x) {
		if (typeof x === "object") ({ x, y } = x);
		this.c.scale(x, y);
	}
	rotate(a) {
		this.c.rotate(a);
	}
	clearTransformations() {
		this.c.resetTransform();
		this.scale(this.pixelRatio);
	}
	save() {
		this.c.save();
	}
	restore() {
		this.c.restore();
		this._alpha = this.c.globalAlpha;
	}
	/**
	 * Clears a rectangular region of the surface to transparent black.
	 * @signature
	 * @param Rect region | The region to clear
	 * @signature
	 * @param Number x | The x coordinate of the region to clear
	 * @param Number y | The y coordinate of the region to clear
	 * @param Number width | The width of the region to clear 
	 * @param Number height | The height of the region to clear 
	 */
	clearRect(x, y, width, height) {
		if (typeof x === "object") ({ x, y, width, height } = x);
		this.c.clearRect(x, y, width, height);
	}
	clear() {
		this.c.save();
		this.c.resetTransform();
		this.c.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.c.restore();
	}
	fill(color) {
		this.c.fillStyle = color;
		this.c.fillRect(0, 0, this.width, this.height);
	}
}

/**
 * @name class PathRenderer
 * Represents a generic drawing API of an Artist2D.
 * The exact operation used to render the paths is specified in subclasses, but this class which shapes are possible and how they are specified.
 * @abstract
 */
CanvasArtist2D.PathRenderer = class extends Artist.Renderer {
	constructor(renderer) {
		super(renderer);
		this.c = renderer.c;
	}
	/**
	 * Creates a rectangular path.
	 * @signature
	 * @param Rect rectangle | The shape of the rectangle
	 * @signature
	 * @param Number x | The x coordinate of the rectangle's upper-left corner
	 * @param Number y | The y coordinate of the rectangle's upper-left corner
	 * @param Number width | The width of the rectangle
	 * @param Number height | The height of the rectangle
	 */
	rect(x, y, width, height) {
		this.c.beginPath();
		this.c.rect(x, y, width, height);
	}
	/**
	 * Creates a rectangular path with rounded corners.
	 * @signature
	 * @param Rect rectangle | The shape of the rectangle
	 * @param Number topLeft | The radius of the top-left corner
	 * @param Number topRight? | The radius of the top-right corner. Defaults to be the same as the top-left
	 * @param Number bottomRight? | The radius of the bottom-right corner. Defaults to be the same as the top-left
	 * @param Number bottomLeft? | The radius of the bottom-left corner. Defaults to be the same as the top-left
	 * @signature
	 * @param Number x | The x coordinate of the rectangle's upper-left corner
	 * @param Number y | The y coordinate of the rectangle's upper-left corner
	 * @param Number width | The width of the rectangle
	 * @param Number height | The height of the rectangle
	 * @params topLeft, topRight, bottomRight, bottomLeft
	 */
	roundRect(x, y, width, height, tl, tr, br, bl) {
		this.c.beginPath();
		this.c.roundRect(x, y, width, height, [tl, tr, br, bl]);
	}
	/**
	 * @name triangle
	 * Creates a triangular path.
	 * @signature
	 * @param Polygon triangle | The shape of the path
	 * @signature
	 * @param Vector2 a | The first point of the triangle
	 * @param Vector2 b | The second point of the triangle
	 * @param Vector2 c | The last point of the triangle
	 */
	/**
	 * Creates a polygonal path.
	 * @signature
	 * @param Vector2[] vertices | The vertices of the polygon
	 * @signature
	 * @param Polygon polygon | The shape of the polygon
	 */
	shape(verts) {
		this.c.beginPath();
		if (!verts.length) return;
		this.c.moveTo(verts[0].x, verts[0].y);
		for (let i = 1; i < verts.length; i++) {
			const vert = verts[i];
			this.c.lineTo(vert.x, vert.y);
		}
		this.c.closePath();
	}
	/**
	 * @group sector, arc
	 * Creates a path in the shape of a section (sector or arc) of a circle. If an arc is filled, it will first have the endpoints connected.
	 * @signature
	 * @param Circle circle | The circle of which the path is a section
	 * @param Number begin | The initial clockwise angle (in radians) from the horizontal of the section
	 * @param Number end | The final clockwise angle (in radians) from the horizontal of the section
	 * @param Boolean counterClockwise? | Whether the path from the initial to final angle should be counter-clockwise. Default is false
	 * @signature
	 * @param Vector2 center | The center of the circle
	 * @param Number radius | The radius of the circle
	 * @params begin, end, counterClockwise
	 * @signature
	 * @param Number x | The x coordinate of the circle's center
	 * @param Number y | The y coordinate of the circle's center
	 * @params radius, begin, end, counterClockwise
	 */
	arc(x, y, radius, sa, ea, counterClockwise) {
		this.c.beginPath();
		this.c.arc(x, y, radius, sa, ea, counterClockwise);
	}
	sector(x, y, radius, sa, ea, counterClockwise) {
		this.c.beginPath();
		this.c.moveTo(x, y);
		this.c.lineTo(x + radius * Math.cos(sa), y + radius * Math.sin(sa));
		this.c.arc(x, y, radius, sa, ea, counterClockwise);
		this.c.closePath();
	}
	/**
	 * Creates an elliptical path.
	 * @signature
	 * @param Vector2 center | The center of the ellipse
	 * @param Number radiusX | The x axis radius of the ellipse
	 * @param Number radiusY | The y axis radius of the ellipse
	 * @signature
	 * @param Number x | The x coordinate of the ellipse's center
	 * @param Number y | The y coordinate of the ellipse's center
	 * @params radiusX, radiusY
	 */
	ellipse(x, y, rx, ry) {
		this.c.beginPath();
		this.c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
	}
	/**
	 * Creates a circular path.
	 * @signature
	 * @param Circle circle | The shape of the circle
	 * @signature
	 * @param Vector2 center | The center of the circle
	 * @param Number radius | The radius of the circle
	 * @signature
	 * @param Number x | The x coordinate of the circle's center
	 * @param Number y | The y coordinate of the circle's center
	 * @params radius
	 */
	circle(x, y, radius) {
		this.c.beginPath();
		this.c.arc(x, y, radius, 0, Math.PI * 2);
	}
	/**
	 * Creates a path in the shape of a sequence of characters.
	 * @signature
	 * @param Font font | The font to use in rendering the text
	 * @param String text | The text to render
	 * @param Vector2 origin | The location of the text's origin. How this is interpreted depends on the current text-alignment mode.
	 * @param Number packWidth? | The maximum allowed width of a single line of the text. Specifying this parameter will cause the newlines to be added to enforce this requirement. If this parameter is not specified, the text will not be packed
	 * @signature
	 * @param Font font | The font to use in rendering the text
	 * @param String text | The text to render
	 * @param Number x | The x coordinate of the text's origin. How this is interpreted depends on the current text-alignment mode.
	 * @param Number y | The y coordinate of the text's origin. How this is interpreted depends on the current text-alignment mode.
	 * @param Number packWidth? | The maximum allowed width of a single line of the text. Not specifying this will prevent packing
	 */
	text(font, text, x, y) {
		const lines = text.split("\n");

		const { textModeX, textModeY } = this.renderer;

		y += font.renderOffsetY;
		if (textModeY !== TextModeY.TOP)
			y -= font.getTextHeight(text) * (textModeY === TextModeY.CENTER ? 0.5 : 1);

		this.c.textAlign = CanvasArtist2D.textModeXMap.get(textModeX);
		this.c.font = font;

		for (let i = 0; i < lines.length; i++)
			this.drawText(lines[i], x, y + i * font.lineHeight);
		
		return true;
	}
	/**
	 * @name infer
	 * Creates a path with a shape based on the type of its argument.
	 * @param Shape shape | The shape to render
	 */
};

CanvasArtist2D.ActionRenderer = class extends CanvasArtist2D.PathRenderer { };
{
	const proto = CanvasArtist2D.PathRenderer.prototype;
	const actions = Reflect.ownKeys(proto);
	for (let i = 0; i < actions.length; i++) {
		const key = actions[i];
		const base = proto[key];
		CanvasArtist2D.ActionRenderer.prototype[key] = function () {
			if (!base.apply(this, arguments)) this.action();
		};
	}
}

/**
 * @name class DrawRenderer extends PathRenderer
 * Represents the draw API of an Artist2D.
 * This fills various paths.
 */
CanvasArtist2D.DrawRenderer = class extends CanvasArtist2D.ActionRenderer {
	static Dispatcher = Artist2D.Dispatcher;
	setup(color) {
		this.c.fillStyle = color;
	}
	action() {
		this.c.fill();
	}
	drawText(text, x, y) {
		this.c.fillText(text, x, y);
	}
};

/**
 * @name class StrokeRenderer extends PathRenderer
 * Represents the stroke API of an Artist2D.
 * This outlines various paths.
 */
CanvasArtist2D.StrokeRenderer = class extends CanvasArtist2D.ActionRenderer {
	static Dispatcher = Artist2D.StrokeDispatcher;
	static lineJoinMap = new Map([
		[LineJoin.MITER, "miter"],
		[LineJoin.BEVEL, "bevel"],
		[LineJoin.ROUND, "round"]
	]);
	static lineCapMap = new Map([
		[LineCap.FLAT, "butt"],
		[LineCap.SQUARE, "square"],
		[LineCap.ROUND, "round"]
	]);
	setup(color, lineWidth = 1, lineCap = LineCap.FLAT, lineJoin = LineJoin.BEVEL) {
		this.c.strokeStyle = color;
		this.c.lineWidth = lineWidth;
		const { lineJoinMap, lineCapMap } = CanvasArtist2D.StrokeRenderer;
		this.c.lineJoin = lineJoinMap.get(lineJoin);
		this.c.lineCap = lineCapMap.get(lineCap);
	}
	arrowHead(x, y, dx, dy) {
		const invMag = 1 / Math.hypot(dx, dy);
		dx *= invMag;
		dy *= invMag;
		const nx = -dy;
		const ny = dx;
		
		const l2 = this.c.lineWidth * 2;
		const ox = x - dx * l2;
		const oy = y - dy * l2;

		this.c.fillStyle = this.c.strokeStyle;
		this.c.beginPath();
		this.c.moveTo(ox - nx * l2, oy - ny * l2);
		this.c.lineTo(ox + dx * l2 * 2, oy + dy * l2 * 2);
		this.c.lineTo(ox + nx * l2, oy + ny * l2);
		this.c.fill();
	}
	/**
	 * @group line, arrow
	 * Renders a line segment. For `.arrow()`, there is also an arrow-head at the end.
	 * @signature
	 * @param Line line | The line segment
	 * @signature
	 * @param Vector2 a | The first point
	 * @param Vector2 b | The second point
	 * @signature
	 * @param Number x1 | The x coordinate of the first point
	 * @param Number y1 | The y coordinate of the first point
	 * @param Number x2 | The x coordinate of the second point
	 * @param Number y2 | The y coordinate of the second point
	 */
	line(x, y, x1, y1) {
		this.c.beginPath();
		this.c.moveTo(x, y);
		this.c.lineTo(x1, y1);
		this.c.stroke();
	}
	arrow(x, y, x1, y1) {
		this.line(x, y, x1, y1);
		this.arrowHead(x1, y1, x1 - x, y1 - y);
	}
	/**
	 * @name connector
	 * Renders a series of connected line segments.
	 * @param Vector2[] points | The points to connect
	 */
	connector(points) {
		if (!points.length) return;

		this.c.beginPath();
		this.c.moveTo(points[0].x, points[0].y);
		for (let i = 0; i < points.length; i++) {
			const point = points[i];
			this.c.lineTo(point.x, point.y);
		}
		this.c.stroke();
	}
	/**
	 * @group spline, splineArrow
	 * Renders a quartic spline. For `.splineArrow()`, there is also an arrow-head at the end.
	 * @param Spline spline | The spline to render
	 */
	spline({ a, b, c, d }) {
		this.c.beginPath();
		this.c.moveTo(a.x, a.y);
		this.c.bezierCurveTo(b.x, b.y, c.x, c.y, d.x, d.y);
		this.c.stroke();
	}
	splineArrow(spline) {
		this.spline(spline);
		const { c, d } = spline;
		this.arrowHead(d.x, d.y, d.x - c.x, d.y - c.y);
	}
	/**
	 * Renders an arrow-head at the end of an arc on a circle.
	 * @signature
	 * @param Circle circle | The circle of which the path is a section
	 * @param Number begin | The initial clockwise angle (in radians) from the horizontal of the section
	 * @param Number end | The final clockwise angle (in radians) from the horizontal of the section
	 * @param Boolean counterClockwise? | Whether the path from the initial to final angle should be counter-clockwise. Default is false
	 * @signature
	 * @param Vector2 center | The center of the circle
	 * @param Number radius | The radius of the circle
	 * @params begin, end, counterClockwise
	 * @signature
	 * @param Number x | The x coordinate of the circle's center
	 * @param Number y | The y coordinate of the circle's center
	 * @params radius, begin, end, counterClockwise
	 */
	arcArrow(x, y, radius, sa, ea, counterClockwise) {
		this.arc(x, y, radius, sa, ea, counterClockwise);
		const cos = Math.cos(ea);
		const sin = Math.sin(ea);
		const dir = counterClockwise ? -1 : 1;
		this.arrowHead(x + cos * radius, y + sin * radius, dir * -sin, dir * cos);
	}
	/**
	 * Renders a line segment with a line of text displayed in its center.
	 * @signature
	 * @param Font font | The font to use for the text
	 * @param String text | The text to render
	 * @param Line line | The line segment
	 * @signature
	 * @params font, text
	 * @param Vector2 a | The first point
	 * @param Vector2 b | The second point
	 * @signature
	 * @params font, text
	 * @param Number x1 | The x coordinate of the first point
	 * @param Number y1 | The y coordinate of the first point
	 * @param Number x2 | The x coordinate of the second point
	 * @param Number y2 | The y coordinate of the second point
	 */
	measure(font, text, x, y, x1, y1) {
		const width = font.getTextWidth(text);
		const height = font.getTextHeight(text);

		let dx = x1 - x;
		let dy = y1 - y;
		let nx = -dy;
		let ny = dx;
		const mag = Math.hypot(dx, dy);
		const rot = Math.atan2(dy, dx);

		if (!mag) return;
		const invMag = 1 / mag;

		nx *= invMag * height * 0.5;
		ny *= invMag * height * 0.5;

		let length = (mag - (width + font.size)) / 2;
		dx *= invMag * length;
		dy *= invMag * length;

		this.c.beginPath();
		this.c.moveTo(x, y);
		this.c.lineTo(x + dx, y + dy);
		this.c.stroke();

		this.c.beginPath();
		this.c.moveTo(x1, y1);
		this.c.lineTo(x1 - dx, y1 - dy);
		this.c.stroke();

		dx = (x1 - x) / 2;
		dy = (y1 - y) / 2;
		this.c.save();
		this.c.translate(x + dx, y + dy);
		this.c.rotate(rot);
		this.c.translate(-width / 2, height / 4);
		this.c.fillStyle = this.c.strokeStyle;
		this.c.font = font.toString();
		this.c.fillText(text, 0, 0);
		this.c.restore();

		// start cap
		this.c.beginPath();
		this.c.moveTo(x + nx, y + ny);
		this.c.lineTo(x - nx, y - ny);
		this.c.stroke();

		// end cap
		this.c.beginPath();
		this.c.moveTo(x1 + nx, y1 + ny);
		this.c.lineTo(x1 - nx, y1 - ny);
		this.c.stroke();
	}
	action() {
		this.c.stroke();
	}
	drawText(text, x, y) {
		this.c.strokeText(text, x, y);
	}
	/**
	 * @name infer
	 * Creates a path with a shape based on the type of its argument.
	 * @param Shape/Line/Spline shape | The shape to render
	 */
};

/**
 * @name class ClipRenderer extends PathRenderer
 * Represents the clipping API of an Artist2D.
 * This adds various shapes to the current clipping mask.
 * Each path created will be added to the current clipping state in such a way that the final renderable area is the intersection of all active clip paths.
 */
CanvasArtist2D.ClipRenderer = class extends CanvasArtist2D.ActionRenderer {
	static Dispatcher = Artist2D.Dispatcher;
	setup() { }
	action() {
		this.c.save();
		this.c.clip();
	}
}

/**
 * @name class ImageRenderer extends PathRenderer
 * Represents the image drawing API of an Artist2D.
 * This draws images in various paths. 
 * For non-rectangular shapes, the image is scaled to be the size of the shape's bounding box, and then only the portion of the image inside the shape is shown.
 */
CanvasArtist2D.ImageRenderer = class extends CanvasArtist2D.PathRenderer {
	static Dispatcher = Artist2D.ImageDispatcher;
	setup(image) {
		this.image = image;
		this.canvasImage = image.makeImage();
	}
	drawImage(x, y, width, height) {
		if (!this.image.renderable) return;
		if (width === 0 || height === 0) return;
		this.c.drawImage(this.canvasImage, x, y, width, height);
	}
	pathImage(x, y, width, height) {
		this.c.save();
		this.c.clip();
		this.drawImage(x, y, width, height);
		this.c.restore();
	}
	arcPathImage(x, y, radius) {
		this.pathImage(x - radius, y - radius, radius * 2, radius * 2);
	}
	arc(x, y, radius, sa, ea, counterClockwise) {
		super.arc(x, y, radius, sa, ea, counterClockwise);
		this.arcPathImage(x, y, radius);
	}
	sector(x, y, radius, sa, ea, counterClockwise) {
		super.sector(x, y, radius, sa, ea, counterClockwise);
		this.arcPathImage(x, y, radius);
	}
	ellipse(x, y, rx, ry) {
		super.ellipse(x, y, rx, ry);
		this.pathImage(x - rx, y - ry, rx * 2, ry * 2);
	}
	shape(vertices) {
		super.shape(vertices);
		const { x, y, width, height } = Rect.bound(vertices);
		this.pathImage(x, y, width, height);
	}
	circle(x, y, radius) {
		super.circle(x, y, radius);	
		this.arcPathImage(x, y, radius);
	}
	rect(x, y, width, height) {
		this.drawImage(x, y, width, height);
	}
	roundRect(x, y, width, height, tl, tr, bl, br) {
		super.roundRect(x, y, width, height, tl, tr, bl, br);
		this.pathImage(x, y, width, height);
	}
	/**
	 * Renders an image with a specified height, while still maintaining its natural aspect ratio.
	 * @signature
	 * @param Vector2 point | The upper-left corner of the image
	 * @param Number height | The height of the image
	 * @signature
	 * @param Number x | The x coordinate of the upper-left corner of the image
	 * @param Number y | The y coordinate of the upper-left corner of the image
	 * @params height
	 */
	inferWidth(x, y, height) {
		this.drawImage(x, y, this.image.inferWidth(height), height);
	}
	/**
	 * Renders an image with a specified width, while still maintaining its natural aspect ratio.
	 * @signature
	 * @param Vector2 point | The upper-left corner of the image
	 * @param Number width | The width of the image
	 * @signature
	 * @param Number x | The x coordinate of the upper-left corner of the image
	 * @param Number y | The y coordinate of the upper-left corner of the image
	 * @params width
	 */
	inferHeight(x, y, width) {
		this.drawImage(x, y, width, this.image.inferHeight(width));
	}
	/**
	 * Renders an image at its natural dimensions.
	 * @signature
	 * @param Vector2 point | The upper-left corner of the image
	 * @signature
	 * @param Number x | The x coordinate of the upper-left corner of the image
	 * @param Number y | The y coordinate of the upper-left corner of the image
	 */
	default(x, y) {
		this.rect(x, y, this.image.width, this.image.height);
	}
};