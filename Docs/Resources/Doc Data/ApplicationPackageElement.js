load(String.raw`
	(1)(Class)ApplicationPackageElement(/1)
	(p)An ApplicationPackageElement is a data structure to store the path to certain types of resources needed by a program. The are stored in a #ApplicationPackage#.(/p)
	(2)Type(/2)
	(p)**
	class ApplicationPackageElement { ... }
	**(/p)
	(2)Syntax(/2)
	(p)**
	new ApplicationPackageElement(files, path)
	**(/p)
	(2)Parameters(/2)
	(p)
		(prop:files $Object$)An object containing the local paths. It should be in the format *{ [localPath]: [file1, file2, file3], [localPath2]: [file1, file2, file3], ... }*(/prop)
		(prop:path $String$)The path to the place where the target resources are stored within the program.(/prop)
	(/p)
	(2)Properties(/2)
	(p)
		(prop:files $Object$)An object containing the local paths. It should be in the format *{ [localPath]: [file1, file2, file3], [localPath2]: [file1, file2, file3], ... }*(/prop)
		(prop:path $String$)The path to the place where the target resources are stored within the program.(/prop)
	(/p)
`);