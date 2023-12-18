#pragma once

#include "exports.hpp"
#include <cmath>

// Vector
class Vector {
	public:
		double x;
		double y;

		Vector(double _x, double _y) {
			x = _x;
			y = _y;
		}

		Vector(double v) {
			x = v;
			y = v;
		}

		Vector(std::nullptr_t) {
			x = y = NAN;
		}

		Vector() {
			x = 0.0;
			y = 0.0;
		}

		bool operator ==(const Vector& other) const {
			return abs(x - other.x) < 0.0001 && abs(y - other.y) < 0.0001;
		}

		bool operator !=(const Vector& other) const {
			return !(*this == other);
		}

		operator bool() const {
			return !isnan(x);
		}

		double cross(const Vector& other) const {
			return x * other.y - y * other.x;
		}

		double dot(const Vector& other) const {
			return x * other.x + y * other.y;
		}
		
		double sqrMag() const {
			return dot(*this);
		}

		double mag() const {
			return sqrt(sqrMag());
		}

		Vector normal() const {
			return { -y, x };
		}

		Vector& normalize() {
			double m = mag();
			if (m) {
				x /= m;
				y /= m;
			}
			return *this;
		}

		Vector normalized() const {
			return Vector(*this).normalize();
		}

		Vector operator -() const {
			return { -x, -y };
		}

		Vector& operator +=(const Vector& other) {
			x += other.x;
			y += other.y;
			return *this;
		}

		Vector operator +(const Vector& other) const {
			return Vector(*this) += other;
		}

		Vector& operator -=(const Vector& other) {
			x -= other.x;
			y -= other.y;
			return *this;
		}

		Vector operator -(const Vector& other) const {
			return Vector(*this) -= other;
		}
		
		Vector& operator *=(double other) {
			x *= other;
			y *= other;
			return *this;
		}

		Vector operator *(double other) const {
			return Vector(*this) *= other;
		}
		
		Vector& operator /=(double other) {
			x /= other;
			y /= other;
			return *this;
		}

		Vector operator /(double other) const {
			return Vector(*this) /= other;
		}

		static Vector crossNV(double a, const Vector& b) {
			return { -a * b.y, a * b.x };
		}
};

CONSTRUCT(Vector)(double x, double y) { return new Vector(x, y); }
FREE(Vector);
ACCESS(Vector, x, double)
ACCESS(Vector, y, double)
FN(Vector, set, void)(Vector* v, double x, double y) {
	v->x = x;
	v->y = y;
}

using NativeVectorArray = NativeArray<Vector>;

CONSTRUCT(NativeVectorArray)(int size) { return new NativeVectorArray(size); }
FREE(NativeVectorArray)
EXPORT int NativeVectorArray$int$get_length(NativeVectorArray* arr) { return arr->getLength(); }
OBJECT_FN(NativeVectorArray, get, Vector)(NativeVectorArray* arr, int index) {
	return &arr->get(index);
}
FN(NativeVectorArray, set, void)(NativeVectorArray* arr, int index, Vector* v) {
	return arr->set(index, *v);
}