/* tslint:disable:max-line-length */

import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import {Observable, ReplaySubject} from 'rxjs';

export interface FormService{
  submit(data?: any): Observable<any>;
}

@Injectable({
  providedIn: 'root'
})
export class APIConfigServiceOptions {
  public apiUrl = environment.apiUrl;
  public cacheSize = (environment["apiCacheSize"]) ? environment["apiCacheSize"] : 1000;
}
@Injectable({
  providedIn: 'root'
})
export class APIConfigService {
  public options: APIConfigServiceOptions;
  private _window: string[];
  private _cache: any;
  private _listeners: { [ k: string ]: {fs: FormService, payload: any, subject: ReplaySubject<any>} };

  get cache(): any {
    if ( Object.keys(this._cache).length >= this.options.cacheSize && this._window.length === 0 ){
      this._window = Object.keys(this._cache);
    }
    if ( Object.keys(this._cache).length >= this.options.cacheSize * 2 ){
      this._window.forEach(k => delete this._cache[k]);
      this._window = Object.keys(this._cache);
    }
    return this._cache;
  }

  get listeners(): any {
    return this._listeners;
  }

  constructor( options: APIConfigServiceOptions ) {
    this.options = options;
    this.resetCache();
    this.resetListeners();
  }

  resetCache(): void {
    this._cache = {};
    this._window = [];
  }

  resetListeners(): void {
    this._listeners = {};
  }

  launchListeners(): void {
    Object.keys(this._listeners).forEach(k => {
      if (this._listeners[k].subject.observers.length > 0){
        this._listeners[k].fs.submit(this._listeners[k].payload);
      }
    });
  }
}
