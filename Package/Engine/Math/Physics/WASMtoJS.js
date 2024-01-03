const fs = require("fs");
const path = require("path");

const [_node, _this, file, imports = ""] = process.argv;

const data = fs.readFileSync(file + ".wasm");

const dataString = [...data]
	.map(code => String.fromCharCode(code))
	.join("");

const js = `HengineWASMResource.files[document.currentScript.src] = {
	imports: ${JSON.stringify(imports.split(","))},
	buffer: function buffer() {
		//${
			dataString
				.replace(/[\r\n]/g, match => `\n\t\t${match.charCodeAt(0)}//`)
		}
	}
};`;

fs.writeFileSync(file + ".js", js, "utf-8");