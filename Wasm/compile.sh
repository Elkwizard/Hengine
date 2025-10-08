# create bindings
src="$1"
dst="$2"
mkdir -p "$dst"
node Wasm/genBindings.mjs "$src" "$dst" ${@:3}

# load emsdk environment
source .env
originalPath="$(pwd)"
cd "$EMSDK_PATH"
source ./emsdk_env.sh
cd "$originalPath"

# compile and create buffer
emcc \
	"$dst/bindings.cpp" \
	-o "$dst/program.wasm" \
	-Wall \
	-sSTANDALONE_WASM \
	-sWARN_ON_UNDEFINED_SYMBOLS=0 \
	-sALLOW_MEMORY_GROWTH=1 \
	--no-entry \
	-std=c++20 \
	${@:3}
node Wasm/genBuffer "$dst"
rm "$dst/program.wasm" "$dst/bindings.cpp"