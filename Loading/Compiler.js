const HengineCompiler = {
    compile(jsCode) {
        return this.windowGlobals(this.removeComments(jsCode));
    },
    removeComments(jsCode) {
        jsCode = jsCode
            .replace(/\/\/(.*)(\n|$)/g, "$2")
            .replace(/\/\*((.|\n)*)\*\//g, "");
        return jsCode;
    },
    windowGlobals(jsCode) {
        jsCode += "\n";
        //remove comments
        function findStrings(str) {
            let regions = [];
            let inString = false;
            let startInx = 0;
            let stringType = "'";
            let escaped = false;
            for (let i = 0; i < str.length; i++) {
                const char = str[i];
                if (char.match(/["'`]/g) && !inString && !escaped) {
                    startInx = i + 1;
                    stringType = char;
                    inString = true;
                } else if (inString && char === stringType && !escaped) {
                    inString = false;
                    if (i - startInx) regions.push([startInx - 1, i + 1]);
                }
                if (char === "\\") escaped = true;
                else escaped = false;
            }
            return regions;
        }


        //compile globals
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
                    if (!inBrackets) regions.push([startInx, i + 1]);
                }
            }
            return regions;
        }
        function match(str, regex) {
            return [...str.matchAll(regex)];
        }

        //remove strings
        let strRegions = findStrings(jsCode);
        let allStrings = [];
        const STR_PLACEHOLDER = "[8_STRING_8]";
        jsCode = jsCode.split("");
        for (let i = 0; i < strRegions.length; i++) {
            let r = strRegions[i];
            let str = jsCode.splice(r[0], r[1] - r[0], STR_PLACEHOLDER).join("");
            allStrings.push(str);
            let len = str.length;
            let offsetLength = len - 1;
            for (let j = i + 1; j < strRegions.length; j++) strRegions[j] = [strRegions[j][0] - offsetLength, strRegions[j][1] - offsetLength];
        }
        jsCode = jsCode.join("");

        //turn functions and classes into variables
        jsCode = jsCode.replace(/\bfunction\s+(\w+)\s*\(/g, "var $1 = function $1(");
        jsCode = jsCode.replace(/\bclass\s+(\w+)\s*\{/g, "let $1 = class $1 {");

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
            let found = false;
            while (((depth["("] || depth["["] || depth["{"]) || (remainingText[curInx] != ";" && !found)) && remainingText[curInx]) {
                curInx++;
                let char = remainingText[curInx];
                if (char == "(") depth["("]++;
                if (char == ")") depth["("]--;
                if (char == "[") depth["["]++;
                if (char == "]") depth["["]--;
                if (char == "{") depth["{"]++;
                if (char == "}") depth["{"]--;
                if (depth["{"]) found = true;
                valueText += char;
            }
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


        for (let string of allStrings) {
            result = result.replace(/\[8_STRING_8\]/, string);
        }

        return result;
    }
};