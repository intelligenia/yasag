## Purpose

Generate minimalistic TypeScript API layer for Angular with full type reflection of backend model.
- Source: [swagger scheme OpenAPI 2.0](https://swagger.io/specification/)
- Destination: [Angular-cli](https://cli.angular.io/) based [Angular 7](https://angular.io/) app.

## What is generated

### Services for back-end / API communication
- connect to your API in no-time

### Interfaces
- request and response interfaces are created

### Forms services for the HTTP RESTFULL methods
- Forms can be created by merely importing a service and using it in HTML templates (see below)
- Supports eventually HTTP Error 500 retrying the call until it works, or reach a configurable number of tries. 
  It is useful to manage temporary Internet disconnections
- Getters implements a local cache to provide a fast response, and in parallel it executes de API call. 
  Just in cases of cache update, it could throw the new data received by the API. It is possible to use only cache, 
  so first time it will go to the server, but subsequenly tries will use the saved data
- Manages several call to the same endpoint with the same payload. In that situation the FormService will execute 
  just one API call, but manage several subscriptions
- FormServices are global Services, and implements a loading emitter, therefore you can have a suscription to 
  the loading state
- FormServices support FormArray structures automatically

## Install
`npm i YASAG --save-dev`

## Options
`-s`, `--src` - source directory

`-d`, `--dest` - destination directory, default: `src/api`

`--no-store` - do not generate the ngrx modules

`-u, --swagger-URL-path` - swagger URL path, where the swagger ui documentation can be found; default: `/swagger`, i.e. the resulting address would be `http://example/swagger`

`-o, --omit-version` - disables API version information to be generated in comments for each file

`-b, --omit-basepath` - Omit basepath given in the swagger file

`-v, --environment-var` - Name of the environment variable for the base path

`-h, --omit-header` - Omit print header on each file


## Use

### Run generator

1. get the swagger scheme in JSON (typically at http(s)://[server]/[app-path]/v2/api/api-docs)
1. save it to json file in input directory and optionally **format** it for better diff
1. run via
    1. **directly** `./node_modules/.bin/yasag -s src/swagger/scheme.json -d src/api`
    1. **as module** `yasag` package, `npm run apigen`
        ```javascript
        "script": {
          "apigen": "yasag -s src/swagger/scheme.json -d src/api"
          ...
        }
        ```
    1. or **programatically** as a method invocation
        ```typescript
        import {generate} from 'yasag';
        // or using CommonJS loader
        const {generate} = require('yasag');

        generate('src/swagger/scheme.json', 'src/api');
        ```

The resulting API layer contains the following structure in the destination directory:

1. `controllers` directory stores services containing all API methods devided by controllers
1. `defs` directory stores all response interfaces and enums
1. `forms` directory has modules, which contain associated form service
1. `form-services.ts` file reexports all of the form services together for a simple access
1. `model.ts` file reexports all of them together for a simple access


### Use

In order to consume generated model, follow the steps **1-9** in the following example to use generated API model.

#### API service usage in component using FormService

```typescript
// 1. import used response interfaces
import { ItemDto, PageDto } from '[relative-path-to-destination-directory]/model';
// 2. import used API form service and optionally param interfaces
import { DataFormService } from '[relative-path-to-destination-directory]/form-service';

@Component({
  ...
  // 3. make the service injectable (can be also imported in the module)
  //    can be also imported in the app module through the apiforms.module, 
  //    which includes every FormService 
  providers: [DataFormService],
})
export class MyComponent implements OnInit {
  // 4. declare response object variables based on the generated API interfaces
  public items: ItemDto[] = [];
  public page: PageDto;

  // 5. declare request params based on the generated API interface (all params are passed together in one object)
  private params: MethodParams = {
    page: 0,
    size: 10,
    sort: ['name:asc']
  };

  // 6. inject the API service
  constructor(private dataFS: DataFormService) {}

  public ngOnInit() {
    // 7. the returned observable is fully typed
    this.dataFS
      .submit(this.params)
      // 8. returned data are fully typed
      .subscribe(data => {
        // 9. assignments are type-checked
        this.items = data.content;
        this.page = data.page;
      });
  }
}
```

#### Usage of Forms services in HTML
- the `dataFS` service is generated and holds the `FormGroup` definition that corresponds
 with the request data structure
- use it in the template the following way

```html
<form [formGroup]="dataFS.form" (ngSubmit)="dataFS.submit()" class="full-width">
    <input type="text" name="email" placeholder="email"
           formControlName="email" />
    <button type="submit"
            [disabled]="dataFS.form.invalid">Save</button>
</form>
```

- this is the corresponding component
```typescript
@Component({
  selector: 'example-component',
  templateUrl: 'example-component.html',
})
export class ExampleComponent {
  constructor(private dataFS: DataFormService) {}
}
```

#### Usage of Forms services with FormArray
- the `dataFS` service is generated and holds the `FormGroup` definition that corresponds
 with the request data structure, inside it, we have a FormArray structure to manage
- for example, we will manage an array of contacts where each contact has an email
- use it in the template the following way

```html
<form [formGroup]="dataFS.form" (ngSubmit)="dataFS.submit()" class="full-width">
  <div *ngFor="let value of dataFS.form.controls.emails.controls; let i=index">
    <div [formGroup]="value">
      <input type="text" name="email" placeholder="email"
           formControlName="email" />
      <button (click)="dataFS.removeContacts(i)">Delete</button>
    </div>
  </div>
  <button (click)="dataFS.addContacts()">Append new contact</button>
  <button type="submit"
            [disabled]="dataFS.form.invalid">Save</button>
</form>
```

- this is the corresponding component
```typescript
@Component({
  selector: 'example-component',
  templateUrl: 'example-component.html',
})
export class ExampleComponent{
  constructor(private dataFS: DataFormService) {}
}
```

#### Usage of FormServices
- each FormService has a pool of common functionalities
  - `form` (FormGroup): gives access to the internat FormGroup, so patchValue or value are reachable
  - `submit` (method) to tun the endpoint. It allows several parameters:
    - `value` (any): if not set, the submit method send the content of form.
       the passed arguments has to match with FormGroup definition
    - `cache` (boolean): by default, in `get` methods, YASAG saves the last response given the same input
      so the Observable generated by submit(), throw the saved cache if exists, and then executes the endpoint,
      in the case of a different response than the saved one, YASAG updates the caché, 
      and emmit again with the new response. If cache is set to false, YASAG does not save any response, 
      so every time has to wait until the endpoint execution ends
    - `only_cache` (boolean): it is false by default, but if it is set to true, when YASAG has a saved response
      for a given input, it does not try to execute the endpoint again, so just emit the saved cache data
  - `cancelPreviousRequest` (method) to cancel every running endpoint. This is very useful for seach endpoints 
     where the user is writing the search word, and at the same time we are getting results from the backend
  - `reset` (method) to initialize the FormService. This method gets an optional parameter with a value,
    if a value is passed, the FormGroup is set to match the corresponding value 
    (including nested objects, and nested arrays of objects)
  - `loading$` Observable to know if the endpoint is running right now or not 
    (very useful to inform the user)
  - `serverErrors$` Observable, in case of 4xx error, the endpoint response
    is emitted on serverErrors$, it is very useful to manage the errors in the HTML side

## Assumptions / limitations

1. swagger file is in [version 2](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md) format, it must be json
1. each endpoint must have a `tags` attribute defined. In addition, there must be exactly one tag defined.
The http methods are grouped to services based on the tags, i.e. if two methods have tag "order", both will be
generated inside Order.ts, and also both FormServices will be generaqted in /forms/order
1. each endpoint must have an unique operation id
1. `get` and `delete` methods do not contain `body`


## Development

* at least Node.js 8 is needed
* this project is a branch of `swagger-angular-generator` (https://github.com/jnwltr/swagger-angular-generator), 
  so YASAG could not exists without the initial help of Jan Walter

### _Pull requests are welcome!_
