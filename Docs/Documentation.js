const documentation = new DocOrg([
    new DocNode([
        new DocNode([
            new DocNode([
                new DocNode([], {
                    type: "fn",
                    name: "s.addElement",
                    param: "name, x, y, controls, tag",
                    desc: "Add Geometry-less SceneObject."
                }),
                new DocNode([], {
                    type: "fn",
                    name: "s.addRectElement",
                    param: "name, x, y, w, h, controls, tag",
                    desc: "Add a SceneObject with Rect geometry centered on the SceneObject's Position."
                }),
                new DocNode([], {
                    type: "fn",
                    name: "s.addCircleElement",
                    param: "name, x, y, r, controls, tag",
                    desc: "Add a SceneObject with a Circle geometry centered on the SceneObject's Position."
                })
            ], {
                type: "tl",
                name: "Add Element"
            }),
            new DocNode([
                new DocNode([], {
                    type: "fn",
                    name: "s.addPhysicsElement",
                    param: "name, x, y, gravity, controls, tag",
                    desc: "Add Geometry-less PhysicsObject. (Might add unique Geometry later)"
                }),
                new DocNode([], {
                    type: "fn",
                    name: "s.addPhysicsRectElement",
                    param: "name, x, y, w, h, gravity, controls, tag",
                    desc: "Add a PhysicsObject with Rect geometry centered on the PhysicsObject's Position."
                }),
                new DocNode([], {
                    type: "fn",
                    name: "s.addPhysicsCircleElement",
                    param: "name, x, y, r, gravity, controls, tag",
                    desc: "Add a PhysicsObject with a Circle geometry centered on the PhysicsObject's Position."
                })
            ], {
                type: "tl",
                name: "Add Physics Element"
            }),
            new DocNode([
                new DocNode([], {
                    type: "fn",
                    name: "s.addParticleSpawner",
                    param: "name, x, y, size, v<sub>0</sub>, delay, lifespan, render:ElementScript, size<sub>variance</sub>, v<sub>variance</sub>, directions",
                    desc: "Creates a particle spawner with the specified properties."
                }),
                new DocNode([], {
                    type: "fn",
                    name: "s.addParticleExplosion",
                    param: "amountParticles, x, y, size, v<sub>0</sub>, delay, lifespan, render:ElementScript, size<sub>variance</sub>, v<sub>variance</sub>, directions",
                    desc: "Creates a particle explosion with the specified properties. It will be deleted after all particles disappear."
                }),
                new DocNode([], {
                    type: "fn",
                    name: "Directions.fromAngle",
                    param: "angle",
                    desc: "Returns a directions object, which will send particles in the direction of the specified angle."
                })
            ], {
                type: "tl",
                name: "Add Particle Element"
            }),
            new DocNode([], {
                type: "fn",
                name: "s.addUIElement",
                desc: "Add a Rectangular UIObject. This UIObject will remain in the same place on the screen regardless of camera position, rotation, and zoom."
            })
        ], {
            type: "tl",
            name: "Add Element"
        }),
        new DocNode([
            new DocNode([
                new DocNode([
                    new DocNode([], {
                        type: "fn",
                        name: "s.get",
                        param: "name",
                        desc: "Returns the SceneObject with the provided name."
                    }),
                    new DocNode([], {
                        type: "pr",
                        name: "s.containsArray",
                        desc: "The list of all SceneObjects."
                    }),
                ], {
                    type: "tl",
                    name: "getOne"
                }),
                new DocNode([
                    new DocNode([], {
                        type: "fn",
                        name: "s.getElementsWithTag",
                        param: "tag",
                        desc: "Returns all SceneObjects with the provided tag."
                    }),
                    new DocNode([], {
                        type: "fn",
                        name: "s.getElementsWithScript",
                        param: "scriptName",
                        desc: "Returns all SceneObjects with the script provided."
                    }),
                    new DocNode([], {
                        type: "fn",
                        name: "s.getElementsMatch",
                        param: "check(el)",
                        desc: "Returns all SceneObjects that when passed to the provided check return true."
                    })
                ], {
                    type: "tl",
                    name: "getMultiple"
                })
            ], {
                type: "tl",
                name: "getElements..."
            }),
            new DocNode([
                new DocNode([
                    new DocNode([
                        new DocNode([
                            new DocNode([], {
                                type: "cs",
                                name: "init",
                                desc: "This is called when the .addTo is called. It is called with all the extra parameters to .addTo."
                            }),
                            new DocNode([], {
                                type: "cs",
                                name: "update",
                                desc: "This is called every physics update (20ms)."
                            }),
                            new DocNode([], {
                                type: "cs",
                                name: "draw",
                                desc: "This is called every draw update for every shape attached to the SceneObject. It will be passed the name and Shape object for each piece of Geometry. It will be called in the model space of each Shape."
                            }),
                            new DocNode([], {
                                type: "cs",
                                name: "escapeDraw",
                                desc: "This is called every draw update, in plain world space. It is only called once each draw update."
                            })
                        ], {
                            type: "tl",
                            name: "Reccurent Methods"
                        }),
                        new DocNode([
                            new DocNode([], {
                                type: "cs",
                                name: "collide[top, bottom, left, right, general]",
                                desc: "This is called every time a collision occurs between the SceneObject and another. It will be passed the other SceneObject."
                            }),
                            new DocNode([], {
                                type: "cs",
                                name: "collideRule",
                                desc: "This is called every time a collision might occur between the SceneObject and another. This function will be called with the other SceneObject as a an argument. If this function returns false, then the collision won't be noticed."
                            })
                        ], {
                            type: "tl",
                            name: "Collision Events"
                        })
                    ], {
                        type: "tl",
                        name: "Tags",
                        desc: "Each tag determines when each method will be called. Each method is called with the first argument being the local instance of the script."
                    }),
                    new DocNode([], {
                        type: "fn",
                        name: "addTo",
                        param: "el, ...args",
                        desc: "Adds the behavior of the script to the specified SceneObject. The args will be passed to the init method."
                    }),
                    new DocNode([], {
                        type: "fn",
                        name: "new ElementScript",
                        param: "scriptName, methods",
                        desc: "Creates a Script with the name provided, and creates a method on the Script for each method in the methods object provided. The name of each method will be used as Tag."
                    }),
                    new DocNode([], {
                        type: "fn",
                        name: "s.addScript",
                        param: "scriptName, method",
                        desc: "Calls the ElementScript with the provided arguments. It also creates a global variable with the provided scriptName containing the new Script."
                    })
                ], {
                    type: "cs",
                    name: "Script"
                }),
                new DocNode([
                    new DocNode([], {
                        type: "fn",
                        name: "s.changeElementDraw",
                        param: "element, newDraw(name, shape)",
                        desc: "Replaces the rendering function of the provided element with newDraw. This method will be called for each shape attached to the element"
                    }),
                    new DocNode([], {
                        type: "fn",
                        name: "s.changeElementUpdate",
                        param: "element, newUpdate()",
                        desc: "Replaces the update function of the provided element with newUpdate. This method will be called each physics update (16ms)"
                    })
                ], {
                    type: "tl",
                    name: "Change Element (recurrent)"
                }),
                new DocNode([
                    new DocNode([], {
                        type: "fn",
                        name: "s.changeElementCollideRule",
                        param: "element, collideRule(element)",
                        desc: "Everytime a collision could happen between the provided element anything else, this function will be called with the other object in the collision. If the function returns true, the collision will proceed, otherwise, the collision won't be noticed."
                    }),
                    new DocNode([], {
                        type: "fn",
                        name: "s.changeElementCollideResponse",
                        param: "element, direction, collideResponse(element)",
                        desc: "If a collision occurs between the provided element and another, in the direction provided (left, right, top, bottom, general), collideResponse will be called with the other object as an argument."
                    })
                ], {
                    type: "tl",
                    name: "Change Element (collisions)"
                })
            ], {
                type: "tl",
                name: "Change Element"
            })
        ], {
            type: "tl",
            name: "Change Element"
        })
    ], {
        type: "tl",
        name: "SceneObjects"
    }),
    new DocNode([
        new DocNode([
            new DocNode([
                new DocNode([
                    new DocNode([], {
                        type: "pr",
                        name: "x, y, z, w",
                        desc: "The specified component of the Vector."
                    }),
                    new DocNode([], {
                        type: "pr",
                        name: "normal",
                        desc: "The perpendicular vector to the Vector"
                    }),
                    new DocNode([], {
                        type: "pr",
                        name: "mag",
                        desc: "The magnitude of the Vector."
                    })
                ], {
                    type: "tl",
                    name: "Data"
                }),
                new DocNode([
                    new DocNode([
                        new DocNode([], {
                            type: "fn",
                            name: "new Vector",
                            param: "x, y, z, w",
                            desc: "Creates a Vector with the specified components."
                        }),
                        new DocNode([], {
                            type: "fn",
                            name: "add, sub, mul, div",
                            param: "other",
                            desc: "Performs the indicated operation elementwise between the Vector and the provided other value. The result is stored in the original Vector. Returns the original Vector."
                        }),
                        new DocNode([], {
                            type: "fn",
                            name: "plus, minus, times, over",
                            param: "other",
                            desc: "Performs the indicated operation elementwise between the Vector and the provided other value. Returns the result."
                        })
                    ], {
                        type: "tl",
                        name: "Simple"
                    }),
                    new DocNode([
                        new DocNode([], {
                            type: "fn",
                            name: "dot",
                            param: "other",
                            desc: "Returns the dot product between the Vector and the other provided Vector."
                        }),
                        new DocNode([], {
                            type: "fn",
                            name: "cross",
                            param: "other",
                            desc: "Returns the cross product between the Vector and the other provided Vector."
                        }),
                        new DocNode([], {
                            type: "fn",
                            name: "normalize",
                            param: "",
                            desc: "Sets the magnitude of the Vector to 1, returns it."
                        })
                    ], {
                        type: "tl",
                        name: "Complex"
                    })
                ], {
                    type: "tl",
                    name: "Methods"
                })
            ], {
                type: "cs",
                name: "Vector1, Vector2, Vector3, Vector4",
                desc: "Stores 1, 2, 3, and 4 dimensional vector values. Also has vector operations."
            }),
            new DocNode([
                new DocNode([
                    new DocNode([
                        new DocNode([
                            new DocNode([], {
                                type: "pr",
                                name: "x, y",
                                desc: "The location of the center of mass of the PhysicsObject."
                            }),
                            new DocNode([], {
                                type: "pr",
                                name: "rotation",
                                desc: "The rotation of the PhysicsObject."
                            }),
                            new DocNode([], {
                                type: "pr",
                                name: "middle",
                                desc: "The location of the center of mass of the PhysicsObject."
                            })
                        ], {
                            type: "tl",
                            name: "Transform"
                        }),
                        new DocNode([
                            new DocNode([], {
                                type: "pr",
                                name: "velocity",
                                desc: "The Vector velocity of the PhysicsObject."
                            }),
                            new DocNode([], {
                                type: "pr",
                                name: "angularVelocity",
                                desc: "The scalar angular velocity of the PhysicsObject."
                            })
                        ], {
                            type: "tl",
                            name: "Velocity"
                        }),
                        new DocNode([
                            new DocNode([], {
                                type: "pr",
                                name: "positionStatic, rotationStatic",
                                desc: "Booleans representing whether either of these things are able to change about the PhysicsObject."
                            }),
                            new DocNode([], {
                                type: "pr",
                                name: "hasGravity",
                                desc: "Tells the object whether or not it can fall."
                            }),
                            new DocNode([], {
                                type: "pr",
                                name: "slows",
                                desc: "Whether or not the object has air resistance."
                            }),
                            new DocNode([], {
                                type: "pr",
                                name: "friction",
                                desc: "How rough the surface of the object is. Related to how much velocity is lost during friction."
                            })
                        ], {
                            type: "tl",
                            name: "Mobility"
                        }),
                    ], {
                        type: "tl",
                        name: "Data",
                    }),
                    new DocNode([
                        new DocNode([
                            new DocNode([], {
                                type: "fn",
                                name: "applyImpulse",
                                param: "impulse",
                                desc: "Applies the specified impulse to the PhysicsObject."
                            }),
                            new DocNode([
                                new DocNode([], {
                                    type: "fn",
                                    name: "new Impulse",
                                    param: "force, source",
                                    desc: "Creates an impulse being applied at the provided source. The amount of force of the impulse is the provided force."
                                })
                            ], {
                                type: "cs",
                                name: "Impulse"
                            })
                        ], {
                            type: "tl",
                            name: "Velocity"
                        }),
                        new DocNode([
                            new DocNode([], {
                                type: "fn",
                                name: "mobilize",
                                param: "",
                                desc: "Causes the object to become completely dynamic and have gravity applied."
                            }),
                            new DocNode([], {
                                type: "fn",
                                name: "demobilize",
                                param: "",
                                desc: "Causes the object to become completely static."
                            })
                        ], {
                            type: "tl",
                            name: "Mobility"
                        })
                    ], {
                        type: "tl",
                        name: "Methods",
                    })
                ], {
                    type: "cs",
                    name: "PhysicsObject"
                }),
                new DocNode([
                    new DocNode([
                        new DocNode([], {
                            type: "pr",
                            name: "a",
                            desc: "The first object in the constraint."
                        }),
                        new DocNode([], {
                            type: "pr",
                            name: "b",
                            desc: "The second object in the constraint."
                        }),
                        new DocNode([], {
                            type: "pr",
                            name: "aOffset",
                            desc: "The Vector2 offset from the middle of A where the point being constrained exists."
                        }),
                        new DocNode([], {
                            type: "pr",
                            name: "aOffset",
                            desc: "The Vector2 offset from the middle of B where the point being constrained exists."
                        }),
                        new DocNode([], {
                            type: "pr",
                            name: "distance",
                            desc: "The distance between the two constrained points. The objects will be moved to maintain this distance."
                        })
                    ], {
                        type: "tl",
                        name: "Data"
                    }),
                    new DocNode([
                        new DocNode([], {
                            type: "fn",
                            name: "s.constrain",
                            param: "a, b[, aOffset, bOffset, distance]",
                            desc: "Constrains the distance between the objects based on the specified offsets and distances. If you don't provided the distance, it will assume aOffset and bOffset are 0, the distance will be the distance between the two objects when s.constrain is called. Returns the Constraint."
                        }),
                        new DocNode([], {
                            type: "fn",
                            name: "Physics.solveLengthConstraint",
                            param: "constraint",
                            desc: "Takes a Constraint object and fixes the objects velocities and positions to maintain distance."
                        })
                    ], {
                        type: "tl",
                        name: "Method"
                    })
                ], {
                    type: "cs",
                    name: "Constraint",
                    desc: "A constraint that holds two pieces of two PhysicsObjects a specified distance apart."
                })
            ], {
                type: "tl",
                name: "Physics"
            })
        ], {
            type: "tl",
            name: "Data Structures"
        }),
        new DocNode([
            new DocNode([], {
                type: "fn",
                name: "rand",
                param: "[, seed]",
                desc: "Generates a random number based on the provided seed. If the seed is not provided, it will simply generate a random number. These numbers will always be the same each time the program runs."
            }),
            new DocNode([], {
                type: "fn",
                name: "c.noise",
                param: "x, frequency",
                desc: "Returns the perlin noise with the specified frequency at the provided location."
            }),
            new DocNode([], {
                type: "fn",
                name: "c.noise2D",
                param: "x, y, frequency",
                desc: "Returns the perlin noise with the specified frequency at the provided location."
            })
        ], {
            type: "tl",
            name: "Random"
        })
    ], {
        type: "tl",
        name: "Math"
    }),
    new DocNode([
        new DocNode([
            new DocNode([
                new DocNode([
                    new DocNode([], {
                        type: "pr",
                        name: "red, green, blue, alpha",
                        desc: "Amount of the specified value in the color",
                    })
                ], {
                    type: "tl",
                    name: "Data"
                }),
                new DocNode([
                    new DocNode([
                        new DocNode([], {
                            type: "fn",
                            name: "add, sub, mul, div, mod",
                            param: "other",
                            desc: "Performs the specified operation between the color and other. The result will be stored in the original color."
                        }),
                        new DocNode([], {
                            type: "fn",
                            name: "plus, minus, times, over",
                            param: "other",
                            desc: "Performs the specified operation between the color and other. returns the result."
                        })
                    ], {
                        type: "tl",
                        name: "Math",
                    }),
                    new DocNode([
                        new DocNode([], {
                            type: "fn",
                            name: "new Color",
                            param: "(r, g, b, a) or (#rrggbb) or (#rgb) or (rgba(r,g,b,a)) or (rgb(r,g,b))",
                            desc: "Creates a color using the specified color representation"
                        }),
                        new DocNode([], {
                            type: "fn",
                            name: "Color.lerp",
                            param: "col<sub>1</sub>, col<sub>2</sub>, t",
                            desc: "Returns the linear interpolation between the provided colors at the provided time."
                        }),
                        new DocNode([], {
                            type: "fn",
                            name: "Color.quadLerp",
                            param: "col<sub>1</sub>, col<sub>2</sub>, col<sub>3</sub>, col<sub>4</sub>, t<sub>x</sub>, t<sub>y</sub>",
                            desc: "Returns the linear interpolation between the provided colors at the provided coords in a grid. The order is (top-left, top-right, bottom-left, bottom-right)."
                        })
                    ], {
                        type: "tl",
                        name: "General"
                    })
                ], {
                    type: "tl",
                    name: "Methods"
                })
            ], {
                type: "cs",
                name: "Color",
                desc: "Stores a color."
            }),
            new DocNode([
                new DocNode([], {
                    type: "pr",
                    name: "cl.BLACK, cl.GRAY, cl.LIGHT_GRAY, cl.WHITE",
                    desc: `<div style="display: inline-block; width: 100px; height: 100px; background: #000"></div><div style="display: inline-block; width: 100px; height: 100px; background: rgb(128, 128, 128)"></div><div style="display: inline-block; width: 100px; height: 100px; background: #ccc"></div><div style="display: inline-block; width: 100px; height: 100px; background: #fff"></div>`
                }),
                new DocNode([], {
                    type: "pr",
                    name: "cl.RED, cl.RAZZMATAZZ, cl.PURPLE",
                    desc: '<div style="display: inline-block; width: 100px; height: 100px; background: #f00"></div><div style="display: inline-block; width: 100px; height: 100px; background: #e3256b"></div><div style="display: inline-block; width: 100px; height: 100px; background: #909"></div>'
                }),
                new DocNode([], {
                    type: "pr",
                    name: "cl.LIME, cl.GREEN",
                    desc: '<div style="display: inline-block; width: 100px; height: 100px; background: #0f0;"></div><div style="display: inline-block; width: 100px; height: 100px; background: rgb(0,153,0);"></div>'
                }),
                new DocNode([], {
                    type: "pr",
                    name: "cl.ORANGE, cl.ORANGE, cl.YELLOW, cl.CREAM",
                    desc: '<div style="display: inline-block; width: 100px; height: 100px; background: #f90"></div><div style="display: inline-block; width: 100px; height: 100px; background: #d4af37"></div><div style="display: inline-block; width: 100px; height: 100px; background: #ff0"></div><div style="display: inline-block; width: 100px; height: 100px; background: #fff185"></div>'
                }),
                new DocNode([], {
                    type: "pr",
                    name: "cl.BROWN, cl.DARK_BROWN",
                    desc: '<div style="display: inline-block; width: 100px; height: 100px; background: #7d5314;"></div><div style="display: inline-block; width: 100px; height: 100px; background: #5a2000;"></div>'
                }),
                new DocNode([], {
                    type: "pr",
                    name: "cl.BLUE, cl.SKY_BLUE",
                    desc: '<div style="display: inline-block; width: 100px; height: 100px; background: #00f"></div><div style="display: inline-block; width: 100px; height: 100px; background: #87ceeb"></div>'
                }),
            ], {
                type: "cs",
                name: "ColorLibrary",
                desc: "Stores a list of commonly used colors."
            }),
            new DocNode([
                new DocNode([
                    new DocNode([], {
                        type: "pr",
                        name: "width, height",
                        desc: "Dimensions of the Texture"
                    }),
                    new DocNode([], {
                        type: "pr",
                        name: "pixels",
                        desc: "A 2D array of colors representing the data in the texture."
                    }),
                    new DocNode([], {
                        type: "pr",
                        name: "loops",
                        desc: "A boolean indicating whether or not the texture will be tiled when drawn."
                    })
                ], {
                    type: "tl",
                    name: "Data"
                }),
                new DocNode([
                    new DocNode([], {
                        type: "fn",
                        name: "new Texture",
                        param: "width, height",
                        desc: "Creates a Texture with the specified dimensions."
                    }),
                    new DocNode([], {
                        type: "fn",
                        name: "getPixel",
                        param: "x, y",
                        desc: "Returns the pixel at the provided location."
                    }),
                    new DocNode([], {
                        type: "fn",
                        name: "setPixel",
                        param: "x, y, value",
                        desc: "Sets the pixel at the provided location to the provided color."
                    }),
                    new DocNode([], {
                        type: "fn",
                        name: "[Symbol.iterator]",
                        param: "",
                        desc: "Iterates through each x, y location in the Texture. Returns [x, y] each iteration. eg. for (let [x, y] of texture)"
                    })
                ], {
                    type: "tl",
                    name: "Methods"
                })
            ], {
                type: "cs",
                name: "Texture",
                desc: "Stores a grid of pixels. Can be used as an image."
            })
        ], {
            type: "tl",
            name: "Data Structures"
        }),
        new DocNode([
            new DocNode([
                new DocNode([
                    new DocNode([], {
                        type: "fn",
                        name: "c.draw(...).rect",
                        param: "(x, y, w, h) or (rect)",
                        desc: "Fills a rectangle with an upper-left corner at (x, y), with the provided dimensions."
                    }),
                    new DocNode([], {
                        type: "fn",
                        name: "c.draw(...).circle",
                        param: "(x, y, r) or (circle)",
                        desc: "Fills a circle with an center at (x, y), with the provided radius."
                    }),
                    new DocNode([], {
                        type: "fn",
                        name: "c.draw(...).triangle",
                        param: "v<sub>1</sub>, v<sub>2</sub>, v<sub>3</sub>",
                        desc: "Fills a triangle with the provided vertices."
                    }),
                    new DocNode([], {
                        type: "fn",
                        name: "c.draw(...).shape",
                        param: "...vertices",
                        desc: "Fills a polygon with the provided vertices."
                    })
                ], {
                    type: "tl",
                    name: "Simple"
                }),
                new DocNode([
                    new DocNode([], {
                        type: "fn",
                        name: "c.draw(...).ellipse",
                        param: "x, y, r<sub>x</sub>, r<sub>y</sub>",
                        desc: "Fills an ellipse with a center at (x, y), with the provided radii."
                    }),
                    new DocNode([], {
                        type: "fn",
                        name: "c.draw(...).sector",
                        param: "x, y, r, θ<sub>0</sub>, θ<sub>1</sub>, counter-clockwise",
                        desc: "Fills a pie slice / sector of a circle centered at (x, y) with the provided radius, spanning the provided angular range. If counter-clockwise is true, the direction around the circle the sector will go from θ<sub>0</sub> to θ<sub>1</sub> is counter-clockwise."
                    }),
                    new DocNode([], {
                        type: "fn",
                        name: "c.draw(...).text",
                        param: "font, text, x, y, pack-width",
                        desc: "Fills the provided text in the provided font at (x, y). The text will be wrapped around if it exceeds the provided pack-width."
                    })
                ], {
                    type: "tl",
                    name: "Complex"
                }),
                new DocNode([], {
                    type: "fn",
                    name: "c.draw",
                    param: "color",
                    desc: "Acts as a prefix to filling a later specified shape with the provided color."
                })
            ], {
                type: "tl",
                name: "Filled"
            }),
            new DocNode([
                new DocNode([
                    new DocNode([], {
                        type: "fn",
                        name: "c.stroke(...).rect",
                        param: "(x, y, w, h) or (rect)",
                        desc: "Outlines a rectangle with an upper-left corner at (x, y), with the provided dimensions."
                    }),
                    new DocNode([], {
                        type: "fn",
                        name: "c.stroke(...).circle",
                        param: "(x, y, r) or (circle)",
                        desc: "Outlines a circle with an center at (x, y), with the provided radius."
                    }),
                    new DocNode([], {
                        type: "fn",
                        name: "c.stroke(...).triangle",
                        param: "v<sub>1</sub>, v<sub>2</sub>, v<sub>3</sub>",
                        desc: "Outlines a triangle with the provided vertices."
                    }),
                    new DocNode([], {
                        type: "fn",
                        name: "c.stroke(...).line",
                        param: "(x<sub>0</sub>, y<sub>0</sub>, x<sub>1</sub>, y<sub>1</sub>) or (v<sub>0</sub>, v<sub>1</sub>) or (line)",
                        desc: "Draws a line with the provided vertices."
                    }),
                    new DocNode([], {
                        type: "fn",
                        name: "c.stroke(...).shape",
                        param: "...vertices",
                        desc: "Outlines a polygon with the provided vertices."
                    })
                ], {
                    type: "tl",
                    name: "Simple"
                }),
                new DocNode([
                    new DocNode([], {
                        type: "fn",
                        name: "c.stroke(...).ellipse",
                        param: "x, y, r<sub>x</sub>, r<sub>y</sub>",
                        desc: "Outlines an ellipse with a center at (x, y), with the provided radii."
                    }),
                    new DocNode([], {
                        type: "fn",
                        name: "c.stroke(...).sector",
                        param: "x, y, r, θ<sub>0</sub>, θ<sub>1</sub>, counter-clockwise",
                        desc: "Outlines a pie slice / sector of a circle centered at (x, y) with the provided radius, spanning the provided angular range. If counter-clockwise is true, the direction around the circle the sector will go from θ<sub>0</sub> to θ<sub>1</sub> is counter-clockwise."
                    }),
                    new DocNode([], {
                        type: "fn",
                        name: "c.stroke(...).text",
                        param: "font, text, x, y, pack-width",
                        desc: "Outlines the provided text in the provided font at (x, y). The text will be wrapped around if it exceeds the provided pack-width."
                    }),
                    new DocNode([], {
                        type: "fn",
                        name: "c.stroke(...).arrow",
                        param: "(x<sub>0</sub>, y<sub>0</sub>, x<sub>1</sub>, y<sub>1</sub>) or (v<sub>0</sub>, v<sub>1</sub>) or (line)",
                        desc: "Draws an arrow from the first point to the second point."
                    })
                ], {
                    type: "tl",
                    name: "Complex"
                }),
                new DocNode([], {
                    type: "fn",
                    name: "c.stroke",
                    param: "color, lineWidth = 1, lineCap = \"flat\"",
                    desc: "Acts as a prefix to outlining a later specified shape with the provided color, line width, and line cap (flat or round). "
                })
            ], {
                type: "tl",
                name: "Outlined"
            }),
            new DocNode([
                new DocNode([
                    new DocNode([], {
                        type: "fn",
                        name: "c.image(...).rect",
                        param: "(x, y, w, h) or (rect)",
                        desc: "Fills with an image a rectangle with an upper-left corner at (x, y), with the provided dimensions."
                    }),
                    new DocNode([], {
                        type: "fn",
                        name: "c.image(...).circle",
                        param: "(x, y, r) or (circle)",
                        desc: "Fills with an image a circle with an center at (x, y), with the provided radius."
                    }),
                    new DocNode([], {
                        type: "fn",
                        name: "c.image(...).triangle",
                        param: "v<sub>1</sub>, v<sub>2</sub>, v<sub>3</sub>",
                        desc: "Fills with an image a triangle with the provided vertices."
                    }),
                    new DocNode([], {
                        type: "fn",
                        name: "c.image(...).shape",
                        param: "...vertices",
                        desc: "Fills with an image a polygon with the provided vertices."
                    })
                ], {
                    type: "tl",
                    name: "Simple"
                }),
                new DocNode([
                    new DocNode([], {
                        type: "fn",
                        name: "c.image(...).ellipse",
                        param: "x, y, r<sub>x</sub>, r<sub>y</sub>",
                        desc: "Fills with an image an ellipse with a center at (x, y), with the provided radii."
                    }),
                    new DocNode([], {
                        type: "fn",
                        name: "c.image(...).sector",
                        param: "x, y, r, θ<sub>0</sub>, θ<sub>1</sub>, counter-clockwise",
                        desc: "Fills with an image a pie slice / sector of a circle centered at (x, y) with the provided radius, spanning the provided angular range. If counter-clockwise is true, the direction around the circle the sector will go from θ<sub>0</sub> to θ<sub>1</sub> is counter-clockwise."
                    })
                ], {
                    type: "tl",
                    name: "Complex"
                }),
                new DocNode([], {
                    type: "fn",
                    name: "c.image",
                    param: "image",
                    desc: "Acts as a prefix to filling a later specified shape with the provided image."
                }),
                new DocNode([], {
                    type: "fn",
                    name: "c.drawAnimation",
                    param: "animation, (x, y, w, h) or (rect), advance = true",
                    desc: "Draws the specified animation at the provided rectangle. If advance is true, the internal time of the animation is incremented."
                })
            ], {
                type: "tl",
                name: "Image"
            }),
            new DocNode([
                new DocNode([
                    new DocNode([], {
                        type: "fn",
                        name: "c.translate",
                        param: "(o<sub>x</sub>, o<sub>y</sub>) or (offset)",
                        desc: "Moves the origin of the canvas by the specified offset."
                    }),
                    new DocNode([], {
                        type: "fn",
                        name: "c.rotate",
                        param: "θ",
                        desc: "Rotates the canvas about the origin of the canvas by θ."
                    }),
                    new DocNode([], {
                        type: "fn",
                        name: "c.scale",
                        param: "x<sub>s</sub>, y<sub>s</sub>",
                        desc: "Scales the canvas about the origin on the x and y axes by the provided values."
                    })
                ], {
                    type: "tl",
                    name: "General"
                }),
                new DocNode([
                    new DocNode([], {
                        type: "fn",
                        name: "c.drawWithAlpha",
                        param: "alpha, draw()",
                        desc: "Calls the specified draw routine with the specified transparency."
                    }),
                    new DocNode([
                        new DocNode([
                            new DocNode([], {
                                type: "pr",
                                name: "s.display",
                                desc: "A Rect object containing the location and dimensions of the camera."
                            }),
                            new DocNode([], {
                                type: "pr",
                                name: "s.viewRotation",
                                desc: "The rotation of the camera."
                            }),
                            new DocNode([
                                new DocNode([], {
                                    type: "pr",
                                    name: "s.zoom",
                                    desc: "The amount of scaling applied by the camera"
                                }),
                                new DocNode([], {
                                    type: "fn",
                                    name: "s.zoomIn",
                                    param: "amount",
                                    desc: "Zooms in by the specified amount"
                                }),
                                new DocNode([], {
                                    type: "fn",
                                    name: "s.zoomOut",
                                    param: "amount",
                                    desc: "Zooms out by the specified amount"
                                })
                            ], {
                                type: "tl",
                                name: "Zoom",
                            }),
                        ], {
                            type: "tl",
                            name: "Change Camera Location"
                        }),
                        new DocNode([
                            new DocNode([], {
                                type: "fn",
                                name: "s.drawInWorldSpace",
                                param: "draw()",
                                desc: "Calls the specified draw routine in world space (if in screen space)."
                            }),
                            new DocNode([], {
                                type: "fn",
                                name: "s.drawInScreenSpace",
                                param: "draw()",
                                desc: "Calls the specified draw routine in screen space (if in world space)."
                            }),
                            new DocNode([], {
                                type: "fn",
                                name: "s.screenSpaceToWorldSpace",
                                param: "point",
                                desc: "If the specified point is in screen space, this will return the corresponding point in world space, that when drawn in world space, will be at the provided point."
                            }),
                        ], {
                            type: "tl",
                            name: "Use Camera Location"
                        })
                    ], {
                        type: "tl",
                        name: "World Space",
                    })
                ], {
                    type: "tl",
                    name: "Specific"
                })
            ], {
                type: "tl",
                name: "Context Modifications"
            })
        ], {
            type: "tl",
            name: "Manipulate"
        })
    ], {
        type: "tl",
        name: "Rendering"
    })
]);
