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
export class PetGetPetByIdFormService extends YASAGGetFormService<__model.Pet> {
  constructor(
    apiConfigService: APIConfigService,
    ngZone: NgZone,
    private service: PetService,
  ) {
    super('PetGetPetById', apiConfigService, ngZone);
    this.form = new FormGroup({
      petId: new FormControl({value: undefined, disabled: false}, [Validators.required]),
    });
    this.init()
  }

  submit(value: any = false, cache = true, only_cache = false): Observable<__model.Pet> {
    const result = this.service.getPetById(value || this.form.value, this.multipart);
    return this._submit('__model.Pet', result, value, cache, only_cache );
  }
  listen(value: any = false, submit: boolean = true): Observable<__model.Pet> {
    if (submit) {
      this.submit(value);
    }
    return this._listen('__model.Pet', value, submit);
  }


}
