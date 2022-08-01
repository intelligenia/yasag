/* tslint:disable:max-line-length */

import {NgModule} from '@angular/core';

import { StoreInventoryModule } from './inventory/inventory.module';
import { StorePlaceOrderModule } from './placeOrder/placeOrder.module';
import { StoreGetOrderByIdModule } from './getOrderById/getOrderById.module';
import { StoreDeleteOrderModule } from './deleteOrder/deleteOrder.module';

@NgModule({
  imports: [
    StoreInventoryModule,
    StorePlaceOrderModule,
    StoreGetOrderByIdModule,
    StoreDeleteOrderModule,
  ],
  exports: [
    StoreInventoryModule,
    StorePlaceOrderModule,
    StoreGetOrderByIdModule,
    StoreDeleteOrderModule,
  ],
})
export class StoreFormModule {}
