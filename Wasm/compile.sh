# create bindings
mkdir -p $1
node Wasm/genBindings.mjs $1

# load emsdk environment
source .env
originalPath="$(pwd)"
cd "$EMSDK_PATH"
source ./emsdk_env.sh
cd "$originalPath"

# compile and create buffer
emcc \
	"$1/bindings.cpp" \
	-o "$1/program.wasm" \
	-Wall \
	-sSTANDALONE_WASM \
	-sWARN_ON_UNDEFINED_SYMBOLS=0 \
	-sALLOW_MEMORY_GROWTH=1 \
	--no-entry \
	-std=c++20 \
	-O3
node Wasm/genBuffer $1