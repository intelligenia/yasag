/**
 * Generates the domain layer (entities) for clean architecture.
 * Re-exports typed entities from defs/.
 */
import * as path from 'path';

import * as conf from '../conf';
import { ProcessedDefinition } from '../definitions';
import { Config } from '../generate';
import { createDir, writeFile } from '../utils';

export function generateDomain(config: Config, definitions: ProcessedDefinition[]) {
  const domainDir = path.join(config.dest, conf.domainDir);
  const entitiesDir = path.join(domainDir, 'entities');

  createDir(domainDir);
  createDir(entitiesDir);

  // Generate individual entity re-exports
  const entityExports: string[] = [];

  definitions.forEach(def => {
    const entityContent = `export { ${def.name} } from '../../${conf.defsDir}/${def.name}';\n`;
    const entityFile = path.join(entitiesDir, `${def.name}.ts`);
    writeFile(entityFile, entityContent, config.header);
    entityExports.push(def.name);
  });

  const entitiesIndexFile = path.join(entitiesDir, 'index.ts');
  let entitiesIndex = '';
  entityExports.forEach(name => {
    entitiesIndex += `export { ${name} } from './${name}';\n`;
  });
  writeFile(entitiesIndexFile, entitiesIndex, config.header);

  // Generate domain barrel
  const domainIndexFile = path.join(domainDir, 'index.ts');
  writeFile(domainIndexFile, `export * from './entities';\n`, config.header);
}
