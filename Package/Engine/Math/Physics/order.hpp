#pragma once

#include <cmath>
#include <vector>

class OrderGenerator {
	private:
		double seed;

	public:
		OrderGenerator(double _seed) {
			seed = _seed;
		}
		double next() {
			seed++;
			double a = fmod(seed * 638835776.12849, 8.7890975);
			double b = fmod(a * 256783945.4758903, 2.567890);
			double r = fmod(abs(a * b * 382749.294873597), 1.0);
			return r;
		}

		template <typename T>
		void shuffle(std::vector<T>& arr) {
			for (int i = 0; i < arr.size(); i++) {
				int inx = floor(next() * arr.size());
				std::swap(arr[inx], arr[0]);
			}
		}
};