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
export class PetUploadImageFormService extends YASAGPostFormService<__model.ApiResponse> {
  constructor(
    apiConfigService: APIConfigService,
    ngZone: NgZone,
    private service: PetService,
  ) {
    super('PetUploadImage', apiConfigService, ngZone);
    this.form = new FormGroup({
      petId: new FormControl<number|null>({value: undefined, disabled: false}, [Validators.required]),
      additionalMetadata: new FormControl<string|null>({value: undefined, disabled: false}, []),
      file: new FormControl<File|null>({value: undefined, disabled: false}, []),
    });
    this.init()
  }

  submit(value: any = false): Observable<__model.ApiResponse> {
    const result = val => this.service.uploadImage(val);
    return this._submit('__model.ApiResponse', result, 'null', value, false );
  }
  listen(value: any = false, submit: boolean = true): Observable<__model.ApiResponse> {
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
