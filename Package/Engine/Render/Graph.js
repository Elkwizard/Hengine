class Graph {
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
        point.x = Math.min(point.x, this.plane.graphRect.xRange.max - this.plane.font.size / 2);
        point.y = Number.clamp(point.y, this.plane.graphRect.yRange.min + this.plane.font.size / 2, this.plane.graphRect.yRange.max - this.plane.font.size / 2 - renderer.getTextHeight(this.plane.font, this.name));
        this.lastRemappedDataPoint = { point, text: dText };
    }
    label(renderer) {
        let { text, point } = this.lastRemappedDataPoint;
        renderer.textMode = TextMode.RIGHT;
        renderer.textModeVertical = TextMode.TOP;
        let width = renderer.getTextWidth(this.plane.font, text);
        let height = renderer.getTextHeight(this.plane.font, text);
        renderer.draw(new Color(0, 0, 0, 0.7)).rect(point.x - width - this.plane.font.size / 2, point.y - this.plane.font.size / 2, width + this.plane.font.size, height + this.plane.font.size);
        // renderer.draw(cl.BLACK).text(this.plane.font, text, point.plus(1));
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
class GraphPlane extends Frame {
    constructor(graphs, frameLimit) {
        super(300, 200);
        for (let i = 0; i < graphs.length; i++) graphs[i].plane = this;
        this.graphs = graphs;
        this.frameLimit = frameLimit;
        this.stepSize = Math.ceil(this.frameLimit / 300);
        this.minFrame = 0;

        this.font = new Font(10, "Serif");

        this.lastImgTime = -20;

        let bottomOffset = this.font.size * 2;
        this.boundingRect = new Rect(0, 0, this.width, this.height);
        this.graphRect = new Rect(this.boundingRect.x, this.boundingRect.y, this.boundingRect.width, this.boundingRect.height - bottomOffset);
    }
    draw() {
        function formatTime(t) {
            return t.toString().split("").reverse().map((e, i) => (!(i % 3) && i) ? "," + e : e).join("").split("").reverse().join("");
        }
        let renderer = this.renderer;
        renderer.clear();
        renderer.draw(cl.BLACK).rect(this.boundingRect);
        renderer.textMode = TextMode.LEFT;
        renderer.textModeVertical = TextMode.BOTTOM;
        let minTime = Math.max(0, performance.now());
        let timeLimit = this.frameLimit * 16;
        renderer.draw(cl.WHITE).text(this.font, `${formatTime(this.minFrame)} F / ${Time.formatMS(minTime)}`, this.boundingRect.xRange.min + this.font.size / 2, this.boundingRect.yRange.max - this.font.size / 2);
        renderer.textMode = TextMode.RIGHT;
        renderer.draw(cl.WHITE).text(this.font, `${formatTime(this.minFrame + this.frameLimit)} F / ${Time.formatMS(minTime + timeLimit)}`, this.boundingRect.xRange.max - this.font.size / 2, this.boundingRect.yRange.max - this.font.size / 2);
        for (let i = 0; i < this.graphs.length; i++) this.graphs[i].draw(renderer);
        for (let i = 0; i < this.graphs.length; i++) this.graphs[i].label(renderer);
        renderer.stroke(cl.WHITE).rect(this.boundingRect);
        renderer.stroke(cl.WHITE).line(this.graphRect.xRange.min, this.graphRect.yRange.max, this.graphRect.xRange.max, this.graphRect.yRange.max);
    }
    update() {
        
        let t = gameEngine.frameCount;
        this.minFrame = Math.max(0, t - this.frameLimit);
        for (let i = 0; i < this.graphs.length; i++) this.graphs[i].update(t);
    }
    makeImage() {
        if (performance.now() - this.lastImgTime > 10) {
            this.lastImgTime = performance.now();
            this.draw();
        }
        return this.img;
    }
}