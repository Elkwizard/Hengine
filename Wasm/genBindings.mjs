import fs from "node:fs"
import path from "node:path"
import child_process from "node:child_process"

const [, , modulePath] = process.argv;
const moduleName = path.basename(modulePath);

let content = await new Promise(resolve => {
	const gpp = child_process.spawn("g++", [
		`${modulePath}.cpp`, "-E", "-D __GEN_BINDINGS__"
	]);
	let preprocessed = "";
	gpp.stdout.on("data", chunk => preprocessed += chunk);
	gpp.stdout.on("end", () => resolve(preprocessed));
});

const parseSignature = source => {
	const tokenize = string => string
		.split(/\b|([,()&><*])/g)
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
			while (maybe("::")) name += "::" + take();
			if (!aliases.has(name)) break;
			const aliasTokens = tokenize(aliases.get(name));
			toks.push(...aliasTokens);
		}

		let template = null;
		if (maybe("<")) {
			template = [parseType()];
			while (maybe(","))
				template.push(parseType());
			take();
		}

		let pointers = 0;
		while (maybe("*")) pointers++;
		const ref = maybe("&");

		return { name, template, ref, pointers, isConst };
	};

	let paramIndex = 0;

	const parseParam = () => {
		const type = parseType();
		if (peek() === "," || peek() === ")")
			return { type, name: `_${paramIndex++}` };
		return { type, name: take() };
	};

	const isConst = maybe("_CONST");
	const isImport = maybe("_IMPORT");
	maybe("explicit");
	maybe("virtual");
	const isStatic = maybe("static");

	const type = parseType();
	const isConstructor = toks.at(-1) === "(";
	const isDestructor = type.name === "~";
	const names = [isConstructor ? type.name : take()];

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
		const isAccessor = !isImport &&
			accessName !== name &&
			params?.length === (name.startsWith("get") ? 0 : 1);
		return {
			name, type, params, isImport,
			isConstructor, isDestructor,
			isAccessor, isConst, isStatic,
			accessName
		};
	});
};

// parse API lines
const aliases = new Map();
const classes = new Map();
const baseClasses = new Map();
const templateClasses = new Set();
const GLOBAL = "_global";
classes.set(GLOBAL, []);

