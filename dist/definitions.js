"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExport = exports.processDefinition = exports.writeToBaseModelFile = exports.processDefinitions = void 0;
/**
 * Processing of custom types from `definitions` section
 * in the schema
 */
const _ = require("lodash");
const path = require("path");
const common_1 = require("./common");
const conf = require("./conf");
const utils_1 = require("./utils");
/**
 * Entry point, processes all definitions and exports them
 * to individual files
 * @param defs definitions from the schema
 * @param config global configuration
 */
function processDefinitions(defs, config) {
    (0, utils_1.emptyDir)(path.join(config.dest, conf.defsDir));
    const definitions = [];
    const files = {};
    _.forOwn(defs, (v, source) => {
        const file = processDefinition(v, source, config);
        if (file && file.name) {
            const previous = files[file.name];
            if (previous === undefined)
                files[file.name] = [source];
            else
                previous.push(source);
            definitions.push(file);
        }
    });
    let allExports = '';
    _.forOwn(files, (sources, def) => {
        allExports += createExport(def) + createExportComments(def, sources) + '\n';
    });
    writeToBaseModelFile(config, allExports);
    return definitions;
}
exports.processDefinitions = processDefinitions;
function writeToBaseModelFile(config, allExports) {
    const filename = path.join(config.dest, `${conf.modelFile}.ts`);
    (0, utils_1.writeFile)(filename, allExports, config.header);
}
exports.writeToBaseModelFile = writeToBaseModelFile;
/**
 * Creates the file of the type definition
 * @param def type definition
 * @param name name of the type definition and after normalization of the resulting interface + file
 * @param config
 */
function processDefinition(def, name, config) {
    if (!isWritable(name))
        return;
    name = (0, common_1.normalizeDef)(name);
    const nameModel = name;
    let output = '';
    const properties = _.map(def.properties, (v, k) => (0, common_1.processProperty)(v, k, name, def.required, true, nameModel));
    // conditional import of global types
    if (properties.some(p => !p.native)) {
        output += `import * as __${conf.modelFile} from \'../${conf.modelFile}\';\n\n`;
    }
    if (def.description)
        output += `/** ${def.description} */\n`;
    output += `export interface ${name} {\n`;
    output += (0, utils_1.indent)(_.map(properties, 'property').join('\n'));
    output += `\n}\n`;
    // concat non-empty enum lines
    const enumLines = _.map(properties, 'enumDeclaration').filter(Boolean).join('\n\n');
    if (enumLines)
        output += `\n${enumLines}\n`;
    const filename = path.join(config.dest, conf.defsDir, `${name}.ts`);
    (0, utils_1.writeFile)(filename, output, config.header);
    return { name, def };
}
exports.processDefinition = processDefinition;
/**
 * Creates single export line for `def` name
 * @param def name of the definition file w/o extension
 */
function createExport(def) {
    return `export * from './${conf.defsDir}/${def}';`;
}
exports.createExport = createExport;
/**
 * Creates comment naming source definitions for the export
 * @param file
 * @param sources list of sources for the file
 */
function createExportComments(file, sources) {
    if (sources.length > 1 || !sources.includes(file)) {
        return ' // sources: ' + sources.join(', ');
    }
    return '';
}
/**
 * Checks whether this type's file shall be serialized
 * @param type name
 */
function isWritable(type) {
    if ((type.startsWith('Collection«')) || (type.startsWith('Map«'))) {
        return false;
    }
    return true;
}
//# sourceMappingURL=definitions.js.map