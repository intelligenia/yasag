/* tslint:disable:max-line-length */

import { Injectable, NgZone } from '@angular/core';
import {FormGroup, Validators} from '@angular/forms';
import {  Observable } from 'rxjs';
import { UserService } from '../../../controllers/User';
import * as __model from '../../../model';
import { APIConfigService } from '../../../apiconfig.service';

import * as __utils from '../../../yasag-utils';

import { YASAGGetFormService } from '../../yasag-get.service';


@Injectable()
export class UserGetUserByNameFormService extends YASAGGetFormService<__model.User> {
  constructor(
    apiConfigService: APIConfigService,
    ngZone: NgZone,
    private service: UserService,
  ) {
    super('UserGetUserByName', apiConfigService, ngZone);
    this.form = new FormGroup({
      username: new FormControl<string|null>({value: undefined, disabled: false}, [Validators.required]),
    });
    this.init()
  }

  submit(value: any = false, cache = true, only_cache = false): Observable<__model.User> {
    const result = val => this.service.getUserByName(val);
    return this._submit('__model.User', result, value, cache, only_cache );
  }
  listen(value: any = false, submit: boolean = true): Observable<__model.User> {
    if (submit) {
      this.submit(value);
    }
    return this._listen('__model.User', value, submit);
  }


  reset(value?: any): void {
    this.form.reset();
    super.reset(value, false); 
  }
  patch(value: any): void {
    this.form.patchValue(value);
  }
}
