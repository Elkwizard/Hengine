#pragma once

#include <vector>
#include <concepts>

#include "../../Global.hpp"
#include "../Math/Random.hpp"
#include "Constraint/Constraint.hpp"

template <std::derived_from<Constraint> T>
class Resolver {
	private:
		using Solve = void (T::*)(double);

		std::vector<std::unique_ptr<T>> staticConstraints, dynamicConstraints;

		std::vector<std::unique_ptr<T>>& getConstraintList(T* con) {
			return con->dynamic ? dynamicConstraints : staticConstraints;
		}

		template <Solve S>
		void solveConstraints(std::vector<std::unique_ptr<T>>& constraints, double dt) {
			rng.shuffle(constraints);
			for (const auto& con : constraints)
				(con.get()->*S)(dt);
		}
		
		template <typename U, void (U::* S)(double)>
		void solve(double dt, int count) {
			for (int i = 0; i < count; i++) {
				solveConstraints<(Solve)S>(dynamicConstraints, dt);
				solveConstraints<(Solve)S>(staticConstraints, dt);
			}
		}

	public:
		Resolver() {

		}

		void clear() {
			staticConstraints.clear();
			dynamicConstraints.clear();
		}

		void addConstraint(T* con) {
			if (con == nullptr) return;
			getConstraintList(con).emplace_back(con);
		}
		
		double getError() const {
			double result = 0;
			for (const auto& con : staticConstraints)
				result += con->getError();
			for (const auto& con : dynamicConstraints)
				result += con->getError();
			return result;	
		}

		template <void (Constraint::* S)(double)>
		void solve(double dt, int count = 1) {
			solve<Constraint, S>(dt, count);
		}
		
		template <void (T::* S)(double)>
		void solve(double dt, int count = 1) {
			solve<T, S>(dt, count);
		}

};