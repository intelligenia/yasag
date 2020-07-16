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

import { Injectable } from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import { ReplaySubject, Observable, throwError } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { UserService } from '../../../controllers/User';
import * as __model from '../../../model';
import { environment } from 'environments/environment';
import { APIConfigService } from '../../../apiconfig.service';

import * as moment from 'moment';


@Injectable()
export class UserCreateWithArrayFormService {
  form: FormGroup;
  defaultValue: any;
  serverErrors$: Observable<any>;
  private serverErrorsSubject: ReplaySubject<any>;
  loading$: Observable<boolean>;
  private loadingSubject: ReplaySubject<boolean>;
  private cacheSub: any;
  private cache: string;
  constructor(
    private userService: UserService,
    private apiConfigService: APIConfigService,
  ) {
    this.form = new FormGroup({
      body: new FormArray([], [Validators.required]),
    });
    this.defaultValue = this.form.value;
    this.serverErrorsSubject = new ReplaySubject<any>(1);
    this.serverErrors$ = this.serverErrorsSubject.asObservable();
    this.loadingSubject = new ReplaySubject<boolean>(1);
    this.loading$ = this.loadingSubject.asObservable();
    this.cacheSub = {};
    this.cache = 'UserCreateWithArray';
  }

  public addBody( body: number = 1, position?: number): void {
    const control = <FormArray>this.form['controls']['body'];
    for (let i = 0; i < body; i++) {
      const fg = new FormGroup({
        id: new FormControl({value: undefined, disabled: false}, []),
        username: new FormControl({value: undefined, disabled: false}, []),
        firstName: new FormControl({value: undefined, disabled: false}, []),
        lastName: new FormControl({value: undefined, disabled: false}, []),
        email: new FormControl({value: undefined, disabled: false}, []),
        password: new FormControl({value: undefined, disabled: false}, []),
        phone: new FormControl({value: undefined, disabled: false}, []),
        userStatus: new FormControl({value: undefined, disabled: false}, []),
      }, []);
      if (position !== undefined){
        control.insert(position, fg);
      } else {
        control.push(fg);
      }
    }
  }

  public removeBody( i: number): void {
    const control = <FormArray>this.form['controls']['body'];
    control.removeAt(i);
  }

  submit(value: any = false): Observable<string> {
    const cache = false;
    const only_cache = false;
    if (value === false) {
      value = this.form.value;
    }
    const cacheKey = JSON.stringify(value) + cache + moment().format('HHSS');
    if ( this.cacheSub[cacheKey] ) {
        return this.cacheSub[cacheKey].asObservable();
    }
    this.cacheSub[cacheKey] = new ReplaySubject<string>(1);
    const subject = this.cacheSub[cacheKey];
    let cache_hit = false;
    if (cache && this.apiConfigService.cache[this.cache + JSON.stringify(value) + cache]) {
      subject.next(this.apiConfigService.cache[this.cache + JSON.stringify(value) + cache]);
      cache_hit = true;
      if (only_cache) {
        subject.complete();
        this.loadingSubject.next(false);
        delete this.cacheSub[cacheKey];
        return subject.asObservable();
      }
    }
    this.loadingSubject.next(true);
    this.serverErrorsSubject.next(null);
    this.try(subject, value, cache_hit, cache, cacheKey);
    return subject.asObservable();
  }
  try(subject: ReplaySubject<string>, value: any, cache_hit: boolean, cache: boolean, cacheKey: string, waitOnRetry = 1000, maxRetries = environment.apiRetries): void {
    const result = this.userService.createWithArray(value);
    result.pipe(
      map(val => {
        if (!cache_hit || this.apiConfigService.cache[this.cache + JSON.stringify(value) + cache] !== val) {
          if (cache) {
            this.apiConfigService.cache[this.cache + JSON.stringify(value) + cache] = val;
          }
          subject.next(val);
          if(this.apiConfigService.listeners[this.cache + JSON.stringify(value)]){
            this.apiConfigService.listeners[this.cache + JSON.stringify(value)].subject.next(val);
          }
        }
        subject.complete();
        delete this.cacheSub[cacheKey];
        this.loadingSubject.next(false);
        return val;
      }),
      catchError(error => {
        if (error.status >= 500 && maxRetries > 0) {
            // A client-side or network error occurred. Handle it accordingly.
            setTimeout(() => this.try(subject, value, cache_hit, cache, cacheKey, waitOnRetry + 1000, maxRetries - 1), waitOnRetry);
        } else {
            // The backend returned an unsuccessful response code.
            // The response body may contain clues as to what went wrong,
            this.serverErrorsSubject.next(error.error);
            subject.error(error);
            subject.complete();
            delete this.cacheSub[cacheKey];
            this.loadingSubject.next(false);
        }
        return throwError(error);
      })
    ).subscribe();
  }
  cancelPreviousRequest(): void {
    Object.keys(this.cacheSub).forEach(key => this.cacheSub[key].unsubscribe());
    this.cacheSub = {};
  }


  reset(value?: any): void {
    this.form.reset();
    while ((<FormArray>this.form['controls']['body']).length) {
      this.removeBody(0);
    }
    if (value && value['body']) {
      this.addBody(value['body'].length);
    }
    this.serverErrorsSubject.next(null);
    this.loadingSubject.next(false);
    this.form.patchValue(this.defaultValue);
    if (value) {
      this.form.patchValue(value);
    }
  }
  patch(value: any): void {
    if (value && value['body']) {
      if (value['body'].length > this.form.value['body'].length) {
        this.addBody(value['body'].length - this.form.value['body'].length);
      }
    }
    this.form.patchValue(value);
  }
}
