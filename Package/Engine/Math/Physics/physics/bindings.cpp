#include "../physics.cpp"
#include "..\..\..\..\..\Wasm\slab.hpp"
extern "C" {
	EMSCRIPTEN_KEEPALIVE int _get_type24(Constraint* _0) { return _0->type; }
	EMSCRIPTEN_KEEPALIVE unsigned int _get_id25(Constraint* _0) { return _0->id; }
	EMSCRIPTEN_KEEPALIVE Vector* _get_a26(Constraint* _0) { return &_0->getA(); }
	EMSCRIPTEN_KEEPALIVE Vector* _get_b27(Constraint* _0) { return &_0->getB(); }
	EMSCRIPTEN_KEEPALIVE int _get_size28() { return sizeof(Constraint); }
	EMSCRIPTEN_KEEPALIVE bool _hasBody29(Constraint* _0, const RigidBody* _1) { return _0->hasBody(*_1); }
	EMSCRIPTEN_KEEPALIVE int _get_size17() { return sizeof(Collider); }
	EMSCRIPTEN_KEEPALIVE RigidBody* _get_body30(Constraint1* _0) { return &_0->body; }
	EMSCRIPTEN_KEEPALIVE void _set_body31(Constraint1* _0, RigidBody* _1) { _0->body = *_1; }
	EMSCRIPTEN_KEEPALIVE Vector* _get_offset32(Constraint1* _0) { return &_0->offset; }
	EMSCRIPTEN_KEEPALIVE void _set_offset33(Constraint1* _0, Vector* _1) { _0->offset = *_1; }
	EMSCRIPTEN_KEEPALIVE Vector* _get_point34(Constraint1* _0) { return &_0->point; }
	EMSCRIPTEN_KEEPALIVE void _set_point35(Constraint1* _0, Vector* _1) { _0->point = *_1; }
	EMSCRIPTEN_KEEPALIVE int _get_size36() { return sizeof(Constraint1); }
	EMSCRIPTEN_KEEPALIVE RigidBody* _get_bodyA37(Constraint2* _0) { return &_0->bodyA; }
	EMSCRIPTEN_KEEPALIVE void _set_bodyA38(Constraint2* _0, RigidBody* _1) { _0->bodyA = *_1; }
	EMSCRIPTEN_KEEPALIVE RigidBody* _get_bodyB39(Constraint2* _0) { return &_0->bodyB; }
	EMSCRIPTEN_KEEPALIVE void _set_bodyB40(Constraint2* _0, RigidBody* _1) { _0->bodyB = *_1; }
	EMSCRIPTEN_KEEPALIVE Vector* _get_offsetA41(Constraint2* _0) { return &_0->offsetA; }
	EMSCRIPTEN_KEEPALIVE void _set_offsetA42(Constraint2* _0, Vector* _1) { _0->offsetA = *_1; }
	EMSCRIPTEN_KEEPALIVE Vector* _get_offsetB43(Constraint2* _0) { return &_0->offsetB; }
	EMSCRIPTEN_KEEPALIVE void _set_offsetB44(Constraint2* _0, Vector* _1) { _0->offsetB = *_1; }
	EMSCRIPTEN_KEEPALIVE bool _get_staticA45(Constraint2* _0) { return _0->staticA; }
	EMSCRIPTEN_KEEPALIVE void _set_staticA46(Constraint2* _0, bool _1) { _0->staticA = _1; }
	EMSCRIPTEN_KEEPALIVE bool _get_staticB47(Constraint2* _0) { return _0->staticB; }
	EMSCRIPTEN_KEEPALIVE void _set_staticB48(Constraint2* _0, bool _1) { _0->staticB = _1; }
	EMSCRIPTEN_KEEPALIVE int _get_size49() { return sizeof(Constraint2); }
	EMSCRIPTEN_KEEPALIVE void _printInt0(long _0);
	void printInt(long _0) { _printInt0(_0); }
	EMSCRIPTEN_KEEPALIVE void _printFloat1(double _0);
	void printFloat(double _0) { _printFloat1(_0); }
	EMSCRIPTEN_KEEPALIVE void _printLn2();
	void printLn() { _printLn2(); }
	EMSCRIPTEN_KEEPALIVE void _fullExit3();
	void fullExit() { _fullExit3(); }
	EMSCRIPTEN_KEEPALIVE bool _collideRule4(const RigidBody* _0, const RigidBody* _1);
	bool collideRule(const RigidBody& _0, const RigidBody& _1) { return _collideRule4(&_0, &_1); }
	EMSCRIPTEN_KEEPALIVE bool _triggerRule5(const RigidBody* _0, const RigidBody* _1);
	bool triggerRule(const RigidBody& _0, const RigidBody& _1) { return _triggerRule5(&_0, &_1); }
	EMSCRIPTEN_KEEPALIVE bool _collide6(Collider* _0, Collider* _1) { return collide(*_0, *_1); }
	EMSCRIPTEN_KEEPALIVE void _onCollide7(PhysicsEngine* _0, RigidBody* _1, RigidBody* _2, const Vector* _3, _Slab* _4, bool _5, bool _6);
	void onCollide(PhysicsEngine& _0, RigidBody& _1, RigidBody& _2, const Vector& _3, const std::vector<Vector>& _4, bool _5, bool _6) { _onCollide7(&_0, &_1, &_2, &_3, new _Slab(_4), _5, _6); }
	EMSCRIPTEN_KEEPALIVE double _get_x8(Vector* _0) { return _0->x; }
	EMSCRIPTEN_KEEPALIVE void _set_x9(Vector* _0, double _1) { _0->x = _1; }
	EMSCRIPTEN_KEEPALIVE double _get_y10(Vector* _0) { return _0->y; }
	EMSCRIPTEN_KEEPALIVE void _set_y11(Vector* _0, double _1) { _0->y = _1; }
	EMSCRIPTEN_KEEPALIVE int _get_size12() { return sizeof(Vector); }
	EMSCRIPTEN_KEEPALIVE Vector* _create13(double _0, double _1) { return new Vector(_0, _1); }
	EMSCRIPTEN_KEEPALIVE void _delete14(Vector* _0) { delete _0; }
	EMSCRIPTEN_KEEPALIVE void _set15(Vector* _0, double _1, double _2) { _0->set(_1, _2); }
	EMSCRIPTEN_KEEPALIVE double _dist16(const Vector* _0, const Vector* _1) { return Vector::dist(*_0, *_1); }
	EMSCRIPTEN_KEEPALIVE int _get_size18() { return sizeof(PolygonCollider); }
	EMSCRIPTEN_KEEPALIVE PolygonCollider* _create19(_Slab* _0) { return new PolygonCollider((const std::vector<Vector>&)*_0); }
	EMSCRIPTEN_KEEPALIVE void _delete20(PolygonCollider* _0) { delete _0; }
	EMSCRIPTEN_KEEPALIVE int _get_size21() { return sizeof(CircleCollider); }
	EMSCRIPTEN_KEEPALIVE CircleCollider* _create22(double _0, double _1, double _2) { return new CircleCollider(_0, _1, _2); }
	EMSCRIPTEN_KEEPALIVE void _delete23(CircleCollider* _0) { delete _0; }
	EMSCRIPTEN_KEEPALIVE unsigned int _get_id50(RigidBody* _0) { return _0->id; }
	EMSCRIPTEN_KEEPALIVE void _set_id51(RigidBody* _0, unsigned int _1) { _0->id = _1; }
	EMSCRIPTEN_KEEPALIVE Vector* _get_position52(RigidBody* _0) { return &_0->position; }
	EMSCRIPTEN_KEEPALIVE void _set_position53(RigidBody* _0, Vector* _1) { _0->position = *_1; }
	EMSCRIPTEN_KEEPALIVE double _get_angle54(RigidBody* _0) { return _0->angle; }
	EMSCRIPTEN_KEEPALIVE void _set_angle55(RigidBody* _0, double _1) { _0->setAngle(_1); }
	EMSCRIPTEN_KEEPALIVE Vector* _get_velocity56(RigidBody* _0) { return &_0->velocity; }
	EMSCRIPTEN_KEEPALIVE void _set_velocity57(RigidBody* _0, Vector* _1) { _0->velocity = *_1; }
	EMSCRIPTEN_KEEPALIVE double _get_angularVelocity58(RigidBody* _0) { return _0->angularVelocity; }
	EMSCRIPTEN_KEEPALIVE void _set_angularVelocity59(RigidBody* _0, double _1) { _0->angularVelocity = _1; }
	EMSCRIPTEN_KEEPALIVE double _get_mass60(RigidBody* _0) { return _0->mass; }
	EMSCRIPTEN_KEEPALIVE void _set_mass61(RigidBody* _0, double _1) { _0->mass = _1; }
	EMSCRIPTEN_KEEPALIVE double _get_inertia62(RigidBody* _0) { return _0->inertia; }
	EMSCRIPTEN_KEEPALIVE void _set_inertia63(RigidBody* _0, double _1) { _0->inertia = _1; }
	EMSCRIPTEN_KEEPALIVE double _get_density64(RigidBody* _0) { return _0->density; }
	EMSCRIPTEN_KEEPALIVE void _set_density65(RigidBody* _0, double _1) { _0->setDensity(_1); }
	EMSCRIPTEN_KEEPALIVE double _get_boundingRadius66(RigidBody* _0) { return _0->boundingRadius; }
	EMSCRIPTEN_KEEPALIVE double _get_restitution67(RigidBody* _0) { return _0->restitution; }
	EMSCRIPTEN_KEEPALIVE void _set_restitution68(RigidBody* _0, double _1) { _0->restitution = _1; }
	EMSCRIPTEN_KEEPALIVE double _get_friction69(RigidBody* _0) { return _0->friction; }
	EMSCRIPTEN_KEEPALIVE void _set_friction70(RigidBody* _0, double _1) { _0->friction = _1; }
	EMSCRIPTEN_KEEPALIVE bool _get_canRotate71(RigidBody* _0) { return _0->canRotate; }
	EMSCRIPTEN_KEEPALIVE void _set_canRotate72(RigidBody* _0, bool _1) { _0->canRotate = _1; }
	EMSCRIPTEN_KEEPALIVE bool _get_dynamic73(RigidBody* _0) { return _0->dynamic; }
	EMSCRIPTEN_KEEPALIVE void _set_dynamic74(RigidBody* _0, bool _1) { _0->dynamic = _1; }
	EMSCRIPTEN_KEEPALIVE bool _get_simulated75(RigidBody* _0) { return _0->simulated; }
	EMSCRIPTEN_KEEPALIVE void _set_simulated76(RigidBody* _0, bool _1) { _0->simulated = _1; }
	EMSCRIPTEN_KEEPALIVE bool _get_airResistance77(RigidBody* _0) { return _0->airResistance; }
	EMSCRIPTEN_KEEPALIVE void _set_airResistance78(RigidBody* _0, bool _1) { _0->airResistance = _1; }
	EMSCRIPTEN_KEEPALIVE bool _get_gravity79(RigidBody* _0) { return _0->gravity; }
	EMSCRIPTEN_KEEPALIVE void _set_gravity80(RigidBody* _0, bool _1) { _0->gravity = _1; }
	EMSCRIPTEN_KEEPALIVE bool _get_isTrigger81(RigidBody* _0) { return _0->isTrigger; }
	EMSCRIPTEN_KEEPALIVE void _set_isTrigger82(RigidBody* _0, bool _1) { _0->isTrigger = _1; }
	EMSCRIPTEN_KEEPALIVE bool _get_canCollide83(RigidBody* _0) { return _0->canCollide; }
	EMSCRIPTEN_KEEPALIVE void _set_canCollide84(RigidBody* _0, bool _1) { _0->canCollide = _1; }
	EMSCRIPTEN_KEEPALIVE bool _get_trivialCollisionFilter85(RigidBody* _0) { return _0->trivialCollisionFilter; }
	EMSCRIPTEN_KEEPALIVE void _set_trivialCollisionFilter86(RigidBody* _0, bool _1) { _0->trivialCollisionFilter = _1; }
	EMSCRIPTEN_KEEPALIVE bool _get_trivialTriggerFilter87(RigidBody* _0) { return _0->trivialTriggerFilter; }
	EMSCRIPTEN_KEEPALIVE void _set_trivialTriggerFilter88(RigidBody* _0, bool _1) { _0->trivialTriggerFilter = _1; }
	EMSCRIPTEN_KEEPALIVE _Slab* _get_constraints89(RigidBody* _0) { return new _Slab(_0->constraints); }
	EMSCRIPTEN_KEEPALIVE void _set_constraints90(RigidBody* _0, _Slab* _1) { _0->constraints = (std::vector<Constraint*>)*_1; }
	EMSCRIPTEN_KEEPALIVE int _get_size91() { return sizeof(RigidBody); }
	EMSCRIPTEN_KEEPALIVE RigidBody* _create92(double _0, double _1, bool _2) { return new RigidBody(_0, _1, _2); }
	EMSCRIPTEN_KEEPALIVE void _delete93(RigidBody* _0) { delete _0; }
	EMSCRIPTEN_KEEPALIVE void _invalidateModels94(RigidBody* _0) { _0->invalidateModels(); }
	EMSCRIPTEN_KEEPALIVE void _clearShapes95(RigidBody* _0) { _0->clearShapes(); }
	EMSCRIPTEN_KEEPALIVE void _removeShape96(RigidBody* _0, Collider* _1) { _0->removeShape(_1); }
	EMSCRIPTEN_KEEPALIVE void _addShape97(RigidBody* _0, Collider* _1) { _0->addShape(_1); }
	EMSCRIPTEN_KEEPALIVE void _stop98(RigidBody* _0) { _0->stop(); }
	EMSCRIPTEN_KEEPALIVE void _applyImpulse99(RigidBody* _0, const Vector* _1, const Vector* _2, double _3) { _0->applyImpulse(*_1, *_2, _3); }
	EMSCRIPTEN_KEEPALIVE void _applyRelativeImpulse100(RigidBody* _0, const Vector* _1, const Vector* _2, double _3) { _0->applyRelativeImpulse(*_1, *_2, _3); }
	EMSCRIPTEN_KEEPALIVE RigidBody* _fromPolygon101(_Slab* _0, bool _1) { return RigidBody::fromPolygon((std::vector<Vector>)*_0, _1); }
	EMSCRIPTEN_KEEPALIVE RigidBody* _fromRect102(double _0, double _1, double _2, double _3, bool _4) { return RigidBody::fromRect(_0, _1, _2, _3, _4); }
	EMSCRIPTEN_KEEPALIVE RigidBody* _fromCircle103(double _0, double _1, double _2, bool _3) { return RigidBody::fromCircle(_0, _1, _2, _3); }
	EMSCRIPTEN_KEEPALIVE int _get_contactIterations104(PhysicsEngine* _0) { return _0->contactIterations; }
	EMSCRIPTEN_KEEPALIVE void _set_contactIterations105(PhysicsEngine* _0, int _1) { _0->contactIterations = _1; }
	EMSCRIPTEN_KEEPALIVE int _get_iterations106(PhysicsEngine* _0) { return _0->iterations; }
	EMSCRIPTEN_KEEPALIVE void _set_iterations107(PhysicsEngine* _0, int _1) { _0->iterations = _1; }
	EMSCRIPTEN_KEEPALIVE int _get_constraintIterations108(PhysicsEngine* _0) { return _0->constraintIterations; }
	EMSCRIPTEN_KEEPALIVE void _set_constraintIterations109(PhysicsEngine* _0, int _1) { _0->constraintIterations = _1; }
	EMSCRIPTEN_KEEPALIVE Vector* _get_gravity110(PhysicsEngine* _0) { return &_0->gravity; }
	EMSCRIPTEN_KEEPALIVE void _set_gravity111(PhysicsEngine* _0, Vector* _1) { _0->gravity = *_1; }
	EMSCRIPTEN_KEEPALIVE double _get_drag112(PhysicsEngine* _0) { return _0->drag; }
	EMSCRIPTEN_KEEPALIVE void _set_drag113(PhysicsEngine* _0, double _1) { _0->drag = _1; }
	EMSCRIPTEN_KEEPALIVE _Slab* _get_constraints114(PhysicsEngine* _0) { return new _Slab(_0->getConstraints()); }
	EMSCRIPTEN_KEEPALIVE _Slab* _get_bodies115(PhysicsEngine* _0) { return new _Slab(_0->getBodies()); }
	EMSCRIPTEN_KEEPALIVE int _get_size116() { return sizeof(PhysicsEngine); }
	EMSCRIPTEN_KEEPALIVE PhysicsEngine* _create117(const Vector* _0) { return new PhysicsEngine(*_0); }
	EMSCRIPTEN_KEEPALIVE void _delete118(PhysicsEngine* _0) { delete _0; }
	EMSCRIPTEN_KEEPALIVE void _run119(PhysicsEngine* _0) { _0->run(); }
	EMSCRIPTEN_KEEPALIVE void _addConstraint120(PhysicsEngine* _0, Constraint* _1) { _0->addConstraint(_1); }
	EMSCRIPTEN_KEEPALIVE void _removeConstraint121(PhysicsEngine* _0, unsigned int _1) { _0->removeConstraint(_1); }
	EMSCRIPTEN_KEEPALIVE bool _hasBody122(PhysicsEngine* _0, unsigned int _1) { return _0->hasBody(_1); }
	EMSCRIPTEN_KEEPALIVE RigidBody* _getBody123(PhysicsEngine* _0, unsigned int _1) { return &_0->getBody(_1); }
	EMSCRIPTEN_KEEPALIVE void _addBody124(PhysicsEngine* _0, RigidBody* _1) { _0->addBody(_1); }
	EMSCRIPTEN_KEEPALIVE void _removeBody125(PhysicsEngine* _0, unsigned int _1) { _0->removeBody(_1); }
	EMSCRIPTEN_KEEPALIVE double _get_length126(LengthConstraint2* _0) { return _0->length; }
	EMSCRIPTEN_KEEPALIVE void _set_length127(LengthConstraint2* _0, double _1) { _0->length = _1; }
	EMSCRIPTEN_KEEPALIVE int _get_size128() { return sizeof(LengthConstraint2); }
	EMSCRIPTEN_KEEPALIVE LengthConstraint2* _create129(RigidBody* _0, RigidBody* _1, const Vector* _2, const Vector* _3, double _4) { return new LengthConstraint2(*_0, *_1, *_2, *_3, _4); }
	EMSCRIPTEN_KEEPALIVE void _delete130(LengthConstraint2* _0) { delete _0; }
	EMSCRIPTEN_KEEPALIVE int _get_size131() { return sizeof(PositionConstraint2); }
	EMSCRIPTEN_KEEPALIVE PositionConstraint2* _create132(RigidBody* _0, RigidBody* _1, const Vector* _2, const Vector* _3) { return new PositionConstraint2(*_0, *_1, *_2, *_3); }
	EMSCRIPTEN_KEEPALIVE void _delete133(PositionConstraint2* _0) { delete _0; }
	EMSCRIPTEN_KEEPALIVE double _get_length134(LengthConstraint1* _0) { return _0->length; }
	EMSCRIPTEN_KEEPALIVE void _set_length135(LengthConstraint1* _0, double _1) { _0->length = _1; }
	EMSCRIPTEN_KEEPALIVE int _get_size136() { return sizeof(LengthConstraint1); }
	EMSCRIPTEN_KEEPALIVE LengthConstraint1* _create137(RigidBody* _0, const Vector* _1, const Vector* _2, double _3) { return new LengthConstraint1(*_0, *_1, *_2, _3); }
	EMSCRIPTEN_KEEPALIVE void _delete138(LengthConstraint1* _0) { delete _0; }
	EMSCRIPTEN_KEEPALIVE int _get_size139() { return sizeof(PositionConstraint1); }
	EMSCRIPTEN_KEEPALIVE PositionConstraint1* _create140(RigidBody* _0, const Vector* _1, const Vector* _2) { return new PositionConstraint1(*_0, *_1, *_2); }
	EMSCRIPTEN_KEEPALIVE void _delete141(PositionConstraint1* _0) { delete _0; }
	EMSCRIPTEN_KEEPALIVE int _get_length142(_Slab* _0) { return _0->length; }
	EMSCRIPTEN_KEEPALIVE int _get_size143() { return sizeof(_Slab); }
	EMSCRIPTEN_KEEPALIVE _Slab* _create144(int _0, int _1) { return new _Slab(_0, _1); }
	EMSCRIPTEN_KEEPALIVE void _delete145(_Slab* _0) { delete _0; }
	EMSCRIPTEN_KEEPALIVE void* _getPointer146(_Slab* _0, int _1) { return _0->getPointer(_1); }
	EMSCRIPTEN_KEEPALIVE void _setPointer147(_Slab* _0, int _1, void* _2) { _0->setPointer(_1, _2); }
	EMSCRIPTEN_KEEPALIVE void* _get148(_Slab* _0, int _1) { return _0->get(_1); }
}