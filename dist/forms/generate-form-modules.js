"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
function createForms(config, name, processedMethods, definitions) {
    const kebabName = _.kebabCase(name);
    const formBaseDir = path.join(config.dest, conf.storeDir);
    const formDirName = path.join(formBaseDir, `${kebabName}`);
    utils_1.createDir(formDirName);
    for (const processedMethod of processedMethods) {
        const paramGroups = processedMethod.paramGroups;
        const simpleName = processedMethod.simpleName;
        const formSubDirName = path.join(formBaseDir, `${kebabName}`, simpleName);
        utils_1.createDir(formSubDirName);
        let formParams = [];
        Object.values(paramGroups).forEach(params => {
            formParams = formParams.concat(params);
        });
        const className = name + getClassName(simpleName);
        // service.ts
        generate_form_service_1.generateFormService(config, name, formParams, definitions, simpleName, formSubDirName, className, processedMethod.methodName, processedMethod);
        // module.ts
        process_module_1.createModule(config, name, formSubDirName, simpleName, className);
    }
    // form-shared-module.ts
    shared_module_1.createSharedModule(config);
    // form-module.ts
    service_module_1.createServiceModule(config, name, processedMethods);
}
exports.createForms = createForms;
//# sourceMappingURL=generate-form-modules.js.map