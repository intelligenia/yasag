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

import {HttpClient, HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import { APIConfigService } from '../apiconfig.service';

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
   * http://petstore.swagger.io/swagger/swagger-ui.html#!/user/createUser
   */
  createUser(params: CreateUserParams): Observable<string> {
    const bodyParams = params.body;
    const bodyParamsWithoutUndefined: any = {};
    Object.entries(bodyParams || {}).forEach(([key, value]) => {
      if (value !== undefined) {
        bodyParamsWithoutUndefined[key] = value;
      }
    });
    return this.http.post(this.apiConfigService.options.apiUrl + `/v2/user`, bodyParamsWithoutUndefined, {responseType: 'text'});
  }

  /**
   * Creates list of users with given input array
   * http://petstore.swagger.io/swagger/swagger-ui.html#!/user/createUsersWithArrayInput
   */
  createWithArray(params: CreateWithArrayParams): Observable<string> {
    const bodyParams = params.body;
    const bodyParamsWithoutUndefined: any = {};
    Object.entries(bodyParams || {}).forEach(([key, value]) => {
      if (value !== undefined) {
        bodyParamsWithoutUndefined[key] = value;
      }
    });
    return this.http.post(this.apiConfigService.options.apiUrl + `/v2/user/createWithArray`, bodyParamsWithoutUndefined, {responseType: 'text'});
  }

  /**
   * Creates list of users with given input array
   * http://petstore.swagger.io/swagger/swagger-ui.html#!/user/createUsersWithListInput
   */
  createWithList(params: CreateWithListParams): Observable<string> {
    const bodyParams = params.body;
    const bodyParamsWithoutUndefined: any = {};
    Object.entries(bodyParams || {}).forEach(([key, value]) => {
      if (value !== undefined) {
        bodyParamsWithoutUndefined[key] = value;
      }
    });
    return this.http.post(this.apiConfigService.options.apiUrl + `/v2/user/createWithList`, bodyParamsWithoutUndefined, {responseType: 'text'});
  }

  /**
   * Logs user into the system
   * http://petstore.swagger.io/swagger/swagger-ui.html#!/user/loginUser
   */
  login(params: LoginParams): Observable<string> {
    const queryParamBase = {
      username: params.username,
      password: params.password,
    };

    let queryParams = new HttpParams();
    Object.entries(queryParamBase).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          let val = '';
          value.forEach(v => val += v + ',');
          if (val.length > 0 ) {
            val = val.slice(0, val.length - 1);
          }
          queryParams = queryParams.set(key, val);
        } else if (typeof value === 'string') {
          queryParams = queryParams.set(key, value);
        } else {
          queryParams = queryParams.set(key, JSON.stringify(value));
        }
      }
    });

    return this.http.get(this.apiConfigService.options.apiUrl + `/v2/user/login`, {params: queryParams, responseType: 'text'});
  }

  /**
   * Logs out current logged in user session
   * http://petstore.swagger.io/swagger/swagger-ui.html#!/user/logoutUser
   */
  logout(): Observable<string> {
    return this.http.get(this.apiConfigService.options.apiUrl + `/v2/user/logout`, {responseType: 'text'});
  }

  /**
   * Get user by user name
   * http://petstore.swagger.io/swagger/swagger-ui.html#!/user/getUserByName
   */
  getUserByName(params: GetUserByNameParams): Observable<__model.User> {
    const pathParams = {
      username: params.username,
    };
    return this.http.get<__model.User>(this.apiConfigService.options.apiUrl + `/v2/user/${pathParams.username}`);
  }

  /**
   * Updated user
   * This can only be done by the logged in user.
   * http://petstore.swagger.io/swagger/swagger-ui.html#!/user/updateUser
   */
  updateUser(params: UpdateUserParams): Observable<string> {
    const pathParams = {
      username: params.username,
    };
    const bodyParams = params.body;
    const bodyParamsWithoutUndefined: any = {};
    Object.entries(bodyParams || {}).forEach(([key, value]) => {
      if (value !== undefined) {
        bodyParamsWithoutUndefined[key] = value;
      }
    });
    return this.http.put(this.apiConfigService.options.apiUrl + `/v2/user/${pathParams.username}`, bodyParamsWithoutUndefined, {responseType: 'text'});
  }

  /**
   * Delete user
   * This can only be done by the logged in user.
   * http://petstore.swagger.io/swagger/swagger-ui.html#!/user/deleteUser
   */
  deleteUser(params: DeleteUserParams): Observable<string> {
    const pathParams = {
      username: params.username,
    };
    return this.http.delete(this.apiConfigService.options.apiUrl + `/v2/user/${pathParams.username}`, {responseType: 'text'});
  }
}
