/* tslint:disable:max-line-length */

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
