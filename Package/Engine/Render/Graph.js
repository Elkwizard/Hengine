/**
 * Represents a single variable that can be graphed on a GraphPlane.
 * @prop String name | The displayed name of the variable
 * @prop () => Number y | A function which returns the current value of the variable
 * @prop Number minY | The minimum displayed value of the variable. This is the lower bound of the vertical axis
 * @prop Number maxY | The maximum displayed value of the variable. This is the upper bound of the vertical axis
 * @prop Color color | The color of the graph of this variable
 * @prop Number decimalPlaces | The number of decimal places to display for the value of this variable
 * @prop GraphPlane plane | The plane on which this graph is displayed
 */
class Graph {
	/**
	 * Creates a new Graph.
	 * @param String name | The displayed name of the variable
	 * @param () => Number y | A function which returns the current value of the variable
	 * @param Number minY | The minimum displayed value of the variable
	 * @param Number maxY | The maximum displayed value of the variable
	 * @param Color color | The color of the graph of this variable
	 * @param Number decimalPlaces? | The number of decimal places to display for the value of this variable. Default is 2
	 */
    constructor(name, y, minY, maxY, color, decimalPlaces = 2) {
        this.name = name;
        this.y = y;
        this.minY = minY;
        this.maxY = maxY;
        this.color = color;
        this.decimalPlaces = decimalPlaces;
        this.data = [];
        this.plane = null;
        this.lastRemappedDataPoint = null;
    }
    draw(renderer) {
        let data = this.getRemappedData();
        if (!data.length) return;
        renderer.stroke(this.color, 1).connector(data);
        let dataValue = this.data[this.data.length - 1];
        let prefix = "-";
        if (dataValue >= 0) prefix = " ";
        let dText = `${this.name}: ${prefix + Math.abs(this.data[this.data.length - 1]).toFixed(this.decimalPlaces)}`;
        let point = data[data.length - 1];
        point.x = Math.min(point.x, this.plane.graphRect.xRange.max - this.plane.font.lineHeight / 2);
        point.y = Number.clamp(point.y, this.plane.graphRect.yRange.min + this.plane.font.lineHeight / 2, this.plane.graphRect.yRange.max - this.plane.font.lineHeight / 2 - this.plane.font.getTextHeight(this.name));
        this.lastRemappedDataPoint = { point, text: dText };
    }
    label(renderer) {
        let { text, point } = this.lastRemappedDataPoint;
        renderer.textMode = TextMode.TOP_RIGHT;
        let width = this.plane.font.getTextWidth(text);
        let height = this.plane.font.getTextHeight(text);
        point.x = Math.max(width + this.plane.font.lineHeight, point.x);
        renderer.draw(new Color(0, 0, 0, 0.7)).rect(point.x - width - this.plane.font.lineHeight / 2, point.y - this.plane.font.lineHeight / 2, width + this.plane.font.lineHeight, height + this.plane.font.lineHeight);
        // renderer.draw(Color.BLACK).text(this.plane.font, text, point.plus(1));
        renderer.draw(this.color).text(this.plane.font, text, point);
    }
    getRemappedData() {
        let { x, y, width, height } = this.plane.graphRect;
        let data = [];
        for (let i = 0; i < this.data.length; i += this.plane.stepSize) data.push(this.data[i]);
        data.push(this.data[this.data.length - 1]);
        return data.map((v, i) => Vector2.clamp(
            Vector2.remap(
                new Vector2(i * this.plane.stepSize, v), 
                new Vector2(0, this.minY), 
                new Vector2(this.plane.frameLimit, this.maxY), 
                new Vector2(x, y + height), 
                new Vector2(x + width, y)
            ),
            new Vector2(x, y),
            new Vector2(x + width, y + height)
        ));
    }
    update(t) {
        this.data.push(this.y(t));
        if (this.data.length > this.plane.frameLimit) this.data.shift();
	}
}

/**
 * Represents a renderable, updating graph of one or more variables.
 * This class is to be used for debugging or technical visualization purposes, rather than in games or tools.
 * This class should not be constructed and should instead be created using `IntervalManager.prototype.makeGraphPlane()`.
 * ```js
 * // graph the value of perlin noise
 * const graph = intervals.makeGraphPlane([
 * 	new Graph("Perlin", () => {
 * 		const time = intervals.frameCount;
 * 		return Random.perlin(time, 0.01);
 * 	}, 0, 1, new Color("white"))
 * ]);
 * 
 * intervals.continuous(() => {
 * 	renderer.image(graph).default(10, 10);
 * });
 * ```
 * @prop Graph[] graphs | The graphs displayed on this plane
 * @prop Number frameLimit | The total number of frames displayed on the graph plane
 */
class GraphPlane extends Frame {
    constructor(graphs, frameLimit) {
        super(300, 200);
        for (let i = 0; i < graphs.length; i++) graphs[i].plane = this;
        this.graphs = graphs;
        this.frameLimit = frameLimit;
        this.stepSize = Math.ceil(this.frameLimit / 300);
        this.minFrame = 0;
        this.frameCount = 0;

        this.font = new Font(10, "Serif");
        this.lastImgTime = -20;

        let bottomOffset = this.font.lineHeight * 2;
        this.boundingRect = new Rect(0, 0, this.width, this.height);
        this.graphRect = new Rect(this.boundingRect.x, this.boundingRect.y, this.boundingRect.width, this.boundingRect.height - bottomOffset);
    }
    draw() {
        function formatTime(t) {
            return t.toString().split("").reverse().map((e, i) => !(i % 3) && i ? "," + e : e).join("").split("").reverse().join("");
        }
        let renderer = this.renderer;
        renderer.clear();
        renderer.draw(Color.BLACK).rect(this.boundingRect);
        renderer.textMode = TextMode.BOTTOM_LEFT;
        let minTime = Math.max(0, performance.now());
        let timeLimit = this.frameLimit * 16;
        renderer.draw(Color.WHITE).text(this.font, `${formatTime(this.minFrame)}f`, this.boundingRect.xRange.min + this.font.lineHeight / 2, this.boundingRect.yRange.max - this.font.lineHeight / 2);
        renderer.textMode = TextMode.BOTTOM_RIGHT;
        renderer.draw(Color.WHITE).text(this.font, `${formatTime(this.minFrame + this.frameLimit)}f`, this.boundingRect.xRange.max - this.font.lineHeight / 2, this.boundingRect.yRange.max - this.font.lineHeight / 2);
        for (let i = 0; i < this.graphs.length; i++) this.graphs[i].draw(renderer);
        for (let i = 0; i < this.graphs.length; i++) this.graphs[i].label(renderer);
        renderer.stroke(Color.WHITE).rect(this.boundingRect);
        renderer.stroke(Color.WHITE).line(this.graphRect.xRange.min, this.graphRect.yRange.max, this.graphRect.xRange.max, this.graphRect.yRange.max);
    }
    update() {
        let t = this.frameCount++;
        this.minFrame = Math.max(0, t - this.frameLimit);
        for (let i = 0; i < this.graphs.length; i++) this.graphs[i].update(t);
    }
    makeImage() {
        if (performance.now() - this.lastImgTime > 10) {
            this.lastImgTime = performance.now();
            this.draw();
        }
        return this.image;
    }
}