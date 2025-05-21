#pragma once

#include <concepts>
#include <vector>

#include "../Global.hpp"

template <int S> requires (S > 0)
API_TEMPLATE class VectorN {
	private:
		double elements[S];
		
	public:
		template <std::convertible_to<double>... T> requires (sizeof...(T) == S)
		VectorN(T... args) {
			double values[] { (double)args... };
			for (int i = 0; i < (int)sizeof...(T); i++)
				elements[i] = values[i];
		}

		template <int S2> requires (S2 <= S)
		VectorN(const VectorN<S2>& other)
		: VectorN() {
			for (int i = 0; i < S2; i++)
				elements[i] = other[i];
		}

		explicit VectorN(double value) {
			for (int i = 0; i < S; i++)
				elements[i] = value;
		}

		API VectorN()
		: VectorN(0.0) { }

		explicit VectorN(const double* values) {
			for (int i = 0; i < S; i++)
				elements[i] = values[i];
		}

		bool operator ==(const VectorN& other) const {
			for (int i = 0; i < S; i++)
				if (!equals(elements[i], other[i]))
					return false;
			return true;
		}

		explicit operator bool() const {
			for (int i = 0; i < S; i++)
				if (elements[i]) return true;
			return false;
		}

		API double get(int index) const {
			return elements[index];
		}

		API void set(int index, double value) {
			elements[index] = value;
		}

		double operator [](int index) const {
			return elements[index];
		}

		double& operator [](int index) {
			return elements[index];
		}

		VectorN operator -() const {
			VectorN result;
			for (int i = 0; i < S; i++)
				result[i] = -elements[i];
			return result;
		}

		VectorN& operator +=(const VectorN& other) {
			for (int i = 0; i < S; i++)
				elements[i] += other[i];
			return *this;
		}

		VectorN& operator +=(double other) {
			for (int i = 0; i < S; i++)
				elements[i] += other;
			return *this;
		}

		template <typename T>
		VectorN operator +(const T& other) const {
			return VectorN(*this) += other;
		}

		template <typename T>
		VectorN& operator -=(const T& other) {
			return *this += -other;
		}

		template <typename T>
		VectorN operator -(const T& other) const {
			return VectorN(*this) -= other;
		}

		VectorN& operator *=(double other) {
			for (int i = 0; i < S; i++)
				elements[i] *= other;
			return *this;
		}

		VectorN operator *(double other) const {
			return VectorN(*this) *= other;
		}

		VectorN& operator /=(double other) {
			return *this *= 1.0 / other;
		}

		VectorN& operator /=(const VectorN& other) {
			for (int i = 0; i < S; i++)
				elements[i] /= other[i];
			return *this;
		}

		template <typename T>
		VectorN operator /(const T& other) const {
			return VectorN(*this) /= other;
		}

		double sqrMag() const {
			double result = 0.0;
			for (int i = 0; i < S; i++)
				result += std::pow(elements[i], 2);
			return result;
		}

		double mag() const {
			return std::sqrt(sqrMag());
		}

		VectorN<2> normal() const {
			return { -elements[1], elements[0] };
		}

		VectorN& normalize() {
			double m = mag();
			if (equals(m, 0.0)) m = 1.0;
			return *this /= m;
		}

		VectorN normalized() const {
			return VectorN(*this).normalize();
		}

		VectorN projectOnto(const VectorN& axis) const {
			return axis * dot(*this, axis) / axis.sqrMag();
		}

		VectorN without(const VectorN& axis) const {
			return *this - projectOnto(axis);
		}

		double sum() const {
			double result = 0.0;
			for (int i = 0; i < S; i++)
				result += elements[i];
			return result;
		}

		double product() const {
			double result = 1.0;
			for (int i = 0; i < S; i++)
				result *= elements[i];
			return result;
		}

		template <int B, int E> requires (B >= 0 && E > B && E <= S)
		VectorN<E - B> slice() const {
			VectorN<E - B> result;
			for (int i = B; i < E; i++)
				result[i - B] = elements[i];
			return result;
		}

		explicit operator double() const requires (S == 1) {
			return elements[0];
		}

		static VectorN min(const VectorN& a, const VectorN& b) {
			VectorN result;
			for (int i = 0; i < S; i++)
				result[i] = std::min(a[i], b[i]);
			return result;
		}

		static VectorN max(const VectorN& a, const VectorN& b) {
			VectorN result;
			for (int i = 0; i < S; i++)
				result[i] = std::max(a[i], b[i]);
			return result;
		}

		static VectorN clamp(const VectorN& value, const VectorN& a, const VectorN& b) {
			return max(a, min(b, value));
		}

#if IS_3D
		API void setAll(double x, double y, double z) {
			elements[0] = x;
			elements[1] = y;
			elements[2] = z;
		}

		API static VectorN<3> build(double x, double y, double z) {
			return { x, y, z };
		}
#else
		API void setAll(double x, double y) {
			elements[0] = x;
			elements[1] = y;
		}

		API static VectorN<2> build(double x, double y) {
			return { x, y };
		}
#endif

		friend std::ostream& operator <<(std::ostream& out, const VectorN& v) {
			out << "(" >> v[0];
			for (int i = 1; i < S; i++)
				out << ", " >> v[i];
			out << ")";
			return out;
		}
};

// 1D magnitude optimization
template <>
double VectorN<1>::mag() const {
	return std::abs(elements[0]);
}

using Vector1 = VectorN<1>;
using Vector2 = VectorN<2>;
using Vector3 = VectorN<3>;
using Vector4 = VectorN<4>;
API using Vector = VectorN<DIM>;

template <int S>
VectorN<S> operator*(double factor, const VectorN<S>& vec) {
	return vec * factor;
}

// products
double dot(double a, double b) {
	return a * b;
}

template <int S>
double dot(const VectorN<S>& a, const VectorN<S>& b) {
	double result = 0.0;
	for (int i = 0; i < S; i++)
		result += a[i] * b[i];
	return result;
}

double cross(double a, double b) {
	return 0.0;
}

double cross(const Vector2& a, const Vector2& b) {
	return a[0] * b[1] - a[1] * b[0];
}

Vector3 cross(const Vector3& a, const Vector3& b) {
	return {
		a[1] * b[2] - a[2] * b[1],
		a[2] * b[0] - a[0] * b[2],
		a[0] * b[1] - a[1] * b[0]
	};
}

using Cross = decltype(cross(std::declval<Vector>(), std::declval<Vector>()));

template <int S>
class std::hash<VectorN<S>> {
	private:
		std::hash<double> hash;

	public:
		size_t operator()(const VectorN<S>& vec) const {
			size_t result = hash(vec[0]);
			for (int i = 1; i < S; i++)
				result ^= hash(vec[i]);
			return result;
		}
};