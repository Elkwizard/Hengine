class UIObject extends SceneObject {
    constructor(name, x, y, container, engine) {
        super(name, x, y, null, "UI", container, engine);
    }
    engineDraw() {
        this.onScreen = true;
        this.engine.scene.camera.drawInScreenSpace(() => {
            if (!this.hidden) this.runDraw();
            this.scripts.run("EscapeDraw");
        });
    }
}

//HSS
class UIComponent {
    constructor(name, font, content, padding = 5, margin = 5, block = false, maxWidth = null, maxHeight = null) {
        this.name = name;
        this.font = font;
        this.content = content;
        this.padding = padding;
        this.margin = margin;
        this.block = block;
        if (maxWidth) this.setWidth(maxWidth);
        else this.setWidth(this.font.getTextWidth(this.content) + this.padding * 2);
        if (maxHeight) this.setHeight(maxHeight);
    }
    setHeight(h) {
        this.borderBox.height = h;
        this.marginBox.height = h + this.margin * 2;
        if (this.contentBox.height < this.borderBox.height - this.padding * 2) this.contentBox.y = this.borderBox.middle.y - this.contentBox.height / 2;
    }
    setWidth(w) {
        let contentWidth = w - this.padding * 2;
        this.packedContent = this.font.packText(this.content, contentWidth);
        let contentHeight = this.font.getTextHeight(this.packedContent);
        this.contentBox = new Rect(this.padding, this.padding, contentWidth, contentHeight);
        this.borderBox = new Rect(0, 0, w, this.contentBox.height + this.padding * 2);
        this.marginBox = new Rect(-this.margin, -this.margin, this.borderBox.width + this.margin * 2, this.borderBox.height + this.margin * 2);
    }
    layout(transform) {
        let box = this.borderBox.move(transform.position);
        const layout = scene.main.addUIElement(this.name, box.middle.x, box.middle.y, box.width, box.height);
        layout.transform.rotateAround(transform.position, transform.rotation);
        UIComponent.UI_LAYOUT.addTo(layout, this.font, this.packedContent, -(this.contentBox.width / 2), 0);
        return layout;
    }
}
UIComponent.UI_LAYOUT = new ElementScript("UI_LAYOUT", {
    init(l, font, content, x, y) {
        this.scripts.removeDefault();
        l.font = font;
        l.content = content;
        l.offset = new Vector2(x, y);
        l.scriptNumber = 1000;
        l.color = Color.BLACK;
        l.renderer = this.engine.renderer;
    },
    draw(l) {
        let prev = l.renderer.textMode;
        l.renderer.textMode = TextMode.CENTER_LEFT;
        l.renderer.draw(l.color).text(l.font, l.content, l.offset);
        l.renderer.textMode = prev;
    }
});

class UIContainer {
    constructor(components, maxWidth = width, maxHeight = height) {
        this.content = components;
        this.setWidth(maxWidth);
        this.setHeight(maxHeight);
    }
    setHeight(h) {
        this.borderBox.height = h;
        if (this.contentBox.height < this.borderBox.height) this.contentBox.y = this.borderBox.middle.y - this.contentBox.height / 2;
    }
    setWidth(w) {
        let contentWidth = w;
        this.packedContent = [];
        let acc = [];
        let accWidth = 0;
        for (let i = 0; i < this.content.length; i++) {
            let comp = this.content[i];
            accWidth += comp.marginBox.width;
            if (accWidth > contentWidth || (i && this.content[i - 1].block) || comp.block) {
                accWidth = comp.marginBox.width;
                this.packedContent.push(acc);
                acc = [];
            }
            acc.push(comp);
        }
        this.packedContent.push(acc);
        
        let contentHeight = 0;
        let rowHeights = [];
        for (let i = 0; i < this.packedContent.length; i++) {
            let row = this.packedContent[i];
            let biggestInc = 0;
            for (let j = 0; j < row.length; j++) {
                let comp = row[j];
                if (comp.marginBox.height > biggestInc) biggestInc = comp.marginBox.height;
            }
            contentHeight += biggestInc;
            rowHeights.push(biggestInc);
        }
        this.contentOffsets = [];
        for (let i = 0; i < this.packedContent.length; i++) {
            this.contentOffsets.push([]);
            let row = this.packedContent[i];
            for (let j = 0; j < row.length; j++) {
                let h = row[j].marginBox.height;
                let off = (rowHeights[i] - h);
                this.contentOffsets[i].push(off);
            }
        }

        this.contentBox = new Rect(0, 0, contentWidth, contentHeight);
        this.borderBox = new Rect(0, 0, w, this.contentBox.height);
    }
    layout(transform) {
        let layouts = [];
        let y = this.contentBox.y;
        let right = transform.direction;
        let down = right.normal;
        let offset = right.times(-this.borderBox.width / 2).plus(down.times(-this.borderBox.height / 2));
        for (let i = 0; i < this.packedContent.length; i++) {
            let x = this.contentBox.x;
            let row = this.packedContent[i];
            let biggestInc = 0;
            for (let j = 0; j < row.length; j++) {
                let comp = row[j];
                if (comp.marginBox.height > biggestInc) biggestInc = comp.marginBox.height;
                let horizontal = right.times(x + comp.margin);
                let vertical = down.times(y + comp.margin + this.contentOffsets[i][j]);
                let point = horizontal.plus(vertical).plus(transform.position);
                let layout = comp.layout(new Transform(point.x, point.y, transform.rotation));
                layout.transform.position.add(offset);
                layouts.push(layout);
                x += comp.marginBox.width;
            }
            y += biggestInc;
        }
        return layouts;
    }
}