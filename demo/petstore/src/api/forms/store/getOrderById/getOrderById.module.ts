/* tslint:disable:max-line-length */

import {NgModule} from '@angular/core';

import {StoreService} from '../../../controllers/Store';
import {FormsSharedModule} from '../../forms-shared.module';
import {StoreGetOrderByIdFormService} from './getOrderById.service';


@NgModule({
  imports: [
    FormsSharedModule,
  ],
  providers: [
    StoreService,
    StoreGetOrderByIdFormService,
  ],
})
export class StoreGetOrderByIdModule {}
