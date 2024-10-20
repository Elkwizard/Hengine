function indent(str) {
	return str
		.split("\n")
		.map(line => "\t" + line)
		.join("\n");
}

function createTSDoc(lines) {
	return `/**\n${lines.map(line => {
		if (Array.isArray(line))
			line = `@${line[0]} ${line[1].replace(/\W/g, "")} - ${line[2]}`;
		return ` * ${line}`;
	}).join("\n")}\n */\n`;
}

function prefix(documented, prefix) {
	return documented.replace(/(\*\/\s+)/, `$1${prefix}`);
}

function formatType(type, className) {
	type = type.replace(/\b(Number|String|Boolean|BigInt|Symbol|Object|Any)\b/g, match => match.toLowerCase());
	type = type.replace(/\//g, " | ");
	type = type.replace(/\bClass extends (\w+)/g, "Class<$1>");
	type = type.replace(/\bClass\b(?!\<)/g, "Class<any>");
	type = type.replace(/\[\d+?\]/g, "[]");

	if (className) type = type.replace(new RegExp(String.raw`\b${className}\b(?!\.)`), "this");

	// add parameter names
	let index = 0;
	type = type.replace(/\((?![()])|(?<=\((.*?)), (?=(.*?)\))/g, match => `${match}arg${index++}: `);

	return type;
}

function applySubstitutions(name, subs) {
	const names = name.split("/");
	if (!subs) return names;

	const substitute = (name, keys) => {
		if (!keys.length) return name;

		const key = keys[0];
		const values = subs[key];
		const target = `[${key}]`;
		const remaining = keys.slice(1);
		return values.flatMap(value => substitute(
			name.replaceAll(target, value),
			remaining
		));
	};

	return names.flatMap(name => {
		const present = Object.keys(subs)
			.filter(key => name.includes(`[${key}]`));
		return substitute(name, present);
	});
}

function createPropSpecification(className, name, prop, isWindow) {
	const isStatic = prop.category === "static_prop";
	let result = `${name}: ${formatType(prop.type, !isStatic && className)};`;
	if (isStatic)
		result = `static ${result.replace(/.*\./, "")}`;
	else if (isWindow)
		result = `const ${result}`;

	return createTSDoc([prop.description]) + result;
}

function getClassMembers(doc) {
	const subs = doc.settings.name_subs?.substitutions;
	const isWindow = doc.name.base === "Window";

	const members = [
		...doc.properties
			.flatMap(prop => {
				return applySubstitutions(prop.name, subs)
					.map(name => createPropSpecification(doc.name.base, name, prop, isWindow));
			}),
		...doc.members
			.flatMap(fn => createSpecification(fn, doc.name.base))
	];

	if (doc.settings.own_instance) {
		const instance = members
			.filter(member => !member.includes("static ") && !member.includes("constructor"))
			.map(member => prefix(member, "static "));
		members.push(...instance);
	}

	if (doc.settings.implements)
		members.push(...doc.settings.implements.interfaces.flatMap(getClassMembers));

	return members;
}

function createClassSpecification(doc) {
	const documentation = createTSDoc(doc.description.split("\n"));

	let name = doc.name.base;
	if (doc.name.baseClass) name += ` extends ${doc.name.baseClass}`;
	if (doc.settings.implements) name += ` implements ${doc.settings.implements.interfaces.map(int => int.name.base).join(", ")}`;
	
	const members = getClassMembers(doc);
	if (doc.name.base === "Window") return members;

	const isInterface = doc.settings.interface;
	const header = doc.settings.type?.content ?? `${isInterface ? "interface" : "class"} ${name}`;
	const body = indent(members.join("\n"));

	const cls = `${documentation}${header} {\n${body}\n}`;

	if (doc.classes) {
		const int = `${documentation}namespace ${doc.name.base} {\n${indent(
			doc.classes
				.flatMap(createSpecification)
				.join("\n\n")
		)}\n}`;

		return [cls, int];
	}

	return [cls];
}

function createOverloadSpecification(name, parameters, doc, className) {
	className = !doc.name.isStatic && className;

	let returnType = doc.settings.return?.type ?? "void";
	if (doc.name.isAsync) returnType = `Promise<${returnType}>`;

	let paramString = parameters
		.map(param => `${param.name}: ${formatType(param.type, className)}`)
		.join(", ");

	if (name === "init")
		paramString = "obj: SceneObject, " + paramString;

	let result;

	if (doc.settings.type) {
		result = doc.settings.type.content;
	} else {
		result = "";
		if (doc.name.isStatic) result += "static ";
		if (doc.name.isGlobalFunction) result += "function ";
		if (doc.name.isSetter) result += "set ";
		if (doc.name.isGetter) result += "get ";
		
		result += `${name}(${paramString})`;

		if (name !== "constructor" && !doc.name.isSetter)
			result += `: ${formatType(returnType, className)}`;
		result += ";";
	}

	result = createTSDoc([
		...doc.description.split("\n"),
		...parameters.map(param => ["param", param.name, param.description])
	]) + result;

	return result;
}

function createFunctionSpecification(doc, className) {
	const signatures = doc.signatures.length ? doc.signatures : [[]];
	
	const subs = doc.settings.name_subs?.substitutions;

	return applySubstitutions(doc.name.base, subs)
		.flatMap(name => {
			return signatures
				.map(params => createOverloadSpecification(name, params, doc, className));
		});
}

function createEnumSpecification(doc) {
	const documentation = createTSDoc(doc.description.split("\n"));
	const subs = doc.settings.name_subs?.substitutions;
	const members = doc.properties
		.flatMap(member => {
			return applySubstitutions(member.name.replace(/.*\./, ""), subs)
				.map(name => {
					return createTSDoc([member.description]) + name;
				});
		});
	const body = members.join(",\n");
	return [`${documentation}enum ${doc.name.base} {\n${indent(body)}\n}`];
}

function createSpecification(doc, className) {
	if (doc.name.isEnum) return createEnumSpecification(doc);
	if (doc.name.isClass) return createClassSpecification(doc);
	return createFunctionSpecification(doc, className);
}

function deepCopy(object, found = new Map()) {
	if (typeof object !== "object" || object === null)
		return object;
	if (found.has(object)) return found.get(object);

	if (Array.isArray(object)) {
		const result = [];
		found.set(object, result);
		for (const el of object) result.push(deepCopy(el, found));
		return result;
	}

	const result = { };
	found.set(object, result);
	for (const key in object)
		result[key] = deepCopy(object[key], found);
	return result;
}

module.exports = function createTypeSpecification(docs) {
	docs = deepCopy(docs.filter(doc => !doc.name.isPage));
	const nameToDoc = { };
	for (const doc of docs)
		nameToDoc[doc.name.base] = doc;
	for (let i = 0; i < docs.length; i++) {
		const doc = docs[i];
		if (doc.name.base.includes(".")) {
			const pieces = doc.name.base.split(".");
			doc.name.base = pieces[1];
			const parent = nameToDoc[pieces[0]];
			(parent.classes ??= []).push(doc);
			docs.splice(i--, 1);
		}
	}

	const classInterface = `
declare interface Class<T> extends Function {
	new (...args: any[]): T;
}

type RemainingParams<T> = T extends (first: any, ...remaining: infer P) => any ? P : never;
`.trim();
	
	return classInterface + "\n\n" + docs
		.flatMap(createSpecification)
		.map(spec => prefix(spec, "declare "))
		.join("\n\n");
};