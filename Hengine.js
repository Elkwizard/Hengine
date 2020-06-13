(function () {
    let script = document.getElementsByTagName("script")[0];
    let title = script.title || "Hengine Project";
    let scripts = (script.getAttribute("scripts") || "").replace(/\.js/g, "").split(" ");
    
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
    let code = `(async function() { await hengine.js; ${script.innerHTML} })();`;
    let nScript = document.createElement("script");
    nScript.innerHTML = code;
    document.head.appendChild(nScript);
    script.innerHTML = "";
})();