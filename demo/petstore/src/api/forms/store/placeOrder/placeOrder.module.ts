/* tslint:disable:max-line-length */

import {NgModule} from '@angular/core';

import {StoreService} from '../../../controllers/Store';
import {FormsSharedModule} from '../../forms-shared.module';
import {StorePlaceOrderFormService} from './placeOrder.service';


@NgModule({
  imports: [
    FormsSharedModule,
  ],
  providers: [
    StoreService,
    StorePlaceOrderFormService,
  ],
})
export class StorePlaceOrderModule {}
