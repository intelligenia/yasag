#!/usr/bin/env node

import * as conf from "./conf";
import { generate } from "./generate";

import { program } from "commander";

program
  .option("-s, --src <source>", `Source directory, default: ${conf.apiFile}`)
  .option(
    "-d, --dest <destination>",
    `Destination directory, default: ${conf.outDir}`
  )
  .option("--no-store", "Do not generate store")
  .option(
    "-w, --unwrap-single-param-methods",
    "Controller methods with a single parameter get a method_() where the parameter object is unwrapped"
  )
  /* tslint:disable-next-line:max-line-length */
  .option(
    "-u, --swagger-url-path <path>",
    `swagger URL path, where the swagger ui documentation can be found; default: ${conf.swaggerUrlPath}, i.e. the resulting address would be http://example${conf.swaggerUrlPath}`
  )
  .option(
    "-o, --omit-version",
    `Write version info, default: ${conf.omitVersion}`
  )
  .option("-b, --omit-basepath", `Omit basepath, default: ${conf.omitBasepath}`)
  .option(
    "-v, --environment-var <environmentAPI>",
    `Name of the environment variable for the base path, default: ${conf.environmentAPI}`
  )
  .option(
    "-h, --omit-header",
    `Omit print header on each file, default: ${conf.omitHeader}`
  )
  .option(
    "-t, --typed-forms",
    `Force typed FormControls on (default follows --target: on for ng22/ng16, off for legacy)`
  )
  .option(
    "--untyped-forms",
    `Force untyped FormControls (overrides the target default)`
  )
  .option(
    "-r, --read-only <ending>",
    `Omit attributes ending by <ending> in PUT, POST and PATCH methods, default: None`
  )
  .option(
    "-c, --environment-cache <environmentCache>",
    `Name of the environment variable for the cache size configuration, default name: ${conf.environmentCache}, default size 1000 elements`
  )
  .option(
    "-a, --clean-architecture",
    "Generate clean architecture layers (domain, data, usecases)"
  )
  .option(
    "--target <ng>",
    "Angular output target: ng22 (default, standalone + inject + signals + httpResource), ng16 (standalone + inject, no signals/httpResource), legacy (NgModules + constructor DI)",
    "ng22"
  )
  .parse(process.argv);

const options = program.opts();

generate(
  options.src,
  options.dest,
  options.store,
  options.unwrapSingleParamMethods,
  options.swaggerUrlPath,
  options.omitVersion,
  options.omitBasepath,
  options.environmentVar,
  options.omitHeader,
  options.typedForms,
  options.readOnly,
  options.environmentCache,
  options.cleanArchitecture,
  options.target,
  options.untypedForms
);
