"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
    utils_1.out(`Generating ${componentHTMLFileName}`, utils_1.TermColors.default);
    const constructor = getConstructor(name, formName, className, definitions, params, formArrayReset, formArrayPatch, readOnly);
    const variables = getVariables(method);
    // Imports
    content += getImports(name, constructor, methodName);
    // Class declaration
    content += `@Injectable()\n`;
    if (methodName === "get") {
        content += `export class ${className}FormService extends YASAGGetFormService<${method.responseDef.type}> {\n`;
    }
    else {
        content += `export class ${className}FormService extends YASAGPostFormService<${method.responseDef.type}> {\n`;
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
    utils_1.writeFile(componentHTMLFileName, content, config.header);
}
exports.generateFormService = generateFormService;
function getImports(name, constructor, methodName) {
    const imports = [];
    if (constructor.match(/new FormArray\(/))
        imports.push("FormArray");
    if (constructor.match(/new FormControl\(/))
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
            content += utils_1.indent(`static ${_.camelCase(k)} = ${JSON.stringify(method.method.method[k])};\n`);
        }
    });
    return content;
}
function getConstructor(name, formName, className, definitions, params, formArrayReset, formArrayPatch, readOnly) {
    const definitionsMap = _.groupBy(definitions, "name");
    const parentTypes = [];
    const formArrayMethods = [];
    const formDefinition = walkParamOrProp(params, undefined, definitionsMap, parentTypes, `this.${formName}`, formArrayMethods, "value", "value", formArrayReset, formArrayPatch, readOnly);
    let res = utils_1.indent("constructor(\n");
    res += utils_1.indent(`apiConfigService: APIConfigService,\n`, 2);
    res += utils_1.indent(`ngZone: NgZone,\n`, 2);
    res += utils_1.indent(`private service: ${name}Service,\n`, 2);
    res += utils_1.indent(") {\n");
    res += utils_1.indent(`super('${className}', apiConfigService, ngZone);\n`, 2);
    res += utils_1.indent(`this.${formName} = new FormGroup({\n${formDefinition}\n});\n`, 2);
    res += utils_1.indent(`this.init()\n`, 2);
    res += utils_1.indent("}\n");
    res += "\n";
    for (const method in formArrayMethods) {
        res += formArrayMethods[method];
        res += "\n";
    }
    return res;
}
function walkParamOrProp(definition, path = [], definitions, parentTypes, control, formArrayMethods, formValue, formValueIF, formArrayReset, formArrayPatch, readOnly, formArrayParams = "", subArrayReset = [], subArrayPatch = [], parent = "", parents = "", nameParents = "") {
    const res = [];
    let schema;
    let required;
    // create unified inputs for
    // 1. parameters
    if (Array.isArray(definition)) {
        schema = {};
        required = [];
        definition.forEach((param) => {
            if (param.required)
                required.push(param.name);
            schema[param.name] = process_params_1.parameterToSchema(param);
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
        let newParentTypes = [];
        if (ref)
            newParentTypes = [...parentTypes, ref];
        if (readOnly && name.endsWith(readOnly)) {
            param.readOnly = true;
        }
        if (!param.readOnly || name === "id") {
            const fieldDefinition = makeField(param, ref, name, newPath, isRequired, definitions, newParentTypes, `${control}['controls']['${name}']`, formArrayMethods, formValue + `['${name}']`, `${formValueIF} && ${formValue}['${name}']`, formArrayReset, formArrayPatch, formArrayParams, subArrayReset, subArrayPatch, parent, parents, nameParents, readOnly);
            res.push(fieldDefinition);
        }
    });
    return utils_1.indent(res);
}
function makeField(param, ref, name, path, required, definitions, parentTypes, formControl, formArrayMethods, formValue, formValueIF, formArrayReset, formArrayPatch, formArrayParams, subArrayReset, subArrayPatch, parent, parents, nameParents = "", readOnly) {
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
                definition = definitions[common_1.normalizeDef(refType)][0];
                const mySubArrayReset = [];
                const mySubArrayPatch = [];
                const fields = walkParamOrProp(definition, path, definitions, parentTypes, formControl + `['controls'][${name}]`, formArrayMethods, formValue + `[${name}]`, formValueIF, formArrayReset, formArrayPatch, readOnly, formArrayParams + name + ": number" + ", ", mySubArrayReset, mySubArrayPatch, name, parents + name + ", ", nameParents + _.upperFirst(_.camelCase(name.replace("_", "-"))));
                control = "FormArray";
                initializer = `[]`;
                let addMethod = "";
                addMethod += utils_1.indent(`public add${nameParents}${_.upperFirst(_.camelCase(name.replace("_", "-")))}(${formArrayParams} ${name}: number = 1, position?: number, value?: any): void {\n`);
                addMethod += utils_1.indent(`const control = <FormArray>${formControl};\n`, 2);
                addMethod += utils_1.indent(`const fg = new FormGroup({\n${fields}\n}, []);\n`, 2);
                addMethod += utils_1.indent(`__utils.addField(control,${name}, fg, position, value);\n`, 2);
                addMethod += utils_1.indent(`}\n`);
                formArrayMethods.push(addMethod);
                let removeMethod = "";
                removeMethod += utils_1.indent(`public remove${nameParents}${_.upperFirst(_.camelCase(name.replace("_", "-")))}(${formArrayParams} i: number): void {\n`);
                removeMethod += utils_1.indent(`const control = <FormArray>${formControl};\n`, 2);
                removeMethod += utils_1.indent(`control.removeAt(i);\n`, 2);
                removeMethod += utils_1.indent(`}\n`);
                formArrayMethods.push(removeMethod);
                if (formArrayParams === "") {
                    let resetMethod = "";
                    resetMethod += utils_1.indent(`while ((<FormArray>${formControl}).length) {\n`);
                    resetMethod += utils_1.indent(`this.remove${nameParents}${_.upperFirst(_.camelCase(name.replace("_", "-")))}(0);\n`, 2);
                    resetMethod += utils_1.indent(`}\n`);
                    resetMethod += utils_1.indent(`if (${formValueIF}) {\n`);
                    resetMethod += utils_1.indent(`this.add${nameParents}${_.upperFirst(_.camelCase(name.replace("_", "-")))}(${formValue}.length);\n`, 2);
                    mySubArrayReset.forEach((subarray) => {
                        resetMethod += utils_1.indent(`${formValue}.forEach(${subarray});\n`, 2);
                    });
                    resetMethod += utils_1.indent(`}\n`);
                    formArrayReset.push(resetMethod);
                    let patchMethod = "";
                    patchMethod += utils_1.indent(`if (${formValueIF}) {\n`);
                    patchMethod += utils_1.indent(`while (this.form.${formValue}.length > 0) {\n`, 2);
                    patchMethod += utils_1.indent(`this.remove${nameParents}${_.upperFirst(_.camelCase(name.replace("_", "-")))}(0);\n`, 3);
                    patchMethod += utils_1.indent(`}\n`, 2);
                    patchMethod += utils_1.indent(`if (${formValue}.length > this.form.${formValue}.length) {\n`, 2);
                    patchMethod += utils_1.indent(`this.add${nameParents}${_.upperFirst(_.camelCase(name.replace("_", "-")))}(${formValue}.length - this.form.${formValue}.length);\n`, 3);
                    patchMethod += utils_1.indent(`}\n`, 2);
                    mySubArrayPatch.forEach((subarray) => {
                        patchMethod += utils_1.indent(`${formValue}.forEach(${subarray});\n`, 2);
                    });
                    patchMethod += utils_1.indent(`}\n`);
                    formArrayPatch.push(patchMethod);
                }
                else {
                    let resetMethod = "";
                    resetMethod += `(${parent}_object, ${parent}) => {\n`;
                    resetMethod += utils_1.indent(`if (${formValueIF}) {\n`);
                    resetMethod += utils_1.indent(`this.add${nameParents}${_.upperFirst(_.camelCase(name.replace("_", "-")))}(${parents}${formValue}.length);\n`, 2);
                    mySubArrayReset.forEach((subarray) => {
                        resetMethod += utils_1.indent(`${formValue}.forEach(${subarray});\n`, 2);
                    });
                    resetMethod += utils_1.indent(`}\n`);
                    resetMethod += `}`;
                    subArrayReset.push(resetMethod);
                    let patchMethod = "";
                    patchMethod += `(${parent}_object, ${parent}) => {\n`;
                    patchMethod += utils_1.indent(`if (${formValueIF}) {\n`);
                    patchMethod += utils_1.indent(`if (${formValue}.length > this.form.${formValue}.length) {\n`, 2);
                    patchMethod += utils_1.indent(`this.add${nameParents}${_.upperFirst(_.camelCase(name.replace("_", "-")))}(${parents}${formValue}.length - this.form.${formValue}.length);\n`, 3);
                    patchMethod += utils_1.indent(`}\n`, 2);
                    mySubArrayPatch.forEach((subarray) => {
                        patchMethod += utils_1.indent(`${formValue}.forEach(${subarray});\n`, 2);
                    });
                    patchMethod += utils_1.indent(`}\n`);
                    patchMethod += `}`;
                    subArrayPatch.push(patchMethod);
                }
            }
        }
        else {
            control = "FormControl";
            initializer =
                typeof param.default === "string"
                    ? `'${param.default}'`
                    : param.default;
            initializer = `{value: ${initializer}, disabled: false}`;
        }
    }
    else {
        const refType = ref.replace(/^#\/definitions\//, "");
        definition = definitions[common_1.normalizeDef(refType)][0];
        control = "FormGroup";
        const fields = walkParamOrProp(definition, path, definitions, parentTypes, formControl, formArrayMethods, formValue, formValueIF, formArrayReset, formArrayPatch, readOnly, formArrayParams, subArrayReset, subArrayPatch, parent, parents, nameParents + _.upperFirst(_.camelCase(name.replace("_", "-"))));
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
        res += utils_1.indent(`submit(value: any = false, cache = true, only_cache = false): Observable<${type}> {\n`);
    }
    else {
        res += utils_1.indent(`submit(value: any = false): Observable<${type}> {\n`);
    }
    res += utils_1.indent(`const result = this.service.${simpleName}(${getSubmitFnParameters("value || this.form.value, this.multipart", paramGroups)});\n`, 2);
    if (methodName === "get") {
        res += utils_1.indent(`return this._submit('${type}', result, value, cache, only_cache );\n`, 2);
    }
    else {
        res += utils_1.indent(`return this._submit('${type}', result, '${paramName}', value, ${isPatch} );\n`, 2);
    }
    res += utils_1.indent("}\n");
    res += utils_1.indent("\n");
    res += utils_1.indent(`listen(value: any = false, submit: boolean = true): Observable<${type}> {\n`);
    res += utils_1.indent("if (submit) {\n", 2);
    res += utils_1.indent("this.submit(value);\n", 3);
    res += utils_1.indent("}\n", 2);
    if (methodName === "get") {
        res += utils_1.indent(`return this._listen('${type}', value, submit);\n`, 2);
    }
    else {
        res += utils_1.indent(`return this._listen(value, submit);\n`, 2);
    }
    res += utils_1.indent("}\n");
    res += utils_1.indent("\n");
    return res;
}
function getFormResetFunction(formName, formArrayReset, formArrayPatch, methodName) {
    let res = "";
    res += utils_1.indent("reset(value?: any): void {\n");
    res += utils_1.indent(`this.form.reset();`, 2);
    for (const i in formArrayReset) {
        res += utils_1.indent(formArrayReset[i]);
    }
    res += utils_1.indent(`super.reset(value, ${methodName === "patch"}); \n`, 2);
    res += utils_1.indent("}\n\n");
    res += utils_1.indent("patch(value: any): void {\n");
    for (const i in formArrayPatch) {
        res += utils_1.indent(formArrayPatch[i]);
    }
    res += utils_1.indent(`this.${formName}.patchValue(value);\n`, 2);
    res += utils_1.indent("}\n");
    return res;
}
function getSubmitFnParameters(name, paramGroups) {
    if (paramGroups.length)
        return name;
    return "";
}
//# sourceMappingURL=generate-form-service.js.map