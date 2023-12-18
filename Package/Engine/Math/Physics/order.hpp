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