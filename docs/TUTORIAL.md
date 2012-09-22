sqlish - tutorial
=================

# Getting started

The basic idea of sqlish is to mimic the typical SQL vocabulary
as a serious of function calls. Here's an example of a typical
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
works in the MongoDB shell though you'll need to load it a little
differently. MongoDB's shell doesn't provide a module system like
NodeJS. It will through errors when it encounters undefined
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

Each function produces phrases or clauses of SQL. _select()_ is a verb
and takes an array of column names. If no field names are provided then the
an asterisk is used in its place. _from()_ adds the FROM SQL clause
and accepts a list of table names as arguments.  The finally toString() 
job is to return an assemble SQL statement as a string.

# Creating a sqlish object

A sqlish object is created with the new operator after it has been
imported. The constructor can take an object as a parameter. The 
attributes supported are dialect name, use_UTC, and eol (e.g. ';')
which will be used by toString() to terminate the SQL statement 
generated.

```JavaScript
    var sql = new sqlish.Sql({
    	dialect: sqlish.Dialect.PostgreSQL92,
		use_UTC: true,
		eol: ";\n"
	});
```


# SQL statements and clauses

## Overview

Chaining some sqlish functions together will let you 
assemble an SQL statement rendered by toString().  
sqlish groups SQL phrases into four general categories
verbs, supporting clauses, expressions and definitions.  
The verbs always start the chain. Chaining two verbs
together will cause the second verb to replace the first.
Clauses refine the actions of the verb. They be describe
the object to work on (e.g. _from()_) or filter results
(e.g. _where()_) or effect ordering (e.g. _orderBy()_
or _groupBy()_). Some

## Details

Verb phrases include SQL statements starting with _CREATE_,
_ALTER_, _DROP_, _INSERT_, _UPDATE_, _REPLACE_, _DELETE_,
_SELECT_, and _SET_. These generalally describe an action
you will take on a database, table or environment variable.
Sqlish provides a corresponding set of functions to generate
these phrases including - _createTable()_, _alterTable()_,
_dropTable()_, _insert()_, _update()_, _replace()_, _deleteFrom()_,
_select()_, _set()_ and _union()_.  Where the SQL term would collide
with a JavaScript keyword (e.g. delete, create) a similar
compound word is used (e.g. deleteFrom, createTable). To 
keep a modicum of similarity compound words are used for all
actions relating to table, index and view - 	


Supporting clauses modify the action in some way. Sometimes
this is to filter the effect of the verb, modified or limit
the results or to set the target of the action. They are 
typically used after the verb phrase.  Supporting
clauses include _FROM_, _INTO_, _JOIN_, _WHERE_, _ORDER BY_,
_GROUP BY_, _LIMIT_, _OFFSET_, _HAVING_ and _SET_. You will
see these defined later as _from()_, _into()_, _join()_, 
_where()_, _order()_, _group()_, _limit()_, _offset()_, 
_having()_ and _set()_


Expressions find themselves sprinkled through out SQL
statements.  Much of the power of SQL comes from its expressions.
Expressions implement logic, e.g._email = "johndoe@examples.com"_ 
or _title LIKE "%Wild Things%"_.  They also can define, e.g.
_id INTEGER AUTO_INCREMENT PRIMARY KEY_. Expressions in sqlish 
usually are  formed by a JavaScript object literals inspired
by those used in MongoDB. From the three previous examples-

```JavaScript
    // email = "johndoe@examples.com"
    email_johndoe_expr = {email: "johndoe@examples.com"};
    // (title LIKE "%Wild Things%")
    titles_like_expr = {title: {$like: /Wild Things/}};
    // id INTEGER AUTO_INCREMENT PRIMARY KEY
    def_auto_increment_id = { 
        type: "int",
        auto_increment: true,
        primary_key: true
    };
```

If you need to group phrases in SQL to assert a precedence
in evaluation you do so with parenthesis. Unfortunately a simple
wrapper of Parenthesis will not work in JavaScript since that 
delineates a functions' parameters and functions can be assigned
inside object literals.  To allow expression composition we
a function named _P()_ (P is short for parenthesis).

A sqlish's object literal integrating _P()_ -

```JavaScript
    orExpression = sql.P({
        or: [
            sql.P({
                and: [
                    {tag_count: {$gt: 5}},
                    {tag_count: {$lt: 10}}
                ],
            }),
            sql.P({modified: {$gte: "2012-01-01"}})
        ]
    });
```

Here's the SQL expression rendered by toString() -

```SQL
    ((tag_count > 5 AND tag_count < 10) OR (modified >= "2012-01-01"))
```

