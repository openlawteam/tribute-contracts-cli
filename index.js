#!/usr/bin/env node
// Whole-script strict mode syntax
"use strict";
r1 = require("esm")(module);
module.exports = require("./cli.ts");
