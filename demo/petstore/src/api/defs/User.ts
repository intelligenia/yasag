/* tslint:disable:max-line-length */

export interface User {
  /** format: int64 */
  id?: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phone?: string;
  /**
   * User Status
   * format: int32
   */
  userStatus?: number;
}
