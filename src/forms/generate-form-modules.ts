import * as _ from 'lodash';
import * as path from 'path';

import * as conf from '../conf';
import { ProcessedDefinition } from '../definitions';
import { Config } from '../generate';
import { MethodOutput } from '../requests/requests.models';
import { Parameter } from '../types';
import { createDir } from '../utils';
import { generateFormService } from './generate-form-service';
import { createModule } from './process-module';
import { createServiceModule } from './service-module';
import { createSharedModule } from './shared-module';

export function getClassName(name: string) {
  return _.upperFirst(name);
}

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
export function createForms(
  config: Config,
  name: string,
  processedMethods: MethodOutput[],
  definitions: ProcessedDefinition[],
  readOnly: string,
) {
  // Creating the tag folder
  const kebabName = _.kebabCase(name);
  const formBaseDir = path.join(config.dest, conf.storeDir);
  const formDirName = path.join(formBaseDir, `${kebabName}`);
  createDir(formDirName);

  // Crerating each endpoint folder
  for (const processedMethod of processedMethods) {
    const paramGroups = processedMethod.paramGroups;
    const simpleName = processedMethod.simpleName;
    const formSubDirName = path.join(formBaseDir, `${kebabName}`, simpleName);
    createDir(formSubDirName);

    let formParams: Parameter[] = [];
    Object.values(paramGroups).forEach(params => {
      formParams = formParams.concat(params);
    });

    const className = name + getClassName(simpleName);

    // service.ts
    generateFormService(
      config,
      name,
      formParams,
      definitions,
      simpleName,
      formSubDirName,
      className,
      processedMethod.methodName,
      processedMethod,
      readOnly,
    );
    // module.ts
    createModule(config, name, formSubDirName, simpleName, className);
  }
  // form-shared-module.ts
  createSharedModule(config);
  // form-module.ts
  createServiceModule(config, name, processedMethods);
}
