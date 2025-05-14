#pragma once

#include "Vector.hpp"
#include "Orientation.hpp"

API class Transform {
	public:
		API_CONST Vector linear;
		API_CONST Orientation orientation;

		Transform(const Vector& _linear, const Orientation& _orientation) {
			linear = _linear;
			orientation = _orientation;
		}

		API Transform()
		: Transform({ }, { }) { }

		Transform& operator *=(const Transform& other) {
			linear += orientation * other.linear;
			orientation *= other.orientation;
			return *this;
		}

		Transform operator *(const Transform& other) const {
			return Transform(*this) *= other;
		}
		
		Vector operator *(const Vector& other) const {
			return linear + orientation * other;
		}
		
		Transform operator *=(double scale) {
			linear *= scale;
			orientation *= scale;
			return *this;
		}

		Transform operator *(double other) const {
			return Transform(*this) *= other;
		}

		Transform operator +=(const Transform& delta) {
			linear += delta.linear;
			orientation += delta.orientation;
			return *this;
		}

		Transform operator +(const Transform& delta) const {
			return Transform(*this) += delta;
		}

		Transform operator -=(const Transform& delta) {
			return *this += -delta;
		}

		Transform operator -(const Transform& delta) const {
			return Transform(*this) -= delta;
		}

		Transform operator -() const {
			return { -linear, -orientation };
		}

		Transform inverse() const {
			Orientation invOrientation = -orientation;
			return { invOrientation * -linear, invOrientation };
		}

		friend std::ostream& operator <<(std::ostream& out, const Transform& transf) {
			out << "Transform(" << transf.linear << ", " << transf.orientation.getRotation() << ")";
			return out;
		}
};