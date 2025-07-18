#pragma once

#include "Complex.hpp"
#include "Matrix.hpp"

API using Rotation = IF_3D(Vector, double);

API class Orientation {
	private:
		Complex complex;
		Rotation rotation;

		Orientation(const Complex& _complex, const Rotation& _rotation) {
			complex = _complex;
			rotation = _rotation;
		}

		static double normalizeAngle(double angle) {
			// equivalent to std::atan2(std::cos(angle), std::sin(angle));
			return mod(angle - PI, 2 * PI) - PI;
		}

	public:
		Orientation()
		: Orientation({ 1.0, {} }, Rotation(0.0)) { }

		bool operator ==(const Orientation& other) const {
			return complex == other.complex;
		}

		Orientation operator -() const {
			return { complex.conjugate(), -rotation };
		}

		Orientation& operator *=(const Orientation& other) {
			complex *= other.complex;
			
#if IS_3D
				double mag = complex.imag.mag();
				double phi = std::atan2(mag, complex.real);
				rotation = 2.0 * phi * complex.imag;
				if (mag > EPSILON) rotation /= mag;
#else
				rotation = normalizeAngle(rotation + other.rotation);
#endif

			return *this;
		}

		Orientation operator *(const Orientation& other) const {
			return Orientation(*this) *= other;
		}

		Orientation& operator +=(const Orientation& other) {
			return *this = other * *this;
		}

		Orientation operator +(const Orientation& other) const {
			return Orientation(*this) += other;
		}

		Orientation& operator -=(const Orientation& other) {
			return *this += -other;
		}

		Orientation operator -(const Orientation& other) const {
			return Orientation(*this) += other;
		}
		
		Orientation& operator *=(double scale) {
			setRotation(getRotation() * scale);
			return *this;
		}
		
		Orientation operator *(double scale) const {
			return Orientation(*this) *= scale;
		}

		explicit Orientation(const Rotation& rotation) {
			setRotation(rotation);
		}

		API const Rotation& getRotation() const {
			return rotation;
		}

#if IS_3D
		Vector operator *(const Vector& vec) const {
			auto [real, imag] = complex;
			return (real * real - imag.sqrMag()) * vec + (2.0 * dot(imag, vec) * imag + 2.0 * real * cross(imag, vec));
		}
		
		API void setRotation(const Rotation& _rotation) {
			rotation = _rotation;
			double mag = rotation.mag();
			if (mag > EPSILON) {
				Vector axis = rotation / mag;
				double phi = mag * 0.5;
				complex = { std::cos(phi), axis * std::sin(phi) };
			} else {
				complex = { 1.0, {} };
			}
		}

		Matrix toMatrix() const {
			return {
				*this * Vector(1, 0, 0),
				*this * Vector(0, 1, 0),
				*this * Vector(0, 0, 1)
			};
		}
#else

		Vector operator *(const Vector& vec) const {
			auto [real, imag] = complex;
			return {
				real * vec[0] - imag * vec[1],
				real * vec[1] + imag * vec[0]
			};
		}

		API void setRotation(const Rotation& _rotation) {
			rotation = _rotation;
			complex = { std::cos(rotation), std::sin(rotation) };
		}

		Matrix toMatrix() const {
			return {
				*this * Vector(1, 0),
				*this * Vector(0, 1)
			};
		}
#endif
		friend std::ostream& operator <<(std::ostream& out, const Orientation& orientation) {
			out << orientation.getRotation() << "{" << orientation.complex << "}";
			return out;
		}
};
