export type SpecVersion = 'swagger1' | 'swagger2' | 'openapi30' | 'openapi31';

/**
 * Detects the version of an OpenAPI/Swagger spec.
 * Supports:
 *  - Swagger 1.x (swaggerVersion: "1.0" / "1.1" / "1.2")
 *  - Swagger 2.0 (swagger: "2.0")
 *  - OpenAPI 3.0.x (openapi: "3.0.x")
 *  - OpenAPI 3.1.x (openapi: "3.1.x")
 *  - Heuristic detection for malformed/partial specs
 *
 * @param schema parsed JSON schema
 */
export function detectVersion(schema: any): SpecVersion {
  // --- Explicit version fields ---

  // Swagger 1.x: uses "swaggerVersion" field
  if (schema.swaggerVersion) {
    return 'swagger1';
  }

  // Swagger 2.0: uses "swagger" field starting with "2."
  if (schema.swagger) {
    const ver = String(schema.swagger);
    if (ver.startsWith('1.')) return 'swagger1';
    if (ver.startsWith('2.')) return 'swagger2';
  }

  // OpenAPI 3.x: uses "openapi" field
  if (schema.openapi) {
    const ver = String(schema.openapi);
    if (ver.startsWith('3.1')) return 'openapi31';
    if (ver.startsWith('3.0')) return 'openapi30';
    // Future 3.2, 3.3, etc. - treat as latest known (3.1)
    if (ver.startsWith('3.')) return 'openapi31';
    // If it says "openapi" but no recognized version, try best effort
  }

  // --- Heuristic fallbacks for malformed specs ---

  // Swagger 1.x heuristic: has "apis" array (resource listing) or "apiVersion" + "basePath"
  if (schema.apis && Array.isArray(schema.apis)) return 'swagger1';
  if (schema.apiVersion && schema.basePath && !schema.openapi) return 'swagger1';

  // OpenAPI 3.x heuristic: has "components" or "servers" (OAS3 structures)
  if (schema.components) {
    if (schema.components.schemas || schema.components.securitySchemes) {
      return 'openapi30';
    }
  }
  if (schema.servers && Array.isArray(schema.servers)) return 'openapi30';

  // Swagger 2.0 heuristic: has "definitions", "securityDefinitions", or "host"+"paths"
  if (schema.definitions) return 'swagger2';
  if (schema.securityDefinitions) return 'swagger2';
  if (schema.host && schema.paths) return 'swagger2';

  // Absolute fallback: if has "paths", treat as swagger 2.0
  if (schema.paths) return 'swagger2';

  return 'swagger2';
}
