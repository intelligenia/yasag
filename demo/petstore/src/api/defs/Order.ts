/* tslint:disable:max-line-length */

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
