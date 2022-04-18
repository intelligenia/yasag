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
        id: new FormControl({value: undefined, disabled: false}, []),
        username: new FormControl({value: undefined, disabled: false}, []),
        firstName: new FormControl({value: undefined, disabled: false}, []),
        lastName: new FormControl({value: undefined, disabled: false}, []),
        email: new FormControl({value: undefined, disabled: false}, []),
        password: new FormControl({value: undefined, disabled: false}, []),
        phone: new FormControl({value: undefined, disabled: false}, []),
        userStatus: new FormControl({value: undefined, disabled: false}, []),
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
