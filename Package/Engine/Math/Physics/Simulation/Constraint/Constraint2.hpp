#pragma once

#include "Constraint.hpp"
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
			return !isStatic && body.dynamic;
		}

		API Vector getAnchor() const {
			return body.position * offset;
		}
};

API class Constraint2 : public Constraint {
	protected:
		virtual void solve(Constrained&, Constrained&) = 0;
		virtual void solvePosition(Constrained&, Constrained&) = 0;

	public:
		API_CONST Constrained a, b;

		Constraint2(const Constrained& _a, const Constrained& _b)
		: a(_a), b(_b) { }

		bool hasBody(RigidBody& body) const {
			return &a.body == &body || &b.body == &body;
		}

		void cache() override {
			dynamic = a.isDynamic() && b.isDynamic();
		}

		void add() {
			a.body.constraints.push_back(this);
			b.body.constraints.push_back(this);
		}

		void remove() {
			erase(a.body.constraints, this);
			erase(b.body.constraints, this);
		}

		void solvePosition() {
			bool aDynamic = a.isDynamic();
			bool bDynamic = b.isDynamic();

			if (aDynamic) {
				solvePosition(a, b);
			} else if (bDynamic) {
				solvePosition(b, a);
			}
		}
		
		void solve() override {
			bool aDynamic = a.isDynamic();
			bool bDynamic = b.isDynamic();

			if (aDynamic) {
				solve(a, b);
			} else if (bDynamic) {
				solve(b, a);
			}
		}
};

API class LengthConstraint2 : public Constraint2 {
	protected:
		void solvePosition(Constrained& a, Constrained& b) override {
			Vector endA = a.getAnchor();
			Vector endB = b.getAnchor();

			Vector axis = endB - endA;
			double sqrMag = axis.sqrMag();

			if (!equals(sqrMag, length * length)) {
				double mag = std::sqrt(sqrMag);
				axis /= mag;

				Interaction interaction {
					endA - a.body.position.linear,
					endB - b.body.position.linear,
					axis
				};
				Matrix1 dvToImpulses = *getDeltaToImpulsesMatrix<1>(
					a.body.matter,
					dynamic ? b.body.matter : Matter::STATIC,
					&interaction
				);
				Vector1 positionDelta = mag - length;
				
				applyImpulses<&RigidBody::position, 1>(a.body, b.body, &interaction, dvToImpulses * positionDelta);
			}
		}

		void solve(Constrained& a, Constrained& b) override {
			Vector endA = a.getAnchor();
			Vector endB = b.getAnchor();

			Vector axis = (endB - endA).normalized();

			Interaction interaction {
				endA - a.body.position.linear,
				endB - b.body.position.linear,
				axis
			};
			
			Vector1 velocityDelta = getVelocityDelta<1>(a.body, b.body, &interaction);
			
			if (isWasteful(velocityDelta)) return;

			Matrix1 dvToImpulses = *getDeltaToImpulsesMatrix<1>(
				a.body.matter,
				dynamic ? b.body.matter : Matter::STATIC,
				&interaction
			);

			applyImpulses<&RigidBody::velocity, 1>(a.body, b.body, &interaction, dvToImpulses * velocityDelta);
			// Vector endA = a.getAnchor();
			// Vector endB = b.getAnchor();

			// Vector axis = endB - endA;
			// double sqrMag = axis.sqrMag();

			// if (!equals(sqrMag, length * length)) {
			// 	double mag = std::sqrt(sqrMag);
			// 	axis /= mag;

			// 	Interaction interaction {
			// 		endA - a.body.position.linear,
			// 		endB - b.body.position.linear,
			// 		axis
			// 	};
			// 	Matrix1 dvToImpulses = *getDeltaToImpulsesMatrix<1>(
			// 		a.body.matter,
			// 		dynamic ? b.body.matter : Matter::STATIC,
			// 		&interaction
			// 	);
			// 	Vector1 positionDelta = mag - length;
			// 	Vector1 velocityDelta = getVelocityDelta<1>(a.body, b.body, &interaction);

			// 	applyImpulses<&RigidBody::position, 1>(a.body, b.body, &interaction, dvToImpulses * positionDelta);
			// 	applyImpulses<&RigidBody::velocity, 1>(a.body, b.body, &interaction, dvToImpulses * velocityDelta);
			// }
		}

	public:
		API double length;

		API LengthConstraint2(const Constrained& _a, const Constrained& _b, double _length)
		: Constraint2(_a, _b) {
			length = _length;
		}

};

API class PositionConstraint2 : public Constraint2 {
	private:
		template <Derivative D>
		void solveDerivative(
			RigidBody& bodyA, RigidBody& bodyB,
			Interaction interaction, const Vector& relative
		) {
			double mag = relative.mag();
			Vector1 delta = mag;
			interaction.setAxis(relative / mag);
			Matrix1 dvToImpulses = *getDeltaToImpulsesMatrix<1>(
				bodyA.matter,
				dynamic ? bodyB.matter : Matter::STATIC,
				&interaction
			);
			applyImpulses<D, 1>(bodyA, bodyB, &interaction, dvToImpulses * delta);
		}

	protected:
		void solvePosition(Constrained& a, Constrained& b) override {
			Vector endA = a.getAnchor();
			Vector endB = b.getAnchor();

			Interaction interaction {
				endA - a.body.position.linear,
				endB - b.body.position.linear
			};
			
			solveDerivative<&RigidBody::position>(
				a.body, b.body, interaction, endB - endA
			);
		}

		void solve(Constrained& a, Constrained& b) override {
			Vector endA = a.getAnchor();
			Vector endB = b.getAnchor();

			Interaction interaction {
				endA - a.body.position.linear,
				endB - b.body.position.linear
			};

			solveDerivative<&RigidBody::velocity>(
				a.body, b.body, interaction,
				getInteractionVelocity(a.body, b.body, interaction)
			);
		}

	public:
		API PositionConstraint2(const Constrained& _a, const Constrained& _b)
		: Constraint2(_a, _b) { }
};