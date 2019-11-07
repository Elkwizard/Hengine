const WALLS = new InactiveScene("Walls");
WALLS.addRectElement("Ceiling", 0, -100, innerWidth, 100, false, false, "Wall");
WALLS.addRectElement("Floor", 0, innerHeight, innerWidth, 100, false, false, "Wall");
WALLS.addRectElement("Right Wall", -100, -100, 100, innerHeight + 200, false, false, "Wall");
WALLS.addRectElement("Left Wall", innerWidth, -100, 100, innerHeight + 200, false, false, "Wall");