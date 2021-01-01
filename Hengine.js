(async function () {
    //locate self
    let script = document.currentScript;
    let title = script.title || "Hengine Project";
    let scripts = (script.getAttribute("scripts") || "").replace(/\.js/g, "").split(" ").filter(str => str.length);

    //process filesystem
    let src = script.src.split("/");
    src.pop();
    let hengineLoaderSrc = src.join("/") + "/Package/Engine/Manage/HengineLoader.js";
 
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

    await load(hengineLoaderSrc);
    await HengineLoader.load(scripts.map(src => new HengineScriptResource(src)));


    window.title = title;

    let code = script.innerHTML;

    let nScript = document.createElement("script");
    nScript.innerHTML = code;
    (script.parentNode ?? document.querySelector("html")).appendChild(nScript);
})();