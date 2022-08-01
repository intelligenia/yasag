/* tslint:disable:max-line-length */

import {NgModule} from '@angular/core';

import {PetService} from '../../../controllers/Pet';
import {FormsSharedModule} from '../../forms-shared.module';
import {PetUpdatePetWithFormFormService} from './updatePetWithForm.service';


@NgModule({
  imports: [
    FormsSharedModule,
  ],
  providers: [
    PetService,
    PetUpdatePetWithFormFormService,
  ],
})
export class PetUpdatePetWithFormModule {}
