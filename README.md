sqlish
======

A small SQL generator

# Overview

It occurred to me that JavaScript's chaining function calls would
make it pretty easy to generate valid SQL statements. It offers the 
possibility for handling SQL dialect differences cleanly (e.g. MySQL versus 
SQLite quote escaping). I recently tried this approach in another project and 
it worked well.  After doing a checking npmjs.org for other SQL generators I
found I liked my approach best and thought others might too.

## Advantages?

There are several advantages two taking this approach

* lower cognitive noise (you're programming in one language not two)
* your JS tools (e.g. jslint) now cover your assembled SQL statements
* assembling complex SQL is just a matter of chaining functions
* sqlish is very small without dependancies (e.g. web browser, mongo shell friendly)


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

While I like my approach there are others SQL generators at npmjs.org. Two 
in particularly I found very promising-

* [bloom-sql](https://npmjs.org/package/bloom-sql) <-- I stumbled on a similar approach
* [sql-generator](https://npmjs.org/package/sql-generator)

 
