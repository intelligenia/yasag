"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeOpenApi3 = void 0;
/**
 * Normalizes OpenAPI 3.0.x and 3.1.x specs to the internal Swagger 2.0 format
 * that the existing generator code consumes.
 *
 * Handles:
 *  - servers[0].url -> host + basePath + schemes (including server variables)
 *  - components.schemas -> definitions
 *  - #/components/schemas/X -> #/definitions/X (recursive in all contexts)
 *  - #/components/parameters/X -> inline resolution
 *  - #/components/responses/X -> inline resolution
 *  - #/components/requestBodies/X -> inline resolution
 *  - requestBody.content[mediaType].schema -> parameters[{in: "body"}]
 *  - requestBody.content["multipart/form-data"] -> parameters[{in: "formData"}]
 *  - responses[code].content[mediaType].schema -> responses[code].schema
 *  - parameter.schema (path/query) -> parameter.type/format/enum (inline)
 *  - nullable: true -> x-nullable: true (OAS 3.0)
 *  - type: ["string", "null"] -> type: "string" + x-nullable (OAS 3.1)
 *  - allOf merge of properties
 *  - oneOf / anyOf union types
 *  - discriminator mapping
 *  - Missing operationId generation
 *  - Missing tags generation from path segments
 *  - Webhooks (ignored, not relevant for REST generation)
 *  - OAS 3.1 pathItems reference objects
 */
function normalizeOpenApi3(schema) {
    // Store components for $ref resolution
    const components = schema.components || {};
    const result = {
        swagger: '2.0',
        info: schema.info || { title: 'API', version: '1.0.0' },
        paths: {},
        definitions: {},
        tags: schema.tags ? [...schema.tags] : [],
    };
    // servers[0].url -> host + basePath + schemes
    parseServers(schema, result);
    // components.schemas -> definitions
    if (components.schemas) {
        result.definitions = normalizeSchemas(components.schemas);
    }
    // Process paths
    if (schema.paths) {
        result.paths = normalizePaths(schema.paths, components);
    }
    // Ensure all operations have tags
    ensureOperationTags(result);
    // Ensure all operations have operationId
    ensureOperationIds(result);
    return result;
}
exports.normalizeOpenApi3 = normalizeOpenApi3;
/**
 * Parses servers array into host, basePath, and schemes.
 * Handles server URL variables like {protocol}://{host}:{port}/{basePath}
 */
