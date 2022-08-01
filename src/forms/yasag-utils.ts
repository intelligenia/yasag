import * as path from "path";
import { Config } from "../generate";
import { writeFile } from "../utils";

/**
 * Creates the FormService Abstract class
 * @param config: global configuration for YASAG
 */
export function createUtils(config: Config) {
  const formArray = config.typedForms ? "UntypedFormArray" : "FormArray";

  const content = `

  import { HttpParams } from "@angular/common/http";
  import { ${formArray}, FormGroup } from "@angular/forms";
  import cloneDeep from 'lodash/cloneDeep';

  export function getQueryParams(queryParamBase): HttpParams {

    let queryParams = new HttpParams();
    Object.entries(queryParamBase).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          let val = '';
          value.forEach(v => val += v + ',');
          if (val.length > 0 ) {
            val = val.slice(0, val.length - 1);
          }
          queryParams = queryParams.set(key, val);
        } else if (typeof value === 'string') {
          queryParams = queryParams.set(key, value);
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
