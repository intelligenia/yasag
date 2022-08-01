/* tslint:disable:max-line-length */

import { Injectable, NgZone } from '@angular/core';
import {FormGroup, Validators} from '@angular/forms';
import {  Observable } from 'rxjs';
import { PetService } from '../../../controllers/Pet';
import * as __model from '../../../model';
import { APIConfigService } from '../../../apiconfig.service';

import * as __utils from '../../../yasag-utils';

import { YASAGPostFormService } from '../../yasag-post.service';


@Injectable()
export class PetUpdatePetWithFormFormService extends YASAGPostFormService<string> {
  constructor(
    apiConfigService: APIConfigService,
    ngZone: NgZone,
    private service: PetService,
  ) {
    super('PetUpdatePetWithForm', apiConfigService, ngZone);
    this.form = new FormGroup({
      petId: new FormControl<number|null>({value: undefined, disabled: false}, [Validators.required]),
      name: new FormControl<string|null>({value: undefined, disabled: false}, []),
      status: new FormControl<string|null>({value: undefined, disabled: false}, []),
    });
    this.init()
  }

  submit(value: any = false): Observable<string> {
    const result = val => this.service.updatePetWithForm(val);
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
