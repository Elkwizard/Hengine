#pragma once

#include "../RigidBody.hpp"

class Interaction {
	public:
		Cross crossA, crossB;
		Vector contactA, contactB;
		Vector axis;

		Interaction(const Vector& _contactA, const Vector& _contactB, const Vector& _axis) {
			contactA = _contactA;
			contactB = _contactB;
			setAxis(_axis);
		}

		Interaction(const Vector& _contactA, const Vector& _contactB) {
			contactA = _contactA;
			contactB = _contactB;
		}

		void setAxis(const Vector& _axis) {
			axis = _axis;
			crossA = cross(contactA, axis);
			crossB = cross(contactB, axis);
		}
};

std::ostream& operator <<(std::ostream& out, const Interaction& in) {
	out << in.contactA << ", " << in.contactB << "; axis: " << in.axis;
	return out;
}

API class Constraint {
	protected:
		constexpr static double WASTE_THRESHOLD = 0.001;	

		template <int N>
		bool isWasteful(const VectorN<N>& delta) const {
			for (int i = 0; i < N; i++)
				if (std::abs(delta[i]) > WASTE_THRESHOLD) return false;
			return true;
		}

	public:
		bool dynamic;

		Constraint(bool _dynamic = true) {
			dynamic = _dynamic;
		}
		virtual ~Constraint() { }
		virtual void cache() { }
		virtual void solve() = 0;

		Vector getInteractionVelocity(
			const RigidBody& a, const RigidBody& b,
			const Interaction& interaction
		) const {
			Vector velocity = -a.getPointVelocity(interaction.contactA);
			if (dynamic) velocity += b.getPointVelocity(interaction.contactB);
			return velocity;
		}
		
		template <int N>
		VectorN<N> getVelocityDelta(
			const RigidBody& a, const RigidBody& b,
			const Interaction* interactions
		) const {
			VectorN<N> dv;
			for (int i = 0; i < N; i++) {
				const Interaction& interaction = interactions[i];
				Vector velocity = getInteractionVelocity(a, b, interaction);
				dv[i] = dot(velocity, interaction.axis);
			}
			
			return dv;
		}

		template <Derivative D, int N>
		void applyImpulses(
			RigidBody& bodyA, RigidBody& bodyB,
			const Interaction* interactions,
			const VectorN<N>& impulses
		) {
			for (int i = 0; i < N; i++) {
				const Interaction& interaction = interactions[i];
				Vector impulse = interaction.axis * -impulses[i];

				bodyA.applyRelativeImpulse<D>(interaction.contactA, impulse);
				if (dynamic) bodyB.applyRelativeImpulse<D>(interaction.contactB, -impulse);
			}
		}

		template <int N>
		static std::optional<MatrixRC<N>> getDeltaToImpulsesMatrix(
			const Matter& mA,
			const Matter& mB,
			const Interaction* interactions,
			double restitution = 0.0
		) {
			double dvFactor = -1.0 - restitution;

			MatrixRC<N> impulsesToDV;
			for (int j = 0; j < N; j++)
			for (int i = 0; i <= j; i++) {
				const Interaction& dst = interactions[i];
				const Interaction& src = interactions[j];

				impulsesToDV[i][j] = dvFactor * (
					mA.invMass + mB.invMass +
					dot(mA.invInertia * src.crossA, dst.crossA) +
					dot(mB.invInertia * src.crossB, dst.crossB)
				);
			}

			for (int j = 0; j < N - 1; j++)
			for (int i = j + 1; i < N; i++)
				impulsesToDV[i][j] = impulsesToDV[j][i];

			std::optional<MatrixRC<N>> result = impulsesToDV.inverse();

			return result;
		}
};