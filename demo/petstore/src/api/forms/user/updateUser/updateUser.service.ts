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
import {FormControl, FormGroup, Validators} from '@angular/forms';
import { ReplaySubject, Observable, throwError } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { UserService } from '../../../controllers/User';
import * as __model from '../../../model';
import { environment } from 'environments/environment';

@Injectable()
export class UserUpdateUserFormService {
  form: FormGroup;
  defaultValue: any;
  serverErrors$: Observable<any>;
  private serverErrorsSubject: ReplaySubject<any>;
  loading$: Observable<boolean>;
  private loadingSubject: ReplaySubject<boolean>;
  currentValue: any;
  private cache: any;
  private cacheSub: any;
  constructor(
    private userService: UserService,
  ) {
    this.form = new FormGroup({
      username: new FormControl({value: undefined, disabled: false}, [Validators.required]),
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
    this.defaultValue = this.form.value;
    this.serverErrorsSubject = new ReplaySubject<any>(1);
    this.serverErrors$ = this.serverErrorsSubject.asObservable();
    this.loadingSubject = new ReplaySubject<boolean>(1);
    this.loading$ = this.loadingSubject.asObservable();
    this.cache = {};
    this.cacheSub = {};
  }

  submit(value: any = false): Observable<void> {
    const cache = false;
    const only_cache = false;
    if (value === false) {
      value = this.form.value;
    }
    if ( this.cacheSub[JSON.stringify(value)] ) {
        return this.cacheSub[JSON.stringify(value)].asObservable();
    }
    this.cacheSub[JSON.stringify(value)] = new ReplaySubject<void>(1);
    const subject = this.cacheSub[JSON.stringify(value)];
    let cache_hit = false;
    this.loadingSubject.next(true);
    this.serverErrorsSubject.next(null);
    this.currentValue = value;
    this.try(subject, value, cache_hit, cache);
    return subject.asObservable();
  }
  try(subject: ReplaySubject<void>, value: any, cache_hit: boolean, cache: boolean, waitOnRetry = 1000, maxRetries = environment.apiRetries): void {
    const result = this.userService.updateUser(value);
    result.pipe(
      map(() => {
        subject.next();
        subject.complete();
        delete this.cacheSub[JSON.stringify(value)];
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        if (error.status >= 500 && maxRetries > 0) {
            // A client-side or network error occurred. Handle it accordingly.
            setTimeout(() => this.try(subject, value, cache_hit, cache, waitOnRetry + 1000, maxRetries - 1), waitOnRetry);
        } else {
            // The backend returned an unsuccessful response code.
            // The response body may contain clues as to what went wrong,
            this.serverErrorsSubject.next(error.error);
            subject.error(error);
            subject.complete();
            delete this.cacheSub[JSON.stringify(value)];
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
    this.serverErrorsSubject.next(null);
    this.loadingSubject.next(false);
    this.form.patchValue(this.defaultValue);
    if (value) {
      this.form.patchValue(value);
    }
  }
}
