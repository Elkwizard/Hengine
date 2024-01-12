emcc $1.cpp -o $1.wasm -sSTANDALONE_WASM -sWARN_ON_UNDEFINED_SYMBOLS=0 -sALLOW_MEMORY_GROWTH=1 --no-entry -std=c++20 -O3 -g
node WASMtoJS.js $@