physicsPath="Package/Engine/C++/Physics/Physics"

function compileDimension {
	Wasm/compile.sh "$physicsPath" "$physicsPath$1" -DDIM=$1 -O3
}

compileDimension 2
compileDimension 3