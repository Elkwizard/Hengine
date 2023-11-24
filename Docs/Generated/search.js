function tokenize(text) {
	return text
		.replace(/\W+/g, " ")
		.trim()
		.toLowerCase()
		.split(" ");
}

function getDistance(from, to) {
	if (from === to) return 0;
	const len = Math.max(from.length, to.length);
	let total = 0;
	for (let i = 0; i < len; i++) {
		total += from[i] !== to[i];
	}
	return 1 - (1 - total / len) ** 15;
}

function queryRecord(record, search, tokenFrequency, maxDist) {
	if (!search.length) return null;
	
	const matches = [];

	for (let startIndex = 0; startIndex < search.length; startIndex++) {
		const start = "_" + search[startIndex];
		if (!(start in record.tokenMap)) continue;

		const searchFrequency = search
			.map(token => tokenFrequency[token] ?? 0)
			.reduce((a, b) => a + b, 0) / search.length;
		
		const newMatches = record.tokenMap[start]
			.map(index => {
				index -= startIndex;
				const effStartIndex = -Math.min(index, 0);
				const tokens = record.tokens.slice(
					Math.max(index, 0),
					index + search.length
				);
				let distance = 0;
				for (let i = 0; i < search.length; i++) {
					const tok = tokens[i + effStartIndex];
					if (!tok) {
						distance++;
						continue;
					}
					const freq = 1;//tokenFrequency[tok] / searchFrequency;
					distance += getDistance(search[i], tok) / freq;
					if (distance > maxDist) {
						return null;
					}
				}
				return { distance, index, tokens };
			})
			.filter(match => match !== null);

		matches.push(...newMatches);
	}

	if (!matches.length) return null;

	return matches;
}

function query(search, cache, maxDist = Infinity) {
	search = tokenize(search);
	const results = [];
	for (const record in cache.recordCache) {
		const matches = queryRecord(cache.recordCache[record], search, cache.tokenFrequency, maxDist);
		
		if (matches) {
			const distance = Math.min(...matches.map(match => match.distance));
			results.push({ record, matches, distance });
		}
	}
	return results;
}