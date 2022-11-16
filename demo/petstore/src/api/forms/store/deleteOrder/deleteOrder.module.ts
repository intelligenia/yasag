/* tslint:disable:max-line-length */

import {NgModule} from '@angular/core';

import {StoreService} from '../../../controllers/Store';
import {FormsSharedModule} from '../../forms-shared.module';
import {StoreDeleteOrderFormService} from './deleteOrder.service';


@NgModule({
  imports: [
    FormsSharedModule,
  ],
  providers: [
    StoreService,
    StoreDeleteOrderFormService,
  ],
})
export class StoreDeleteOrderModule {}
