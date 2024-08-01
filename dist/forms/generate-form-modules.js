"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createForms = exports.getClassName = void 0;
const _ = require("lodash");
const path = require("path");
const conf = require("../conf");
const utils_1 = require("../utils");
const generate_form_service_1 = require("./generate-form-service");
const process_module_1 = require("./process-module");
const service_module_1 = require("./service-module");
const shared_module_1 = require("./shared-module");
function getClassName(name) {
    return _.upperFirst(name);
}
exports.getClassName = getClassName;
/**
 * Creates the structure of the folder /forms/{name}. Being {name} a swagger tag
 * Inside this folder it creates another folder for each endpoint of the corresponding tag
 * Finally, inside the endpoint folder it is created a FormService and its corresponding Module
 * @param config: global configuration for YASAG
 * @param name: tag name
 * @param processedMethods: endpoints of this tag
 * @param definitions
 * @param readOnly
 */
function createForms(config, name, processedMethods, definitions, readOnly) {
    // Creating the tag folder
    const kebabName = _.kebabCase(name);
    const formBaseDir = path.join(config.dest, conf.storeDir);
    const formDirName = path.join(formBaseDir, `${kebabName}`);
    (0, utils_1.createDir)(formDirName);
    // Crerating each endpoint folder
    for (const processedMethod of processedMethods) {
        const paramGroups = processedMethod.paramGroups;
        const simpleName = processedMethod.simpleName;
        const formSubDirName = path.join(formBaseDir, `${kebabName}`, simpleName);
        (0, utils_1.createDir)(formSubDirName);
        let formParams = [];
        Object.values(paramGroups).forEach(params => {
            formParams = formParams.concat(params);
        });
        const className = name + getClassName(simpleName);
        // service.ts
        (0, generate_form_service_1.generateFormService)(config, name, formParams, definitions, simpleName, formSubDirName, className, processedMethod.methodName, processedMethod, readOnly);
        // module.ts
        (0, process_module_1.createModule)(config, name, formSubDirName, simpleName, className);
    }
    // form-shared-module.ts
    (0, shared_module_1.createSharedModule)(config);
    // form-module.ts
    (0, service_module_1.createServiceModule)(config, name, processedMethods);
}
exports.createForms = createForms;
//# sourceMappingURL=generate-form-modules.js.map