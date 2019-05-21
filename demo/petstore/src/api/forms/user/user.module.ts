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

import {NgModule} from '@angular/core';

import { UserCreateUserModule } from './createUser/createUser.module';
import { UserCreateWithArrayModule } from './createWithArray/createWithArray.module';
import { UserCreateWithListModule } from './createWithList/createWithList.module';
import { UserLoginModule } from './login/login.module';
import { UserLogoutModule } from './logout/logout.module';
import { UserGetUserByNameModule } from './getUserByName/getUserByName.module';
import { UserUpdateUserModule } from './updateUser/updateUser.module';
import { UserDeleteUserModule } from './deleteUser/deleteUser.module';

@NgModule({
  imports: [
    UserCreateUserModule,
    UserCreateWithArrayModule,
    UserCreateWithListModule,
    UserLoginModule,
    UserLogoutModule,
    UserGetUserByNameModule,
    UserUpdateUserModule,
    UserDeleteUserModule,
  ],
  exports: [
    UserCreateUserModule,
    UserCreateWithArrayModule,
    UserCreateWithListModule,
    UserLoginModule,
    UserLogoutModule,
    UserGetUserByNameModule,
    UserUpdateUserModule,
    UserDeleteUserModule,
  ],
})
export class UserFormModule {}
