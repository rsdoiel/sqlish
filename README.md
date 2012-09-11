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


## installation

To use with NodeJS install via npm.

```
	npm install sqlish
```

# A NodeJS example

```JavaScript
	var sqlish = require("sqlish"),
		Sql = new sqlish.Sql({dialect: sqlish.MySQL, use_UTC: false}),
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


# MongoDB shell example

Copy _sqlish.js_ and _load-sqlish.js_ to your working directory. Then use
MongoDB's shell's _load()_ function to include it. See mongo-example.js:

```javascript
    load("load-sqlish.js");
    sql = new Sql();
    print(sql.select(["id", "name", "email", "modified"]).from("myTable").toString());
    item = {id:1, name: "fred", email: "fred@example.com", modified: new Date()};
    print(sql.replace("myTable", item).toString());
```

Run under MongoDB's shell-

```shell
	mongo mongo-example.js
```

Output should look something like-

```shell
	MongoDB shell version: 2.2.0
	connecting to: test
	SELECT id, name, email, modified FROM myTable
	REPLACE INTO myTable (id, name, email, modified) VALUES (1, "fred", "fred@example.com", "2012-09-11 10:21:14")
```

# Alternatives?

If you don't need web browser or MongoDB shell support two SQL generators at npmjs.org 
look very promising-

* [bloom-sql](https://npmjs.org/package/bloom-sql)
* [sql-generator](https://npmjs.org/package/sql-generator)

