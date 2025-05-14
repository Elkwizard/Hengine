#pragma once

#include "../RigidBody.hpp"

API class Constrained {
	public:
		API_CONST RigidBody& body;
		API Vector offset;
		API bool isStatic = false;

		API Constrained(RigidBody& _body, const Vector& _offset)
		: body(_body) {
			offset = _offset;
		}

		bool isDynamic() const {
			return !isStatic && body.getDynamic();
		}

		API Vector getAnchor() const {
			return body.position * offset;
		}
};

class DynamicState {
	public:
		bool dynamic;
		std::optional<Vector> prohibited;

		explicit DynamicState(bool _dynamic) {
			dynamic = _dynamic;
		}

		explicit DynamicState(const Vector& _prohibited) {
			dynamic = true;
			prohibited = _prohibited;
		}

		DynamicState round() const {
			return DynamicState(dynamic && !prohibited);
		}

		operator bool() const {
			return dynamic;
		}
};

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

		Interaction() { }

		void setAxis(const Vector& _axis) {
			axis = _axis;
			crossA = cross(contactA, axis);
			crossB = cross(contactB, axis);
		}

		friend std::ostream& operator <<(std::ostream& out, const Interaction& in) {
			out << in.contactA << ", " << in.contactB << "; axis: " << in.axis;
			return out;
		}
};

class Constraint {
	protected:
		constexpr static double WASTE_THRESHOLD = 0.001;	

		template <int N>
		bool isWasteful(const VectorN<N>& delta) const {
			for (int i = 0; i < N; i++)
				if (std::abs(delta[i]) > WASTE_THRESHOLD) return false;
			return true;
		}

	public:
		DynamicState dynamic;
		RigidBody& bodyA;
		RigidBody& bodyB;
		Matter matterB;

		Constraint(DynamicState _dynamic, RigidBody& _bodyA, RigidBody& _bodyB)
		: dynamic(_dynamic), bodyA(_bodyA), bodyB(_bodyB) {
			matterB = dynamic ? bodyB.matter : Matter::STATIC;
		}
		virtual ~Constraint() { }
		virtual void solvePosition(double dt) = 0;
		virtual void solveVelocity(double dt) = 0;

		Vector getInteractionVelocity(const Interaction& interaction) const {
			Vector velocity = -bodyA.getPointVelocity(interaction.contactA);
			if (dynamic) velocity += bodyB.getPointVelocity(interaction.contactB);
			return velocity;
		}
		
		template <int N>
		VectorN<N> getVelocityDelta(const Interaction* interactions) const {
			VectorN<N> dv;
			for (int i = 0; i < N; i++) {
				const Interaction& interaction = interactions[i];
				Vector velocity = getInteractionVelocity(interaction);
				dv[i] = dot(velocity, interaction.axis);
			}
			
			return dv;
		}

		template <Derivative D, int N>
		void applyImpulses(const Interaction* interactions,	const VectorN<N>& impulses) {
			for (int i = 0; i < N; i++) {
				const Interaction& interaction = interactions[i];
				Vector impulse = interaction.axis * -impulses[i];

				bodyA.applyRelativeImpulse<D>(interaction.contactA, impulse);
				if (dynamic) bodyB.applyRelativeImpulse<D>(interaction.contactB, -impulse);
			}
		}

		template <int N>
		std::optional<MatrixRC<N>> getDeltaToImpulsesMatrix(
			const Interaction* interactions, double restitution = 0.0
		) {
			double dvFactor = -1.0 - restitution;

			MatrixRC<N> impulsesToDV;
			for (int j = 0; j < N; j++)
			for (int i = 0; i <= j; i++) {
				const Interaction& dst = interactions[i];
				const Interaction& src = interactions[j];

				impulsesToDV[i][j] = dvFactor * (
					bodyA.matter.invMass + matterB.invMass +
					dot(bodyA.matter.invInertia * src.crossA, dst.crossA) +
					dot(matterB.invInertia * src.crossB, dst.crossB)
				);
			}

			for (int j = 0; j < N - 1; j++)
			for (int i = j + 1; i < N; i++)
				impulsesToDV[i][j] = impulsesToDV[j][i];

			std::optional<MatrixRC<N>> result = impulsesToDV.inverse();

			return result;
		}

		static DynamicState propagateDynamic(
			RigidBody& a, RigidBody& b, bool bDynamic, const Vector& normal
		) {
			if (!bDynamic) {
				a.prohibited.add(normal);
				return DynamicState(false);
			}

			std::optional<Vector> match = b.prohibited.match(normal);
			if (match) {
				a.prohibited.add(*match);
				return DynamicState(*match);
			}
			
			return DynamicState(true);
		}
};

class Constraint2 : public Constraint {
	protected:
		Constrained& a;
		Constrained& b;
		Interaction interaction;
		Matrix1 dvToImpulses;

		void generateInteraction() {
			Vector endA = a.getAnchor();
			Vector endB = b.getAnchor();
			Vector axis = endB - endA;

			interaction = {
				endA - a.body.position.linear,
				endB - b.body.position.linear,
				axis.normalize()
			};

			dvToImpulses = *getDeltaToImpulsesMatrix<1>(&interaction);
		}

	public:
		Constraint2(const DynamicState& _dynamic, Constrained& _a, Constrained& _b)
		: Constraint(_dynamic, _a.body, _b.body), a(_a), b(_b) { }

		void solveVelocity(double dt) override {
			bodyA.recomputeVelocity(a.offset, interaction.axis, dt);
			if (dynamic) bodyB.recomputeVelocity(b.offset, interaction.axis, dt);
		}
};