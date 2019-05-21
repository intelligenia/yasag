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
