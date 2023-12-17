const fs = require("fs");
const path = require("path");

const [_node, _this, file, imports] = process.argv;

const data = fs.readFileSync(file + ".wasm");

const js = `HengineWASMResource.files[document.currentScript.src] = {
	imports: ${JSON.stringify(imports.split(","))},
	buffer: new Uint8Array(${JSON.stringify([...new Uint8Array(data.buffer)])}).buffer
};`;

fs.writeFileSync(file + ".js", js, "utf-8");