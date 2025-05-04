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
API class Array_Constraint2_1 {
	private:
		std::unique_ptr<Constraint2*[]> elements;
		
	public:
		API_CONST int length;

		API Array_Constraint2_1(int _length) {
			length = _length;
			elements = std::make_unique<Constraint2*[]>(length);
		}

		Array_Constraint2_1(const std::vector<Constraint2*>& items)
		: Array_Constraint2_1(items.size()) {
			for (int i = 0; i < length; i++)
				elements[i] = items[i];
		}

		API Constraint2*& get(int index) {
			return elements[index];
		}

		API void set(int index, Constraint2*& value) {
			elements[index] = value;
		}

		operator std::vector<Constraint2*>() const {
			std::vector<Constraint2*> result (length);
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
	EMSCRIPTEN_KEEPALIVE bool _get_Constraint_dynamic33(Constraint* _this) { return _this->dynamic; }
	EMSCRIPTEN_KEEPALIVE void _set_Constraint_dynamic33(Constraint* _this, bool _newValue) { _this->dynamic = _newValue; }
	EMSCRIPTEN_KEEPALIVE Constrained* _get_Constraint2_a39(Constraint2* _this) { return &_this->a; }
	EMSCRIPTEN_KEEPALIVE Constrained* _get_Constraint2_b40(Constraint2* _this) { return &_this->b; }
	void __global_printStringJS0(size_t);
	EMSCRIPTEN_KEEPALIVE void printStringJS(size_t pointer) { __global_printStringJS0(pointer); }
	bool __global_asymmetricTriggerRule1(const RigidBody*, const RigidBody*);
	EMSCRIPTEN_KEEPALIVE bool asymmetricTriggerRule(const RigidBody& _0, const RigidBody& _1) { return __global_asymmetricTriggerRule1(&_0, &_1); }
	bool __global_symmetricCollisionRule2(const RigidBody*, const RigidBody*);
	EMSCRIPTEN_KEEPALIVE bool symmetricCollisionRule(const RigidBody& _0, const RigidBody& _1) { return __global_symmetricCollisionRule2(&_0, &_1); }
	void __global_onCollide3(const RigidBody*, const RigidBody*, const VectorN<3>*, Array_VectorN_3__0*, bool, bool);
	EMSCRIPTEN_KEEPALIVE void onCollide(const RigidBody& _0, const RigidBody& _1, const VectorN<3>& _2, const std::vector<VectorN<3>>& _3, bool _4, bool _5) { __global_onCollide3(&_0, &_1, &_2, new Array_VectorN_3__0(_3), _4, _5); }
	EMSCRIPTEN_KEEPALIVE VectorN<3>* _Orientation_getRotation4(Orientation* _this) { return new VectorN<3>(_this->getRotation()); }
	EMSCRIPTEN_KEEPALIVE void _Orientation_setRotation5(Orientation* _this, const VectorN<3>* _rotation) { _this->setRotation(*_rotation); }
	EMSCRIPTEN_KEEPALIVE VectorN<3>* _get_Transform_linear6(Transform* _this) { return &_this->linear; }
	EMSCRIPTEN_KEEPALIVE Orientation* _get_Transform_orientation7(Transform* _this) { return &_this->orientation; }
	EMSCRIPTEN_KEEPALIVE Transform* _Transform_Transform8() { return new Transform(); }
	EMSCRIPTEN_KEEPALIVE void _delete_Transform_Transform8(Transform* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE Ball* _Ball_Ball9(const VectorN<3>* _position, double _radius) { return new Ball(*_position, _radius); }
	EMSCRIPTEN_KEEPALIVE void _delete_Ball_Ball9(Ball* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE Polytope* _Polytope_Polytope10(Array_VectorN_3__0* _vertices, Array_int_0* _faces) { return new Polytope((std::vector<VectorN<3>>)(*_vertices), (std::vector<int>)(*_faces)); }
	EMSCRIPTEN_KEEPALIVE void _delete_Polytope_Polytope10(Polytope* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE Transform* _get_RigidBody_position11(RigidBody* _this) { return &_this->position; }
	EMSCRIPTEN_KEEPALIVE Transform* _get_RigidBody_velocity12(RigidBody* _this) { return &_this->velocity; }
	EMSCRIPTEN_KEEPALIVE bool _get_RigidBody_dynamic13(RigidBody* _this) { return _this->dynamic; }
	EMSCRIPTEN_KEEPALIVE void _set_RigidBody_dynamic13(RigidBody* _this, bool _newValue) { _this->dynamic = _newValue; }
	EMSCRIPTEN_KEEPALIVE bool _get_RigidBody_simulated14(RigidBody* _this) { return _this->simulated; }
	EMSCRIPTEN_KEEPALIVE void _set_RigidBody_simulated14(RigidBody* _this, bool _newValue) { _this->simulated = _newValue; }
	EMSCRIPTEN_KEEPALIVE bool _get_RigidBody_gravity15(RigidBody* _this) { return _this->gravity; }
	EMSCRIPTEN_KEEPALIVE void _set_RigidBody_gravity15(RigidBody* _this, bool _newValue) { _this->gravity = _newValue; }
	EMSCRIPTEN_KEEPALIVE bool _get_RigidBody_drag16(RigidBody* _this) { return _this->drag; }
	EMSCRIPTEN_KEEPALIVE void _set_RigidBody_drag16(RigidBody* _this, bool _newValue) { _this->drag = _newValue; }
	EMSCRIPTEN_KEEPALIVE double _get_RigidBody_restitution17(RigidBody* _this) { return _this->restitution; }
	EMSCRIPTEN_KEEPALIVE void _set_RigidBody_restitution17(RigidBody* _this, double _newValue) { _this->restitution = _newValue; }
	EMSCRIPTEN_KEEPALIVE double _get_RigidBody_friction18(RigidBody* _this) { return _this->friction; }
	EMSCRIPTEN_KEEPALIVE void _set_RigidBody_friction18(RigidBody* _this, double _newValue) { _this->friction = _newValue; }
	EMSCRIPTEN_KEEPALIVE bool _get_RigidBody_canRotate19(RigidBody* _this) { return _this->canRotate; }
	EMSCRIPTEN_KEEPALIVE void _set_RigidBody_canRotate19(RigidBody* _this, bool _newValue) { _this->canRotate = _newValue; }
	EMSCRIPTEN_KEEPALIVE bool _get_RigidBody_isTrigger20(RigidBody* _this) { return _this->isTrigger; }
	EMSCRIPTEN_KEEPALIVE void _set_RigidBody_isTrigger20(RigidBody* _this, bool _newValue) { _this->isTrigger = _newValue; }
	EMSCRIPTEN_KEEPALIVE bool _get_RigidBody_trivialTriggerRule21(RigidBody* _this) { return _this->trivialTriggerRule; }
	EMSCRIPTEN_KEEPALIVE void _set_RigidBody_trivialTriggerRule21(RigidBody* _this, bool _newValue) { _this->trivialTriggerRule = _newValue; }
	EMSCRIPTEN_KEEPALIVE bool _get_RigidBody_canCollide22(RigidBody* _this) { return _this->canCollide; }
	EMSCRIPTEN_KEEPALIVE void _set_RigidBody_canCollide22(RigidBody* _this, bool _newValue) { _this->canCollide = _newValue; }
	EMSCRIPTEN_KEEPALIVE bool _get_RigidBody_trivialCollisionRule23(RigidBody* _this) { return _this->trivialCollisionRule; }
	EMSCRIPTEN_KEEPALIVE void _set_RigidBody_trivialCollisionRule23(RigidBody* _this, bool _newValue) { _this->trivialCollisionRule = _newValue; }
	EMSCRIPTEN_KEEPALIVE RigidBody* _RigidBody_RigidBody24(bool _dynamic) { return new RigidBody(_dynamic); }
	EMSCRIPTEN_KEEPALIVE void _delete_RigidBody_RigidBody24(RigidBody* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE void _RigidBody_setDensity25(RigidBody* _this, double _density) { _this->setDensity(_density); }
	EMSCRIPTEN_KEEPALIVE double _RigidBody_getDensity26(RigidBody* _this) { return _this->getDensity(); }
	EMSCRIPTEN_KEEPALIVE double _RigidBody_getMass27(RigidBody* _this) { return _this->getMass(); }
	EMSCRIPTEN_KEEPALIVE MatrixRC<3>* _RigidBody_getInertia28(RigidBody* _this) { return new MatrixRC<3>(_this->getInertia()); }
	EMSCRIPTEN_KEEPALIVE void _RigidBody_addShape29(RigidBody* _this, Shape* shape) { _this->addShape(shape); }
	EMSCRIPTEN_KEEPALIVE void _RigidBody_removeShape30(RigidBody* _this, Shape* shape) { _this->removeShape(shape); }
	EMSCRIPTEN_KEEPALIVE void _RigidBody_applyImpulse31(RigidBody* _this, const VectorN<3>* pos, const VectorN<3>* imp) { _this->applyImpulse(*pos, *imp); }
	EMSCRIPTEN_KEEPALIVE bool _Detector_testCollide32(const Shape* a, const Shape* b) { return Detector::testCollide(*a, *b); }
	EMSCRIPTEN_KEEPALIVE RigidBody* _get_Constrained_body34(Constrained* _this) { return &_this->body; }
	EMSCRIPTEN_KEEPALIVE VectorN<3>* _get_Constrained_offset35(Constrained* _this) { return &_this->offset; }
	EMSCRIPTEN_KEEPALIVE void _set_Constrained_offset35(Constrained* _this, const VectorN<3>* _newValue) { _this->offset = *_newValue; }
	EMSCRIPTEN_KEEPALIVE bool _get_Constrained_isStatic36(Constrained* _this) { return _this->isStatic; }
	EMSCRIPTEN_KEEPALIVE void _set_Constrained_isStatic36(Constrained* _this, bool _newValue) { _this->isStatic = _newValue; }
	EMSCRIPTEN_KEEPALIVE Constrained* _Constrained_Constrained37(RigidBody* _body, const VectorN<3>* _offset) { return new Constrained(*_body, *_offset); }
	EMSCRIPTEN_KEEPALIVE void _delete_Constrained_Constrained37(Constrained* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE VectorN<3>* _Constrained_getAnchor38(Constrained* _this) { return new VectorN<3>(_this->getAnchor()); }
	EMSCRIPTEN_KEEPALIVE double _get_LengthConstraint2_length41(LengthConstraint2* _this) { return _this->length; }
	EMSCRIPTEN_KEEPALIVE void _set_LengthConstraint2_length41(LengthConstraint2* _this, double _newValue) { _this->length = _newValue; }
	EMSCRIPTEN_KEEPALIVE LengthConstraint2* _LengthConstraint2_LengthConstraint242(const Constrained* _a, const Constrained* _b, double _length) { return new LengthConstraint2(*_a, *_b, _length); }
	EMSCRIPTEN_KEEPALIVE void _delete_LengthConstraint2_LengthConstraint242(LengthConstraint2* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE PositionConstraint2* _PositionConstraint2_PositionConstraint243(const Constrained* _a, const Constrained* _b) { return new PositionConstraint2(*_a, *_b); }
	EMSCRIPTEN_KEEPALIVE void _delete_PositionConstraint2_PositionConstraint243(PositionConstraint2* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE VectorN<3>* _get_Engine_gravity44(Engine* _this) { return &_this->gravity; }
	EMSCRIPTEN_KEEPALIVE void _set_Engine_gravity44(Engine* _this, const VectorN<3>* _newValue) { _this->gravity = *_newValue; }
	EMSCRIPTEN_KEEPALIVE double _get_Engine_drag45(Engine* _this) { return _this->drag; }
	EMSCRIPTEN_KEEPALIVE void _set_Engine_drag45(Engine* _this, double _newValue) { _this->drag = _newValue; }
	EMSCRIPTEN_KEEPALIVE int _get_Engine_constraintIterations46(Engine* _this) { return _this->constraintIterations; }
	EMSCRIPTEN_KEEPALIVE void _set_Engine_constraintIterations46(Engine* _this, int _newValue) { _this->constraintIterations = _newValue; }
	EMSCRIPTEN_KEEPALIVE int _get_Engine_contactIterations47(Engine* _this) { return _this->contactIterations; }
	EMSCRIPTEN_KEEPALIVE void _set_Engine_contactIterations47(Engine* _this, int _newValue) { _this->contactIterations = _newValue; }
	EMSCRIPTEN_KEEPALIVE int _get_Engine_iterations48(Engine* _this) { return _this->iterations; }
	EMSCRIPTEN_KEEPALIVE void _set_Engine_iterations48(Engine* _this, int _newValue) { _this->iterations = _newValue; }
	EMSCRIPTEN_KEEPALIVE Engine* _Engine_Engine49() { return new Engine(); }
	EMSCRIPTEN_KEEPALIVE void _delete_Engine_Engine49(Engine* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE void _Engine_addBody50(Engine* _this, RigidBody* body) { _this->addBody(body); }
	EMSCRIPTEN_KEEPALIVE Array_Constraint2_1* _Engine_getBodyConstraints51(Engine* _this, RigidBody* body) { return new Array_Constraint2_1(_this->getBodyConstraints(body)); }
	EMSCRIPTEN_KEEPALIVE void _Engine_removeBody52(Engine* _this, RigidBody* body) { _this->removeBody(body); }
	EMSCRIPTEN_KEEPALIVE Array_RigidBody_1* _Engine_getBodies53(Engine* _this) { return new Array_RigidBody_1(_this->getBodies()); }
	EMSCRIPTEN_KEEPALIVE void _Engine_addConstraint54(Engine* _this, Constraint2* constraint) { _this->addConstraint(constraint); }
	EMSCRIPTEN_KEEPALIVE void _Engine_removeConstraint55(Engine* _this, Constraint2* constraint) { _this->removeConstraint(constraint); }
	EMSCRIPTEN_KEEPALIVE Array_Constraint2_1* _Engine_getConstraints56(Engine* _this) { return new Array_Constraint2_1(_this->getConstraints()); }
	EMSCRIPTEN_KEEPALIVE void _Engine_run57(Engine* _this) { _this->run(); }
	EMSCRIPTEN_KEEPALIVE VectorN<3>* _VectorN_3__VectorN58() { return new VectorN<3>(); }
	EMSCRIPTEN_KEEPALIVE void _delete_VectorN_3__VectorN58(VectorN<3>* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE double _VectorN_3__get59(VectorN<3>* _this, int index) { return _this->get(index); }
	EMSCRIPTEN_KEEPALIVE void _VectorN_3__set60(VectorN<3>* _this, int index, double value) { _this->set(index, value); }
	EMSCRIPTEN_KEEPALIVE void _VectorN_3__setAll61(VectorN<3>* _this, double x, double y, double z) { _this->setAll(x, y, z); }
	EMSCRIPTEN_KEEPALIVE VectorN<3>* _VectorN_3__build62(double x, double y, double z) { return new VectorN<3>(VectorN<3>::build(x, y, z)); }
	EMSCRIPTEN_KEEPALIVE MatrixRC<3>* _MatrixRC_3__MatrixRC63() { return new MatrixRC<3>(); }
	EMSCRIPTEN_KEEPALIVE void _delete_MatrixRC_3__MatrixRC63(MatrixRC<3>* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE double _MatrixRC_3__get64(MatrixRC<3>* _this, int row, int column) { return _this->get(row, column); }
	EMSCRIPTEN_KEEPALIVE void _MatrixRC_3__set65(MatrixRC<3>* _this, int row, int column, double value) { _this->set(row, column, value); }
	EMSCRIPTEN_KEEPALIVE int _get_Array_VectorN_3__0_length66(Array_VectorN_3__0* _this) { return _this->length; }
	EMSCRIPTEN_KEEPALIVE Array_VectorN_3__0* _Array_VectorN_3__0_Array_VectorN_3__067(int _length) { return new Array_VectorN_3__0(_length); }
	EMSCRIPTEN_KEEPALIVE void _delete_Array_VectorN_3__0_Array_VectorN_3__067(Array_VectorN_3__0* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE VectorN<3>* _Array_VectorN_3__0_get68(Array_VectorN_3__0* _this, int index) { return &_this->get(index); }
	EMSCRIPTEN_KEEPALIVE void _Array_VectorN_3__0_set69(Array_VectorN_3__0* _this, int index, VectorN<3>* value) { _this->set(index, *value); }
	EMSCRIPTEN_KEEPALIVE int _get_Array_int_0_length70(Array_int_0* _this) { return _this->length; }
	EMSCRIPTEN_KEEPALIVE Array_int_0* _Array_int_0_Array_int_071(int _length) { return new Array_int_0(_length); }
	EMSCRIPTEN_KEEPALIVE void _delete_Array_int_0_Array_int_071(Array_int_0* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE int _Array_int_0_get72(Array_int_0* _this, int index) { return _this->get(index); }
	EMSCRIPTEN_KEEPALIVE void _Array_int_0_set73(Array_int_0* _this, int index, int value) { _this->set(index, value); }
	EMSCRIPTEN_KEEPALIVE int _get_Array_Constraint2_1_length74(Array_Constraint2_1* _this) { return _this->length; }
	EMSCRIPTEN_KEEPALIVE Array_Constraint2_1* _Array_Constraint2_1_Array_Constraint2_175(int _length) { return new Array_Constraint2_1(_length); }
	EMSCRIPTEN_KEEPALIVE void _delete_Array_Constraint2_1_Array_Constraint2_175(Array_Constraint2_1* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE Constraint2* _Array_Constraint2_1_get76(Array_Constraint2_1* _this, int index) { return _this->get(index); }
	EMSCRIPTEN_KEEPALIVE void _Array_Constraint2_1_set77(Array_Constraint2_1* _this, int index, Constraint2* value) { _this->set(index, value); }
	EMSCRIPTEN_KEEPALIVE int _get_Array_RigidBody_1_length78(Array_RigidBody_1* _this) { return _this->length; }
	EMSCRIPTEN_KEEPALIVE Array_RigidBody_1* _Array_RigidBody_1_Array_RigidBody_179(int _length) { return new Array_RigidBody_1(_length); }
	EMSCRIPTEN_KEEPALIVE void _delete_Array_RigidBody_1_Array_RigidBody_179(Array_RigidBody_1* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE RigidBody* _Array_RigidBody_1_get80(Array_RigidBody_1* _this, int index) { return _this->get(index); }
	EMSCRIPTEN_KEEPALIVE void _Array_RigidBody_1_set81(Array_RigidBody_1* _this, int index, RigidBody* value) { _this->set(index, value); }
}