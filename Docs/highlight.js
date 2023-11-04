const highlight = (source, highlighter, palette, copy = false) => {
	source = source.replaceAll("\r", "");
	const colors = new Array(source.length).fill(null);
	for (const [regex, color, antiregex = null] of highlighter) {
		const local = new Array(source.length).fill(null);

		for (const match of [...source.matchAll(regex)])
			for (let i = 0; i < match[0].length; i++)
				local[match.index + i] = color;
			
		if (antiregex) for (const match of [...source.matchAll(antiregex)])
			for (let i = 0; i < match[0].length; i++)
				local[match.index + i] = null;

		for (let i = 0; i < local.length; i++)
			if (local[i]) colors[i] = local[i];
	}
	let result = "";
	let currentColor = null;

	const HTMLMapping = {
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;",
		"&": "&amp;"
	};
	
	for (let i = 0; i < source.length; i++) {
		const color = colors[i];
		if (color && color !== currentColor) {
			if (currentColor) result += "</span>";
			result += `<span style="color: ${palette[color]}">`;
			currentColor = color;
		}

		const char = source[i];
		result += HTMLMapping[char] ?? char;

		if (currentColor && i === source.length - 1)
			result += "</span>";
	}

	if (copy) {
		const button = `<button onclick="navigator.clipboard.writeText(this.parentNode.innerText.slice(1))">⎘</button>`;
		result = button + result;
	}

	return `<code class="block">${result}</code>`;
};

const COMMENT_MATCH = [
	[/\/\/(.*?)$/gm, "COMMENT"],
	[/\/\*([\w\W]*?)\*\//g, "COMMENT"]
];
const NUMBER_MATCH = [
	[/(-|\b| |^)((\d+(\.\d+)?|(\.\d+))(e[+-]?\d+)?|Infinity|NaN)\b/g, "NUMBER"]
];

const MAIN_MATCH = [
	[/.*/g, "DEFAULT"],
	[/(\W+?)/g, "SYMBOL"],
	[/(\w+?)/g, "IDENTIFIER"]
];

const PROPERTY_MATCH = [
	[/(?<=\.)(\w+?)\b/g, "PROPERTY"]
];

const FUNCTION_MATCH = [
	[/\b(\w+?)(?=\()/g, "FUNCTION"]
];

const WORD_MATCH = (type, ...words) => [
	[new RegExp(String.raw`(\b|\s|^)(${words.join("|")})(\b|\s)`, "g"), type]
];

const STRING_MATCH = [
	[/(["'`])((\\\1|[\w\W])*?)\1/g, "STRING", /(?<=`([^`]*?))\$\{([\w\W]*?)\}(?=([^`]*?)`)/g],
];

const JS_HIGHLIGHTER = [
	...MAIN_MATCH,
	...PROPERTY_MATCH,
	...FUNCTION_MATCH,
	[/\b(class|instanceof|extends)\s+(\w+?)\b/g, "CLASS"],
	[/\b(const|new)\s+(\w+?)\b/g, "CONSTANT"],
	[/\b([A-Z_]+?)\b/g, "CONSTANT"],
	...WORD_MATCH("KEYWORD", "throw", "in", "of", "extends", "switch", "case", "delete", "typeof", "instanceof", "class", "const", "let", "var", "static", "return", "if", "else", "break", "continue", "for", "while", "do", "new", "constructor", "function", "=>", "async"),
	[/\b(get|set)\b(?!\s*?\()/g, "KEYWORD"],
	...NUMBER_MATCH,
	...WORD_MATCH("LANG_VAR", "this", "true", "false", "null", "undefined"),
	...STRING_MATCH,
	...COMMENT_MATCH
];

const GLSL_HIGHLIGHTER = [
	...MAIN_MATCH,
	...PROPERTY_MATCH,
	...FUNCTION_MATCH,
	[/\b(struct)\s+(\w+?)\b/g, "CLASS"],
	[/\b(\w+)\s+(?=(\w+?)\b)/g, "CLASS"],
	[/\b([A-Z_]+?)\b/g, "CONSTANT"],
	...WORD_MATCH("KEYWORD", "#define", "#version", "struct", "([ui]?sampler[23]D)", "bool", "float", "int", "uint", "highp", "lowp", "mediump", "return", "if", "else", "for", "while", "do", "case", "switch", "case", "break", "continue", "uniform", "in", "out", "inout", "(vec[234])", "(mat[234])", "(mat[234]x[234])"),
	...NUMBER_MATCH,
	...WORD_MATCH("LANG_VAR", "true", "false"),
	[/(?<=#define)\s+(\w+?)\b/g, "CONSTANT"],
	...COMMENT_MATCH,
	
];

const DARK_PALETTE = {
	DEFAULT: "#fff",
	SYMBOL: "#f8f",
	IDENTIFIER: "#ddd",
	FUNCTION: "#88d",
	CLASS: "#88d",
	CONSTANT: "#88d",
	PROPERTY: "#aad",
	KEYWORD: "#a5a",
	LANG_VAR: "#d6b",
	NUMBER: "#fd1",
	STRING: "#aea",
	COMMENT: "#444",
	UNIQUE: "#0f0"
};

module.exports = {
	highlight,
	highlighters: {
		js: JS_HIGHLIGHTER,
		glsl: GLSL_HIGHLIGHTER
	},
	palettes: {
		dark: DARK_PALETTE
	}
};