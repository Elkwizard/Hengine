emcc $1.cpp -o $1.wasm -s STANDALONE_WASM -s WARN_ON_UNDEFINED_SYMBOLS=0 --no-entry -O3
node WASMtoJS.js $@