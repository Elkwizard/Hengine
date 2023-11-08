const fs = require("fs");
const path = require("path");
const { parse } = require("./parse.js");
const { document, stats } = require("./document.js");

const generate = (transf, srcFile, srcRoot = srcFile) => {
	if (fs.lstatSync(srcFile).isDirectory())
		return fs.readdirSync(srcFile)
			.map(p => path.join(srcFile, p))
			.flatMap(p => generate(transf, p, srcRoot));
	else return [transf(fs.readFileSync(srcFile, "utf-8"), path.relative(srcRoot, srcFile))];
};

const [_node, _this, sourcePath, dstPath, structurePath] = process.argv;

const structure = JSON.parse(fs.readFileSync(structurePath, "utf-8"));
const nameToPath = {};

const populatePathMap = (structure, file = ".") => {
	for (const key in structure) {
		const value = structure[key];
		const dst = path.join(file, key);
		if (Array.isArray(value) || value === null)
			for (const name of value ? value : [key])
				nameToPath[name] = dst + ".html";
		else populatePathMap(value, dst);
	}
};

populatePathMap(structure);

function writeFile(fileName, content) {
	content = content.replaceAll("\n", "\r\n");
	fileName = path.join(dstPath, fileName);
	const dir = path.dirname(fileName);
	if (!fs.existsSync(dir))
		fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(fileName, content, "utf-8");
}

const docs = generate(parse, sourcePath).flatMap(batch => batch);

const pathToDocumentation = { };

for (const doc of docs)
	if (doc.name.baseClass)
		for (const superDoc of docs)
			if (doc.name.baseClass === superDoc.name.base)
				(superDoc.subclasses ??= []).push(doc);

const nameToDoc = { };
for (const doc of docs)
	nameToDoc[doc.name.base] = doc;

const completeness = { };

for (const name in nameToPath) {
	const doc = nameToDoc[name];
	const path = nameToPath[name];
	if (!(path in completeness))
		completeness[path] = !!doc;
	else completeness[path] &&= !!doc;
	if (!doc) continue;
	if (!path) console.log(`${doc.name.base} doesn't exist!`); 
	// console.log(doc.name.base, path);
	pathToDocumentation[path] = (pathToDocumentation[path] ?? "") + document(doc, nameToPath, path);
}

for (const file in pathToDocumentation) {
	if (!pathToDocumentation[file]) continue;
	const toRoot = path.relative(path.dirname(file), ".");
	const documentation = `
		<!DOCTYPE html>
		<html>
			<head>
				<link href="${path.join(toRoot, "./vars.css")}" type="text/css" rel="stylesheet">
				<link href="${path.join(toRoot, "./doc.css")}" type="text/css" rel="stylesheet">
			</head>
			<body>
				${pathToDocumentation[file]}
			</body>
		</html>
	`;
	writeFile(file, documentation);
}

writeFile("index.js", `const paths = ${JSON.stringify(structure)}; const completeness = ${JSON.stringify(completeness)};`);

console.log("Documentation Statistics: ", stats);