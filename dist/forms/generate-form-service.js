"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getValidators = exports.generateFormService = void 0;
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
    content += getImports(name, constructor, methodName, config);
    // Class declaration
    if (config.standalone) {
        content += `@Injectable({ providedIn: 'root' })\n`;
    }
    else {
        content += `@Injectable()\n`;
    }
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
function getImports(name, constructor, methodName, config) {
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
    if (config.standalone) {
        let res = "import { Injectable, inject, NgZone } from '@angular/core';\n";
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
    const ctx = {
        definitions: definitionsMap,
        parentTypes,
        control: `this.${formName}`,
        formArrayMethods,
        formValue: "value",
        formValueIF: "value",
        formArrayReset,
        formArrayPatch,
        readOnly,
        config,
        formArrayParams: "",
        subArrayReset: [],
        subArrayPatch: [],
        parent: "",
        parents: "",
        nameParents: "",
    };
    const formDefinition = walkParamOrProp(params, undefined, ctx);
    let res = (0, utils_1.indent)(`${formName} = new FormGroup({\n${formDefinition}\n});\n`, 1);
    if (config.standalone) {
        res += (0, utils_1.indent)("constructor(\n");
        res += (0, utils_1.indent)(`private service: ${name}Service,\n`, 2);
        res += (0, utils_1.indent)(") {\n");
        res += (0, utils_1.indent)(`const apiConfigService = inject(APIConfigService);\n`, 2);
        res += (0, utils_1.indent)(`const ngZone = inject(NgZone, { optional: true });\n`, 2);
        res += (0, utils_1.indent)(`super('${className}', apiConfigService, ngZone);\n`, 2);
        res += (0, utils_1.indent)(`this.init();\n`, 2);
        res += (0, utils_1.indent)("}\n");
    }
    else {
        res += (0, utils_1.indent)("constructor(\n");
        res += (0, utils_1.indent)(`apiConfigService: APIConfigService,\n`, 2);
        res += (0, utils_1.indent)(`ngZone: NgZone,\n`, 2);
        res += (0, utils_1.indent)(`private service: ${name}Service,\n`, 2);
        res += (0, utils_1.indent)(") {\n");
        res += (0, utils_1.indent)(`super('${className}', apiConfigService, ngZone);\n`, 2);
        res += (0, utils_1.indent)(`this.init();\n`, 2);
        res += (0, utils_1.indent)("}\n");
    }
    res += "\n";
    for (const method of formArrayMethods) {
        res += method;
        res += "\n";
    }
    return res;
}
function walkParamOrProp(definition, path = [], ctx) {
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
        if (ctx.parentTypes.indexOf(ref) >= 0)
            return;
        const name = paramName;
        const newPath = [...path, name];
        const isRequired = required && required.includes(name);
        const isNullable = nullable && nullable.includes(name);
        let newParentTypes = [];
        if (ref)
            newParentTypes = [...ctx.parentTypes, ref];
        if (ctx.readOnly && name.endsWith(ctx.readOnly)) {
            param.readOnly = true;
        }
        if (!param.readOnly || name === "id") {
            const childCtx = Object.assign(Object.assign({}, ctx), { parentTypes: ref ? newParentTypes : ctx.parentTypes, formValueIF: `${ctx.formValueIF} && ${ctx.formValue}['${name}']` });
            const fieldDefinition = makeField(param, ref, name, newPath, isRequired, isNullable, childCtx);
            res.push(fieldDefinition);
        }
    });
    return (0, utils_1.indent)(res);
}
function makeField(param, ref, name, path, required, nullable, ctx) {
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
            if (param.items && param.items.type && param.items.type !== 'object' && !param.items.properties) {
                // CASO A: array of primitives (string[], number[])
                control = "FormControl";
                initializer = "[]";
            }
            else {
                // Determine definition for FormArray: $ref (CASO B) or inline (CASO C)
                if (param.items && param.items.$ref) {
                    // CASO B: array of $ref objects
                    const refType = param.items.$ref.replace(/^#\/(definitions|components\/schemas)\//, "");
                    const defLookup = ctx.definitions[(0, common_1.normalizeDef)(refType)];
                    if (!defLookup || !defLookup.length) {
                        (0, utils_1.out)(`Warning: definition '${refType}' not found for array items.$ref, treating as primitive array`, utils_1.TermColors.red);
                        control = "FormControl";
                        initializer = "[]";
                    }
                    else {
                        definition = defLookup[0];
                    }
                }
                else if (param.items && (param.items.properties || param.items.type === 'object')) {
                    // CASO C: array of inline objects (items.properties without $ref)
                    definition = {
                        name,
                        def: {
                            properties: param.items.properties || {},
                            required: param.items.required,
                        }
                    };
                }
                if (definition) {
                    const mySubArrayReset = [];
                    const mySubArrayPatch = [];
                    const childCtx = Object.assign(Object.assign({}, ctx), { control: ctx.control + `['controls']['${name}']` + `['controls'][${name}]`, formValue: ctx.formValue + `['${name}']` + `[${name}]`, formArrayParams: ctx.formArrayParams + name + ": number" + ", ", subArrayReset: mySubArrayReset, subArrayPatch: mySubArrayPatch, parent: name, parents: ctx.parents + name + ", ", nameParents: ctx.nameParents + _.upperFirst(_.camelCase(name.replace("_", "-"))) });
                    const fields = walkParamOrProp(definition, path, childCtx);
                    control = "FormArray";
                    if (ctx.config.typedForms) {
                        control = "UntypedFormArray";
                    }
                    initializer = `[]`;
                    const camelName = _.upperFirst(_.camelCase(name.replace("_", "-")));
                    const fullName = ctx.nameParents + camelName;
                    let addMethod = "";
                    addMethod += (0, utils_1.indent)(`public add${fullName}(${ctx.formArrayParams} ${name}: number = 1, position?: number, value?: any): void {\n`);
                    addMethod += (0, utils_1.indent)(`const control = <${control}>${ctx.control}['controls']['${name}'];\n`, 2);
                    addMethod += (0, utils_1.indent)(`const fg = new FormGroup({\n${fields}\n}, []);\n`, 2);
                    addMethod += (0, utils_1.indent)(`__utils.addField(control,${name}, fg, position, value);\n`, 2);
                    addMethod += (0, utils_1.indent)(`}\n`);
                    ctx.formArrayMethods.push(addMethod);
                    let removeMethod = "";
                    removeMethod += (0, utils_1.indent)(`public remove${fullName}(${ctx.formArrayParams} i: number): void {\n`);
                    removeMethod += (0, utils_1.indent)(`const control = <${control}>${ctx.control}['controls']['${name}'];\n`, 2);
                    removeMethod += (0, utils_1.indent)(`control.removeAt(i);\n`, 2);
                    removeMethod += (0, utils_1.indent)(`}\n`);
                    ctx.formArrayMethods.push(removeMethod);
                    if (ctx.formArrayParams === "") {
                        let resetMethod = "";
                        resetMethod += (0, utils_1.indent)(`while ((<${control}>${ctx.control}['controls']['${name}']).length) {\n`);
                        resetMethod += (0, utils_1.indent)(`this.remove${fullName}(0);\n`, 2);
                        resetMethod += (0, utils_1.indent)(`}\n`);
                        resetMethod += (0, utils_1.indent)(`if (${ctx.formValueIF}) {\n`);
                        resetMethod += (0, utils_1.indent)(`this.add${fullName}(${ctx.formValue}['${name}'].length);\n`, 2);
                        for (const subarray of mySubArrayReset) {
                            resetMethod += (0, utils_1.indent)(`${ctx.formValue}['${name}'].forEach(${subarray});\n`, 2);
                        }
                        resetMethod += (0, utils_1.indent)(`}\n`);
                        ctx.formArrayReset.push(resetMethod);
                        let patchMethod = "";
                        patchMethod += (0, utils_1.indent)(`if (${ctx.formValueIF}) {\n`);
                        patchMethod += (0, utils_1.indent)(`while (this.form.${ctx.formValue}['${name}'].length > 0) {\n`, 2);
                        patchMethod += (0, utils_1.indent)(`this.remove${fullName}(0);\n`, 3);
                        patchMethod += (0, utils_1.indent)(`}\n`, 2);
                        patchMethod += (0, utils_1.indent)(`if (${ctx.formValue}['${name}'].length > this.form.${ctx.formValue}['${name}'].length) {\n`, 2);
                        patchMethod += (0, utils_1.indent)(`this.add${fullName}(${ctx.formValue}['${name}'].length - this.form.${ctx.formValue}['${name}'].length);\n`, 3);
                        patchMethod += (0, utils_1.indent)(`}\n`, 2);
                        for (const subarray of mySubArrayPatch) {
                            patchMethod += (0, utils_1.indent)(`${ctx.formValue}['${name}'].forEach(${subarray});\n`, 2);
                        }
                        patchMethod += (0, utils_1.indent)(`}\n`);
                        ctx.formArrayPatch.push(patchMethod);
                    }
                    else {
                        let resetMethod = "";
                        resetMethod += `(${ctx.parent}_object, ${ctx.parent}) => {\n`;
                        resetMethod += (0, utils_1.indent)(`if (${ctx.formValueIF}) {\n`);
                        resetMethod += (0, utils_1.indent)(`this.add${fullName}(${ctx.parents}${ctx.formValue}['${name}'].length);\n`, 2);
                        for (const subarray of mySubArrayReset) {
                            resetMethod += (0, utils_1.indent)(`${ctx.formValue}['${name}'].forEach(${subarray});\n`, 2);
                        }
                        resetMethod += (0, utils_1.indent)(`}\n`);
                        resetMethod += `}`;
                        ctx.subArrayReset.push(resetMethod);
                        let patchMethod = "";
                        patchMethod += `(${ctx.parent}_object, ${ctx.parent}) => {\n`;
                        patchMethod += (0, utils_1.indent)(`if (${ctx.formValueIF}) {\n`);
                        patchMethod += (0, utils_1.indent)(`if (${ctx.formValue}['${name}'].length > this.form.${ctx.formValue}['${name}'].length) {\n`, 2);
                        patchMethod += (0, utils_1.indent)(`this.add${fullName}(${ctx.parents}${ctx.formValue}['${name}'].length - this.form.${ctx.formValue}['${name}'].length);\n`, 3);
                        patchMethod += (0, utils_1.indent)(`}\n`, 2);
                        for (const subarray of mySubArrayPatch) {
                            patchMethod += (0, utils_1.indent)(`${ctx.formValue}['${name}'].forEach(${subarray});\n`, 2);
                        }
                        patchMethod += (0, utils_1.indent)(`}\n`);
                        patchMethod += `}`;
                        ctx.subArrayPatch.push(patchMethod);
                    }
                }
                else if (!control) {
                    // Fallback: treat as primitive array
                    control = "FormControl";
                    initializer = "[]";
                }
            }
        }
        else {
            const isNullable = nullable ? " | null" : "";
            control = "FormControl";
            if (ctx.config.typedForms) {
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
        const refType = ref.replace(/^#\/(definitions|components\/schemas)\//, "");
        const defLookup = ctx.definitions[(0, common_1.normalizeDef)(refType)];
        if (!defLookup || !defLookup.length) {
            (0, utils_1.out)(`Warning: definition '${refType}' not found for $ref, generating empty FormGroup`, utils_1.TermColors.red);
            control = "FormGroup";
            initializer = "{}";
        }
        else {
            definition = defLookup[0];
            control = "FormGroup";
            const childCtx = Object.assign(Object.assign({}, ctx), { control: ctx.control + `['controls']['${name}']`, formValue: ctx.formValue + `['${name}']`, nameParents: ctx.nameParents + _.upperFirst(_.camelCase(name.replace("_", "-"))) });
            const fields = walkParamOrProp(definition, path, childCtx);
            initializer = `{\n${fields}\n}`;
        }
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
    if (param.maximum !== undefined)
        validators.push(`Validators.max(${param.maximum})`);
    if (param.minimum !== undefined)
        validators.push(`Validators.min(${param.minimum})`);
    // exclusiveMinimum: OAS 3.0 uses boolean (combine with minimum), OAS 3.1 uses number
    if (param.exclusiveMinimum !== undefined) {
        if (typeof param.exclusiveMinimum === 'number') {
            // OAS 3.1: exclusiveMinimum is the actual boundary value
            // Angular Validators.min is inclusive (>=), so we use the value directly
            // since there's no "exclusiveMin" validator in Angular
            validators.push(`Validators.min(${param.exclusiveMinimum})`);
        }
        else if (param.exclusiveMinimum === true && param.minimum !== undefined) {
            // OAS 3.0: boolean flag means minimum is exclusive
            validators.push(`Validators.min(${param.minimum + 1})`);
        }
    }
    // exclusiveMaximum: OAS 3.0 uses boolean (combine with maximum), OAS 3.1 uses number
    if (param.exclusiveMaximum !== undefined) {
        if (typeof param.exclusiveMaximum === 'number') {
            validators.push(`Validators.max(${param.exclusiveMaximum})`);
        }
        else if (param.exclusiveMaximum === true && param.maximum !== undefined) {
            validators.push(`Validators.max(${param.maximum - 1})`);
        }
    }
    if (param.maxLength !== undefined)
        validators.push(`Validators.maxLength(${param.maxLength})`);
    if (param.minLength !== undefined)
        validators.push(`Validators.minLength(${param.minLength})`);
    if (param.pattern)
        validators.push(`Validators.pattern(/${param.pattern}/)`);
    // multipleOf: generate pattern validator for integer multiples
    if (param.multipleOf !== undefined) {
        validators.push(`__utils.multipleOfValidator(${param.multipleOf})`);
    }
    // minItems/maxItems: for FormArray length validation (applied as minLength/maxLength)
    if (param.minItems !== undefined) {
        validators.push(`Validators.minLength(${param.minItems})`);
    }
    if (param.maxItems !== undefined) {
        validators.push(`Validators.maxLength(${param.maxItems})`);
    }
    return validators;
}
exports.getValidators = getValidators;
function getFormSubmitFunction(simpleName, paramGroups, methodName, method) {
    let res = "";
    let type = method.responseDef.type;
    const paramName = methodName === "patch" && method.paramGroups.body
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
    for (const resetEntry of formArrayReset) {
        res += (0, utils_1.indent)(resetEntry);
    }
    res += (0, utils_1.indent)(`super.reset(value, ${methodName === "patch"}); \n`, 2);
    res += (0, utils_1.indent)("}\n\n");
    res += (0, utils_1.indent)("patch(value: typeof this.form.value): void {\n");
    for (const patchEntry of formArrayPatch) {
        res += (0, utils_1.indent)(patchEntry);
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