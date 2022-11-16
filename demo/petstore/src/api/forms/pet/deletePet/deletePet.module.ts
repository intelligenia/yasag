/* tslint:disable:max-line-length */

import {NgModule} from '@angular/core';

import {PetService} from '../../../controllers/Pet';
import {FormsSharedModule} from '../../forms-shared.module';
import {PetDeletePetFormService} from './deletePet.service';


@NgModule({
  imports: [
    FormsSharedModule,
  ],
  providers: [
    PetService,
    PetDeletePetFormService,
  ],
})
export class PetDeletePetModule {}
