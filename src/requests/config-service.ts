import * as path from 'path';
import {Config} from '../generate';
import {writeFile} from '../utils';

export function createConfigService(config: Config, environmentAPI: string, environmentCache: string) {
  const useInject = config.profile.inject;
  let content = '';
  content += useInject
    ? `import { Injectable, inject } from '@angular/core';\n`
    : `import { Injectable } from '@angular/core';\n`;
  content += `import { environment } from 'environments/environment';\n`;
  content += `import {Observable, ReplaySubject} from 'rxjs';\n`;
  content += '\n';
  content += 'export interface FormService{\n';
  content += '  submit(data?: any): Observable<any>;\n';
  content += '}\n';
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
  content += useInject
    ? '  public options = inject(APIConfigServiceOptions);\n'
    : '  public options: APIConfigServiceOptions;\n';
  content += useInject ? '  private _window: string[] = [];\n' : '  private _window: string[];\n';
  content += useInject ? '  private _cache: any = {};\n' : '  private _cache: any;\n';
  content += useInject
    ? '  private _listeners: { [ k: string ]: {fs: FormService, payload: any, subject: ReplaySubject<any>} } = {};\n'
    : '  private _listeners: { [ k: string ]: {fs: FormService, payload: any, subject: ReplaySubject<any>} };\n';
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
  content += '  get listeners(): any {\n';
  content += '    return this._listeners;\n';
  content += '  }\n';
  content += '\n';
  if (!useInject) {
    content += '  constructor( options: APIConfigServiceOptions ) {\n';
    content += '    this.options = options;\n';
    content += '    this.resetCache();\n';
    content += '    this.resetListeners();\n';
    content += '  }\n';
    content += '\n';
  }
  content += '  resetCache(): void {\n';
  content += '    this._cache = {};\n';
  content += '    this._window = [];\n';
  content += '  }\n';
  content += '\n';
  content += '  resetListeners(): void {\n';
  content += '    this._listeners = {};\n';
  content += '  }\n';
  content += '\n';
  content += '  launchListeners(): void {\n';
  content += '    Object.keys(this._listeners).forEach(k => {\n';
  content += '      if (this._listeners[k].subject.observers.length > 0){\n';
  content += '        this._listeners[k].fs.submit(this._listeners[k].payload);\n';
  content += '      }\n';
  content += '    });\n';
  content += '  }\n';
  content += '}\n';

  const serviceFileName = path.join(config.dest, `apiconfig.service.ts`);
  writeFile(serviceFileName, content, config.header);
}
