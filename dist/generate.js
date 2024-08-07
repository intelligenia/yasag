"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = void 0;
/** Generator of API models (interfaces) from BE API json */
const fs = require("fs");
const conf = require("./conf");
const path = require("path");
const definitions_1 = require("./definitions");
const process_paths_1 = require("./requests/process-paths");
const utils_1 = require("./utils");
/**
 * Generates API layer for the project based on src to dest
 * @param src source swagger json schema
 * @param dest destination directory
 * @param generateStore decides if redux workflow should be generated
 * @param unwrapSingleParamMethods controls if the single param methods should be generated
 * @param swaggerUrlPath the path where the swagger ui definition can be found
 * @param omitVersion shouldn't generate API version info to generated files
 * @param omitBasepath shouldn't generate API basepath info to generated files
 * @param environmentAPI
 * @param omitHeader
 * @param readOnly
 */
function generate(src = conf.apiFile, dest = conf.outDir, generateStore = true, unwrapSingleParamMethods = false, swaggerUrlPath = conf.swaggerUrlPath, omitVersion = false, omitBasepath = false, environmentAPI = conf.environmentAPI, omitHeader = false, typedForms = false, readOnly = "", environmentCache = conf.environmentCache) {
    let schema;
    try {
        const content = fs.readFileSync(src);
        schema = JSON.parse(content.toString());
    }
    catch (e) {
        if (e instanceof SyntaxError) {
            (0, utils_1.out)(`${src} is either not a valid JSON scheme or contains non-printable characters`, utils_1.TermColors.red);
        }
        else
            (0, utils_1.out)(`JSON scheme file '${src}' does not exist`, utils_1.TermColors.red);
        (0, utils_1.out)(`${e}`);
        return;
    }
    // normalize basePath, strip trailing '/'s
    const basePath = schema.basePath;
    if (typeof basePath === "string") {
        schema.basePath = basePath.replace(/\/+$/, "");
    }
    else
        schema.basePath = "";
    if (omitBasepath) {
        schema.basePath = "";
    }
    recreateDirectories(dest, generateStore);
    const header = (0, utils_1.processHeader)(schema, omitVersion, omitHeader);
    const config = {
        header,
        dest,
        generateStore,
        unwrapSingleParamMethods,
        typedForms,
    };
    if (!fs.existsSync(dest))
        fs.mkdirSync(dest);
    const definitions = (0, definitions_1.processDefinitions)(schema.definitions, config);
    (0, process_paths_1.processPaths)(schema.paths, `http://${schema.host}${swaggerUrlPath}${conf.swaggerFile}`, config, definitions, schema.basePath, environmentAPI, readOnly, environmentCache);
}
exports.generate = generate;
function recreateDirectories(dest, generateStore) {
    (0, utils_1.emptyDir)(path.join(dest, conf.defsDir), true);
    (0, utils_1.emptyDir)(path.join(dest, conf.apiDir), true);
    (0, utils_1.emptyDir)(path.join(dest, conf.storeDir), true);
    (0, utils_1.createDir)(path.join(dest, conf.defsDir));
    (0, utils_1.createDir)(path.join(dest, conf.apiDir));
    if (generateStore)
        (0, utils_1.createDir)(path.join(dest, conf.storeDir));
}
//# sourceMappingURL=generate.js.map