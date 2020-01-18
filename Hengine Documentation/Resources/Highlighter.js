function toTokens (s) {
	let keywords = "let,for,while,of,in,if,this,class,var,const,new,return,function,try,catch,else,script,elementscript,do,finally,set,get,extends,static,switch,case,typeof,instanceof".split(",");
	let engine = "Game,Scene,Renderer,Colors,g,s,c,cl,Vertex,Vector2,Vector1,Vector3,Vector4,Artist,Engine,Rect,Triangle,PLAYER_MOVEMENT,WALLS,Time,Controls,Script,ElementScript,K,M,P,TEXT_BOX,BUTTON,clamp,Light,FunctionLibrary,Color,Circle,ColorLibrary".split(",");
	class Token {
		constructor(x, y){
			this.value = x;
			this.type = y;
			this.isKeyword = keywords.includes(this.value);
			this.isEngine = engine.includes(this.value);
			this.isNumber = parseFloat(this.value) == this.value;
		}
		toString(){
			return this.value;
		}
	}
	let tokens = [];
	let token = "";
	let stringType = ``;
	for (let i = 0; i < s.length; i++) {
		let char = s[i];
		token += char;
		if (/\//.test(char) && /\//.test(s[i + 1])) {
			while (s[i] !== "\n") {
				if(s[i + 1]) {
					i++;
					char = s[i];
					token += char;
				} else {
					token += char;
					break;
				}
			}
			i--;
			token = token.substring(0, token.length - 1);
			tokens.push(new Token(token, "COMMENT"));
			token = "";

		} else if (/\//.test(char) && /\*/.test(s[i + 1])) {
			while(s[i] + s[i + 1] !== "*/" && s[i + 1]) {
				i++;
				char = s[i];
				token += char;
			}
			token = token.substring(0, token.length - 1);
			tokens.push(new Token(token, "COMMENT"));
			token = "";
		} else if (!stringType && /'|"|`/.test(char)) {
			stringType = char;
			if (s[i + 1]){
				do {
					i++;
					char = s[i];
					token += char;
				} while (s[i] !== stringType && s[i + 1]);
				stringType = ``;
				tokens.push(new Token(token, "STRING"));
			}
			token = "";

		} else if (token.search(/\w/g) === -1) {
			if(token.search(/\s/) > -1) {
				if(tokens.length === 0 || tokens[tokens.length - 1].type !== "BREAK"){
					tokens.push(new Token(token, "BREAK"));
				} else {
					tokens[tokens.length - 1].value += token;
				}
			} else {
				if(tokens.length === 0 || tokens[tokens.length - 1].type !== "BREAK"){
					tokens.push(new Token("", "BREAK"));
				}
				tokens.push(new Token(token, "SYMBOL"));
				tokens.push(new Token("", "BREAK"));
			}
			token = "";
		} else if ((tokens.length === 0 || (tokens[tokens.length - 1].type.search(/BREAK|SYMBOL/g) > -1)) && (i === s.length - 1 || s[i + 1].search(/\W/g) > -1) && token.search(/\W/g) === -1) {
			let n = new Token(token, "WORD");
			if(n.isNumber) n.type = "NUMBER";
			tokens.push(n);
			token = "";
		}
	}
	return tokens;
}
function highlightHTML(str) {
	let result =  "<span class=\"word\">" + str.replace(/"(.*?)"/g, "<span class=\"string\">&quot;$1&quot;</span>")
		.replace(/&lt;(.*?)(?:(?:( (?:.*?)))&gt;|&gt;)/g, "<span class=\"keyword\">&lt;$1</span>$2<span class=\"keyword\">&gt;</span>")
		.replace(/&gt;(.*?)&lt;/g, "&gt;<span class=\"symbol\">$1</span>&lt;")
		.replace(/\n/g, "<br>")
	return result + "</span>";
}
function highlight (str) {
	try {
		let result = "";
		let tokens = toTokens(str);
		let stringType = '';
		let isComment = false;
		let isMultilineComment = false;
		let depth = 0;
		let vars = [];
		function varExists(v, d){
			let e = false;
			for(let i = 0; i < d+1; i++){
				if (!vars[i]) vars[i] = [];
				if (vars[i].includes(v)) e = true;
			}
			return e;
		}
		for(let i = 0; i < tokens.length; i++) {
			let tok = tokens[i];
			if (isMultilineComment){
				if (tokens[i - 2].value === "*" && tokens[i + 1].type === "BREAK" && tok.value === "/") {
					result += tok.value + "</span>";
					isMultilineComment = false;
				}
				else result += tok.value;
			} else {
				if (tok.type === "COMMENT") {
					result += "<span class=\"comment\">" + tok.value + "</span>";
				} else if (tok.type === "BREAK") {;
					result += "<span class='break'>" + tok.value + "</span>";
				} else if (tok.type === "WORD"){
					if (tokens[i - 2] && tokens[i - 2].value === ".") {
						result += "<span class='prop'>" + tok.value + "</span>";
					} else if (tok.isEngine){
						result += "<span class='engine'>" + tok.value + "</span>";
					} else if (tok.isKeyword){
						result += "<span class='keyword'>" + tok.value + "</span>";
					} else if (tok.value.search(/true|false|undefined|NaN|null/g) > -1) {
						result += "<span class='number'>" + tok.value + "</span>"
					} else if (tokens[i - 2] && tokens[i - 2].type !== "COMMENT" && tokens[i - 2].value.search(/let|const|var|class|elementscript|script|function/g) > -1 && tokens[i - 1].type === "BREAK"){
						result += "<span class='orange'>" + tok.value + "</span>";
						if (!vars[depth]) vars[depth] = [];
						vars[depth].push(tok.value);
					} else if (varExists(tok.value, depth)){
						result += "<span class='var'>" + tok.value + "</span>";
					} else {
						result += "<span class='word'>" + tok.value + "</span>";
					}
				} else if (tok.type === "NUMBER") {
					result += "<span class='number'>" + tok.value + "</span>";
				} else if (tok.type === "STRING") {
					result += "<span class=\"string\">" + tok.value +  "</span>";
				} else if (tok.type === "SYMBOL"){
					if (tok.value === "/" && tokens[i + 1].type === "BREAK" && tokens[i + 2].value === "/") {
						result += "<span class='comment'>/";
						isComment = true;
					}
					else if (tok.value === "/" && tokens[i + 1].type === "BREAK" && tokens[i + 2].value === "*") {
						result += "<span class='comment'>/";
						isMultilineComment = true;
					}
					result += "<span class='symbol'>" + tok.value + "</span>";
				}
			}
		}
		return result.replace(/\n/g, "<br>");
	} catch (e) {
		alert(e);
	}
}