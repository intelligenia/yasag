"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const conf = require("../conf");
const utils_1 = require("../utils");
/**
 * Creates the FormService Abstract class
 * @param config: global configuration for YASAG
 */
function createServiceGetAbstractClass(config) {
    const content = `
  import { FormGroup } from '@angular/forms';
  import { NgZone } from '@angular/core';
  import { ReplaySubject, Observable, throwError } from 'rxjs';
  import { catchError, map } from 'rxjs/operators';
  import { environment } from 'environments/environment';
  import { APIConfigService } from '../apiconfig.service';
  import * as moment from 'moment';


  export abstract class YASAGGetFormService<Type> {
    defaultValue: any;
    serverErrors$: Observable<any>;
    loading$: Observable<boolean>;
    currentValue: any;
    patchInitialValue: any;
    form: FormGroup;
    multipart = false;

    protected serverErrorsSubject: ReplaySubject<any>;
    protected loadingSubject: ReplaySubject<boolean>;
    protected cacheSub: any;
    protected cache: string;


    constructor(className: string, protected  apiConfigService: APIConfigService, protected  ngZone: NgZone) {
      this.cache = className;
    }

    init() {
      this.serverErrorsSubject = new ReplaySubject<any>(1);
      this.serverErrors$ = this.serverErrorsSubject.asObservable();
      this.loadingSubject = new ReplaySubject<boolean>(1);
      this.loading$ = this.loadingSubject.asObservable();
      this.cacheSub = {};
      this.defaultValue = this.form.value;
    }

    protected _submit(type: string,  result: Observable<Type>, value: any = false, cache: boolean = true, only_cache: boolean = false): Observable<Type> {

      value = value || this.form.value;

      const cacheKey = JSON.stringify(value) + cache + moment().format('HHMMss');

      if ( this.cacheSub[cacheKey] ) {
          return this.cacheSub[cacheKey].asObservable();
      }
      this.cacheSub[cacheKey] = new ReplaySubject<Type>(1);
      const subject = this.cacheSub[cacheKey];
      let cache_hit = false;

      if (type !== "void") {
        if (cache && this.apiConfigService.cache[this.cache + JSON.stringify(value) + cache]) {
           //Deep copy of cache
          let c = JSON.parse(JSON.stringify(this.apiConfigService.cache[this.cache + JSON.stringify(value) + cache]));
          subject.next(c);

          cache_hit = true;
          if (only_cache) {
            subject.complete();
            this.loadingSubject.next(false);
            delete this.cacheSub[cacheKey];
            return subject.asObservable();
          }
        }
      }
      this.loadingSubject.next(true);
      this.serverErrorsSubject.next(null);
      this.currentValue = value;
      this._try(type, result, subject, value, cache_hit, cache, cacheKey);
      return subject.asObservable();
    }

    private _try(type:string, result: Observable<Type>, subject: ReplaySubject<Type>, value: any, cache_hit: boolean, cache: boolean, cacheKey: string, waitOnRetry = 1000, maxRetries = environment.apiRetries): void {
      // Deep copy of value

      if (JSON.stringify(value) !== JSON.stringify(this.currentValue)) {
        subject.complete();
        delete this.cacheSub[cacheKey];
        return;
      }

      let cacheFunction;
      if (type === "void") {
        cacheFunction = () => {
          this.ngZone.run(() => {
            subject.next(undefined);
            if (this.apiConfigService.listeners[this.cache + JSON.stringify(value)]) {
              this.apiConfigService.listeners[this.cache + JSON.stringify(value)].subject.next();
            }
            if (this.apiConfigService.listeners[this.cache + JSON.stringify('ALL')]) {
              this.apiConfigService.listeners[this.cache + JSON.stringify('ALL')].subject.next();
            }
            subject.complete();
            delete this.cacheSub[cacheKey];
            this.loadingSubject.next(false);
          });
        };
      }else {
        cacheFunction = val => {

          this.ngZone.run(() => {
            val = JSON.parse(JSON.stringify(val));

            if (!cache_hit || JSON.stringify(this.apiConfigService.cache[this.cache + JSON.stringify(value) + cache]) !== JSON.stringify(val)) {
              this.apiConfigService.cache[this.cache + JSON.stringify(value) + true] = val;
              this.apiConfigService.cache[this.cache + JSON.stringify('ALL') + true] = val;
              subject.next(val);
            }
            if (this.apiConfigService.listeners[this.cache + JSON.stringify(value)]) {
              this.apiConfigService.listeners[this.cache + JSON.stringify(value)].subject.next(val);
            }
            if (this.apiConfigService.listeners[this.cache + JSON.stringify('ALL')]) {
              this.apiConfigService.listeners[this.cache + JSON.stringify('ALL')].subject.next(val);
            }
            subject.complete();
            delete this.cacheSub[cacheKey];
            this.loadingSubject.next(false);
          });
          return val;
        };
      }

      this.cacheSub['native_' + cacheKey] = result.pipe(

        map(cacheFunction),
        catchError(error => {
          if (error.status >= 500 && maxRetries > 0) {
            // A client-side or network error occurred. Handle it accordingly.
            setTimeout(() => this._try(type, result, subject, value, cache_hit, cache, cacheKey, waitOnRetry + 1000, maxRetries - 1), waitOnRetry);
          } else {
            // The backend returned an unsuccessful response code.
            // The response body may contain clues as to what went wrong,
            this.ngZone.run(() => {
              this.serverErrorsSubject.next(error.error);
              subject.error(error);
              subject.complete();
              delete this.cacheSub[cacheKey];
              this.loadingSubject.next(false);
            });
          }
          return throwError(error);
        })
      ).subscribe();
    }

    cancelPreviousRequest(): void {
      Object.keys(this.cacheSub).forEach(key => this.cacheSub[key].unsubscribe());
      this.cacheSub = {};
    }
    cleanCache(value: any = false): void {
      if (value === false) {
        value = this.form.value;
      }
      if (this.apiConfigService.cache[this.cache + JSON.stringify(value) + true]) {
        delete this.apiConfigService.cache[this.cache + JSON.stringify(value) + true];
      }
    }

    protected _listen(type:string, value: any = false, submit: boolean = true): Observable<Type> {
      let cacheValue = value;
      if (cacheValue === false) {
        cacheValue = 'ALL';
      }
      if (!this.apiConfigService.listeners[this.cache + JSON.stringify(cacheValue)]) {
        this.apiConfigService.listeners[this.cache + JSON.stringify(cacheValue)] = {fs: this, payload: cacheValue, subject: new ReplaySubject<Type>(1)};
      }
      if (this.apiConfigService.cache[this.cache + JSON.stringify(cacheValue) + true]) {
        if (type.indexOf("[]") > 0) {
          this.apiConfigService.listeners[this.cache + JSON.stringify(cacheValue)].subject.next([...this.apiConfigService.cache[this.cache + JSON.stringify(cacheValue) + true]]);
        } else if (type === "string") {
           this.apiConfigService.listeners[this.cache + JSON.stringify(cacheValue)].subject.next(this.apiConfigService.cache[this.cache + JSON.stringify(cacheValue) + true]);
        } else {
          this.apiConfigService.listeners[this.cache + JSON.stringify(cacheValue)].subject.next({...this.apiConfigService.cache[this.cache + JSON.stringify(cacheValue) + true]});
        }
      }

      return this.apiConfigService.listeners[this.cache + JSON.stringify(cacheValue)].subject.asObservable();
    }

    reset(value?: any, isPatch = false): void {
      this.form.reset();
      this.serverErrorsSubject.next(null);
      this.loadingSubject.next(false);
      this.form.patchValue(this.defaultValue);
      if (value) {
        this.form.patchValue(value);
      }
      if (isPatch){
        this.patchInitialValue = this.form.value;
      }
    }

    patch(value: any): void {
      this.form.patchValue(value);
    }

  }`;
    const classFileName = path.join(config.dest, conf.storeDir, `yasag-get.service.ts`);
    utils_1.writeFile(classFileName, content, config.header);
}
exports.createServiceGetAbstractClass = createServiceGetAbstractClass;
//# sourceMappingURL=service-get-abstract.js.map