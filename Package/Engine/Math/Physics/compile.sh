physicsPath="Package/Engine/Math/Physics/Physics"
physicsSource="$(cat "$physicsPath.cpp")"

function compileDimension {
	printf "#define DIM $1\n$physicsSource" > "$physicsPath$1.cpp"
	Wasm/compile.sh "$physicsPath$1" -O3
}

compileDimension 2
compileDimension 3