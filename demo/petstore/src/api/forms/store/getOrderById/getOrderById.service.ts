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
import { StoreService } from '../../../controllers/Store';
import * as __model from '../../../model';
import { APIConfigService } from '../../../apiconfig.service';

import * as __utils from '../../../yasag-utils';

import { YASAGGetFormService } from '../../yasag-get.service';


@Injectable()
export class StoreGetOrderByIdFormService extends YASAGGetFormService<__model.Order> {
  constructor(
    apiConfigService: APIConfigService,
    ngZone: NgZone,
    private service: StoreService,
  ) {
    super('StoreGetOrderById', apiConfigService, ngZone);
    this.form = new FormGroup({
      orderId: new FormControl({value: undefined, disabled: false}, [Validators.max(10), Validators.min(1), Validators.required]),
    });
    this.init()
  }

  submit(value: any = false, cache = true, only_cache = false): Observable<__model.Order> {
    const result = val => this.service.getOrderById(val);
    return this._submit('__model.Order', result, value, cache, only_cache );
  }
  listen(value: any = false, submit: boolean = true): Observable<__model.Order> {
    if (submit) {
      this.submit(value);
    }
    return this._listen('__model.Order', value, submit);
  }


  reset(value?: any): void {
    this.form.reset();
    super.reset(value, false); 
  }
  patch(value: any): void {
    this.form.patchValue(value);
  }
}
