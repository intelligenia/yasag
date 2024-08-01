"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServiceModule = void 0;
const path = require("path");
const conf = require("../conf");
const utils_1 = require("../utils");
const _ = require("lodash");
function createServiceModule(config, name, processedMethods) {
    let content = '';
    content += `import {NgModule} from '@angular/core';\n`;
    content += '\n';
    for (const processedMethod of processedMethods) {
        const moduleName = `${name}${_.upperFirst(processedMethod.simpleName)}Module`;
        const moduleFile = `./${processedMethod.simpleName}/${processedMethod.simpleName}.module`;
        content += `import { ${moduleName} } from '${moduleFile}';\n`;
    }
    content += '\n';
    content += '@NgModule({\n';
    content += (0, utils_1.indent)('imports: [\n');
    for (const processedMethod of processedMethods) {
        const moduleName = `${_.upperFirst(processedMethod.simpleName)}Module`;
        content += (0, utils_1.indent)(`${name}${moduleName},\n`, 2);
    }
    content += (0, utils_1.indent)('],\n');
    content += (0, utils_1.indent)('exports: [\n');
    for (const processedMethod of processedMethods) {
        const moduleName = `${_.upperFirst(processedMethod.simpleName)}Module`;
        content += (0, utils_1.indent)(`${name}${moduleName},\n`, 2);
    }
    content += (0, utils_1.indent)('],\n');
    content += '})\n';
    content += `export class ${name}FormModule {}\n`;
    const moduleFileName = path.join(config.dest, conf.storeDir, _.kebabCase(name), `${_.kebabCase(name)}.module.ts`);
    (0, utils_1.writeFile)(moduleFileName, content, config.header);
}
exports.createServiceModule = createServiceModule;
//# sourceMappingURL=service-module.js.map