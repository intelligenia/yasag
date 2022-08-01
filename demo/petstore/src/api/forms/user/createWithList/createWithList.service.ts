/* tslint:disable:max-line-length */

import { Injectable, NgZone } from '@angular/core';
import {FormArray, FormGroup, Validators} from '@angular/forms';
import {  Observable } from 'rxjs';
import { UserService } from '../../../controllers/User';
import * as __model from '../../../model';
import { APIConfigService } from '../../../apiconfig.service';

import * as __utils from '../../../yasag-utils';

import { YASAGPostFormService } from '../../yasag-post.service';


@Injectable()
export class UserCreateWithListFormService extends YASAGPostFormService<string> {
  constructor(
    apiConfigService: APIConfigService,
    ngZone: NgZone,
    private service: UserService,
  ) {
    super('UserCreateWithList', apiConfigService, ngZone);
    this.form = new FormGroup({
      body: new FormArray([], [Validators.required]),
    });
    this.init()
  }

  public addBody( body: number = 1, position?: number, value?: any): void {
    const control = <FormArray>this.form['controls']['body'];
    const fg = new FormGroup({
      id: new FormControl<number|null>({value: undefined, disabled: false}, []),
      username: new FormControl<string|null>({value: undefined, disabled: false}, []),
      firstName: new FormControl<string|null>({value: undefined, disabled: false}, []),
      lastName: new FormControl<string|null>({value: undefined, disabled: false}, []),
      email: new FormControl<string|null>({value: undefined, disabled: false}, []),
      password: new FormControl<string|null>({value: undefined, disabled: false}, []),
      phone: new FormControl<string|null>({value: undefined, disabled: false}, []),
      userStatus: new FormControl<number|null>({value: undefined, disabled: false}, []),
    }, []);
    __utils.addField(control,body, fg, position, value);
  }

  public removeBody( i: number): void {
    const control = <FormArray>this.form['controls']['body'];
    control.removeAt(i);
  }

  submit(value: any = false): Observable<string> {
    const result = val => this.service.createWithList(val);
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
    while ((<FormArray>this.form['controls']['body']).length) {
      this.removeBody(0);
    }
    if (value && value['body']) {
      this.addBody(value['body'].length);
    }
    super.reset(value, false); 
  }
  patch(value: any): void {
    if (value && value['body']) {
      while (this.form.value['body'].length > 0) {
        this.removeBody(0);
      }
      if (value['body'].length > this.form.value['body'].length) {
        this.addBody(value['body'].length - this.form.value['body'].length);
      }
    }
    this.form.patchValue(value);
  }
}
