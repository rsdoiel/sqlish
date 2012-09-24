//
// mongo-sqlish_test.js - automated tests for sqlish.js module.
//
// @author: R. S. Doiel, <rsdoiel@gmail.com>
// copyright (c) 2012 all rights reserved
//
// Released under Simplified the BSD License.
// See: http://opensource.org/licenses/bsd-license.php
//
/*jslint devel: true, node: true, maxerr: 50, indent: 4, vars: true, sloppy: true */
/*global load, assert, harness, sqlish, path, dialect, pwd */
if (load === undefined) {
	throw "Must support load()";
}
var module = true;
this.MONGO_LIBRARY_PATH = $(pwd) + "/lib";
// Now that we have the objects methods we need, load sqlish
load("extras/mongo-shim.js");
load("tests/sqlish_test.js");
