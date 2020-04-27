class DocOrg {
    constructor(nodes) {
        this.nodes = nodes;
        for (let node of nodes) node.parent = this;
    }
    static renderNode(wrap, n) {
        let buttons = [];
        let ns = n.nodes.length;
        for (let i = 0; i < ns; i++) {
            buttons.push(DocOrg.HTML(wrap, n.nodes[i], ns, i));
        }
        wrap.innerHTML = "";
        for (let b of buttons) wrap.appendChild(b);
        if (n.parent) {
            let back = document.createElement("button");
            back.innerHTML = "Back";
            back.className = "back";
            back.onclick = function () {
                DocOrg.renderNode(wrap, n.parent);
            }
            wrap.appendChild(back);
        }
    }
    static HTML(wrap, node, amount, inx) {
        let width = 100 / amount;
        let button = document.createElement("button");
        button.className = node.value.type + "-view choice";
        button.style.width = width.toFixed(2) + "vw";
        button.style.left = (inx * width) + "vw";
        let img = (node.value.type === "tl") ? `<img src="Collection.png" class="icon">` : `<img src="${node.value.type.toUpperCase()}.png" class="icon">`;
        let desc = node.value.desc ? `<div class="desc">
            ${node.value.desc}
        </div>` : ``;
        let param = node.value.param ? `<div class="params">
            ${node.value.param}
        </div>` : ``;
        let name = node.value.name;
        button.innerHTML = `
            <h1 class="title">
                ${img}<br>
                ${name}
                ${param}
            </h1>
            ${desc}
        `;
        button.onclick = function () {
            if (node.nodes.length) DocOrg.renderNode(wrap, node);
        }
        return button;
    }
}
class DocNode {
    constructor(nodes, value) {
        this.parent = null;
        this.value = value;
        this.nodes = nodes;
        for (let node of nodes) node.parent = this;
    }
}