The downside of this approach is you type more code in JavaScript than
hand writing the SQL. The upside is that sqlish will attempt to prevent
SQL injection by apply quoting and escaping to values and restricting the
characters used for SQL function names, table names, column names
and environment variable references.

### IMPORTANT WARNING!

> sqlish is not a replacement for best practices when writing
> software. It remains important to defensively validate input from users,
> web browsers or any data source.


## Verbs

This is a list of the verbs implemented so far as sqlish
functions. More may be added overtime.

### createTable()

This generates a full create statement for the targeted
dialect of SQL. createTable takes two parameters - 
a table name and an object who's property names are
the column names you want to create and who's values
are also an object which attributes describe types
and properties of the column

```JavaScript
	sql.createTable("story_book_characters", {
		id: {
			type: "integer",
			auto_increment: true,
			primary_key: true
		},
		name: { 
			type: "varchar", 
			length: 255, 
			not_null: true
		},
		tunnel_id: { 
			type: "integer",
			not_null: true,
			default: 100
		},
		start_date: {
			type: "datetime",
            not_null: true
		},
		poem: { type: "text" },
		modified: { type: "timestamp" }
	});
```


### dropTable()

Generates a drop table statement. It takes a single parameter
of the table name.

```JavaScript
    sql.dropTable("story_book_characters");
``` 


### createIndex()

Generate a index. Parameters expected are index name and
object with attributes describing the index.

```JavaScript
	sql.createIndex("i_character_names", {
		unique: true,
		table: "story_book_characters",
		columns: ["name"]
	});
```


### droptIndex()

Generate a drop index statement. It takes a single parameter
of the index name to drop.

```JavaScript
	sql.dropIndex("i_character_names");
```

### createView()

Generate a create view statement. It takes a two parameters
a view name and a SQL object that will be rendered with
toString().

```JavaScript
    sql_subquery = sqlish.Sql();
    sql_subquery.select(["email", "name"],
    	{unique: true}).from("my_test").limit(10);
    sql.createView("my_view", sql_subquery);
```

### dropView()

Generate a drop view statement. It takes a single parameter
of the view name to drop.

```JavaScript
    sql.dropView("my_view");
```


### insert()

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

### replace()

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


### update()

Generate an update clause. It is usually combined with
a set() and where(). Update takes the table name as the only parameter.

```JavaScript
	sql.update("story_book_characters").set([{name: "Albert"},
        {email: al@example.mf"}]).where({id: 1});
```


### select()

This creates the clause _SELECT *FIELD NAMES*_, _SELECT UNIQUE *FIELD_NAMES*_
or _SELECT ALL *FIELD_NAMES*_. The Select takes two parameter, the second
is optional.  The first parameter accepts either a string that is a 
single column identifier, an array of strings as a list of columns or number 
if you want the SQL wild card for all columns. A SQL function name supported
can also be used as a column identifier. Columns can be 
aliased with the AS operator if they are in an array of of column names. The alias
is specified with a name key/value object literal _{unique: true}_ would be
used to generate _SELECT UNIQUE_.

```JavaScript
	// SELECT myId
	sql.select("myId");
	// SELECT COUNT()
	sql.select("COUNT()");
	// SELECT COUNT() AS subtotal
    sql.select([{"COUNT()": "subtotal"}]);
    // SELECT id, name, email
    sql.select(["id", "name", "email"]);
    // SELECT UNIQUE email, name
    sql.select(["email", "name"], {unique: true});
    // SELECT ALL email, name
    sql.select(["email", "name"], {all: true});    
```

### union()

Render a union clause. Takes one parameters each an Sql object. Not supported
in SQLite3.

```JavaScript
sql1 = sqlish.Sql();
sql2 = sqlish.Sql();

sql1.select().from("test1");
sql2.select().from("test2");
// render (SELECT * FROM test1) UNION (SELECT * FROM test2)
sql.union(sql1, sql2);
```

### transaction()

Generate a transaction bound set of SQL statements.

### savepoint()

Sets marker among the array of SQL statements in the 
transaction block.

### commit()

Sets a marker amount the array of SQL statements in the
transaction block.

### rollback()

Sets a marker for rollback in the array of SQL statements
in the transaction block.



# Supporting clauses

### from()

Generates a from clause. Usually used with select. Takes
a single table name or an array of table names.

```JavaScript
    // SQL: SELECT id, name FROM story_book_characters
	sql.select(["id", "name"]).from("story_book_characters")
```

### where()

Generating a where clause. Usually used with select.
Takes an expression as its parameter.

