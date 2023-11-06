const fs = require("fs");

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
						line = line.replace(/^\s*\* /g, "");
						if (line.startsWith("@")) {
							const inx = line.indexOf(" ");
							const category = line
								.slice(1, inx > -1 ? inx : line.length)
								.trim();
							line = line.slice(category.length + 1).trim();
							return { category, content: line };
						}

						return { category: null, content: line };
					})
			};
		});

	const processName = name => {
		name = name.replace(/\s+/g, " ");
		const isGlobalFunction = /\bfunction\b/.test(name);
		let baseClass = null;
		const baseIndex = name.indexOf(" extends ");
		if (baseIndex > -1) {
			baseClass = name.slice(name.lastIndexOf(" ") + 1);
			name = name.slice(0, baseIndex);
		}
		return {
			raw: name,
			base: name.slice(name.lastIndexOf(" ") + 1),
			baseClass,
			isGlobalFunction,
			isClass: name.startsWith("class "),
			isStatic: name.startsWith("static "),
			isGetter: name.indexOf("get ") > -1,
			isSetter: name.indexOf("set ") > -1
		};
	};
	
	for (const match of matches) {
		if (!match) continue;
		const { name, lines } = match;

		match.name = processName(name);

		for (const line of lines) {
			switch (line.category) {
				case "name":
				case "group": {
					line.elements = line.content.split(",").map(e => processName(e.trim()));
					match.name = line.elements[0];
				}; break;
				case "return": {
					line.type = line.content;
				}; break;
				case "readonly": {
					line.content = "All properties of this class are read-only.";
					line.category = null;
				}; break;
				case "abstract": {
					line.content = "This is an abstract superclass and should not be constructed.";
					line.category = null;
				}; break;
				case "prop":
				case "static_prop":
				case "param": {
					const index = line.content.indexOf("|");
					[line.type, line.name] = line.content.slice(0, index).split(" ");
					line.description = line.content.slice(index + 1).trim();

					if (line.category === "static_prop")
						line.name = `${match.name.base}.${line.name}`;
				}; break;
			}
		}

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
	}

	const topLevels = [];

	for (let i = 0; i < matches.length; i++) {
		const match = matches[i];
		if (!match) continue;
		if (match.name.isClass) {
			const members = [];
			while (matches[++i] && !matches[i].name.isClass)
				members.push(matches[i]);
			i--;
			match.members = members;
		}
		
		topLevels.push(match);
	}

	return topLevels;
}

module.exports = { parse };