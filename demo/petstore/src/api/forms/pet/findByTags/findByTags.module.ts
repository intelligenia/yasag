/* tslint:disable:max-line-length */

import {NgModule} from '@angular/core';

import {PetService} from '../../../controllers/Pet';
import {FormsSharedModule} from '../../forms-shared.module';
import {PetFindByTagsFormService} from './findByTags.service';


@NgModule({
  imports: [
    FormsSharedModule,
  ],
  providers: [
    PetService,
    PetFindByTagsFormService,
  ],
})
export class PetFindByTagsModule {}
