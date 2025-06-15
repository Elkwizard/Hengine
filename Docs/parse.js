function parse(content, file) {
	const docRegex = /(?:\/\*\*([\w\W]*?)\*\/)|\n}/g;
	const matches = [...content.matchAll(docRegex)]
		.map(m => {
			if (m[0] === "\n}") return null;
			const startIndex = m.index + m[0].length;
			let name = content.slice(startIndex).trim();
			const startChar = name.startsWith("class ") ? "{" : "(";
			name = name.slice(0, name.indexOf(startChar))
				.trim();
			return {
				source: {
					file,
					line: 1 + content
						.slice(0, startIndex)
						.split("\n").length
				},
				name,
				lines: m[1]
					.trim()
					.split("\n")
					.map(line => {
						line = line.replace(/^\s*\* /g, "").trim();
						if (line.startsWith("@")) {
							const [, category, attributeString, content] = line
								.match(/^@(\w+)(?:<([\w\s,]+)>)?(?: (.*))?$/);

							const attributes = { };
							if (attributeString) {
								const names = attributeString.split(",").map(str => str.trim());
								for (const attr of names)
									attributes[attr] = true;
							}

							return { category, attributes, content: content ?? "" };
						}

						return { category: null, content: line };
					})
			};
		});

	const processName = name => {
		name = name.replace(/\s+/g, " ");
		
		const isGlobalFunction = /\bfunction\b/.test(name);

		let isClass = name.startsWith("class ");
		
		let baseClass = null;
		if (isClass) {
			const baseIndex = name.indexOf(" extends ");
			if (baseIndex > -1) {
				baseClass = name.slice(name.lastIndexOf(" ") + 1);
				name = name.slice(0, baseIndex);
			}
		}

		let base = name.slice(name.lastIndexOf(" ") + 1);

		const isEnum = name.endsWith("= Enum.define");
		if (isEnum) {
			isClass = true;
			base = name.match(/\b(\w+?)(?=\s*=\s*Enum\.define)/g)[0];
		}

		return {
			raw: name, base,
			isEnum, isClass, baseClass,
			isGlobalFunction,
			isGlobal: isClass || isGlobalFunction,
			isAsync: /\basync\b/.test(name),
			isStatic: name.startsWith("static "),
			isGetter: name.includes("get "),
			isSetter: name.includes("set ")
		};
	};

	const resultingMatches = [];
	const aliases = { };
	
	for (const match of matches) {
		if (!match) continue;
		let { name, lines } = match;

		match.name = processName(name);

		let alias = false;

		for (const line of lines) {
			switch (line.category) {
				case "page": {
					match.name = processName("_");
					match.name.base = line.content.trim();
					match.name.isPage = true;
				} break;
				case "name":
				case "group": {
					line.elements = line.content.split(",").map(e => processName(e.trim()));
					match.name = line.elements[0];
				} break;
				case "3d": {
					const [, name, two, three] = line.content.match(/(\w+) = (\w+) -> (\w+)/);
					aliases[name] = { 2: two, 3: three };
					alias = true;
				} break;
				case "alias": {
					const [, name, source] = line.content.match(/(\w+) = (\w+)/);
					aliases[name] = source;
					alias = true;
				} break;
				case "implements": {
					line.interfaces = line.content.split(",").map(e => e.trim());
					if (line.interfaces.includes(match.name.baseClass))
						match.name.baseClass = null;
				} break;
				case "return": {
					line.type = line.content;
				} break;
				case "readonly": {
					line.content = "All properties of this class are read-only.";
					line.category = null;
				} break;
				case "abstract": {
					line.content = "This is an abstract superclass and should not be constructed.";
					line.category = null;
				} break;
				case "name_subs": {
					line.substitutions = Object.fromEntries(
						line.content
							.split(";")
							.map(segment => segment
								.split(":")
								.map(side => side.trim())
							)
							.map(([key, values]) => [
								key,
								values
									.split(",")
									.map(val => val.trim())
							])
					);
				} break;
				case "prop":
				case "param": {
					const index = line.content.indexOf("|");
					line.description = line.content.slice(index + 1).trim();
					const signature = line.content.slice(0, index).trim();
					const spaceIndex = signature.lastIndexOf(" ");
					line.name = signature.slice(spaceIndex + 1);
					line.type = signature.slice(0, spaceIndex);
					line.baseName = line.name.match(/(\.\.\.)?(.*?)\??$/)[2];
				} break;
				case "params": {
					line.names = line.content.split(",").map(name => name.trim());
				} break;
			}
		}

		if (alias) continue;

		// expand @params references
		lines = lines.flatMap(line => {
			if (line.category === "params") {
				const filtered = line.names.map(name => lines.find(p => p.category === "param" && p.baseName === name));
				return filtered;
			}

			return [line];
		});

		const resultLines = [];
		
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			if (line.category === "param") {
				lines.splice(i, 0, { category: "signature" });
				i--;
				continue;
			}

			if (line.category === "signature") {
				line.parameters = [];
				while (lines[++i]?.category === "param")
					line.parameters.push(lines[i]);
				i--;
				resultLines.push(line);
			} else if (line.category === null) {
				while (lines[++i]?.category === null)
					line.content += "\n" + lines[i].content;
				i--;
				resultLines.push(line);
			} else resultLines.push(line);
		}

		match.lines = resultLines;
		match.description = match.lines.find(line => line.category === null)?.content ?? "";
		
		if (match.name.isClass) {
			match.properties = match.lines.filter(line => line.category === "prop");
		} else {
			match.signatures = match.lines
				.filter(line => line.category === "signature")
				.map(line => line.parameters);
		}

		match.settings = { };
		for (const line of match.lines)
			match.settings[line.category] = line;

		resultingMatches.push(match);
	}

	const topLevels = [];

	for (let i = 0; i < resultingMatches.length; i++) {
		const match = resultingMatches[i];
		if (match.name.isClass) {
			const members = [];
			while (resultingMatches[++i] && !resultingMatches[i].name.isGlobal)
				members.push(resultingMatches[i]);
			i--;
			match.members = members;
		}
		
		topLevels.push(match);
	}

	return { topLevels, aliases };
}

function addInheritance(classes) {
	classes = classes.filter(cls => cls.name.isClass);

	// find inheritance
	for (const doc of classes) {

		if (doc.settings.implements) {
			const impl = doc.settings.implements;
			impl.interfaces = classes.filter(cls => impl.interfaces.includes(cls.name.base));
		}
		
		const { baseClass } = doc.name;
		const interfaces = (doc.settings.implements?.interfaces ?? []).map(int => int.name.base);
		
		if (baseClass || interfaces.length) {
			for (const superDoc of classes) {
				const name = superDoc.name.base;
				if (baseClass === name || interfaces.includes(name)) {
					(superDoc.subclasses ??= []).push(doc);
					(doc.superclasses ??= []).push(superDoc);
				}
			}
		}
	}

	function getAllSuperclasses(doc) {
		if (!doc.superclasses) return [];
		return doc.superclasses
			.flatMap(sup => [sup, ...getAllSuperclasses(sup)]);
	}

	// propagate @props declarations
	for (const doc of classes) {
		doc.settings.props ??= { attributes: { } };
		for (let sup of getAllSuperclasses(doc)) {
			const supAttrs = sup.settings.props?.attributes ?? { };
			Object.assign(doc.settings.props.attributes, supAttrs);
		}

		for (const prop of doc.properties) {
			Object.assign(prop.attributes, doc.settings.props.attributes);

			if (prop.attributes.static)
				prop.name = `${doc.name.base}.${prop.name}`;
		}
	}
}

module.exports = { parse, addInheritance };