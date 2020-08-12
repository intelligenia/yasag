"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const nodePath = require("path");
const common_1 = require("../common");
const conf_1 = require("../conf");
const process_params_1 = require("../requests/process-params");
const utils_1 = require("../utils");
function generateFormService(config, name, params, definitions, simpleName, formSubDirName, className, methodName, method, readOnly) {
    let content = '';
    const formName = 'form';
    const formArrayReset = [];
    const formArrayPatch = [];
    const componentHTMLFileName = nodePath.join(formSubDirName, `${simpleName}.service.ts`);
    utils_1.out(`Generating ${componentHTMLFileName}`, utils_1.TermColors.default);
    const constructor = getConstructor(name, formName, definitions, params, formArrayReset, formArrayPatch, readOnly, className);
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
    content += getFormResetFunction(formName, formArrayReset, formArrayPatch, methodName);
    content += '}\n';
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
    res += 'import { APIConfigService } from \'../../../apiconfig.service\';\n\n';
    res += 'import * as moment from \'moment\';\n\n';
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
    if (method.methodName === 'get') {
        content += utils_1.indent(`currentValue: any;\n`);
    }
    if (method.methodName === 'patch') {
        content += utils_1.indent(`patchInitialValue: any;\n`);
    }
    content += utils_1.indent(`private cacheSub: any;\n`);
    content += utils_1.indent(`private cache: string;\n`);
    return content;
}
function getConstructor(name, formName, definitions, params, formArrayReset, formArrayPatch, readOnly, className) {
    let res = utils_1.indent('constructor(\n');
    res += utils_1.indent(`private ${_.lowerFirst(name)}Service: ${name}Service,\n`, 2);
    res += utils_1.indent(`private apiConfigService: APIConfigService,\n`, 2);
    res += utils_1.indent(') {\n');
    const definitionsMap = _.groupBy(definitions, 'name');
    const parentTypes = [];
    const formArrayMethods = [];
    const formDefinition = walkParamOrProp(params, undefined, definitionsMap, parentTypes, `this.${formName}`, formArrayMethods, 'value', 'value', formArrayReset, formArrayPatch, readOnly);
    res += utils_1.indent(`this.${formName} = new FormGroup({\n${formDefinition}\n});\n`, 2);
    res += utils_1.indent(`this.defaultValue = this.${formName}.value;\n`, 2);
    res += utils_1.indent(`this.serverErrorsSubject = new ReplaySubject<any>(1);\n`, 2);
    res += utils_1.indent(`this.serverErrors$ = this.serverErrorsSubject.asObservable();\n`, 2);
    res += utils_1.indent(`this.loadingSubject = new ReplaySubject<boolean>(1);\n`, 2);
    res += utils_1.indent(`this.loading$ = this.loadingSubject.asObservable();\n`, 2);
    res += utils_1.indent(`this.cacheSub = {};\n`, 2);
    res += utils_1.indent(`this.cache = '${className}';\n`, 2);
    res += utils_1.indent('}\n');
    res += '\n';
    for (const method in formArrayMethods) {
        res += formArrayMethods[method];
        res += '\n';
    }
    return res;
}
function walkParamOrProp(definition, path = [], definitions, parentTypes, control, formArrayMethods, formValue, formValueIF, formArrayReset, formArrayPatch, readOnly, formArrayParams = '', subArrayReset = [], subArrayPatch = [], parent = '', parents = '', nameParents = '') {
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
        if (readOnly && name.endsWith(readOnly)) {
            param.readOnly = true;
        }
        if (!param.readOnly || name === 'id') {
            const fieldDefinition = makeField(param, ref, name, newPath, isRequired, definitions, newParentTypes, `${control}['controls']['${name}']`, formArrayMethods, formValue + `['${name}']`, `${formValueIF} && ${formValue}['${name}']`, formArrayReset, formArrayPatch, formArrayParams, subArrayReset, subArrayPatch, parent, parents, nameParents, readOnly);
            res.push(fieldDefinition);
        }
    });
    return utils_1.indent(res);
}
function makeField(param, ref, name, path, required, definitions, parentTypes, formControl, formArrayMethods, formValue, formValueIF, formArrayReset, formArrayPatch, formArrayParams, subArrayReset, subArrayPatch, parent, parents, nameParents = '', readOnly) {
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
                const mySubArrayPatch = [];
                const fields = walkParamOrProp(definition, path, definitions, parentTypes, formControl + `['controls'][${name}]`, formArrayMethods, formValue + `[${name}]`, formValueIF, formArrayReset, formArrayPatch, readOnly, formArrayParams + name + ': number' + ', ', mySubArrayReset, mySubArrayPatch, name, parents + name + ', ', nameParents + _.upperFirst(_.camelCase(name.replace('_', '-'))));
                control = 'FormArray';
                initializer = `[]`;
                let addMethod = '';
                addMethod += utils_1.indent(`public add${nameParents}${_.upperFirst(_.camelCase(name.replace('_', '-')))}(${formArrayParams} ${name}: number = 1, position?: number): void {\n`);
                addMethod += utils_1.indent(`const control = <FormArray>${formControl};\n`, 2);
                addMethod += utils_1.indent(`for (let i = 0; i < ${name}; i++) {\n`, 2);
                addMethod += utils_1.indent(`const fg = new FormGroup({\n${fields}\n}, []);\n`, 3);
                addMethod += utils_1.indent(`if (position !== undefined){\n`, 3);
                addMethod += utils_1.indent(`control.insert(position, fg);\n`, 4);
                addMethod += utils_1.indent(`} else {\n`, 3);
                addMethod += utils_1.indent(`control.push(fg);\n`, 4);
                addMethod += utils_1.indent(`}\n`, 3);
                addMethod += utils_1.indent(`}\n`, 2);
                addMethod += utils_1.indent(`}\n`);
                formArrayMethods.push(addMethod);
                let removeMethod = '';
                removeMethod += utils_1.indent(`public remove${nameParents}${_.upperFirst(_.camelCase(name.replace('_', '-')))}(${formArrayParams} i: number): void {\n`);
                removeMethod += utils_1.indent(`const control = <FormArray>${formControl};\n`, 2);
                removeMethod += utils_1.indent(`control.removeAt(i);\n`, 2);
                removeMethod += utils_1.indent(`}\n`);
                formArrayMethods.push(removeMethod);
                if (formArrayParams === '') {
                    let resetMethod = '';
                    resetMethod += utils_1.indent(`while ((<FormArray>${formControl}).length) {\n`);
                    resetMethod += utils_1.indent(`this.remove${nameParents}${_.upperFirst(_.camelCase(name.replace('_', '-')))}(0);\n`, 2);
                    resetMethod += utils_1.indent(`}\n`);
                    resetMethod += utils_1.indent(`if (${formValueIF}) {\n`);
                    resetMethod += utils_1.indent(`this.add${nameParents}${_.upperFirst(_.camelCase(name.replace('_', '-')))}(${formValue}.length);\n`, 2);
                    mySubArrayReset.forEach(subarray => {
                        resetMethod += utils_1.indent(`${formValue}.forEach(${subarray});\n`, 2);
                    });
                    resetMethod += utils_1.indent(`}\n`);
                    formArrayReset.push(resetMethod);
                    let patchMethod = '';
                    patchMethod += utils_1.indent(`if (${formValueIF}) {\n`);
                    patchMethod += utils_1.indent(`if (${formValue}.length > this.form.${formValue}.length) {\n`, 2);
                    patchMethod += utils_1.indent(`this.add${nameParents}${_.upperFirst(_.camelCase(name.replace('_', '-')))}(${formValue}.length - this.form.${formValue}.length);\n`, 3);
                    patchMethod += utils_1.indent(`}\n`, 2);
                    mySubArrayPatch.forEach(subarray => {
                        patchMethod += utils_1.indent(`${formValue}.forEach(${subarray});\n`, 2);
                    });
                    patchMethod += utils_1.indent(`}\n`);
                    formArrayPatch.push(patchMethod);
                }
                else {
                    let resetMethod = '';
                    resetMethod += `(${parent}_object, ${parent}) => {\n`;
                    resetMethod += utils_1.indent(`if (${formValueIF}) {\n`);
                    resetMethod += utils_1.indent(`this.add${nameParents}${_.upperFirst(_.camelCase(name.replace('_', '-')))}(${parents}${formValue}.length);\n`, 2);
                    mySubArrayReset.forEach(subarray => {
                        resetMethod += utils_1.indent(`${formValue}.forEach(${subarray});\n`, 2);
                    });
                    resetMethod += utils_1.indent(`}\n`);
                    resetMethod += `}`;
                    subArrayReset.push(resetMethod);
                    let patchMethod = '';
                    patchMethod += `(${parent}_object, ${parent}) => {\n`;
                    patchMethod += utils_1.indent(`if (${formValueIF}) {\n`);
                    patchMethod += utils_1.indent(`if (${formValue}.length > this.form.${formValue}.length) {\n`, 2);
                    patchMethod += utils_1.indent(`this.add${nameParents}${_.upperFirst(_.camelCase(name.replace('_', '-')))}(${parents}${formValue}.length - this.form.${formValue}.length);\n`, 3);
                    patchMethod += utils_1.indent(`}\n`, 2);
                    mySubArrayPatch.forEach(subarray => {
                        patchMethod += utils_1.indent(`${formValue}.forEach(${subarray});\n`, 2);
                    });
                    patchMethod += utils_1.indent(`}\n`);
                    patchMethod += `}`;
                    subArrayPatch.push(patchMethod);
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
        const fields = walkParamOrProp(definition, path, definitions, parentTypes, formControl, formArrayMethods, formValue, formValueIF, formArrayReset, formArrayPatch, readOnly, formArrayParams, subArrayReset, subArrayPatch, parent, parents, nameParents + _.upperFirst(_.camelCase(name.replace('_', '-'))));
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
    let res = '';
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
    if (methodName === 'patch') {
        // If it a PATCH, it deletes the unchanged properties
        res += utils_1.indent(`  value = {...value};\n`, 2);
        res += utils_1.indent(`  const newBody = {};\n`, 2);
        res += utils_1.indent(`  Object.keys(this.patchInitialValue.data).forEach(key => {\n`, 2);
        res += utils_1.indent(`   if (JSON.stringify(value.${method.paramGroups.body[0].name}[key]) !== JSON.stringify(this.patchInitialValue.${method.paramGroups.body[0].name}[key])) {\n`, 2);
        res += utils_1.indent(`     newBody[key] = value.${method.paramGroups.body[0].name}[key];\n`, 2);
        res += utils_1.indent(`   }\n`, 2);
        res += utils_1.indent(`  });\n`, 2);
        res += utils_1.indent(`  value.${method.paramGroups.body[0].name} = newBody;\n`, 2);
    }
    res += utils_1.indent(`}\n`, 2);
    res += utils_1.indent(`const cacheKey = JSON.stringify(value) + cache + moment().format('HHMMss');\n`, 2);
    res += utils_1.indent(`if ( this.cacheSub[cacheKey] ) {\n`, 2);
    res += utils_1.indent(`    return this.cacheSub[cacheKey].asObservable();\n`, 2);
    res += utils_1.indent(`}\n`, 2);
    res += utils_1.indent(`this.cacheSub[cacheKey] = new ReplaySubject<${method.responseDef.type}>(1);\n`, 2);
    res += utils_1.indent(`const subject = this.cacheSub[cacheKey];\n`, 2);
    res += utils_1.indent(`let cache_hit = false;\n`, 2);
    if (method.responseDef.type !== 'void') {
        res += utils_1.indent(`if (cache && this.apiConfigService.cache[this.cache + JSON.stringify(value) + cache]) {\n`, 2);
        if (method.responseDef.type.indexOf('[]') > 0) {
            res += utils_1.indent(`  subject.next([...this.apiConfigService.cache[this.cache + JSON.stringify(value) + cache]]);\n`, 2);
        }
        else if (method.responseDef.type === 'string') {
            res += utils_1.indent(`  subject.next(this.apiConfigService.cache[this.cache + JSON.stringify(value) + cache]);\n`, 2);
        }
        else {
            res += utils_1.indent(`  subject.next({...this.apiConfigService.cache[this.cache + JSON.stringify(value) + cache]});\n`, 2);
        }
        res += utils_1.indent(`  cache_hit = true;\n`, 2);
        res += utils_1.indent(`  if (only_cache) {\n`, 2);
        res += utils_1.indent(`    subject.complete();\n`, 2);
        res += utils_1.indent(`    this.loadingSubject.next(false);\n`, 2);
        res += utils_1.indent(`    delete this.cacheSub[cacheKey];\n`, 2);
        res += utils_1.indent(`    return subject.asObservable();\n`, 2);
        res += utils_1.indent(`  }\n`, 2);
        res += utils_1.indent(`}\n`, 2);
    }
    res += utils_1.indent(`this.loadingSubject.next(true);\n`, 2);
    res += utils_1.indent(`this.serverErrorsSubject.next(null);\n`, 2);
    if (methodName == 'get') {
        res += utils_1.indent(`this.currentValue = value;\n`, 2);
    }
    res += utils_1.indent(`this.try(subject, value, cache_hit, cache, cacheKey);\n`, 2);
    res += utils_1.indent(`return subject.asObservable();\n`, 2);
    res += utils_1.indent('}\n');
    res += utils_1.indent('\n');
    res += utils_1.indent(`try(subject: ReplaySubject<${method.responseDef.type}>, value: any, cache_hit: boolean, cache: boolean, cacheKey: string, waitOnRetry = 1000, maxRetries = environment.apiRetries): void {\n`);
    if (methodName === 'get') {
        // If it is GET, then it checks if the currentValue has changed. It is necessary when replay the "try" due to a 500 error
        res += utils_1.indent(`if (JSON.stringify(value) !== JSON.stringify(this.currentValue)) {\n`, 2);
        res += utils_1.indent(`  subject.complete();\n`, 2);
        res += utils_1.indent(`  delete this.cacheSub[cacheKey];\n`, 2);
        res += utils_1.indent(`  return;\n`, 2);
        res += utils_1.indent(`}\n`, 2);
    }
    res += utils_1.indent(`const result = this.${_.lowerFirst(name)}Service.${simpleName}(${getSubmitFnParameters('value', paramGroups)});\n`, 2);
    res += utils_1.indent(`result.pipe(\n`, 2);
    if (method.responseDef.type === 'void') {
        res += utils_1.indent(`  map(() => {\n`, 2);
    }
    else {
        res += utils_1.indent(`  map(val => {\n`, 2);
    }
    if (method.responseDef.type === 'void') {
        res += utils_1.indent(`    subject.next();\n`, 2);
        res += utils_1.indent(`    if(this.apiConfigService.listeners[this.cache + JSON.stringify(value)]){\n`, 2);
        res += utils_1.indent(`     this.apiConfigService.listeners[this.cache + JSON.stringify(value)].subject.next();\n`, 2);
        res += utils_1.indent(`    }\n`, 2);
    }
    else {
        if (method.responseDef.type === 'string') {
            res += utils_1.indent(`    if (!cache_hit || this.apiConfigService.cache[this.cache + JSON.stringify(value) + cache] !== val) {\n`, 2);
        }
        else {
            res += utils_1.indent(`    if (!cache_hit || JSON.stringify(this.apiConfigService.cache[this.cache + JSON.stringify(value) + cache]) !== JSON.stringify(val)) {\n`, 2);
        }
        res += utils_1.indent(`      if (cache) {\n`, 2);
        res += utils_1.indent(`        this.apiConfigService.cache[this.cache + JSON.stringify(value) + cache] = val;\n`, 2);
        res += utils_1.indent(`      }\n`, 2);
        if (method.responseDef.type.indexOf('[]') > 0) {
            res += utils_1.indent(`      subject.next([...val]);\n`, 2);
            res += utils_1.indent(`      if(this.apiConfigService.listeners[this.cache + JSON.stringify(value)]){\n`, 2);
            res += utils_1.indent(`        this.apiConfigService.listeners[this.cache + JSON.stringify(value)].subject.next([...val]);\n`, 2);
            res += utils_1.indent(`      }\n`, 2);
        }
        else if (method.responseDef.type === 'string') {
            res += utils_1.indent(`      subject.next(val);\n`, 2);
            res += utils_1.indent(`      if(this.apiConfigService.listeners[this.cache + JSON.stringify(value)]){\n`, 2);
            res += utils_1.indent(`        this.apiConfigService.listeners[this.cache + JSON.stringify(value)].subject.next(val);\n`, 2);
            res += utils_1.indent(`      }\n`, 2);
        }
        else {
            res += utils_1.indent(`      subject.next({...val});\n`, 2);
            res += utils_1.indent(`      if(this.apiConfigService.listeners[this.cache + JSON.stringify(value)]){\n`, 2);
            res += utils_1.indent(`        this.apiConfigService.listeners[this.cache + JSON.stringify(value)].subject.next({...val});\n`, 2);
            res += utils_1.indent(`      }\n`, 2);
        }
        res += utils_1.indent(`    }\n`, 2);
    }
    res += utils_1.indent(`    subject.complete();\n`, 2);
    res += utils_1.indent(`    delete this.cacheSub[cacheKey];\n`, 2);
    res += utils_1.indent(`    this.loadingSubject.next(false);\n`, 2);
    if (method.responseDef.type !== 'void') {
        res += utils_1.indent(`    return val;\n`, 2);
    }
    res += utils_1.indent(`  }),\n`, 2);
    res += utils_1.indent(`  catchError(error => {\n`, 2);
    res += utils_1.indent(`    if (error.status >= 500 && maxRetries > 0) {\n`, 2);
    res += utils_1.indent(`        // A client-side or network error occurred. Handle it accordingly.\n`, 2);
    res += utils_1.indent(`        setTimeout(() => this.try(subject, value, cache_hit, cache, cacheKey, waitOnRetry + 1000, maxRetries - 1), waitOnRetry);\n`, 2);
    res += utils_1.indent(`    } else {\n`, 2);
    res += utils_1.indent(`        // The backend returned an unsuccessful response code.\n`, 2);
    res += utils_1.indent(`        // The response body may contain clues as to what went wrong,\n`, 2);
    res += utils_1.indent(`        this.serverErrorsSubject.next(error.error);\n`, 2);
    res += utils_1.indent(`        subject.error(error);\n`, 2);
    res += utils_1.indent(`        subject.complete();\n`, 2);
    res += utils_1.indent(`        delete this.cacheSub[cacheKey];\n`, 2);
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
    res += utils_1.indent('\n');
    res += utils_1.indent(`listen(value: any = false, submit: boolean = true): Observable<${method.responseDef.type}> {\n`);
    res += utils_1.indent(`if (value === false) {\n`, 2);
    res += utils_1.indent(`  value = this.${formName}.value;\n`, 2);
    res += utils_1.indent(`}\n`, 2);
    res += utils_1.indent(`if(!this.apiConfigService.listeners[this.cache + JSON.stringify(value)]){\n`, 2);
    res += utils_1.indent(`  this.apiConfigService.listeners[this.cache + JSON.stringify(value)] = {fs: this, payload: value, subject: new ReplaySubject<${method.responseDef.type}>(1)};\n`, 2);
    res += utils_1.indent(`}\n`, 2);
    if (methodName === 'get') {
        res += utils_1.indent(`if (this.apiConfigService.cache[this.cache + JSON.stringify(value) + true]) {\n`, 2);
        if (method.responseDef.type.indexOf('[]') > 0) {
            res += utils_1.indent(`  this.apiConfigService.listeners[this.cache + JSON.stringify(value)].subject.next([...this.apiConfigService.cache[this.cache + JSON.stringify(value) + true]]);\n`, 2);
        }
        else if (method.responseDef.type === 'string') {
            res += utils_1.indent(`  this.apiConfigService.listeners[this.cache + JSON.stringify(value)].subject.next(this.apiConfigService.cache[this.cache + JSON.stringify(value) + true]);\n`, 2);
        }
        else {
            res += utils_1.indent(`  this.apiConfigService.listeners[this.cache + JSON.stringify(value)].subject.next({...this.apiConfigService.cache[this.cache + JSON.stringify(value) + true]});\n`, 2);
        }
        res += utils_1.indent(`}\n`, 2);
    }
    res += utils_1.indent(`if (submit) {\n`, 2);
    res += utils_1.indent(` this.submit(value);\n`, 2);
    res += utils_1.indent(`}\n`, 2);
    res += utils_1.indent(`return this.apiConfigService.listeners[this.cache + JSON.stringify(value)].subject.asObservable();\n`, 2);
    res += utils_1.indent('}\n');
    res += utils_1.indent('\n');
    return res;
}
function getFormResetFunction(formName, formArrayReset, formArrayPatch, methodName) {
    let res = utils_1.indent('reset(value?: any): void {\n');
    res += utils_1.indent(`this.${formName}.reset();\n`, 2);
    for (const i in formArrayReset) {
        res += utils_1.indent(formArrayReset[i]);
    }
    res += utils_1.indent(`this.serverErrorsSubject.next(null);\n`, 2);
    res += utils_1.indent(`this.loadingSubject.next(false);\n`, 2);
    res += utils_1.indent(`this.${formName}.patchValue(this.defaultValue);\n`, 2);
    res += utils_1.indent(`if (value) {\n`, 2);
    res += utils_1.indent(`this.${formName}.patchValue(value);\n`, 3);
    res += utils_1.indent('}\n', 2);
    if (methodName === 'patch') {
        res += utils_1.indent(`this.patchInitialValue = this.${formName}.value;\n`, 2);
    }
    res += utils_1.indent('}\n\n');
    res += utils_1.indent('patch(value: any): void {\n');
    for (const i in formArrayPatch) {
        res += utils_1.indent(formArrayPatch[i]);
    }
    res += utils_1.indent(`this.${formName}.patchValue(value);\n`, 2);
    res += utils_1.indent('}\n');
    return res;
}
function getSubmitFnParameters(name, paramGroups) {
    if (paramGroups.length)
        return name;
    return '';
}
//# sourceMappingURL=generate-form-service.js.map