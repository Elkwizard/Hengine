#pragma once

#ifdef __INTELLISENSE__
	#define EMSCRIPTEN_KEEPALIVE 
#else
	#include "emscripten.h"
#endif

#define API
#define API_CONST
#define API_IMPORT extern "C"