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

function formatType(type) {
	type = type.replace(/\b(Number|String|Boolean|BigInt|Symbol|Object|Any)\b/g, match => match.toLowerCase());
	type = type.replace(/\//g, " | ");
	type = type.replace(/\bClass extends (\w+?)\b/g, "Class<$1>");
	type = type.replace(/\bClass\b(?!\<)/g, "Class<any>");

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
			.filter(key => name.indexOf(`[${key}]`) > -1);
		return substitute(name, present);
	});
}

function createPropSpecification(name, prop, isWindow) {
	let result = `${name}: ${formatType(prop.type)};`;
	if (prop.category === "static_prop")
		result = `static ${result.replace(/\b\w+./, "")}`;
	else if (isWindow)
		result = `const ${result}`;

	return createTSDoc([prop.description]) + result;
}

function createClassSpecification(doc) {
	const documentation = createTSDoc(doc.description.split("\n"));

	let name = doc.name.base;
	if (doc.name.baseClass) name += ` extends ${doc.name.baseClass}`;
	
	const subs = doc.settings.name_subs?.substitutions;
	
	const isInterface = doc.settings.interface;

	const isWindow = isInterface && doc.name.base === "Window";

	const members = [
		...doc.properties
			.flatMap(prop => {
				return applySubstitutions(prop.name, subs)
					.map(name => createPropSpecification(name, prop, isWindow));
			}),
		...doc.members
			.flatMap(createSpecification)
	];

	if (doc.settings.own_instance) {
		const instance = members
			.filter(member => member.indexOf("static ") === -1 && member.indexOf("constructor") === -1)
			.map(member => prefix(member, "static "));
		members.push(...instance);
	}

	if (isWindow) return members;

	const cls = `${documentation}${isInterface ? "interface" : "class"} ${name} {\n${
		indent(members.join("\n"))
	}\n}`;

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

function createOverloadSpecification(name, parameters, doc) {
	let returnType = doc.settings.return?.type ?? "void";
	if (doc.name.isAsync) returnType = `Promise<${returnType}>`;

	const paramString = parameters
		.map(param => `${param.name}: ${formatType(param.type)}`)
		.join(", ");

	let result = "";

	if (doc.name.isStatic) result += "static ";
	if (doc.name.isGlobalFunction) result += "function ";
	if (doc.name.isSetter) result += "set ";
	if (doc.name.isGetter) result += "get ";
	
	result += `${name}(${paramString})`;

	if (name !== "constructor" && !doc.name.isSetter)
		result += `: ${formatType(returnType)}`;
	result += ";";

	result = createTSDoc([
		...doc.description.split("\n"),
		...parameters.map(param => ["param", param.name, param.description])
	]) + result;

	return result;
}

function createFunctionSpecification(doc) {
	const signatures = doc.signatures.length ? doc.signatures : [[]];
	
	const subs = doc.settings.name_subs?.substitutions;

	return applySubstitutions(doc.name.base, subs)
		.flatMap(name => {
			return signatures
				.map(params => createOverloadSpecification(name, params, doc));
		});
}

function createEnumSpecification(doc) {
	return [`enum ${doc.name.base} { }`];
}

function createSpecification(doc) {
	if (doc.name.isClass) return createClassSpecification(doc);
	if (doc.name.isEnum) return createEnumSpecification(doc);
	return createFunctionSpecification(doc);
}

function deepCopy(object) {
	if (typeof object !== "object" || object === null)
		return object;
	if (Array.isArray(object))
		return object.map(deepCopy);
	return Object.fromEntries(
		Object.entries(object)
			.map(([key, value]) => [key, deepCopy(value)])
	);
}

module.exports = function createTypeSpecification(docs) {
	docs = deepCopy(docs.filter(doc => !doc.name.isPage));
	const nameToDoc = { };
	for (const doc of docs)
		nameToDoc[doc.name.base] = doc;
	for (let i = 0; i < docs.length; i++) {
		const doc = docs[i];
		if (doc.name.base.indexOf(".") > -1) {
			const pieces = doc.name.base.split(".");
			doc.name.base = pieces[1];
			const parent = nameToDoc[pieces[0]];
			(parent.classes ??= []).push(doc);
			docs.splice(i--, 1);
		}
	}

	const classInterface = "declare interface Class<T> extends Function {\n\tnew (...args: any[]): T;\n}\n\n";
	
	return classInterface + docs
		.flatMap(createSpecification)
		.map(spec => prefix(spec, "declare "))
		.join("\n\n");
};