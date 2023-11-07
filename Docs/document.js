const path = require("path");
const { highlight, highlighters, inferLanguage } = require("./highlight");


function sourceLink(doc) {
	return `https://www.github.com/Elkwizard/Hengine/blob/new-documentation/Package/Engine/${doc.source.file}?#L${doc.source.line}`;
}

function documentName(name, doc, wrapperClass) {
	let result = name.base;
	if (name.isPage) return `<span class="page-name">${result}</span>`
	if (name.isStatic) result = `${wrapperClass}.${result}`;
	result = `<a href="${sourceLink(doc)}" class="${name.isClass ? "class-name" : "function-name"} source-link">${result}</a>`;
	if (name.isGetter) result = `<span class="keyword">get</span> ${result}`;
	if (name.isSetter) result = `<span class="keyword">set</span> ${result}`;
	if (name.baseClass) result += ` <span class="keyword">extends</span> <span class="class-name">${name.baseClass}</span>`
	return result;
}

function documentFunction(fn, wrapperClass) {
	const names = fn.lines.find(line => line.category === "group")?.elements;
	const name = names ? `${names.map(name => documentName(name, fn, wrapperClass)).join(`<span class="aux">/</span>`)}` : documentName(fn.name, fn, wrapperClass);
	const signatures = fn.lines
		.filter(line => line.category === "signature").map(line => line.parameters);
	const returnType = fn.lines.find(line => line.category === "return")?.type ?? "void";
	const parameters = signatures
		.map(params => {
			if (params.length)
				return params
					.map(param => `<span class="param">${param.name}</span>`)
					.join(", ");

			if (signatures.length > 1)
				return `<span class="param">void</span>`;

			return "";
		}).join(`<span class="aux"> | </span>`);
	const header = `${name}${fn.name.isGetter ? "" : `(${parameters})`}${fn.name.base === "constructor" ? "" : `<span class="type">${returnType}</span>`}`;
	const parameterDescriptions = signatures
		.map(signature => `
			<div class="header">Parameters</div>
			${
				signature
					.map(param => `
						<div class="param-wrapper">
							<div class="param-name">
								<span class="param">${param.name.replace(/\W/g, "")}</span>
								<span class="type">${param.type}</span>
							</div>
							<div class="param desc">
								${param.description}
							</div>
						</div>
					`).join("")
			}
		`).join("");

	const description = fn.lines.find(line => line.category === null)?.content ?? "";

	return `
		<div class="function-wrapper">
			<div class="function-header member">
				${header}
			</div>
			<div class="function desc">
				${description}
			</div>
			${signatures.length ? `
			<div class="function-signature">
				${parameterDescriptions}
			</div>` : ""}
		</div>
	`;
}

function document(doc, topLevelIDs, file) {
	let result;
	if (doc.name.isPage) {
		const name = documentName(doc.name, doc);
		const description = doc.lines.find(line => line.category === null)?.content ?? "";

		result = `
			<div class="page-wrapper">
				<div class="page-header">
					${name}
				</div>

				<div class="page desc">
					${description}
				</div>

			</div>
		`;

	} else if (doc.name.isClass) {
		const name = documentName(doc.name, doc);
		const classQualifiers = [];
		// if (doc.lines.some(line => line.category === "abstract"))
		// 	classQualifiers.push("abstract");
		// if (doc.lines.some(line => line.category === "readonly"))
		// 	classQualifiers.push("readonly");

		const description = doc.lines.find(line => line.category === null)?.content ?? "";
		const subclass = (doc.subclasses ?? [])
			.map(cls => `<span class="class-name">${cls.name.base}</span>`)
			.join(", ");
		const memberFunctions = [...doc.members]
			.sort((a, b) => (b.name.isSetter || b.name.isGetter) - (a.name.isSetter || a.name.isGetter))
			.sort((a, b) => a.name.isStatic - b.name.isStatic)
			.sort((a, b) => (b.name.base === "constructor") - (a.name.base === "constructor"))
			.map(member => documentFunction(member, doc.name.base))
			.join("");
		const memberProperties = doc.lines
			.filter(line => line.category?.indexOf("prop") > -1)
			.map(line => `
				<div class="prop-wrapper">
					<div class="prop-header member">
						<span class="prop-name">${line.name}</span><span class="type">${line.type}</span>
					</div>
					<div class="prop desc">${line.description}</div>
				</div>
			`)
			.join("");
		result = `
			<div class="class-wrapper" id="${doc.name.base}">
				<div class="class-header">
					<span class="keyword">${[...classQualifiers, doc.name.isEnum ? "enum" : "class"].join(" ")}</span> ${name}
				</div>
				<div class="class desc">
				${description}
				</div>
				${subclass ? `
					<div class="header">Subclasses</div>
					<div class="subclass desc">${subclass}</div>
				` : ""}
				
				${memberProperties ? `
					<div class="header">Properties</div>
					<div class="class-properties">${memberProperties}</div>
				` : ""}
				
				${memberFunctions ? `
					<div class="header">Methods</div>
					<div class="class-methods">${memberFunctions}</div>
				` : ""}
			</div>
		`;
	} else result = documentFunction(doc);

	console.log(`documenting ${doc.name.base}`);

	// highlight and transform code blocks
	result = result.replace(/```(\w+?)\s*\n([\w\W]*?)```/g, (_, language, code) => {
		return highlight(code, highlighters[language], true, "block");
	});
	result = result.replace(/`(.*?)`/g, (_, code) => {
		return highlight(code, highlighters[inferLanguage(code)]);
	});
	result = result.replace(/`(.*?)`/g, (_, code) => {
		return highlight(code, highlighters.js);
	});

	// add automatic links to other doc pages
	const toRoot = path.relative(path.dirname(file), ".");
	const entries = Object.entries(topLevelIDs)
		.sort((a, b) => b[0].length - a[0].length);
	for (const [id, filePath] of entries) {
		if (file === filePath) continue;
		const regex = new RegExp(String.raw`(?<! href="([^"]*?))\b(${id.replaceAll(".", "\\.")}(s|es)?)\b(?!([^<]*?)<\/a>)`, "g");
		const link = `<a href=${JSON.stringify(
			path.join(toRoot, filePath)
				.replace(/\\/g, "/") + "#" + id
		)}>$2</a>`;
		result = result.replace(regex, link);
	}

	return result;
}

module.exports = { document };