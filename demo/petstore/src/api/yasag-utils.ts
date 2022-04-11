/* tslint:disable:max-line-length */
/**
 * This is a sample server Petstore server.  You can find out more about Swagger at [http://swagger.io](http://swagger.io) or on [irc.freenode.net, #swagger](http://swagger.io/irc/).  For this sample, you can use the api key `special-key` to test the authorization filters.
 * 1.0.0
 * Swagger Petstore
 * http://swagger.io/terms/
 * apiteam@swagger.io
 * Apache 2.0
 * http://www.apache.org/licenses/LICENSE-2.0.html
 * petstore.swagger.io/v2
 */



  import { HttpParams } from "@angular/common/http";
  import { FormArray, FormGroup } from "@angular/forms";
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

  export function addField(control:FormArray, items: number, formGroup: FormGroup, position: number, value: any) {
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
  