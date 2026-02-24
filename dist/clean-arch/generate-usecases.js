"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUsecases = void 0;
/**
 * Generates the usecases layer for clean architecture.
 * Creates one UseCase class per operation.
 */
const _ = require("lodash");
const path = require("path");
const conf = require("../conf");
const utils_1 = require("../utils");
function generateUsecases(config, controllers) {
    const usecasesDir = path.join(config.dest, conf.usecasesDir);
    (0, utils_1.createDir)(usecasesDir);
    const controllerExports = [];
    controllers.forEach(controller => {
        const name = controller.name;
        const repoName = `${name}Repository`;
        const controllerDir = path.join(usecasesDir, _.kebabCase(name));
        (0, utils_1.createDir)(controllerDir);
        const usecaseExports = [];
        controller.methods.forEach(m => {
            const simpleName = m.simpleName;
            const usecaseName = `${_.upperFirst(simpleName)}UseCase`;
            const responseType = m.responseDef.type;
            const hasParams = Object.keys(m.paramGroups).length > 0;
            const paramsType = hasParams ? `${_.upperFirst(simpleName)}Params` : '';
            const paramsArg = hasParams ? `params: ${paramsType}` : '';
            const callArgs = hasParams ? 'params' : '';
            const usesModel = m.usesGlobalType;
            let content = '';
            content += `import { Injectable } from '@angular/core';\n`;
            content += `import { Observable } from 'rxjs';\n`;
            if (usesModel) {
                content += `import * as __${conf.modelFile} from '../../${conf.modelFile}';\n`;
            }
            content += `import { ${repoName} } from '../../${conf.dataDir}/repositories/${repoName}';\n\n`;
            content += `@Injectable()\n`;
            content += `export class ${usecaseName} {\n`;
            content += `  constructor(private repository: ${repoName}) {}\n\n`;
            content += `  execute(${paramsArg}): Observable<${responseType}> {\n`;
            content += `    return this.repository.${simpleName}(${callArgs});\n`;
            content += `  }\n`;
            content += `}\n`;
            const usecaseFile = path.join(controllerDir, `${simpleName}.usecase.ts`);
            (0, utils_1.writeFile)(usecaseFile, content, config.header);
            usecaseExports.push(`export { ${usecaseName} } from './${_.kebabCase(name)}/${simpleName}.usecase';`);
        });
        // Generate controller-level barrel
        let controllerBarrel = '';
        controller.methods.forEach(m => {
            const usecaseName = `${_.upperFirst(m.simpleName)}UseCase`;
            controllerBarrel += `export { ${usecaseName} } from './${m.simpleName}.usecase';\n`;
        });
        const controllerIndexFile = path.join(controllerDir, 'index.ts');
        (0, utils_1.writeFile)(controllerIndexFile, controllerBarrel, config.header);
        controllerExports.push(...usecaseExports);
    });
    // Generate usecases barrel
    let usecasesIndex = '';
    controllerExports.forEach(exp => {
        usecasesIndex += `${exp}\n`;
    });
    const usecasesIndexFile = path.join(usecasesDir, 'index.ts');
    (0, utils_1.writeFile)(usecasesIndexFile, usecasesIndex, config.header);
}
exports.generateUsecases = generateUsecases;
//# sourceMappingURL=generate-usecases.js.map