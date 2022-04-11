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

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import { APIConfigService } from '../apiconfig.service';

import * as __utils from '../yasag-utils';

import * as __model from '../model';

export interface PlaceOrderParams {
  /** order placed for purchasing the pet */
  body: __model.Order;
}

export interface GetOrderByIdParams {
  /**
   * ID of pet that needs to be fetched
   * format: int64
   */
  orderId: number;
}

export interface DeleteOrderParams {
  /**
   * ID of the order that needs to be deleted
   * format: int64
   */
  orderId: number;
}

@Injectable()
export class StoreService {
  constructor(
    private http: HttpClient,
    private apiConfigService: APIConfigService) {}


  /**
   * Returns pet inventories by status
   * Returns a map of status codes to quantities
   */
  inventory(multipart = false): Observable<{[key: string]: number}> {
    return this.http.get<{[key: string]: number}>(this.apiConfigService.options.apiUrl + `/v2/store/inventory`);
  }

  /** Place an order for a pet */
  placeOrder(params: PlaceOrderParams, multipart = false): Observable<__model.Order> {
    const bodyParams = params.body;
    const bodyParamsWithoutUndefined = __utils.getBodyParamsWithoutUndefined(multipart, bodyParams);

    return this.http.post<__model.Order>(this.apiConfigService.options.apiUrl + `/v2/store/order`, bodyParamsWithoutUndefined);
  }

  /**
   * Find purchase order by ID
   * For valid response try integer IDs with value >= 1 and <= 10. Other values will generated exceptions
   */
  getOrderById(params: GetOrderByIdParams, multipart = false): Observable<__model.Order> {
    const pathParams = {
      orderId: params.orderId,
    };
    return this.http.get<__model.Order>(this.apiConfigService.options.apiUrl + `/v2/store/order/${pathParams.orderId}`);
  }

  /**
   * Delete purchase order by ID
   * For valid response try integer IDs with positive integer value. Negative or non-integer values will generate API errors
   */
  deleteOrder(params: DeleteOrderParams, multipart = false): Observable<string> {
    const pathParams = {
      orderId: params.orderId,
    };
    return this.http.delete(this.apiConfigService.options.apiUrl + `/v2/store/order/${pathParams.orderId}`, {responseType: 'text'});
  }
}
