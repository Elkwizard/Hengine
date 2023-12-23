#pragma once

#include <cmath>
#include <vector>

class OrderGenerator {
	private:
		uint64_t seed;
		
		uint64_t next(uint64_t length) {
			seed++;
			seed ^= seed << 7;
			seed ^= seed >> 9;
			seed ^= seed << 13;
			seed -= 192834821ull;
			seed ^= seed << 7;
			seed ^= seed >> 9;
			seed ^= seed << 13;
			return seed % length;
			// seed++;
			// double a = fmod(seed * 638835776.12849, 8.7890975);
			// double b = fmod(a * 256783945.4758903, 2.567890);
			// double r = fmod(abs(a * b * 382749.294873597), 1.0);
			// return floor(r * length);
		}

	public:
		OrderGenerator(uint64_t _seed) {
			seed = _seed;
		}

		template <typename T>
		void shuffle(std::vector<T>& arr) {
			for (int i = 0; i < arr.size(); i++)
				std::swap(arr[next(arr.size())], arr[0]);
		}
};