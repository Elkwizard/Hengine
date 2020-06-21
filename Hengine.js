(function () {
    //compiler
    function windowGlobals(jsCode) {
        function findBrackets(str) {
            let regions = [];
            let inBrackets = 0;
            let startInx = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str[i];
                if (char === "{") {
                    if (!inBrackets && char === "{") {
                        startInx = i + 1;
                    }
                    inBrackets++;
                }
                if (char === "}") {
                    inBrackets--;
                    if (!inBrackets) regions.push([startInx, i]);
                }   
            }
            return regions;
        }
        function match(str, regex) {
            return [...str.matchAll(regex)];
        }
        let bracketRanges = findBrackets(jsCode);
        let matches = match(jsCode, /(let|var|const)\s+(\w+)\s*=\s*(.+);?/g);
        matches = matches.filter(match => {
            let inx = match.index;
            for (let range of bracketRanges) {
                if (inx >= range[0] && inx <= range[1]) return false;
            }
            return true;
        });
        let jsCodeChars = jsCode.split("").map(char => ({ value: char, exists: true }));
        for (let match of matches) {
            let str = match[0].trim();
            let len = str.length;
            let inx = match.index;

            let type = "var";
            if (str.match(/^let/g)) type = "let";
            if (str.match(/^const/g)) type = "const";
            let spaceInx = str.indexOf(" ");
            let afterSpace = str.slice(spaceInx).trim();

            let vInx = afterSpace.indexOf("=");
            let name = afterSpace.slice(0, vInx).trim();
            let value = afterSpace.slice(vInx + 1).trim();
            let depth = {
                "(": 0,
                "[": 0,
                "{": 0
            };
            let fChar = value[0];
            if (fChar === "(") depth["("] = 1;
            if (fChar === "[") depth["["] = 1;
            if (fChar === "{") depth["{"] = 1;

            let startInx = inx + str.indexOf("=") + 1;
            let remainingText = jsCode.slice(startInx).trim();
            
            let curInx = 0;
            let valueText = fChar;
            while ((depth["("] || depth["["] || depth["{"]) || remainingText[curInx] != ";") {
                curInx++;
                let char = remainingText[curInx];
                if (char == "(") depth["("]++;
                if (char == ")") depth["("]--;
                if (char == "[") depth["["]++;
                if (char == "]") depth["["]--;
                if (char == "{") depth["{"]++;
                if (char == "}") depth["{"]--;
                valueText += char;
            }
            // if (valueText) console.log(valueText);
            let endInx = startInx + valueText.length + 1;
            
            len = endInx - inx;
            value = valueText;

            for (let i = 0; i < len; i++) {
                jsCodeChars[inx + i].exists = false;
            }
            jsCodeChars[inx].exists = true;

            let compCode = `GLOBAL_${type.toUpperCase()}_ASSIGN`;
        

            if (type === "var" || type === "let") {
                compCode = `window.${name} = ${value}`;
            } else {
                if (value[value.length - 1] === ";") value = value.slice(0, value.length - 1);
                compCode = `(function() {
        const __temp__ = ${value};
        if ("${name}" in window) delete window["${name}"];
        Object.defineProperty(window, "${name}", {
            set: function (newValue) {
                throw new TypeError("Assignment to constant variable.");
            },
            get: function () {
                return __temp__;
            }
        });
    })();`;
            }
            jsCodeChars[inx].value = compCode;
        }

        let result = "";
        for (let charObj of jsCodeChars) {
            if (charObj.exists) result += charObj.value;
        }

        console.log(result);
        return result;
    }
    //compiler end
    
    let script = document.getElementsByTagName("script")[0];
    let title = script.title || "Hengine Project";
    let scripts = (script.getAttribute("scripts") || "").replace(/\.js/g, "").split(" ").filter(str => str.length);
    
    let src = script.src.split("/");
    src.pop();
    src = src.join("/") + "/Package/Engine/Manage/Hengine.js";
    window.hengine = { 
        get js() {
            let script = document.createElement("script");
            script.src = src;
            document.head.appendChild(script);
            return new Promise(function (resolve) {
                script.onload = async function () {
                    await Hengine.load(Hengine.defaultApplicationPackage(scripts));
                    setTitle(title);
                    resolve();
                }
            });
        }
    };
    let code = windowGlobals(script.innerHTML);
    code = `(async function() { await hengine.js; ${code} })();`;
    let nScript = document.createElement("script");
    nScript.innerHTML = code;
    document.head.appendChild(nScript);
    script.innerHTML = "";
})();