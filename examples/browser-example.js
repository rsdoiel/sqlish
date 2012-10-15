var item, sql = new sqlish.Sqlish();

item = {id: 1, name: "fred", email: "fred@example.com",
	modified: new Date()};
document.write("<pre>");
document.write(sql.replace("myTable", item).toString());
document.write("\n");
document.write(sql.select(["id", "name", "email",
	"modified"]).from("myTable").toString());
document.write("</pre>");
