const fs = require("fs");
const path = require("path");

const [,, modulePath] = process.argv;
const moduleName = path.basename(modulePath);

// walk #include tree
const getFiles = (file, found = new Set()) => {
	if (found.has(file)) return [];
	found.add(file);

	const dir = path.dirname(file);
	const files = fs.readFileSync(file, "utf-8")
		.split(/\r?\n/g)
		.map(line => line.match(/^#include (".*?")/))
		.filter(Boolean)
		.map(line => path.join(dir, JSON.parse(line[1])))
		.flatMap(name => getFiles(name, found));
	files.push(file);
	return files;
};

const files = getFiles(modulePath + ".cpp");
files.push("Wasm/slab.hpp");

// find API lines
const CLOSE = "};";
const lines = files
	.flatMap(name => {
		const content = fs.readFileSync(name, "utf-8");
		const lines = content
			.split(/\r?\n/g)
			.filter(line => (line.includes("API") && !line.match(/#define|\/\//)) || line === CLOSE);
		return lines;
	});

const parseSignature = source => {
	const tokenize = string => string
		.split(/\b|([,()&><])/g)
		.filter(tok => tok && tok.match(/\S/))
		.map(tok => tok.trim())
		.reverse()

	const toks = tokenize(
		source
			.replace("API", "")
			.replace(/(= 0;|\{( \})?|;)$/, "")
			.trim()
	);

	const peek = () => toks.at(-1);
	const take = () => toks.pop();
	const maybe = (...opts) => {
		if (!opts.includes(peek()))
			return false;
		return take();
	};

	const parseType = () => {
		const isConst = maybe("const");

		let name;
		while (true) {
			name = (maybe("unsigned") ? "unsigned " : "") + take();
			name += maybe("::") ? "::" + take() : "";
			if (!aliases.has(name)) break;
			const aliasTokens = tokenize(aliases.get(name));
			toks.push(...aliasTokens);
		}

		let element = null;
		if (maybe("<")) {
			element = parseType();
			take();
		}

		let ref = "";
		while (true) {
			const piece = maybe("&", "*");
			if (!piece) break;
			ref += piece;
		}

		return { name, element, ref, isConst };
	};

	const parseParam = () => {
		const type = parseType();
		if (peek() === ",") return { type };
		return { type, name: take() };
	};

	const isConst = maybe("_CONST");
	const isImport = maybe("_IMPORT");
	maybe("explicit");
	maybe("virtual");
	const isStatic = maybe("static");

	const type = parseType();
	const isConstructor = toks.at(-1) === "(";
	const names = [isConstructor ? type.name : take()];
	if (isConstructor) type.ref = "*";

	while (maybe(","))
		names.push(take());

	let params = null;
	if (maybe("(")) {
		if (maybe(")")) params = [];
		else {
			params = [parseParam()];
			while (maybe(","))
				params.push(parseParam());
		}
	}

	return names.map(name => {
		let accessName = name
			.replace(/^(get|set)(.)/, (...groups) => groups[2].toLowerCase());
		const isAccessor =	!isImport &&
							accessName !== name &&
							params?.length === (name.startsWith("get") ? 0 : 1);
		return {
			name, type, params, isImport,
			isConstructor, isAccessor,
			isConst, isStatic, accessName
		};
	});
};

// parse API lines
const aliases = new Map();
const classes = new Map();
const baseClasses = new Map();
const GLOBAL = "_global";
classes.set(GLOBAL, []);

let currentClass = classes.get(GLOBAL);

for (const line of lines) {
	if (line === CLOSE) currentClass = classes.get(GLOBAL);
	else {
		const classData = line.match(/API (class|enum) (\w+)(?: : public (\w+))?/);
		if (classData) {
			const [, type, name, base] = classData;
			if (type === "class") {
				currentClass = [];
				currentClass.base = base;
				classes.set(name, currentClass);
				baseClasses.set(name, base);
			} else aliases.set(name, "int");
		} else {
			const aliasData = line.match(/API using (\w+) = (.*?);/);
			if (aliasData) {
				const [, name, value] = aliasData;
				aliases.set(name, value);
			} else if (line.includes("API_IMPORT")) {
				classes.get(GLOBAL).push(line);
			} else {
				currentClass.push(line);
			}
		}
	}
}

for (const [name, fields] of classes)
	classes.set(name, fields.flatMap(parseSignature));

// compute inheritance deph
const descendants = new Map();
for (const [name] of classes) {
	let current = name;
	while (current) {
		let base = baseClasses.get(current);
		descendants.set(current, (descendants.get(current) ?? 0) + 1);
		current = base;
	}
}

// type helpers
const isArray = type => type.element && type.ref !== "*";
const isObject = type => classes.has(type.name) && type.ref !== "*";
const isVoid = type => type.name === "void" && !type.ref;

const exactType = type => {
	let result = type.name;
	if (type.isConst) result = "const " + result;
	if (type.element) result += `<${exactType(type.element)}>`;
	result += type.ref;
	return result;
};

const cType = type => {
	if (isArray(type))
		return "_Slab*";
	
	let result = type.name;
	if (classes.has(type.name) || type.ref === "*")
		result += "*";
	if (type.isConst)
		result = "const " + result;
	return result;
};

const indent = string => string
	.split("\n")
	.map(line => "\t" + line)
	.join("\n");

let nextId = 0;

const generateBindings = (clsName, fields) => {
	const allAccessors = fields
		.filter(field => !field.params || field.isAccessor)
		.flatMap(field => {
			if (!field.params) {
				const getter = {
					type: field.type,
					get: field.name,
					name: field.name
				};
				const setter = {
					type: field.type,
					name: field.name,
					set: v => `${field.name} = ${v}`
				};
				return field.isConst ? [getter] : [getter, setter];
			}

			if (field.name.startsWith("get"))
				return [{
					type: field.type,
					name: field.accessName,
					get: `${field.name}()`,
					accessor: true
				}];
			
			return [{
				type: field.params[0].type,
				name: field.accessName,
				set: v => `${field.name}(${v})`,
				accessor: true
			}];
		});

	const selectAccessor = (opts, type) => {
		opts = opts.filter(acc => type in acc);
		if (!opts.length) return null;
		if (opts.length === 1) return opts[0];
		return opts[0].accessor ? opts[0] : opts[1];
	};

	const accessors = [...new Set(allAccessors.map(acc => acc.name))]
		.flatMap(name => {
			const accs = allAccessors.filter(acc => acc.name === name);
			const getter = selectAccessor(accs, "get");
			const setter = selectAccessor(accs, "set");
			const results = [];
			if (getter) {
				results.push({
					name: `get ${name}`,
					params: [],
					type: getter.type,
					template: () => getter.get
				});
			}
			if (setter) {
				results.push({
					name: `set ${name}`,
					params: [setter.type],
					type: { name: "void" },
					template: v => setter.set(v)
				});
			}
			return results;
		});
	
	if (clsName !== GLOBAL) accessors.push({
		name: "get size",
		params: [],
		type: { name: "int" },
		isStatic: true,
		custom: true,
		template: () => `sizeof(${clsName})`
	});

	const methods = fields
		.filter(field => field.params && !field.isAccessor)
		.flatMap(field => {
			const params = field.params.map(param => param.type);
			if (field.isConstructor) {
				return [{
					name: "create",
					params,
					type: field.type,
					isStatic: true,
					isNew: true,
					custom: true,
					template: (...args) => `new ${field.name}(${args.join(", ")})`
				}, {
					name: "delete",
					params: [],
					type: { name: "void" },
					isDelete: true,
					template: () => "delete _0"
				}]
			}

			return [{
				name: field.name,
				params,
				type: field.type,
				isStatic: field.isStatic || clsName === GLOBAL,
				isImport: field.isImport,
				template: (...args) => `${field.name}(${args.join(", ")})`
			}];
		});

	const bindings = accessors.concat(methods)
		.map(binding => {
			binding.id = `_${binding.name.replaceAll(" ", "_")}${nextId++}`;
			return binding;
		});

	return { name: clsName, fields: bindings };
};

const generateJS = bindings => {
	const castObj = (expr, type) => {
		let cast = null;
		if (isObject(type)) cast = type.name;
		else if (isArray(type)) cast = "_Slab";
		expr = cast ? `cast(module.${cast}, ${expr})` : expr;
		if (isArray(type) && classes.has(type.element.name))
			expr = `new module.Array(module.${type.element.name}, ${expr}, ${type.element.ref === "*"})`;
		else if (type.name === "bool" && type.ref !== "*")
			expr = "!!" + expr;
		return expr;
	};

	const castC = (expr, type) => {
		if (isObject(type) || isArray(type))
			expr += ".pointer";
		else if (type.name === "bool" && type.ref !== "*")
			expr = "!!" + expr;
		return expr;
	};

	const imports = [];

	const results = bindings
		.sort((a, b) => descendants.get(b.name) - descendants.get(a.name))
		.map(({ name, fields }) => {
			const global = name === GLOBAL;
			const body = fields
				.map(binding => {
					let cast = binding.isImport ? castObj : castC; 
					const params = binding.params.map((_, i) => `_${i}`);
					const paramValues = params.map((param, i) => cast(param, binding.params[i]));
					
					if (binding.isImport) {
						imports.push(binding.id);
						const body = `imports.${binding.id} = (${params.join(", ")}) => ${
							castC(`fn(${paramValues.join(", ")})`, binding.type)
						}`;
						return `Object.defineProperty(module, "${binding.name}", {\n\tset: fn => {\n\t\t${body}\n\t}\n});`;
					}

					if (!binding.isStatic) paramValues.unshift("this.pointer");
					const expr = castObj(
						`exports.${binding.id}(${paramValues.join(", ")})`,
						binding.type
					);
					let result = `${binding.name}(${params.join(", ")}) { return ${expr}; }`;
					if (binding.isStatic && !global) result = "static " + result;
					if (global) result = `module.${binding.name} = function ${result};`;
					return result;
				})
				.join("\n");

			if (global) return body;

			const base = baseClasses.get(name) ? `module.${baseClasses.get(name)}` : "Binding";
			return `module.${name} = class ${name} extends ${base} {\n${indent(body)}\n};`;
		});
	const source = [
		"const { Binding } = HengineWASMResource;",
		"const { cast } = Binding;",
		...results
	].join("\n\n");

	const module = name => `HengineWASMResource.${name}[${JSON.stringify(moduleName)}]`;
	return [
		`${module("imports")} = ${JSON.stringify(imports)};`,
		`${module("bindings")} = (module, imports, exports) => {\n${
			indent(source)
		}\n};`
	].join("\n");
};

const generateCPP = bindings => {
	const castObj = (expr, type) => {
		if (isArray(type) || isObject(type)) expr = `*${expr}`;
		if (isArray(type)) expr = `(${exactType(type)})${expr}`;
		return expr;
	};

	const castC = (expr, type) => {
		if (isObject(type)) expr = `&${expr}`;
		if (isArray(type)) expr = `new _Slab(${expr})`; 
		return expr;
	};

	const functions = bindings
		.flatMap(({ name, fields }) => {
			return fields.map(binding => {
				const inClass = name !== GLOBAL;
				const params = [...binding.params];
				const selfParam = !binding.isStatic;
				if (selfParam) params.unshift({
					name: name,
					ref: "*"
				});
				
				const paramExprs = binding.params.map((type, i) => {
					return castObj(`_${i + (selfParam ? 1 : 0)}`, type);
				});
				let body = binding.template(...paramExprs);
				if (!binding.isStatic && !binding.isDelete)
					body = `_0->${body}`;
				if (binding.isStatic && inClass && !binding.custom)
					body = `${name}::${body}`;
				body = castC(body, binding.type);
				if (!isVoid(binding.type))
					body = `return ${body}`;
				body = ` { ${body}; }`;
	
				if (binding.isImport) {
					let implBody = `${binding.id}(${
						binding.params
							.map((type, i) => castC(`_${i}`, type))
							.join(", ")
					})`;
					implBody = castC(implBody, binding.type);
					if (!isVoid(binding.type)) implBody = "return " + implBody;
					body = `;\n${exactType(binding.type)} ${binding.name}(${
						binding.params.map((type, i) => `${exactType(type)} _${i}`).join(", ")
					}) { ${implBody}; }`;
				}
	
				return `EMSCRIPTEN_KEEPALIVE ${cType(binding.type)} ${binding.id}(${
					params.map((type, i) => `${cType(type)} _${i}`).join(", ")
				})${body}`;
			});
		})
		.join("\n");

	return [
		`#include "../${moduleName}.cpp"`,
		`#include "${
			path.relative(modulePath, "Wasm/slab.hpp")
		}"`,
		"extern \"C\" {",
		indent(functions),
		"}"
	].join("\n");
};

// compute & write output
const bindings = [...classes]
	.flatMap(([name, fields]) => generateBindings(name, fields));

process.chdir(modulePath);
fs.writeFileSync("bindings.js", generateJS(bindings), "utf-8");
fs.writeFileSync("bindings.cpp", generateCPP(bindings), "utf-8");