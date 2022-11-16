/* tslint:disable:max-line-length */

import { Injectable, NgZone } from '@angular/core';
import {FormGroup, Validators} from '@angular/forms';
import {  Observable } from 'rxjs';
import { UserService } from '../../../controllers/User';
import * as __model from '../../../model';
import { APIConfigService } from '../../../apiconfig.service';

import * as __utils from '../../../yasag-utils';

import { YASAGPostFormService } from '../../yasag-post.service';


@Injectable()
export class UserCreateUserFormService extends YASAGPostFormService<string> {
  constructor(
    apiConfigService: APIConfigService,
    ngZone: NgZone,
    private service: UserService,
  ) {
    super('UserCreateUser', apiConfigService, ngZone);
    this.form = new FormGroup({
      body: new FormGroup({
        id: new FormControl<number|null>({value: undefined, disabled: false}, []),
        username: new FormControl<string|null>({value: undefined, disabled: false}, []),
        firstName: new FormControl<string|null>({value: undefined, disabled: false}, []),
        lastName: new FormControl<string|null>({value: undefined, disabled: false}, []),
        email: new FormControl<string|null>({value: undefined, disabled: false}, []),
        password: new FormControl<string|null>({value: undefined, disabled: false}, []),
        phone: new FormControl<string|null>({value: undefined, disabled: false}, []),
        userStatus: new FormControl<number|null>({value: undefined, disabled: false}, []),
      }, [Validators.required]),
    });
    this.init()
  }

  submit(value: any = false): Observable<string> {
    const result = val => this.service.createUser(val);
    return this._submit('string', result, 'null', value, false );
  }
  listen(value: any = false, submit: boolean = true): Observable<string> {
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
