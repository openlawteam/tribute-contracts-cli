#!/usr/bin/env node
// Whole-script strict mode syntax
"use strict";
require = require("esm")(module);
module.exports = require("./cli.js");
