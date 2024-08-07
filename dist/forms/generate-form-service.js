"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFormService = void 0;
const _ = require("lodash");
const nodePath = require("path");
const common_1 = require("../common");
const conf_1 = require("../conf");
const process_params_1 = require("../requests/process-params");
const utils_1 = require("../utils");
function generateFormService(config, name, params, definitions, simpleName, formSubDirName, className, methodName, method, readOnly) {
    let content = "";
    const formName = "form";
    const formArrayReset = [];
    const formArrayPatch = [];
    const componentHTMLFileName = nodePath.join(formSubDirName, `${simpleName}.service.ts`);
    (0, utils_1.out)(`Generating ${componentHTMLFileName}`, utils_1.TermColors.default);
    const constructor = getConstructor(name, className, definitions, params, formName, formArrayReset, formArrayPatch, readOnly, config);
    const variables = getVariables(method);
    // Imports
    content += getImports(name, constructor, methodName);
    // Class declaration
    content += `@Injectable()\n`;
    let observableType = method.responseDef.type;
    if (observableType === "string" && method.responseDef.format === "binary") {
        observableType = "Blob";
    }
    if (methodName === "get") {
        content += `export class ${className}FormService extends YASAGGetFormService<${observableType}> {\n`;
    }
    else {
        content += `export class ${className}FormService extends YASAGPostFormService<${observableType}> {\n`;
    }
    // Class variables
    content += variables;
    // Constructor and add & remove form methods
    content += constructor;
    // Submit function
    content += getFormSubmitFunction(simpleName, params, methodName, method);
    content += `\n\n`;
    // Reset function
    content += getFormResetFunction(formName, formArrayReset, formArrayPatch, methodName);
    content += "}\n";
    (0, utils_1.writeFile)(componentHTMLFileName, content, config.header);
}
exports.generateFormService = generateFormService;
function getImports(name, constructor, methodName) {
    const imports = [];
    if (constructor.match(/new FormArray\(/))
        imports.push("FormArray");
    if (constructor.match(/new UntypedFormArray\(/))
        imports.push("UntypedFormArray");
    if (constructor.match(/new FormControl/))
        imports.push("FormControl");
    if (constructor.match(/new FormGroup\(/))
        imports.push("FormGroup");
    if (constructor.match(/\[Validators\./))
        imports.push("Validators");
    let res = "import { Injectable, NgZone } from '@angular/core';\n";
    if (imports.length)
        res += `import {${imports.join(", ")}} from '@angular/forms';\n`;
    res += "import {  Observable } from 'rxjs';\n";
    res += `import { ${name}Service } from '../../../controllers/${name}';\n`;
    res += `import * as __model from '../../../model';\n`;
    res += "import { APIConfigService } from '../../../apiconfig.service';\n\n";
    res += "import * as __utils from '../../../yasag-utils';\n\n";
    if (methodName === "get") {
        res += "import { YASAGGetFormService } from '../../yasag-get.service';\n\n";
    }
    else {
        res +=
            "import { YASAGPostFormService } from '../../yasag-post.service';\n\n";
    }
    res += "\n";
    return res;
}
function getVariables(method) {
    let content = "";
    Object.keys(method.method.method).forEach((k) => {
        if (k.startsWith("x-")) {
            content += (0, utils_1.indent)(`static ${_.camelCase(k)} = ${JSON.stringify(method.method.method[k])};\n`);
        }
    });
    return content;
}
function getConstructor(name, className, definitions, params, formName, formArrayReset, formArrayPatch, readOnly, config) {
    const definitionsMap = _.groupBy(definitions, "name");
    const parentTypes = [];
    const formArrayMethods = [];
    const formDefinition = walkParamOrProp(params, undefined, definitionsMap, parentTypes, `this.${formName}`, formArrayMethods, "value", "value", formArrayReset, formArrayPatch, readOnly, config);
    let res = (0, utils_1.indent)(`${formName} = new FormGroup({\n${formDefinition}\n});\n`, 1);
    res += (0, utils_1.indent)("constructor(\n");
    res += (0, utils_1.indent)(`apiConfigService: APIConfigService,\n`, 2);
    res += (0, utils_1.indent)(`ngZone: NgZone,\n`, 2);
    res += (0, utils_1.indent)(`private service: ${name}Service,\n`, 2);
    res += (0, utils_1.indent)(") {\n");
    res += (0, utils_1.indent)(`super('${className}', apiConfigService, ngZone);\n`, 2);
    res += (0, utils_1.indent)(`this.init();\n`, 2);
    res += (0, utils_1.indent)("}\n");
    res += "\n";
    for (const method in formArrayMethods) {
        res += formArrayMethods[method];
        res += "\n";
    }
    return res;
}
function walkParamOrProp(definition, path = [], definitions, parentTypes, control, formArrayMethods, formValue, formValueIF, formArrayReset, formArrayPatch, readOnly, config, formArrayParams = "", subArrayReset = [], subArrayPatch = [], parent = "", parents = "", nameParents = "") {
    const res = [];
    let schema;
    let required;
    let nullable;
    // create unified inputs for
    // 1. parameters
    if (Array.isArray(definition)) {
        schema = {};
        required = [];
        nullable = [];
        definition.forEach((param) => {
            if (param.required)
                required.push(param.name);
            if (param["x-nullable"])
                nullable.push(param.name);
            schema[param.name] = (0, process_params_1.parameterToSchema)(param);
        });
        // 2. object definition
    }
    else {
        required = definition.def.required;
        schema = definition.def.properties || {};
    }
    // walk the list and build recursive form model
    Object.entries(schema).forEach(([paramName, param]) => {
        const ref = param.$ref;
        // break type definition chain with cycle
        if (parentTypes.indexOf(ref) >= 0)
            return;
        const name = paramName;
        const newPath = [...path, name];
        const isRequired = required && required.includes(name);
        const isNullable = nullable && nullable.includes(name);
        let newParentTypes = [];
        if (ref)
            newParentTypes = [...parentTypes, ref];
        if (readOnly && name.endsWith(readOnly)) {
            param.readOnly = true;
        }
        if (!param.readOnly || name === "id") {
            const fieldDefinition = makeField(param, ref, name, newPath, isRequired, isNullable, definitions, newParentTypes, `${control}['controls']['${name}']`, formArrayMethods, formValue + `['${name}']`, `${formValueIF} && ${formValue}['${name}']`, formArrayReset, formArrayPatch, formArrayParams, subArrayReset, subArrayPatch, parent, parents, nameParents, readOnly, config);
            res.push(fieldDefinition);
        }
    });
    return (0, utils_1.indent)(res);
}
function makeField(param, ref, name, path, required, nullable, definitions, parentTypes, formControl, formArrayMethods, formValue, formValueIF, formArrayReset, formArrayPatch, formArrayParams, subArrayReset, subArrayPatch, parent, parents, nameParents = "", readOnly, config) {
    let definition;
    let type = param.type;
    let control;
    let initializer;
    if (type) {
        if (type in conf_1.nativeTypes) {
            const typedType = type;
            type = conf_1.nativeTypes[typedType];
        }
        // use helper method and store type definition to add new array items
        if (type === "array") {
            if (param.items.type) {
                control = "FormControl";
                initializer = "[]";
            }
            else {
                const refType = param.items.$ref.replace(/^#\/definitions\//, "");
                definition = definitions[(0, common_1.normalizeDef)(refType)][0];
                const mySubArrayReset = [];
                const mySubArrayPatch = [];
                const fields = walkParamOrProp(definition, path, definitions, parentTypes, formControl + `['controls'][${name}]`, formArrayMethods, formValue + `[${name}]`, formValueIF, formArrayReset, formArrayPatch, readOnly, config, formArrayParams + name + ": number" + ", ", mySubArrayReset, mySubArrayPatch, name, parents + name + ", ", nameParents + _.upperFirst(_.camelCase(name.replace("_", "-"))));
                control = "FormArray";
                if (config.typedForms) {
                    control = "UntypedFormArray";
                }
                initializer = `[]`;
                let addMethod = "";
                addMethod += (0, utils_1.indent)(`public add${nameParents}${_.upperFirst(_.camelCase(name.replace("_", "-")))}(${formArrayParams} ${name}: number = 1, position?: number, value?: any): void {\n`);
                addMethod += (0, utils_1.indent)(`const control = <${control}>${formControl};\n`, 2);
                addMethod += (0, utils_1.indent)(`const fg = new FormGroup({\n${fields}\n}, []);\n`, 2);
                addMethod += (0, utils_1.indent)(`__utils.addField(control,${name}, fg, position, value);\n`, 2);
                addMethod += (0, utils_1.indent)(`}\n`);
                formArrayMethods.push(addMethod);
                let removeMethod = "";
                removeMethod += (0, utils_1.indent)(`public remove${nameParents}${_.upperFirst(_.camelCase(name.replace("_", "-")))}(${formArrayParams} i: number): void {\n`);
                removeMethod += (0, utils_1.indent)(`const control = <${control}>${formControl};\n`, 2);
                removeMethod += (0, utils_1.indent)(`control.removeAt(i);\n`, 2);
                removeMethod += (0, utils_1.indent)(`}\n`);
                formArrayMethods.push(removeMethod);
                if (formArrayParams === "") {
                    let resetMethod = "";
                    resetMethod += (0, utils_1.indent)(`while ((<${control}>${formControl}).length) {\n`);
                    resetMethod += (0, utils_1.indent)(`this.remove${nameParents}${_.upperFirst(_.camelCase(name.replace("_", "-")))}(0);\n`, 2);
                    resetMethod += (0, utils_1.indent)(`}\n`);
                    resetMethod += (0, utils_1.indent)(`if (${formValueIF}) {\n`);
                    resetMethod += (0, utils_1.indent)(`this.add${nameParents}${_.upperFirst(_.camelCase(name.replace("_", "-")))}(${formValue}.length);\n`, 2);
                    mySubArrayReset.forEach((subarray) => {
                        resetMethod += (0, utils_1.indent)(`${formValue}.forEach(${subarray});\n`, 2);
                    });
                    resetMethod += (0, utils_1.indent)(`}\n`);
                    formArrayReset.push(resetMethod);
                    let patchMethod = "";
                    patchMethod += (0, utils_1.indent)(`if (${formValueIF}) {\n`);
                    patchMethod += (0, utils_1.indent)(`while (this.form.${formValue}.length > 0) {\n`, 2);
                    patchMethod += (0, utils_1.indent)(`this.remove${nameParents}${_.upperFirst(_.camelCase(name.replace("_", "-")))}(0);\n`, 3);
                    patchMethod += (0, utils_1.indent)(`}\n`, 2);
                    patchMethod += (0, utils_1.indent)(`if (${formValue}.length > this.form.${formValue}.length) {\n`, 2);
                    patchMethod += (0, utils_1.indent)(`this.add${nameParents}${_.upperFirst(_.camelCase(name.replace("_", "-")))}(${formValue}.length - this.form.${formValue}.length);\n`, 3);
                    patchMethod += (0, utils_1.indent)(`}\n`, 2);
                    mySubArrayPatch.forEach((subarray) => {
                        patchMethod += (0, utils_1.indent)(`${formValue}.forEach(${subarray});\n`, 2);
                    });
                    patchMethod += (0, utils_1.indent)(`}\n`);
                    formArrayPatch.push(patchMethod);
                }
                else {
                    let resetMethod = "";
                    resetMethod += `(${parent}_object, ${parent}) => {\n`;
                    resetMethod += (0, utils_1.indent)(`if (${formValueIF}) {\n`);
                    resetMethod += (0, utils_1.indent)(`this.add${nameParents}${_.upperFirst(_.camelCase(name.replace("_", "-")))}(${parents}${formValue}.length);\n`, 2);
                    mySubArrayReset.forEach((subarray) => {
                        resetMethod += (0, utils_1.indent)(`${formValue}.forEach(${subarray});\n`, 2);
                    });
                    resetMethod += (0, utils_1.indent)(`}\n`);
                    resetMethod += `}`;
                    subArrayReset.push(resetMethod);
                    let patchMethod = "";
                    patchMethod += `(${parent}_object, ${parent}) => {\n`;
                    patchMethod += (0, utils_1.indent)(`if (${formValueIF}) {\n`);
                    patchMethod += (0, utils_1.indent)(`if (${formValue}.length > this.form.${formValue}.length) {\n`, 2);
                    patchMethod += (0, utils_1.indent)(`this.add${nameParents}${_.upperFirst(_.camelCase(name.replace("_", "-")))}(${parents}${formValue}.length - this.form.${formValue}.length);\n`, 3);
                    patchMethod += (0, utils_1.indent)(`}\n`, 2);
                    mySubArrayPatch.forEach((subarray) => {
                        patchMethod += (0, utils_1.indent)(`${formValue}.forEach(${subarray});\n`, 2);
                    });
                    patchMethod += (0, utils_1.indent)(`}\n`);
                    patchMethod += `}`;
                    subArrayPatch.push(patchMethod);
                }
            }
        }
        else {
            let isNullable = nullable ? " | null" : "";
            control = "FormControl";
            if (config.typedForms) {
                control += `<${type}${isNullable}>`;
            }
            initializer =
                typeof param.default === "string"
                    ? `'${param.default}'`
                    : param.default;
            initializer = `{value: ${initializer}, disabled: false}`;
        }
    }
    else {
        const refType = ref.replace(/^#\/definitions\//, "");
        definition = definitions[(0, common_1.normalizeDef)(refType)][0];
        control = "FormGroup";
        const fields = walkParamOrProp(definition, path, definitions, parentTypes, formControl, formArrayMethods, formValue, formValueIF, formArrayReset, formArrayPatch, readOnly, config, formArrayParams, subArrayReset, subArrayPatch, parent, parents, nameParents + _.upperFirst(_.camelCase(name.replace("_", "-"))));
        initializer = `{\n${fields}\n}`;
    }
    const validators = getValidators(param);
    if (required)
        validators.push("Validators.required");
    return `${name}: new ${control}(${initializer}, [${validators.join(", ")}]),`;
}
function getValidators(param) {
    const validators = [];
    if (param.format && param.format === "email")
        validators.push("Validators.email");
    if (param.maximum)
        validators.push(`Validators.max(${param.maximum})`);
    if (param.minimum)
        validators.push(`Validators.min(${param.minimum})`);
    if (param.maxLength)
        validators.push(`Validators.maxLength(${param.maxLength})`);
    if (param.minLength)
        validators.push(`Validators.minLength(${param.minLength})`);
    if (param.pattern)
        validators.push(`Validators.pattern(/${param.pattern}/)`);
    return validators;
}
function getFormSubmitFunction(simpleName, paramGroups, methodName, method) {
    let res = "";
    let type = method.responseDef.type;
    let paramName = methodName === "patch" && method.paramGroups.body
        ? method.paramGroups.body[0].name
        : null;
    const isPatch = method.methodName === "patch" && method.paramGroups.body !== undefined;
    if (method.responseDef.format && method.responseDef.format === "binary") {
        type = "Blob";
    }
    if (methodName === "get") {
        res += (0, utils_1.indent)(`submit(value: typeof this.form.value | false = false, cache = true, only_cache = false): Observable<${type}> {\n`);
    }
    else {
        res += (0, utils_1.indent)(`submit(value: typeof this.form.value | false = false): Observable<${type}> {\n`);
    }
    res += (0, utils_1.indent)(`const result = val => this.service.${simpleName}(${getSubmitFnParameters("val", paramGroups)});\n`, 2);
    if (methodName === "get") {
        res += (0, utils_1.indent)(`return this._submit('${type}', result, value, cache, only_cache );\n`, 2);
    }
    else {
        res += (0, utils_1.indent)(`return this._submit('${type}', result, '${paramName}', value, ${isPatch} );\n`, 2);
    }
    res += (0, utils_1.indent)("}\n");
    res += (0, utils_1.indent)("\n\n");
    res += (0, utils_1.indent)(`listen(value: typeof this.form.value | false = false, submit: boolean = true): Observable<${type}> {\n`);
    res += (0, utils_1.indent)("if (submit) {\n", 2);
    res += (0, utils_1.indent)("this.submit(value);\n", 3);
    res += (0, utils_1.indent)("}\n", 2);
    if (methodName === "get") {
        res += (0, utils_1.indent)(`return this._listen('${type}', value, submit);\n`, 2);
    }
    else {
        res += (0, utils_1.indent)(`return this._listen(value, submit);\n`, 2);
    }
    res += (0, utils_1.indent)("}\n");
    return res;
}
function getFormResetFunction(formName, formArrayReset, formArrayPatch, methodName) {
    let res = "";
    res += (0, utils_1.indent)("reset(value?: typeof this.form.value): void {\n");
    res += (0, utils_1.indent)(`this.form.reset();\n`, 2);
    for (const i in formArrayReset) {
        res += (0, utils_1.indent)(formArrayReset[i]);
    }
    res += (0, utils_1.indent)(`super.reset(value, ${methodName === "patch"}); \n`, 2);
    res += (0, utils_1.indent)("}\n\n");
    res += (0, utils_1.indent)("patch(value: typeof this.form.value): void {\n");
    for (const i in formArrayPatch) {
        res += (0, utils_1.indent)(formArrayPatch[i]);
    }
    res += (0, utils_1.indent)(`this.${formName}.patchValue(value);\n`, 2);
    res += (0, utils_1.indent)("}\n");
    return res;
}
function getSubmitFnParameters(name, paramGroups) {
    if (paramGroups.length)
        return name;
    return "";
}
//# sourceMappingURL=generate-form-service.js.map