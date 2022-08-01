/* tslint:disable:max-line-length */

import {NgModule} from '@angular/core';

import { PetFormModule } from './pet/pet.module';
import { StoreFormModule } from './store/store.module';
import { UserFormModule } from './user/user.module';

@NgModule({
  imports: [
    PetFormModule,
    StoreFormModule,
    UserFormModule,
  ],
  exports: [
    PetFormModule,
    StoreFormModule,
    UserFormModule,
  ],
})
export class ApiFormsModule {}
