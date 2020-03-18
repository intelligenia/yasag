import * as _ from 'lodash';
import * as nodePath from 'path';

import {normalizeDef} from '../common';
import {nativeTypes} from '../conf';
import {ProcessedDefinition} from '../definitions';
import {Config} from '../generate';
import {parameterToSchema} from '../requests/process-params';
import {MethodOutput} from '../requests/requests.models';
import {NativeNames, Parameter, Schema} from '../types';
import {indent, writeFile} from '../utils';

export interface FieldDefinition {
  content: string;
  params: string[];
}

export function generateFormService(
                      config: Config,
                      name: string,
                      params: Parameter[],
                      definitions: ProcessedDefinition[],
                      simpleName: string,
                      formSubDirName: string,
                      className: string,
                      methodName: string,
                      method: MethodOutput,
                      readOnly: string) {
  let content = '';
  const formName = 'form';
  const formArrayReset: string[] = [];
  const formArrayPatch: string[] = [];
  const constructor = getConstructor(name, formName, definitions, params, formArrayReset, formArrayPatch, readOnly);

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

  const componentHTMLFileName = nodePath.join(formSubDirName, `${simpleName}.service.ts`);
  writeFile(componentHTMLFileName, content, config.header);
}

function getImports(name: string, constructor: string) {
  const imports: string[] = [];

  if (constructor.match(/new FormArray\(/)) imports.push('FormArray');
  if (constructor.match(/new FormControl\(/)) imports.push('FormControl');
  if (constructor.match(/new FormGroup\(/)) imports.push('FormGroup');
  if (constructor.match(/\[Validators\./)) imports.push('Validators');

  let res = 'import { Injectable } from \'@angular/core\';\n';
  if (imports.length) res += `import {${imports.join(', ')}} from '@angular/forms';\n`;
  res += 'import { ReplaySubject, Observable, throwError } from \'rxjs\';\n';
  res += 'import { catchError, finalize, map } from \'rxjs/operators\';\n';
  res += `import { ${name}Service } from '../../../controllers/${name}';\n`;
  res += `import * as __model from '../../../model';\n`;
  res += `import { environment } from 'environments/environment';\n`;

  res += '\n';

  return res;
}

function getVariables(method: MethodOutput, formName: string): string {
  let content = '';
  Object.keys(method.method.method).forEach(k => {
    if ( k.startsWith('x-') ) {
      content += indent(`static ${ _.camelCase(k) } = ${ JSON.stringify(method.method.method[k]) };\n`);
    }
  });

  content += indent(`${formName}: FormGroup;\n`);
  content += indent(`defaultValue: any;\n`);
  content += indent(`serverErrors$: Observable<any>;\n`);
  content += indent(`private serverErrorsSubject: ReplaySubject<any>;\n`);
  content += indent(`loading$: Observable<boolean>;\n`);
  content += indent(`private loadingSubject: ReplaySubject<boolean>;\n`);
  if (method.methodName == 'get') {
    content += indent(`currentValue: any;\n`);
  }
  if (method.methodName == 'patch') {
    content += indent(`patchInitialValue: any;\n`);
  }
  content += indent(`private cache: any;\n`);
  content += indent(`private cacheSub: any;\n`);
  return content;
}

function getConstructor(name: string, formName: string, definitions: ProcessedDefinition[],
                        params: Parameter[], formArrayReset: string[], formArrayPatch: string[], readOnly: string) {
  let res = indent('constructor(\n');
  res += indent(`private ${_.lowerFirst(name)}Service: ${name}Service,\n`, 2);
  res += indent(') {\n');

  const definitionsMap = _.groupBy(definitions, 'name');
  const parentTypes: string[] = [];
  const formArrayMethods: string[] = [];

  const formDefinition = walkParamOrProp(params, undefined, definitionsMap, parentTypes,
    `this.${formName}`, formArrayMethods, 'value', 'value', formArrayReset, formArrayPatch, readOnly);
  res += indent(`this.${formName} = new FormGroup({\n${formDefinition}\n});\n`, 2);
  res += indent(`this.defaultValue = this.${formName}.value;\n`, 2);
  res += indent(`this.serverErrorsSubject = new ReplaySubject<any>(1);\n`, 2);
  res += indent(`this.serverErrors$ = this.serverErrorsSubject.asObservable();\n`, 2);
  res += indent(`this.loadingSubject = new ReplaySubject<boolean>(1);\n`, 2);
  res += indent(`this.loading$ = this.loadingSubject.asObservable();\n`, 2);
  res += indent(`this.cache = {};\n`, 2);
  res += indent(`this.cacheSub = {};\n`, 2);

  res += indent('}\n');
  res += '\n';
  for (const method in formArrayMethods) {
    res += formArrayMethods[method];
    res += '\n';
  }

  return res;
}

function walkParamOrProp(definition: Parameter[] | ProcessedDefinition, path: string[] = [],
                         definitions: _.Dictionary<ProcessedDefinition[]>, parentTypes: string[],
                         control: string, formArrayMethods: string[], formValue: string, formValueIF: string,
                         formArrayReset: string[], formArrayPatch: string[], readOnly: string, formArrayParams = '',
                         subArrayReset: string[] = [], subArrayPatch: string[] = [], parent = '', parents = '', nameParents = ''): string {
  const res: string[] = [];
  let schema: Record<string, Schema>;
  let required: string[];

  // create unified inputs for
  // 1. parameters
  if (Array.isArray(definition)) {
    schema = {};
    required = [];
    definition.forEach(param => {
      if (param.required) required.push(param.name);
      schema[param.name] = parameterToSchema(param);
    });
    // 2. object definition
  } else {
    required = definition.def.required;
    schema = definition.def.properties || {};
  }

  // walk the list and build recursive form model
  Object.entries(schema).forEach(([paramName, param]) => {
    const ref = param.$ref;

    // break type definition chain with cycle
    if (parentTypes.indexOf(ref) >= 0) return;

    const name = paramName;
    const newPath = [...path, name];
    const isRequired = required && required.includes(name);

    let newParentTypes: string[] = [];
    if (ref) newParentTypes = [...parentTypes, ref];

    if (readOnly && name.endsWith(readOnly)) {
      param.readOnly = true;
    }

    if (!param.readOnly || name === 'id') {
      const fieldDefinition = makeField(param, ref, name, newPath, isRequired, definitions, newParentTypes,
        `${control}['controls']['${name}']`, formArrayMethods,
        formValue + `['${name}']`, `${formValueIF} && ${formValue}['${name}']`, formArrayReset,
        formArrayPatch, formArrayParams, subArrayReset, subArrayPatch, parent, parents, nameParents, readOnly);

      res.push(fieldDefinition);
    }
  });

  return indent(res);
}

function makeField(param: Schema, ref: string,
                   name: string, path: string[], required: boolean,
                   definitions: _.Dictionary<ProcessedDefinition[]>, parentTypes: string[],
                   formControl: string, formArrayMethods: string[], formValue: string, formValueIF: string,
                   formArrayReset: string[], formArrayPatch: string[], formArrayParams: string, subArrayReset: string[],
                   subArrayPatch: string[], parent: string, parents: string, nameParents = '', readOnly: string): string {

  let definition: ProcessedDefinition;
  let type = param.type;
  let control: string;
  let initializer: string;

  if (type) {
    if (type in nativeTypes) {
      const typedType = type as NativeNames;
      type = nativeTypes[typedType];
    }

    // use helper method and store type definition to add new array items
    if (type === 'array') {
      if (param.items.type) {
        control = 'FormControl';
        initializer = '[]';
      } else {
        const refType = param.items.$ref.replace(/^#\/definitions\//, '');
        definition = definitions[normalizeDef(refType)][0];
        const mySubArrayReset: string[] = [];
        const mySubArrayPatch: string[] = [];
        const fields = walkParamOrProp(definition, path, definitions, parentTypes,
          formControl + `['controls'][${name}]`, formArrayMethods, formValue + `[${name}]`, formValueIF,
          formArrayReset, formArrayPatch, readOnly, formArrayParams + name + ': number' + ', ', mySubArrayReset, mySubArrayPatch, name,
          parents + name + ', ', nameParents + _.upperFirst(_.camelCase(name.replace('_', '-'))));
        control = 'FormArray';
        initializer = `[]`;
        let addMethod = '';
        addMethod += indent(`public add${nameParents}${_.upperFirst(_.camelCase(name.replace('_', '-')))}(${formArrayParams} ${name}: number = 1, position?: number): void {\n`);
        addMethod += indent(`const control = <FormArray>${formControl};\n`, 2);
        addMethod += indent(`for (let i = 0; i < ${name}; i++) {\n`, 2);
        addMethod += indent(`const fg = new FormGroup({\n${fields}\n}, []);\n`, 3);
        addMethod += indent(`if (position !== undefined){\n`, 3);
        addMethod += indent(`control.insert(position, fg);\n`, 4);
        addMethod += indent(`} else {\n`, 3);
        addMethod += indent(`control.push(fg);\n`, 4);
        addMethod += indent(`}\n`, 3);
        addMethod += indent(`}\n`, 2);
        addMethod += indent(`}\n`);
        formArrayMethods.push(addMethod);

        let removeMethod = '';
        removeMethod += indent(`public remove${nameParents}${_.upperFirst(_.camelCase(name.replace('_', '-')))}(${formArrayParams} i: number): void {\n`);
        removeMethod += indent(`const control = <FormArray>${formControl};\n`, 2);
        removeMethod += indent(`control.removeAt(i);\n`, 2);
        removeMethod += indent(`}\n`);
        formArrayMethods.push(removeMethod);

        if (formArrayParams === '') {
          let resetMethod = '';
          resetMethod += indent(`while ((<FormArray>${formControl}).length) {\n`);
          resetMethod += indent(`this.remove${nameParents}${_.upperFirst(_.camelCase(name.replace('_', '-')))}(0);\n`, 2);
          resetMethod += indent(`}\n`);
          resetMethod += indent(`if (${formValueIF}) {\n`);
          resetMethod += indent(`this.add${nameParents}${_.upperFirst(_.camelCase(name.replace('_', '-')))}(${formValue}.length);\n`, 2);
          mySubArrayReset.forEach( subarray => {
            resetMethod += indent(`${formValue}.forEach(${subarray});\n`, 2);
          });
          resetMethod += indent(`}\n`);
          formArrayReset.push(resetMethod);

          let patchMethod = '';
          patchMethod += indent(`if (${formValueIF}) {\n`);
          patchMethod += indent(`if (${formValue}.length > this.form.${formValue}.length) {\n`, 2);
          patchMethod += indent(`this.add${nameParents}${_.upperFirst(_.camelCase(name.replace('_', '-')))}(${formValue}.length - this.form.${formValue}.length);\n`, 3);
          patchMethod += indent(`}\n`, 2);
          mySubArrayPatch.forEach( subarray => {
            patchMethod += indent(`${formValue}.forEach(${subarray});\n`, 2);
          });
          patchMethod += indent(`}\n`);
          formArrayPatch.push(patchMethod);
        } else {
          let resetMethod = '';
          resetMethod += `(${parent}_object, ${parent}) => {\n`;
          resetMethod += indent(`if (${formValueIF}) {\n`);
          resetMethod += indent(`this.add${nameParents}${_.upperFirst(_.camelCase(name.replace('_', '-')))}(${parents}${formValue}.length);\n`, 2);
          mySubArrayReset.forEach( subarray => {
            resetMethod += indent(`${formValue}.forEach(${subarray});\n`, 2);
          });
          resetMethod += indent(`}\n`);
          resetMethod += `}`;
          subArrayReset.push(resetMethod);

          let patchMethod = '';
          patchMethod += `(${parent}_object, ${parent}) => {\n`;
          patchMethod += indent(`if (${formValueIF}) {\n`);
          patchMethod += indent(`if (${formValue}.length > this.form.${formValue}.length) {\n`, 2);
          patchMethod += indent(`this.add${nameParents}${_.upperFirst(_.camelCase(name.replace('_', '-')))}(${formValue}.length - this.form.${formValue}.length);\n`, 3);
          patchMethod += indent(`}\n`, 2);
          mySubArrayPatch.forEach( subarray => {
            patchMethod += indent(`${formValue}.forEach(${subarray});\n`, 2);
          });
          patchMethod += indent(`}\n`);
          patchMethod += `}`;
          subArrayPatch.push(patchMethod);
        }
      }
    } else {
      control = 'FormControl';
      initializer = typeof param.default === 'string' ? `'${param.default}'` : param.default;
      initializer = `{value: ${initializer}, disabled: false}`;
    }
  } else {
    const refType = ref.replace(/^#\/definitions\//, '');
    definition = definitions[normalizeDef(refType)][0];

    control = 'FormGroup';
    const fields = walkParamOrProp(definition, path, definitions, parentTypes,
      formControl, formArrayMethods, formValue, formValueIF, formArrayReset, formArrayPatch, readOnly, formArrayParams,
      subArrayReset, subArrayPatch, parent, parents, nameParents + _.upperFirst(_.camelCase(name.replace('_', '-'))));
    initializer = `{\n${fields}\n}`;
  }

  const validators = getValidators(param);
  if (required) validators.push('Validators.required');

  return `${name}: new ${control}(${initializer}, [${validators.join(', ')}]),`;
}

function getValidators(param: Parameter | Schema) {
  const validators: string[] = [];

  if (param.format && param.format === 'email') validators.push('Validators.email');

  if (param.maximum) validators.push(`Validators.max(${param.maximum})`);
  if (param.minimum) validators.push(`Validators.min(${param.minimum})`);

  if (param.maxLength) validators.push(`Validators.maxLength(${param.maxLength})`);
  if (param.minLength) validators.push(`Validators.minLength(${param.minLength})`);

  if (param.pattern) validators.push(`Validators.pattern(/${param.pattern}/)`);

  return validators;
}

function getFormSubmitFunction(name: string, formName: string, simpleName: string, paramGroups: Parameter[], methodName: string, method: MethodOutput) {
  let res = '';
  if (methodName == 'get') {
    res += indent(`submit(value: any = false, cache: boolean = true, only_cache: boolean = false): Observable<${ method.responseDef.type }> {\n`);
  } else {
    res += indent(`submit(value: any = false): Observable<${ method.responseDef.type }> {\n`);
    res += indent(`const cache = false;\n`, 2);
    res += indent(`const only_cache = false;\n`, 2);
  }
  res += indent(`if (value === false) {\n`, 2);
  res += indent(`  value = this.${formName}.value;\n`, 2);
  if (methodName == 'patch') {
    // If it a PATCH, it deletes the unchanged properties
    res += indent(`  value = {...value};\n`, 2);
    res += indent(`  const newBody = {};\n`, 2);
    res += indent(`  Object.keys(this.patchInitialValue.data).forEach(key => {\n`, 2);
    res += indent(`   if (JSON.stringify(value.${method.paramGroups.body[0].name}[key]) !== JSON.stringify(this.patchInitialValue.${method.paramGroups.body[0].name}[key])) {\n`, 2);
    res += indent(`     newBody[key] = value.${method.paramGroups.body[0].name}[key];\n`, 2);
    res += indent(`   }\n`, 2);
    res += indent(`  });\n`, 2);
    res += indent(`  value.${method.paramGroups.body[0].name} = newBody;\n`, 2);
  }
  res += indent(`}\n`, 2);
  res += indent(`if ( this.cacheSub[JSON.stringify(value)] ) {\n`, 2);
  res += indent(`    return this.cacheSub[JSON.stringify(value)].asObservable();\n`, 2);
  res += indent(`}\n`, 2);
  res += indent(`this.cacheSub[JSON.stringify(value)] = new ReplaySubject<${method.responseDef.type}>(1);\n`, 2);
  res += indent(`const subject = this.cacheSub[JSON.stringify(value)];\n`, 2);

  res += indent(`let cache_hit = false;\n`, 2);
  if ( method.responseDef.type !== 'void' ) {
    res += indent(`if (cache && this.cache[JSON.stringify(value)]) {\n`, 2);
    if ( method.responseDef.type.indexOf('[]') > 0 ) {
      res += indent(`  subject.next([...this.cache[JSON.stringify(value)]]);\n`, 2);
    } else {
      res += indent(`  subject.next({...this.cache[JSON.stringify(value)]});\n`, 2);
    }
    res += indent(`  cache_hit = true;\n`, 2);
    res += indent(`  if (only_cache) {\n`, 2);
    res += indent(`    subject.complete();\n`, 2);
    res += indent(`    this.loadingSubject.next(false);\n`, 2);
    res += indent(`    delete this.cacheSub[JSON.stringify(value)];\n`, 2);
    res += indent(`    return subject.asObservable();\n`, 2);
    res += indent(`  }\n`, 2);
    res += indent(`}\n`, 2);
  }
  res += indent(`this.loadingSubject.next(true);\n`, 2);
  res += indent(`this.serverErrorsSubject.next(null);\n`, 2);
  if (methodName == 'get') {
    res += indent(`this.currentValue = value;\n`, 2);
  }
  res += indent(`this.try(subject, value, cache_hit, cache);\n`, 2);
  res += indent(`return subject.asObservable();\n`, 2);
  res += indent('}\n');
  res += indent('\n');

  res += indent(`try(subject: ReplaySubject<${ method.responseDef.type }>, value: any, cache_hit: boolean, cache: boolean, waitOnRetry = 1000, maxRetries = environment.apiRetries): void {\n`);
  if (methodName == 'get') {
    // If it is GET, then it checks if the currentValue has changed. It is necessary when replay the "try" due to a 500 error
    res += indent(`if (JSON.stringify(value) !== JSON.stringify(this.currentValue)) {\n`, 2);
    res += indent(`  subject.complete();\n`, 2);
    res += indent(`  delete this.cacheSub[JSON.stringify(value)];\n`, 2);
    res += indent(`  return;\n`, 2);
    res += indent(`}\n`, 2);
  }
  res += indent(
    `const result = this.${_.lowerFirst(name)}Service.${simpleName}(${getSubmitFnParameters('value', paramGroups)});\n`, 2);

  res += indent(`result.pipe(\n`, 2);
  if ( method.responseDef.type === 'void' ) {
    res += indent(`  map(() => {\n`, 2);
  } else {
    res += indent(`  map(val => {\n`, 2);
  }
  if ( method.responseDef.type === 'void' ) {
    res += indent(`    subject.next();\n`, 2);
  } else {
    if ( method.responseDef.type === 'string' ) {
      res += indent(`    if (!cache_hit || this.cache[JSON.stringify(value)] !== val) {\n`, 2);
    } else {
      res += indent(`    if (!cache_hit || JSON.stringify(this.cache[JSON.stringify(value)]) !== JSON.stringify(val)) {\n`, 2);
    }
    res += indent(`      if (cache) {\n`, 2);
    res += indent(`        this.cache[JSON.stringify(value)] = val;\n`, 2);
    res += indent(`      }\n`, 2);

    if ( method.responseDef.type.indexOf('[]') > 0 ) {
      res += indent(`      subject.next([...val]);\n`, 2);
    } else if ( method.responseDef.type === 'string' ) {
      res += indent(`      subject.next(val);\n`, 2);
    } else {
      res += indent(`      subject.next({...val});\n`, 2);
    }
    res += indent(`    }\n`, 2);
  }

  res += indent(`    subject.complete();\n`, 2);
  res += indent(`    delete this.cacheSub[JSON.stringify(value)];\n`, 2);
  res += indent(`    this.loadingSubject.next(false);\n`, 2);
  if ( method.responseDef.type !== 'void' ) {
    res += indent(`    return val;\n`, 2);
  }
  res += indent(`  }),\n`, 2);
  res += indent(`  catchError(error => {\n`, 2);
  res += indent(`    if (error.status >= 500 && maxRetries > 0) {\n`, 2);
  res += indent(`        // A client-side or network error occurred. Handle it accordingly.\n`, 2);
  res += indent(`        setTimeout(() => this.try(subject, value, cache_hit, cache, waitOnRetry + 1000, maxRetries - 1), waitOnRetry);\n`, 2);
  res += indent(`    } else {\n`, 2);
  res += indent(`        // The backend returned an unsuccessful response code.\n`, 2);
  res += indent(`        // The response body may contain clues as to what went wrong,\n`, 2);
  res += indent(`        this.serverErrorsSubject.next(error.error);\n`, 2);
  res += indent(`        subject.error(error);\n`, 2);
  res += indent(`        subject.complete();\n`, 2);
  res += indent(`        delete this.cacheSub[JSON.stringify(value)];\n`, 2);
  res += indent(`        this.loadingSubject.next(false);\n`, 2);
  res += indent(`    }\n`, 2);
  res += indent(`    return throwError(error);\n`, 2);
  res += indent(`  })\n`, 2);
  res += indent(`).subscribe();\n`, 2);
  res += indent('}\n');
  res += indent('\n\n');

  res += indent(`cancelPreviousRequest(): void {\n`);
  res += indent('  Object.keys(this.cacheSub).forEach(key => this.cacheSub[key].unsubscribe());\n');
  res += indent('  this.cacheSub = {};\n');
  res += indent('}\n');
  res += indent('\n');

  return res;
}

function getFormResetFunction(formName: string, formArrayReset: string[], formArrayPatch: string[], methodName: string) {
  let res = indent('reset(value?: any): void {\n');
  res += indent(`this.${formName}.reset();\n`, 2);
  for (const i in formArrayReset) {
    res += indent(formArrayReset[i]);
  }
  res += indent(`this.serverErrorsSubject.next(null);\n`, 2);
  res += indent(`this.loadingSubject.next(false);\n`, 2);
  res += indent(`this.${formName}.patchValue(this.defaultValue);\n`, 2);

  res += indent(`if (value) {\n`, 2);
  res += indent(`this.${formName}.patchValue(value);\n`, 3);
  res += indent('}\n', 2);
  if (methodName === 'patch') {
    res += indent(`this.patchInitialValue = this.${formName}.value;\n`, 2);
  }
  res += indent('}\n\n');

  res += indent('patch(value: any): void {\n');
  for (const i in formArrayPatch) {
    res += indent(formArrayPatch[i]);
  }
  res += indent(`this.${formName}.patchValue(value);\n`, 2);
  res += indent('}\n');

  return res;
}

function getSubmitFnParameters(name: string, paramGroups: Parameter[]) {
  if (paramGroups.length) return name;
  return '';
}
