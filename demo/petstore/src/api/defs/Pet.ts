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

import * as __model from '../model';

export interface Pet {
  /** format: int64 */
  id?: number;
  category?: __model.Category;
  /** example: doggie */
  name: string;
  photoUrls: string[];
  tags?: __model.Tag[];
  /** pet status in the store */
  status?: StatusPetEnum;
}

export type StatusPetEnum =
  'available' |
  'pending' |
  'sold';
