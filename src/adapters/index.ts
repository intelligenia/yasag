export { SpecVersion, detectVersion } from './openapi-detector';
export { normalizeOpenApi3 } from './openapi3-normalizer';
export { normalizeSwagger1 } from './swagger1-normalizer';
export { normalizeSwagger2 } from './swagger2-normalizer';

import { detectVersion, SpecVersion } from './openapi-detector';
import { normalizeOpenApi3 } from './openapi3-normalizer';
import { normalizeSwagger1 } from './swagger1-normalizer';
import { normalizeSwagger2 } from './swagger2-normalizer';
import { NormalizedSchema } from '../types';
import { out, TermColors } from '../utils';

/**
 * Detects the spec version and normalizes to the internal format
 * that the generator consumes (Swagger 2.0 style).
 *
 * Supports all versions:
 *  - Swagger 1.x (swaggerVersion: "1.0"/"1.1"/"1.2")
 *  - Swagger 2.0 (swagger: "2.0")
 *  - OpenAPI 3.0.x (openapi: "3.0.x")
 *  - OpenAPI 3.1.x (openapi: "3.1.x")
 *  - Malformed/hybrid specs (heuristic detection)
 *
 * @param schema parsed JSON schema (any version)
 */
export function normalizeSchema(schema: any): NormalizedSchema {
  const version = detectVersion(schema);

  const versionLabels: Record<SpecVersion, string> = {
    swagger1: 'Swagger 1.x',
    swagger2: 'Swagger 2.0',
    openapi30: 'OpenAPI 3.0',
    openapi31: 'OpenAPI 3.1',
  };

  out(`Detected spec version: ${versionLabels[version]}`, TermColors.green);

  switch (version) {
    case 'swagger1':
      return normalizeSwagger1(schema);
    case 'swagger2':
      return normalizeSwagger2(schema);
    case 'openapi30':
    case 'openapi31':
      return normalizeOpenApi3(schema);
    default:
      return normalizeSwagger2(schema);
  }
}
