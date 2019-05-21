"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const utils_1 = require("../utils");
function createModule(config, name, formSubDirName, simpleName, className) {
    let content = `import {NgModule} from '@angular/core';\n`;
    content += '\n';
    content += `import {${name}Service} from '../../../controllers/${name}';\n`;
    content += `import {FormsSharedModule} from '../../forms-shared.module';\n`;
    content += `import {${className}FormService} from './${simpleName}.service';\n`;
    content += `\n`;
    content += '\n';
    content += '@NgModule({\n';
    content += utils_1.indent('imports: [\n');
    content += utils_1.indent('FormsSharedModule,\n', 2);
    content += utils_1.indent('],\n');
    const providers = [`${name}Service,`];
    providers.push(`${className}FormService,`);
    content += utils_1.indent('providers: [\n');
    content += utils_1.indent(providers, 2);
    content += '\n';
    content += utils_1.indent('],\n');
    content += '})\n';
    content += `export class ${className}Module {}\n`;
    const moduleFileName = path.join(formSubDirName, `${simpleName}.module.ts`);
    utils_1.writeFile(moduleFileName, content, config.header);
}
exports.createModule = createModule;
//# sourceMappingURL=process-module.js.map