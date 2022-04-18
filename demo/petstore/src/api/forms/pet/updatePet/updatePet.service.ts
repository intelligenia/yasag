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
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {  Observable } from 'rxjs';
import { PetService } from '../../../controllers/Pet';
import * as __model from '../../../model';
import { APIConfigService } from '../../../apiconfig.service';

import * as __utils from '../../../yasag-utils';

import { YASAGPostFormService } from '../../yasag-post.service';


@Injectable()
export class PetUpdatePetFormService extends YASAGPostFormService<string> {
  constructor(
    apiConfigService: APIConfigService,
    ngZone: NgZone,
    private service: PetService,
  ) {
    super('PetUpdatePet', apiConfigService, ngZone);
    this.form = new FormGroup({
      body: new FormGroup({
        id: new FormControl({value: undefined, disabled: false}, []),
        category: new FormGroup({
          id: new FormControl({value: undefined, disabled: false}, []),
          name: new FormControl({value: undefined, disabled: false}, []),
        }, []),
        name: new FormControl({value: undefined, disabled: false}, [Validators.required]),
        photoUrls: new FormControl([], [Validators.required]),
        tags: new FormArray([], []),
        status: new FormControl({value: undefined, disabled: false}, []),
      }, [Validators.required]),
    });
    this.init()
  }

  public addBodyTags( tags: number = 1, position?: number, value?: any): void {
    const control = <FormArray>this.form['controls']['body']['controls']['tags'];
    const fg = new FormGroup({
      id: new FormControl({value: undefined, disabled: false}, []),
      name: new FormControl({value: undefined, disabled: false}, []),
    }, []);
    __utils.addField(control,tags, fg, position, value);
  }

  public removeBodyTags( i: number): void {
    const control = <FormArray>this.form['controls']['body']['controls']['tags'];
    control.removeAt(i);
  }

  submit(value: any = false): Observable<string> {
    const result = this.service.updatePet(value || this.form.value, this.multipart);
    return this._submit('string', result, 'null', value, false );
  }
  listen(value: any = false, submit: boolean = true): Observable<string> {
    if (submit) {
      this.submit(value);
    }
    return this._listen(value, submit);
  }


  reset(value?: any): void {
    this.form.reset();    while ((<FormArray>this.form['controls']['body']['controls']['tags']).length) {
      this.removeBodyTags(0);
    }
    if (value && value['body'] && value['body']['tags']) {
      this.addBodyTags(value['body']['tags'].length);
    }
    super.reset(value, false); 
  }
  patch(value: any): void {
    if (value && value['body'] && value['body']['tags']) {
      while (this.form.value['body']['tags'].length > 0) {
        this.removeBodyTags(0);
      }
      if (value['body']['tags'].length > this.form.value['body']['tags'].length) {
        this.addBodyTags(value['body']['tags'].length - this.form.value['body']['tags'].length);
      }
    }
    this.form.patchValue(value);
  }
}
