/* tslint:disable:max-line-length */

import {NgModule} from '@angular/core';

import {StoreService} from '../../../controllers/Store';
import {FormsSharedModule} from '../../forms-shared.module';
import {StoreInventoryFormService} from './inventory.service';


@NgModule({
  imports: [
    FormsSharedModule,
  ],
  providers: [
    StoreService,
    StoreInventoryFormService,
  ],
})
export class StoreInventoryModule {}
