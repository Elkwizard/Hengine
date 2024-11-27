mkdir -p $1
node Wasm/genBuffer $1 &
node Wasm/genBindings $1 &
wait
emcc \
	"$1/bindings.cpp" \
	-o "$1.wasm" \
	-sSTANDALONE_WASM \
	-sWARN_ON_UNDEFINED_SYMBOLS=0 \
	-sALLOW_MEMORY_GROWTH=1 \
	--no-entry \
	-std=c++20 \
	-O3