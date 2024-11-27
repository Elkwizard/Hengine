const fs = require("fs");
const path = require("path");

const [,, modulePath] = process.argv;

const data = fs.readFileSync(modulePath + ".wasm");

const offset = "\r".charCodeAt() + 1;
const dataString = [...data]
	.map(code => String.fromCharCode(code + offset))
	.join("");

const moduleName = path.basename(modulePath);
const js = `HengineWASMResource.buffers[${JSON.stringify(moduleName)}] = () => {
//${dataString}
};`;

process.chdir(modulePath);
fs.writeFileSync("buffer.js", js, "utf-8");