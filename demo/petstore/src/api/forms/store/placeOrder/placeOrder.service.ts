/* tslint:disable:max-line-length */

import { Injectable, NgZone } from '@angular/core';
import {FormGroup, Validators} from '@angular/forms';
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
        id: new FormControl<number|null>({value: undefined, disabled: false}, []),
        petId: new FormControl<number|null>({value: undefined, disabled: false}, []),
        quantity: new FormControl<number|null>({value: undefined, disabled: false}, []),
        shipDate: new FormControl<string|null>({value: undefined, disabled: false}, []),
        status: new FormControl<string|null>({value: undefined, disabled: false}, []),
        complete: new FormControl<boolean|null>({value: false, disabled: false}, []),
      }, [Validators.required]),
    });
    this.init()
  }

  submit(value: any = false): Observable<__model.Order> {
    const result = val => this.service.placeOrder(val);
    return this._submit('__model.Order', result, 'null', value, false );
  }
  listen(value: any = false, submit: boolean = true): Observable<__model.Order> {
    if (submit) {
      this.submit(value);
    }
    return this._listen(value, submit);
  }


  reset(value?: any): void {
    this.form.reset();
    super.reset(value, false); 
  }
  patch(value: any): void {
    this.form.patchValue(value);
  }
}
