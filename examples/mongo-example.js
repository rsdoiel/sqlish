//
// Simple MongoDB Shell script example.
//
//
// load-sqlish.js - A shim for JavaScript shells that are missing various features
// (e.g. Mongo's JavaScript shell)
//

/*jslint devel: true, node: true, maxerr: 50, indent: 4, vars: true, sloppy: true */
/*global load, print, Sql, sql */
if (load === undefined) {
	throw "Must support load()";
}

// Now that we have the objects methods we need, load sqlish
load("../extras/mongo-shim.js");
load("../sqlish.js");

var item, sql = new Sql();

print(sql.select(["id", "name", "email", "modified"]).from("myTable").toString());
item = {id: 1, name: "fred", email: "fred@example.com", modified: new Date()};
print(sql.replace("myTable", item).toString());
