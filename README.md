# Hengine
The Hengine is a Javascript game engine for both small scale creative coding projects and larger scale games.

## Installation
The Hengine doesn't need to be installed. However, if you want to run code with a local copy of the Hengine (to preserve compatability), simply clone this repository.

```bash
git clone "https://www.github.com/Elkwizard/Hengine"
```

## Usage
Before using the Hengine, it must be included in your HTML file in one of two possible ways.

1. Including a script tag pointing to `Hengine/Package/Engine/Manage/Hengine.js`, and linking to an external main Javascript file.

    ```html
    app.html:

    <html>
        <head>
            <script src="https://elkwizard.github.io/Hengine/Package/Engine/Manage/Hengine.js"></script>
        </head>
        <body>
            <script>
                // Load Hengine, users main Javascript file is index.js in this example.
                HengineLoader.load([
                    new HengineScriptResource("index.js")
                ]);
            </script>
        </body>
    </html>
    ```
    ```js
    index.js:

    // Hengine hello world
    renderer.textMode = TextMode.CENTER_CENTER; // Text will be drawn relative to its center

    intervals.continuous(() => {
        renderer.draw(Color.BLACK).text(Font.Arial50, "Hello World!", middle); // Draw "Hello World" to the middle of the screen
    });
    ```

2. Including a script tag pointing to `Hengine/Hengine.js` with the main Javascript code embedded within.

    ```html
    compactApp.html:

    <script src="https://elkwizard.github.io/Hengine/Hengine.js">
        // Hengine hello world
        renderer.textMode = TextMode.CENTER_CENTER; // Text will be drawn relative to its center

        intervals.continuous(() => {
            renderer.draw(Color.BLACK).text(Font.Arial50, "Hello World!", middle); // Draw "Hello World" to the middle of the screen
        });
    </script>
    ```

## Examples
1. [Hello World Demo](https://elkwizard.github.io/Hengine/Demos/HelloWorld.html)
2. [Physics Demo](https://elkwizard.github.io/Hengine/Demos/Physics.html)
3. [Shader Demo](https://elkwizard.github.io/Hengine/Demos/Shader.html)

## Documentation

The documentation for the Hengine can be found [here](https://elkwizard.github.io/Hengine/Docs/Docs.html).