class Console {
    constructor() {
        this.enabled = false;
        this.HTMLPanel = null;
        this.HTMLLogPanel = document.createElement("div");
        this.HTMLLogPanel.className = "console-log-panel";
        this.HTMLLogPanel.dataset.console = this;
        this.logs = [];
        this.Log = class {
            constructor(m, type) {
                this.type = type;
                let str = "";
                if (this.type === "error") str = m.toString();
                else if (typeof m === "object") {
                    str = m.toString();
                } else if (typeof m === "string") {
                    str = `"${m}"`;
                } else {
                    str = m;
                }
                this.str = str;
            }
            toString(){
                let ph = (this.type === "error")? `<span class="error-x">x</span>`:"";
                let p = `<div class="log ${this.type}"><span class="caret">[${Time.getFormattedTime()}]&gt;</span>${ph}${this.str}</div>`;
                return p;
            }
        }
        let styling = `
            .log.error {
                color: red;
            }
            .log.return {
                color: #888;
            }
            .log {
                font: 20px monospace;
                color: black;
                border-bottom: 1px #555 solid;
                background: #dfdfdf;
                padding: 3px;
            }
            .caret {
                color: #888;
                margin-right: 5px;
            }
            .error-x {
                font-weight: 800;
                background: #900;
                font-size: 15px;
                border-radius: 50%;
                display: inline-block;
                width: 20px;
                height: 20px;
                text-align: center;
                color: white;
                padding-bottom: .2%;
                margin-right: 5px;
            }
            .console {
                font-family: monospace;
                width: 39.8%;
                height: 100%;
                position: absolute;
                z-index: 1000;
                left: 60%;
                top: 0%;
                background: #dfdfdf;
                border-left: 1px #555 solid;
            }
            .console-log-panel {
                overflow-y: scroll;
                height: 96%;
                width: 100%;
            }
            .console-header {
                font-size: 20px;
                text-align: left;
                padding: 3px;
                height: 3%;
                border-bottom: 1px #555 solid;
            }
			.console-header-button {
				display: block;
				float: right;
			}
        `;
        document.head.innerHTML += `<style>${styling}</style>`;
    }
    enable() {
        this.enabled = true;
        //create html panel
        let html = document.createElement("div");
		html.className = "console";
		let header = document.createElement("div");
		header.className = "console-header";
		header.innerHTML = "Console";
		let closeButton = document.createElement("button");
		closeButton.innerHTML = "close";
		closeButton.className = "console-header-button";
		closeButton.onclick = this.disable.bind(this);
		header.appendChild(closeButton);
		html.appendChild(header);

        document.body.appendChild(html);
        this.HTMLPanel = document.getElementsByClassName("console")[0];
        this.HTMLPanel.appendChild(this.HTMLLogPanel);
    }
    disable() {
        this.enabled = false;
        if (this.HTMLPanel) {
            this.HTMLPanel.outerHTML = "";
        }
        this.HTMLPanel = null;
    }
    log(m) {
        if (this.logs[this.logs.length - 1] !== m) {
            this.logs.push(m);
            this.HTMLLogPanel.innerHTML += new this.Log(m, "log");
        }
    }
    returnValue(m) {
        this.logs.push(m);
        this.HTMLLogPanel.innerHTML += new this.Log(m, "return");
    }
    error(m) {
        if (this.logs[this.logs.length - 1] !== m) {
            this.logs.push(m);
            this.HTMLLogPanel.innerHTML += new this.Log(m, "error");
        }
    }
    clear() {
        this.logs = [];
        this.HTMLLogPanel.innerHTML = "";
    }
}