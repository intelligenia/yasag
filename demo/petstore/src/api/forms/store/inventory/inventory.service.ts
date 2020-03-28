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
import {FormGroup} from '@angular/forms';
import { ReplaySubject, Observable, throwError } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { StoreService } from '../../../controllers/Store';
import * as __model from '../../../model';
import { environment } from 'environments/environment';
import { APIConfigService } from '../../../apiconfig.service';


@Injectable()
export class StoreInventoryFormService {
  form: FormGroup;
  defaultValue: any;
  serverErrors$: Observable<any>;
  private serverErrorsSubject: ReplaySubject<any>;
  loading$: Observable<boolean>;
  private loadingSubject: ReplaySubject<boolean>;
  currentValue: any;
  private cacheSub: any;
  private cache: string;
  constructor(
    private storeService: StoreService,
    private apiConfigService: APIConfigService,
  ) {
    this.form = new FormGroup({

    });
    this.defaultValue = this.form.value;
    this.serverErrorsSubject = new ReplaySubject<any>(1);
    this.serverErrors$ = this.serverErrorsSubject.asObservable();
    this.loadingSubject = new ReplaySubject<boolean>(1);
    this.loading$ = this.loadingSubject.asObservable();
    this.cacheSub = {};
    this.cache = 'StoreInventory';
  }

  submit(value: any = false, cache: boolean = true, only_cache: boolean = false): Observable<{[key: string]: number}> {
    if (value === false) {
      value = this.form.value;
    }
    if ( this.cacheSub[JSON.stringify(value) + cache] ) {
        return this.cacheSub[JSON.stringify(value) + cache].asObservable();
    }
    this.cacheSub[JSON.stringify(value) + cache] = new ReplaySubject<{[key: string]: number}>(1);
    const subject = this.cacheSub[JSON.stringify(value) + cache];
    let cache_hit = false;
    if (cache && this.apiConfigService.cache[this.cache + JSON.stringify(value) + cache]) {
      subject.next({...this.apiConfigService.cache[this.cache + JSON.stringify(value) + cache]});
      cache_hit = true;
      if (only_cache) {
        subject.complete();
        this.loadingSubject.next(false);
        delete this.cacheSub[JSON.stringify(value) + cache];
        return subject.asObservable();
      }
    }
    this.loadingSubject.next(true);
    this.serverErrorsSubject.next(null);
    this.currentValue = value;
    this.try(subject, value, cache_hit, cache);
    return subject.asObservable();
  }
  try(subject: ReplaySubject<{[key: string]: number}>, value: any, cache_hit: boolean, cache: boolean, waitOnRetry = 1000, maxRetries = environment.apiRetries): void {
    if (JSON.stringify(value) !== JSON.stringify(this.currentValue)) {
      subject.complete();
      delete this.cacheSub[JSON.stringify(value) + cache];
      return;
    }
    const result = this.storeService.inventory();
    result.pipe(
      map(val => {
        if (!cache_hit || JSON.stringify(this.apiConfigService.cache[this.cache + JSON.stringify(value) + cache]) !== JSON.stringify(val)) {
          if (cache) {
            this.apiConfigService.cache[this.cache + JSON.stringify(value) + cache] = val;
          }
          subject.next({...val});
        }
        subject.complete();
        delete this.cacheSub[JSON.stringify(value) + cache];
        this.loadingSubject.next(false);
        return val;
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
            delete this.cacheSub[JSON.stringify(value) + cache];
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
  patch(value: any): void {
    this.form.patchValue(value);
  }
}
