import * as path from 'path';
import {Config} from '../generate';
import {writeFile} from '../utils';

export function createConfigService(config: Config, environmentAPI: string, environmentCache: string) {
  let content = '';
  content += `import { Injectable } from '@angular/core';\n`;
  content += `import { environment } from 'environments/environment';\n`;
  content += '\n';
  content += '@Injectable({\n';
  content += '  providedIn: \'root\'\n';
  content += '})\n';
  content += 'export class APIConfigServiceOptions {\n';
  content += '  public apiUrl = environment.' + environmentAPI + ';\n';
  content += '  public cacheSize = (environment["' + environmentCache + '"]) ? environment["' + environmentCache + '"] : 1000;\n';
  content += '}\n';
  content += '@Injectable({\n';
  content += '  providedIn: \'root\'\n';
  content += '})\n';
  content += 'export class APIConfigService {\n';
  content += '  public options: APIConfigServiceOptions;\n';
  content += '  private _window: string[];\n';
  content += '  private _cache: any;\n';
  content += '\n';
  content += '  get cache(): any {\n';
  content += '    if ( Object.keys(this._cache).length >= this.options.cacheSize && this._window.length === 0 ){\n';
  content += '      this._window = Object.keys(this._cache);\n';
  content += '    }\n';
  content += '    if ( Object.keys(this._cache).length >= this.options.cacheSize * 2 ){\n';
  content += '      this._window.forEach(k => delete this._cache[k]);\n';
  content += '      this._window = Object.keys(this._cache);\n';
  content += '    }\n';
  content += '    return this._cache;\n';
  content += '  }\n';
  content += '\n';
  content += '  constructor( options: APIConfigServiceOptions ) {\n';
  content += '    this.options = options;\n';
  content += '    this.resetCache();\n';
  content += '  }\n';
  content += '\n';
  content += '  resetCache(): void {\n';
  content += '    this._cache = {};\n';
  content += '    this._window = [];\n';
  content += '  }\n';
  content += '}\n';

  const serviceFileName = path.join(config.dest, `apiconfig.service.ts`);
  writeFile(serviceFileName, content, config.header);
}
