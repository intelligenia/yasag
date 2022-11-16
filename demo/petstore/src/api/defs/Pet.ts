/* tslint:disable:max-line-length */

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
