#pragma once

#include <cmath>
#include <concepts>
#include <vector>
#include <numeric>
#include <type_traits>

constexpr double PI = 3.1415926535897932;
constexpr double PRINT_EPSILON = 1e-11;
constexpr double EPSILON = 1e-4;

template <typename T>
concept Number = std::floating_point<T> || std::integral<T>;

template <Number T>
T sign(T x) {
	return (x > T(0)) - (x < T(0));
}

double mod(double x, double y) {
	return std::fmod(x, y) + (x < 0 ? y : 0);
}

constexpr bool equals(double a, double b, double eps = EPSILON) {
	return std::abs(a - b) < eps;
}

constexpr int factorial(int a) {
	return a <= 1 ? 1 : a * factorial(a - 1);
}

constexpr int raiseTo(int a, int b) {
	return b == 0 ? 1 : a * raiseTo(a, b - 1);
}

template <typename T>
constexpr auto average(const T& list) {
	std::decay_t<decltype(*list.begin())> result;
	for (const auto& val : list)
		result += val;
	return result / list.size();
}

std::vector<int> indices(int count) {
	std::vector<int> result (count);
	for (int i = 0; i < count; i++)
		result[i] = i;
	return result;
}