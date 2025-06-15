const path = require("path");
const { highlight, highlighters, inferLanguage } = require("./highlight");

const stats = {
	classes: 0,
	functions: 0,
	words: 0,
	parameters: 0,
	properties: 0
};

const ATTRIBUTE_DESCRIPTIONS = {
	readonly: "This property shouldn't be re-assigned, but its internal properties may be modified",
	stable: "Assigning to this property will simply change the value to match the assigned value, but will not change its identity or maintain a reference to the new value",
	immutable: "This property and its various internal properties shouldn't be changed in any way"
};

function wordCount(text) {
	stats.words += text.trim().replace(/\W+/, " ").split(" ").length;
	return text;
}

function sourceLink(doc) {
	return `https://www.github.com/Elkwizard/Hengine/blob/master/Package/Engine/${doc.source.file}?#L${doc.source.line}`;
}

function escapeHTML(match) {
	return match.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function documentName(name, doc, wrapperClass) {
	if (name.isClass) stats.classes++;
	else stats.functions++;

	let result = escapeHTML(name.base);
	if (name.isPage) return `<span class="page-name">${result}</span>`
	if (name.isStatic) result = `${wrapperClass}.${result}`;
	if (name.isAsync) result = `<span class="keyword">async</span> ${result}`;
	result = `<a href="${sourceLink(doc)}" target="_blank" class="${name.isClass ? "class-name" : "function-name"} source-link">${result}</a>`;
	if (name.isGetter) result = `<span class="keyword">get</span> ${result}`;
	if (name.isSetter) result = `<span class="keyword">set</span> ${result}`;
	if (name.baseClass) result += ` <span class="keyword">extends</span> <span class="class-name">${name.baseClass}</span>`;
	if (doc.settings.implements) result += ` <span class="keyword">implements</span> <span class="class-name">${doc.settings.implements.interfaces.map(int => int.name.base).join(", ")}</span>`;
	return result;
}

function documentFunction(fn, wrapperClass) {
	const names = fn.settings.group?.elements;
	const name = names ? `${names.map(name => documentName(name, fn, wrapperClass)).join(`<span class="aux">/</span>`)}` : documentName(fn.name, fn, wrapperClass);
	const { signatures } = fn;
	const returnType = fn.settings.return?.type ?? "void";
	const parameters = signatures
		.map(params => {
			stats.parameters += params.length;
			if (params.length)
				return params
					.map(param => `<span class="param">${param.name}</span>`)
					.join(", ");

			if (signatures.length > 1)
				return `<span class="param">void</span>`;

			return "";
		}).join(`<span class="aux"> | </span>`);
	const header = `${name}${fn.name.isGetter ? "" : `(${parameters})`}${fn.name.base === "constructor" || fn.name.isSetter ? "" : `<span class="type">${returnType}</span>`}`;
	const parameterDescriptions = signatures
		.map(signature => `
			<div class="header">Parameters</div>
			${
				signature
					.map(param => `
						<div class="param-wrapper" id="${param.searchID}">
							<div class="param-name">
								<span class="param">${param.name.replace(/\.\.\.|\?/g, "")}</span>
								<span class="type">${param.type}</span>
							</div>
							<div class="param desc">
								${wordCount(param.description)}
							</div>
						</div>
					`).join("")
			}
		`).join("");

	return `
		<div class="function-wrapper" id="${fn.searchID}">
			<div class="function-header member">
				${header}
			</div>
			<div class="function desc">
				${wordCount(fn.description)}
			</div>
			${signatures.length ? `
				<div class="function-signature">
					${parameterDescriptions}
				</div>
			` : ""}
		</div>
	`;
}

function documentProperty(prop) {
	stats.properties++;
	const attrs = Object.entries(ATTRIBUTE_DESCRIPTIONS)
		.filter(entry => prop.attributes[entry[0]])
		.map(entry => {
			return `<span class="prop-attr" data-desc="${entry[1]}">${entry[0]}</span>`;
		});
	return `
		<div class="prop-wrapper" id="${prop.searchID}">
			<div class="prop-header member">
				<span class="prop-name">${prop.name}</span>
				<span class="type">${prop.type}</span>
			</div>
			<div class="prop desc">${prop.description}</div>
			<span class="prop-attrs">${attrs.join("")}</span>
		</div>
	`;
}

function document(doc, topLevelIDs, file, aliases) {
	let result;
	if (doc.name.isPage) {
		const name = documentName(doc.name, doc);
		result = `
			<div class="page-wrapper">
				<div class="page-header">
					${name}
				</div>

				<div class="page desc">
					${wordCount(doc.description)}
				</div>

			</div>
		`;
	} else if (doc.name.isClass) {
		const name = documentName(doc.name, doc);
		const classQualifiers = [];
		let keyword = doc.name.isEnum ? "enum" : doc.settings.interface ? "interface" : "class";
		
		const subclass = (doc.subclasses ?? [])
			.map(cls => `<span class="class-name">${cls.name.base}</span>`)
			.join(", ");
		const firstFunction = /^(constructor|init)$/
		const memberFunctions = [...doc.members]
			.sort((a, b) => (b.name.isSetter || b.name.isGetter) - (a.name.isSetter || a.name.isGetter))
			.sort((a, b) => a.name.isStatic - b.name.isStatic)
			.sort((a, b) => firstFunction.test(b.name.base) - firstFunction.test(a.name.base))
			.filter(fn => !fn.settings.hide)
			.map(member => documentFunction(member, doc.name.base))
			.join("");
		const memberProperties = doc.properties
			.map(documentProperty)
			.join("");
		result = `
			<div class="class-wrapper" id="${doc.searchID}">
				<div class="class-header">
					<span class="keyword">${[...classQualifiers, keyword].join(" ")}</span> ${name}
				</div>
				<div class="class desc">
					${wordCount(doc.description)}
				</div>
				${subclass ? `
					<div class="header">${doc.settings.interface ? "Implementers" : "Subclasses"}</div>
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
	} else {
		result = documentFunction(doc);
	}

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
	result = result.replace(/(?<=<span class=\"type\">)(.*?)(?=<\/span>)/g, escapeHTML);

	// replace aliases (remarkably post-processed)
	const aliasAlternation = Object.keys(aliases)
		.sort((a, b) => b.length - a.length)
		.join("|")
	const aliasRegex = new RegExp(`\\b(${aliasAlternation})\\b`, "g");
	result = result.replace(aliasRegex, match => {
		const alias = aliases[match];
		if (typeof alias === "string") return alias;
		return `<span class="alias">
			<span class="alias two">${alias[2]}</span>
			<span class="alias three">${alias[3]}</span>
			<span class="alias general">${match}</span>
		</span>`;
	});

	// add automatic links to other doc pages
	const toRoot = path.relative(path.dirname(file), ".");
	const entries = [...topLevelIDs]
		.sort((a, b) => b[0].name.base.length - a[0].name.base.length);
	for (const [doc, filePath] of entries) {
		if (file === filePath) continue;
		const regex = new RegExp(String.raw`(?<! href="([^"]*?))\b(${doc.name.base.replaceAll(".", "\\.")}(s|es)?)\b(?!([^<]*?)<\/a>)`, "g");
		const link = `<a href=${JSON.stringify(
			path.join(toRoot, filePath)
				.replace(/\\/g, "/") + "#" + doc.searchID
		)}>$2</a>`;
		result = result.replace(regex, link);
	}

	return result;
}

module.exports = { document, stats };