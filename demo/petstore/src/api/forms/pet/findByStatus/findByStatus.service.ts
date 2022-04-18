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

import { Injectable, NgZone } from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {  Observable } from 'rxjs';
import { PetService } from '../../../controllers/Pet';
import * as __model from '../../../model';
import { APIConfigService } from '../../../apiconfig.service';

import * as __utils from '../../../yasag-utils';

import { YASAGGetFormService } from '../../yasag-get.service';


@Injectable()
export class PetFindByStatusFormService extends YASAGGetFormService<__model.Pet[]> {
  constructor(
    apiConfigService: APIConfigService,
    ngZone: NgZone,
    private service: PetService,
  ) {
    super('PetFindByStatus', apiConfigService, ngZone);
    this.form = new FormGroup({
      status: new FormControl([], [Validators.required]),
    });
    this.init()
  }

  submit(value: any = false, cache = true, only_cache = false): Observable<__model.Pet[]> {
    const result = val => this.service.findByStatus(val);
    return this._submit('__model.Pet[]', result, value, cache, only_cache );
  }
  listen(value: any = false, submit: boolean = true): Observable<__model.Pet[]> {
    if (submit) {
      this.submit(value);
    }
    return this._listen('__model.Pet[]', value, submit);
  }


  reset(value?: any): void {
    this.form.reset();
    super.reset(value, false); 
  }
  patch(value: any): void {
    this.form.patchValue(value);
  }
}
