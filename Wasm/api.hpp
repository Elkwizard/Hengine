#pragma once

#if !__GEN_BINDINGS__
	#define API
	#define API_CONST
	#define API_TEMPLATE
	#define API_IMPORT extern "C"
	
	#if __EMSCRIPTEN__
		#include "emscripten.h"
	#else
		#define EMSCRIPTEN_KEEPALIVE
	#endif
#endif