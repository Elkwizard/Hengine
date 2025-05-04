#include "../Physics2.cpp"
API class Array_VectorN_2__0 {
	private:
		std::unique_ptr<VectorN<2>[]> elements;
		
	public:
		API_CONST int length;

		API Array_VectorN_2__0(int _length) {
			length = _length;
			elements = std::make_unique<VectorN<2>[]>(length);
		}

		Array_VectorN_2__0(const std::vector<VectorN<2>>& items)
		: Array_VectorN_2__0(items.size()) {
			for (int i = 0; i < length; i++)
				elements[i] = items[i];
		}

		API VectorN<2>& get(int index) {
			return elements[index];
		}

		API void set(int index, VectorN<2>& value) {
			elements[index] = value;
		}

		operator std::vector<VectorN<2>>() const {
			std::vector<VectorN<2>> result (length);
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
	EMSCRIPTEN_KEEPALIVE Constrained* _get_Constraint2_a41(Constraint2* _this) { return &_this->a; }
	EMSCRIPTEN_KEEPALIVE Constrained* _get_Constraint2_b42(Constraint2* _this) { return &_this->b; }
	void __global_printStringJS0(size_t);
	EMSCRIPTEN_KEEPALIVE void printStringJS(size_t pointer) { __global_printStringJS0(pointer); }
	EMSCRIPTEN_KEEPALIVE void __global_markFlag1(bool _flag) { markFlag(_flag); }
	bool __global_asymmetricTriggerRule2(const RigidBody*, const RigidBody*);
	EMSCRIPTEN_KEEPALIVE bool asymmetricTriggerRule(const RigidBody& _0, const RigidBody& _1) { return __global_asymmetricTriggerRule2(&_0, &_1); }
	bool __global_symmetricCollisionRule3(const RigidBody*, const RigidBody*);
	EMSCRIPTEN_KEEPALIVE bool symmetricCollisionRule(const RigidBody& _0, const RigidBody& _1) { return __global_symmetricCollisionRule3(&_0, &_1); }
	void __global_onCollide4(const RigidBody*, const RigidBody*, const VectorN<2>*, Array_VectorN_2__0*, bool, bool);
	EMSCRIPTEN_KEEPALIVE void onCollide(const RigidBody& _0, const RigidBody& _1, const VectorN<2>& _2, const std::vector<VectorN<2>>& _3, bool _4, bool _5) { __global_onCollide4(&_0, &_1, &_2, new Array_VectorN_2__0(_3), _4, _5); }
	EMSCRIPTEN_KEEPALIVE double _Orientation_getRotation5(Orientation* _this) { return _this->getRotation(); }
	EMSCRIPTEN_KEEPALIVE void _Orientation_setRotation6(Orientation* _this, double _rotation) { _this->setRotation(_rotation); }
	EMSCRIPTEN_KEEPALIVE VectorN<2>* _get_Transform_linear7(Transform* _this) { return &_this->linear; }
	EMSCRIPTEN_KEEPALIVE Orientation* _get_Transform_orientation8(Transform* _this) { return &_this->orientation; }
	EMSCRIPTEN_KEEPALIVE Transform* _Transform_Transform9() { return new Transform(); }
	EMSCRIPTEN_KEEPALIVE void _delete_Transform_Transform9(Transform* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE Ball* _Ball_Ball10(const VectorN<2>* _position, double _radius) { return new Ball(*_position, _radius); }
	EMSCRIPTEN_KEEPALIVE void _delete_Ball_Ball10(Ball* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE Polytope* _Polytope_Polytope11(Array_VectorN_2__0* _vertices) { return new Polytope((std::vector<VectorN<2>>)(*_vertices)); }
	EMSCRIPTEN_KEEPALIVE void _delete_Polytope_Polytope11(Polytope* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE Transform* _get_RigidBody_position12(RigidBody* _this) { return &_this->position; }
	EMSCRIPTEN_KEEPALIVE Transform* _get_RigidBody_velocity13(RigidBody* _this) { return &_this->velocity; }
	EMSCRIPTEN_KEEPALIVE int _get_RigidBody_name14(RigidBody* _this) { return _this->name; }
	EMSCRIPTEN_KEEPALIVE void _set_RigidBody_name14(RigidBody* _this, int _newValue) { _this->name = _newValue; }
	EMSCRIPTEN_KEEPALIVE Array_Constraint2_1* _get_RigidBody_constraints15(RigidBody* _this) { return new Array_Constraint2_1(_this->constraints); }
	EMSCRIPTEN_KEEPALIVE bool _get_RigidBody_dynamic16(RigidBody* _this) { return _this->dynamic; }
	EMSCRIPTEN_KEEPALIVE void _set_RigidBody_dynamic16(RigidBody* _this, bool _newValue) { _this->dynamic = _newValue; }
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
	EMSCRIPTEN_KEEPALIVE void _RigidBody_setDensity28(RigidBody* _this, double _density) { _this->setDensity(_density); }
	EMSCRIPTEN_KEEPALIVE double _RigidBody_getDensity29(RigidBody* _this) { return _this->getDensity(); }
	EMSCRIPTEN_KEEPALIVE double _RigidBody_getMass30(RigidBody* _this) { return _this->getMass(); }
	EMSCRIPTEN_KEEPALIVE double _RigidBody_getInertia31(RigidBody* _this) { return _this->getInertia(); }
	EMSCRIPTEN_KEEPALIVE void _RigidBody_addShape32(RigidBody* _this, Shape* shape) { _this->addShape(shape); }
	EMSCRIPTEN_KEEPALIVE void _RigidBody_removeShape33(RigidBody* _this, Shape* shape) { _this->removeShape(shape); }
	EMSCRIPTEN_KEEPALIVE void _RigidBody_applyImpulse34(RigidBody* _this, const VectorN<2>* pos, const VectorN<2>* imp) { _this->applyImpulse(*pos, *imp); }
	EMSCRIPTEN_KEEPALIVE bool _Detector_testCollide35(const Shape* a, const Shape* b) { return Detector::testCollide(*a, *b); }
	EMSCRIPTEN_KEEPALIVE RigidBody* _get_Constrained_body36(Constrained* _this) { return &_this->body; }
	EMSCRIPTEN_KEEPALIVE VectorN<2>* _get_Constrained_offset37(Constrained* _this) { return &_this->offset; }
	EMSCRIPTEN_KEEPALIVE void _set_Constrained_offset37(Constrained* _this, const VectorN<2>* _newValue) { _this->offset = *_newValue; }
	EMSCRIPTEN_KEEPALIVE bool _get_Constrained_isStatic38(Constrained* _this) { return _this->isStatic; }
	EMSCRIPTEN_KEEPALIVE void _set_Constrained_isStatic38(Constrained* _this, bool _newValue) { _this->isStatic = _newValue; }
	EMSCRIPTEN_KEEPALIVE Constrained* _Constrained_Constrained39(RigidBody* _body, const VectorN<2>* _offset) { return new Constrained(*_body, *_offset); }
	EMSCRIPTEN_KEEPALIVE void _delete_Constrained_Constrained39(Constrained* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE VectorN<2>* _Constrained_getAnchor40(Constrained* _this) { return new VectorN<2>(_this->getAnchor()); }
	EMSCRIPTEN_KEEPALIVE double _get_LengthConstraint2_length43(LengthConstraint2* _this) { return _this->length; }
	EMSCRIPTEN_KEEPALIVE void _set_LengthConstraint2_length43(LengthConstraint2* _this, double _newValue) { _this->length = _newValue; }
	EMSCRIPTEN_KEEPALIVE LengthConstraint2* _LengthConstraint2_LengthConstraint244(const Constrained* _a, const Constrained* _b, double _length) { return new LengthConstraint2(*_a, *_b, _length); }
	EMSCRIPTEN_KEEPALIVE void _delete_LengthConstraint2_LengthConstraint244(LengthConstraint2* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE PositionConstraint2* _PositionConstraint2_PositionConstraint245(const Constrained* _a, const Constrained* _b) { return new PositionConstraint2(*_a, *_b); }
	EMSCRIPTEN_KEEPALIVE void _delete_PositionConstraint2_PositionConstraint245(PositionConstraint2* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE VectorN<2>* _get_Engine_gravity46(Engine* _this) { return &_this->gravity; }
	EMSCRIPTEN_KEEPALIVE void _set_Engine_gravity46(Engine* _this, const VectorN<2>* _newValue) { _this->gravity = *_newValue; }
	EMSCRIPTEN_KEEPALIVE double _get_Engine_drag47(Engine* _this) { return _this->drag; }
	EMSCRIPTEN_KEEPALIVE void _set_Engine_drag47(Engine* _this, double _newValue) { _this->drag = _newValue; }
	EMSCRIPTEN_KEEPALIVE int _get_Engine_constraintIterations48(Engine* _this) { return _this->constraintIterations; }
	EMSCRIPTEN_KEEPALIVE void _set_Engine_constraintIterations48(Engine* _this, int _newValue) { _this->constraintIterations = _newValue; }
	EMSCRIPTEN_KEEPALIVE int _get_Engine_contactIterations49(Engine* _this) { return _this->contactIterations; }
	EMSCRIPTEN_KEEPALIVE void _set_Engine_contactIterations49(Engine* _this, int _newValue) { _this->contactIterations = _newValue; }
	EMSCRIPTEN_KEEPALIVE int _get_Engine_iterations50(Engine* _this) { return _this->iterations; }
	EMSCRIPTEN_KEEPALIVE void _set_Engine_iterations50(Engine* _this, int _newValue) { _this->iterations = _newValue; }
	EMSCRIPTEN_KEEPALIVE Engine* _Engine_Engine51() { return new Engine(); }
	EMSCRIPTEN_KEEPALIVE void _delete_Engine_Engine51(Engine* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE void _Engine_addBody52(Engine* _this, RigidBody* body) { _this->addBody(body); }
	EMSCRIPTEN_KEEPALIVE Array_Constraint2_1* _Engine_getBodyConstraints53(Engine* _this, RigidBody* body) { return new Array_Constraint2_1(_this->getBodyConstraints(body)); }
	EMSCRIPTEN_KEEPALIVE void _Engine_removeBody54(Engine* _this, RigidBody* body) { _this->removeBody(body); }
	EMSCRIPTEN_KEEPALIVE Array_RigidBody_1* _Engine_getBodies55(Engine* _this) { return new Array_RigidBody_1(_this->getBodies()); }
	EMSCRIPTEN_KEEPALIVE void _Engine_addConstraint56(Engine* _this, Constraint2* constraint) { _this->addConstraint(constraint); }
	EMSCRIPTEN_KEEPALIVE void _Engine_removeConstraint57(Engine* _this, Constraint2* constraint) { _this->removeConstraint(constraint); }
	EMSCRIPTEN_KEEPALIVE Array_Constraint2_1* _Engine_getConstraints58(Engine* _this) { return new Array_Constraint2_1(_this->getConstraints()); }
	EMSCRIPTEN_KEEPALIVE void _Engine_run59(Engine* _this, double deltaTime) { _this->run(deltaTime); }
	EMSCRIPTEN_KEEPALIVE VectorN<2>* _VectorN_2__VectorN60() { return new VectorN<2>(); }
	EMSCRIPTEN_KEEPALIVE void _delete_VectorN_2__VectorN60(VectorN<2>* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE double _VectorN_2__get61(VectorN<2>* _this, int index) { return _this->get(index); }
	EMSCRIPTEN_KEEPALIVE void _VectorN_2__set62(VectorN<2>* _this, int index, double value) { _this->set(index, value); }
	EMSCRIPTEN_KEEPALIVE void _VectorN_2__setAll63(VectorN<2>* _this, double x, double y) { _this->setAll(x, y); }
	EMSCRIPTEN_KEEPALIVE VectorN<2>* _VectorN_2__build64(double x, double y) { return new VectorN<2>(VectorN<2>::build(x, y)); }
	EMSCRIPTEN_KEEPALIVE int _get_Array_VectorN_2__0_length65(Array_VectorN_2__0* _this) { return _this->length; }
	EMSCRIPTEN_KEEPALIVE Array_VectorN_2__0* _Array_VectorN_2__0_Array_VectorN_2__066(int _length) { return new Array_VectorN_2__0(_length); }
	EMSCRIPTEN_KEEPALIVE void _delete_Array_VectorN_2__0_Array_VectorN_2__066(Array_VectorN_2__0* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE VectorN<2>* _Array_VectorN_2__0_get67(Array_VectorN_2__0* _this, int index) { return &_this->get(index); }
	EMSCRIPTEN_KEEPALIVE void _Array_VectorN_2__0_set68(Array_VectorN_2__0* _this, int index, VectorN<2>* value) { _this->set(index, *value); }
	EMSCRIPTEN_KEEPALIVE int _get_Array_Constraint2_1_length69(Array_Constraint2_1* _this) { return _this->length; }
	EMSCRIPTEN_KEEPALIVE Array_Constraint2_1* _Array_Constraint2_1_Array_Constraint2_170(int _length) { return new Array_Constraint2_1(_length); }
	EMSCRIPTEN_KEEPALIVE void _delete_Array_Constraint2_1_Array_Constraint2_170(Array_Constraint2_1* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE Constraint2* _Array_Constraint2_1_get71(Array_Constraint2_1* _this, int index) { return _this->get(index); }
	EMSCRIPTEN_KEEPALIVE void _Array_Constraint2_1_set72(Array_Constraint2_1* _this, int index, Constraint2* value) { _this->set(index, value); }
	EMSCRIPTEN_KEEPALIVE int _get_Array_RigidBody_1_length73(Array_RigidBody_1* _this) { return _this->length; }
	EMSCRIPTEN_KEEPALIVE Array_RigidBody_1* _Array_RigidBody_1_Array_RigidBody_174(int _length) { return new Array_RigidBody_1(_length); }
	EMSCRIPTEN_KEEPALIVE void _delete_Array_RigidBody_1_Array_RigidBody_174(Array_RigidBody_1* _this) { delete _this; }
	EMSCRIPTEN_KEEPALIVE RigidBody* _Array_RigidBody_1_get75(Array_RigidBody_1* _this, int index) { return _this->get(index); }
	EMSCRIPTEN_KEEPALIVE void _Array_RigidBody_1_set76(Array_RigidBody_1* _this, int index, RigidBody* value) { _this->set(index, value); }
}