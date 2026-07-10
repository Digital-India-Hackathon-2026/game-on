"use strict";
// ---------------------------------------------------------------------------
// Low Vision Mode — Barrel Export
// ---------------------------------------------------------------------------
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LowVisionRateLimitError = exports.LowVisionInputError = exports.LowVisionService = exports.LowVisionControllers = void 0;
var LowVisionControllers_1 = require("./LowVisionControllers");
Object.defineProperty(exports, "LowVisionControllers", { enumerable: true, get: function () { return LowVisionControllers_1.LowVisionControllers; } });
var LowVisionService_1 = require("./LowVisionService");
Object.defineProperty(exports, "LowVisionService", { enumerable: true, get: function () { return LowVisionService_1.LowVisionService; } });
Object.defineProperty(exports, "LowVisionInputError", { enumerable: true, get: function () { return LowVisionService_1.LowVisionInputError; } });
Object.defineProperty(exports, "LowVisionRateLimitError", { enumerable: true, get: function () { return LowVisionService_1.LowVisionRateLimitError; } });
__exportStar(require("./LowVisionTypes"), exports);
