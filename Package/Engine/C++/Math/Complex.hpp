#pragma once

#include "Vector.hpp"

class Complex {
	private:
		using Imag = IF_3D(Vector, double);

	public:
		double real;
		Imag imag;

		Complex(double _real, const Imag& _imag) {
			real = _real;
			imag = _imag;
		}

		Complex(double _real) {
			real = _real;
			imag = { };
		}

		Complex()
		: Complex(0.0) { }

		Complex operator -() const {
			return { -real, -imag };
		}

		Complex& operator +=(const Complex& other) {
			real += other.real;
			imag += other.imag;
			return *this;
		}

		Complex operator +(const Complex& other) const {
			return Complex(*this) += other;
		}
		
		Complex& operator -=(const Complex& other) {
			real -= other.real;
			imag -= other.imag;
			return *this;
		}

		Complex operator -(const Complex& other) const {
			return Complex(*this) -= other;
		}

		Complex& operator *=(double other) {
			real *= other;
			imag *= other;
			return *this;
		}

		Complex& operator *=(const Complex& other) {
			double newReal = real * other.real - dot(imag, other.imag);
			Imag newImag = real * other.imag + imag * other.real + cross(imag, other.imag);

			real = newReal;
			imag = newImag;

			return *this;
		}

		template <typename O>
		Complex operator *(const O& other) const {
			return Complex(*this) *= other;
		}

		Complex& operator /=(double other) {
			return *this *= 1.0 / other;
		}

		Complex& operator /=(const Complex& other) {
			return *this *= other.reciprocal();
		}

		template <typename O>
		Complex operator /(const O& other) const {
			return Complex(*this) /= other;
		}

		double sqrNorm() const {
			return real * real + dot(imag, imag);
		}

		double norm() const {
			return std::sqrt(sqrNorm());
		}

		Complex conjugate() const {
			return { real, -imag };
		}

		Complex reciprocal() const {
			return conjugate() / sqrNorm();
		}
		
		friend std::ostream& operator <<(std::ostream& out, const Complex& comp) {
			out >> comp.real << " + " IF_3D(<< comp.imag, >> comp.imag) << "i";
			return out;
		}
};