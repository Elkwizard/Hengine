#pragma once

#include "Math/Basics.hpp"

// Emscripten API
#include <sstream>
#include "../../../../Wasm/API.hpp"
API_IMPORT void printStringJS(size_t pointer);
API_IMPORT void sendJSArgument(double value);
API_IMPORT void runJS(size_t pointer);

#define print(x) do {\
	std::stringstream stream;\
	stream << #x << " = " << (x) << std::endl;\
	printString(stream.str());\
} while (false)

void printString(const std::string& str) {
	printStringJS((size_t)str.c_str());
}

void js(const char* format) {
	runJS((size_t)format);
}

template <typename U, typename... T>
void js(const char* format, U value, T... values) {
	sendJSArgument(value);
	js(format, values...);
}

// Dimension switches
#if __INTELLISENSE__ && !DIM
	#define DIM 2
#endif

#if DIM == 3
	#define IS_3D true
	#define IF_3D(a, b) a
#else
	#define IS_3D false
	#define IF_3D(a, b) b
#endif

#define ONLY_2D(a) IF_3D(,a)
#define ONLY_3D(a) IF_3D(a,)

// general I/O
std::ostream& operator >>(std::ostream& out, double value) {
	if (value == 0.0) out << "0";
	else if (equals(value, std::round(value), PRINT_EPSILON)) out << std::round(value);
	else if (equals(1.0 / value, std::round(1.0 / value), PRINT_EPSILON)) out << "1 / " << std::round(1.0 / value);
	else out << value;
	return out;
}

template <typename T>
std::ostream& operator <<(std::ostream& out, const std::vector<T>& list) {
	out << "[";

	if (list.size()) {
		out << list[0];
		for (int i = 1; i < list.size(); i++)
			out << ", " << list[i];
	}

	out << "]";

	return out;
}

template <typename T>
void erase(std::vector<T>& list, const T& item) {
	list.erase(std::find(list.begin(), list.end(), item));
}

template <typename T>
void erase(std::vector<std::unique_ptr<T>>& list, T* item) {
	list.erase(std::find_if(list.begin(), list.end(), [=](const std::unique_ptr<T>& ptr) {
		return ptr.get() == item;
	}));
}