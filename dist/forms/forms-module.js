"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFormsModule = void 0;
const path = require("path");
const conf = require("../conf");
const utils_1 = require("../utils");
const _ = require("lodash");
/**
 * Creates the global Module that includes each and every single Module
 * @param config: global configuration for YASAG
 * @param modules: the list of generated modules
 */
function createFormsModule(config, modules) {
    let content = '';
    content += `import {NgModule} from '@angular/core';\n`;
    content += '\n';
    for (const module of modules) {
        const moduleFile = `./${_.kebabCase(module)}/${_.kebabCase(module)}.module`;
        content += `import { ${module}FormModule } from '${moduleFile}';\n`;
    }
    content += '\n';
    content += '@NgModule({\n';
    content += (0, utils_1.indent)('imports: [\n');
    for (const module of modules) {
        content += (0, utils_1.indent)(`${module}FormModule,\n`, 2);
    }
    content += (0, utils_1.indent)('],\n');
    content += (0, utils_1.indent)('exports: [\n');
    for (const module of modules) {
        content += (0, utils_1.indent)(`${module}FormModule,\n`, 2);
    }
    content += (0, utils_1.indent)('],\n');
    content += '})\n';
    content += `export class ApiFormsModule {}\n`;
    const moduleFileName = path.join(config.dest, conf.storeDir, `apiforms.module.ts`);
    (0, utils_1.writeFile)(moduleFileName, content, config.header);
}
exports.createFormsModule = createFormsModule;
//# sourceMappingURL=forms-module.js.map