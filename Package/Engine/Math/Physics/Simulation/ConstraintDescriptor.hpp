#pragma once

#include "RigidBody.hpp"
#include "Constraint/Constraint.hpp"
#include "Constraint/LengthConstraint.hpp"

API class ConstraintDescriptor {
	public:
		API_CONST Constrained a, b;

		ConstraintDescriptor(const Constrained& _a, const Constrained& _b)
		: a(_a), b(_b) { }
		virtual ~ConstraintDescriptor() { }

		API bool hasBody(RigidBody& body) const {
			return &a.body == &body || &b.body == &body;
		}

		void add() {
			a.body.constraintDescriptors.push_back(this);
			b.body.constraintDescriptors.push_back(this);
		}

		void remove() {
			erase(a.body.constraintDescriptors, this);
			erase(b.body.constraintDescriptors, this);
		}

		virtual Constraint2* makeConstraint(const DynamicState& prohibited, Constrained& a, Constrained& b) = 0;

		friend std::ostream& operator <<(std::ostream& out, const ConstraintDescriptor& desc) {
			out << "Constraint(" << desc.a.getAnchor() << ", " << desc.b.getAnchor() << ")";
			return out;
		}
};

API class LengthConstraintDescriptor : public ConstraintDescriptor {
	public:
		API double length;

		API LengthConstraintDescriptor(const Constrained& _a, const Constrained& _b, double _length)
		: ConstraintDescriptor(_a, _b) {
			length = _length;
		}

		Constraint2* makeConstraint(const DynamicState& dynamic, Constrained& a, Constrained& b) override {
			return new LengthConstraint(dynamic, a, b, length);
		}
};

API class PositionConstraintDescriptor : public ConstraintDescriptor {
	public:
		API PositionConstraintDescriptor(const Constrained& _a, const Constrained& _b)
		: ConstraintDescriptor(_a, _b) { }

		Constraint2* makeConstraint(const DynamicState& dynamic, Constrained& a, Constrained& b) override {
			return new LengthConstraint(dynamic, a, b, 0);
		}
};

// API class LengthConstraint2 : public Constraint2 {
// 	protected:
// 		void solvePosition(Constrained& a, Constrained& b) override {
// 			Vector endA = a.getAnchor();
// 			Vector endB = b.getAnchor();

// 			Vector axis = endB - endA;
// 			double sqrMag = axis.sqrMag();

// 			if (!equals(sqrMag, length * length)) {
// 				double mag = std::sqrt(sqrMag);
// 				axis /= mag;

// 				Interaction interaction {
// 					endA - a.body.position.linear,
// 					endB - b.body.position.linear,
// 					axis
// 				};
// 				Matrix1 dvToImpulses = *getDeltaToImpulsesMatrix<1>(
// 					a.body.matter,
// 					dynamic ? b.body.matter : Matter::STATIC,
// 					&interaction
// 				);
// 				Vector1 positionDelta = mag - length;
				
// 				applyImpulses<&RigidBody::position, 1>(a.body, b.body, &interaction, dvToImpulses * positionDelta);
// 			}
// 		}

// 		void solve(Constrained& a, Constrained& b) override {
// 			Vector endA = a.getAnchor();
// 			Vector endB = b.getAnchor();

// 			Vector axis = (endB - endA).normalized();

// 			Interaction interaction {
// 				endA - a.body.position.linear,
// 				endB - b.body.position.linear,
// 				axis
// 			};
			
// 			Vector1 velocityDelta = getVelocityDelta<1>(a.body, b.body, &interaction);
			
// 			if (isWasteful(velocityDelta)) return;

// 			Matrix1 dvToImpulses = *getDeltaToImpulsesMatrix<1>(
// 				a.body.matter,
// 				dynamic ? b.body.matter : Matter::STATIC,
// 				&interaction
// 			);

// 			applyImpulses<&RigidBody::velocity, 1>(a.body, b.body, &interaction, dvToImpulses * velocityDelta);
// 			// Vector endA = a.getAnchor();
// 			// Vector endB = b.getAnchor();

// 			// Vector axis = endB - endA;
// 			// double sqrMag = axis.sqrMag();

// 			// if (!equals(sqrMag, length * length)) {
// 			// 	double mag = std::sqrt(sqrMag);
// 			// 	axis /= mag;

// 			// 	Interaction interaction {
// 			// 		endA - a.body.position.linear,
// 			// 		endB - b.body.position.linear,
// 			// 		axis
// 			// 	};
// 			// 	Matrix1 dvToImpulses = *getDeltaToImpulsesMatrix<1>(
// 			// 		a.body.matter,
// 			// 		dynamic ? b.body.matter : Matter::STATIC,
// 			// 		&interaction
// 			// 	);
// 			// 	Vector1 positionDelta = mag - length;
// 			// 	Vector1 velocityDelta = getVelocityDelta<1>(a.body, b.body, &interaction);

// 			// 	applyImpulses<&RigidBody::position, 1>(a.body, b.body, &interaction, dvToImpulses * positionDelta);
// 			// 	applyImpulses<&RigidBody::velocity, 1>(a.body, b.body, &interaction, dvToImpulses * velocityDelta);
// 			// }
// 		}

// 	public:
// 		API double length;

// 		API LengthConstraint2(const Constrained& _a, const Constrained& _b, double _length)
// 		: Constraint2(_a, _b) {
// 			length = _length;
// 		}

// };

// API class PositionConstraint2 : public Constraint2 {
// 	private:
// 		template <Derivative D>
// 		void solveDerivative(
// 			RigidBody& bodyA, RigidBody& bodyB,
// 			Interaction interaction, const Vector& relative
// 		) {
// 			double mag = relative.mag();
// 			Vector1 delta = mag;
// 			interaction.setAxis(relative / mag);
// 			Matrix1 dvToImpulses = *getDeltaToImpulsesMatrix<1>(
// 				bodyA.matter,
// 				dynamic ? bodyB.matter : Matter::STATIC,
// 				&interaction
// 			);
// 			applyImpulses<D, 1>(bodyA, bodyB, &interaction, dvToImpulses * delta);
// 		}

// 	protected:
// 		void solvePosition(Constrained& a, Constrained& b) override {
// 			Vector endA = a.getAnchor();
// 			Vector endB = b.getAnchor();

// 			Interaction interaction {
// 				endA - a.body.position.linear,
// 				endB - b.body.position.linear
// 			};
			
// 			solveDerivative<&RigidBody::position>(
// 				a.body, b.body, interaction, endB - endA
// 			);
// 		}

// 		void solve(Constrained& a, Constrained& b) override {
// 			Vector endA = a.getAnchor();
// 			Vector endB = b.getAnchor();

// 			Interaction interaction {
// 				endA - a.body.position.linear,
// 				endB - b.body.position.linear
// 			};

// 			solveDerivative<&RigidBody::velocity>(
// 				a.body, b.body, interaction,
// 				getInteractionVelocity(a.body, b.body, interaction)
// 			);
// 		}

// 	public:
// 		API PositionConstraint2(const Constrained& _a, const Constrained& _b)
// 		: Constraint2(_a, _b) { }
// };