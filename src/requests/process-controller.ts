/**
 * Processing of custom types from `paths` section
 * in the schema
 */
import * as _ from "lodash";
import * as path from "path";

import * as conf from "../conf";
import { ProcessedDefinition } from "../definitions";
import { createForms } from "../forms/generate-form-modules";
import { Config } from "../generate";
import { indent, writeFile } from "../utils";
import { processMethod } from "./process-method";
import { processResponses } from "./process-responses";
import { ControllerMethod, MethodOutput } from "./requests.models";

/**
 * Creates and serializes class for api communication for controller
 * @param methods
 * @param name
 * @param config
 * @param definitions
 * @param readOnly
 */
export function processController(
  methods: ControllerMethod[],
  name: string,
  config: Config,
  definitions: ProcessedDefinition[],
  readOnly: string,
): MethodOutput[] {
  const filename = path.join(config.dest, conf.apiDir, `${name}.ts`);
  let usesGlobalType = false;

  // make simpleNames unique and process responses
  const simpleNames = _.map(methods, "simpleName");
  methods.forEach((controller) => {
    if (simpleNames.filter((n) => n === controller.simpleName).length > 1) {
      const preserveCapitals = controller.operationId
        .replace(controller.method["tags"][0], "")
        .replace(/([A-Z])/g, "-$1");
      controller.simpleName = _.lowerFirst(_.camelCase(preserveCapitals));
    }

    controller.responseDef = processResponses(
      controller.responses,
      name + _.upperFirst(controller.simpleName),
      config,
    );
    usesGlobalType = usesGlobalType || controller.responseDef.usesGlobalType;
  });

  const processedMethods: MethodOutput[] = methods.map((m) =>
    processMethod(
      m,
      config.unwrapSingleParamMethods,
      config.profile.httpResource,
    ),
  );
  const emitsResource =
    config.profile.httpResource &&
    processedMethods.some((m) => m.methodName === "get");
  usesGlobalType =
    usesGlobalType || processedMethods.some((c) => c.usesGlobalType);

  let content = "";

  // HttpContext is on every generated method signature (see getParamsSignature),
  // so the import is unconditional.
  const angularCommonHttp = ["HttpClient", "HttpContext"];
  if (processedMethods.some((c) => c.usesQueryParams)) {
    angularCommonHttp.push("HttpParams");
  }
  content += `import {${angularCommonHttp.join(
    ", ",
  )}} from '@angular/common/http';\n`;

  const coreImports = ["Injectable"];
  if (config.profile.inject) coreImports.push("inject");
  if (emitsResource) coreImports.push("Signal");
  content += `import { ${coreImports.join(", ")} } from '@angular/core';\n`;
  if (emitsResource) {
    content += "import { rxResource } from '@angular/core/rxjs-interop';\n";
  }
  content += "import {Observable} from 'rxjs';\n";
  content += "import { APIConfigService } from '../apiconfig.service';\n\n";
  content += "import * as __utils from '../yasag-utils';\n\n";

  if (usesGlobalType) {
    content += `import * as __${conf.modelFile} from '../${conf.modelFile}';\n\n`;
  }

  const interfaceDef = _.map(processedMethods, "interfaceDef")
    .filter(Boolean)
    .join("\n");
  if (interfaceDef) {
    content += interfaceDef;
    content += "\n";
  }

  content += config.profile.providedInRoot
    ? `@Injectable({ providedIn: 'root' })\n`
    : `@Injectable()\n`;
  content += `export class ${name}Service {\n`;
  if (config.profile.inject) {
    content += indent("private http = inject(HttpClient);\n");
    content += indent("private apiConfigService = inject(APIConfigService);\n");
  } else {
    content += indent("constructor(\n");
    content += indent("private http: HttpClient,\n", 2);
    content += indent("private apiConfigService: APIConfigService) {}\n", 2);
  }
  content += "\n";
  content += indent(_.map(processedMethods, "methodDef").join("\n\n"));
  content += "\n}\n";

  if (conf.adHocExceptions.api[name]) {
    content = content.replace(
      conf.adHocExceptions.api[name][0],
      conf.adHocExceptions.api[name][1],
    );
  }
  /* controllers */
  writeFile(filename, content, config.header);

  /* forms */
  if (config.generateStore) {
    createForms(config, name, processedMethods, definitions, readOnly);
  }

  return processedMethods;
}
