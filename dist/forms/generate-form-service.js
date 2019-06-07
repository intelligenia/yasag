"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const nodePath = require("path");
const common_1 = require("../common");
const conf_1 = require("../conf");
const process_params_1 = require("../requests/process-params");
const utils_1 = require("../utils");
function generateFormService(config, name, params, definitions, simpleName, formSubDirName, className, methodName, method) {
    let content = '';
    const formName = 'form';
    const formArrayReset = [];
    const constructor = getConstructor(name, formName, definitions, params, formArrayReset);
    // Imports
    content += getImports(name, constructor);
    // Class declaration
    content += `@Injectable()\n`;
    content += `export class ${className}FormService {\n`;
    // Class variables
    content += getVariables(method, formName);
    // Constructor and add & remove form methods
    content += constructor;
    // Submit function
    content += getFormSubmitFunction(name, formName, simpleName, params, methodName, method);
    content += `\n\n`;
    // Reset function
    content += getFormResetFunction(formName, formArrayReset);
    content += '}\n';
    const componentHTMLFileName = nodePath.join(formSubDirName, `${simpleName}.service.ts`);
    utils_1.writeFile(componentHTMLFileName, content, config.header);
}
exports.generateFormService = generateFormService;
function getImports(name, constructor) {
    const imports = [];
    if (constructor.match(/new FormArray\(/))
        imports.push('FormArray');
    if (constructor.match(/new FormControl\(/))
        imports.push('FormControl');
    if (constructor.match(/new FormGroup\(/))
        imports.push('FormGroup');
    if (constructor.match(/\[Validators\./))
        imports.push('Validators');
    let res = 'import { Injectable } from \'@angular/core\';\n';
    if (imports.length)
        res += `import {${imports.join(', ')}} from '@angular/forms';\n`;
    res += 'import { ReplaySubject, Observable, throwError } from \'rxjs\';\n';
    res += 'import { catchError, finalize, map } from \'rxjs/operators\';\n';
    res += `import { ${name}Service } from '../../../controllers/${name}';\n`;
    res += `import * as __model from '../../../model';\n`;
    res += `import { environment } from 'environments/environment';\n`;
    res += '\n';
    return res;
}
function getVariables(method, formName) {
    let content = '';
    Object.keys(method.method.method).forEach(k => {
        if (k.startsWith('x-')) {
            content += utils_1.indent(`static ${_.camelCase(k)} = ${JSON.stringify(method.method.method[k])};\n`);
        }
    });
    content += utils_1.indent(`${formName}: FormGroup;\n`);
    content += utils_1.indent(`defaultValue: any;\n`);
    content += utils_1.indent(`serverErrors$: Observable<any>;\n`);
    content += utils_1.indent(`private serverErrorsSubject: ReplaySubject<any>;\n`);
    content += utils_1.indent(`loading$: Observable<boolean>;\n`);
    content += utils_1.indent(`private loadingSubject: ReplaySubject<boolean>;\n`);
    content += utils_1.indent(`currentValue: any;\n`);
    content += utils_1.indent(`private cache: any;\n`);
    content += utils_1.indent(`private cacheSub: any;\n`);
    return content;
}
function getConstructor(name, formName, definitions, params, formArrayReset) {
    let res = utils_1.indent('constructor(\n');
    res += utils_1.indent(`private ${_.lowerFirst(name)}Service: ${name}Service,\n`, 2);
    res += utils_1.indent(') {\n');
    const definitionsMap = _.groupBy(definitions, 'name');
    const parentTypes = [];
    const formArrayMethods = [];
    const formDefinition = walkParamOrProp(params, undefined, definitionsMap, parentTypes, `this.${formName}`, formArrayMethods, 'value', 'value', formArrayReset);
    res += utils_1.indent(`this.${formName} = new FormGroup({\n${formDefinition}\n});\n`, 2);
    res += utils_1.indent(`this.defaultValue = this.${formName}.value;\n`, 2);
    res += utils_1.indent(`this.serverErrorsSubject = new ReplaySubject<any>(1);\n`, 2);
    res += utils_1.indent(`this.serverErrors$ = this.serverErrorsSubject.asObservable();\n`, 2);
    res += utils_1.indent(`this.loadingSubject = new ReplaySubject<boolean>(1);\n`, 2);
    res += utils_1.indent(`this.loading$ = this.loadingSubject.asObservable();\n`, 2);
    res += utils_1.indent(`this.cache = {};\n`, 2);
    res += utils_1.indent(`this.cacheSub = {};\n`, 2);
    res += utils_1.indent('}\n');
    res += '\n';
    for (let method in formArrayMethods) {
        res += formArrayMethods[method];
        res += '\n';
    }
    return res;
}
function walkParamOrProp(definition, path = [], definitions, parentTypes, control, formArrayMethods, formValue, formValueIF, formArrayReset, formArrayParams = '', subArrayReset = [], parent = '', parents = '', nameParents = '') {
    const res = [];
    let schema;
    let required;
    // create unified inputs for
    // 1. parameters
    if (Array.isArray(definition)) {
        schema = {};
        required = [];
        definition.forEach(param => {
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
        if (!param.readOnly || name == 'id') {
            const fieldDefinition = makeField(param, ref, name, newPath, isRequired, definitions, newParentTypes, `${control}['controls']['${name}']`, formArrayMethods, formValue + `['${name}']`, `${formValueIF} && ${formValue}['${name}']`, formArrayReset, formArrayParams, subArrayReset, parent, parents, nameParents);
            res.push(fieldDefinition);
        }
    });
    return utils_1.indent(res);
}
function makeField(param, ref, name, path, required, definitions, parentTypes, formControl, formArrayMethods, formValue, formValueIF, formArrayReset, formArrayParams, subArrayReset, parent, parents, nameParents = '') {
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
        if (type === 'array') {
            if (param.items.type) {
                control = 'FormControl';
                initializer = '[]';
            }
            else {
                const refType = param.items.$ref.replace(/^#\/definitions\//, '');
                definition = definitions[common_1.normalizeDef(refType)][0];
                const mySubArrayReset = [];
                const fields = walkParamOrProp(definition, path, definitions, parentTypes, formControl + `['controls'][${name}]`, formArrayMethods, formValue + `[${name}]`, formValueIF, formArrayReset, formArrayParams + name + ': number' + ', ', mySubArrayReset, name, parents + name + ', ', nameParents + _.upperFirst(name));
                control = 'FormArray';
                initializer = `[]`;
                let addMethod = '';
                addMethod += utils_1.indent(`public add${nameParents}${_.upperFirst(name)}(${formArrayParams} ${name}: number = 1, position?: number): void {\n`);
                addMethod += utils_1.indent(`const control = <FormArray>${formControl};\n`, 2);
                addMethod += utils_1.indent(`for (let i = 0; i < ${name}; i++) {\n`, 2);
                addMethod += utils_1.indent(`const fg = new FormGroup({\n${fields}\n}, []);\n`, 3);
                addMethod += utils_1.indent(`if (position){\n`, 3);
                addMethod += utils_1.indent(`control.insert(position, fg);\n`, 4);
                addMethod += utils_1.indent(`} else {\n`, 3);
                addMethod += utils_1.indent(`control.push(fg);\n`, 4);
                addMethod += utils_1.indent(`}\n`, 3);
                addMethod += utils_1.indent(`}\n`, 2);
                addMethod += utils_1.indent(`}\n`);
                formArrayMethods.push(addMethod);
                let removeMethod = '';
                removeMethod += utils_1.indent(`public remove${nameParents}${_.upperFirst(name)}(${formArrayParams} i: number): void {\n`);
                removeMethod += utils_1.indent(`const control = <FormArray>${formControl};\n`, 2);
                removeMethod += utils_1.indent(`control.removeAt(i);\n`, 2);
                removeMethod += utils_1.indent(`}\n`);
                formArrayMethods.push(removeMethod);
                if (formArrayParams == '') {
                    let resetMethod = '';
                    resetMethod += utils_1.indent(`while ((<FormArray>${formControl}).length) {\n`);
                    resetMethod += utils_1.indent(`this.remove${_.upperFirst(name)}(0);\n`, 2);
                    resetMethod += utils_1.indent(`}\n`);
                    resetMethod += utils_1.indent(`if (${formValueIF}) {\n`);
                    resetMethod += utils_1.indent(`this.add${_.upperFirst(name)}(${formValue}.length);\n`, 2);
                    mySubArrayReset.forEach(subarray => {
                        resetMethod += utils_1.indent(`${formValue}.forEach(${subarray});\n`, 2);
                    });
                    resetMethod += utils_1.indent(`}\n`);
                    formArrayReset.push(resetMethod);
                }
                else {
                    let resetMethod = '';
                    resetMethod += `(${parent}_object, ${parent}) => {\n`;
                    resetMethod += utils_1.indent(`if (${formValueIF}) {\n`);
                    resetMethod += utils_1.indent(`this.add${_.upperFirst(name)}(${parents}${formValue}.length);\n`, 2);
                    mySubArrayReset.forEach(subarray => {
                        resetMethod += utils_1.indent(`${formValue}.forEach(${subarray});\n`, 2);
                    });
                    resetMethod += utils_1.indent(`}\n`);
                    resetMethod += `}`;
                    subArrayReset.push(resetMethod);
                }
            }
        }
        else {
            control = 'FormControl';
            initializer = typeof param.default === 'string' ? `'${param.default}'` : param.default;
            initializer = `{value: ${initializer}, disabled: false}`;
        }
    }
    else {
        const refType = ref.replace(/^#\/definitions\//, '');
        definition = definitions[common_1.normalizeDef(refType)][0];
        control = 'FormGroup';
        const fields = walkParamOrProp(definition, path, definitions, parentTypes, formControl, formArrayMethods, formValue, formValueIF, formArrayReset, formArrayParams, subArrayReset, parent, parents, nameParents + _.upperFirst(name));
        initializer = `{\n${fields}\n}`;
    }
    const validators = getValidators(param);
    if (required)
        validators.push('Validators.required');
    return `${name}: new ${control}(${initializer}, [${validators.join(', ')}]),`;
}
function getValidators(param) {
    const validators = [];
    if (param.format && param.format === 'email')
        validators.push('Validators.email');
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
function getFormSubmitFunction(name, formName, simpleName, paramGroups, methodName, method) {
    let res = "";
    if (methodName == 'get') {
        res += utils_1.indent(`submit(value: any = false, cache: boolean = true, only_cache: boolean = false): Observable<${method.responseDef.type}> {\n`);
    }
    else {
        res += utils_1.indent(`submit(value: any = false): Observable<${method.responseDef.type}> {\n`);
        res += utils_1.indent(`const cache = false;\n`, 2);
        res += utils_1.indent(`const only_cache = false;\n`, 2);
    }
    res += utils_1.indent(`if (value === false) {\n`, 2);
    res += utils_1.indent(`  value = this.${formName}.value;\n`, 2);
    res += utils_1.indent(`}\n`, 2);
    res += utils_1.indent(`if ( this.cacheSub[JSON.stringify(value)] ) {\n`, 2);
    res += utils_1.indent(`    return this.cacheSub[JSON.stringify(value)].asObservable();\n`, 2);
    res += utils_1.indent(`}\n`, 2);
    res += utils_1.indent(`this.cacheSub[JSON.stringify(value)] = new ReplaySubject<${method.responseDef.type}>(1);\n`, 2);
    res += utils_1.indent(`const subject = this.cacheSub[JSON.stringify(value)];\n`, 2);
    res += utils_1.indent(`let cache_hit = false;\n`, 2);
    if (method.responseDef.type != 'void') {
        res += utils_1.indent(`if (cache && this.cache[JSON.stringify(value)]) {\n`, 2);
        if (method.responseDef.type.indexOf('[]') > 0) {
            res += utils_1.indent(`  subject.next([...this.cache[JSON.stringify(value)]]);\n`, 2);
        }
        else {
            res += utils_1.indent(`  subject.next({...this.cache[JSON.stringify(value)]});\n`, 2);
        }
        res += utils_1.indent(`  cache_hit = true;\n`, 2);
        res += utils_1.indent(`  if (only_cache) {\n`, 2);
        res += utils_1.indent(`    subject.complete();\n`, 2);
        res += utils_1.indent(`    this.loadingSubject.next(false);\n`, 2);
        res += utils_1.indent(`    delete this.cacheSub[JSON.stringify(value)];\n`, 2);
        res += utils_1.indent(`    return subject.asObservable();\n`, 2);
        res += utils_1.indent(`  }\n`, 2);
        res += utils_1.indent(`}\n`, 2);
    }
    res += utils_1.indent(`this.loadingSubject.next(true);\n`, 2);
    res += utils_1.indent(`this.serverErrorsSubject.next(null);\n`, 2);
    res += utils_1.indent(`this.currentValue = value;\n`, 2);
    res += utils_1.indent(`this.try(subject, value, cache_hit, cache);\n`, 2);
    res += utils_1.indent(`return subject.asObservable();\n`, 2);
    res += utils_1.indent('}\n');
    res += utils_1.indent('\n');
    res += utils_1.indent(`try(subject: ReplaySubject<${method.responseDef.type}>, value: any, cache_hit: boolean, cache: boolean, waitOnRetry = 1000, maxRetries = environment.apiRetries): void {\n`);
    if (methodName == 'get') {
        res += utils_1.indent(`if (JSON.stringify(value) !== JSON.stringify(this.currentValue)) {\n`, 2);
        res += utils_1.indent(`  subject.complete();\n`, 2);
        res += utils_1.indent(`  delete this.cacheSub[JSON.stringify(value)];\n`, 2);
        res += utils_1.indent(`  return;\n`, 2);
        res += utils_1.indent(`}\n`, 2);
    }
    res += utils_1.indent(`const result = this.${_.lowerFirst(name)}Service.${simpleName}(${getSubmitFnParameters('value', paramGroups)});\n`, 2);
    res += utils_1.indent(`result.pipe(\n`, 2);
    if (method.responseDef.type == 'void') {
        res += utils_1.indent(`  map(() => {\n`, 2);
    }
    else {
        res += utils_1.indent(`  map(val => {\n`, 2);
    }
    if (method.responseDef.type == 'void') {
        res += utils_1.indent(`    subject.next();\n`, 2);
    }
    else {
        res += utils_1.indent(`    if (!cache_hit || JSON.stringify(this.cache[JSON.stringify(value)]) !== JSON.stringify(val)) {\n`, 2);
        res += utils_1.indent(`      if (cache) {\n`, 2);
        res += utils_1.indent(`        this.cache[JSON.stringify(value)] = val;\n`, 2);
        res += utils_1.indent(`      }\n`, 2);
        if (method.responseDef.type.indexOf('[]') > 0) {
            res += utils_1.indent(`      subject.next([...val]);\n`, 2);
        }
        else if (method.responseDef.type === 'string') {
            res += utils_1.indent(`      subject.next(val);\n`, 2);
        }
        else {
            res += utils_1.indent(`      subject.next({...val});\n`, 2);
        }
        res += utils_1.indent(`    }\n`, 2);
    }
    res += utils_1.indent(`    subject.complete();\n`, 2);
    res += utils_1.indent(`    delete this.cacheSub[JSON.stringify(value)];\n`, 2);
    res += utils_1.indent(`    this.loadingSubject.next(false);\n`, 2);
    if (method.responseDef.type !== 'void') {
        res += utils_1.indent(`    return val;\n`, 2);
    }
    res += utils_1.indent(`  }),\n`, 2);
    res += utils_1.indent(`  catchError(error => {\n`, 2);
    res += utils_1.indent(`    if (error.status >= 500 && maxRetries > 0) {\n`, 2);
    res += utils_1.indent(`        // A client-side or network error occurred. Handle it accordingly.\n`, 2);
    res += utils_1.indent(`        setTimeout(() => this.try(subject, value, cache_hit, cache, waitOnRetry + 1000, maxRetries - 1), waitOnRetry);\n`, 2);
    res += utils_1.indent(`    } else {\n`, 2);
    res += utils_1.indent(`        // The backend returned an unsuccessful response code.\n`, 2);
    res += utils_1.indent(`        // The response body may contain clues as to what went wrong,\n`, 2);
    res += utils_1.indent(`        this.serverErrorsSubject.next(error.error);\n`, 2);
    res += utils_1.indent(`        subject.error(error);\n`, 2);
    res += utils_1.indent(`        subject.complete();\n`, 2);
    res += utils_1.indent(`        delete this.cacheSub[JSON.stringify(value)];\n`, 2);
    res += utils_1.indent(`        this.loadingSubject.next(false);\n`, 2);
    res += utils_1.indent(`    }\n`, 2);
    res += utils_1.indent(`    return throwError(error);\n`, 2);
    res += utils_1.indent(`  })\n`, 2);
    res += utils_1.indent(`).subscribe();\n`, 2);
    res += utils_1.indent('}\n');
    res += utils_1.indent('\n\n');
    res += utils_1.indent(`cancelPreviousRequest(): void {\n`);
    res += utils_1.indent('  Object.keys(this.cacheSub).forEach(key => this.cacheSub[key].unsubscribe());\n');
    res += utils_1.indent('  this.cacheSub = {};\n');
    res += utils_1.indent('}\n');
    res += utils_1.indent('\n');
    return res;
}
function getFormResetFunction(formName, formArrayReset) {
    let res = utils_1.indent('reset(value?: any): void {\n');
    res += utils_1.indent(`this.${formName}.reset();\n`, 2);
    for (let i in formArrayReset) {
        res += utils_1.indent(formArrayReset[i]);
    }
    res += utils_1.indent(`this.serverErrorsSubject.next(null);\n`, 2);
    res += utils_1.indent(`this.loadingSubject.next(false);\n`, 2);
    res += utils_1.indent(`this.${formName}.patchValue(this.defaultValue);\n`, 2);
    res += utils_1.indent(`if (value) {\n`, 2);
    res += utils_1.indent(`this.${formName}.patchValue(value);\n`, 3);
    res += utils_1.indent('}\n', 2);
    res += utils_1.indent('}\n');
    return res;
}
function getSubmitFnParameters(name, paramGroups) {
    if (paramGroups.length)
        return name;
    return '';
}
//# sourceMappingURL=generate-form-service.js.map