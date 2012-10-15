[![build status](https://secure.travis-ci.org/rsdoiel/sqlish.png)](http://travis-ci.org/rsdoiel/sqlish)
sqlish
======

A SQL generator for for NodeJS, Mongo Shell and web browsers.

# Overview

JavaScript's ability to chaining function calls provides an nice semantic
for generating SQL statements. sqlish (Californian pronunciation: sk wil' ish)
takes this approach and attempts to be portable as well as simple to use.


## Advantages?

There are several advantages two taking this approach

* lower cognitive noise (you're programming in one language not two)
* your JS tools (e.g. jslint) now cover your assembly of SQL statements
* assembling complex SQL is just a matter of chaining functions
* MongoDB like object literals for expressions
* sqlish is very small without dependancies
* it works as a NodeJS module
* it works as a loadable script in MongoDB's shell
* it works should work web browsers supporting SQLite


## installation

To use with NodeJS install via npm.

```
	npm install sqlish
```

# A NodeJS example

```JavaScript
	var sqlish = require("sqlish"),
		dialect = sqlish.Dialect,
		Sql = new sqlish.Sqlish("MySQL 5.5),
		message = {
			id: 0,
			name: "fred",
			email: "fred@gmail.com",
			messages: 'He Said, "Hello World"',
			sent: new Date("09/01/2012 14:15:00")
		};

	Sql.use_UTC = false;	
	
	// Output:
	// INSERT INTO messages (name, email, msg, sent) VALUES (
	//	"fred", "fred@example.com", "He siad, \"Hello World\"", 
	//	"2012-09-01 14:15:00");
	console.log(Sql.insert("test", message).toString());
	
	// Output:
	// SELECT id, name, email, msg, sent FROM messages 
	//	WHERE email LIKE "%@example.com";
	console.log(Sql.select(Object.keys(message))
			.from("messages")
			.where({email: {$like: "%@example.com"}}).toString());
	
	// Output:
	// REPLACE INTO messages (id, name, email, msg, sent) VALUES (
	//	10123, "George", "george@example.com", "He siad, \"Hello World\"", 
	//	"2012-07-01");
	message.id = 10123;
	message.name = "George";
	message.email = "george@example.com";
	message.sent = new Date("07/01/2012");
	console.log(Sql.replace("test", message).toString());
```

## a word about sqlish's toString()

Normally you want SQL statements to end with a semi-colon and by default this
is what the toString() at the end of the function chain will do.  However their
are cases where you may want to render complex SQL statements by parts.  In
that case you can overwrite the default semi-colon by passing the terminating
string (including the empty string) as a paramater to toString().

```JavaScript
	var sqlish = require("sqlish"),
		Sql = new sqlish.Sqlish();
    
    // No trailing semi-colon
    console.log(sql.select("count()").toString(""));
    // Trailing semi-colon
    console.log(sql.select("count()").toString());
```
Running the above will yeald something like-

```shell
    > console.log(sql.select("count()").toString(""));
    'SELECT count()'
    > console.log(sql.select("count()").toString());
    'SELECT count();'
```

If you would like to have some other delimiter used as the end of statement marker you
can do so when overwriting Sql.eol at time of object creation or before calling toString().

```
	var sqlish = require("sqlish"),
		Sql = new sqlish.Sqlish();
		
	Sql.eol = ";\n\n";
    
    // No trailing semi-colon
    console.log(sql.select("count()").toString(""));
    // Trailing semi-colon with two new lines
    console.log(sql.select("count()").toString());
```

Would yeild something like-

```shell
    > console.log(sql.select("count()").toString(""));
    'SELECT count()'
    > console.log(sql.select("count()").toString());
    'SELECT count();'
    
    
```

# MongoDB shell example

Copy _sqlish.js_ and _load-sqlish.js_ to your working directory. Then use
MongoDB's shell's _load()_ function to include it. See mongo-example.js:

```javascript
    load("load-sqlish.js");
    sql = new Sql();
    // Output should look like:
    //  SELECT id, name, email, modified FROM myTable;
    print(sql.select(["id", "name", "email", "modified"]).from("myTable").toString());
    item = {id:1, name: "fred", email: "fred@example.com", modified: new Date("09/14/2012 10:21:14")};
    // Output should look like:
    //  REPLACE INTO myTable (id, name, email, modified) VALUES ("fred", "fred@example.com", "2012-09-14 10:21:14");
    print(sql.replace("myTable", item).toString());
```

Save the above example code as _mongo-example.js_. Run under MongoDB's shell-

```shell
	mongo mongo-example.js
```

Output should look something like-

```shell
	MongoDB shell version: 2.2.0
	connecting to: test
	SELECT id, name, email, modified FROM myTable;
	REPLACE INTO myTable (id, name, email, modified) VALUES (1, "fred", "fred@example.com", "2012-09-14 10:21:14");
```

# Alternatives?

If you don't need web browser or MongoDB shell support two SQL generators at npmjs.org 
look very promising-

* [bloom-sql](https://npmjs.org/package/bloom-sql)
* [sql-generator](https://npmjs.org/package/sql-generator)

