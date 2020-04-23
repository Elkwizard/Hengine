//put setup code here:

g.update = () => {
	//this gets run every frame
	c.textMode = "center";
	c.draw(cl.BLACK).text("50px Monospace", "THURSDAY AT 3:00", width / 2, height / 2 - 25);
}