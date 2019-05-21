import * as path from 'path';
import * as conf from '../conf';
import {Config} from '../generate';
import {indent, writeFile} from '../utils';
import {MethodOutput} from '../requests/requests.models';
import * as _ from 'lodash';

export function createServiceModule(config: Config, name: string, processedMethods: MethodOutput[]) {
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

  content += indent('imports: [\n');
  for (const processedMethod of processedMethods) {
    const moduleName = `${_.upperFirst(processedMethod.simpleName)}Module`;
    content += indent(`${name}${moduleName},\n`, 2);
  }
  content += indent('],\n');

  content += indent('exports: [\n');
  for (const processedMethod of processedMethods) {
    const moduleName = `${_.upperFirst(processedMethod.simpleName)}Module`;
    content += indent(`${name}${moduleName},\n`, 2);
  }
  content += indent('],\n');

  content += '})\n';
  content += `export class ${name}FormModule {}\n`;

  const moduleFileName = path.join(config.dest, conf.storeDir, _.kebabCase(name), `${_.kebabCase(name)}.module.ts`);
  writeFile(moduleFileName, content, config.header);
}
