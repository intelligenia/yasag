"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adHocExceptions = exports.controllerIgnores = exports.allowedParams = exports.nativeTypes = exports.swaggerFile = exports.typeForms = exports.omitHeader = exports.environmentCache = exports.environmentAPI = exports.omitBasepath = exports.omitVersion = exports.swaggerUrlPath = exports.indentation = exports.modelFile = exports.apiFile = exports.stateDir = exports.storeDir = exports.apiDir = exports.defsDir = exports.outDir = void 0;
// relative to project root
exports.outDir = "src/api";
exports.defsDir = "defs";
exports.apiDir = "controllers";
exports.storeDir = "forms";
exports.stateDir = "states";
exports.apiFile = "conf/api/api-docs.json";
exports.modelFile = "model";
exports.indentation = 2;
exports.swaggerUrlPath = "/swagger";
exports.omitVersion = false;
exports.omitBasepath = false;
exports.environmentAPI = "apiUrl";
exports.environmentCache = "apiCacheSize";
exports.omitHeader = false;
exports.typeForms = false;
// part of path in url
exports.swaggerFile = "/swagger-ui.html#!/";
// mapping from swagger native types to javascript types
exports.nativeTypes = {
    binary: "number",
    boolean: "boolean",
    byte: "number",
    date: "string",
    dateTime: "string",
    double: "number",
    file: "File",
    float: "number",
    integer: "number",
    long: "number",
    number: "number",
    object: "object",
    password: "string",
    string: "string",
};
/* list of parameter types accepted by methods
 * ordered as they are passed to api service methods
 * The 'parameters: []' type is only technical and serves for situations when common parameters are defined
 * on the same level as HTTP methods */
exports.allowedParams = {
    get: ["path", "query"],
    patch: ["path", "body", "query", "formData"],
    post: ["path", "body", "query", "formData"],
    put: ["path", "body", "query"],
    delete: ["path"],
};
// list of simplified names of controllers
// that do not to generate api layer
exports.controllerIgnores = ["BackOffice"];
// implemented only for api
// once other one is needed, make it file-based
exports.adHocExceptions = {
    api: {
        Help: [/^  itemNumbers\?: ref;$/m, "  itemNumbers?: number[]"],
    },
};
//# sourceMappingURL=conf.js.map