/**
 * Generates the usecases layer for clean architecture.
 * Creates one UseCase class per operation.
 */
import * as _ from 'lodash';
import * as path from 'path';

import * as conf from '../conf';
import { Config } from '../generate';
import { ProcessedController } from '../requests/process-paths';
import { createDir, writeFile } from '../utils';

export function generateUsecases(config: Config, controllers: ProcessedController[]) {
  const usecasesDir = path.join(config.dest, conf.usecasesDir);
  createDir(usecasesDir);

  const controllerExports: string[] = [];

  controllers.forEach(controller => {
    const name = controller.name;
    const repoName = `${name}Repository`;
    const controllerDir = path.join(usecasesDir, _.kebabCase(name));
    createDir(controllerDir);

    const usecaseExports: string[] = [];

    controller.methods.forEach(m => {
      const simpleName = m.simpleName;
      const usecaseName = `${_.upperFirst(simpleName)}UseCase`;
      const responseType = m.responseDef.type;
      const hasParams = Object.keys(m.paramGroups).length > 0;
      const paramsType = hasParams ? `${_.upperFirst(simpleName)}Params` : '';
      const paramsArg = hasParams ? `params: ${paramsType}` : '';
      const callArgs = hasParams ? 'params' : '';
      // Response type carries the `__model.` prefix when it references a model.
      const usesModel = String(responseType).includes('__model');

      let content = '';
      content += config.profile.inject
        ? `import { Injectable, inject } from '@angular/core';\n`
        : `import { Injectable } from '@angular/core';\n`;
      content += `import { Observable } from 'rxjs';\n`;
      if (usesModel) {
        content += `import * as __${conf.modelFile} from '../../${conf.modelFile}';\n`;
      }
      if (hasParams) {
        content += `import { ${paramsType} } from '../../${conf.apiDir}/${name}';\n`;
      }
      content += `import { ${repoName} } from '../../${conf.dataDir}/repositories/${repoName}';\n\n`;
      content += config.profile.providedInRoot
        ? `@Injectable({ providedIn: 'root' })\n`
        : `@Injectable()\n`;
      content += `export class ${usecaseName} {\n`;
      content += config.profile.inject
        ? `  private repository = inject(${repoName});\n\n`
        : `  constructor(private repository: ${repoName}) {}\n\n`;
      content += `  execute(${paramsArg}): Observable<${responseType}> {\n`;
      content += `    return this.repository.${simpleName}(${callArgs});\n`;
      content += `  }\n`;
      content += `}\n`;

      const usecaseFile = path.join(controllerDir, `${simpleName}.usecase.ts`);
      writeFile(usecaseFile, content, config.header);

      usecaseExports.push(`export { ${usecaseName} } from './${_.kebabCase(name)}/${simpleName}.usecase';`);
    });

    // Generate controller-level barrel
    let controllerBarrel = '';
    controller.methods.forEach(m => {
      const usecaseName = `${_.upperFirst(m.simpleName)}UseCase`;
      controllerBarrel += `export { ${usecaseName} } from './${m.simpleName}.usecase';\n`;
    });
    const controllerIndexFile = path.join(controllerDir, 'index.ts');
    writeFile(controllerIndexFile, controllerBarrel, config.header);

    controllerExports.push(...usecaseExports);
  });

  // Generate usecases barrel
  let usecasesIndex = '';
  controllerExports.forEach(exp => {
    usecasesIndex += `${exp}\n`;
  });
  const usecasesIndexFile = path.join(usecasesDir, 'index.ts');
  writeFile(usecasesIndexFile, usecasesIndex, config.header);
}
