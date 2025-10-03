(async function () {
    // locate self
    const script = document.currentScript;
    const title = script.getAttribute("title") || "Hengine Project";
    const scripts = (script.getAttribute("scripts") || "")
		.split(" ")
		.filter(str => str.length);

    // process URL
    const src = script.src.split("/");
    src.pop();
	const searchParams = new URL(script.src).searchParams;
    const hengineLoaderSrc = src.join("/") + "/Package/Engine/Manage/HengineLoader.js?" + searchParams;
 
    function load(src) {
        const script = document.createElement("script");
		script.setAttribute("charset", "UTF-8");
        script.src = src;
		document.head.appendChild(script);
        return new Promise(resolve => {
			script.addEventListener("load", () => resolve(script));
		});
    }

	// load resources
    await load(hengineLoaderSrc);
    await HengineLoader.load(scripts.map(src => new HengineScriptResource(src)));

    window.title = title;

	// inject script contents into new, runnable script tag
    let nScript = document.createElement("script");
    nScript.innerHTML = script.innerHTML;
    (script.parentNode ?? document.querySelector("html")).appendChild(nScript);
})();