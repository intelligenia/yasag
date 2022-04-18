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

import { YASAGPostFormService } from '../../yasag-post.service';


@Injectable()
export class StorePlaceOrderFormService extends YASAGPostFormService<__model.Order> {
  constructor(
    apiConfigService: APIConfigService,
    ngZone: NgZone,
    private service: StoreService,
  ) {
    super('StorePlaceOrder', apiConfigService, ngZone);
    this.form = new FormGroup({
      body: new FormGroup({
        id: new FormControl({value: undefined, disabled: false}, []),
        petId: new FormControl({value: undefined, disabled: false}, []),
        quantity: new FormControl({value: undefined, disabled: false}, []),
        shipDate: new FormControl({value: undefined, disabled: false}, []),
        status: new FormControl({value: undefined, disabled: false}, []),
        complete: new FormControl({value: false, disabled: false}, []),
      }, [Validators.required]),
    });
    this.init()
  }

  submit(value: any = false): Observable<__model.Order> {
    const result = this.service.placeOrder(value || this.form.value, this.multipart);
    return this._submit('__model.Order', result, 'null', value, false );
  }
  listen(value: any = false, submit: boolean = true): Observable<__model.Order> {
    if (submit) {
      this.submit(value);
    }
    return this._listen(value, submit);
  }


  reset(value?: any): void {
    this.form.reset();    super.reset(value, false); 
  }
  patch(value: any): void {
    this.form.patchValue(value);
  }
}
