/** Generator of API models (interfaces) from BE API json */
import * as fs from "fs";
import * as conf from "./conf";

import * as path from "path";
import { normalizeSchema, parseSpec } from "./adapters";
import { generateDomain, generateRepositories, generateUsecases } from "./clean-arch";
import { processDefinitions } from "./definitions";
import { processPaths } from "./requests/process-paths";
import { NormalizedSchema } from "./types";
import { NgTarget, TargetProfile, profileFor, DEFAULT_TARGET } from "./target-profile";
import { createDir, emptyDir, out, processHeader, TermColors } from "./utils";

export interface Config {
  header: string;
  dest: string;
  generateStore: boolean;
  unwrapSingleParamMethods: boolean;
  typedForms: boolean;
  cleanArchitecture: boolean;
  /** derived alias of profile.standalone (kept for downstream compatibility) */
  standalone: boolean;
  /** Angular output target profile driving idiom emission */
  profile: TargetProfile;
}

/**
 * Generates API layer for the project based on src to dest
 * @param src source swagger json schema
 * @param dest destination directory
 * @param generateStore decides if redux workflow should be generated
 * @param unwrapSingleParamMethods controls if the single param methods should be generated
 * @param swaggerUrlPath the path where the swagger ui definition can be found
 * @param omitVersion shouldn't generate API version info to generated files
 * @param omitBasepath shouldn't generate API basepath info to generated files
 * @param environmentAPI
 * @param omitHeader
 * @param readOnly
 */
export function generate(
  src: string = conf.apiFile,
  dest: string = conf.outDir,
  generateStore = true,
  unwrapSingleParamMethods = false,
  swaggerUrlPath: string = conf.swaggerUrlPath,
  omitVersion = false,
  omitBasepath = false,
  environmentAPI: string = conf.environmentAPI,
  omitHeader = false,
  typedForms = false,
  readOnly = "",
  environmentCache = conf.environmentCache,
  cleanArchitecture = false,
  target: NgTarget = DEFAULT_TARGET,
  untypedForms = false
) {
  const profile = profileFor(target);
  // Typed reactive forms follow the target default unless explicitly overridden.
  const effectiveTypedForms = untypedForms
    ? false
    : typedForms || profile.typedFormsDefault;
  let schema: NormalizedSchema;

  try {
    const content = fs.readFileSync(src).toString();
    // Accept JSON or YAML input (parseSpec tries JSON first, then YAML).
    schema = parseSpec(content);
  } catch (e) {
    if (e instanceof SyntaxError) {
      out(
        `${src} is either not a valid JSON scheme or contains non-printable characters`,
        TermColors.red
      );
    } else out(`JSON scheme file '${src}' does not exist`, TermColors.red);

    out(`${e}`);
    return;
  }

  // Normalize schema (detect version and convert to internal format)
  schema = normalizeSchema(schema);

  // normalize basePath, strip trailing '/'s
  const basePath = schema.basePath;
  if (typeof basePath === "string") {
    schema.basePath = basePath.replace(/\/+$/, "");
  } else schema.basePath = "";

  if (omitBasepath) {
    schema.basePath = "";
  }

  recreateDirectories(dest, generateStore, cleanArchitecture);

  const header = processHeader(schema, omitVersion, omitHeader);
  const config: Config = {
    header,
    dest,
    generateStore,
    unwrapSingleParamMethods,
    typedForms: effectiveTypedForms,
    cleanArchitecture,
    standalone: profile.standalone,
    profile,
  };

  if (!fs.existsSync(dest)) fs.mkdirSync(dest);
  const definitions = processDefinitions(schema.definitions, config);
  const processedControllers = processPaths(
    schema.paths,
    `http://${schema.host}${swaggerUrlPath}${conf.swaggerFile}`,
    config,
    definitions,
    schema.basePath,
    environmentAPI,
    readOnly,
    environmentCache
  );

  if (cleanArchitecture) {
    out("Generating clean architecture layers...", TermColors.green);
    generateDomain(config, definitions);
    generateRepositories(config, processedControllers);
    generateUsecases(config, processedControllers);
  }
}

function recreateDirectories(dest: string, generateStore: boolean, cleanArchitecture = false) {
  emptyDir(path.join(dest, conf.defsDir), true);
  emptyDir(path.join(dest, conf.apiDir), true);
  emptyDir(path.join(dest, conf.storeDir), true);

  createDir(path.join(dest, conf.defsDir));
  createDir(path.join(dest, conf.apiDir));
  if (generateStore) createDir(path.join(dest, conf.storeDir));

  if (cleanArchitecture) {
    emptyDir(path.join(dest, conf.domainDir), true);
    emptyDir(path.join(dest, conf.dataDir), true);
    emptyDir(path.join(dest, conf.usecasesDir), true);
  }
}
