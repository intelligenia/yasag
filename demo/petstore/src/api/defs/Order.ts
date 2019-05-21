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

export interface Order {
  /** format: int64 */
  id?: number;
  /** format: int64 */
  petId?: number;
  /** format: int32 */
  quantity?: number;
  /** format: date-time */
  shipDate?: string;
  /** Order Status */
  status?: StatusOrderEnum;
  complete?: boolean;
}

export type StatusOrderEnum =
  'placed' |
  'approved' |
  'delivered';
