HengineWASMResource.imports["physics"] = ["_printInt0","_printFloat1","_printLn2","_fullExit3","_collideRule4","_triggerRule5","_onCollide7"];
HengineWASMResource.bindings["physics"] = (module, imports, exports) => {
	const { Binding } = HengineWASMResource;
	
	const { cast } = Binding;
	
	module.Constraint = class Constraint extends Binding {
		get type() { return exports._get_type24(this.pointer); }
		get id() { return exports._get_id25(this.pointer); }
		get a() { return cast(module.Vector, exports._get_a26(this.pointer)); }
		get b() { return cast(module.Vector, exports._get_b27(this.pointer)); }
		static get size() { return exports._get_size28(); }
		hasBody(_0) { return !!exports._hasBody29(this.pointer, _0.pointer); }
	};
	
	module.Collider = class Collider extends Binding {
		static get size() { return exports._get_size17(); }
	};
	
	module.Constraint1 = class Constraint1 extends module.Constraint {
		get body() { return cast(module.RigidBody, exports._get_body30(this.pointer)); }
		set body(_0) { return exports._set_body31(this.pointer, _0.pointer); }
		get offset() { return cast(module.Vector, exports._get_offset32(this.pointer)); }
		set offset(_0) { return exports._set_offset33(this.pointer, _0.pointer); }
		get point() { return cast(module.Vector, exports._get_point34(this.pointer)); }
		set point(_0) { return exports._set_point35(this.pointer, _0.pointer); }
		static get size() { return exports._get_size36(); }
	};
	
	module.Constraint2 = class Constraint2 extends module.Constraint {
		get bodyA() { return cast(module.RigidBody, exports._get_bodyA37(this.pointer)); }
		set bodyA(_0) { return exports._set_bodyA38(this.pointer, _0.pointer); }
		get bodyB() { return cast(module.RigidBody, exports._get_bodyB39(this.pointer)); }
		set bodyB(_0) { return exports._set_bodyB40(this.pointer, _0.pointer); }
		get offsetA() { return cast(module.Vector, exports._get_offsetA41(this.pointer)); }
		set offsetA(_0) { return exports._set_offsetA42(this.pointer, _0.pointer); }
		get offsetB() { return cast(module.Vector, exports._get_offsetB43(this.pointer)); }
		set offsetB(_0) { return exports._set_offsetB44(this.pointer, _0.pointer); }
		get staticA() { return !!exports._get_staticA45(this.pointer); }
		set staticA(_0) { return exports._set_staticA46(this.pointer, !!_0); }
		get staticB() { return !!exports._get_staticB47(this.pointer); }
		set staticB(_0) { return exports._set_staticB48(this.pointer, !!_0); }
		static get size() { return exports._get_size49(); }
	};
	
	Object.defineProperty(module, "printInt", {
		set: fn => {
			imports._printInt0 = (_0) => fn(_0)
		}
	});
	Object.defineProperty(module, "printFloat", {
		set: fn => {
			imports._printFloat1 = (_0) => fn(_0)
		}
	});
	Object.defineProperty(module, "printLn", {
		set: fn => {
			imports._printLn2 = () => fn()
		}
	});
	Object.defineProperty(module, "fullExit", {
		set: fn => {
			imports._fullExit3 = () => fn()
		}
	});
	Object.defineProperty(module, "collideRule", {
		set: fn => {
			imports._collideRule4 = (_0, _1) => !!fn(cast(module.RigidBody, _0), cast(module.RigidBody, _1))
		}
	});
	Object.defineProperty(module, "triggerRule", {
		set: fn => {
			imports._triggerRule5 = (_0, _1) => !!fn(cast(module.RigidBody, _0), cast(module.RigidBody, _1))
		}
	});
	module.collide = function collide(_0, _1) { return !!exports._collide6(_0.pointer, _1.pointer); };
	Object.defineProperty(module, "onCollide", {
		set: fn => {
			imports._onCollide7 = (_0, _1, _2, _3, _4, _5, _6) => fn(cast(module.PhysicsEngine, _0), cast(module.RigidBody, _1), cast(module.RigidBody, _2), cast(module.Vector, _3), new module.Array(module.Vector, cast(module._Slab, _4), false), !!_5, !!_6)
		}
	});
	
	module.Vector = class Vector extends Binding {
		get x() { return exports._get_x8(this.pointer); }
		set x(_0) { return exports._set_x9(this.pointer, _0); }
		get y() { return exports._get_y10(this.pointer); }
		set y(_0) { return exports._set_y11(this.pointer, _0); }
		static get size() { return exports._get_size12(); }
		static create(_0, _1) { return exports._create13(_0, _1); }
		delete() { return exports._delete14(this.pointer); }
		set(_0, _1) { return exports._set15(this.pointer, _0, _1); }
		static dist(_0, _1) { return exports._dist16(_0.pointer, _1.pointer); }
	};
	
	module.PolygonCollider = class PolygonCollider extends module.Collider {
		static get size() { return exports._get_size18(); }
		static create(_0) { return exports._create19(_0.pointer); }
		delete() { return exports._delete20(this.pointer); }
	};
	
	module.CircleCollider = class CircleCollider extends module.Collider {
		static get size() { return exports._get_size21(); }
		static create(_0, _1, _2) { return exports._create22(_0, _1, _2); }
		delete() { return exports._delete23(this.pointer); }
	};
	
	module.RigidBody = class RigidBody extends Binding {
		get id() { return exports._get_id50(this.pointer); }
		set id(_0) { return exports._set_id51(this.pointer, _0); }
		get position() { return cast(module.Vector, exports._get_position52(this.pointer)); }
		set position(_0) { return exports._set_position53(this.pointer, _0.pointer); }
		get angle() { return exports._get_angle54(this.pointer); }
		set angle(_0) { return exports._set_angle55(this.pointer, _0); }
		get velocity() { return cast(module.Vector, exports._get_velocity56(this.pointer)); }
		set velocity(_0) { return exports._set_velocity57(this.pointer, _0.pointer); }
		get angularVelocity() { return exports._get_angularVelocity58(this.pointer); }
		set angularVelocity(_0) { return exports._set_angularVelocity59(this.pointer, _0); }
		get mass() { return exports._get_mass60(this.pointer); }
		set mass(_0) { return exports._set_mass61(this.pointer, _0); }
		get inertia() { return exports._get_inertia62(this.pointer); }
		set inertia(_0) { return exports._set_inertia63(this.pointer, _0); }
		get density() { return exports._get_density64(this.pointer); }
		set density(_0) { return exports._set_density65(this.pointer, _0); }
		get boundingRadius() { return exports._get_boundingRadius66(this.pointer); }
		get restitution() { return exports._get_restitution67(this.pointer); }
		set restitution(_0) { return exports._set_restitution68(this.pointer, _0); }
		get friction() { return exports._get_friction69(this.pointer); }
		set friction(_0) { return exports._set_friction70(this.pointer, _0); }
		get canRotate() { return !!exports._get_canRotate71(this.pointer); }
		set canRotate(_0) { return exports._set_canRotate72(this.pointer, !!_0); }
		get dynamic() { return !!exports._get_dynamic73(this.pointer); }
		set dynamic(_0) { return exports._set_dynamic74(this.pointer, !!_0); }
		get simulated() { return !!exports._get_simulated75(this.pointer); }
		set simulated(_0) { return exports._set_simulated76(this.pointer, !!_0); }
		get airResistance() { return !!exports._get_airResistance77(this.pointer); }
		set airResistance(_0) { return exports._set_airResistance78(this.pointer, !!_0); }
		get gravity() { return !!exports._get_gravity79(this.pointer); }
		set gravity(_0) { return exports._set_gravity80(this.pointer, !!_0); }
		get isTrigger() { return !!exports._get_isTrigger81(this.pointer); }
		set isTrigger(_0) { return exports._set_isTrigger82(this.pointer, !!_0); }
		get canCollide() { return !!exports._get_canCollide83(this.pointer); }
		set canCollide(_0) { return exports._set_canCollide84(this.pointer, !!_0); }
		get trivialCollisionFilter() { return !!exports._get_trivialCollisionFilter85(this.pointer); }
		set trivialCollisionFilter(_0) { return exports._set_trivialCollisionFilter86(this.pointer, !!_0); }
		get trivialTriggerFilter() { return !!exports._get_trivialTriggerFilter87(this.pointer); }
		set trivialTriggerFilter(_0) { return exports._set_trivialTriggerFilter88(this.pointer, !!_0); }
		get constraints() { return new module.Array(module.Constraint, cast(module._Slab, exports._get_constraints89(this.pointer)), true); }
		set constraints(_0) { return exports._set_constraints90(this.pointer, _0.pointer); }
		static get size() { return exports._get_size91(); }
		static create(_0, _1, _2) { return exports._create92(_0, _1, !!_2); }
		delete() { return exports._delete93(this.pointer); }
		invalidateModels() { return exports._invalidateModels94(this.pointer); }
		clearShapes() { return exports._clearShapes95(this.pointer); }
		removeShape(_0) { return exports._removeShape96(this.pointer, _0); }
		addShape(_0) { return exports._addShape97(this.pointer, _0); }
		stop() { return exports._stop98(this.pointer); }
		applyImpulse(_0, _1, _2) { return exports._applyImpulse99(this.pointer, _0.pointer, _1.pointer, _2); }
		applyRelativeImpulse(_0, _1, _2) { return exports._applyRelativeImpulse100(this.pointer, _0.pointer, _1.pointer, _2); }
		static fromPolygon(_0, _1) { return exports._fromPolygon101(_0.pointer, !!_1); }
		static fromRect(_0, _1, _2, _3, _4) { return exports._fromRect102(_0, _1, _2, _3, !!_4); }
		static fromCircle(_0, _1, _2, _3) { return exports._fromCircle103(_0, _1, _2, !!_3); }
	};
	
	module.PhysicsEngine = class PhysicsEngine extends Binding {
		get contactIterations() { return exports._get_contactIterations104(this.pointer); }
		set contactIterations(_0) { return exports._set_contactIterations105(this.pointer, _0); }
		get iterations() { return exports._get_iterations106(this.pointer); }
		set iterations(_0) { return exports._set_iterations107(this.pointer, _0); }
		get constraintIterations() { return exports._get_constraintIterations108(this.pointer); }
		set constraintIterations(_0) { return exports._set_constraintIterations109(this.pointer, _0); }
		get gravity() { return cast(module.Vector, exports._get_gravity110(this.pointer)); }
		set gravity(_0) { return exports._set_gravity111(this.pointer, _0.pointer); }
		get drag() { return exports._get_drag112(this.pointer); }
		set drag(_0) { return exports._set_drag113(this.pointer, _0); }
		get constraints() { return new module.Array(module.Constraint, cast(module._Slab, exports._get_constraints114(this.pointer)), true); }
		get bodies() { return new module.Array(module.RigidBody, cast(module._Slab, exports._get_bodies115(this.pointer)), true); }
		static get size() { return exports._get_size116(); }
		static create(_0) { return exports._create117(_0.pointer); }
		delete() { return exports._delete118(this.pointer); }
		run() { return exports._run119(this.pointer); }
		addConstraint(_0) { return exports._addConstraint120(this.pointer, _0); }
		removeConstraint(_0) { return exports._removeConstraint121(this.pointer, _0); }
		hasBody(_0) { return !!exports._hasBody122(this.pointer, _0); }
		getBody(_0) { return cast(module.RigidBody, exports._getBody123(this.pointer, _0)); }
		addBody(_0) { return exports._addBody124(this.pointer, _0); }
		removeBody(_0) { return exports._removeBody125(this.pointer, _0); }
	};
	
	module.LengthConstraint2 = class LengthConstraint2 extends module.Constraint2 {
		get length() { return exports._get_length126(this.pointer); }
		set length(_0) { return exports._set_length127(this.pointer, _0); }
		static get size() { return exports._get_size128(); }
		static create(_0, _1, _2, _3, _4) { return exports._create129(_0.pointer, _1.pointer, _2.pointer, _3.pointer, _4); }
		delete() { return exports._delete130(this.pointer); }
	};
	
	module.PositionConstraint2 = class PositionConstraint2 extends module.Constraint2 {
		static get size() { return exports._get_size131(); }
		static create(_0, _1, _2, _3) { return exports._create132(_0.pointer, _1.pointer, _2.pointer, _3.pointer); }
		delete() { return exports._delete133(this.pointer); }
	};
	
	module.LengthConstraint1 = class LengthConstraint1 extends module.Constraint1 {
		get length() { return exports._get_length134(this.pointer); }
		set length(_0) { return exports._set_length135(this.pointer, _0); }
		static get size() { return exports._get_size136(); }
		static create(_0, _1, _2, _3) { return exports._create137(_0.pointer, _1.pointer, _2.pointer, _3); }
		delete() { return exports._delete138(this.pointer); }
	};
	
	module.PositionConstraint1 = class PositionConstraint1 extends module.Constraint1 {
		static get size() { return exports._get_size139(); }
		static create(_0, _1, _2) { return exports._create140(_0.pointer, _1.pointer, _2.pointer); }
		delete() { return exports._delete141(this.pointer); }
	};
	
	module._Slab = class _Slab extends Binding {
		get length() { return exports._get_length142(this.pointer); }
		static get size() { return exports._get_size143(); }
		static create(_0, _1) { return exports._create144(_0, _1); }
		delete() { return exports._delete145(this.pointer); }
		getPointer(_0) { return exports._getPointer146(this.pointer, _0); }
		setPointer(_0, _1) { return exports._setPointer147(this.pointer, _0, _1); }
		get(_0) { return exports._get148(this.pointer, _0); }
	};
};