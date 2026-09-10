import { parse as parseYaml } from 'yaml';

/**
 * Parses an OpenAPI/Swagger specification supplied as JSON or YAML into a plain
 * object. JSON is tried first (fast path; JSON is also valid YAML), then YAML.
 * Throws a SyntaxError naming the failure if the content is neither.
 *
 * @param content raw file contents
 */
export function parseSpec(content: string): any {
  try {
    return JSON.parse(content);
  } catch {
    try {
      return parseYaml(content);
    } catch (e) {
      throw new SyntaxError(`Unable to parse spec as JSON or YAML: ${(e as Error).message}`);
    }
  }
}
