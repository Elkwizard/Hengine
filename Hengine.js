(async function () {
    //locate self
    let script = document.currentScript;
    let title = script.title || "Hengine Project";
    let scripts = (script.getAttribute("scripts") || "").replace(/\.js/g, "").split(" ").filter(str => str.length);

    //process filesystem
    let src = script.src.split("/");
    src.pop();
    let hengineLoaderSrc = src.join("/") + "/Package/Engine/Manage/HengineLoader.js";
    let compilerSrc = src.join("/") + "/Loading/Compiler.js";

    function load(src) {
        const script = document.createElement("script");
        script.src = src;
        document.head.appendChild(script);
        return new Promise(function (resolve) {
            script.onload = function () {
                resolve(script);
            }
        });
    }

    await load(compilerSrc);
    await load(hengineLoaderSrc);
    await HengineLoader.load(HengineLoader.defaultApplicationPackage(scripts));

    window.title = title;

    //compile code
    let code = script.innerHTML;
    if (script.hasAttribute("compiled")) code = HengineCompiler.compile(code);

    let nScript = document.createElement("script");
    nScript.innerHTML = code;
    document.head.appendChild(nScript);
})();