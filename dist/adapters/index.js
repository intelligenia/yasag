"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeSchema = exports.normalizeSwagger2 = exports.normalizeSwagger1 = exports.normalizeOpenApi3 = exports.detectVersion = void 0;
var openapi_detector_1 = require("./openapi-detector");
Object.defineProperty(exports, "detectVersion", { enumerable: true, get: function () { return openapi_detector_1.detectVersion; } });
var openapi3_normalizer_1 = require("./openapi3-normalizer");
Object.defineProperty(exports, "normalizeOpenApi3", { enumerable: true, get: function () { return openapi3_normalizer_1.normalizeOpenApi3; } });
var swagger1_normalizer_1 = require("./swagger1-normalizer");
Object.defineProperty(exports, "normalizeSwagger1", { enumerable: true, get: function () { return swagger1_normalizer_1.normalizeSwagger1; } });
var swagger2_normalizer_1 = require("./swagger2-normalizer");
Object.defineProperty(exports, "normalizeSwagger2", { enumerable: true, get: function () { return swagger2_normalizer_1.normalizeSwagger2; } });
const openapi_detector_2 = require("./openapi-detector");
const openapi3_normalizer_2 = require("./openapi3-normalizer");
const swagger1_normalizer_2 = require("./swagger1-normalizer");
const swagger2_normalizer_2 = require("./swagger2-normalizer");
const utils_1 = require("../utils");
/**
 * Detects the spec version and normalizes to the internal format
 * that the generator consumes (Swagger 2.0 style).
 *
 * Supports all versions:
 *  - Swagger 1.x (swaggerVersion: "1.0"/"1.1"/"1.2")
 *  - Swagger 2.0 (swagger: "2.0")
 *  - OpenAPI 3.0.x (openapi: "3.0.x")
 *  - OpenAPI 3.1.x (openapi: "3.1.x")
 *  - Malformed/hybrid specs (heuristic detection)
 *
 * @param schema parsed JSON schema (any version)
 */
function normalizeSchema(schema) {
    const version = (0, openapi_detector_2.detectVersion)(schema);
    const versionLabels = {
        swagger1: 'Swagger 1.x',
        swagger2: 'Swagger 2.0',
        openapi30: 'OpenAPI 3.0',
        openapi31: 'OpenAPI 3.1',
    };
    (0, utils_1.out)(`Detected spec version: ${versionLabels[version]}`, utils_1.TermColors.green);
    switch (version) {
        case 'swagger1':
            return (0, swagger1_normalizer_2.normalizeSwagger1)(schema);
        case 'swagger2':
            return (0, swagger2_normalizer_2.normalizeSwagger2)(schema);
        case 'openapi30':
        case 'openapi31':
            return (0, openapi3_normalizer_2.normalizeOpenApi3)(schema);
        default:
            return (0, swagger2_normalizer_2.normalizeSwagger2)(schema);
    }
}
exports.normalizeSchema = normalizeSchema;
//# sourceMappingURL=index.js.map