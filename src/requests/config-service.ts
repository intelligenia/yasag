import * as path from 'path';
import {Config} from '../generate';
import {writeFile} from '../utils';

export function createConfigService(config: Config, environmentAPI: string) {
  let content = '';
  content += `import { Injectable } from '@angular/core';\n`;
  content += `import { environment } from 'environments/environment';\n`;
  content += '\n';
  content += '@Injectable({\n';
  content += '  providedIn: \'root\'\n';
  content += '})\n';
  content += 'export class APIConfigServiceOptions {\n';
  content += '  public apiUrl = environment.' + environmentAPI + ';\n';
  content += '}\n';
  content += '@Injectable({\n';
  content += '  providedIn: \'root\'\n';
  content += '})\n';
  content += 'export class APIConfigService {\n';
  content += '  public options: APIConfigServiceOptions;\n';
  content += '  constructor( options: APIConfigServiceOptions ) {\n';
  content += '    this.options = options;\n';
  content += '  }\n';
  content += '}\n';

  const serviceFileName = path.join(config.dest, `apiconfig.service.ts`);
  writeFile(serviceFileName, content, config.header);
}
