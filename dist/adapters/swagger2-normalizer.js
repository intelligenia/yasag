"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeSwagger2 = void 0;
/**
 * Normalizes Swagger 2.0 specs, handling edge cases, extensions,
 * and malformed/partial specs.
 *
 * Handles:
 *  - Missing basePath, host, schemes, definitions, paths
 *  - host as full URL (extracts just the host part)
 *  - x-nullable normalization
 *  - x-enum-values extension
 *  - x-model extension
 *  - Global consumes/produces propagation to operations
 *  - allOf in definitions (merge properties)
 *  - $ref as relative or absolute paths -> normalize to #/definitions/
 *  - Duplicate/inconsistent required arrays
 *  - Tags generation when missing (from path segments)
 */
function normalizeSwagger2(schema) {
    const result = JSON.parse(JSON.stringify(schema));
    // Ensure swagger version marker
    if (!result.swagger) {
        result.swagger = '2.0';
    }
    // Ensure info exists
    if (!result.info) {
        result.info = { title: 'API', version: '1.0.0' };
    }
    // Normalize host - might come as full URL
    normalizeHost(result);
    // Ensure basePath exists
    if (!result.basePath && result.basePath !== '') {
        result.basePath = '/';
    }
    // Ensure definitions exists
    if (!result.definitions) {
        result.definitions = {};
    }
    // Ensure paths exists
    if (!result.paths) {
        result.paths = {};
    }
    // Ensure schemes exists
    if (!result.schemes || !result.schemes.length) {
        result.schemes = ['https'];
    }
    // Ensure tags array exists
    if (!result.tags) {
        result.tags = [];
    }
    // Propagate global consumes/produces to operations that don't have them
    propagateGlobalContentTypes(result);
    // Process definitions
    processDefinitions(result.definitions);
    // Process paths for edge cases
    processPaths(result.paths, result.definitions);
    // Generate missing tags from paths
    ensureOperationTags(result);
    return result;
}
exports.normalizeSwagger2 = normalizeSwagger2;
/**
 * Normalizes the host field - handles cases where host is a full URL
 */
