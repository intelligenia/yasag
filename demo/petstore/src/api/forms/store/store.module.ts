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
