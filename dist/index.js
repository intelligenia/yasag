#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const conf = require("./conf");
const generate_1 = require("./generate");
const { program } = require("commander");
program
    .option("-s, --src <source>", `Source directory, default: ${conf.apiFile}`)
    .option("-d, --dest <destination>", `Destination directory, default: ${conf.outDir}`)
    .option("--no-store", "Do not generate store")
    .option("-w, --unwrap-single-param-methods", "Controller methods with a single parameter get a method_() where the parameter object is unwrapped")
    /* tslint:disable-next-line:max-line-length */
    .option("-u, --swagger-url-path <path>", `swagger URL path, where the swagger ui documentation can be found; default: ${conf.swaggerUrlPath}, i.e. the resulting address would be http://example${conf.swaggerUrlPath}`)
    .option("-o, --omit-version", `Write version info, default: ${conf.omitVersion}`)
    .option("-b, --omit-basepath", `Omit basepath, default: ${conf.omitBasepath}`)
    .option("-v, --environment-var <environmentAPI>", `Name of the environment variable for the base path, default: ${conf.environmentAPI}`)
    .option("-h, --omit-header", `Omit print header on each file, default: ${conf.omitHeader}`)
    .option("-t, --typed-forms", `Add types to FormControls, default: ${conf.typeForms}`)
    .option("-r, --read-only <ending>", `Omit attributes ending by <ending> in PUT, POST and PATCH methods, default: None`)
    .option("-c, --environment-cache <environmentCache>", `Name of the environment variable for the cache size configuration, default name: ${conf.environmentCache}, default size 1000 elements`)
    .parse(process.argv);
const options = program.opts();
(0, generate_1.generate)(options.src, options.dest, options.store, options.unwrapSingleParamMethods, options.swaggerUrlPath, options.omitVersion, options.omitBasepath, options.environmentVar, options.omitHeader, options.typedForms, options.readOnly, options.environmentCache);
//# sourceMappingURL=index.js.map