function normalizeHost(result) {
    if (!result.host) {
        result.host = 'localhost';
        return;
    }
    const host = result.host;
    // If host looks like a full URL, extract just the host
    if (host.startsWith('http://') || host.startsWith('https://')) {
        try {
            const url = new URL(host);
            result.host = url.host;
            // If basePath is not set, extract from URL
            if (!result.basePath && url.pathname !== '/') {
                result.basePath = url.pathname;
            }
            // Extract scheme from URL
            if (!result.schemes || !result.schemes.length) {
                result.schemes = [url.protocol.replace(':', '')];
            }
        }
        catch (_a) {
            // If parsing fails, strip protocol manually
            result.host = host.replace(/^https?:\/\//, '').split('/')[0];
        }
    }
    // Remove trailing slashes from host
    result.host = result.host.replace(/\/+$/, '');
}
/**
 * Propagates global consumes/produces to operations
 */
function propagateGlobalContentTypes(result) {
    const globalConsumes = result.consumes;
    const globalProduces = result.produces;
    if (!globalConsumes && !globalProduces)
        return;
    if (!result.paths)
        return;
    const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
    Object.values(result.paths).forEach((pathItem) => {
        httpMethods.forEach(method => {
            if (pathItem[method]) {
                if (globalConsumes && !pathItem[method].consumes) {
                    pathItem[method].consumes = globalConsumes;
                }
                if (globalProduces && !pathItem[method].produces) {
                    pathItem[method].produces = globalProduces;
                }
            }
        });
    });
}
/**
 * Processes definitions for extensions and edge cases
 */
function processDefinitions(definitions) {
    if (!definitions)
        return;
    Object.entries(definitions).forEach(([_defName, def]) => {
        // Handle allOf in definitions - merge into single definition
        if (def.allOf && Array.isArray(def.allOf)) {
            mergeAllOfDefinition(def, definitions);
        }
        if (!def.properties)
            return;
        Object.entries(def.properties).forEach(([_propName, prop]) => {
            // Normalize x-nullable
            if (prop['x-nullable'] !== undefined) {
                prop['x-nullable'] = !!prop['x-nullable'];
            }
            // Handle x-enum-values extension (Spring / NSwag)
            // Converts [{value: "A", description: "..."}, ...] to standard enum
            if (prop['x-enum-values'] && Array.isArray(prop['x-enum-values']) && !prop.enum) {
                prop.enum = prop['x-enum-values'].map((v) => typeof v === 'object' ? (v.value || v.name || v) : v);
            }
            // Handle x-model extension (NSwag) - if $ref-like, convert to $ref
            if (prop['x-model'] && !prop.$ref && !prop.type) {
                const modelName = prop['x-model'];
                if (definitions[modelName]) {
                    prop.$ref = `#/definitions/${modelName}`;
                }
            }
            // Normalize $ref paths
            if (prop.$ref) {
                prop.$ref = normalizeRef(prop.$ref);
            }
            // Recursively process items
            if (prop.items) {
                if (prop.items.$ref) {
                    prop.items.$ref = normalizeRef(prop.items.$ref);
                }
                if (prop.items['x-nullable'] !== undefined) {
                    prop.items['x-nullable'] = !!prop.items['x-nullable'];
                }
            }
            // Recursively process additionalProperties
            if (prop.additionalProperties && typeof prop.additionalProperties === 'object') {
                if (prop.additionalProperties.$ref) {
                    prop.additionalProperties.$ref = normalizeRef(prop.additionalProperties.$ref);
                }
            }
        });
        // Normalize required array - remove duplicates and non-existent properties
        if (def.required && Array.isArray(def.required)) {
            const validProps = def.properties ? Object.keys(def.properties) : [];
            def.required = [...new Set(def.required)].filter((r) => validProps.length === 0 || validProps.includes(r));
        }
    });
}
/**
 * Merges allOf in a Swagger 2.0 definition into the definition itself
 */
function mergeAllOfDefinition(def, definitions) {
    const allOf = def.allOf;
    delete def.allOf;
    if (!def.properties)
        def.properties = {};
    if (!def.required)
        def.required = [];
    allOf.forEach((part) => {
        if (part.$ref) {
            // Resolve the referenced definition and merge its properties
            const refName = part.$ref.replace(/^#\/definitions\//, '');
            const refDef = definitions[refName];
            if (refDef) {
                if (refDef.properties) {
                    Object.assign(def.properties, JSON.parse(JSON.stringify(refDef.properties)));
                }
                if (refDef.required) {
                    def.required = [...def.required, ...refDef.required];
                }
            }
        }
        else {
            // Inline schema
            if (part.properties) {
                Object.assign(def.properties, part.properties);
            }
            if (part.required) {
                def.required = [...def.required, ...part.required];
            }
            if (part.type && !def.type) {
                def.type = part.type;
            }
            if (part.description && !def.description) {
                def.description = part.description;
            }
            // Propagate validation/metadata properties
            const validationKeys = [
                'format', 'enum', 'default', 'minimum', 'maximum',
                'exclusiveMinimum', 'exclusiveMaximum', 'minLength', 'maxLength',
                'pattern', 'readOnly', 'additionalProperties', 'items', 'example',
            ];
            validationKeys.forEach(key => {
                if (part[key] !== undefined && def[key] === undefined) {
                    def[key] = part[key];
                }
            });
        }
    });
    // Deduplicate required
    def.required = [...new Set(def.required)];
    if (def.required.length === 0)
        delete def.required;
    // Ensure type
    if (!def.type && Object.keys(def.properties).length > 0) {
        def.type = 'object';
    }
}
/**
 * Normalizes $ref to standard #/definitions/ format
 */
function normalizeRef(ref) {
    if (!ref)
        return ref;
    // Already in the right format
    if (ref.startsWith('#/definitions/'))
        return ref;
    // Convert #/components/schemas/ to #/definitions/
    if (ref.startsWith('#/components/schemas/')) {
        return ref.replace('#/components/schemas/', '#/definitions/');
    }
    // Handle bare type names (no path) - assume it's a definition name
    if (!ref.startsWith('#') && !ref.startsWith('/') && !ref.includes('.')) {
        return `#/definitions/${ref}`;
    }
    return ref;
}
/**
 * Processes paths for edge cases
 */
function processPaths(paths, _definitions) {
    if (!paths)
        return;
    const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
    Object.values(paths).forEach((pathItem) => {
        httpMethods.forEach(method => {
            const operation = pathItem[method];
            if (!operation)
                return;
            // Ensure parameters is an array
            if (!operation.parameters) {
                operation.parameters = [];
            }
            // Normalize parameter $refs and schemas
            operation.parameters.forEach((param) => {
                if (param.$ref) {
                    param.$ref = normalizeRef(param.$ref);
                }
                if (param.schema && param.schema.$ref) {
                    param.schema.$ref = normalizeRef(param.schema.$ref);
                }
                if (param.items && param.items.$ref) {
                    param.items.$ref = normalizeRef(param.items.$ref);
                }
            });
            // Normalize response $refs
            if (operation.responses) {
                Object.values(operation.responses).forEach((resp) => {
                    if (resp && resp.schema) {
                        if (resp.schema.$ref) {
                            resp.schema.$ref = normalizeRef(resp.schema.$ref);
                        }
                        if (resp.schema.items && resp.schema.items.$ref) {
                            resp.schema.items.$ref = normalizeRef(resp.schema.items.$ref);
                        }
                    }
                });
            }
            // Ensure operationId exists - generate from method + path
            if (!operation.operationId) {
                const pathKey = Object.keys(paths).find(k => paths[k][method] === operation) || '';
                operation.operationId = generateOperationId(method, pathKey);
            }
            // Ensure responses exists
            if (!operation.responses) {
                operation.responses = { '200': { description: 'OK' } };
            }
        });
    });
}
/**
 * Generates an operationId from method + path when missing
 */
function generateOperationId(method, pathUrl) {
    // /pet/{petId}/uploadImage + post => postPetUploadImage
    const segments = pathUrl
        .replace(/\{[^}]+\}/g, '') // remove path params
        .split('/')
        .filter(Boolean)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1));
    return method + segments.join('');
}
/**
 * Ensures all operations have tags. Generates from path if missing.
 */
function ensureOperationTags(result) {
    const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
    const existingTagNames = new Set((result.tags || []).map((t) => t.name));
    Object.entries(result.paths || {}).forEach(([pathUrl, pathItem]) => {
        httpMethods.forEach(method => {
            const operation = pathItem[method];
            if (!operation)
                return;
            if (!operation.tags || !operation.tags.length) {
                // Generate tag from first path segment
                const segments = pathUrl.split('/').filter(Boolean);
                const tagName = segments[0] || 'default';
                operation.tags = [tagName];
                if (!existingTagNames.has(tagName)) {
                    result.tags.push({ name: tagName, description: `Operations for ${tagName}` });
                    existingTagNames.add(tagName);
                }
            }
        });
    });
}
//# sourceMappingURL=swagger2-normalizer.js.map