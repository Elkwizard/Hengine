HengineWASMResource.imports["Physics2"] = ["__global_printStringJS0","__global_asymmetricTriggerRule2","__global_symmetricCollisionRule3","__global_onCollide4"];
HengineWASMResource.bindings["Physics2"] = (module, imports, exports) => {
	const { Binding } = HengineWASMResource;
	
	const { cast } = Binding;
	
	module.Constraint = class Constraint extends Binding {
		static CONST_PROPERTIES = [];
		
	};
	
	module.Shape = class Shape extends Binding {
		static CONST_PROPERTIES = [];
		
	};
	
	module.Constraint2 = class Constraint2 extends module.Constraint {
		static CONST_PROPERTIES = ["a","b"];
		get a() { return cast(module.Constrained, exports._get_Constraint2_a41(this.pointer)); }
		get b() { return cast(module.Constrained, exports._get_Constraint2_b42(this.pointer)); }
	};
	
	Object.defineProperty(module, "printStringJS", {
		set(_fn) {
			imports.__global_printStringJS0 = (pointer) => _fn(pointer);
		}
	});
	module.markFlag = function markFlag(_flag) { exports.__global_markFlag1(_flag); }
	Object.defineProperty(module, "asymmetricTriggerRule", {
		set(_fn) {
			imports.__global_asymmetricTriggerRule2 = (_0, _1) => _fn(cast(module.RigidBody, _0), cast(module.RigidBody, _1));
		}
	});
	Object.defineProperty(module, "symmetricCollisionRule", {
		set(_fn) {
			imports.__global_symmetricCollisionRule3 = (_0, _1) => _fn(cast(module.RigidBody, _0), cast(module.RigidBody, _1));
		}
	});
	Object.defineProperty(module, "onCollide", {
		set(_fn) {
			imports.__global_onCollide4 = (_0, _1, _2, _3, _4, _5) => _fn(cast(module.RigidBody, _0), cast(module.RigidBody, _1), cast(module.VectorN_2_, _2), cast(module.Array_VectorN_2__0, _3), !!_4, !!_5);
		}
	});
	
	module.Orientation = class Orientation extends Binding {
		static CONST_PROPERTIES = [];
		get rotation() { return exports._Orientation_getRotation5(this.pointer); }
		set rotation(_rotation) { exports._Orientation_setRotation6(this.pointer, _rotation); }
	};
	
	module.Transform = class Transform extends Binding {
		static CONST_PROPERTIES = ["linear","orientation"];
		get linear() { return cast(module.VectorN_2_, exports._get_Transform_linear7(this.pointer)); }
		get orientation() { return cast(module.Orientation, exports._get_Transform_orientation8(this.pointer)); }
		static create() { return exports._Transform_Transform9(); }
		delete() { exports._delete_Transform_Transform9(this.pointer); }
	};
	
	module.Ball = class Ball extends module.Shape {
		static CONST_PROPERTIES = [];
		static create(_position, _radius) { return exports._Ball_Ball10(_position.pointer, _radius); }
		delete() { exports._delete_Ball_Ball10(this.pointer); }
	};
	
	module.Polytope = class Polytope extends module.Shape {
		static CONST_PROPERTIES = [];
		static create(_vertices) { return exports._Polytope_Polytope11(_vertices.pointer); }
		delete() { exports._delete_Polytope_Polytope11(this.pointer); }
	};
	
	module.RigidBody = class RigidBody extends Binding {
		static CONST_PROPERTIES = ["position","velocity"];
		get position() { return cast(module.Transform, exports._get_RigidBody_position12(this.pointer)); }
		get velocity() { return cast(module.Transform, exports._get_RigidBody_velocity13(this.pointer)); }
		get name() { return exports._get_RigidBody_name14(this.pointer); }
		set name(_newValue) { exports._set_RigidBody_name14(this.pointer, _newValue); }
		get constraints() { return cast(module.Array_Constraint2_1, exports._get_RigidBody_constraints15(this.pointer)); }
		get dynamic() { return !!exports._get_RigidBody_dynamic16(this.pointer); }
		set dynamic(_newValue) { exports._set_RigidBody_dynamic16(this.pointer, _newValue); }
		get simulated() { return !!exports._get_RigidBody_simulated17(this.pointer); }
		set simulated(_newValue) { exports._set_RigidBody_simulated17(this.pointer, _newValue); }
		get gravity() { return !!exports._get_RigidBody_gravity18(this.pointer); }
		set gravity(_newValue) { exports._set_RigidBody_gravity18(this.pointer, _newValue); }
		get drag() { return !!exports._get_RigidBody_drag19(this.pointer); }
		set drag(_newValue) { exports._set_RigidBody_drag19(this.pointer, _newValue); }
		get restitution() { return exports._get_RigidBody_restitution20(this.pointer); }
		set restitution(_newValue) { exports._set_RigidBody_restitution20(this.pointer, _newValue); }
		get friction() { return exports._get_RigidBody_friction21(this.pointer); }
		set friction(_newValue) { exports._set_RigidBody_friction21(this.pointer, _newValue); }
		get canRotate() { return !!exports._get_RigidBody_canRotate22(this.pointer); }
		set canRotate(_newValue) { exports._set_RigidBody_canRotate22(this.pointer, _newValue); }
		get isTrigger() { return !!exports._get_RigidBody_isTrigger23(this.pointer); }
		set isTrigger(_newValue) { exports._set_RigidBody_isTrigger23(this.pointer, _newValue); }
		get trivialTriggerRule() { return !!exports._get_RigidBody_trivialTriggerRule24(this.pointer); }
		set trivialTriggerRule(_newValue) { exports._set_RigidBody_trivialTriggerRule24(this.pointer, _newValue); }
		get canCollide() { return !!exports._get_RigidBody_canCollide25(this.pointer); }
		set canCollide(_newValue) { exports._set_RigidBody_canCollide25(this.pointer, _newValue); }
		get trivialCollisionRule() { return !!exports._get_RigidBody_trivialCollisionRule26(this.pointer); }
		set trivialCollisionRule(_newValue) { exports._set_RigidBody_trivialCollisionRule26(this.pointer, _newValue); }
		static create(_dynamic) { return exports._RigidBody_RigidBody27(_dynamic); }
		delete() { exports._delete_RigidBody_RigidBody27(this.pointer); }
		set density(_density) { exports._RigidBody_setDensity28(this.pointer, _density); }
		get density() { return exports._RigidBody_getDensity29(this.pointer); }
		get mass() { return exports._RigidBody_getMass30(this.pointer); }
		get inertia() { return exports._RigidBody_getInertia31(this.pointer); }
		addShape(shape) { exports._RigidBody_addShape32(this.pointer, shape.pointer); }
		removeShape(shape) { exports._RigidBody_removeShape33(this.pointer, shape.pointer); }
		applyImpulse(pos, imp) { exports._RigidBody_applyImpulse34(this.pointer, pos.pointer, imp.pointer); }
	};
	
	module.Detector = class Detector extends Binding {
		static CONST_PROPERTIES = [];
		static testCollide(a, b) { return !!exports._Detector_testCollide35(a.pointer, b.pointer); }
	};
	
	module.Constrained = class Constrained extends Binding {
		static CONST_PROPERTIES = ["body"];
		get body() { return cast(module.RigidBody, exports._get_Constrained_body36(this.pointer)); }
		get offset() { return cast(module.VectorN_2_, exports._get_Constrained_offset37(this.pointer)); }
		set offset(_newValue) { exports._set_Constrained_offset37(this.pointer, _newValue.pointer); }
		get isStatic() { return !!exports._get_Constrained_isStatic38(this.pointer); }
		set isStatic(_newValue) { exports._set_Constrained_isStatic38(this.pointer, _newValue); }
		static create(_body, _offset) { return exports._Constrained_Constrained39(_body.pointer, _offset.pointer); }
		delete() { exports._delete_Constrained_Constrained39(this.pointer); }
		get anchor() { return cast(module.VectorN_2_, exports._Constrained_getAnchor40(this.pointer)); }
	};
	
	module.LengthConstraint2 = class LengthConstraint2 extends module.Constraint2 {
		static CONST_PROPERTIES = [];
		get length() { return exports._get_LengthConstraint2_length43(this.pointer); }
		set length(_newValue) { exports._set_LengthConstraint2_length43(this.pointer, _newValue); }
		static create(_a, _b, _length) { return exports._LengthConstraint2_LengthConstraint244(_a.pointer, _b.pointer, _length); }
		delete() { exports._delete_LengthConstraint2_LengthConstraint244(this.pointer); }
	};
	
	module.PositionConstraint2 = class PositionConstraint2 extends module.Constraint2 {
		static CONST_PROPERTIES = [];
		static create(_a, _b) { return exports._PositionConstraint2_PositionConstraint245(_a.pointer, _b.pointer); }
		delete() { exports._delete_PositionConstraint2_PositionConstraint245(this.pointer); }
	};
	
	module.Engine = class Engine extends Binding {
		static CONST_PROPERTIES = [];
		get gravity() { return cast(module.VectorN_2_, exports._get_Engine_gravity46(this.pointer)); }
		set gravity(_newValue) { exports._set_Engine_gravity46(this.pointer, _newValue.pointer); }
		get drag() { return exports._get_Engine_drag47(this.pointer); }
		set drag(_newValue) { exports._set_Engine_drag47(this.pointer, _newValue); }
		get constraintIterations() { return exports._get_Engine_constraintIterations48(this.pointer); }
		set constraintIterations(_newValue) { exports._set_Engine_constraintIterations48(this.pointer, _newValue); }
		get contactIterations() { return exports._get_Engine_contactIterations49(this.pointer); }
		set contactIterations(_newValue) { exports._set_Engine_contactIterations49(this.pointer, _newValue); }
		get iterations() { return exports._get_Engine_iterations50(this.pointer); }
		set iterations(_newValue) { exports._set_Engine_iterations50(this.pointer, _newValue); }
		static create() { return exports._Engine_Engine51(); }
		delete() { exports._delete_Engine_Engine51(this.pointer); }
		addBody(body) { exports._Engine_addBody52(this.pointer, body.pointer); }
		getBodyConstraints(body) { return cast(module.Array_Constraint2_1, exports._Engine_getBodyConstraints53(this.pointer, body.pointer)); }
		removeBody(body) { exports._Engine_removeBody54(this.pointer, body.pointer); }
		get bodies() { return cast(module.Array_RigidBody_1, exports._Engine_getBodies55(this.pointer)); }
		addConstraint(constraint) { exports._Engine_addConstraint56(this.pointer, constraint.pointer); }
		removeConstraint(constraint) { exports._Engine_removeConstraint57(this.pointer, constraint.pointer); }
		get constraints() { return cast(module.Array_Constraint2_1, exports._Engine_getConstraints58(this.pointer)); }
		run(deltaTime) { exports._Engine_run59(this.pointer, deltaTime); }
	};
	
	module.VectorN_2_ = class VectorN_2_ extends Binding {
		static CONST_PROPERTIES = [];
		static create() { return exports._VectorN_2__VectorN60(); }
		delete() { exports._delete_VectorN_2__VectorN60(this.pointer); }
		get(index) { return exports._VectorN_2__get61(this.pointer, index); }
		set(index, value) { exports._VectorN_2__set62(this.pointer, index, value); }
		setAll(x, y) { exports._VectorN_2__setAll63(this.pointer, x, y); }
		static build(x, y) { return cast(module.VectorN_2_, exports._VectorN_2__build64(x, y)); }
	};
	
	module.Array_VectorN_2__0 = class Array_VectorN_2__0 extends Binding {
		static CONST_PROPERTIES = [];
		get length() { return exports._get_Array_VectorN_2__0_length65(this.pointer); }
		static create(_length) { return exports._Array_VectorN_2__0_Array_VectorN_2__066(_length); }
		delete() { exports._delete_Array_VectorN_2__0_Array_VectorN_2__066(this.pointer); }
		get(index) { return cast(module.VectorN_2_, exports._Array_VectorN_2__0_get67(this.pointer, index)); }
		set(index, value) { exports._Array_VectorN_2__0_set68(this.pointer, index, value.pointer); }
	};
	
	module.Array_Constraint2_1 = class Array_Constraint2_1 extends Binding {
		static CONST_PROPERTIES = [];
		get length() { return exports._get_Array_Constraint2_1_length69(this.pointer); }
		static create(_length) { return exports._Array_Constraint2_1_Array_Constraint2_170(_length); }
		delete() { exports._delete_Array_Constraint2_1_Array_Constraint2_170(this.pointer); }
		get(index) { return cast(module.Constraint2, exports._Array_Constraint2_1_get71(this.pointer, index)); }
		set(index, value) { exports._Array_Constraint2_1_set72(this.pointer, index, value.pointer); }
	};
	
	module.Array_RigidBody_1 = class Array_RigidBody_1 extends Binding {
		static CONST_PROPERTIES = [];
		get length() { return exports._get_Array_RigidBody_1_length73(this.pointer); }
		static create(_length) { return exports._Array_RigidBody_1_Array_RigidBody_174(_length); }
		delete() { exports._delete_Array_RigidBody_1_Array_RigidBody_174(this.pointer); }
		get(index) { return cast(module.RigidBody, exports._Array_RigidBody_1_get75(this.pointer, index)); }
		set(index, value) { exports._Array_RigidBody_1_set76(this.pointer, index, value.pointer); }
	};
};