```JavaScript
    // SQL: SELECT id, name FROM story_book_characters
    // WHERE name = "fred";
	sql.select(["id", "name"]).from("story_book_characters")
        .where({name: "fred"});
```

### into()

Into is usually used with _select()_. It is not supported
by the SQLite 3 dialect. Takes a string or array of variable
or column names.
    
```JavaScript
    // MySQL 5.5: SELECT 2 INTO @number;
    // PostgreSQL 9.2: SELECT 2 INTO number;
    sql.select(2).into("number");
```

### join()

Renders a JOIN clause. Takes two parameters the table to join to
and the expression to join with.

```JavaScript
    sql.select().from("test").joinOn("something", {"test.id" : "something.test_id"}));
```

# Expressions

### =, !=, >, >=, <, <=

Equal, not equal, greater than, greater than or equal, less than, 
and less than or equal are expressed using _$eq_, _$ne_, _$gt_, _$gte_,
_$le_, and _$lte_. Equals can be expressed two ways. Implicitly
where the value assigned to the attribute is a number, string,
or date. Explicitly it can be expression where the value is an
object who's attribute name is _$eq_.

```JavaScript
    // SQL: cnt > 3
    expr = {cnt: {$gt: 3}};
    // SQL: cnt >= 3
    expr = {cnt: {$gte: 3}};
    // SQL: cnt = 3
    expr = {cnt: 3};
    expr = {cnt: {$eq: 3}};
    // SQL: cnt != 3
    expr = {cnt: {$ne: 3}};
    // SQL: cnt < 3
    expr = {cnt: {$lt: 3}};
    // SQL: cnt <= 3
    expr = {cnt: {$lte: 3}};
```

### OR, AND

The conjunction operators OR are expressioned using _$or_ and _$and_.
Both take an erray literal as its value or the function _P()_.

```JavaScript
    // SQL: cnt = 3 OR cnt = 6
    expr = {$or: [{cnt: 3}, {cnt: 6}]};
    // SQL: cnt = 3 OR cnt = 6 OR cnt = 9
    expr = {$or: [{cnt: 3}, {cnt: 6}, {cnt: 9}]};
    // SQL: cnt > 3 AND cnt < 9
    expr = {$and: [{cnt: {$gt: 3}}, {cnt: {$lt: 9}}]};
    // SQL: (cnt = 3 OR cnt < 9)
    expr = sql.P({$or: [{cnt: 3}, {cnt: {$lt: 9}}]})
    // SQL: (cnt = 3) OR (cnt < 9)
    expr = {$or: [sql.P({cnt: 3}), sql.P({cnt: {$lt: 9})}]})
```

### (), parenthesis

    Generating parenthesis in expressions is a little different than
    in MonogDB. Group with parenthesis is accomplish by a function 
    named _P_. It evaluates the objet literal passed to it, converts 
    that literal to a string and wraps the results in parenthesis.

```JavaScript
    // SQL: (cnt = 3)
    expr = sql.P({cnt: 3});
    // SQL: (cnt = 3) or (cnt = 9)
    expr = {$or: [sql.P({cnt: 3}), sql.P({cnt: 9})]};
```

# Adding or modifying a dialect

This is hypathetical psuedo code at this point. Will definately change before
implemented.

```JavaScript
    // Just some sketches of what it might look like.

    sqlish.Dialect.define("ReadOnlySQL", {
    	verbs: {
            // Defining schema
            createTable: false,
            dropTable: false,
            createIndex: false,
            dropIndex: false,
            createView: false,
            dropView: false,

            // Manimulating rows
            insert: false,
            update: false,
            replace: false,
            select: true,
            union: true,
            set: false,
            deleteFrom: false,
        },
    	clauses: {
            // Modifing a verb
            set: false,
            from: true,
            join: true,
            where: true,
            limit: true,
            order: true,
            group: true,
            into: false
        },
    	// Replaces default toString()
    	toString: function (someArgs) {
    		... Code to render inner sql Model
    	},
    	// Optional method bind a db connection
    	// e.g. could transform the active verb
    	// and clauses into a MongoDB query.
    	// Should support steams of results if
    	// no callback is provided
    	execute: function (...someArgs, callback) {
    	}
    }); 
    
    // Now set the dialect of a sql object.
    sql = new sqlish.Sql({dialect: sqlish.Dialect.SQLReadOnly});
    
    // This is Ok in SQLReadOnly dialect
    sql.select("id").from("test").where({id: 203});
    // This will throw an error because
    // SQLReadOnly does not support "deleteFrom", so 
    // it will throw an error
    sql.deleteFrom("test").where({id: 203});
```

