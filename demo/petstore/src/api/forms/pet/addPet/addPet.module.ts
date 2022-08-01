/* tslint:disable:max-line-length */

import {NgModule} from '@angular/core';

import {PetService} from '../../../controllers/Pet';
import {FormsSharedModule} from '../../forms-shared.module';
import {PetAddPetFormService} from './addPet.service';


@NgModule({
  imports: [
    FormsSharedModule,
  ],
  providers: [
    PetService,
    PetAddPetFormService,
  ],
})
export class PetAddPetModule {}
