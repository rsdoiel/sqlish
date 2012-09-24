//
// mongo-shim.js - emulate common NodeJS modules for Mongo Shell.
//
// @author: R. S. Doiel, <rsdoiel@gmail.com>
// copyright (c) 2012 all rights reserved
//
// Released under the Simplified BSD License.
// See: http://opensource.org/licenses/bsd-license.php
//
/*jslint devel: true, node: true, maxerr: 50, indent: 4, vars: true, sloppy: true */
/*global print, load, pwd, assert, harness */
(function (global) {
	var items, working_directory = pwd();

	// Set a default search location for Mongo modules
	if (global.MONGO_LIBRARY_PATH === undefined) {
		items = ls();
		if (items.indexOf("./lib") >= 0) {
			global.MONGO_LIBRARY_PATH = items[items.indexOf("./lib")];
		} else {
			global.MONGO_LIBRARY_PATH = working_directory;
		}
	}


    // Shim path module
    var Path = function () {
        return {
            delimiter : '/',
            join: function () {
                var parts = [], i, cur = 0, end_cut = 0,
					resolving_path, reduced_path;
                
                for (i = 0; i < arguments.length; i += 1) {
                    if (typeof arguments[i] !== "string") {
                        throw "path parts must be a string." + arguments[i];
                    }
                    parts.push(arguments[i]);
                }
                
                resolving_path = parts.join(this.delimiter);
				cur = resolving_path.indexOf("../");
				while (cur >= 0) {
					reduced_path = resolving_path.substr(0, cur);
					end_cut = cur + 3;
					resolving_path = reduced_path.concat(resolving_path.substr(end_cut));
					cur = resolving_path.indexOf("../");
				}
				return resolving_path.replace(/\/.\//g, '/');
            },
            basename: function (p) {
				var basename;
                if (p.lastIndexOf(this.delimiter) >= 0) {
                    basename = p.substr(p.lastIndexOf(this.delimiter) + 1);
                } else {
					basename = p;
				}
                return basename;
            }
        };
    }, path = new Path();
	
    // Shim console.log(), console.error()
    var Console = function () {
        return {
            log: function () {
				var i, output = [];
				for (i = 0; i < arguments.length; i += 1) {
					if (typeof arguments[i] === "string") {
						output.push(arguments[i]);
					} else if (arguments[i].toString !== undefined) {
						output.push(arguments[i].toString());
					} else {
						output.push(arguments[i].toSource());
					}
				}
                print(output.join(" "));
            },
            error: function () {
				var i, output = [];
				for (i = 0; i < arguments.length; i += 1) {
					if (typeof arguments[i] === "string") {
						output.push(arguments[i]);
					} else if (arguments[i].toString !== undefined) {
						output.push(arguments[i].toString());
					} else {
						output.push(arguments[i].toSource());
					}
				}
                print("ERROR: " + output.join(" "));
            }
        };
    }, console = new Console();

	var Require = function () {
		return function (module) {
			var working_directory = pwd(),
				exports = {},
				ky,
				module_name = path.basename(module),
				load_path = path.join(working_directory, module.concat(".js"));

			//console.log("Loading", module_name);// DEBUG
			switch (module_name) {
			case "path":
				return new Path();
			case "assert":
				load(path.join(global.MONGO_LIBRARY_PATH, "assert-this.js"));
				return assert;
			}
			this.exports = exports;
			load(path.join(global.MONGO_LIBRARY_PATH, load_path));
			return exports;
		};
	};
		
    global.console = console;
	global.require = new Require();
}(this));