function parseServers(schema, result) {
    if (!schema.servers || !schema.servers.length) {
        result.host = 'localhost';
        result.basePath = '/';
        result.schemes = ['https'];
        return;
    }
    let serverUrl = schema.servers[0].url;
    const variables = schema.servers[0].variables;
    // Resolve server URL variables
    if (variables && typeof serverUrl === 'string') {
        Object.entries(variables).forEach(([varName, varDef]) => {
            var _a;
            const defaultValue = varDef.default || ((_a = varDef.enum) === null || _a === void 0 ? void 0 : _a[0]) || varName;
            serverUrl = serverUrl.replace(`{${varName}}`, String(defaultValue));
        });
    }
    try {
        // Handle relative URLs
        if (serverUrl.startsWith('/')) {
            result.host = 'localhost';
            result.basePath = serverUrl;
            result.schemes = ['https'];
        }
        else if (serverUrl.startsWith('//')) {
            // Protocol-relative URL
            result.host = serverUrl.replace(/^\/\//, '').split('/')[0];
            const pathStart = serverUrl.indexOf('/', 2);
            result.basePath = pathStart >= 0 ? serverUrl.slice(pathStart) : '';
            result.schemes = ['https'];
        }
        else {
            const url = new URL(serverUrl);
            result.host = url.host;
            result.basePath = url.pathname === '/' ? '' : url.pathname;
            result.schemes = [url.protocol.replace(':', '')];
        }
    }
    catch (_a) {
        result.host = 'localhost';
        result.basePath = serverUrl || '/';
        result.schemes = ['https'];
    }
    // Strip trailing slash from basePath
    if (result.basePath && result.basePath !== '/') {
        result.basePath = result.basePath.replace(/\/+$/, '');
    }
}
/**
 * Normalizes component schemas into definitions format
 */
function normalizeSchemas(schemas) {
    const definitions = {};
    Object.entries(schemas).forEach(([name, schemaDef]) => {
        definitions[name] = normalizeSchemaObject(schemaDef);
    });
    return definitions;
}
/**
 * Recursively normalizes a single schema object.
 * Handles all OAS 3.0 and 3.1 schema constructs.
 */
function normalizeSchemaObject(schema) {
    if (!schema)
        return schema;
    const result = Object.assign({}, schema);
    // Convert $ref from components/schemas to definitions
    if (result.$ref) {
        result.$ref = convertRef(result.$ref);
        // If it's just a $ref, return immediately (don't process other fields)
        if (Object.keys(result).length === 1)
            return result;
    }
    // OAS 3.1: type can be an array like ["string", "null"]
    if (Array.isArray(result.type)) {
        const types = result.type.filter((t) => t !== 'null');
        const hasNull = result.type.includes('null');
        result.type = types.length === 1 ? types[0] : types[0] || 'object';
        if (hasNull) {
            result['x-nullable'] = true;
        }
    }
    // OAS 3.0: nullable: true -> x-nullable: true
    if (result.nullable === true) {
        result['x-nullable'] = true;
        delete result.nullable;
    }
    // Handle allOf - merge into single definition
    if (result.allOf && Array.isArray(result.allOf)) {
        const merged = mergeAllOf(result.allOf);
        delete result.allOf;
        Object.assign(result, merged);
    }
    // Handle oneOf/anyOf - normalize recursively
    if (result.oneOf && Array.isArray(result.oneOf)) {
        result.oneOf = result.oneOf.map(normalizeSchemaObject);
    }
    if (result.anyOf && Array.isArray(result.anyOf)) {
        // OAS 3.1 uses anyOf for nullable: anyOf: [{type: X}, {type: "null"}]
        const nonNull = result.anyOf.filter((s) => s.type !== 'null');
        const hasNull = result.anyOf.some((s) => s.type === 'null');
        if (hasNull && nonNull.length === 1) {
            // This is just nullable, not a real union
            const normalized = normalizeSchemaObject(nonNull[0]);
            normalized['x-nullable'] = true;
            delete result.anyOf;
            Object.assign(result, normalized);
        }
        else {
            result.anyOf = result.anyOf.map(normalizeSchemaObject);
        }
    }
    // Handle discriminator - copy mapping for downstream use
    if (result.discriminator) {
        if (typeof result.discriminator === 'object') {
            result['x-discriminator-property'] = result.discriminator.propertyName;
            if (result.discriminator.mapping) {
                result['x-discriminator-mapping'] = {};
                Object.entries(result.discriminator.mapping).forEach(([key, ref]) => {
                    result['x-discriminator-mapping'][key] = convertRef(ref);
                });
            }
        }
        delete result.discriminator;
    }
    // Normalize properties recursively
    if (result.properties) {
        const newProps = {};
        Object.entries(result.properties).forEach(([propName, propDef]) => {
            newProps[propName] = normalizeSchemaObject(propDef);
        });
        result.properties = newProps;
    }
    // Normalize items
    if (result.items) {
        result.items = normalizeSchemaObject(result.items);
    }
    // Normalize additionalProperties
    if (result.additionalProperties && typeof result.additionalProperties === 'object') {
        result.additionalProperties = normalizeSchemaObject(result.additionalProperties);
    }
    // OAS 3.1: $defs -> move to top level (not common but possible)
    if (result.$defs) {
        delete result.$defs;
    }
    // Remove OAS 3.x specific fields not relevant
    delete result.externalDocs;
    return result;
}
/**
 * Merges allOf schemas into a single schema
 */
function mergeAllOf(schemas) {
    const merged = {};
    const requiredSets = [];
    const validationKeys = [
        'format', 'enum', 'default', 'minimum', 'maximum',
        'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf',
        'minLength', 'maxLength', 'pattern',
        'minItems', 'maxItems', 'uniqueItems',
        'readOnly', 'writeOnly', 'additionalProperties', 'items',
        'example',
    ];
    schemas.forEach(s => {
        const normalized = normalizeSchemaObject(s);
        if (normalized.$ref) {
            merged.$ref = normalized.$ref;
            return;
        }
        if (normalized.type)
            merged.type = normalized.type;
        if (normalized.description)
            merged.description = normalized.description;
        if (normalized.properties) {
            if (!merged.properties)
                merged.properties = {};
            Object.assign(merged.properties, normalized.properties);
        }
        if (normalized.required) {
            requiredSets.push(normalized.required);
        }
        // Preserve x-nullable
        if (normalized['x-nullable']) {
            merged['x-nullable'] = true;
        }
        // Propagate validation/metadata properties
        validationKeys.forEach(key => {
            if (normalized[key] !== undefined && merged[key] === undefined) {
                merged[key] = normalized[key];
            }
        });
    });
    if (requiredSets.length) {
        merged.required = Array.from(new Set(requiredSets.flat()));
    }
    return merged;
}
/**
 * Converts all known OAS3 $ref patterns to #/definitions/ format.
 * Handles:
 *  - #/components/schemas/X
 *  - #/components/responses/X (returns ref as-is for external resolution)
 *  - #/components/parameters/X
 *  - #/components/requestBodies/X
 */
function convertRef(ref) {
    if (!ref || typeof ref !== 'string')
        return ref;
    // The main one: schemas -> definitions
    ref = ref.replace(/^#\/components\/schemas\//, '#/definitions/');
    return ref;
}
/**
 * Resolves a $ref to its actual object from components
 */
function resolveComponentRef(ref, components) {
    if (!ref || !ref.startsWith('#/components/'))
        return null;
    const parts = ref.replace('#/components/', '').split('/');
    let current = components;
    for (const part of parts) {
        if (!current || typeof current !== 'object')
            return null;
        current = current[part];
    }
    return current ? JSON.parse(JSON.stringify(current)) : null;
}
/**
 * Normalizes all paths and their operations
 */
function normalizePaths(paths, components) {
    const result = {};
    Object.entries(paths).forEach(([pathUrl, pathItem]) => {
        // OAS 3.1: pathItem can be a $ref
        let resolvedPathItem = pathItem;
        if (pathItem.$ref) {
            const resolved = resolveComponentRef(pathItem.$ref, components);
            if (resolved) {
                resolvedPathItem = Object.assign(Object.assign({}, resolved), pathItem);
                delete resolvedPathItem.$ref;
            }
        }
        result[pathUrl] = {};
        // Copy path-level parameters (resolve $refs)
        if (resolvedPathItem.parameters) {
            result[pathUrl].parameters = resolvedPathItem.parameters.map((p) => normalizeParameter(p, components));
        }
        const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'];
        httpMethods.forEach(method => {
            if (resolvedPathItem[method]) {
                result[pathUrl][method] = normalizeOperation(resolvedPathItem[method], components);
            }
        });
    });
    return result;
}
/**
 * Normalizes a single operation (method)
 */
function normalizeOperation(operation, components) {
    const result = Object.assign(Object.assign({}, operation), { parameters: [], responses: {} });
    // Copy existing parameters (path, query, header, cookie) - resolve $refs
    if (operation.parameters) {
        result.parameters = operation.parameters.map((p) => normalizeParameter(p, components));
    }
    // requestBody -> parameters with in: "body" or "formData"
    if (operation.requestBody) {
        let requestBody = operation.requestBody;
        // Resolve requestBody $ref
        if (requestBody.$ref) {
            const resolved = resolveComponentRef(requestBody.$ref, components);
            if (resolved)
                requestBody = resolved;
        }
        const bodyParams = normalizeRequestBody(requestBody);
        result.parameters = result.parameters.concat(bodyParams);
    }
    // Normalize responses (resolve $refs)
    if (operation.responses) {
        result.responses = normalizeResponses(operation.responses, components);
    }
    // Remove OpenAPI 3 specific fields already processed
    delete result.requestBody;
    delete result.callbacks;
    delete result.servers;
    return result;
}
/**
 * Normalizes a single parameter (path/query/header/cookie).
 * Resolves $ref if parameter is a reference.
 * In OAS3, parameters have a `schema` sub-object instead of inline type/format.
 */
function normalizeParameter(param, components) {
    // Resolve $ref parameter
    let resolved = param;
    if (param.$ref) {
        const refResolved = resolveComponentRef(param.$ref, components);
        if (refResolved) {
            resolved = refResolved;
        }
    }
    const result = Object.assign({}, resolved);
    delete result.$ref;
    // In OpenAPI 3, parameter type info is in param.schema
    if (result.schema) {
        const schema = normalizeSchemaObject(result.schema);
        // Flatten schema properties into the parameter level for Swagger 2.0 compat
        if (schema.type)
            result.type = schema.type;
        if (schema.format)
            result.format = schema.format;
        if (schema.enum)
            result.enum = schema.enum;
        if (schema.items)
            result.items = schema.items;
        if (schema.default !== undefined)
            result.default = schema.default;
        if (schema.minimum !== undefined)
            result.minimum = schema.minimum;
        if (schema.maximum !== undefined)
            result.maximum = schema.maximum;
        if (schema.minLength !== undefined)
            result.minLength = schema.minLength;
        if (schema.maxLength !== undefined)
            result.maxLength = schema.maxLength;
        if (schema.pattern !== undefined)
            result.pattern = schema.pattern;
        if (schema.minItems !== undefined)
            result.minItems = schema.minItems;
        if (schema.maxItems !== undefined)
            result.maxItems = schema.maxItems;
        if (schema.uniqueItems !== undefined)
            result.uniqueItems = schema.uniqueItems;
        if (schema.exclusiveMinimum !== undefined)
            result.exclusiveMinimum = schema.exclusiveMinimum;
        if (schema.exclusiveMaximum !== undefined)
            result.exclusiveMaximum = schema.exclusiveMaximum;
        if (schema.multipleOf !== undefined)
            result.multipleOf = schema.multipleOf;
        if (schema.readOnly !== undefined)
            result.readOnly = schema.readOnly;
        if (schema.writeOnly !== undefined)
            result.writeOnly = schema.writeOnly;
        if (schema.example !== undefined)
            result.example = schema.example;
        if (schema['x-nullable'])
            result['x-nullable'] = true;
        // Keep schema for body-like params that use $ref
        if (!schema.$ref) {
            delete result.schema;
        }
        else {
            result.schema = schema;
        }
    }
    // OAS3 "cookie" params -> treat as query for our purposes
    if (result.in === 'cookie') {
        result.in = 'query';
    }
    // Ensure description exists
    if (!result.description) {
        result.description = '';
    }
    return result;
}
/**
 * Converts requestBody to Swagger 2.0 body/formData parameters.
 * Handles all common content types.
 */
function normalizeRequestBody(requestBody) {
    if (!requestBody || !requestBody.content)
        return [];
    const content = requestBody.content;
    const required = requestBody.required || false;
    const description = requestBody.description || '';
    // Check for multipart/form-data first
    if (content['multipart/form-data']) {
        return normalizeFormData(content['multipart/form-data'], required, description);
    }
    // Check for application/x-www-form-urlencoded
    if (content['application/x-www-form-urlencoded']) {
        return normalizeFormData(content['application/x-www-form-urlencoded'], required, description);
    }
    // application/json and variants
    const jsonMediaType = content['application/json'] ||
        content['application/json;charset=UTF-8'] ||
        content['application/json; charset=utf-8'] ||
        content['application/vnd.api+json'] ||
        content['application/merge-patch+json'] ||
        content['application/json-patch+json'];
    if (jsonMediaType && jsonMediaType.schema) {
        const schema = normalizeSchemaObject(jsonMediaType.schema);
        return [{
                in: 'body',
                name: 'body',
                description,
                required,
                schema,
            }];
    }
    // application/xml
    const xmlMediaType = content['application/xml'] || content['text/xml'];
    if (xmlMediaType && xmlMediaType.schema) {
        const schema = normalizeSchemaObject(xmlMediaType.schema);
        return [{
                in: 'body',
                name: 'body',
                description,
                required,
                schema,
            }];
    }
    // application/octet-stream -> file upload
    if (content['application/octet-stream']) {
        return [{
                in: 'formData',
                name: 'file',
                description,
                required,
                type: 'file',
            }];
    }
    // text/plain
    if (content['text/plain']) {
        return [{
                in: 'body',
                name: 'body',
                description,
                required,
                schema: { type: 'string' },
            }];
    }
    // Wildcard or first available
    const wildcard = content['*/*'] || Object.values(content)[0];
    if (wildcard && wildcard.schema) {
        const schema = normalizeSchemaObject(wildcard.schema);
        return [{
                in: 'body',
                name: 'body',
                description,
                required,
                schema,
            }];
    }
    return [];
}
/**
 * Converts form-data schema properties to formData parameters
 */
function normalizeFormData(mediaType, required, description) {
    if (!mediaType.schema)
        return [];
    const schema = mediaType.schema;
    // If it has properties, each property becomes a formData param
    if (schema.properties) {
        const requiredFields = schema.required || [];
        return Object.entries(schema.properties).map(([name, propDef]) => {
            const normalized = normalizeSchemaObject(propDef);
            // OAS3 uses type: string + format: binary for file uploads
            let paramType = normalized.type || 'string';
            if (paramType === 'string' && normalized.format === 'binary') {
                paramType = 'file';
            }
            // OAS3 uses type: string + format: byte for base64 file content
            if (paramType === 'string' && normalized.format === 'byte') {
                paramType = 'file';
            }
            // Array of files
            if (paramType === 'array' && normalized.items) {
                if (normalized.items.type === 'string' && normalized.items.format === 'binary') {
                    paramType = 'file';
                }
            }
            const param = {
                in: 'formData',
                name,
                description: normalized.description || '',
                required: requiredFields.includes(name),
                type: paramType,
                format: normalized.format,
                enum: normalized.enum,
                default: normalized.default,
                minimum: normalized.minimum,
                maximum: normalized.maximum,
                exclusiveMinimum: normalized.exclusiveMinimum,
                exclusiveMaximum: normalized.exclusiveMaximum,
                minLength: normalized.minLength,
                maxLength: normalized.maxLength,
                pattern: normalized.pattern,
                minItems: normalized.minItems,
                maxItems: normalized.maxItems,
                uniqueItems: normalized.uniqueItems,
                multipleOf: normalized.multipleOf,
                readOnly: normalized.readOnly,
                items: normalized.items,
            };
            // Remove undefined values
            Object.keys(param).forEach(key => {
                if (param[key] === undefined)
                    delete param[key];
            });
            return param;
        });
    }
    // Fallback: single body param
    return [{
            in: 'body',
            name: 'body',
            description,
            required,
            schema: normalizeSchemaObject(schema),
        }];
}
/**
 * Normalizes responses from OAS3 to Swagger 2.0 format.
 * Resolves $ref to components/responses.
 */
function normalizeResponses(responses, components) {
    const result = {};
    Object.entries(responses).forEach(([code, responseDef]) => {
        let resolved = responseDef;
        // Resolve $ref to components/responses
        if (responseDef.$ref) {
            const refResolved = resolveComponentRef(responseDef.$ref, components);
            if (refResolved) {
                resolved = refResolved;
            }
        }
        result[code] = {
            description: resolved.description || '',
        };
        // responses[code].content[mediaType].schema -> responses[code].schema
        if (resolved.content) {
            const mediaType = resolved.content['application/json'] ||
                resolved.content['application/json;charset=UTF-8'] ||
                resolved.content['application/vnd.api+json'] ||
                resolved.content['*/*'] ||
                Object.values(resolved.content)[0];
            if (mediaType && mediaType.schema) {
                result[code].schema = normalizeSchemaObject(mediaType.schema);
            }
        }
        // Direct schema (OAS 3.1 shorthand or already Swagger 2.0-like)
        if (resolved.schema && !result[code].schema) {
            result[code].schema = normalizeSchemaObject(resolved.schema);
        }
    });
    return result;
}
/**
 * Ensures all operations have tags. Generates from path if missing.
 */
function ensureOperationTags(result) {
    const existingTagNames = new Set((result.tags || []).map((t) => t.name));
    const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'];
    Object.entries(result.paths || {}).forEach(([pathUrl, pathItem]) => {
        httpMethods.forEach(method => {
            const operation = pathItem[method];
            if (!operation)
                return;
            if (!operation.tags || !operation.tags.length) {
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
/**
 * Ensures all operations have operationId. Generates from method + path if missing.
 */
function ensureOperationIds(result) {
    const usedIds = new Set();
    const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'];
    // First pass: collect existing operationIds
    Object.values(result.paths || {}).forEach((pathItem) => {
        httpMethods.forEach(method => {
            if (pathItem[method] && pathItem[method].operationId) {
                usedIds.add(pathItem[method].operationId);
            }
        });
    });
    // Second pass: generate missing operationIds
    Object.entries(result.paths || {}).forEach(([pathUrl, pathItem]) => {
        httpMethods.forEach(method => {
            const operation = pathItem[method];
            if (!operation)
                return;
            if (!operation.operationId) {
                const segments = pathUrl
                    .replace(/\{[^}]+\}/g, '')
                    .split('/')
                    .filter(Boolean)
                    .map((s) => s.charAt(0).toUpperCase() + s.slice(1));
                let id = method + segments.join('');
                let counter = 1;
                while (usedIds.has(id)) {
                    id = method + segments.join('') + counter;
                    counter++;
                }
                operation.operationId = id;
                usedIds.add(id);
            }
        });
    });
}
//# sourceMappingURL=openapi3-normalizer.js.map