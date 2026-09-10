"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeSwagger1 = void 0;
/**
 * Normalizes Swagger 1.x (1.0, 1.1, 1.2) specs to the internal Swagger 2.0 format.
 *
 * Swagger 1.x uses a very different structure:
 *  - Resource listing: { swaggerVersion, apiVersion, apis: [{path, description}] }
 *  - API declaration: { swaggerVersion, basePath, apis: [{path, operations}], models }
 *  - Operations have: { method, nickname, parameters, responseMessages, type/items }
 *  - Models use "id" instead of the key name, "properties" same as v2
 *
 * This normalizer handles the API declaration format (the one with actual operations).
 */
function normalizeSwagger1(schema) {
    var _a, _b;
    const result = {
        swagger: '2.0',
        info: {
            title: ((_a = schema.info) === null || _a === void 0 ? void 0 : _a.title) || schema.resourcePath || 'API',
            version: schema.apiVersion || '1.0.0',
            description: ((_b = schema.info) === null || _b === void 0 ? void 0 : _b.description) || '',
        },
        host: 'localhost',
        basePath: '/',
        schemes: ['https'],
        paths: {},
        definitions: {},
        tags: [],
    };
    // Parse basePath
    if (schema.basePath) {
        try {
            if (schema.basePath.startsWith('http')) {
                const url = new URL(schema.basePath);
                result.host = url.host;
                result.basePath = url.pathname === '/' ? '' : url.pathname;
                result.schemes = [url.protocol.replace(':', '')];
            }
            else {
                result.basePath = schema.basePath;
            }
        }
        catch (_c) {
            result.basePath = schema.basePath;
        }
    }
    // Convert models -> definitions
    if (schema.models) {
        Object.entries(schema.models).forEach(([modelName, modelDef]) => {
            result.definitions[modelName] = normalizeModel(modelDef);
        });
    }
    // Convert apis -> paths
    if (schema.apis && Array.isArray(schema.apis)) {
        schema.apis.forEach((api) => {
            if (!api.path)
                return;
            // Normalize path: Swagger 1.x uses {param} same as 2.0
            const pathUrl = api.path;
            if (!result.paths[pathUrl]) {
                result.paths[pathUrl] = {};
            }
            // Each api has operations array
            if (api.operations && Array.isArray(api.operations)) {
                api.operations.forEach((op) => {
                    const method = (op.method || op.httpMethod || 'get').toLowerCase();
                    result.paths[pathUrl][method] = normalizeOperation(op, api, schema);
                });
            }
        });
    }
    // Generate tags from paths
    const tagSet = new Set();
    Object.values(result.paths).forEach((pathItem) => {
        Object.values(pathItem).forEach((op) => {
            if (op.tags) {
                op.tags.forEach((t) => tagSet.add(t));
            }
        });
    });
    result.tags = Array.from(tagSet).map(name => ({ name, description: '' }));
    return result;
}
exports.normalizeSwagger1 = normalizeSwagger1;
/**
 * Normalizes a Swagger 1.x model to a Swagger 2.0 definition
 */
function normalizeModel(model) {
    const def = {
        type: 'object',
        properties: {},
    };
    if (model.description)
        def.description = model.description;
    if (model.required)
        def.required = model.required;
    if (model.properties) {
        Object.entries(model.properties).forEach(([propName, propDef]) => {
            def.properties[propName] = normalizeModelProperty(propDef);
        });
    }
    return def;
}
/**
 * Normalizes a Swagger 1.x model property
 */
function normalizeModelProperty(prop) {
    const result = {};
    // In Swagger 1.x, type can be a model name reference
    if (prop.type) {
        const mapped = mapSwagger1Type(prop.type);
        if (mapped.isRef) {
            result.$ref = `#/definitions/${prop.type}`;
        }
        else {
            result.type = mapped.type;
        }
    }
    if (prop.format)
        result.format = prop.format;
    if (prop.description)
        result.description = prop.description;
    if (prop.enum)
        result.enum = prop.enum;
    if (prop.defaultValue !== undefined)
        result.default = prop.defaultValue;
    if (prop.minimum !== undefined)
        result.minimum = prop.minimum;
    if (prop.maximum !== undefined)
        result.maximum = prop.maximum;
    if (prop.minLength !== undefined)
        result.minLength = prop.minLength;
    if (prop.maxLength !== undefined)
        result.maxLength = prop.maxLength;
    if (prop.pattern !== undefined)
        result.pattern = prop.pattern;
    if (prop.minItems !== undefined)
        result.minItems = prop.minItems;
    if (prop.maxItems !== undefined)
        result.maxItems = prop.maxItems;
    if (prop.uniqueItems !== undefined)
        result.uniqueItems = prop.uniqueItems;
    if (prop.readOnly !== undefined)
        result.readOnly = prop.readOnly;
    // Handle array items
    if (prop.type === 'array' || prop.type === 'Array') {
        result.type = 'array';
        if (prop.items) {
            if (prop.items.$ref) {
                result.items = { $ref: `#/definitions/${prop.items.$ref}` };
            }
            else if (prop.items.type) {
                const itemMapped = mapSwagger1Type(prop.items.type);
                if (itemMapped.isRef) {
                    result.items = { $ref: `#/definitions/${prop.items.type}` };
                }
                else {
                    result.items = { type: itemMapped.type };
                }
            }
        }
    }
    // Handle $ref directly
    if (prop.$ref) {
        result.$ref = `#/definitions/${prop.$ref}`;
        delete result.type;
    }
    return result;
}
/**
 * Maps Swagger 1.x types to Swagger 2.0 types
 */
