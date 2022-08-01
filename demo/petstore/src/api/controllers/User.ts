/* tslint:disable:max-line-length */

import {HttpClient, HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import { APIConfigService } from '../apiconfig.service';

import * as __utils from '../yasag-utils';

import * as __model from '../model';

export interface CreateUserParams {
  /** Created user object */
  body: __model.User;
}

export interface CreateWithArrayParams {
  /** List of user object */
  body: __model.User[];
}

export interface CreateWithListParams {
  /** List of user object */
  body: __model.User[];
}

export interface LoginParams {
  /** The user name for login */
  username: string;
  /** The password for login in clear text */
  password: string;
}

export interface GetUserByNameParams {
  /** The name that needs to be fetched. Use user1 for testing.  */
  username: string;
}

export interface UpdateUserParams {
  /** name that need to be updated */
  username: string;
  /** Updated user object */
  body: __model.User;
}

export interface DeleteUserParams {
  /** The name that needs to be deleted */
  username: string;
}

@Injectable()
export class UserService {
  constructor(
    private http: HttpClient,
    private apiConfigService: APIConfigService) {}


  /**
   * Create user
   * This can only be done by the logged in user.
   */
  createUser(params: CreateUserParams, multipart = false): Observable<string> {
    const bodyParams = params.body;
    const bodyParamsWithoutUndefined = __utils.getBodyParamsWithoutUndefined(multipart, bodyParams);

    return this.http.post(this.apiConfigService.options.apiUrl + `/v2/user`, bodyParamsWithoutUndefined, {responseType: 'text'});
  }

  /** Creates list of users with given input array */
  createWithArray(params: CreateWithArrayParams, multipart = false): Observable<string> {
    const bodyParams = params.body;
    const bodyParamsWithoutUndefined = __utils.getBodyParamsWithoutUndefined(multipart, bodyParams);

    return this.http.post(this.apiConfigService.options.apiUrl + `/v2/user/createWithArray`, bodyParamsWithoutUndefined, {responseType: 'text'});
  }

  /** Creates list of users with given input array */
  createWithList(params: CreateWithListParams, multipart = false): Observable<string> {
    const bodyParams = params.body;
    const bodyParamsWithoutUndefined = __utils.getBodyParamsWithoutUndefined(multipart, bodyParams);

    return this.http.post(this.apiConfigService.options.apiUrl + `/v2/user/createWithList`, bodyParamsWithoutUndefined, {responseType: 'text'});
  }

  /** Logs user into the system */
  login(params: LoginParams, multipart = false): Observable<string> {
    const queryParamBase = {
      username: params.username,
      password: params.password,
    };

    let queryParams = __utils.getQueryParams(queryParamBase);

    return this.http.get(this.apiConfigService.options.apiUrl + `/v2/user/login`, {params: queryParams, responseType: 'text'});
  }

  /** Logs out current logged in user session */
  logout(multipart = false): Observable<string> {
    return this.http.get(this.apiConfigService.options.apiUrl + `/v2/user/logout`, {responseType: 'text'});
  }

  /** Get user by user name */
  getUserByName(params: GetUserByNameParams, multipart = false): Observable<__model.User> {
    const pathParams = {
      username: params.username,
    };
    return this.http.get<__model.User>(this.apiConfigService.options.apiUrl + `/v2/user/${pathParams.username}`);
  }

  /**
   * Updated user
   * This can only be done by the logged in user.
   */
  updateUser(params: UpdateUserParams, multipart = false): Observable<string> {
    const pathParams = {
      username: params.username,
    };
    const bodyParams = params.body;
    const bodyParamsWithoutUndefined = __utils.getBodyParamsWithoutUndefined(multipart, bodyParams);

    return this.http.put(this.apiConfigService.options.apiUrl + `/v2/user/${pathParams.username}`, bodyParamsWithoutUndefined, {responseType: 'text'});
  }

  /**
   * Delete user
   * This can only be done by the logged in user.
   */
  deleteUser(params: DeleteUserParams, multipart = false): Observable<string> {
    const pathParams = {
      username: params.username,
    };
    return this.http.delete(this.apiConfigService.options.apiUrl + `/v2/user/${pathParams.username}`, {responseType: 'text'});
  }
}
