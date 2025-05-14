#pragma once

#include "Constraint.hpp"

class LengthConstraint : public Constraint2 {
	private:
		double length;

	public:
		LengthConstraint(const DynamicState& _dynamic, Constrained& _a, Constrained& _b, double _length)
		: Constraint2(_dynamic, _a, _b) {
			length = _length;
		}

		void solvePosition(double dt) override {
			generateInteraction();

			double sqrMag = (b.getAnchor() - a.getAnchor()).sqrMag();
			if (equals(sqrMag, length * length)) return;

			Vector1 delta = std::sqrt(sqrMag) - length;
			applyImpulses<&RigidBody::position, 1>(&interaction, dvToImpulses * delta);
		}
};