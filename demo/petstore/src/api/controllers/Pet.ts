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

import {HttpClient, HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import { APIConfigService } from '../apiconfig.service';

import * as __utils from '../yasag-utils';

import * as __model from '../model';

export interface AddPetParams {
  /** Pet object that needs to be added to the store */
  body: __model.Pet;
}

export interface UpdatePetParams {
  /** Pet object that needs to be added to the store */
  body: __model.Pet;
}

export interface FindByStatusParams {
  /** Status values that need to be considered for filter */
  status: StatusFindByStatusParamsEnum[];
}

export type StatusFindByStatusParamsEnum =
  'available' |
  'pending' |
  'sold';

export interface FindByTagsParams {
  /** Tags to filter by */
  tags: string[];
}

export interface GetPetByIdParams {
  /**
   * ID of pet to return
   * format: int64
   */
  petId: number;
}

export interface UpdatePetWithFormParams {
  /**
   * ID of pet that needs to be updated
   * format: int64
   */
  petId: number;
  /** Updated name of the pet */
  name?: string;
  /** Updated status of the pet */
  status?: string;
}

export interface DeletePetParams {
  /**
   * Pet id to delete
   * format: int64
   */
  petId: number;
}

export interface UploadImageParams {
  /**
   * ID of pet to update
   * format: int64
   */
  petId: number;
  /** Additional data to pass to server */
  additionalMetadata?: string;
  /** file to upload */
  file?: File;
}

@Injectable()
export class PetService {
  constructor(
    private http: HttpClient,
    private apiConfigService: APIConfigService) {}


  /** Add a new pet to the store */
  addPet(params: AddPetParams, multipart = false): Observable<string> {
    const bodyParams = params.body;
    const bodyParamsWithoutUndefined = __utils.getBodyParamsWithoutUndefined(multipart, bodyParams);

    return this.http.post(this.apiConfigService.options.apiUrl + `/v2/pet`, bodyParamsWithoutUndefined, {responseType: 'text'});
  }

  /** Update an existing pet */
  updatePet(params: UpdatePetParams, multipart = false): Observable<string> {
    const bodyParams = params.body;
    const bodyParamsWithoutUndefined = __utils.getBodyParamsWithoutUndefined(multipart, bodyParams);

    return this.http.put(this.apiConfigService.options.apiUrl + `/v2/pet`, bodyParamsWithoutUndefined, {responseType: 'text'});
  }

  /**
   * Finds Pets by status
   * Multiple status values can be provided with comma separated strings
   */
  findByStatus(params: FindByStatusParams, multipart = false): Observable<__model.Pet[]> {
    const queryParamBase = {
      status: params.status,
    };

    let queryParams = __utils.getQueryParams(queryParamBase);

    return this.http.get<__model.Pet[]>(this.apiConfigService.options.apiUrl + `/v2/pet/findByStatus`, {params: queryParams});
  }

  /**
   * Finds Pets by tags
   * Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
   */
  findByTags(params: FindByTagsParams, multipart = false): Observable<__model.Pet[]> {
    const queryParamBase = {
      tags: params.tags,
    };

    let queryParams = __utils.getQueryParams(queryParamBase);

    return this.http.get<__model.Pet[]>(this.apiConfigService.options.apiUrl + `/v2/pet/findByTags`, {params: queryParams});
  }

  /**
   * Find pet by ID
   * Returns a single pet
   */
  getPetById(params: GetPetByIdParams, multipart = false): Observable<__model.Pet> {
    const pathParams = {
      petId: params.petId,
    };
    return this.http.get<__model.Pet>(this.apiConfigService.options.apiUrl + `/v2/pet/${pathParams.petId}`);
  }

  /** Updates a pet in the store with form data */
  updatePetWithForm(params: UpdatePetWithFormParams, multipart = false): Observable<string> {
    const pathParams = {
      petId: params.petId,
    };
    const formDataParams = {
      name: params.name,
      status: params.status,
    };
    return this.http.post(this.apiConfigService.options.apiUrl + `/v2/pet/${pathParams.petId}`, formDataParams, {responseType: 'text'});
  }

  /** Deletes a pet */
  deletePet(params: DeletePetParams, multipart = false): Observable<string> {
    const pathParams = {
      petId: params.petId,
    };
    return this.http.delete(this.apiConfigService.options.apiUrl + `/v2/pet/${pathParams.petId}`, {responseType: 'text'});
  }

  /** uploads an image */
  uploadImage(params: UploadImageParams, multipart = false): Observable<__model.ApiResponse> {
    const pathParams = {
      petId: params.petId,
    };
    const formDataParams = {
      additionalMetadata: params.additionalMetadata,
      file: params.file,
    };
    return this.http.post<__model.ApiResponse>(this.apiConfigService.options.apiUrl + `/v2/pet/${pathParams.petId}/uploadImage`, formDataParams);
  }
}
