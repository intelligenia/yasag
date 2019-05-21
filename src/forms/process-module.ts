import * as path from 'path';
import {Config} from '../generate';
import {indent, writeFile} from '../utils';

export function createModule(config: Config, name: string,
                             formSubDirName: string, simpleName: string, className: string) {
  let content = `import {NgModule} from '@angular/core';\n`;
  content += '\n';
  content += `import {${name}Service} from '../../../controllers/${name}';\n`;

  content += `import {FormsSharedModule} from '../../forms-shared.module';\n`;
  content += `import {${className}FormService} from './${simpleName}.service';\n`;
  content += `\n`;

  content += '\n';
  content += '@NgModule({\n';
  content += indent('imports: [\n');

  content += indent('FormsSharedModule,\n', 2);

  content += indent('],\n');

  const providers = [`${name}Service,`];
  providers.push(`${className}FormService,`);
  content += indent('providers: [\n');
  content += indent(providers, 2);
  content += '\n';
  content += indent('],\n');
  content += '})\n';
  content += `export class ${className}Module {}\n`;

  const moduleFileName = path.join(formSubDirName, `${simpleName}.module.ts`);
  writeFile(moduleFileName, content, config.header);
}
