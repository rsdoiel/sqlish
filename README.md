sqlish
======

A small SQL generator

# Overview

JavaScript's ability to chaining function calls provides an nice semantic
for generating SQL statments. sqlish takes this approach and attempts
to be portable as well as simple to use.


## Advantages?

There are several advantages two taking this approach

* lower cognitive noise (you're programming in one language not two)
* your JS tools (e.g. jslint) now cover your assembled SQL statements
* assembling complex SQL is just a matter of chaining functions
* sqlish is very small without dependancies 
* it works as a NodeJS module
* it works in web browsers supporting SQLite
* it works as a loadable script in MongoDB's shell


# A simple case insert, select and replace

```JavaScript
	var sql = require("sql"),
		Sql = new sql.Sql({dialect: sql.MySQL, use_UTC: false}),
		message = {
			id: 0,
			name: "fred",
			email: "fred@gmail.com",
			messages: 'He Said, "Hello World"',
			sent: new Date("09/01/2012 14:15:00")
		};
	
	// Output:
	// INSERT INTO messages (name, email, msg, sent) VALUES (
	//	"fred", "fred@example.com", "He siad, \"Hello World\"", 
	//	"2012-09-01 14:15:00")
	console.log(Sql.insert("test", message).toString());

	// Output:
	// SELECT id, name, email, msg, sent FROM messages 
	//	WHERE email LIKE "%@example.com"
	console.log(Sql.select(Object.keys(message))
			.from("messages")
			.where('email LIKE "%@example.com"').toString());
	
	// Output:
	// REPLACE INTO messages (id, name, email, msg, sent) VALUES (
	//	10123, "George", "george@example.com", "He siad, \"Hello World\"", 
	//	"2012-07-01")
	message.id = 10123;
	message.name = "George";
	message.email = "george@example.com";
	message.sent = new Date("07/01/2012");
	console.log(Sql.replace("test", message).toString());
```

# Alternatives?

If you don't need web browser or MongoDB shell support two SQL generators at npmjs.org 
look very promising-

* [bloom-sql](https://npmjs.org/package/bloom-sql)
* [sql-generator](https://npmjs.org/package/sql-generator)

