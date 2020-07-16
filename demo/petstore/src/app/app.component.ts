import {Component, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {Pet} from 'api/model';
import {PetAddPetFormService, PetDeletePetFormService, PetFindByStatusFormService} from '../api/form-service';
import {finalize, map} from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'YASAG petstore';

  public petList$: Observable<Pet[]>;
  constructor(
    public petListFS: PetFindByStatusFormService,
    public petDelFS: PetDeletePetFormService,
    public petCreateFS: PetAddPetFormService
  ) {
    this.petListFS.reset({status: 'available'});
    this.petCreateFS.reset({body: {status: 'available'}});
  }

  reloadPetList(): void {
    this.petList$ = this.petListFS.submit();
  }

  deletePet(petId: number, event): void {
    this.petDelFS.submit({petId: petId}).pipe(
      map(() => this.reloadPetList())
    ).subscribe();
  }

  savePet(): void {
    this.petCreateFS.submit().pipe(
      map(() => {
        this.petListFS.reset({status: this.petCreateFS.form.value.body.status});
        this.reloadPetList();
        this.petCreateFS.reset({body: {status: 'available'}});
      })
    ).subscribe();
  }
}
