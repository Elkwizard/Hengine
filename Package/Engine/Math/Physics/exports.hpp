#pragma once

#ifdef __INTELLISENSE__
	#define EMSCRIPTEN_KEEPALIVE 
#else
	#include "emscripten.h"
#endif

extern "C" void printInt(long);
extern "C" void printFloat(double);
extern "C" void printLn();
extern "C" void fullExit();

template <std::integral T>
void printElement(T value) {
	printInt(value);
}

template <std::floating_point T>
void printElement(T value) {
	printFloat(value);
}

template <typename F, typename... T>
void print(F first, T... rest) {
	printElement(first);
	if constexpr (sizeof...(T) > 0)
		print(rest...);
	printLn();
}

#define EXPORT extern "C" EMSCRIPTEN_KEEPALIVE

// for JS API
#define ACCESS(class, prop, type) EXPORT type class##$##type##$get_##prop(class* obj) { return obj->prop; }\
								  EXPORT void class##$void$set_##prop(class* obj, type value) { obj->prop = value; }
#define OBJECT_ACCESS(class, prop, type) EXPORT type* class##$##type##$get_##prop(class* obj) { return &obj->prop; }\
										 EXPORT void class##$void$set_##prop(class *obj, type* value) { obj->prop = *value; }

#define FN(class, prop, type) EXPORT type class##$##type##$##prop
#define OBJECT_FN(class, prop, type) EXPORT type* class##$##type##$##prop
#define STATIC_FN(class, prop, type) EXPORT type class##$##type##$##prop##$##static
#define STATIC_OBJECT_FN(class, prop, type) EXPORT type* class##$##type##$##prop##$##static
#define FN_NO(class, prop) EXPORT void class##$void$##prop(class* obj) { obj->prop(); }

#define GETTER(class, prop, type) FN(class, get_##prop, type)(class* object)
#define SETTER(class, prop, type) FN(class, set_##prop, void)(class* object, type value)
#define OBJECT_GETTER(class, prop, type) OBJECT_FN(class, get_##prop, type)(class* object)
#define OBJECT_SETTER(class, prop, type) OBJECT_FN(class, set_##prop, void)(class* object, type value)

#define CONSTRUCT(class) STATIC_OBJECT_FN(class, construct, class)
#define FREE(class) FN(class, free, void)(class* obj) { delete obj; }

using ID = unsigned int;

ID nextID() {
	static ID next = 0;
	return next++;
}

#include <vector>

template <typename T>
class NativeArray {
	public:
		std::vector<T> data;

		NativeArray(const std::vector<T>& arr) {
			data = arr;
		}

		NativeArray(int length) {
			data.resize(length);
		}

		int getLength() const {
			return data.size();
		}

		void set(int index, const T& value) {
			data[index] = value;
		}

		T& get(int index) {
			return data[index];
		}
};

template <typename A, typename B>
auto min(const A& a, const B& b) {
	return a < b ? a : b;
}

template <typename A, typename B>
auto max(const A& a, const B& b) {
	return a > b ? a : b;
}

template <typename A, typename B, typename C>
auto clamp(const A& n, const B& a, const C& b) {
	return max(a, min(b, n));
}

template <typename A>
int sign(const A& a) {
	return (a > 0) - (a < 0);
}