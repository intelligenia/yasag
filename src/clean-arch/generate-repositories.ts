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
    // Response types are emitted with the `__model.` prefix, so detect model use
    // from the actual response type rather than the (param-oriented) usesGlobalType.
    const usesModel = controller.methods.some(m => String(m.responseDef.type).includes('__model'));
    // Param interfaces (e.g. ListPetsParams) are declared+exported in the controller file.
    const paramTypes = Array.from(new Set(
      controller.methods
        .filter(m => Object.keys(m.paramGroups).length > 0)
        .map(m => `${_.upperFirst(m.simpleName)}Params`)
    ));
    const serviceImport = paramTypes.length
      ? `import { ${name}Service, ${paramTypes.join(', ')} } from '../../${conf.apiDir}/${name}';`
      : `import { ${name}Service } from '../../${conf.apiDir}/${name}';`;

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
    abstractContent += `${serviceImport}\n\n`;
    abstractContent += `export abstract class ${repoName} {\n`;
    abstractContent += methodSignatures.join('\n\n');
    abstractContent += `\n}\n`;

    // Implementation
    let implContent = '';
    implContent += config.profile.inject
      ? `import { Injectable, inject } from '@angular/core';\n`
      : `import { Injectable } from '@angular/core';\n`;
    implContent += `import { Observable } from 'rxjs';\n`;
    if (usesModel) {
      implContent += `import * as __${conf.modelFile} from '../../${conf.modelFile}';\n`;
    }
    implContent += `${serviceImport}\n`;
    implContent += `import { ${repoName} } from './${repoName}';\n\n`;
    implContent += config.profile.providedInRoot
      ? `@Injectable({ providedIn: 'root' })\n`
      : `@Injectable()\n`;
    implContent += `export class ${repoImplName} extends ${repoName} {\n`;
    if (config.profile.inject) {
      implContent += `  private service = inject(${name}Service);\n\n`;
    } else {
      implContent += `  constructor(private service: ${name}Service) {\n`;
      implContent += `    super();\n`;
      implContent += `  }\n\n`;
    }
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
