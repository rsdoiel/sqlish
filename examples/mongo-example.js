//
// Simple MongoDB Shell script example.
//
load("../extras/load-sqlish.js");
sql = new Sql();
print(sql.select(["id", "name", "email", "modified"]).from("myTable").toString());
item = {id:1, name: "fred", email: "fred@example.com", modified: new Date()};
print(sql.replace("myTable", item).toString());
