/* tslint:disable:max-line-length */

import {NgModule} from '@angular/core';

import { PetAddPetModule } from './addPet/addPet.module';
import { PetUpdatePetModule } from './updatePet/updatePet.module';
import { PetFindByStatusModule } from './findByStatus/findByStatus.module';
import { PetFindByTagsModule } from './findByTags/findByTags.module';
import { PetGetPetByIdModule } from './getPetById/getPetById.module';
import { PetUpdatePetWithFormModule } from './updatePetWithForm/updatePetWithForm.module';
import { PetDeletePetModule } from './deletePet/deletePet.module';
import { PetUploadImageModule } from './uploadImage/uploadImage.module';

@NgModule({
  imports: [
    PetAddPetModule,
    PetUpdatePetModule,
    PetFindByStatusModule,
    PetFindByTagsModule,
    PetGetPetByIdModule,
    PetUpdatePetWithFormModule,
    PetDeletePetModule,
    PetUploadImageModule,
  ],
  exports: [
    PetAddPetModule,
    PetUpdatePetModule,
    PetFindByStatusModule,
    PetFindByTagsModule,
    PetGetPetByIdModule,
    PetUpdatePetWithFormModule,
    PetDeletePetModule,
    PetUploadImageModule,
  ],
})
export class PetFormModule {}
