"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processPaths = void 0;
/**
 * Processing of custom types from `paths` section
 * in the schema
 */
const _ = require("lodash");
const path = require("path");
const conf = require("../conf");
const forms_module_1 = require("../forms/forms-module");
const service_get_abstract_1 = require("../forms/service-get-abstract");
const service_post_abstract_1 = require("../forms/service-post-abstract");
const yasag_utils_1 = require("../forms/yasag-utils");
const utils_1 = require("../utils");
const config_service_1 = require("./config-service");
const process_controller_1 = require("./process-controller");
/**
 * Entry point, processes all possible api requests and exports them
 * to files devided ty controllers (same as swagger web app sections)
 * @param pathsWithParameters paths from the schema
 * @param swaggerPath swagger base url
 * @param config global configs
 * @param definitions
 * @param basePath base URL path
 * @param environmentAPI
 * @param readOnly
 */
function processPaths(pathsWithParameters, swaggerPath, config, definitions, basePath, environmentAPI, readOnly, environmentCache) {
    const paths = preProcessPaths(pathsWithParameters);
    const controllers = _.flatMap(paths, (methods, url) => _.map(methods, (method, methodName) => ({
        url,
        name: getName(method),
        method,
        methodName,
        simpleName: getSimpleName(url),
        summary: method.summary,
        operationId: method.operationId,
        swaggerUrl: `${swaggerPath}${method.tags[0]}/${method.operationId}`,
        description: method.description,
        paramDef: method.parameters,
        responses: method.responses,
        responseDef: null,
        basePath,
    })));
    const controllerFiles = _.groupBy(controllers, "name");
    conf.controllerIgnores.forEach((key) => delete controllerFiles[key]);
    _.forEach(controllerFiles, (methods, name) => (0, process_controller_1.processController)(methods, name.replace("[", "").replace("]", ""), config, definitions, readOnly));
    const modules = [];
    _.forEach(_.groupBy(controllers, "name"), (_methods, name) => {
        modules.push(name);
    });
    // Create global module for forms
    (0, forms_module_1.createFormsModule)(config, modules);
    // Create the abstract class
    (0, service_get_abstract_1.createServiceGetAbstractClass)(config);
    (0, service_post_abstract_1.createServicePostAbstractClass)(config);
    // Create utils
    (0, yasag_utils_1.createUtils)(config);
    let content = "";
    controllers.forEach((method) => (content += `export * from './forms/${_.kebabCase(method.name)}/${method.simpleName}/${method.simpleName}.service';\n`));
    const allFormServiceFileName = path.join(config.dest, `form-service.ts`);
    (0, utils_1.writeFile)(allFormServiceFileName, content, config.header);
    // apiconfig.service.ts
    (0, config_service_1.createConfigService)(config, environmentAPI, environmentCache);
}
exports.processPaths = processPaths;
/**
 * Returns simple name from last static URL segment
 * example: `/accounts/${accountId}/updateMothersName` => `updateMothersName`
 * @param url
 */
function getSimpleName(url) {
    // remove url params
    let method = url.replace(/\/{[^}]+}/g, "");
    // remove trailing `/` if present
    method = method.replace(/\/$/, "");
    // take trailing url folder
    method = method.replace(/(.*\/)*/, "");
    // subst spaces and underscores
    method = _.camelCase(method);
    method = method.replace(/[^\w]/g, "");
    return method;
}
/**
 * Returns name of the method
 * @param method
 */
function getName(method) {
    return _.upperFirst(_.camelCase(method.tags[0].replace(/(-rest)?-controller/, "")));
}
/**
 * One of the allowed swagger formats is that under given url, there can be methods like get, post, put etc., but also
 * parameters that often defines a path parameter common for the HTTP methods.
 * This method extends HTTP method (get, post ...) parameters with the above mentioned parameters
 * @param paths
 */
function preProcessPaths(paths) {
    Object.values(paths).forEach((pathValue) => {
        if (pathValue.parameters) {
            Object.keys(pathValue).forEach((key) => {
                if (key === "parameters")
                    return;
                const method = pathValue[key];
                method.parameters = method.parameters.concat(pathValue.parameters);
            });
        }
        delete pathValue.parameters;
    });
    return paths;
}
//# sourceMappingURL=process-paths.js.map