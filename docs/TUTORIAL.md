sqlish - tutorial
=================

# Getting started

The basic idea of sqlish is to mimic the typical SQL vocabulary
with a serious of function calls. Here's an example of a typical
SQL statement followed by how to render the same thing with 
in native JavaScript with sqlish.

```SQL
    SELECT id, name, email FROM email_list;
```

Now let's write that with sqlish running under NodeJS-

```JavaScript
    // Create an sql object
    var sqlish = require("sqlish"),
        sql = new sqlish.Sql();
    
    sql.select(["id", "name", "email"]).from("email_list").toString();
```

That's the basic idea. The nice thing about sqlish is this also
works on the MongoDB shell though you'll need to load it a little
differently. MongoDB's shell doesn't provide a module system like
node. It will through errors when it encounters undefined
variables. If you look in extras folder you'll see and example
load script for using sqlish.js with Mongo. Here's the 
basic idea (I've assumed that sqlish.js is in the same directory
as the load script in this example).

```JavaScript
    // We're going to declare exports just
    // to keep the MongoDB shell happy
    var exports;
    load("./sqlish.js");
    
    var sql = new Sql();
    
    sql.select(["id", "name", "email"]).from("test").toString();
```

Each function produces phrase of SQL. select() is a verb and takes
an array of column names. If no field names are provided then the
an asterisk is used in its place.

The final toString() returns the assemble SQL statement as a
string.

# Creating a sqlish object

A sqlish object is created with the new operator after it has been
imported. The constructor can take an object as a parameter. The 
attributes support are dialect, use_UTC, and eol (e.g. ';') which 
will be used by toString() to terminate the SQL statement generated.

```JavaScript
	var sql = new sqlish.Sql({
		dialect: sqlish.Dialect.PostgreSQL92,
		use_UTC: true,
		eol: ";\n"
	});
```


# The sql statements and clauses as functions

As you can see in the examples above chaining some
of the sqlish function together will let you assemble a SQL
statement (rendered by toString()).  I loosely think of SQL
clauses as coming in several flavors - verbs, nouns, 
adverbs, adjectives, and conjunctions. In SQL verbs, filters
and modifiers. Verbs (e.g. SELECT ..., INSERT ...
UPDATE ..., DELETE ..., CREATE ...) describe the action you're
asking the database engine to perform.  The rest specify what
the verb is operating on and restrict its effect or results. Sqlish
organizes if functions in a similar way. Not all modifier
make senses with all verbs but many can be combined.  Sqlish
trys to assemble a SQL statement that makes sense but it is
not a SQL validator and does not parse the SQL generated so
it remains helpful to have a basic knowledge of the SQL
dialect you're targeting when assemble SQL via sqlish
functions.

## Verbs

This is a list of the verbs implemented so far as sqlish
functions. More may be added overtime.

createTable():
	This generates a full create statement for the targeted
	dialect of SQL. createTable takes two parameters - 
	a table name and an object who's property names are
	the column names you want to create and who's values
	are also an object which attributes describe types
	and properties of the column

```JavaScript
	sql.createTable("story_book_characters", {
		id: {
			type: "INTEGER",
			auto_increment: true,
			primary_key: true
		},
		name: { 
			type: "varchar", 
			length: 255, 
			not_null: true
		},
		tunnel_id: { 
			type: integer, 
			not_null: true,
			default: 100
		},
		start_date: {
			type: "datetime",
			use_utc: true,
			default: "now"
		},
		poem: { type: "text" },
		modified: { type: "timestamp" }
	});
```


createIndex():
	Generate a index. Parameters expected are index name and
	object with attributes describing the index.

```JavaScript
	sql.createIndex("i_character_names", {
		unique: true,
		on: {
			table: "story_book_characters",
			columns: ["name"]
		}
	});
```


dropTable():
	Generates a drop table statement. It takes a single parameter
	of the table name.

```JavaScript
	sql.dropTable("story_book_characters");
``` 


droptIndex():
	Generate a drop index statement. It takes a single parameter
	of the index name to drop.

```JavaScript
	sql.dropIndex("i_character_names");
```

insert():
	This generates a row insert statement. Parameters are
	table name and an object which has attribute names corresponding
	to column names and attribute values containing the values to
	be inserted.

```JavaScript
	sql.insert("test1", {
		name: "Fred", 
		tunnel_id: 12,
		start_date: new Date("01/22/1803"),
		modified: new Date()
	});
```

replace():
	Replace is support for SQLite3 and MySQL55 dialects. It takes
	the same parameters as insert.

```JavaScript
	sql.replace("test1", {
		id: 231,
		name: "Fred", 
		tunnel_id: 2,
		start_date: new Date("01/22/2003"),
		modified: new Date()
	});
```

update():
	Generate an update clause. It is usually combined with
	a set() and where(). Update takes the table name as the only parameter.

```JavaScript
	sql.update("story_book_characters").set({name: "Albert"}).where({id: 1});
```

select():
    This creates the clause SELECT [FIELD NAMES]. Select
    takes either a string that is a column identifier,
    a SQL function name supported by the dialect or an
    array of column identifiers and SQL functions.

```JavaScript
	sql.select("myId");
	sql.select("COUNT()");
    sql.select(["id", "name", "email"]).toString();
```
	
from():
	Generates a from clause. Usually used with select. Takes
	a single table name or an array of table names.

```JavaScript
	sql.select(["id", "name"]).from("story_book_characters")
```

