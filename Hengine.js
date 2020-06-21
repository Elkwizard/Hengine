(async function () {
    //locate self
    let script = document.getElementsByTagName("script")[0];
    let title = script.title || "Hengine Project";
    let scripts = (script.getAttribute("scripts") || "").replace(/\.js/g, "").split(" ").filter(str => str.length);

    //process filesystem
    let src = script.src.split("/");
    src.pop();
    let hengineSrc = src.join("/") + "/Package/Engine/Manage/Hengine.js";
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
    await load(hengineSrc);
    await Hengine.load(Hengine.defaultApplicationPackage(scripts));

    setTitle(title);

    //compile code
    let code = HengineCompiler.compile(script.innerHTML);

    let nScript = document.createElement("script");
    nScript.innerHTML = code;
    document.head.appendChild(nScript);
    script.innerHTML = "";

})();