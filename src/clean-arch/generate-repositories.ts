/**
 * Generates the data layer (repositories) for clean architecture.
 * Creates abstract repository interfaces and their implementations.
 */
import * as _ from 'lodash';
import * as path from 'path';

import * as conf from '../conf';
import { Config } from '../generate';
import { ProcessedController } from '../requests/process-paths';
import { createDir, writeFile } from '../utils';

export function generateRepositories(config: Config, controllers: ProcessedController[]) {
  const dataDir = path.join(config.dest, conf.dataDir);
  const reposDir = path.join(dataDir, 'repositories');

  createDir(dataDir);
  createDir(reposDir);

  const repoExports: string[] = [];

  controllers.forEach(controller => {
    const name = controller.name;
    const repoName = `${name}Repository`;
    const repoImplName = `${name}RepositoryImpl`;

    // Collect method signatures
    const methodSignatures: string[] = [];
    const methodImplementations: string[] = [];
    const usesModel = controller.methods.some(m => m.usesGlobalType);

    controller.methods.forEach(m => {
      const simpleName = m.simpleName;
      const responseType = m.responseDef.type;
      const hasParams = Object.keys(m.paramGroups).length > 0;
      const paramsType = hasParams ? `${_.upperFirst(simpleName)}Params` : '';
      const paramsArg = hasParams ? `params: ${paramsType}` : '';

      methodSignatures.push(
        `  abstract ${simpleName}(${paramsArg}): Observable<${responseType}>;`
      );

      const callArgs = hasParams ? 'params' : '';
      methodImplementations.push(
        `  ${simpleName}(${paramsArg}): Observable<${responseType}> {\n` +
        `    return this.service.${simpleName}(${callArgs});\n` +
        `  }`
      );
    });

    // Abstract repository
    let abstractContent = '';
    abstractContent += `import { Observable } from 'rxjs';\n`;
    if (usesModel) {
      abstractContent += `import * as __${conf.modelFile} from '../../${conf.modelFile}';\n`;
    }
    abstractContent += `import { ${name}Service } from '../../${conf.apiDir}/${name}';\n\n`;
    abstractContent += `export abstract class ${repoName} {\n`;
    abstractContent += methodSignatures.join('\n\n');
    abstractContent += `\n}\n`;

    // Implementation
    let implContent = '';
    implContent += `import { Injectable } from '@angular/core';\n`;
    implContent += `import { Observable } from 'rxjs';\n`;
    if (usesModel) {
      implContent += `import * as __${conf.modelFile} from '../../${conf.modelFile}';\n`;
    }
    implContent += `import { ${name}Service } from '../../${conf.apiDir}/${name}';\n`;
    implContent += `import { ${repoName} } from './${repoName}';\n\n`;
    implContent += `@Injectable()\n`;
    implContent += `export class ${repoImplName} extends ${repoName} {\n`;
    implContent += `  constructor(private service: ${name}Service) {\n`;
    implContent += `    super();\n`;
    implContent += `  }\n\n`;
    implContent += methodImplementations.join('\n\n');
    implContent += `\n}\n`;

    const abstractFile = path.join(reposDir, `${repoName}.ts`);
    const implFile = path.join(reposDir, `${repoImplName}.ts`);

    writeFile(abstractFile, abstractContent, config.header);
    writeFile(implFile, implContent, config.header);

    repoExports.push(repoName);
    repoExports.push(repoImplName);
  });

  const reposIndexFile = path.join(reposDir, 'index.ts');
  let reposBarrel = '';
  repoExports.forEach(name => {
    reposBarrel += `export { ${name} } from './${name}';\n`;
  });
  writeFile(reposIndexFile, reposBarrel, config.header);

  // Generate data barrel
  const dataIndexFile = path.join(dataDir, 'index.ts');
  writeFile(dataIndexFile, `export * from './repositories';\n`, config.header);
}
