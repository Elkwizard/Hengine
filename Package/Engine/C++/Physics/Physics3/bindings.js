HengineWASMResource.imports["Physics3"] = ["__global_printStringJS0","__global_sendJSArgument1","__global_runJS2","__global_triggerRule3","__global_collisionRule4","__global_onCollide5"];
HengineWASMResource.bindings["Physics3"] = (module, imports, exports) => {
	const { Binding } = HengineWASMResource;
	
	const { cast } = Binding;
	
	module.Shape = class Shape extends Binding {
		static CONST_PROPERTIES = [];
		
	};
	
	module.ConstraintDescriptor = class ConstraintDescriptor extends Binding {
		static CONST_PROPERTIES = ["a","b"];
		get a() { return cast(module.Constrained, exports._get_ConstraintDescriptor_a46(this.pointer)); }
		get b() { return cast(module.Constrained, exports._get_ConstraintDescriptor_b47(this.pointer)); }
		hasBody(body) { return !!exports._ConstraintDescriptor_hasBody48(this.pointer, body.pointer); }
	};
	
	Object.defineProperty(module, "printStringJS", {
		set(_fn) {
			imports.__global_printStringJS0 = (pointer) => _fn(pointer);
		}
	});
	Object.defineProperty(module, "sendJSArgument", {
		set(_fn) {
			imports.__global_sendJSArgument1 = (value) => _fn(value);
		}
	});
	Object.defineProperty(module, "runJS", {
		set(_fn) {
			imports.__global_runJS2 = (pointer) => _fn(pointer);
		}
	});
	Object.defineProperty(module, "triggerRule", {
		set(_fn) {
			imports.__global_triggerRule3 = (_0, _1) => _fn(cast(module.RigidBody, _0), cast(module.RigidBody, _1));
		}
	});
	Object.defineProperty(module, "collisionRule", {
		set(_fn) {
			imports.__global_collisionRule4 = (_0, _1) => _fn(cast(module.RigidBody, _0), cast(module.RigidBody, _1));
		}
	});
	Object.defineProperty(module, "onCollide", {
		set(_fn) {
			imports.__global_onCollide5 = (_0, _1, _2, _3, _4, _5) => _fn(cast(module.RigidBody, _0), cast(module.RigidBody, _1), cast(module.VectorN_3_, _2), cast(module.Array_VectorN_3__0, _3), !!_4, !!_5);
		}
	});
	
	module.Orientation = class Orientation extends Binding {
		static CONST_PROPERTIES = [];
		get rotation() { return cast(module.VectorN_3_, exports._Orientation_getRotation6(this.pointer)); }
		set rotation(_rotation) { exports._Orientation_setRotation7(this.pointer, _rotation.pointer); }
	};
	
	module.Transform = class Transform extends Binding {
		static CONST_PROPERTIES = ["linear","orientation"];
		get linear() { return cast(module.VectorN_3_, exports._get_Transform_linear8(this.pointer)); }
		get orientation() { return cast(module.Orientation, exports._get_Transform_orientation9(this.pointer)); }
		static create() { return exports._Transform_Transform10(); }
		delete() { exports._delete_Transform_Transform10(this.pointer); }
	};
	
	module.Ball = class Ball extends module.Shape {
		static CONST_PROPERTIES = [];
		static create(_position, _radius) { return exports._Ball_Ball11(_position.pointer, _radius); }
		delete() { exports._delete_Ball_Ball11(this.pointer); }
	};
	
	module.Polytope = class Polytope extends module.Shape {
		static CONST_PROPERTIES = [];
		static create(_vertices, _faces) { return exports._Polytope_Polytope12(_vertices.pointer, _faces.pointer); }
		delete() { exports._delete_Polytope_Polytope12(this.pointer); }
	};
	
	module.RigidBody = class RigidBody extends Binding {
		static CONST_PROPERTIES = ["position","velocity"];
		get position() { return cast(module.Transform, exports._get_RigidBody_position13(this.pointer)); }
		get velocity() { return cast(module.Transform, exports._get_RigidBody_velocity14(this.pointer)); }
		get name() { return exports._get_RigidBody_name15(this.pointer); }
		set name(_newValue) { exports._set_RigidBody_name15(this.pointer, _newValue); }
		get constraintDescriptors() { return cast(module.Array_ConstraintDescriptor_1, exports._get_RigidBody_constraintDescriptors16(this.pointer)); }
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
		get prohibitedDirections() { return cast(module.Array_VectorN_3__0, exports._RigidBody_getProhibitedDirections28(this.pointer)); }
		set dynamic(_dynamic) { exports._RigidBody_setDynamic29(this.pointer, _dynamic); }
		get dynamic() { return !!exports._RigidBody_getDynamic30(this.pointer); }
		set density(_density) { exports._RigidBody_setDensity31(this.pointer, _density); }
		get density() { return exports._RigidBody_getDensity32(this.pointer); }
		get mass() { return exports._RigidBody_getMass33(this.pointer); }
		get inertia() { return cast(module.MatrixRC_3_, exports._RigidBody_getInertia34(this.pointer)); }
		addShape(shape) { exports._RigidBody_addShape35(this.pointer, shape.pointer); }
		removeShape(shape) { exports._RigidBody_removeShape36(this.pointer, shape.pointer); }
		removeAllShapes() { exports._RigidBody_removeAllShapes37(this.pointer); }
		get kineticEnergy() { return exports._RigidBody_getKineticEnergy38(this.pointer); }
		applyImpulse(pos, imp) { exports._RigidBody_applyImpulse39(this.pointer, pos.pointer, imp.pointer); }
	};
	
	module.Detector = class Detector extends Binding {
		static CONST_PROPERTIES = [];
		static testCollide(a, b) { return !!exports._Detector_testCollide40(a.pointer, b.pointer); }
	};
	
	module.Constrained = class Constrained extends Binding {
		static CONST_PROPERTIES = ["body"];
		get body() { return cast(module.RigidBody, exports._get_Constrained_body41(this.pointer)); }
		get offset() { return cast(module.VectorN_3_, exports._get_Constrained_offset42(this.pointer)); }
		set offset(_newValue) { exports._set_Constrained_offset42(this.pointer, _newValue.pointer); }
		get isStatic() { return !!exports._get_Constrained_isStatic43(this.pointer); }
		set isStatic(_newValue) { exports._set_Constrained_isStatic43(this.pointer, _newValue); }
		static create(_body, _offset) { return exports._Constrained_Constrained44(_body.pointer, _offset.pointer); }
		delete() { exports._delete_Constrained_Constrained44(this.pointer); }
		get anchor() { return cast(module.VectorN_3_, exports._Constrained_getAnchor45(this.pointer)); }
	};
	
	module.LengthConstraintDescriptor = class LengthConstraintDescriptor extends module.ConstraintDescriptor {
		static CONST_PROPERTIES = [];
		get length() { return exports._get_LengthConstraintDescriptor_length49(this.pointer); }
		set length(_newValue) { exports._set_LengthConstraintDescriptor_length49(this.pointer, _newValue); }
		static create(_a, _b, _length) { return exports._LengthConstraintDescriptor_LengthConstraintDescriptor50(_a.pointer, _b.pointer, _length); }
		delete() { exports._delete_LengthConstraintDescriptor_LengthConstraintDescriptor50(this.pointer); }
	};
	
	module.PositionConstraintDescriptor = class PositionConstraintDescriptor extends module.ConstraintDescriptor {
		static CONST_PROPERTIES = [];
		static create(_a, _b) { return exports._PositionConstraintDescriptor_PositionConstraintDescriptor51(_a.pointer, _b.pointer); }
		delete() { exports._delete_PositionConstraintDescriptor_PositionConstraintDescriptor51(this.pointer); }
	};
	
	module.Engine = class Engine extends Binding {
		static CONST_PROPERTIES = [];
		get gravity() { return cast(module.VectorN_3_, exports._get_Engine_gravity52(this.pointer)); }
		set gravity(_newValue) { exports._set_Engine_gravity52(this.pointer, _newValue.pointer); }
		get drag() { return exports._get_Engine_drag53(this.pointer); }
		set drag(_newValue) { exports._set_Engine_drag53(this.pointer, _newValue); }
		get constraintIterations() { return exports._get_Engine_constraintIterations54(this.pointer); }
		set constraintIterations(_newValue) { exports._set_Engine_constraintIterations54(this.pointer, _newValue); }
		get contactIterations() { return exports._get_Engine_contactIterations55(this.pointer); }
		set contactIterations(_newValue) { exports._set_Engine_contactIterations55(this.pointer, _newValue); }
		get iterations() { return exports._get_Engine_iterations56(this.pointer); }
		set iterations(_newValue) { exports._set_Engine_iterations56(this.pointer, _newValue); }
		static create() { return exports._Engine_Engine57(); }
		delete() { exports._delete_Engine_Engine57(this.pointer); }
		addBody(body) { exports._Engine_addBody58(this.pointer, body.pointer); }
		finalizeBody(body) { exports._Engine_finalizeBody59(this.pointer, body.pointer); }
		removeBody(body) { exports._Engine_removeBody60(this.pointer, body.pointer); }
		get bodies() { return cast(module.Array_RigidBody_1, exports._Engine_getBodies61(this.pointer)); }
		addConstraint(constraint) { exports._Engine_addConstraint62(this.pointer, constraint.pointer); }
		removeConstraint(constraint) { exports._Engine_removeConstraint63(this.pointer, constraint.pointer); }
		get constraintDescriptors() { return cast(module.Array_ConstraintDescriptor_1, exports._Engine_getConstraintDescriptors64(this.pointer)); }
		get kineticEnergy() { return exports._Engine_getKineticEnergy65(this.pointer); }
		run(deltaTime) { exports._Engine_run66(this.pointer, deltaTime); }
	};
	
	module.VectorN_3_ = class VectorN_3_ extends Binding {
		static CONST_PROPERTIES = [];
		static create() { return exports._VectorN_3__VectorN67(); }
		delete() { exports._delete_VectorN_3__VectorN67(this.pointer); }
		get(index) { return exports._VectorN_3__get68(this.pointer, index); }
		set(index, value) { exports._VectorN_3__set69(this.pointer, index, value); }
		setAll(x, y, z) { exports._VectorN_3__setAll70(this.pointer, x, y, z); }
		static build(x, y, z) { return cast(module.VectorN_3_, exports._VectorN_3__build71(x, y, z)); }
	};
	
	module.MatrixRC_3_ = class MatrixRC_3_ extends Binding {
		static CONST_PROPERTIES = [];
		static create() { return exports._MatrixRC_3__MatrixRC72(); }
		delete() { exports._delete_MatrixRC_3__MatrixRC72(this.pointer); }
		get(row, column) { return exports._MatrixRC_3__get73(this.pointer, row, column); }
		set(row, column, value) { exports._MatrixRC_3__set74(this.pointer, row, column, value); }
	};
	
	module.Array_VectorN_3__0 = class Array_VectorN_3__0 extends Binding {
		static CONST_PROPERTIES = [];
		get length() { return exports._get_Array_VectorN_3__0_length75(this.pointer); }
		static create(_length) { return exports._Array_VectorN_3__0_Array_VectorN_3__076(_length); }
		delete() { exports._delete_Array_VectorN_3__0_Array_VectorN_3__076(this.pointer); }
		get(index) { return cast(module.VectorN_3_, exports._Array_VectorN_3__0_get77(this.pointer, index)); }
		set(index, value) { exports._Array_VectorN_3__0_set78(this.pointer, index, value.pointer); }
	};
	
	module.Array_int_0 = class Array_int_0 extends Binding {
		static CONST_PROPERTIES = [];
		get length() { return exports._get_Array_int_0_length79(this.pointer); }
		static create(_length) { return exports._Array_int_0_Array_int_080(_length); }
		delete() { exports._delete_Array_int_0_Array_int_080(this.pointer); }
		get(index) { return exports._Array_int_0_get81(this.pointer, index); }
		set(index, value) { exports._Array_int_0_set82(this.pointer, index, value); }
	};
	
	module.Array_ConstraintDescriptor_1 = class Array_ConstraintDescriptor_1 extends Binding {
		static CONST_PROPERTIES = [];
		get length() { return exports._get_Array_ConstraintDescriptor_1_length83(this.pointer); }
		static create(_length) { return exports._Array_ConstraintDescriptor_1_Array_ConstraintDescriptor_184(_length); }
		delete() { exports._delete_Array_ConstraintDescriptor_1_Array_ConstraintDescriptor_184(this.pointer); }
		get(index) { return cast(module.ConstraintDescriptor, exports._Array_ConstraintDescriptor_1_get85(this.pointer, index)); }
		set(index, value) { exports._Array_ConstraintDescriptor_1_set86(this.pointer, index, value.pointer); }
	};
	
	module.Array_RigidBody_1 = class Array_RigidBody_1 extends Binding {
		static CONST_PROPERTIES = [];
		get length() { return exports._get_Array_RigidBody_1_length87(this.pointer); }
		static create(_length) { return exports._Array_RigidBody_1_Array_RigidBody_188(_length); }
		delete() { exports._delete_Array_RigidBody_1_Array_RigidBody_188(this.pointer); }
		get(index) { return cast(module.RigidBody, exports._Array_RigidBody_1_get89(this.pointer, index)); }
		set(index, value) { exports._Array_RigidBody_1_set90(this.pointer, index, value.pointer); }
	};
};