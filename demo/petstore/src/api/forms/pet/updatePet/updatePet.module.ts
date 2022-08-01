/* tslint:disable:max-line-length */

import {NgModule} from '@angular/core';

import {PetService} from '../../../controllers/Pet';
import {FormsSharedModule} from '../../forms-shared.module';
import {PetUpdatePetFormService} from './updatePet.service';


@NgModule({
  imports: [
    FormsSharedModule,
  ],
  providers: [
    PetService,
    PetUpdatePetFormService,
  ],
})
export class PetUpdatePetModule {}
