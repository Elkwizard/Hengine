let PROJECT;

try {
	//load engine
	PROJECT = new Project();
} catch (e) {
	alert("LoadError: " + e);
}