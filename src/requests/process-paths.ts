/**
 * Processing of custom types from `paths` section
 * in the schema
 */
import * as _ from "lodash";
import * as path from "path";
import * as conf from "../conf";
import { ProcessedDefinition } from "../definitions";
import { createFormsModule } from "../forms/forms-module";
import { createServiceGetAbstractClass } from "../forms/service-get-abstract";
import { createServicePostAbstractClass } from "../forms/service-post-abstract";
import { createUtils } from "../forms/yasag-utils";
import { Config } from "../generate";
import { ResponseDef } from "./requests.models";
import { Method, MethodName } from "../types";
import { writeFile } from "../utils";
import { createConfigService } from "./config-service";
import { processController } from "./process-controller";
import {
  ControllerMethod,
  MethodOutput,
  Paths,
  PathsWithParameters,
} from "./requests.models";

export interface ProcessedController {
  name: string;
  methods: MethodOutput[];
}

/**
 * Entry point, processes all possible api requests and exports them
 * to files devided ty controllers (same as swagger web app sections)
 * @param pathsWithParameters paths from the schema
 * @param swaggerPath swagger base url
 * @param config global configs
 * @param definitions
 * @param basePath base URL path
 * @param environmentAPI
 * @param readOnly
 */
export function processPaths(
  pathsWithParameters: PathsWithParameters,
  swaggerPath: string,
  config: Config,
  definitions: ProcessedDefinition[],
  basePath: string,
  environmentAPI: string,
  readOnly: string,
  environmentCache: string
): ProcessedController[] {
  const paths = preProcessPaths(pathsWithParameters);
  const controllers: ControllerMethod[] = _.flatMap(
    paths,
    (methods, url: string) =>
      _.map(methods, (method, methodName: MethodName) => ({
        url,
        name: getName(method),
        method,
        methodName,
        simpleName: getSimpleName(url),
        summary: method.summary,
        operationId: method.operationId,
        swaggerUrl: `${swaggerPath}${method.tags[0]}/${method.operationId}`,
        description: method.description,
        paramDef: method.parameters,
        responses: method.responses,
        responseDef: null as unknown as ResponseDef,
        basePath,
      }))
  );

  const controllerFiles = _.groupBy(controllers, "name");
  conf.controllerIgnores.forEach((key) => delete controllerFiles[key]);
  const processedControllers: ProcessedController[] = [];
  _.forEach(controllerFiles, (methods, name) => {
    const cleanName = name.replace("[", "").replace("]", "");
    const methodOutputs = processController(
      methods,
      cleanName,
      config,
      definitions,
      readOnly
    );
    processedControllers.push({ name: cleanName, methods: methodOutputs });
  });

  const modules: string[] = [];
  _.forEach(_.groupBy(controllers, "name"), (_methods, name) => {
    modules.push(name);
  });
  // The forms layer (per-operation form modules/services, their global module
  // and the aggregating form-service.ts barrel) is only generated with the
  // store enabled — see createForms() gating in process-controller. Emitting the
  // aggregators without the per-operation files they import produces
  // uncompilable output, so gate them together.
  if (config.generateStore) {
    // Create global module for forms
    if (!config.standalone) {
      createFormsModule(config, modules);
    }
    // Create the abstract classes
    createServiceGetAbstractClass(config);
    createServicePostAbstractClass(config);

    let content = "";
    controllers.forEach(
      (method) =>
        (content += `export * from './forms/${_.kebabCase(method.name)}/${
          method.simpleName
        }/${method.simpleName}.service';\n`)
    );
    const allFormServiceFileName = path.join(config.dest, `form-service.ts`);
    writeFile(allFormServiceFileName, content, config.header);
  }
  // Create utils (imported by controllers, needed regardless of the forms layer)
  createUtils(config);
  // apiconfig.service.ts
  createConfigService(config, environmentAPI, environmentCache);

  return processedControllers;
}

/**
 * Returns simple name from last static URL segment
 * example: `/accounts/${accountId}/updateMothersName` => `updateMothersName`
 * @param url
 */
function getSimpleName(url: string) {
  // remove url params
  let method = url.replace(/\/{[^}]+}/g, "");
  // remove trailing `/` if present
  method = method.replace(/\/$/, "");
  // take trailing url folder
  method = method.replace(/(.*\/)*/, "");
  // subst spaces and underscores
  method = _.camelCase(method);
  method = method.replace(/[^\w]/g, "");

  return method;
}

/**
 * Returns name of the method
 * @param method
 */
function getName(method: Method) {
  return _.upperFirst(
    _.camelCase(method.tags[0].replace(/(-rest)?-controller/, ""))
  );
}

/**
 * One of the allowed swagger formats is that under given url, there can be methods like get, post, put etc., but also
 * parameters that often defines a path parameter common for the HTTP methods.
 * This method extends HTTP method (get, post ...) parameters with the above mentioned parameters
 * @param paths
 */
function preProcessPaths(paths: PathsWithParameters): Paths {
  Object.values(paths).forEach((pathValue) => {
    if (pathValue.parameters) {
      const pathParams = pathValue.parameters;
      Object.keys(pathValue).forEach((key) => {
        if (key === "parameters") return;

        const method = pathValue[key as MethodName];
        const methodParams = method.parameters || [];
        // Deduplicate: method-level params take precedence over path-level
        const methodParamKeys = new Set(methodParams.map((p: any) => `${p.in}:${p.name}`));
        const uniquePathParams = pathParams.filter((p: any) => !methodParamKeys.has(`${p.in}:${p.name}`));
        method.parameters = methodParams.concat(uniquePathParams);
      });
    }

    delete pathValue.parameters;
  });

  return paths as Paths;
}
