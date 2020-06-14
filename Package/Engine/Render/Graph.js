class Graph extends Frame {
    constructor(yName, minValue, maxValue, getY, msLimit = 5000, colors = [{ color: "white", limit: 0 }], updater = null) {
        super(400, 225);
        let c = new Frame(1, 1).c;
        this.leftOffset = Math.max(c.c.measureText(maxValue.toString()).width, c.c.measureText(minValue.toString()).width) + 10;
        this.bottomTextOffset = 5;
        this.mainGraphWidth = 400 - this.leftOffset;
        this.yName = yName;
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.getY = getY;
        this.msLimit = msLimit;
        this.updater = updater;
        this.colors = colors;
        class EQN {
            constructor(getY) {
                this.getY = getY;
                this.data = [];
            }
        }
        if (!Array.isArray(yName)) {
            this.vars = {
                [yName]: new EQN(getY)
            };
        } else {
            this.vars = {};
            for (let i = 0; i < yName.length; i++) this.vars[yName[i]] = new EQN(getY[i]);
        }
        this.timeOffset = 0;
        this.colorScheme = "dark";
        let black = (this.colorScheme.toLowerCase() == "dark") ? "black" : "white";
        let white = (this.colorScheme.toLowerCase() == "dark") ? "white" : "black";
        this.drawBasics(black, white);
        let graphFrame = new Frame(400, 198);
        this.graphFrame = graphFrame;
        this.updater.graphs.push(this);
    }
    getYValue(fV) {
        return clamp(200 - ((fV - this.minValue) / (this.maxValue - this.minValue)) * 200, 0, 198);
    }
    getXValue(fV) {
        return this.mainGraphWidth * ((fV - this.timeOffset) / this.msLimit);
    }
    getColor(n) {
        let black = (this.colorScheme.toLowerCase() == "dark") ? "black" : "white";
        
        for (let color of this.colors) {
            if (n >= color.limit) return color.color;
        }
        return black;
    }
    drawBasics(black, white) {
        this.c.draw(black).rect(0, 0, this.width, this.height);
        this.c.stroke(white, 2).rect(this.leftOffset, -2, 422, 200);
        this.c.c.font = "10px Arial";
        this.c.textMode = "center";
        this.c.draw(white).text("10px Arial", this.maxValue, this.leftOffset / 2, 2);
        this.c.draw(white).text("10px Arial", this.minValue, this.leftOffset / 2, 190);
        let tx = this.leftOffset / 2;
        let ty = 100;
        if (!Array.isArray(this.yName)) {
            this.c.translate(tx, ty);
            this.c.rotate(-Math.PI / 2);
            this.c.draw(white).text("10px Arial", this.yName.split("").join(" "), 0, -5);
            this.c.rotate(Math.PI / 2);
            this.c.translate(-tx, -ty);
        }
        this.c.draw(white).text("10px Arial", "Time", 220, 200 + this.bottomTextOffset);
        this.c.textMode = "left";
        this.c.draw(white).text("10px Arial", "5000", this.leftOffset + 370, 200 + this.bottomTextOffset);
        this.c.draw(white).text("10px Arial", "0", this.leftOffset, 200 + this.bottomTextOffset);
    }
    get colorScheme() {
        return this._colorScheme;
    }
    set colorScheme(a) {
        this._colorScheme = a;
        let black = (this.colorScheme.toLowerCase() == "dark") ? "black" : "white";
        let white = (this.colorScheme.toLowerCase() == "dark") ? "white" : "black";
        this.drawBasics(black, white);
    }
    get() {
        let black = (this.colorScheme.toLowerCase() == "dark") ? "black" : "white";
        let white = (this.colorScheme.toLowerCase() == "dark") ? "white" : "black";
        this.c.textMode = TextMode.LEFT;
        this.c.draw(black).rect(this.leftOffset + 2, 0, 420, 198);
        this.graphFrame.c.clear();
        this.graphFrame.c.c.setLineDash([4, 2]);
        let lastCol = {
            limit: this.maxValue
        };
        for (let i = 0; i < this.colors.length; i++) {
            this.graphFrame.c.c.globalAlpha = 0.1;
            let col = this.colors[i];
            let dif = lastCol.limit - col.limit;
            if (!col.limit) col.limit = this.minValue;
            this.graphFrame.c.draw(col.color).rect(0, this.getYValue(lastCol.limit), this.mainGraphWidth, this.getYValue(col.limit) - this.getYValue(lastCol.limit));
            this.graphFrame.c.c.globalAlpha = .5;
            this.graphFrame.c.stroke(col.color, 2).line(0, this.getYValue(lastCol.limit), this.mainGraphWidth, this.getYValue(lastCol.limit));
            lastCol = col;
        }
        this.graphFrame.c.c.globalAlpha = 1;
        this.graphFrame.c.c.setLineDash([]);
        let len = 0;
        for (let key in this.vars) len++;
        for (let key in this.vars) {
            let last = null;
            let fData = this.vars[key].data;
            let step = 1;
            if (fData.length > 300) step = Math.ceil(fData.length / 300);
            for (let i = 0; i - step < fData.length; i += step) {
                let data = fData[Math.min(i, fData.length - 1)];
                if (last) {
                    let x1 = this.getXValue(last.x);
                    let y1 = this.getYValue(last.y);
                    let x2 = this.getXValue(data.x);
                    let y2 = this.getYValue(data.y);
                    let col = this.getColor(data.y);
                    this.graphFrame.c.stroke(col, 3).line(x1, y1, x2, y2);
                }
                last = data;
            }
            this.graphFrame.c.textMode = TextMode.RIGHT;
            let y = this.getYValue(last.y);
            if (y > 185) y -= 15;
            let prefix = key + ": ";
            if (len == 1) prefix = "";
            let text = prefix + last.y;
            let w = this.c.c.measureText(text).width;
            let lastX = this.getXValue(last.x);
            this.graphFrame.c.draw(black).rect(
                lastX - 10 - w,
                y + 1,
                w + 6,
                16
            );
            this.graphFrame.c.stroke(white, 1).rect(
                lastX - 10 - w,
                y + 1,
                w + 6,
                16
            );
            this.graphFrame.c.draw(white).text(
                "10px Arial",
                text,
                lastX - 8,
                y + 3
            );
        }
        this.c.image(this.graphFrame).default(this.leftOffset + 2, 0);
        let timeStart = Time.formatMS(Math.floor(this.timeOffset));
        let timeEnd = Time.formatMS(Math.floor(this.timeOffset) + this.msLimit);
        this.c.draw(black).rect(this.leftOffset, 200 + this.bottomTextOffset, this.c.c.measureText(timeStart).width, 200);
        this.c.draw(white).text("10px Arial", timeStart, this.leftOffset, 200 + this.bottomTextOffset);
        this.c.draw(black).rect(this.leftOffset + this.mainGraphWidth - 10 - this.c.c.measureText(timeEnd).width, 200 + this.bottomTextOffset, 200, 200);
        this.c.textMode = TextMode.RIGHT;
        this.c.draw(white).text("10px Arial", timeEnd, this.mainGraphWidth - 10 + this.leftOffset, 200 + this.bottomTextOffset);
        return this;
    }
}