const addFile = content => {
	// find API lines
	const CLOSE = "};";
	const lines = content
		.split(/\r?\n/g)
		.filter(line => (line.trim().startsWith("API") && !line.match(/#define|\/\//)) || line === CLOSE);

	let currentClass = classes.get(GLOBAL);

	for (const line of lines) {
		if (line === CLOSE) currentClass = classes.get(GLOBAL);
		else {
			const classData = line.match(/API(_TEMPLATE)? (class|enum) (\w+)(?: : public (\w+))?/);
			if (classData) {
				const [, template, type, name, base] = classData;
				if (type === "class") {
					currentClass = [];
					currentClass.name = name;
					classes.set(name, currentClass);
					baseClasses.set(name, base);
					if (template) templateClasses.add(name);
				} // enums need no special handling
			} else {
				const aliasData = line.match(/API using (\w+) = (.*?);/);
				if (aliasData) {
					const [, name, value] = aliasData;
					aliases.set(name, value);
				} else if (line.startsWith("API_IMPORT")) {
					classes.get(GLOBAL).push(line);
				} else {
					currentClass.push(line);
				}
			}
		}
	}
};

addFile(content);

// type helpers
const isVoid = type => type.name === "void" && !type.pointers;

const Type = Object.fromEntries(["PRIMITIVE", "ARRAY", "OBJECT"].map(key => [key, Symbol(key)]));

const typeClass = type => {
	if (type.name === "std::vector")
		return Type.ARRAY;

	if (!type.template && !classes.has(typeName(type)))
		return Type.PRIMITIVE;

	return Type.OBJECT;
};

const exactType = type => {
	let result = typeName(type);
	if (type.isConst) result = `const ${result}`;
	result += "*".repeat(type.pointers);
	if (type.ref) result += type.ref;
	return result;
};

const typeName = type => {
	let result = type.name;
	if (type.template) result += `<${type.template.map(exactType).join(", ")}>`;
	return result;
};

const pointerName = type => {
	let result = typeName(type);
	if (type.isConst) result = `const ${result}`;
	return `${result}*`;
};

const arrayName = type => {
	return arrayTypes.get(exactType(type.template[0]));
};

const cleanName = name => name.replace(/[<>]/g, "_");

const indent = string => string
	.split("\n")
	.map(line => "\t" + line)
	.join("\n");

const allTypes = [];
{ // find all types
	const seen = new Set();
	const addType = type => {
		const name = exactType(type);
		if (seen.has(name)) return;
		seen.add(name);
		allTypes.push(type);
		for (const arg of type.template ?? [])
			addType(arg);
	};

	for (const [, fields] of classes) {
		for (const field of fields.flatMap(parseSignature)) {
			addType(field.type);
			for (const { type } of field.params ?? [])
				addType(type);
		}
	}
}

{ // find template instances
	const templates = new Map();
	
	const templateTypes = allTypes.filter(type => typeClass(type) === Type.OBJECT && type.template);
	for (const type of templateTypes) {
		const { name } = type;
		if (!templates.has(name)) templates.set(name, new Set());
		templates.get(name).add(typeName(type));
	}

	// instantiate templates
	for (const [name, fields] of [...classes]) {
		if (templateClasses.has(name))
			classes.delete(name);

		if (templates.has(name)) {
			for (const key of templates.get(name) ?? [])
				classes.set(key, fields);
		}
	}
}

const recipeInstances = [];
const arrayTypes = new Map();

{ // instantiate vector templates
	const arrayTemplate = fs.readFileSync("Wasm/Array.cpp.txt", "utf-8");

	for (const type of allTypes.filter(type => type.name === "std::vector")) {
		const elementType = type.template[0];
		const elementName = exactType(elementType);
		if (arrayTypes.has(elementName)) continue;
		const className = `Array_${cleanName(typeName(elementType))}_${elementType.pointers}`;
		arrayTypes.set(elementName, className);

		const cls = typeClass(elementType);
		const getType = cls === Type.PRIMITIVE ? elementName : `${exactType(elementType)}&`;

		const instance = arrayTemplate
			.replaceAll("@name", className)
			.replaceAll("@element", elementName)
			.replaceAll("@getType", getType)
			.replaceAll("@setType", getType);

		addFile(instance);
		recipeInstances.push(instance);
	}
}

// compute inheritance depth
const descendants = new Map();
for (const [name] of classes) {
	let current = name;
	while (current) {
		let base = baseClasses.get(current);
		descendants.set(current, (descendants.get(current) ?? 0) + 1);
		current = base;
	}
}

let nextId = 0;

const generateBindings = (clsName, fields) => {
	for (const field of fields) {
		field.id = `_${cleanName(clsName)}_${field.name}${nextId++}`;
		field.isStatic ||= field.isConstructor;
	}

	const classQualify = (field, thisArg, result) => {
		if (field.isConstructor) result = `new ${clsName}`;
		else if (field.isStatic) result = `${clsName}::${result}`;
		else if (clsName !== GLOBAL) result = `${thisArg}->${result}`;
		return result;
	};

	// properties
	const properties = fields
		.filter(field => !field.params)
		.flatMap(prop => {
			const shared = {
				isAccessor: true,
				accessName: prop.name,
				isStatic: prop.isStatic
			};
			const getType = { ...prop.type };
			const setType = { ...prop.type };
			if (typeClass(prop.type) != Type.PRIMITIVE) {
				getType.ref = "&";
				setType.ref = "&";
				setType.isConst = true;
			}

			const getter = {
				...shared,
				id: `_get${prop.id}`,
				name: `get${prop.name}`,
				type: getType,
				params: [],
				makeCall: thisArg => classQualify(prop, thisArg, prop.name)
			};

			const setter = {
				...shared,
				id: `_set${prop.id}`,
				name: `set${prop.name}`,
				type: { name: "void" },
				params: [{
					type: setType,
					name: "_newValue"
				}],
				makeCall: (thisArg, newValue) => classQualify(prop, thisArg, `${prop.name} = ${newValue}`)
			};
			return prop.isConst ? [getter] : [getter, setter];
		});

	// methods
	const methods = fields
		.filter(field => field.params)
		.flatMap(method => {
			method.makeCall = (thisArg, ...args) => `${classQualify(method, thisArg, method.name)}(${args.join(", ")})`;
			if (method.isConstructor)
				method.type = {
					name: clsName,
					pointers: 1
				};

			const results = [method];

			
			if (method.isConstructor || method.isDestructor) {
				const destructor = {
					id: `_delete${method.id}`,
					name: "delete",
					type: { name: "void" },
					params: [],
					makeCall: thisArg => `delete ${thisArg}`
				};
				if (method.isDestructor) {
					results[0] = destructor;
				} else {
					results.push(destructor);
				}
			}

			return results;
		});

	const result = [...properties, ...methods]
		.map(field => {
			if (field.isImport)
				[field.id, field.name] = [field.name, field.id];

			return field;
		});

	const constProps = fields.filter(field => !field.params && field.isConst && typeClass(field.type) === Type.OBJECT);

	return { name: clsName, methods: result, constProps };
};

const generateJS = bindings => {
	const imports = [];

	const toC = (type, value) => {
		switch (typeClass(type)) {
			case Type.PRIMITIVE: return value;
			case Type.ARRAY:
			case Type.OBJECT: return `${value}.pointer`;
		}
	};

	const fromC = (type, value) => {
		switch (typeClass(type)) {
			case Type.PRIMITIVE: {
				if (type.name === "bool")
					return `!!${value}`;
				return value;
			}
			case Type.ARRAY:
				return `cast(module.${arrayName(type)}, ${value})`;
			case Type.OBJECT:
				return `cast(module.${cleanName(typeName(type))}, ${value})`;
		}
	};

	const source = bindings
		.sort((a, b) => descendants.get(b.name) - descendants.get(a.name))
		.map(({ name: clsName, methods, constProps }) => {
			const global = clsName === GLOBAL;

			const classBody = methods
				.map(method => {
					const [toEdge, fromEdge] = method.isImport ? [fromC, toC] : [toC, fromC];

					let name = "";
					if (method.isConstructor) {
						name = "static create";
					} else {
						if (method.isStatic) name = "static ";
						if (method.isAccessor) {
							name = `${method.params.length ? "set" : "get"} ${method.accessName}`;
						} else {
							name += method.name;
						}
					}

					const params = method.params.map(param => param.name);
					const args = method.params.map(param => toEdge(param.type, param.name));

					if (!method.isStatic && !global)
						args.unshift("this.pointer");

					// enclosed
					const paramList = `(${params.join(", ")})`;
					const argList = `(${args.join(", ")})`;

					if (method.isImport) {
						imports.push(method.name);
						const body = `imports.${method.name} = ${paramList} => ${fromEdge(method.type, `_fn${argList}`)};`;
						return `Object.defineProperty(module, "${method.id}", {\n\tset(_fn) {\n\t\t${body}\n\t}\n});`
					}

					let body = `exports.${method.id}${argList}`;
					if (!method.isConstructor) body = fromEdge(method.type, body);
					if (!isVoid(method.type)) body = `return ${body}`;
					body += ";";

					const fn = `${name}${paramList} { ${body} }`;
					if (global) return `module.${name} = function ${fn}`;
					return fn;
				})
				.join("\n");

			if (global) return classBody;

			const constPropsDecl = `static CONST_PROPERTIES = ${JSON.stringify(constProps.map(prop => prop.name))};`;

			let baseClassName = "Binding";
			if (baseClasses.get(clsName))
				baseClassName = `module.${baseClasses.get(clsName)}`;
			
			const header = `module.${cleanName(clsName)} = class ${cleanName(clsName)} extends ${baseClassName}`;

			return `${header} {\n${indent(`${constPropsDecl}\n${classBody}`)}\n};`;
		})
		.join("\n\n");

	const module = name => `HengineWASMResource.${name}[${JSON.stringify(moduleName)}]`;
	return [
		`${module("imports")} = ${JSON.stringify(imports)};`,
		`${module("bindings")} = (module, imports, exports) => {\n${indent([
			"const { Binding } = HengineWASMResource;",
			"const { cast } = Binding;",
			source,
		].join("\n\n"))
		}\n};`
	].join("\n");
};

const generateCPP = bindings => {
	const cType = type => {
		switch (typeClass(type)) {
			case Type.PRIMITIVE: return typeName(type);
			case Type.ARRAY: return `${arrayName(type)}*`;
			case Type.OBJECT: return pointerName(type);
		}
	};

	const toC = (type, value) => {
		switch (typeClass(type)) {
			case Type.PRIMITIVE: return value;
			case Type.ARRAY: {
				return `new ${arrayName(type)}(${value})`;
			}
			case Type.OBJECT: {
				if (!type.ref && !type.pointers) {
					value = "*".repeat(type.pointers) + value;
					return `new ${typeName(type)}(${value})`;
				}

				if (!type.pointers)
					return `&${value}`;

				return "*".repeat(type.pointers - 1) + value;
			}
		}
	};

	const fromC = (type, value) => {
		switch (typeClass(type)) {
			case Type.PRIMITIVE: return value;
			case Type.ARRAY: return `(${typeName(type)})(*${value})`;
			case Type.OBJECT: {
				if (!type.pointers) return `*${value}`;
				return value;
			}
		}
	};

	const source = bindings
		.flatMap(({ name: clsName, methods }) => {
			return methods
				.map(method => {
					const [edgeType, toEdge, fromEdge] = method.isImport ? [exactType, fromC, toC] : [cType, toC, fromC];

					const params = method.params.map(param => `${edgeType(param.type)} ${param.name}`);
					if (!method.isStatic && clsName !== GLOBAL) params.unshift(`${clsName}* _this`);

					const returnType = edgeType(method.type);
					let body = method.makeCall("_this", ...method.params.map(param => fromEdge(param.type, param.name)));
					body = toEdge(method.type, body);
					if (!isVoid(method.type)) body = `return ${body}`;
					body += ";";

					let result = `EMSCRIPTEN_KEEPALIVE ${returnType} ${method.id}(${params.join(", ")}) { ${body} }`;
					if (method.isImport) {
						const params = method.params.map(param => cType(param.type));
						result = `${cType(method.type)} ${method.name}(${params.join(", ")});\n${result}`;
					}
					return result;
				});
		})
		.join("\n");

	return [
		`#include "../${moduleName}.cpp"`,
		...recipeInstances,
		"extern \"C\" {",
		indent(source),
		"}"
	].join("\n");
};

// compute & write output
const bindings = [...classes]
	.flatMap(([name, fields]) => {
		const parsed = fields.flatMap(parseSignature);
		return [generateBindings(name, parsed)];
	});

process.chdir(modulePath);
fs.writeFileSync("bindings.js", generateJS(bindings), "utf-8");
fs.writeFileSync("bindings.cpp", generateCPP(bindings), "utf-8");