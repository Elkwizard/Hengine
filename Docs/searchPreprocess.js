function tokenize(text) {
	const rawTokens = text
		.trim()
		.split(/(?<=\W)(?=\w)/g);

	const tokens = rawTokens
		.map(tok => tok.toLowerCase().replace(/\W/g, ""));
		
	return { rawTokens, tokens };
}

function makeRecord(text, tokenFrequency) {
	const { rawTokens, tokens } = tokenize(text);
	const tokenMap = {};
	for (let i = 0; i < tokens.length; i++) {
		const tok = tokens[i];
		tokenFrequency[tok] ??= 0;
		tokenFrequency[tok]++;
		(tokenMap["_" + tok] ??= []).push(i);
	}

	return { tokens, rawTokens, tokenMap };
}

function makeSearchCache(records) {
	const recordCache = { };
	const tokenFrequency = { };

	for (const record in records)
		recordCache[record] = makeRecord(records[record], tokenFrequency);

	return { recordCache, tokenFrequency };
}

function addSearchData(docs, idToDoc) {
	const records = { };
	const addData = (doc, id, desc, topLevel) => {
		doc.searchID = id;
		records[doc.searchID] = `${id}: ${desc}`;
		idToDoc[id] = topLevel;
	};

	const addDescriptionData = (doc, id, topLevel) => addData(doc, id, doc.description, topLevel);
	
	const addTextData = (doc, id, topLevel) => addData(
		doc, id, doc.description, topLevel
	);

	const addFunctionData = (doc, wrapperClass = null, topLevel = doc) => {
		let id = `${doc.name.base}()`;
		if (doc.name.isGlobalFunction) id = `function ${id}`;
		if (doc.name.isStatic) id = `${wrapperClass}.${id}`;
		else if (wrapperClass) id = `${wrapperClass}.prototype.${id}`;
		if (doc.name.isGetter) id = `get ${id}`;
		if (doc.name.isSetter) id = `set ${id}`;
		addTextData(doc, id, topLevel);

		for (const signature of doc.signatures) {
			for (const param of signature)
				addDescriptionData(param, `${id}:${param.name}`, topLevel);
		}
	};

	for (const doc of docs) {
		if (doc.name.isPage) {
			addTextData(doc, doc.name.base, doc);
		} else if (doc.name.isClass) {
			let id = `${doc.name.isEnum ? "enum" : "class"} ${doc.name.base}`;
			addTextData(doc, id, doc);
			for (const property of doc.properties) {
				let id = property.name;
				if (property.attributes.static) id = `static ${id}`;
				else id = `${doc.name.base}.${id}`;
				addDescriptionData(property, id, doc);
			}

			for (const method of doc.members) {
				addFunctionData(method, doc.name.base, doc);
			}
		} else {
			addFunctionData(doc);
		}
	}
	
	return records;
}

module.exports = { makeSearchCache, addSearchData };