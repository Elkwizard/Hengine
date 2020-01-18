onload = function(){
	let $ = document.querySelector.bind(document);
	let $$ = document.querySelectorAll.bind(document);
	let get = document.getElementById.bind(document);
	function highlightEl(el){
		el.innerHTML = highlight(el.innerHTML);
	}
	for(let el of $$("code")){
		highlightEl(el);
	}
	let i = 1;
	function find(n) {
		try {
			return document.getElementById("[" + n + "]");
		} catch (e) {
			return false;
		}
	}
	let dests = []
	while (find(i)) {
		let el = find(i);
		dests.push(el);
		i++;
	}
	for (let el of $$("sup")) {
		el.onclick = function() {
			let dir = get(this.innerText);
			dir.scrollIntoView();
			for (let el of dests) {
				el.dataset.sel = "0";
			}
			dir.dataset.sel = "1";
		}.bind(el);
	}
}