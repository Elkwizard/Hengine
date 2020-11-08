function tag(str, name, form) {
	let regex = new RegExp(`\\(${name}(?::([\\w\\W]*?)|)\\)([\\w\\W]*?)\\(\\/${name}\\)`, "g");
	return str.replace(regex, form);
}
function load(str) {
	let escapeStartParen = String.fromCharCode(0);
	let escapeEndParen = String.fromCharCode(1);
	str = str.replace(/\\\(/g, escapeStartParen).replace(/\\\)/g, escapeEndParen);
	str = tag(str, "p", `<div class="p">$2</div>`);
	str = tag(str, "p2", `<div class="p">$2</div>`);
	str = tag(str, "1", `<h1 class="title">$2</h1>`);
	str = tag(str, "2", `<h2 class="title">$2</h2>`);
	str = tag(str, "3", `<h3 class="title">$2</h3>`);	
	str = tag(str, "param", `<div class="param value"><span class="name title">$1</span><div class="p description">$2</div></div>`);
	str = tag(str, "prop", `<div class="prop value"><span class="name title">$1</span><div class="p description">$2</div></div>`);
	str = tag(str, "method", `<div class="method value"><span class="name title">$1</span><div class="p description">$2</div></div>`);
	str = str
		.replace(/\#(\w+)\#/g, `<a href="javascript:loadPage('$1')" class="type-reference">$1</a>`)
		.replace(/\*\*([\w\W]*?)\*\*/g, `<span class="code">$1</span>`)
		.replace(/\*([\w\W]*?)\*/g, `<span class="code-snippet">$1</span>`)
		.replace(/\((Function|Class|Property|Note)\)/g, `<img src="./Resources/Images/$1.png" class="icon">`)
		.replace(/\$([\w\W]*?)\$/g, `<span class="type">$1</span>`)
		.replace(/\@([\w\W]*?)\@/g, `<span class="signature">($1)</span>`)
		.replace(/readonly/g, `<span class="readonly">read only</span>`)
		.replace(/async/g, `<span class="async">async</span>`)

	str = str.replace(new RegExp(escapeStartParen, "g"), "(").replace(new RegExp(escapeEndParen, "g"), ")");
	document.getElementById("content").innerHTML = str;
}
function getLink(name) {
	return `<a href="javascript:loadPage('${name}')">${name}</a>`;
}
function loadPage(js) {
	document.querySelector("title").innerText = `Hengine Docs - ${js}`;
	let currentPage = document.getElementById("currentPage");
	if (currentPage) currentPage.outerHTML = "";
	let page = document.createElement("script");
	page.src = `./Resources/Doc Data/${js}.js`;
	page.id = "currentPage";
	document.body.appendChild(page);
}