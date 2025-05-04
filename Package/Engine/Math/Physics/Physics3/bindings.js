HengineWASMResource.imports["Physics3"] = ["__global_printStringJS0","__global_asymmetricTriggerRule1","__global_symmetricCollisionRule2","__global_onCollide3"];
HengineWASMResource.bindings["Physics3"] = (module, imports, exports) => {
	const { Binding } = HengineWASMResource;
	
	const { cast } = Binding;
	
	module.Constraint = class Constraint extends Binding {
		static CONST_PROPERTIES = [];
		get dynamic() { return !!exports._get_Constraint_dynamic33(this.pointer); }
		set dynamic(_newValue) { exports._set_Constraint_dynamic33(this.pointer, _newValue); }
	};
	
	module.Shape = class Shape extends Binding {
		static CONST_PROPERTIES = [];
		
	};
	
	module.Constraint2 = class Constraint2 extends module.Constraint {
		static CONST_PROPERTIES = ["a","b"];
		get a() { return cast(module.Constrained, exports._get_Constraint2_a39(this.pointer)); }
		get b() { return cast(module.Constrained, exports._get_Constraint2_b40(this.pointer)); }
	};
	
	Object.defineProperty(module, "printStringJS", {
		set(_fn) {
			imports.__global_printStringJS0 = (pointer) => _fn(pointer);
		}
	});
	Object.defineProperty(module, "asymmetricTriggerRule", {
		set(_fn) {
			imports.__global_asymmetricTriggerRule1 = (_0, _1) => _fn(cast(module.RigidBody, _0), cast(module.RigidBody, _1));
		}
	});
	Object.defineProperty(module, "symmetricCollisionRule", {
		set(_fn) {
			imports.__global_symmetricCollisionRule2 = (_0, _1) => _fn(cast(module.RigidBody, _0), cast(module.RigidBody, _1));
		}
	});
	Object.defineProperty(module, "onCollide", {
		set(_fn) {
			imports.__global_onCollide3 = (_0, _1, _2, _3, _4, _5) => _fn(cast(module.RigidBody, _0), cast(module.RigidBody, _1), cast(module.VectorN_3_, _2), cast(module.Array_VectorN_3__0, _3), !!_4, !!_5);
		}
	});
	
	module.Orientation = class Orientation extends Binding {
		static CONST_PROPERTIES = [];
		get rotation() { return cast(module.VectorN_3_, exports._Orientation_getRotation4(this.pointer)); }
		set rotation(_rotation) { exports._Orientation_setRotation5(this.pointer, _rotation.pointer); }
	};
	
	module.Transform = class Transform extends Binding {
		static CONST_PROPERTIES = ["linear","orientation"];
		get linear() { return cast(module.VectorN_3_, exports._get_Transform_linear6(this.pointer)); }
		get orientation() { return cast(module.Orientation, exports._get_Transform_orientation7(this.pointer)); }
		static create() { return exports._Transform_Transform8(); }
		delete() { exports._delete_Transform_Transform8(this.pointer); }
	};
	
	module.Ball = class Ball extends module.Shape {
		static CONST_PROPERTIES = [];
		static create(_position, _radius) { return exports._Ball_Ball9(_position.pointer, _radius); }
		delete() { exports._delete_Ball_Ball9(this.pointer); }
	};
	
	module.Polytope = class Polytope extends module.Shape {
		static CONST_PROPERTIES = [];
		static create(_vertices, _faces) { return exports._Polytope_Polytope10(_vertices.pointer, _faces.pointer); }
		delete() { exports._delete_Polytope_Polytope10(this.pointer); }
	};
	
	module.RigidBody = class RigidBody extends Binding {
		static CONST_PROPERTIES = ["position","velocity"];
		get position() { return cast(module.Transform, exports._get_RigidBody_position11(this.pointer)); }
		get velocity() { return cast(module.Transform, exports._get_RigidBody_velocity12(this.pointer)); }
		get dynamic() { return !!exports._get_RigidBody_dynamic13(this.pointer); }
		set dynamic(_newValue) { exports._set_RigidBody_dynamic13(this.pointer, _newValue); }
		get simulated() { return !!exports._get_RigidBody_simulated14(this.pointer); }
		set simulated(_newValue) { exports._set_RigidBody_simulated14(this.pointer, _newValue); }
		get gravity() { return !!exports._get_RigidBody_gravity15(this.pointer); }
		set gravity(_newValue) { exports._set_RigidBody_gravity15(this.pointer, _newValue); }
		get drag() { return !!exports._get_RigidBody_drag16(this.pointer); }
		set drag(_newValue) { exports._set_RigidBody_drag16(this.pointer, _newValue); }
		get restitution() { return exports._get_RigidBody_restitution17(this.pointer); }
		set restitution(_newValue) { exports._set_RigidBody_restitution17(this.pointer, _newValue); }
		get friction() { return exports._get_RigidBody_friction18(this.pointer); }
		set friction(_newValue) { exports._set_RigidBody_friction18(this.pointer, _newValue); }
		get canRotate() { return !!exports._get_RigidBody_canRotate19(this.pointer); }
		set canRotate(_newValue) { exports._set_RigidBody_canRotate19(this.pointer, _newValue); }
		get isTrigger() { return !!exports._get_RigidBody_isTrigger20(this.pointer); }
		set isTrigger(_newValue) { exports._set_RigidBody_isTrigger20(this.pointer, _newValue); }
		get trivialTriggerRule() { return !!exports._get_RigidBody_trivialTriggerRule21(this.pointer); }
		set trivialTriggerRule(_newValue) { exports._set_RigidBody_trivialTriggerRule21(this.pointer, _newValue); }
		get canCollide() { return !!exports._get_RigidBody_canCollide22(this.pointer); }
		set canCollide(_newValue) { exports._set_RigidBody_canCollide22(this.pointer, _newValue); }
		get trivialCollisionRule() { return !!exports._get_RigidBody_trivialCollisionRule23(this.pointer); }
		set trivialCollisionRule(_newValue) { exports._set_RigidBody_trivialCollisionRule23(this.pointer, _newValue); }
		static create(_dynamic) { return exports._RigidBody_RigidBody24(_dynamic); }
		delete() { exports._delete_RigidBody_RigidBody24(this.pointer); }
		set density(_density) { exports._RigidBody_setDensity25(this.pointer, _density); }
		get density() { return exports._RigidBody_getDensity26(this.pointer); }
		get mass() { return exports._RigidBody_getMass27(this.pointer); }
		get inertia() { return cast(module.MatrixRC_3_, exports._RigidBody_getInertia28(this.pointer)); }
		addShape(shape) { exports._RigidBody_addShape29(this.pointer, shape.pointer); }
		removeShape(shape) { exports._RigidBody_removeShape30(this.pointer, shape.pointer); }
		applyImpulse(pos, imp) { exports._RigidBody_applyImpulse31(this.pointer, pos.pointer, imp.pointer); }
	};
	
	module.Detector = class Detector extends Binding {
		static CONST_PROPERTIES = [];
		static testCollide(a, b) { return !!exports._Detector_testCollide32(a.pointer, b.pointer); }
	};
	
	module.Constrained = class Constrained extends Binding {
		static CONST_PROPERTIES = ["body"];
		get body() { return cast(module.RigidBody, exports._get_Constrained_body34(this.pointer)); }
		get offset() { return cast(module.VectorN_3_, exports._get_Constrained_offset35(this.pointer)); }
		set offset(_newValue) { exports._set_Constrained_offset35(this.pointer, _newValue.pointer); }
		get isStatic() { return !!exports._get_Constrained_isStatic36(this.pointer); }
		set isStatic(_newValue) { exports._set_Constrained_isStatic36(this.pointer, _newValue); }
		static create(_body, _offset) { return exports._Constrained_Constrained37(_body.pointer, _offset.pointer); }
		delete() { exports._delete_Constrained_Constrained37(this.pointer); }
		get anchor() { return cast(module.VectorN_3_, exports._Constrained_getAnchor38(this.pointer)); }
	};
	
	module.LengthConstraint2 = class LengthConstraint2 extends module.Constraint2 {
		static CONST_PROPERTIES = [];
		get length() { return exports._get_LengthConstraint2_length41(this.pointer); }
		set length(_newValue) { exports._set_LengthConstraint2_length41(this.pointer, _newValue); }
		static create(_a, _b, _length) { return exports._LengthConstraint2_LengthConstraint242(_a.pointer, _b.pointer, _length); }
		delete() { exports._delete_LengthConstraint2_LengthConstraint242(this.pointer); }
	};
	
	module.PositionConstraint2 = class PositionConstraint2 extends module.Constraint2 {
		static CONST_PROPERTIES = [];
		static create(_a, _b) { return exports._PositionConstraint2_PositionConstraint243(_a.pointer, _b.pointer); }
		delete() { exports._delete_PositionConstraint2_PositionConstraint243(this.pointer); }
	};
	
	module.Engine = class Engine extends Binding {
		static CONST_PROPERTIES = [];
		get gravity() { return cast(module.VectorN_3_, exports._get_Engine_gravity44(this.pointer)); }
		set gravity(_newValue) { exports._set_Engine_gravity44(this.pointer, _newValue.pointer); }
		get drag() { return exports._get_Engine_drag45(this.pointer); }
		set drag(_newValue) { exports._set_Engine_drag45(this.pointer, _newValue); }
		get constraintIterations() { return exports._get_Engine_constraintIterations46(this.pointer); }
		set constraintIterations(_newValue) { exports._set_Engine_constraintIterations46(this.pointer, _newValue); }
		get contactIterations() { return exports._get_Engine_contactIterations47(this.pointer); }
		set contactIterations(_newValue) { exports._set_Engine_contactIterations47(this.pointer, _newValue); }
		get iterations() { return exports._get_Engine_iterations48(this.pointer); }
		set iterations(_newValue) { exports._set_Engine_iterations48(this.pointer, _newValue); }
		static create() { return exports._Engine_Engine49(); }
		delete() { exports._delete_Engine_Engine49(this.pointer); }
		addBody(body) { exports._Engine_addBody50(this.pointer, body.pointer); }
		getBodyConstraints(body) { return cast(module.Array_Constraint2_1, exports._Engine_getBodyConstraints51(this.pointer, body.pointer)); }
		removeBody(body) { exports._Engine_removeBody52(this.pointer, body.pointer); }
		get bodies() { return cast(module.Array_RigidBody_1, exports._Engine_getBodies53(this.pointer)); }
		addConstraint(constraint) { exports._Engine_addConstraint54(this.pointer, constraint.pointer); }
		removeConstraint(constraint) { exports._Engine_removeConstraint55(this.pointer, constraint.pointer); }
		get constraints() { return cast(module.Array_Constraint2_1, exports._Engine_getConstraints56(this.pointer)); }
		run() { exports._Engine_run57(this.pointer); }
	};
	
	module.VectorN_3_ = class VectorN_3_ extends Binding {
		static CONST_PROPERTIES = [];
		static create() { return exports._VectorN_3__VectorN58(); }
		delete() { exports._delete_VectorN_3__VectorN58(this.pointer); }
		get(index) { return exports._VectorN_3__get59(this.pointer, index); }
		set(index, value) { exports._VectorN_3__set60(this.pointer, index, value); }
		setAll(x, y, z) { exports._VectorN_3__setAll61(this.pointer, x, y, z); }
		static build(x, y, z) { return cast(module.VectorN_3_, exports._VectorN_3__build62(x, y, z)); }
	};
	
	module.MatrixRC_3_ = class MatrixRC_3_ extends Binding {
		static CONST_PROPERTIES = [];
		static create() { return exports._MatrixRC_3__MatrixRC63(); }
		delete() { exports._delete_MatrixRC_3__MatrixRC63(this.pointer); }
		get(row, column) { return exports._MatrixRC_3__get64(this.pointer, row, column); }
		set(row, column, value) { exports._MatrixRC_3__set65(this.pointer, row, column, value); }
	};
	
	module.Array_VectorN_3__0 = class Array_VectorN_3__0 extends Binding {
		static CONST_PROPERTIES = [];
		get length() { return exports._get_Array_VectorN_3__0_length66(this.pointer); }
		static create(_length) { return exports._Array_VectorN_3__0_Array_VectorN_3__067(_length); }
		delete() { exports._delete_Array_VectorN_3__0_Array_VectorN_3__067(this.pointer); }
		get(index) { return cast(module.VectorN_3_, exports._Array_VectorN_3__0_get68(this.pointer, index)); }
		set(index, value) { exports._Array_VectorN_3__0_set69(this.pointer, index, value.pointer); }
	};
	
	module.Array_int_0 = class Array_int_0 extends Binding {
		static CONST_PROPERTIES = [];
		get length() { return exports._get_Array_int_0_length70(this.pointer); }
		static create(_length) { return exports._Array_int_0_Array_int_071(_length); }
		delete() { exports._delete_Array_int_0_Array_int_071(this.pointer); }
		get(index) { return exports._Array_int_0_get72(this.pointer, index); }
		set(index, value) { exports._Array_int_0_set73(this.pointer, index, value); }
	};
	
	module.Array_Constraint2_1 = class Array_Constraint2_1 extends Binding {
		static CONST_PROPERTIES = [];
		get length() { return exports._get_Array_Constraint2_1_length74(this.pointer); }
		static create(_length) { return exports._Array_Constraint2_1_Array_Constraint2_175(_length); }
		delete() { exports._delete_Array_Constraint2_1_Array_Constraint2_175(this.pointer); }
		get(index) { return cast(module.Constraint2, exports._Array_Constraint2_1_get76(this.pointer, index)); }
		set(index, value) { exports._Array_Constraint2_1_set77(this.pointer, index, value.pointer); }
	};
	
	module.Array_RigidBody_1 = class Array_RigidBody_1 extends Binding {
		static CONST_PROPERTIES = [];
		get length() { return exports._get_Array_RigidBody_1_length78(this.pointer); }
		static create(_length) { return exports._Array_RigidBody_1_Array_RigidBody_179(_length); }
		delete() { exports._delete_Array_RigidBody_1_Array_RigidBody_179(this.pointer); }
		get(index) { return cast(module.RigidBody, exports._Array_RigidBody_1_get80(this.pointer, index)); }
		set(index, value) { exports._Array_RigidBody_1_set81(this.pointer, index, value.pointer); }
	};
};