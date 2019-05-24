"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const utils_1 = require("../utils");
function createConfigService(config) {
    let content = '';
    content += `import { Injectable } from "@angular/core";\n`;
    content += `import { environment } from 'environments/environment';\n`;
    content += '\n';
    content += '@Injectable({\n';
    content += '  providedIn: "root"\n';
    content += '})\n';
    content += 'export class APIConfigServiceOptions {\n';
    content += '  public apiUrl = environment.apiUrl;\n';
    content += '}\n';
    content += '@Injectable({\n';
    content += '  providedIn: "root"\n';
    content += '})\n';
    content += 'export class APIConfigService {\n';
    content += '  public options: APIConfigServiceOptions;\n';
    content += '  constructor( options: APIConfigServiceOptions ) {\n';
    content += '    this.options = options;\n';
    content += '  }\n';
    content += '}\n';
    const serviceFileName = path.join(config.dest, `apiconfig.service.ts`);
    utils_1.writeFile(serviceFileName, content, config.header);
}
exports.createConfigService = createConfigService;
//# sourceMappingURL=config-service.js.map