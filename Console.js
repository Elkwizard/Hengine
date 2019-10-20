class DevConsole{
	constructor(){
		let container = document.createElement('div');
		let C = document.createElement('div');
		let CS = C.style;
		function repair(m){
			let x = document.createElement('span');
			x.innerHTML = m;
			return x.innerText;
		}
		let b = undefined;
		function setUp(){
			CS.position = "relative";
			CS.left = 40;
			CS.top = -117;
			CS.width = innerWidth / 2 - 40;
			CS.height = innerHeight;
			CS.background = "#aaa";
			CS.border = "3px black solid";
			let title = document.createElement('div');
			let TS = title.style;
			TS.width = "100%";
			TS.height = "30px";
			TS.font = "25px monospace";
			TS.border = "3px black solid";
			TS.background = "#888";
			TS.color = "black";
			TS.textAlign = "center";
			TS.position = "relative";
			TS.top = -2;
			TS.left = -2;
			TS.padding = "2px";
			title.innerHTML = "CONSOLE";
			let CB = document.createElement('div');
			let CBS = CB.style;
			CBS.position = "relative";
			CBS.top = -3;
			CBS.left = 0;
			CBS.width = innerWidth / 2 - 40;
			CBS.height = innerHeight;
			C.appendChild(title);
			C.appendChild(CB);
			let button = document.createElement('button');
			let bt = button.style;
			button.id = "engine-console-close-button";
			button.innerHTML += `
CLEAR
<style>
	#engine-console-close-button{
		border: 2px black solid;
		background: red;
		padding: 5px;
		border-radius: 5px;
		float: right;
		margin-right: 10px;
	}
</style>
`
			let logSpace = document.createElement('div');
			title.appendChild(button);
			b = button
			logSpace.id = "engine-log-space";
			let LS = logSpace.style;
			logSpace.innerHTML += `
<style>
	#engine-log-space .log{
		padding: 5px;
		background: transparent;
		font: 20px monospace;
		border: 3px #999 solid;
	}
</style>
`
			CB.appendChild(logSpace);
			this.log = function(m){
				m = m.toString().replace(/\n/g, "<br>");
				if(this.lastLog !== m || logSpace.innerHTML === ""){
					logSpace.innerHTML += "<div class='log'>&gt; " + m + "</div>";
				}
				this.lastLog = m;
			}
			this.clear = function(){
				logSpace.innerHTML = `
<style>
	#engine-log-space .log{
		padding: 5px;
		background: transparent;
		font: 20px monospace;
		border: 3px #999 solid;
	}
</style>
`;
			}
		}
		setUp = setUp.bind(this);
		let sidebar = document.createElement('div');
		container.style.position = "fixed";
		container.style.top = 0;
		container.style.left = innerWidth-40;
		container.style.width = innerWidth * 0.5;
		container.style.height = innerHeight;
		container.style.transition = "all 2s";
		container.style.font = "20px monospace";
		sidebar.style.position = "relative";
		sidebar.style.top = innerHeight/2-50
		sidebar.style.width = "50px";
		sidebar.style.height = "70px";
		sidebar.innerHTML = "|||";
		sidebar.style.paddingLeft = "8px";
		sidebar.style.font = "25px Arial";
		sidebar.style.paddingTop = "40px";
		sidebar.style.background = "#ccc";
		sidebar.style.border = "3px #444 solid";
		sidebar.style.borderRadius = "15px";
		sidebar.id = "dev-console";
		setUp();
		b.onclick = this.clear.bind(this);
		this.shown = false;
		sidebar.onclick = function(){
			this.shown = !this.shown;
			if(this.shown){
				container.style.left = innerWidth/2;
			}
			else{
				container.style.left = innerWidth-40;
			}
		}.bind(this);
		container.appendChild(sidebar);
		container.appendChild(C);
		document.body.appendChild(container);
	}
}