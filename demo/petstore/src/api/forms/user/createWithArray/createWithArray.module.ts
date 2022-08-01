/* tslint:disable:max-line-length */

import {NgModule} from '@angular/core';

import {UserService} from '../../../controllers/User';
import {FormsSharedModule} from '../../forms-shared.module';
import {UserCreateWithArrayFormService} from './createWithArray.service';


@NgModule({
  imports: [
    FormsSharedModule,
  ],
  providers: [
    UserService,
    UserCreateWithArrayFormService,
  ],
})
export class UserCreateWithArrayModule {}
