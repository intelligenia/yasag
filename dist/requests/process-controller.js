"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processController = void 0;
/**
 * Processing of custom types from `paths` section
 * in the schema
 */
const _ = require("lodash");
const path = require("path");
const conf = require("../conf");
const generate_form_modules_1 = require("../forms/generate-form-modules");
const utils_1 = require("../utils");
const process_method_1 = require("./process-method");
const process_responses_1 = require("./process-responses");
/**
 * Creates and serializes class for api communication for controller
 * @param methods
 * @param name
 * @param config
 * @param definitions
 * @param readOnly
 */
function processController(methods, name, config, definitions, readOnly) {
    const filename = path.join(config.dest, conf.apiDir, `${name}.ts`);
    let usesGlobalType = false;
    // make simpleNames unique and process responses
    const simpleNames = _.map(methods, "simpleName");
    methods.forEach((controller) => {
        if (simpleNames.filter((n) => n === controller.simpleName).length > 1) {
            const preserveCapitals = controller.operationId
                .replace(controller.method["tags"][0], "")
                .replace(/([A-Z])/g, "-$1");
            controller.simpleName = _.lowerFirst(_.camelCase(preserveCapitals));
        }
        controller.responseDef = (0, process_responses_1.processResponses)(controller.responses, name + _.upperFirst(controller.simpleName), config);
        usesGlobalType = usesGlobalType || controller.responseDef.usesGlobalType;
    });
    const processedMethods = methods.map((m) => (0, process_method_1.processMethod)(m, config.unwrapSingleParamMethods));
    usesGlobalType =
        usesGlobalType || processedMethods.some((c) => c.usesGlobalType);
    let content = "";
    const angularCommonHttp = ["HttpClient"];
    if (processedMethods.some((c) => c.usesQueryParams)) {
        angularCommonHttp.push("HttpParams");
    }
    content += `import {${angularCommonHttp.join(", ")}} from \'@angular/common/http\';\n`;
    content += "import {Injectable} from '@angular/core';\n";
    content += "import {Observable} from 'rxjs';\n";
    content += "import { APIConfigService } from '../apiconfig.service';\n\n";
    content += "import * as __utils from '../yasag-utils';\n\n";
    if (usesGlobalType) {
        content += `import * as __${conf.modelFile} from \'../${conf.modelFile}\';\n\n`;
    }
    const interfaceDef = _.map(processedMethods, "interfaceDef")
        .filter(Boolean)
        .join("\n");
    if (interfaceDef) {
        content += interfaceDef;
        content += "\n";
    }
    content += `@Injectable()\n`;
    content += `export class ${name}Service {\n`;
    content += (0, utils_1.indent)("constructor(\n");
    content += (0, utils_1.indent)("private http: HttpClient,\n", 2);
    content += (0, utils_1.indent)("private apiConfigService: APIConfigService) {}\n", 2);
    content += "\n";
    content += (0, utils_1.indent)(_.map(processedMethods, "methodDef").join("\n\n"));
    content += "\n}\n";
    if (conf.adHocExceptions.api[name]) {
        content = content.replace(conf.adHocExceptions.api[name][0], conf.adHocExceptions.api[name][1]);
    }
    /* controllers */
    (0, utils_1.writeFile)(filename, content, config.header);
    /* forms */
    if (config.generateStore) {
        (0, generate_form_modules_1.createForms)(config, name, processedMethods, definitions, readOnly);
    }
}
exports.processController = processController;
//# sourceMappingURL=process-controller.js.map