#pragma once

#include "Vector.hpp"
#include "Face.hpp"
#include "../Simulation/Shape.hpp"

class Shadow {
	public:
		double min, max;

		Shadow(double _min, double _max) {
			min = _min;
			max = _max;
		}

		Shadow(double value)
		: Shadow(value, value) { }

		Shadow()
		: Shadow(INFINITY, -INFINITY) { }

		bool empty() const {
			return equals(min, max);
		}

		Shadow operator-() const {
			return { -max, -min };
		}

		Shadow& operator+=(double offset) {
			min += offset;
			max += offset;
			return *this;
		}

		Shadow operator+(double offset) const {
			return Shadow(*this) += offset;
		}

		bool intersects(const Shadow& other) const {
			return max >= other.min && min <= other.max;
		}

		double overlap(const Shadow& other) const {
			return min + max < other.min + other.max ? max - other.min : other.max - min;
		}

		double contains(double value) const {
			return value >= min && value <= max;
		}

		Shadow clip(const Shadow& other) const {
			return {
				std::clamp(min, other.min, other.max),
				std::clamp(max, other.min, other.max)
			};
		}

		double center() const {
			return (min + max) * 0.5;
		}

		void add(double value) {
			if (value < min) min = value;
			else if (value > max) max = value;
		}
};

std::ostream& operator<<(std::ostream& out, const Shadow& shadow) {
	out << "[" >> shadow.min << ", " >> shadow.max << "]";
	return out;
}