#pragma once

#include <type_traits>
#include <algorithm>

#include "Constraint.hpp"
#include "../Collision.hpp"

class ContactConstraint : public Constraint {
	private:
		constexpr static int BLOCK = 2;

		std::vector<Interaction> interactions;
		struct MatrixBlock {
			std::optional<MatrixRC<BLOCK>> full;
			Matrix1 diagonal[BLOCK];
		};
		std::vector<MatrixBlock> dvToImpulses;
		double staticFriction, kineticFriction;
		double penetration;

		void solveFriction(Interaction interaction, double normalImpulse) {
			Vector velocity = getInteractionVelocity(interaction);
			Vector tangent = velocity.without(interaction.axis);
			double mag = tangent.mag();
			if (mag < EPSILON) return;
			interaction.setAxis(tangent / mag);

			Matrix1 dvToImpulse = *getDeltaToImpulsesMatrix<1>(&interaction);
			Vector1 delta = dot(velocity, interaction.axis);
			double impulse = (double)(dvToImpulse * delta);

			if (abs(impulse) > normalImpulse * staticFriction)
				impulse = sign(impulse) * normalImpulse * kineticFriction;

			applyImpulses<&RigidBody::velocity, 1>(&interaction, impulse);
		}

		template <int N>
		bool trySolve(const MatrixRC<N>& impulseMatrix, int index) {
			VectorN<N> delta = getVelocityDelta<N>(&interactions[index]);

			if (isWasteful(delta)) return true;

			for (int i = 0; i < N; i++)
				if (delta[i] > EPSILON) return false;

			VectorN<N> impulses = impulseMatrix * delta;

			for (int i = 0; i < N; i++)
				if (impulses[i] < EPSILON) return false;

			applyImpulses<&RigidBody::velocity, N>(&interactions[index], impulses);

			// friction
			for (int i = 0; i < N; i++)
				solveFriction(interactions[index + i], impulses[i]);

			return true;
		}

		template <int N>
		void solve(int index) {
			const MatrixBlock& block = dvToImpulses[index / BLOCK];

			if constexpr (N > 1)
				if (block.full && trySolve<N>(*block.full, index))
					return;

			int count = std::min(BLOCK, (int)interactions.size() - index);

			for (int i = 0; i < count; i++)
				trySolve<1>(block.diagonal[i], index + i);
		}

	public:
		ContactConstraint(bool _dynamic, RigidBody& _bodyA, RigidBody& _bodyB, const Collision& col)
		: Constraint(_dynamic, _bodyA, _bodyB) {
			Vector axis = col.normal;
			double restitution = std::max(bodyA.restitution, bodyB.restitution);

			int count = col.contacts.size();
			for (int i = 0; i < count; i++) {
				int index = i & 1 ? count - 1 - i / 2 : i / 2;
				Vector contact = col.contacts[index];
				interactions.emplace_back(
					contact - bodyA.position.linear,
					contact - bodyB.position.linear,
					axis
				);
			}
			
			for (int i = 0; i < count; i += BLOCK) {
				MatrixBlock block;

				int blockSize = std::min(BLOCK, count - i);

				if (blockSize == BLOCK)
					block.full = getDeltaToImpulsesMatrix<BLOCK>(&interactions[i], restitution);
				
				for (int j = 0; j < blockSize; j++)
					block.diagonal[j] = *getDeltaToImpulsesMatrix<1>(&interactions[i + j], restitution);

				dvToImpulses.push_back(block);
			}

			staticFriction = bodyA.friction * bodyB.friction;
			kineticFriction = 0.9 * staticFriction;
			penetration = col.penetration;
		}

		void solvePosition(double dt) override {
			if (penetration < EPSILON) return;

			Vector move = interactions[0].axis * penetration;
			if (dynamic) {
				double massA = bodyA.matter.mass;
				double massB = bodyB.matter.mass;
				double total = massA + massB;
				bodyA.position.linear -= move * (massB / total);
				bodyB.position.linear += move * (massA / total);
				bodyB.sync();
			} else {
				bodyA.position.linear -= move;
			}

			bodyA.sync();
		}
		
		void solveVelocity(double dt) override {
			for (int i = 0; i < interactions.size(); i += BLOCK)
				solve<BLOCK>(i);
		}
};