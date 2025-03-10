#pragma once

#include <cmath>

#include "global.hpp"

// Vector
API class Vector {
	public:
		API double x;
		API double y;

		API Vector(double _x, double _y) {
			x = _x;
			y = _y;
		}

		Vector(double v) {
			x = v;
			y = v;
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

		API void set(double _x, double _y) {
			x = _x;
			y = _y;
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

		API static double dist(const Vector& a, const Vector& b) {
			return hypot(b.x - a.x, b.y - a.y);
		}
};