import fs from "node:fs";
import path from "node:path";
import { parse, addInheritance } from "./parse.js";
import { document, stats } from "./document.js";
import { makeSearchCache, addSearchData } from "./searchPreprocess.js";
import createTypeSpecification from "./typeSpecification.js";

const [_node, _this, sourcePath, dstPath, structurePath, typeFile] = process.argv;

const normalizeLineBreaks = content => content.replace(/(?<!\r)\n/g, "\r\n");

const writeFile = (fileName, content) => {
	content = normalizeLineBreaks(content);
	fileName = path.join(dstPath, fileName);
	const dir = path.dirname(fileName);
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(fileName, content, "utf-8");
}

// create path map
const structure = JSON.parse(fs.readFileSync(structurePath, "utf-8"));
const nameToPath = { };

const populatePathMap = (structure, file = ".") => {
	for (const key in structure) {
		const value = structure[key];
		const dst = `${file}/${key}`;
		if (Array.isArray(value) || value === null) {
			for (const name of value ?? [key])
				nameToPath[name] = dst + ".html";
		} else {
			populatePathMap(value, dst);
		}
	}
};

populatePathMap(structure);

// parse source files
const transformFiles = (transf, srcFile, srcRoot = srcFile) => {
	if (fs.lstatSync(srcFile).isDirectory())
		return fs.readdirSync(srcFile)
			.map(p => path.join(srcFile, p))
			.flatMap(p => transformFiles(transf, p, srcRoot));
	else return [transf(
		fs.readFileSync(srcFile, "utf-8"),
		path.relative(srcRoot, srcFile)
	)];
};

const aliases = { };
const docs = transformFiles(parse, sourcePath).flatMap(file => {
	Object.assign(aliases, file.aliases);
	return file.topLevels;
});
addInheritance(docs);

for (const dimension of [2, 3]) {
	const fileName = typeFile.replace(".d.ts", `${dimension}D.d.ts`);
	const typeSpec = createTypeSpecification(docs, aliases, dimension);
	fs.writeFileSync(fileName, normalizeLineBreaks(typeSpec), "utf-8");
}

const nameToDoc = { };
for (const doc of docs)
	nameToDoc[doc.name.base] = doc;

// create top level doc to path map
const docToPath = new Map();
for (const name in nameToPath) {
	const doc = nameToDoc[name];
	if (!doc) console.log(`${name} isn't documented`);
	const path = nameToPath[doc.name.base];
	if (!path) console.log(`${doc.name.base} doesn't exist!`);
	docToPath.set(doc, path);
}

{ // preprocess search cache
	const searchIdToDoc = { };
	const searchRecords = addSearchData(docs, searchIdToDoc);
	const searchIdToPath = { };
	for (const id in searchIdToDoc)
		searchIdToPath[id] = docToPath.get(searchIdToDoc[id]);
	const SEARCH_CACHE = makeSearchCache(searchRecords);
	writeFile("searchCache.js", `
		const SEARCH_CACHE = ${JSON.stringify(SEARCH_CACHE)};
		const SEARCH_ID_TO_PATH = ${JSON.stringify(searchIdToPath)};
	`);
}

// create documentation and organize into files
const pathToDocumentation = { };
const completeness = { };

for (const [doc, path] of docToPath) {
	completeness[path] ??= true;
	completeness[path] &&= !!doc;
	if (!doc) continue;
	pathToDocumentation[path] ??= "";
	pathToDocumentation[path] += document(doc, docToPath, path, aliases);
}

{
	// clear documentation
	const pagesPath = path.join(dstPath, "Pages");
	if (fs.existsSync(pagesPath))
		fs.rmSync(pagesPath, { recursive: true });
}

// write documentation files to disk
for (const file in pathToDocumentation) {
	if (!pathToDocumentation[file]) continue;
	const toRoot = path.relative(path.dirname(file), ".");
	const documentation = `
		<!DOCTYPE html>
		<html>
			<head>
				<meta charset="UTF-8">
				<link href="${path.join(toRoot, "../vars.css")}" type="text/css" rel="stylesheet">
				<link href="${path.join(toRoot, "../doc.css")}" type="text/css" rel="stylesheet">
			</head>
			<body>
				${pathToDocumentation[file]}
			</body>
		</html>
	`;
	writeFile(path.join("Pages", file), documentation);
}

writeFile("index.js", `
	const STRUCTURE = ${JSON.stringify(structure)};
	const COMPLETENESS = ${JSON.stringify(completeness)};
`);

console.log("Documentation Statistics:", stats);