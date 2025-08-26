#pragma once

#include <algorithm>
#include <array>

#include "../../Math/Matrix.hpp"
#include "../../Math/Ray.hpp"

template <size_t N>
class LineN {
	private:
		using Vector = VectorN<N>;

	public:
		Vector start, end;

		LineN(const Vector& _start, const Vector& _end) {
			start = _start;
			end = _end;
		}

		LineN(const std::array<Vector, 2>& points)
		: LineN(points[0], points[1]) { }

		Vector point() const {
			return start;
		}

		Vector midpoint() const {
			return (start + end) * 0.5;
		}

		Vector vector() const {
			return end - start;
		}

		Vector normal() const {
			return vector().normal().normalize();
		}

		double distance() const {
			return dot(start, normal());
		}

		LineN& operator +=(const Vector& offset) {
			start += offset;
			end += offset;
			return *this;
		}
		
		LineN operator +(const Vector& offset) const {
			return LineN(*this) += offset;
		}
		
		LineN& operator -=(const Vector& offset) {
			return *this += -offset;
		}

		LineN operator -(const Vector& offset) const {
			return LineN(*this) -= offset;
		}

		Vector closestPointTo(const Vector& point) const {
			Vector diff = vector();
			double t = dot(point - start, diff) / diff.sqrMag();
			return start + std::clamp(t, 0.0, 1.0) * diff;
		}

		double raycast(const Ray& ray) const;
};

using Line = LineN<DIM>;

class Plane {
	public:
		Vector normal;
		double distance;

		Plane(const Vector& _normal, double _distance) {
			normal = _normal;
			distance = _distance;
		}

		Plane operator -() const {
			return { -normal, -distance };
		}

		bool operator ==(const Plane& other) const {
			return normal == other.normal && equals(distance, other.distance);
		}

		friend std::ostream& operator <<(std::ostream& out, const Plane& plane) {
			out << "p * " << plane.normal << " = " >> plane.distance;
			return out;
		}
};

template <>
class std::hash<Plane> {
	private:
		std::hash<double> doubleHash;
		std::hash<Vector> vectorHash;

	public:
		size_t operator()(const Plane& plane) const {
			return vectorHash(plane.normal) ^ doubleHash(round(plane.distance / EPSILON) * EPSILON);
		}
};

#if IS_3D
class Triangle {
	public:
		Vector a, b, c;

		Triangle(const Vector& _a, const Vector& _b, const Vector& _c) {
			a = _a;
			b = _b;
			c = _c;
		}

		Triangle(const std::array<Vector, 3>& points)
		: Triangle(points[0], points[1], points[2]) { }
		
		Vector normal() const {
			return cross(c - a, b - a).normalize();
		}

		Vector point() const {
			return a;
		}

		Vector midpoint() const {
			return (a + b + c) / 3.0;
		}

		double distance() const {
			return dot(a, normal());
		}

		Triangle& operator +=(const Vector& offset) {
			a += offset;
			b += offset;
			c += offset;
			return *this;
		}
		
		Triangle& operator -=(const Vector& offset) {
			return *this += -offset;
		}
		
		Triangle operator +(const Vector& offset) const {
			return Triangle(*this) += offset;
		}

		Triangle operator -(const Vector& offset) const {
			return Triangle(*this) -= offset;
		}

		Vector closestPointTo(const Vector& point) const {
			Vector result = point;
			result -= a;

			Matrix mat { c - a, b - a, normal() };
			Vector t = *mat.applyInverseTo(result);
			t[0] = std::max(0.0, t[0]);
			t[1] = std::max(0.0, t[1]);
			t[2] = 0;

			result = a + mat * t;

			if (t[0] > 1 || t[1] > 1 || t[1] > 1 - t[0])
				return Line(b, c).closestPointTo(result);

			return result;
		}

		double raycast(const Ray& ray) const;
};
#endif

using Face = IF_3D(Triangle, Line);

ONLY_2D(template <>) // since Line is a specific template instance 
double Face::raycast(const Ray& ray) const {
	Vector away = normal();
	double rate = dot(ray.direction, away);
	if (equals(rate, 0)) return -1;

	float t = dot(point() - ray.origin, away) / rate;
	if (t < 0) return -1;

	Vector projected = ray.atDistance(t);
	if (closestPointTo(projected) != projected) return -1;

	return t;
}