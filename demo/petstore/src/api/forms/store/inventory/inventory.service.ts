/* tslint:disable:max-line-length */

import { Injectable, NgZone } from '@angular/core';
import {FormGroup} from '@angular/forms';
import {  Observable } from 'rxjs';
import { StoreService } from '../../../controllers/Store';
import * as __model from '../../../model';
import { APIConfigService } from '../../../apiconfig.service';

import * as __utils from '../../../yasag-utils';

import { YASAGGetFormService } from '../../yasag-get.service';


@Injectable()
export class StoreInventoryFormService extends YASAGGetFormService<{[key: string]: number}> {
  constructor(
    apiConfigService: APIConfigService,
    ngZone: NgZone,
    private service: StoreService,
  ) {
    super('StoreInventory', apiConfigService, ngZone);
    this.form = new FormGroup({

    });
    this.init()
  }

  submit(value: any = false, cache = true, only_cache = false): Observable<{[key: string]: number}> {
    const result = val => this.service.inventory();
    return this._submit('{[key: string]: number}', result, value, cache, only_cache );
  }
  listen(value: any = false, submit: boolean = true): Observable<{[key: string]: number}> {
    if (submit) {
      this.submit(value);
    }
    return this._listen('{[key: string]: number}', value, submit);
  }


  reset(value?: any): void {
    this.form.reset();
    super.reset(value, false); 
  }
  patch(value: any): void {
    this.form.patchValue(value);
  }
}
