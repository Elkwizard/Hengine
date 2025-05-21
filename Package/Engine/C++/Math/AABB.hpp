#pragma once

#include "Vector.hpp"
#include "Shadow.hpp"

class AABB {
	public:
		Vector min, max;

		AABB()
		: AABB(Vector(INFINITY), Vector(-INFINITY)) { }

		AABB(const Vector& _min, const Vector& _max) {
			min = _min;
			max = _max;
		}

		AABB(const Vector& value)
		: AABB(value, value) { }

		AABB(double radius)
		: AABB(Vector(-radius), Vector(radius)) { }

		AABB& operator +=(const Vector& displacement) {
			min += displacement;
			max += displacement;
			return *this;
		}

		AABB operator +(const Vector& displacement) const {
			return AABB(*this) += displacement;
		}

		AABB& operator -=(const Vector& displacement) {
			return *this += -displacement;
		}

		AABB operator -(const Vector& displacement) const {
			return AABB(*this) -= displacement;
		}

		double volume() const {
			return (max - min).product();
		}

		void add(const Vector& point) {
			for (int i = 0; i < DIM; i++) {
				double axis = point[i];
				if (axis < min[i]) min[i] = axis;
				else if (axis > max[i]) max[i] = axis;
			}
		}

		void add(const AABB& box) {
			add(box.min);
			add(box.max);
		}

		bool intersects(const AABB& other) const {
			for (int i = 0; i < DIM; i++) {
				if (!Shadow(min[i], max[i]).intersects(Shadow(other.min[i], other.max[i])))
					return false;
			}

			return true;
		}
};