//
// Simple MongoDB Shell script example.
//
//
// load-sqlish.js - A shim for JavaScript shells that are missing various features
// (e.g. Mongo's JavaScript shell)
//

/*jslint devel: true, node: true, maxerr: 50, indent: 4, vars: true, sloppy: true */
MONGO_MODULES.push(pwd());

sqlish = require("sqlish");

var item, sql = new Sql();

console.log(sql.select(["id", "name", "email", "modified"]).from("myTable").toString());
item = {id: 1, name: "fred", email: "fred@example.com", modified: new Date()};
console.log(sql.replace("myTable", item).toString());

