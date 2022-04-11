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

import { YASAGGetFormService } from '../../yasag-get.service';


@Injectable()
export class UserLoginFormService extends YASAGGetFormService<string> {
  constructor(
    apiConfigService: APIConfigService,
    ngZone: NgZone,
    private service: UserService,
  ) {
    super('UserLogin', apiConfigService, ngZone);
    this.form = new FormGroup({
      username: new FormControl({value: undefined, disabled: false}, [Validators.required]),
      password: new FormControl({value: undefined, disabled: false}, [Validators.required]),
    });
    this.init()
  }

  submit(value: any = false, cache = true, only_cache = false): Observable<string> {
    const result = this.service.login(value || this.form.value, this.multipart);
    return this._submit('string', result, value, cache, only_cache );
  }
  listen(value: any = false, submit: boolean = true): Observable<string> {
    if (submit) {
      this.submit(value);
    }
    return this._listen('string', value, submit);
  }


}
