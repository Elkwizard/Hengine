#pragma once

#include "../../../../Wasm/api.hpp"

API_IMPORT void printInt(long);
API_IMPORT void printFloat(double);
API_IMPORT void printLn();
API_IMPORT void fullExit();

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

API using ID = unsigned int;

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