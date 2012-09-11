sql
===

An small SQL rendering library.

# Overview

It occurred to me that JavaScript's chaining function calls would
make it pretty easy to generate valid SQL statements. This also offers the possibility for handling SQL dialect differences cleanly (e.g. MySQL versus SQLite quote escaping). I recently tried this approach in a project and realized making a stand alone sql module offered more flexibility and re use..

## Advantages?

There are several advantages two taking this approach

* lower cognitive noise (I'm programming in one language not two)
* your JS tools (e.g. jslint) now cover your assembled SQL statements
* assembling complex SQL is just a matter of chaining functions

You can of course do similar things with an "ORM":http://en.wikipedia.org/wiki/Object_relational_mapping but I've found the overhead of in most ORM libraries to be greater then a series of functions composing explicitly a SQL statement.


# A simple case insert, select and replace

```JavaScript
	var sql = new (require("sql")).Sql({dialect: "mysql"}),
		message = {
			id: 0,
			name: "fred",
			email: "fred@gmail.com"
			messages: 'He Said, "Hello World"
			sent: new Date("09/01/2012")
		};
	
	// Output:
	// INSERT INTO messages (name, email, msg, sent) VALUES (
	//	"fred", "fred@example.com", "He siad, \"Hello World\"", 
	//	"2012-09-01")
	console.log(Sql.insert("test", message).toString());

	// Output:
	// SELECT id, name, email, msg, sent FROM messages 
	//	WHERE email LIKE "%@example.com"
	console.log(Sql.select(Object.keys(message))
			.from("messages")
			.where("email LIKE \"%@example.com\"").toString());
	
	// Output:
	// REPLACE INTO messages (name, email) VALUES ("fred", "fred@example.com")
	message.id = 10123;
	message.name = "George";
	message.sent = new Date("07/01/2012");
	console.log(Sql.replace("test", message).toString());
```

