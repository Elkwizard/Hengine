#pragma once

#include <optional>

#include "Complex.hpp"

template <int R, int C = R> requires (R > 0 && C > 0)
API_TEMPLATE class MatrixRC {
	private:
		double elements[R * C] { };

		double sign(int index) const {
			return 1.0 - 2 * (index & 1);
		}

	public:
		template <std::convertible_to<double>... T> requires (sizeof...(T) == R * C)
		MatrixRC(T... args) {
			double values[] { (double)args... };
			for (int i = 0; i < R * C; i++)
				elements[i] = values[i];
		}

		template <std::same_as<VectorN<R>>... T> requires (sizeof...(T) == C)
		MatrixRC(T... args) {
			VectorN<R> columns[] { args... };
			for (int c = 0; c < C; c++)
			for (int r = 0; r < R; r++)
				(*this)[r][c] = columns[c][r];
		}
		
		MatrixRC(const double* values) {
			for (int i = 0; i < R * C; i++)
				elements[i] = values[i];
		}
		
		template <int R2, int C2>
		MatrixRC(const MatrixRC<R2, C2>& other)
		: MatrixRC() {
			for (int r = 0; r < R2; r++)
			for (int c = 0; c < C2; c++)
				(*this)[r][c] = other[r][c];
		}

		MatrixRC(double value) {
			if constexpr (R == C)
				for (int i = 0; i < R; i++)
					elements[i + i * C] = value;
		}

		API MatrixRC()
		: MatrixRC(1.0) { }

		MatrixRC(const MatrixRC& other) {
			for (int i = 0; i < R * C; i++)
				elements[i] = other.elements[i];
		}

		bool operator==(const MatrixRC& other) const {
			for (int i = 0; i < R * C; i++)
				if (elements[i] != other.elements[i])
					return false;
			return true;
		}

		API double get(int row, int column) const {
			return (*this)[row][column];
		}

		API void set(int row, int column, double value) {
			(*this)[row][column] = value;
		}

		const double* operator[](int row) const {
			return &elements[row * C];
		}

		double* operator[](int row) {
			return &elements[row * C];
		}
		
		VectorN<C> row(int row) const {
			VectorN<C> result;
			for (int i = 0; i < C; i++)
				result[i] = (*this)[row][i];
			return result;
		}

		VectorN<R> column(int column) const {
			VectorN<R> result;
			for (int i = 0; i < R; i++)
				result[i] = (*this)[i][column];
			return result;
		}

		MatrixRC& operator+=(const MatrixRC& other) {
			for (int i = 0; i < R * C; i++)
				elements[i] += other.elements[i];
			return *this;
		}

		MatrixRC operator+(const MatrixRC& other) const {
			return MatrixRC(*this) += other;
		}

		MatrixRC& operator-=(const MatrixRC& other) {
			for (int i = 0; i < R * C; i++)
				elements[i] -= other.elements[i];
			return *this;
		}

		MatrixRC operator-(const MatrixRC& other) const {
			return MatrixRC(*this) -= other;
		}

		MatrixRC& operator*=(double other) {
			for (int i = 0; i < R * C; i++)
				elements[i] *= other;
			return *this;
		}

		MatrixRC operator*(double other) const {
			return MatrixRC(*this) *= other;
		}

		MatrixRC& operator /=(double other) {
			return *this *= (1.0 / other);
		}

		MatrixRC operator /(double other) const {
			return MatrixRC(*this) /= other;
		}

		VectorN<R> operator*(const VectorN<C>& other) const {
			VectorN<R> result;

			for (int r = 0; r < R; r++) {
				double element = 0.0;
				for (int c = 0; c < C; c++)
					element += (*this)[r][c] * other[c];
				result[r] = element;
			}

			return result;
		}

		template <int S> requires (S == R - 1)
		VectorN<S> operator*(const VectorN<S>& other) const {
			static_assert(R == C, "Cannot perform homogenous multiplication with a non-square matrix");
			
			VectorN<R - 1> result;
			for (int r = 0; r < R - 1; r++) {
				double element = 0.0;
				for (int c = 0; c < C - 1; c++)
					element += (*this)[r][c] * other[c];
				result[r] = element + (*this)[r][C - 1];
			}

			return result;
		}

		std::optional<VectorN<R>> applyInverseTo(const VectorN<R>& other) const {
			std::optional<MatrixRC> inv = inverse();
			if (!inv) return { };
			return *inv * other;
		}

		template <int R2, int C2> requires (C == R2)
		MatrixRC<R, C2> operator*(const MatrixRC<R2, C2>& other) const {
			MatrixRC<R, C2> result;

			for (int r = 0; r < R; r++)
			for (int c = 0; c < C2; c++) {
				double element = 0.0;
				for (int k = 0; k < C; k++)
					element += (*this)[r][k] * other[k][c];
				result[r][c] = element;
			}

			return result;
		}
		
		double determinant() const {
			if constexpr (R != C)
				return 0.0;
			else if constexpr (R == 1)
				return elements[0];
			else {
				double result = 0.0;

				for (int i = 0; i < C; i++) {
					MatrixRC<R - 1, C - 1> minor;
					int outC = 0;
					for (int c = 0; c < C; c++) {
						if (c == i) continue;
						for (int r = 1; r < R; r++)
							minor[r - 1][outC] = (*this)[r][c];
						outC++;
					}
					result += sign(i) * elements[i] * minor.determinant();
				}

				return result;
			}
		}

		MatrixRC<C, R> transpose() const {
			MatrixRC<C, R> result;

			for (int r = 0; r < R; r++)
			for (int c = 0; c < C; c++)
				result[c][r] = (*this)[r][c];

			return result;
		}

		MatrixRC adjugate() const {
			static_assert(R == C, "Cannot find cofactors of a non-square matrix");

			if constexpr (R == 1) {
				return { 1 };
			} else {
				MatrixRC result;

				for (int r = 0; r < R; r++)
				for (int c = 0; c < C; c++) {
					MatrixRC<R - 1, C - 1> minor;
					for (int rr = 0, outR = 0; rr < R; rr++) {
						if (rr == r) continue;
						for (int cc = 0, outC = 0; cc < C; cc++) {
							if (cc == c) continue;
							minor[outR][outC] = (*this)[rr][cc];
							outC++;
						}
						outR++;
					}
					result[c][r] = sign(r + c) * minor.determinant();
				}

				return result;
			}
		}

		std::optional<MatrixRC> inverse() const {
			static_assert(R == C, "Cannot invert non-square matrix");
			double det = determinant();
			if (!det || std::isnan(det)) return { };
			return adjugate() * (1.0 / det);
		}

		MatrixRC concreteInverse() const {
			for (int r = 0; r < R; r++)
			for (int c = 0; c < R; c++)
				if (!std::isfinite((*this)[r][c]))
					return 0.0;
			
			std::optional<MatrixRC> inv = inverse();
			if (!inv) return INFINITY;
			return *inv;
		}

		explicit operator double() const requires (R == 1 && C == 1) {
			return elements[0];
		}

#if IS_3D
		static MatrixRC fromRotation(const Complex& quat) {
			static_assert(R == 3 && C == 3, "Quaternion rotation matrices must be 3x3");
			auto [r, v] = quat;
			MatrixRC scale = (r * r - v.sqrMag()) * MatrixRC();
			MatrixRC cross = r * MatrixRC::cross(v);
			MatrixRC dot { v[0] * v, v[1] * v, v[2] * v };
			return scale + 2.0 * (dot + cross);
		}
#else
		static MatrixRC fromRotation(double theta) {
			static_assert(R == 2 && C == 2, "Angular rotation matrices must be 2x2");
			double c = std::cos(theta);
			double s = std::sin(theta);

			return {
				c, -s,
				s, c
			};
		}
#endif
		static MatrixRC scale(const VectorN<R>& factor) {
			static_assert(R == C, "Cannot create non-square scaling matrix");
			MatrixRC result;
			for (int i = 0; i < R; i++)
				result[i][i] = factor[i];
			return result;
		}

		template <int S> requires (S == R - 1)
		static MatrixRC translate(const VectorN<S>& displacement) {
			MatrixRC result;

			for (int i = 0; i < S; i++)
				result[i][C - 1] = displacement[i];

			return result;
		}

		static MatrixRC cross(const VectorN<R>& vector) {
			static_assert(R == 3 && C == 3, "Cannot create a cross product matrix for a non-3D vector");

			double x = vector[0];
			double y = vector[1];
			double z = vector[2];

			return {
				0, -z, y,
				z, 0, -x,
				-y, x, 0
			};
		}
};

using Matrix1 = MatrixRC<1>;
using Matrix2 = MatrixRC<2>;
API using Matrix3 = MatrixRC<3>;
using Matrix4 = MatrixRC<4>;
using Matrix = MatrixRC<DIM>;

template <int R, int C>
MatrixRC<R, C> operator *(double factor, const MatrixRC<R, C>& mat) {
	return mat * factor;
}

template <int R, int C>
std::ostream& operator <<(std::ostream& out, const MatrixRC<R, C>& m) {
	out << "(\n";
	for (int r = 0; r < R; r++) {
		out << "  ";
		for (int c = 0; c < C; c++)
			out >> m[r][c] << "\t";
		out << "\n";
	}
	out << ")";
	return out;
}