function mapSwagger1Type(type) {
    const typeMap = {
        'int': 'integer',
        'long': 'integer',
        'float': 'number',
        'double': 'number',
        'byte': 'string',
        'boolean': 'boolean',
        'date': 'string',
        'dateTime': 'string',
        'string': 'string',
        'object': 'object',
        'array': 'array',
        'Array': 'array',
        'void': 'string',
        'File': 'file',
        'integer': 'integer',
        'number': 'number',
    };
    if (typeMap[type]) {
        return { type: typeMap[type], isRef: false };
    }
    // If not a known type, it's a model reference
    return { type, isRef: true };
}
/**
 * Normalizes a Swagger 1.x operation to Swagger 2.0 format
 */
function normalizeOperation(op, api, schema) {
    const result = {
        tags: [],
        summary: op.summary || op.nickname || '',
        description: op.notes || op.description || '',
        operationId: op.nickname || op.operationId || '',
        parameters: [],
        responses: {},
    };
    // Generate tag from resource path or api path
    const resourcePath = schema.resourcePath || api.path || '';
    const tagName = resourcePath.split('/').filter(Boolean)[0] || 'default';
    result.tags = [tagName];
    // Convert parameters
    if (op.parameters && Array.isArray(op.parameters)) {
        result.parameters = op.parameters.map((param) => normalizeParameter(param));
    }
    // Convert response
    const responseType = op.type || op.responseClass || 'void';
    if (responseType && responseType !== 'void') {
        const mapped = mapSwagger1Type(responseType);
        const responseSchema = {};
        if (mapped.isRef) {
            responseSchema.$ref = `#/definitions/${responseType}`;
        }
        else if (responseType === 'array' || responseType === 'Array') {
            responseSchema.type = 'array';
            if (op.items) {
                const itemMapped = mapSwagger1Type(op.items.type || op.items.$ref || 'object');
                if (itemMapped.isRef) {
                    responseSchema.items = { $ref: `#/definitions/${op.items.type || op.items.$ref}` };
                }
                else {
                    responseSchema.items = { type: itemMapped.type };
                }
            }
        }
        else {
            responseSchema.type = mapped.type;
        }
        result.responses['200'] = {
            description: 'successful operation',
            schema: responseSchema,
        };
    }
    else {
        result.responses['200'] = { description: 'successful operation' };
    }
    // Convert responseMessages to error responses
    if (op.responseMessages && Array.isArray(op.responseMessages)) {
        op.responseMessages.forEach((rm) => {
            if (rm.code) {
                result.responses[String(rm.code)] = {
                    description: rm.message || '',
                };
            }
        });
    }
    // Produces/consumes
    if (op.produces)
        result.produces = op.produces;
    if (op.consumes)
        result.consumes = op.consumes;
    return result;
}
/**
 * Normalizes a Swagger 1.x parameter
 */
function normalizeParameter(param) {
    const result = {
        name: param.name || '',
        in: normalizeParamType(param.paramType || param.in || 'query'),
        description: param.description || '',
        required: param.required || false,
    };
    if (param.type) {
        const mapped = mapSwagger1Type(param.type);
        if (param.paramType === 'body' || param.in === 'body') {
            if (mapped.isRef) {
                result.schema = { $ref: `#/definitions/${param.type}` };
            }
            else {
                result.schema = { type: mapped.type };
            }
        }
        else {
            if (mapped.isRef) {
                result.schema = { $ref: `#/definitions/${param.type}` };
            }
            else {
                result.type = mapped.type;
            }
        }
    }
    if (param.format)
        result.format = param.format;
    if (param.enum)
        result.enum = param.enum;
    if (param.defaultValue !== undefined)
        result.default = param.defaultValue;
    if (param.minimum !== undefined)
        result.minimum = param.minimum;
    if (param.maximum !== undefined)
        result.maximum = param.maximum;
    if (param.minLength !== undefined)
        result.minLength = param.minLength;
    if (param.maxLength !== undefined)
        result.maxLength = param.maxLength;
    if (param.pattern !== undefined)
        result.pattern = param.pattern;
    if (param.minItems !== undefined)
        result.minItems = param.minItems;
    if (param.maxItems !== undefined)
        result.maxItems = param.maxItems;
    if (param.uniqueItems !== undefined)
        result.uniqueItems = param.uniqueItems;
    if (param.allowMultiple) {
        result.type = 'array';
        result.items = { type: param.type || 'string' };
        result.collectionFormat = 'multi';
    }
    return result;
}
/**
 * Normalizes Swagger 1.x paramType to Swagger 2.0 "in" values
 */
function normalizeParamType(paramType) {
    const map = {
        'path': 'path',
        'query': 'query',
        'body': 'body',
        'header': 'header',
        'form': 'formData',
        'formData': 'formData',
    };
    return map[paramType] || 'query';
}
//# sourceMappingURL=swagger1-normalizer.js.map