import * as path from "path";
import { Config } from "../generate";
import { writeFile } from "../utils";

/**
 * Creates the FormService Abstract class
 * @param config: global configuration for YASAG
 */
export function createUtils(config: Config) {
  const formArray = config.typedForms ? "UntypedFormArray" : "FormArray";
  // Tree-shakable ESM import for modern targets; CommonJS deep path for legacy.
  const cloneDeepImport = config.profile.standalone
    ? "import { cloneDeep } from 'lodash-es';"
    : "import cloneDeep from 'lodash/cloneDeep';";

  const content = `

  import { HttpParams } from "@angular/common/http";
  import { ${formArray}, FormGroup } from "@angular/forms";
  ${cloneDeepImport}

  export function getQueryParams(queryParamBase): HttpParams {

    let queryParams = new HttpParams();
    Object.entries(queryParamBase).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // Omit empty arrays: sending 'key=' makes drf-spectacular filters
          // reject it as "'' is not a valid value" (400). Absent = no filter.
          if (value.length > 0) {
            queryParams = queryParams.set(key, value.join(','));
          }
        } else if (typeof value === 'string') {
          // Same reason: omit empty-string filters instead of sending 'key='.
          if (value !== '') {
            queryParams = queryParams.set(key, value);
          }
        } else {
          queryParams = queryParams.set(key, JSON.stringify(value));
        }
      }
    });
    return queryParams;

  }

  export function getBodyParamsWithoutUndefined(multipart:boolean, bodyParams:Object): any {
    const bodyParamsWithoutUndefined: any = (multipart) ? new FormData() : Array.isArray(bodyParams) ? [] : {};
    Object.entries(bodyParams || {}).forEach(([key, value]) => {
      if (value !== undefined) {
        if (multipart) {
          bodyParamsWithoutUndefined.append(key, value);
        } else {
          bodyParamsWithoutUndefined[key] = value;
        }
      }
    })
    return bodyParamsWithoutUndefined;
  }

  export function multipleOfValidator(factor: number) {
    return (control: {value: any}) => {
      const value = control.value;
      if (value === null || value === undefined || value === '') return null;
      return Number(value) % factor === 0 ? null : {multipleOf: {requiredMultiple: factor, actual: value}};
    };
  }

  export function addField(control:${formArray}, items: number, formGroup: FormGroup, position: number, value: any) {
    for (let i = 0; i < items; i++) {
      const fg = cloneDeep(formGroup);

      if (value !== undefined) {
        fg.patchValue(value);
      }
      if (position !== undefined) {
        control.insert(position, fg);
      } else {
        control.push(fg);
      }
    }
  }
  `;

  const classFileName = path.join(config.dest, `yasag-utils.ts`);
  writeFile(classFileName, content, config.header);
}
