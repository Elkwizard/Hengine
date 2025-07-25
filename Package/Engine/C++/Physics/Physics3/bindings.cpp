#include "../Physics3.cpp"
API class Array_VectorN_3__0 {
	private:
		std::unique_ptr<VectorN<3>[]> elements;
		
	public:
		API_CONST int length;

		API Array_VectorN_3__0(int _length) {
			length = _length;
			elements = std::make_unique<VectorN<3>[]>(length);
		}

		Array_VectorN_3__0(const std::vector<VectorN<3>>& items)
		: Array_VectorN_3__0(items.size()) {
			for (int i = 0; i < length; i++)
				elements[i] = items[i];
		}

		API VectorN<3>& get(int index) {
			return elements[index];
		}

		API void set(int index, VectorN<3>& value) {
			elements[index] = value;
		}

		operator std::vector<VectorN<3>>() const {
			std::vector<VectorN<3>> result (length);
			for (int i = 0; i < length; i++)
				result[i] = elements[i];
			return result;
		}
};
API class Array_int_0 {
	private:
		std::unique_ptr<int[]> elements;
		
	public:
		API_CONST int length;

		API Array_int_0(int _length) {
			length = _length;
			elements = std::make_unique<int[]>(length);
		}

		Array_int_0(const std::vector<int>& items)
		: Array_int_0(items.size()) {
			for (int i = 0; i < length; i++)
				elements[i] = items[i];
		}

		API int get(int index) {
			return elements[index];
		}

		API void set(int index, int value) {
			elements[index] = value;
		}

		operator std::vector<int>() const {
			std::vector<int> result (length);
			for (int i = 0; i < length; i++)
				result[i] = elements[i];
			return result;
		}
};
API class Array_ConstraintDescriptor_1 {
	private:
		std::unique_ptr<ConstraintDescriptor*[]> elements;
		
	public:
		API_CONST int length;

		API Array_ConstraintDescriptor_1(int _length) {
			length = _length;
			elements = std::make_unique<ConstraintDescriptor*[]>(length);
		}

		Array_ConstraintDescriptor_1(const std::vector<ConstraintDescriptor*>& items)
		: Array_ConstraintDescriptor_1(items.size()) {
			for (int i = 0; i < length; i++)
				elements[i] = items[i];
		}

		API ConstraintDescriptor*& get(int index) {
			return elements[index];
		}

		API void set(int index, ConstraintDescriptor*& value) {
			elements[index] = value;
		}

		operator std::vector<ConstraintDescriptor*>() const {
			std::vector<ConstraintDescriptor*> result (length);
			for (int i = 0; i < length; i++)
				result[i] = elements[i];
			return result;
		}
};
API class Array_RigidBody_1 {
	private:
		std::unique_ptr<RigidBody*[]> elements;
		
	public:
		API_CONST int length;

		API Array_RigidBody_1(int _length) {
			length = _length;
			elements = std::make_unique<RigidBody*[]>(length);
		}

		Array_RigidBody_1(const std::vector<RigidBody*>& items)
		: Array_RigidBody_1(items.size()) {
			for (int i = 0; i < length; i++)
				elements[i] = items[i];
		}

		API RigidBody*& get(int index) {
			return elements[index];
		}

		API void set(int index, RigidBody*& value) {
			elements[index] = value;
		}

		operator std::vector<RigidBody*>() const {
			std::vector<RigidBody*> result (length);
			for (int i = 0; i < length; i++)
				result[i] = elements[i];
			return result;
		}
};
extern "C" {
	EMSCRIPTEN_KEEPALIVE Constrained* _get_ConstraintDescriptor_a46(ConstraintDescriptor* _this) { return &_this->a; }
	EMSCRIPTEN_KEEPALIVE Constrained* _get_ConstraintDescriptor_b47(ConstraintDescriptor* _this) { return &_this->b; }
	EMSCRIPTEN_KEEPALIVE bool _ConstraintDescriptor_hasBody48(ConstraintDescriptor* _this, RigidBody* body) { return _this->hasBody(*body); }
	void __global_printStringJS0(size_t);
	EMSCRIPTEN_KEEPALIVE void printStringJS(size_t pointer) { __global_printStringJS0(pointer); }
	void __global_sendJSArgument1(double);
	EMSCRIPTEN_KEEPALIVE void sendJSArgument(double value) { __global_sendJSArgument1(value); }
	void __global_runJS2(size_t);
	EMSCRIPTEN_KEEPALIVE void runJS(size_t pointer) { __global_runJS2(pointer); }
	bool __global_triggerRule3(const RigidBody*, const RigidBody*);
	EMSCRIPTEN_KEEPALIVE bool triggerRule(const RigidBody& _0, const RigidBody& _1) { return __global_triggerRule3(&_0, &_1); }
	bool __global_collisionRule4(const RigidBody*, const RigidBody*);
	EMSCRIPTEN_KEEPALIVE bool collisionRule(const RigidBody& _0, const RigidBody& _1) { return __global_collisionRule4(&_0, &_1); }
	void __global_onCollide5(const RigidBody*, const RigidBody*, const VectorN<3>*, Array_VectorN_3__0*, bool, bool);
	EMSCRIPTEN_KEEPALIVE void onCollide(const RigidBody& _0, const RigidBody& _1, const VectorN<3>& _2, const std::vector<VectorN<3>>& _3, bool _4, bool _5) { __global_onCollide5(&_0, &_1, &_2, new Array_VectorN_3__0(_3), _4, _5); }
	EMSCRIPTEN_KEEPALIVE const VectorN<3>* _Orientation_getRotation6(Orientation* _this) { return &_this->getRotation(); }
	EMSCRIPTEN_KEEPALIVE void _Orientation_setRotation7(Orientation* _this, const VectorN<3>* _rotation) { _this->setRotation(*_rotation); }
	EMSCRIPTEN_KEEPALIVE VectorN<3>* _get_Transform_linear8(Transform* _this) { return &_this->linear; }
	EMSCRIPTEN_KEEPALIVE Orientation* _get_Transform_orientation9(Transform* _this) { return &_this->orientation; }
	EMSCRIPTEN_KEEPALIVE Transform* _Transform_Transform10() { return new Transform(); }
	EMSCRIPTEN_KEEPALIVE void _delete_Transform_Transform10(Transform* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE Ball* _Ball_Ball11(const VectorN<3>* _position, double _radius) { return new Ball(*_position, _radius); }
	EMSCRIPTEN_KEEPALIVE void _delete_Ball_Ball11(Ball* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE Polytope* _Polytope_Polytope12(Array_VectorN_3__0* _vertices, Array_int_0* _faces) { return new Polytope((std::vector<VectorN<3>>)(*_vertices), (std::vector<int>)(*_faces)); }
	EMSCRIPTEN_KEEPALIVE void _delete_Polytope_Polytope12(Polytope* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE Transform* _get_RigidBody_position13(RigidBody* _this) { return &_this->position; }
	EMSCRIPTEN_KEEPALIVE Transform* _get_RigidBody_velocity14(RigidBody* _this) { return &_this->velocity; }
	EMSCRIPTEN_KEEPALIVE int _get_RigidBody_name15(RigidBody* _this) { return _this->name; }
	EMSCRIPTEN_KEEPALIVE void _set_RigidBody_name15(RigidBody* _this, int _newValue) { _this->name = _newValue; }
	EMSCRIPTEN_KEEPALIVE Array_ConstraintDescriptor_1* _get_RigidBody_constraintDescriptors16(RigidBody* _this) { return new Array_ConstraintDescriptor_1(_this->constraintDescriptors); }
	EMSCRIPTEN_KEEPALIVE bool _get_RigidBody_simulated17(RigidBody* _this) { return _this->simulated; }
	EMSCRIPTEN_KEEPALIVE void _set_RigidBody_simulated17(RigidBody* _this, bool _newValue) { _this->simulated = _newValue; }
	EMSCRIPTEN_KEEPALIVE bool _get_RigidBody_gravity18(RigidBody* _this) { return _this->gravity; }
	EMSCRIPTEN_KEEPALIVE void _set_RigidBody_gravity18(RigidBody* _this, bool _newValue) { _this->gravity = _newValue; }
	EMSCRIPTEN_KEEPALIVE bool _get_RigidBody_drag19(RigidBody* _this) { return _this->drag; }
	EMSCRIPTEN_KEEPALIVE void _set_RigidBody_drag19(RigidBody* _this, bool _newValue) { _this->drag = _newValue; }
	EMSCRIPTEN_KEEPALIVE double _get_RigidBody_restitution20(RigidBody* _this) { return _this->restitution; }
	EMSCRIPTEN_KEEPALIVE void _set_RigidBody_restitution20(RigidBody* _this, double _newValue) { _this->restitution = _newValue; }
	EMSCRIPTEN_KEEPALIVE double _get_RigidBody_friction21(RigidBody* _this) { return _this->friction; }
	EMSCRIPTEN_KEEPALIVE void _set_RigidBody_friction21(RigidBody* _this, double _newValue) { _this->friction = _newValue; }
	EMSCRIPTEN_KEEPALIVE bool _get_RigidBody_canRotate22(RigidBody* _this) { return _this->canRotate; }
	EMSCRIPTEN_KEEPALIVE void _set_RigidBody_canRotate22(RigidBody* _this, bool _newValue) { _this->canRotate = _newValue; }
	EMSCRIPTEN_KEEPALIVE bool _get_RigidBody_isTrigger23(RigidBody* _this) { return _this->isTrigger; }
	EMSCRIPTEN_KEEPALIVE void _set_RigidBody_isTrigger23(RigidBody* _this, bool _newValue) { _this->isTrigger = _newValue; }
	EMSCRIPTEN_KEEPALIVE bool _get_RigidBody_trivialTriggerRule24(RigidBody* _this) { return _this->trivialTriggerRule; }
	EMSCRIPTEN_KEEPALIVE void _set_RigidBody_trivialTriggerRule24(RigidBody* _this, bool _newValue) { _this->trivialTriggerRule = _newValue; }
	EMSCRIPTEN_KEEPALIVE bool _get_RigidBody_canCollide25(RigidBody* _this) { return _this->canCollide; }
	EMSCRIPTEN_KEEPALIVE void _set_RigidBody_canCollide25(RigidBody* _this, bool _newValue) { _this->canCollide = _newValue; }
	EMSCRIPTEN_KEEPALIVE bool _get_RigidBody_trivialCollisionRule26(RigidBody* _this) { return _this->trivialCollisionRule; }
	EMSCRIPTEN_KEEPALIVE void _set_RigidBody_trivialCollisionRule26(RigidBody* _this, bool _newValue) { _this->trivialCollisionRule = _newValue; }
	EMSCRIPTEN_KEEPALIVE RigidBody* _RigidBody_RigidBody27(bool _dynamic) { return new RigidBody(_dynamic); }
	EMSCRIPTEN_KEEPALIVE void _delete_RigidBody_RigidBody27(RigidBody* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE Array_VectorN_3__0* _RigidBody_getProhibitedDirections28(RigidBody* _this) { return new Array_VectorN_3__0(_this->getProhibitedDirections()); }
	EMSCRIPTEN_KEEPALIVE void _RigidBody_setDynamic29(RigidBody* _this, bool _dynamic) { _this->setDynamic(_dynamic); }
	EMSCRIPTEN_KEEPALIVE bool _RigidBody_getDynamic30(RigidBody* _this) { return _this->getDynamic(); }
	EMSCRIPTEN_KEEPALIVE void _RigidBody_setDensity31(RigidBody* _this, double _density) { _this->setDensity(_density); }
	EMSCRIPTEN_KEEPALIVE double _RigidBody_getDensity32(RigidBody* _this) { return _this->getDensity(); }
	EMSCRIPTEN_KEEPALIVE double _RigidBody_getMass33(RigidBody* _this) { return _this->getMass(); }
	EMSCRIPTEN_KEEPALIVE MatrixRC<3>* _RigidBody_getInertia34(RigidBody* _this) { return new MatrixRC<3>(_this->getInertia()); }
	EMSCRIPTEN_KEEPALIVE void _RigidBody_addShape35(RigidBody* _this, Shape* shape) { _this->addShape(shape); }
	EMSCRIPTEN_KEEPALIVE void _RigidBody_removeShape36(RigidBody* _this, Shape* shape) { _this->removeShape(shape); }
	EMSCRIPTEN_KEEPALIVE void _RigidBody_removeAllShapes37(RigidBody* _this) { _this->removeAllShapes(); }
	EMSCRIPTEN_KEEPALIVE double _RigidBody_getKineticEnergy38(RigidBody* _this) { return _this->getKineticEnergy(); }
	EMSCRIPTEN_KEEPALIVE void _RigidBody_applyImpulse39(RigidBody* _this, const VectorN<3>* pos, const VectorN<3>* imp) { _this->applyImpulse(*pos, *imp); }
	EMSCRIPTEN_KEEPALIVE bool _Detector_testCollide40(const Shape* a, const Shape* b) { return Detector::testCollide(*a, *b); }
	EMSCRIPTEN_KEEPALIVE RigidBody* _get_Constrained_body41(Constrained* _this) { return &_this->body; }
	EMSCRIPTEN_KEEPALIVE VectorN<3>* _get_Constrained_offset42(Constrained* _this) { return &_this->offset; }
	EMSCRIPTEN_KEEPALIVE void _set_Constrained_offset42(Constrained* _this, const VectorN<3>* _newValue) { _this->offset = *_newValue; }
	EMSCRIPTEN_KEEPALIVE bool _get_Constrained_isStatic43(Constrained* _this) { return _this->isStatic; }
	EMSCRIPTEN_KEEPALIVE void _set_Constrained_isStatic43(Constrained* _this, bool _newValue) { _this->isStatic = _newValue; }
	EMSCRIPTEN_KEEPALIVE Constrained* _Constrained_Constrained44(RigidBody* _body, const VectorN<3>* _offset) { return new Constrained(*_body, *_offset); }
	EMSCRIPTEN_KEEPALIVE void _delete_Constrained_Constrained44(Constrained* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE VectorN<3>* _Constrained_getAnchor45(Constrained* _this) { return new VectorN<3>(_this->getAnchor()); }
	EMSCRIPTEN_KEEPALIVE double _get_LengthConstraintDescriptor_length49(LengthConstraintDescriptor* _this) { return _this->length; }
	EMSCRIPTEN_KEEPALIVE void _set_LengthConstraintDescriptor_length49(LengthConstraintDescriptor* _this, double _newValue) { _this->length = _newValue; }
	EMSCRIPTEN_KEEPALIVE LengthConstraintDescriptor* _LengthConstraintDescriptor_LengthConstraintDescriptor50(const Constrained* _a, const Constrained* _b, double _length) { return new LengthConstraintDescriptor(*_a, *_b, _length); }
	EMSCRIPTEN_KEEPALIVE void _delete_LengthConstraintDescriptor_LengthConstraintDescriptor50(LengthConstraintDescriptor* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE PositionConstraintDescriptor* _PositionConstraintDescriptor_PositionConstraintDescriptor51(const Constrained* _a, const Constrained* _b) { return new PositionConstraintDescriptor(*_a, *_b); }
	EMSCRIPTEN_KEEPALIVE void _delete_PositionConstraintDescriptor_PositionConstraintDescriptor51(PositionConstraintDescriptor* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE VectorN<3>* _get_Engine_gravity52(Engine* _this) { return &_this->gravity; }
	EMSCRIPTEN_KEEPALIVE void _set_Engine_gravity52(Engine* _this, const VectorN<3>* _newValue) { _this->gravity = *_newValue; }
	EMSCRIPTEN_KEEPALIVE double _get_Engine_drag53(Engine* _this) { return _this->drag; }
	EMSCRIPTEN_KEEPALIVE void _set_Engine_drag53(Engine* _this, double _newValue) { _this->drag = _newValue; }
	EMSCRIPTEN_KEEPALIVE int _get_Engine_constraintIterations54(Engine* _this) { return _this->constraintIterations; }
	EMSCRIPTEN_KEEPALIVE void _set_Engine_constraintIterations54(Engine* _this, int _newValue) { _this->constraintIterations = _newValue; }
	EMSCRIPTEN_KEEPALIVE int _get_Engine_contactIterations55(Engine* _this) { return _this->contactIterations; }
	EMSCRIPTEN_KEEPALIVE void _set_Engine_contactIterations55(Engine* _this, int _newValue) { _this->contactIterations = _newValue; }
	EMSCRIPTEN_KEEPALIVE int _get_Engine_iterations56(Engine* _this) { return _this->iterations; }
	EMSCRIPTEN_KEEPALIVE void _set_Engine_iterations56(Engine* _this, int _newValue) { _this->iterations = _newValue; }
	EMSCRIPTEN_KEEPALIVE Engine* _Engine_Engine57() { return new Engine(); }
	EMSCRIPTEN_KEEPALIVE void _delete_Engine_Engine57(Engine* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE void _Engine_addBody58(Engine* _this, RigidBody* body) { _this->addBody(body); }
	EMSCRIPTEN_KEEPALIVE void _Engine_removeBody59(Engine* _this, RigidBody* body) { _this->removeBody(body); }
	EMSCRIPTEN_KEEPALIVE Array_RigidBody_1* _Engine_getBodies60(Engine* _this) { return new Array_RigidBody_1(_this->getBodies()); }
	EMSCRIPTEN_KEEPALIVE void _Engine_addConstraint61(Engine* _this, ConstraintDescriptor* constraint) { _this->addConstraint(constraint); }
	EMSCRIPTEN_KEEPALIVE void _Engine_removeConstraint62(Engine* _this, ConstraintDescriptor* constraint) { _this->removeConstraint(constraint); }
	EMSCRIPTEN_KEEPALIVE Array_ConstraintDescriptor_1* _Engine_getConstraintDescriptors63(Engine* _this) { return new Array_ConstraintDescriptor_1(_this->getConstraintDescriptors()); }
	EMSCRIPTEN_KEEPALIVE double _Engine_getKineticEnergy64(Engine* _this) { return _this->getKineticEnergy(); }
	EMSCRIPTEN_KEEPALIVE void _Engine_run65(Engine* _this, double deltaTime) { _this->run(deltaTime); }
	EMSCRIPTEN_KEEPALIVE VectorN<3>* _VectorN_3__VectorN66() { return new VectorN<3>(); }
	EMSCRIPTEN_KEEPALIVE void _delete_VectorN_3__VectorN66(VectorN<3>* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE double _VectorN_3__get67(VectorN<3>* _this, int index) { return _this->get(index); }
	EMSCRIPTEN_KEEPALIVE void _VectorN_3__set68(VectorN<3>* _this, int index, double value) { _this->set(index, value); }
	EMSCRIPTEN_KEEPALIVE void _VectorN_3__setAll69(VectorN<3>* _this, double x, double y, double z) { _this->setAll(x, y, z); }
	EMSCRIPTEN_KEEPALIVE VectorN<3>* _VectorN_3__build70(double x, double y, double z) { return new VectorN<3>(VectorN<3>::build(x, y, z)); }
	EMSCRIPTEN_KEEPALIVE MatrixRC<3>* _MatrixRC_3__MatrixRC71() { return new MatrixRC<3>(); }
	EMSCRIPTEN_KEEPALIVE void _delete_MatrixRC_3__MatrixRC71(MatrixRC<3>* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE double _MatrixRC_3__get72(MatrixRC<3>* _this, int row, int column) { return _this->get(row, column); }
	EMSCRIPTEN_KEEPALIVE void _MatrixRC_3__set73(MatrixRC<3>* _this, int row, int column, double value) { _this->set(row, column, value); }
	EMSCRIPTEN_KEEPALIVE int _get_Array_VectorN_3__0_length74(Array_VectorN_3__0* _this) { return _this->length; }
	EMSCRIPTEN_KEEPALIVE Array_VectorN_3__0* _Array_VectorN_3__0_Array_VectorN_3__075(int _length) { return new Array_VectorN_3__0(_length); }
	EMSCRIPTEN_KEEPALIVE void _delete_Array_VectorN_3__0_Array_VectorN_3__075(Array_VectorN_3__0* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE VectorN<3>* _Array_VectorN_3__0_get76(Array_VectorN_3__0* _this, int index) { return &_this->get(index); }
	EMSCRIPTEN_KEEPALIVE void _Array_VectorN_3__0_set77(Array_VectorN_3__0* _this, int index, VectorN<3>* value) { _this->set(index, *value); }
	EMSCRIPTEN_KEEPALIVE int _get_Array_int_0_length78(Array_int_0* _this) { return _this->length; }
	EMSCRIPTEN_KEEPALIVE Array_int_0* _Array_int_0_Array_int_079(int _length) { return new Array_int_0(_length); }
	EMSCRIPTEN_KEEPALIVE void _delete_Array_int_0_Array_int_079(Array_int_0* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE int _Array_int_0_get80(Array_int_0* _this, int index) { return _this->get(index); }
	EMSCRIPTEN_KEEPALIVE void _Array_int_0_set81(Array_int_0* _this, int index, int value) { _this->set(index, value); }
	EMSCRIPTEN_KEEPALIVE int _get_Array_ConstraintDescriptor_1_length82(Array_ConstraintDescriptor_1* _this) { return _this->length; }
	EMSCRIPTEN_KEEPALIVE Array_ConstraintDescriptor_1* _Array_ConstraintDescriptor_1_Array_ConstraintDescriptor_183(int _length) { return new Array_ConstraintDescriptor_1(_length); }
	EMSCRIPTEN_KEEPALIVE void _delete_Array_ConstraintDescriptor_1_Array_ConstraintDescriptor_183(Array_ConstraintDescriptor_1* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE ConstraintDescriptor* _Array_ConstraintDescriptor_1_get84(Array_ConstraintDescriptor_1* _this, int index) { return _this->get(index); }
	EMSCRIPTEN_KEEPALIVE void _Array_ConstraintDescriptor_1_set85(Array_ConstraintDescriptor_1* _this, int index, ConstraintDescriptor* value) { _this->set(index, value); }
	EMSCRIPTEN_KEEPALIVE int _get_Array_RigidBody_1_length86(Array_RigidBody_1* _this) { return _this->length; }
	EMSCRIPTEN_KEEPALIVE Array_RigidBody_1* _Array_RigidBody_1_Array_RigidBody_187(int _length) { return new Array_RigidBody_1(_length); }
	EMSCRIPTEN_KEEPALIVE void _delete_Array_RigidBody_1_Array_RigidBody_187(Array_RigidBody_1* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE RigidBody* _Array_RigidBody_1_get88(Array_RigidBody_1* _this, int index) { return _this->get(index); }
	EMSCRIPTEN_KEEPALIVE void _Array_RigidBody_1_set89(Array_RigidBody_1* _this, int index, RigidBody* value) { _this->set(index, value); }
}