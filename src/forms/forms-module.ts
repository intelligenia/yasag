import * as path from 'path';
import * as conf from '../conf';
import {Config} from '../generate';
import {indent, writeFile} from '../utils';
import * as _ from 'lodash';

/**
 * Creates the global Module that includes each and every single Module
 * @param config: global configuration for YASAG
 * @param modules: the list of generated modules
 */
export function createFormsModule(config: Config, modules: string[]) {
  let content = '';
  content += `import {NgModule} from '@angular/core';\n`;
  content += '\n';
  for (const module of modules) {
    const moduleFile = `./${_.kebabCase(module)}/${_.kebabCase(module)}.module`;
    content += `import { ${module}FormModule } from '${moduleFile}';\n`;
  }
  content += '\n';
  content += '@NgModule({\n';

  content += indent('imports: [\n');
  for (const module of modules) {
    content += indent(`${module}FormModule,\n`, 2);
  }
  content += indent('],\n');

  content += indent('exports: [\n');
  for (const module of modules) {
    content += indent(`${module}FormModule,\n`, 2);
  }
  content += indent('],\n');

  content += '})\n';
  content += `export class ApiFormsModule {}\n`;

  const moduleFileName = path.join(config.dest, conf.storeDir, `apiforms.module.ts`);
  writeFile(moduleFileName, content, config.header);
}
