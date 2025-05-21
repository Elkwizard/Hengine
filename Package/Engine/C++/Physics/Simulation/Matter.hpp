#pragma once

#include "../../Math/Orientation.hpp"

API using Inertia = IF_3D(Matrix3, double);

class Matter {
	public:
		static Matter STATIC;

		double mass, invMass;
		Inertia inertia, invInertia;
		bool inverses;

		Matter(double _mass, const Inertia& _inertia, bool _inverses = true) {
			mass = _mass;
			inertia = _inertia;
			inverses = _inverses;
			if (inverses) computeInverses();
		}
		
		Matter()
		: Matter(0.0, 0.0) { }

		explicit operator bool() const {
			return !equals(mass, 0.0);
		}
		
		void computeInverses() {
			inverses = true;
			invMass = 1.0 / mass;
			invInertia = IF_3D(
				inertia.concreteInverse(),
				invInertia = 1.0 / inertia
			);
		}

		void add(const Matter& other) {
			mass += other.mass;
			inertia += other.inertia;
		}

		Matter& operator +=(const Matter& other) {
			add(other);
			if (inverses) computeInverses();
			return *this;
		}

		Matter operator +(const Matter& other) const {
			return Matter(*this) += other;
		}

		Matter& operator *=(double factor) {
			mass *= factor;
			inertia *= factor;
			return *this;
		}

		Matter operator *(double factor) const {
			return Matter(*this) *= factor;
		}

		Matter& operator -=(const Matter& other) {
			return *this += (other * -1.0);
		}

		Matter operator -(const Matter& other) const {
			return Matter(*this) -= other;
		}

		Matter rotate(const Orientation& orientation) const {
#if IS_3D
			Matrix mat = orientation.toMatrix();
			return { mass, mat.transpose() * inertia * mat };
#else
			return *this;
#endif
		}
		
		Matter translate(const Vector& vec) {
#if IS_3D
			double x = vec[0];
			double y = vec[1];
			double z = vec[2];
			return *this + Matter(0, Matrix(
				y * y + z * z, -x * y, -x * z,
				-y * x, x * x + z * z, -y * z,
				-z * x, -z * y, x * x + y * y
			) * mass);
#else
			return *this + Matter(0, vec.sqrMag() * mass);
#endif
		}

		friend std::ostream& operator <<(std::ostream& out, const Matter& matter) {
			out << "Matter(" << matter.mass << ", " << matter.inertia << ")";
			return out;
		}
};

Matter Matter::STATIC { INFINITY, INFINITY };