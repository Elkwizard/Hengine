#pragma once

#include <concepts>
#include <unordered_map>

#include "Vector.hpp"

template <int S>
class CoordN {
	private:
		int elements[S];

	public:
		template <std::convertible_to<int>... T> requires (sizeof...(T) == S)
		CoordN(T... coords) {
			int args[] { (int)coords... };
			for (int i = 0; i < S; i++)
				elements[i] = args[i];
		}

		explicit CoordN(const VectorN<S>& vec) {
			for (int i = 0; i < S; i++)
				elements[i] = std::floor(vec[i]);
		}

		CoordN() {
			for (int i = 0; i < S; i++)
				elements[i] = 0;
		}

		bool operator==(const CoordN& other) const {
			for (int i = 0; i < S; i++)
				if (elements[i] != other[i]) return false;
			return true;
		}

		int& operator[](int index) {
			return elements[index];
		}

		int operator[](int index) const {
			return elements[index];
		}

		explicit operator VectorN<S>() const {
			VectorN<S> result;
			for (int i = 0; i < S; i++)
				result[i] = elements[i];
			return result;
		}
};

using Coord2 = CoordN<2>;
using Coord3 = CoordN<3>;
using Coord = CoordN<DIM>;

template<>
class std::hash<Coord2> {
	public:
		size_t operator()(const Coord2& c) const {
			return (1478611 * c[0]) ^ (8689987 * c[1]);
		}
};

template<>
class std::hash<Coord3> {
	public:
		size_t operator()(const Coord3& c) const {
			return (1478611 * c[0]) ^ (8689987 * c[1]) ^ (115249 * c[2]);
		}
};

#if IS_3D
	#define ND_LOOP(v, min, max)\
	for (Coord v = (min); v[0] <= (max)[0]; v[0]++)\
	for (v[1] = (min)[1]; v[1] <= (max)[1]; v[1]++)\
	for (v[2] = (min)[2]; v[2] <= (max)[2]; v[2]++)
#else
	#define ND_LOOP(v, min, max)\
	for (Coord v = (min); v[0] <= (max)[0]; v[0]++)\
	for (v[1] = (min)[1]; v[1] <= (max)[1]; v[1]++)
#endif