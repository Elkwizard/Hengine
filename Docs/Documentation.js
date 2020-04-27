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
                    new DocNode([], { type: "fn", name: "s.changeElementDraw", param: "element, newDraw(name, shape)", desc: "Replaces the rendering function of the provided element with newDraw. This method will be called for each shape attached to the element" }),
                    new DocNode([], { type: "fn", name: "s.changeElementUpdate", param: "element, newUpdate()", desc: "Replaces the update function of the provided element with newUpdate. This method will be called each physics update (16ms)" })
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
        name: "SceneObject Management"
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
        name: "Rendering"
    })
]);
