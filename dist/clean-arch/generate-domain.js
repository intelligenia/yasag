"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDomain = void 0;
/**
 * Generates the domain layer (entities) for clean architecture.
 * Re-exports typed entities from defs/.
 */
const path = require("path");
const conf = require("../conf");
const utils_1 = require("../utils");
function generateDomain(config, definitions) {
    const domainDir = path.join(config.dest, conf.domainDir);
    const entitiesDir = path.join(domainDir, 'entities');
    (0, utils_1.createDir)(domainDir);
    (0, utils_1.createDir)(entitiesDir);
    // Generate individual entity re-exports
    const entityExports = [];
    definitions.forEach(def => {
        const entityContent = `export { ${def.name} } from '../../${conf.defsDir}/${def.name}';\n`;
        const entityFile = path.join(entitiesDir, `${def.name}.ts`);
        (0, utils_1.writeFile)(entityFile, entityContent, config.header);
        entityExports.push(def.name);
    });
    const entitiesIndexFile = path.join(entitiesDir, 'index.ts');
    let entitiesIndex = '';
    entityExports.forEach(name => {
        entitiesIndex += `export { ${name} } from './${name}';\n`;
    });
    (0, utils_1.writeFile)(entitiesIndexFile, entitiesIndex, config.header);
    // Generate domain barrel
    const domainIndexFile = path.join(domainDir, 'index.ts');
    (0, utils_1.writeFile)(domainIndexFile, `export * from './entities';\n`, config.header);
}
exports.generateDomain = generateDomain;
//# sourceMappingURL=generate-domain.js.map