HengineWASMResource.imports["Physics3"] = ["__global_printStringJS0","__global_sendJSArgument1","__global_runJS2","__global_triggerRule4","__global_collisionRule5","__global_onCollide6"];
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
	module.markFlag = function markFlag(_flag) { exports.__global_markFlag3(_flag); }
	Object.defineProperty(module, "triggerRule", {
		set(_fn) {
			imports.__global_triggerRule4 = (_0, _1) => _fn(cast(module.RigidBody, _0), cast(module.RigidBody, _1));
		}
	});
	Object.defineProperty(module, "collisionRule", {
		set(_fn) {
			imports.__global_collisionRule5 = (_0, _1) => _fn(cast(module.RigidBody, _0), cast(module.RigidBody, _1));
		}
	});
	Object.defineProperty(module, "onCollide", {
		set(_fn) {
			imports.__global_onCollide6 = (_0, _1, _2, _3, _4, _5) => _fn(cast(module.RigidBody, _0), cast(module.RigidBody, _1), cast(module.VectorN_3_, _2), cast(module.Array_VectorN_3__0, _3), !!_4, !!_5);
		}
	});
	
	module.Orientation = class Orientation extends Binding {
		static CONST_PROPERTIES = [];
		get rotation() { return cast(module.VectorN_3_, exports._Orientation_getRotation7(this.pointer)); }
		set rotation(_rotation) { exports._Orientation_setRotation8(this.pointer, _rotation.pointer); }
	};
	
	module.Transform = class Transform extends Binding {
		static CONST_PROPERTIES = ["linear","orientation"];
		get linear() { return cast(module.VectorN_3_, exports._get_Transform_linear9(this.pointer)); }
		get orientation() { return cast(module.Orientation, exports._get_Transform_orientation10(this.pointer)); }
		static create() { return exports._Transform_Transform11(); }
		delete() { exports._delete_Transform_Transform11(this.pointer); }
	};
	
	module.Ball = class Ball extends module.Shape {
		static CONST_PROPERTIES = [];
		static create(_position, _radius) { return exports._Ball_Ball12(_position.pointer, _radius); }
		delete() { exports._delete_Ball_Ball12(this.pointer); }
	};
	
	module.Polytope = class Polytope extends module.Shape {
		static CONST_PROPERTIES = [];
		static create(_vertices, _faces) { return exports._Polytope_Polytope13(_vertices.pointer, _faces.pointer); }
		delete() { exports._delete_Polytope_Polytope13(this.pointer); }
	};
	
	module.RigidBody = class RigidBody extends Binding {
		static CONST_PROPERTIES = ["position","velocity"];
		get position() { return cast(module.Transform, exports._get_RigidBody_position14(this.pointer)); }
		get velocity() { return cast(module.Transform, exports._get_RigidBody_velocity15(this.pointer)); }
		get name() { return exports._get_RigidBody_name16(this.pointer); }
		set name(_newValue) { exports._set_RigidBody_name16(this.pointer, _newValue); }
		get constraintDescriptors() { return cast(module.Array_ConstraintDescriptor_1, exports._get_RigidBody_constraintDescriptors17(this.pointer)); }
		get simulated() { return !!exports._get_RigidBody_simulated18(this.pointer); }
		set simulated(_newValue) { exports._set_RigidBody_simulated18(this.pointer, _newValue); }
		get gravity() { return !!exports._get_RigidBody_gravity19(this.pointer); }
		set gravity(_newValue) { exports._set_RigidBody_gravity19(this.pointer, _newValue); }
		get drag() { return !!exports._get_RigidBody_drag20(this.pointer); }
		set drag(_newValue) { exports._set_RigidBody_drag20(this.pointer, _newValue); }
		get restitution() { return exports._get_RigidBody_restitution21(this.pointer); }
		set restitution(_newValue) { exports._set_RigidBody_restitution21(this.pointer, _newValue); }
		get friction() { return exports._get_RigidBody_friction22(this.pointer); }
		set friction(_newValue) { exports._set_RigidBody_friction22(this.pointer, _newValue); }
		get canRotate() { return !!exports._get_RigidBody_canRotate23(this.pointer); }
		set canRotate(_newValue) { exports._set_RigidBody_canRotate23(this.pointer, _newValue); }
		get isTrigger() { return !!exports._get_RigidBody_isTrigger24(this.pointer); }
		set isTrigger(_newValue) { exports._set_RigidBody_isTrigger24(this.pointer, _newValue); }
		get trivialTriggerRule() { return !!exports._get_RigidBody_trivialTriggerRule25(this.pointer); }
		set trivialTriggerRule(_newValue) { exports._set_RigidBody_trivialTriggerRule25(this.pointer, _newValue); }
		get canCollide() { return !!exports._get_RigidBody_canCollide26(this.pointer); }
		set canCollide(_newValue) { exports._set_RigidBody_canCollide26(this.pointer, _newValue); }
		get trivialCollisionRule() { return !!exports._get_RigidBody_trivialCollisionRule27(this.pointer); }
		set trivialCollisionRule(_newValue) { exports._set_RigidBody_trivialCollisionRule27(this.pointer, _newValue); }
		static create(_dynamic) { return exports._RigidBody_RigidBody28(_dynamic); }
		delete() { exports._delete_RigidBody_RigidBody28(this.pointer); }
		get prohibitedDirections() { return cast(module.Array_VectorN_3__0, exports._RigidBody_getProhibitedDirections29(this.pointer)); }
		set dynamic(_dynamic) { exports._RigidBody_setDynamic30(this.pointer, _dynamic); }
		get dynamic() { return !!exports._RigidBody_getDynamic31(this.pointer); }
		set density(_density) { exports._RigidBody_setDensity32(this.pointer, _density); }
		get density() { return exports._RigidBody_getDensity33(this.pointer); }
		get mass() { return exports._RigidBody_getMass34(this.pointer); }
		get inertia() { return cast(module.MatrixRC_3_, exports._RigidBody_getInertia35(this.pointer)); }
		addShape(shape) { exports._RigidBody_addShape36(this.pointer, shape.pointer); }
		removeShape(shape) { exports._RigidBody_removeShape37(this.pointer, shape.pointer); }
		removeAllShapes() { exports._RigidBody_removeAllShapes38(this.pointer); }
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
		removeBody(body) { exports._Engine_removeBody59(this.pointer, body.pointer); }
		get bodies() { return cast(module.Array_RigidBody_1, exports._Engine_getBodies60(this.pointer)); }
		addConstraint(constraint) { exports._Engine_addConstraint61(this.pointer, constraint.pointer); }
		removeConstraint(constraint) { exports._Engine_removeConstraint62(this.pointer, constraint.pointer); }
		get constraintDescriptors() { return cast(module.Array_ConstraintDescriptor_1, exports._Engine_getConstraintDescriptors63(this.pointer)); }
		run(deltaTime) { exports._Engine_run64(this.pointer, deltaTime); }
	};
	
	module.VectorN_3_ = class VectorN_3_ extends Binding {
		static CONST_PROPERTIES = [];
		static create() { return exports._VectorN_3__VectorN65(); }
		delete() { exports._delete_VectorN_3__VectorN65(this.pointer); }
		get(index) { return exports._VectorN_3__get66(this.pointer, index); }
		set(index, value) { exports._VectorN_3__set67(this.pointer, index, value); }
		setAll(x, y, z) { exports._VectorN_3__setAll68(this.pointer, x, y, z); }
		static build(x, y, z) { return cast(module.VectorN_3_, exports._VectorN_3__build69(x, y, z)); }
	};
	
	module.MatrixRC_3_ = class MatrixRC_3_ extends Binding {
		static CONST_PROPERTIES = [];
		static create() { return exports._MatrixRC_3__MatrixRC70(); }
		delete() { exports._delete_MatrixRC_3__MatrixRC70(this.pointer); }
		get(row, column) { return exports._MatrixRC_3__get71(this.pointer, row, column); }
		set(row, column, value) { exports._MatrixRC_3__set72(this.pointer, row, column, value); }
	};
	
	module.Array_VectorN_3__0 = class Array_VectorN_3__0 extends Binding {
		static CONST_PROPERTIES = [];
		get length() { return exports._get_Array_VectorN_3__0_length73(this.pointer); }
		static create(_length) { return exports._Array_VectorN_3__0_Array_VectorN_3__074(_length); }
		delete() { exports._delete_Array_VectorN_3__0_Array_VectorN_3__074(this.pointer); }
		get(index) { return cast(module.VectorN_3_, exports._Array_VectorN_3__0_get75(this.pointer, index)); }
		set(index, value) { exports._Array_VectorN_3__0_set76(this.pointer, index, value.pointer); }
	};
	
	module.Array_int_0 = class Array_int_0 extends Binding {
		static CONST_PROPERTIES = [];
		get length() { return exports._get_Array_int_0_length77(this.pointer); }
		static create(_length) { return exports._Array_int_0_Array_int_078(_length); }
		delete() { exports._delete_Array_int_0_Array_int_078(this.pointer); }
		get(index) { return exports._Array_int_0_get79(this.pointer, index); }
		set(index, value) { exports._Array_int_0_set80(this.pointer, index, value); }
	};
	
	module.Array_ConstraintDescriptor_1 = class Array_ConstraintDescriptor_1 extends Binding {
		static CONST_PROPERTIES = [];
		get length() { return exports._get_Array_ConstraintDescriptor_1_length81(this.pointer); }
		static create(_length) { return exports._Array_ConstraintDescriptor_1_Array_ConstraintDescriptor_182(_length); }
		delete() { exports._delete_Array_ConstraintDescriptor_1_Array_ConstraintDescriptor_182(this.pointer); }
		get(index) { return cast(module.ConstraintDescriptor, exports._Array_ConstraintDescriptor_1_get83(this.pointer, index)); }
		set(index, value) { exports._Array_ConstraintDescriptor_1_set84(this.pointer, index, value.pointer); }
	};
	
	module.Array_RigidBody_1 = class Array_RigidBody_1 extends Binding {
		static CONST_PROPERTIES = [];
		get length() { return exports._get_Array_RigidBody_1_length85(this.pointer); }
		static create(_length) { return exports._Array_RigidBody_1_Array_RigidBody_186(_length); }
		delete() { exports._delete_Array_RigidBody_1_Array_RigidBody_186(this.pointer); }
		get(index) { return cast(module.RigidBody, exports._Array_RigidBody_1_get87(this.pointer, index)); }
		set(index, value) { exports._Array_RigidBody_1_set88(this.pointer, index, value.pointer); }
	};
};