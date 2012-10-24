sqlish reference
================

# Overview

This is a alphabetical listing sqlish methods.  It assumes
you've create an object called _sql_. E.g.

```JavaScript
	var sqlish = require("sqlish");

	sql = new sqlish.Sqlish();
```

# Dialects methods

The Dialects object is used to extend the behavior of the _sqlish.Sqlish()_ factory.

It has two public method - _define(dialect_name, definitions)_. _dialect_name_ should be a valid variable name. It will be used as the Dialect object's
property when defining a dialect. There are three major use cases for _Dialect_ with _sqlish_. The first is creating a whole new dialect (e.g. SQL 2003); the second is for restricting the behavior of an existing dialect (e.g. only allowing permitting read statements like _SELECT_ for MySQL 5.5); and the third would be to replace the adding a working _execute()_ function.

The second method lists the names of defined dialect - _sqlish.Dialect.supported()_. It returns a array of strings with the names of the dialects defined.


## Defining a new dialect

FIXME: explanation and example needed here.

## Restricting the built-in dialect

FIXME: explanation and example needed here.

## Adding an execute method

FIXME: explanation and example needed here.


# Sqlish() methods

## sql.applyOn(tableName, value)

This is a method used to validate a column that was defined with _on()_.

## sql.createIndex(indexName, options)

This is used to generate a _CREATE INDEX_ statement. _options_ can contain
the following attributes - _table_, _columns_ and _unique_.

```JavaScript
	// CREATE UNIQUE INDEX myIndex ON test 1 (email);
	sql.createIndex("myIndex", {table: "test1", columns: ["email"]});
```

## sql.createTable(tableName, column_definitions)

This is used to generate a _CREATE TABLE_ statement.  _column_definitions_
are JavaScript object where the attributes specify the details.

```JavaScript
	// CREATE TABLE profiles (profile_id INTEGER AUTO_INCREMENT PRIMARY KEY,
	//	name VARCHAR(255), email VARCHAR(255) NOT NULL);
	sql.createTable("profiles", {name: { type: "INTEGER", auto_increment: true, primary_key: true}, email: {type: "VARCHAR", length: 255}});
```

## sql.createView = function (viewName, sql_obj)

This is used to generate a _CREATE VIEW_ statement. _sql_obj_ is another
_sql_, usually a _SELECT_ obj.

```JavaScript
	var sql = new sqlish.Sqlish(),
		sql_view = new sqlish.Sqlish();

	// CREATE VIEW alpha_by_name AS SELECT profile_id, name, email 
	//	FROM profiles ORDER BY name	ASC;
	sql_view.createView("alpha_by_name", 
		sql.select(["profile_id", "name", "email"]).from("profiles").order("name", 1));
```

## sql.deleteFrom(tableName)

This will generate a _DELETE FROM_ statement.  If is usually combined
with a _where()_ clause unless you're deleting all the table's rows.

```JavaScript
	// DELETE FROM profiles WHERE profile_id = 3;
	sql.deleteFrom("profiles").where({profile_id: 3});
```

## sql.dropIndex(indexName)

This will generate a _DROP INDEX_ statement.

```JavaScript
	// DROP INDEX myIndex;
	sql.dropIndex("myIndex");	
```

## sql.dropTable(tableName)

This will generate a _DROP TABLE_ statement.

```JavaScript
	// DROP TABLE profiles;
	sql.dropTable("profiles");
```

## sql.dropView(viewName)

This will generate a _DROP VIEW_ statement.

```JavaScript
	// DROP VIEW alpha_by_name
	sql.dropView("alpha_by_name");
```

## sql.execute(options)

This is not implemented. It is a placeholder for a coming feature letting
you bind connectors or interact with the shell based on the internal state of the _sql_ object.

## sql.from(tables)

This generates the _FROM_ clause used in conjunction with _select()_. If 
you are referencing more than one table you'll need to define the tables with
an _on()_ method first.

```JavaScript
	// SELECT name, email FROM profiles;
	sql.select(["name", "email"]).from("profiles");
	// Working with two tables requires a _on()_
	sql.on("test1", { 
		id: function (value) {
			if (value === "id" || value === "test1.id" ||
					value === parseInt(value, 10)) {
				return value;
			}
			throw "injection error: " + value + " not an integer";
		}
	});
	sql.on("test1", { 
		id: function (value) {
			if (value === "id" || value === "test2.id" ||
					value === parseInt(value, 10)) {
				return value;
			}
			throw "injection error: " + value + " not an integer";
		}
	});
	// SELECT test1.id AS test1_id, test2.id AS test2_id FROM
	//	test1, test2 WHERE test1.id = test2.test1_id;
	sql.select([{"test1.id": "test1_id"}, {"test2.id": "test2_id"}]).from([
	"test1", "test2"]).where({"test1.id": "test2.test1_id"});
```

## sql.group(columns)

This is used to add a _GROUP BY_ clause to _select()_. _columns_ is an 
array of column names or a single column name as a string.

```JavaScript
	sql.select(["department", "name", "email"]).from("profiles").order("department").group("department");
```

## sql.insert(tableName, obj)

This is used to generate an _INSERT_ statement.  _obj_ is a JavaScript object
where the property name corresponds to the table's column names. The values will applied to the value clause of the _INSERT_ statement.

```JavaScript
	// INSERT INTO profiles (id, name, email) VALUES 
	//		(1, "Fred", "zip@example.com");
	sql.insert("profiles", {id: 1, name: "Fred", email: "zip@example.com"});
```

## sql.into(fields)

This is not support in all dialects but for MySQL 5.5 and PostgreSQL 9.2 it
can be used with a _select()_ function to set session variables;

```JavaScript
	var sqlish = require("sqlish"),
		sql = new sqlish.Sqlish("MySQL 5.5");
		
	// SELECT id, name, email FROM profiles WHERE id = 3 
	//	INTO @profile_id, @name, @email;
	sql.select(["id", "name", "email"]).from("profiles)
		.where({id: 3}).into(["profile_id", "name", "email"]);
```

## sql.isColumnName(value)

This checks to see if a value matches a previously defined table's column's name. It returns true if column is defined, false otherwise.


## sql.isSqlObj(obj)

This checks to see if an object is like other _sqlish.Sqlish()_ objects.


## sql.join(tables, expression)

This allows for joining tables. _expression_ is where you describe
what you are joining on. Since you are working with more than one
table you will need to use the _on()_ function call first.


```JavaScript
	// SELECT name, email FROM profiles;
	sql.select(["name", "email"]).from("profiles");
	// Working with two tables requires a _on()_
	sql.on("test1", { 
		id: function (value) {
			if (value === "id" || value === "test1.id" ||
					value === parseInt(value, 10)) {
				return value;
			}
			throw "injection error: " + value + " not an integer";
		}
	});
	sql.on("test1", { 
		id: function (value) {
			if (value === "id" || value === "test2.id" ||
					value === parseInt(value, 10)) {
				return value;
			}
			throw "injection error: " + value + " not an integer";
		}
	});
	
	// SELECT name, email, address FROM profiles JOIN addresses
	//	ON (profiles.id = addresses.profile_id);
	sql.select(["name","email","address"]).from("profiles)
		.join("addresses", {"profiles.id":"addresses.profile_id"}); 
```

## sql.limit(index, count)

This generates a _LIMIT_ clause or a _LIMIT_ and _OFFSET_ clause.

```JavaScript
	// SELECT name, email FROM profiles LIMIT 25
	sql.select(["name", "email"]).from("profiles").limit(25);
	// SELECT name, email FROM profiles LIMIT 25 OFFSET 25
	sql.select(["name", "email"]).from("profiles").limit(25, 25);
	// SELECT name, email FROM profiles LIMIT 25 OFFSET 50
	sql.select(["name", "email"]).from("profiles").limit(50, 25);
```

## sql.offset(index)

This generates the _OFFSET_ clause. It can be combined with _limit()_.

```JavaScript
	// SELECT name, email FROM profiles OFFSET 0
	sql.select(["name", "email"]).from("profiles").offset(0);
	// SELECT name, email FROM profiles OFFSET 25
	sql.select(["name", "email"]).from("profiles").offset(25);
	// SELECT name, email FROM profiles OFFSET 50
	sql.select(["name", "email"]).from("profiles").offset(50);


	// SELECT name, email FROM profiles LIMIT 25 OFFSET 0
	sql.select(["name", "email"]).from("profiles").limit(25).offset(0);
	// SELECT name, email FROM profiles LIMIT 25 OFFSET 25
	sql.select(["name", "email"]).from("profiles").limit(25).offset(25);
	// SELECT name, email FROM profiles LIMIT 25 OFFSET 50
	sql.select(["name", "email"]).from("profiles").limit(25).offset(50);
```

## sql.on(tableName, column_definitions)

This defines helper functions use when determining if a value is either a column name or an expected value.  This is useful when you're joining multiple
tables or referencing multiple tables with a _where()_ clause. The tableName
is a string. The _column_definitions_ is an object where the property name
matches the column name for the table and the value is a callback function. The callback expects a single parameter to test. It should return itself if everything is OK, otherwise the function show throw an error.


```JavaScript
	sql.on("test1", { 
		id: function (value) {
			if (value === "id" || value === "test1.id" ||
					value === parseInt(value, 10)) {
				return value;
			}
			throw "id should be an integer.";
		},
		name: function (value) {
			if (value === "name" || value === "test1.name" ||
				value.match(/[A-z][a-z]+/)) {
				return value;
			}
			throw "Not a name with capitalized first letter."
		},
	});
```

## sql.order(fields, direction)

This generates the _ORDER BY_ clause. By default ascending is presumed.
The _direction_ parameter can be a positive or negative number. If _direction_ is greater than or equal to zero than _ASC_ is generated. If negative than
_DESC_ is generated.

```JavaScript
	// SELECT name FROM profiles ORDER BY name;
	sql.select("name").from("profiles").order("name");
	// SELECT name FROM profiles ORDER BY name ASC;
	sql.select("name").from("profiles").order("name", 1);
	// SELECT name FROM profiles ORDER BY name DESC;
	sql.select("name").from("profiles").order("name", -1);
```

## sql.replace(tableName, obj)

This generates a _REPLACE_ statement. It is not available in the PostgreSQL
9.2 dialect.  It works similar to _INSERT_.  The _obj_ is a JavaScript object
where the property names map to the column names of the table you're doing
the replace on.

```JavaScript
	// REPLACE INTO profiles (id, name, email) VALUES 
	//		(1, "Fred", "zip@example.com");
	sql.replace("profiles", {id: 1, name: "Fred", email: "zip@example.com"});
```

## sql.select(fields, opt)

This generates a _SELECT_ statement. _opt_ is the options supports creating 
other types of _SELECT_ statements such as as _SELECT DISTINCT_, _SELECT ALL_.
_fields_ is an array of strings describing the columns you want to list. 
_select()_ is usually used in conjunction with _from()_.


```JavaScript
	// SELECT name FROM profiles;
	sql.select("name").from("profiles");
	// SELECT name, email FROM profiles;
	sql.select(["name", "email"]).from("profiles");
	// SELECT name, COUNT() AS cnt FROM profiles;
	sql.select(["name", {"COUNT()": "cnt"}]).from("profiles")
	// SELECT DISTINCT name FROM profiles;
	sql.select(["name"], {distinct: true}).from("profiles");
	// SELECT ALL name FROM profiles;
	sql.select(["name"], {distinct: true}).from("profiles");
	
``` 

## sql.set(nameOrObject, value)

In MySQL 5.5 and PostgreSQL 9.2 dialects _set()_ can be used to set
session variables.

```JavaScript
	// SET @profile_id = LAST_INSERT_ID();
	sql.set("profile_id", "LAST_INSERT_ID()");
```

It is more often used with an _update()_ statement and a _where()_ clause.

```JavaScript
	// UPDATE profiles SET name = "Fred", email = "fred@example.com"
	//	WHERE id = 3;
	sql.update("profiles").set([{name: "Fred"}, {email: "fred@example.com"}])
		.where({id: 3});
```


## sql.toString(eol)

This will render a _sql_ object as a string. If _eol_ is not provided a
semi-colon is appended to the output. If _eol_ is provided then _eol_
is used instead of the semi-colon.


```JavaScript
	// output with console.log()
	// SELECT name;
	console.log(sql.select("name").toString());
	// output with console.log()
	// SELECT name	
	console.log(sql.select("name").toString(""));
```

## sql.union(sql1, sql2)

This will generate a _UNION_ statement. _sql1_ and _sql2_ will be
wrapped in parenthesis. Both need to be of type _sqlish.Sqlish()_.

```JavaScript
	var sql = new sqlish.Sqlish(),
		sql1 = new sqlish.Sqlish(),
		sql2 = new sqlish.Sqlish();
		
	sql1.select(["name", "email"]).from("profiles1");
	sql2.select(["name", "email"]).from("profiles2");
	sql.union(sql1, sql2);
```

## sql.update(tableName)

This generates an _UPDATE_ clause. It is used with _set()_ and often _where()_.

```JavaScript
	// UPDATE profiles SET name = "Fred", email = "fred@example.com"
	//	WHERE id = 3;
	sql.update("profiles").set({name: "Fred", email: "fred@example.com"})
		.where({id: 3});
```

## sql.valueOf()

Returns a string representation of the _sql_ object. I.e. like _toString()_.

## sql.where(expression)

This generates the _WHERE_ clause. It is typically used with _select()_,
and _update()_. _expression_ is a MongoDB like find expression. It supports
equality, not equals, greater than, greater than or equal, less than, less
than or equal, "and", "or" and like (i.e. _$eq_, _$ne_, _$gt_, _$gte_, _$lt_,
_$lte_, _$and_, _$or_, and _$like). The default relationship is equal.  _$like_
supports a pseudo regular expression with either - leading _^_ for begins with, a trailing _$_ for ends with and _*_ as a general map to the SQL wildcard of _%_.


```JavaScript
	// UPDATE profiles SET name = "Fred", email = "fred@example.com"
	//	WHERE id = 3;
	sql.update("profiles").set([{name: "Fred"}, {email: "fred@example.com"}])
		.where({id: 3});
	
	// SELECT name FROM profiles WHERE email LIKE "%@example.com";
	sql.select("name").from("profiles").where({email: {$like: /@example.com$/}});

	// SELECT name FROM profiles WHERE email LIKE "fred%";
	sql.select("name").from("profiles").where({email: {$like: /^fred/}});

	// SELECT name FROM profiles WHERE  name LIKE "f%d";
	sql.select("name").from("profiles").where({name: {$like: /f*d/}});

	// SELECT name FROM profiles WHERE id > 3;
	sql.select("name").from("profiles").where({id: {$gt: 3}});

	// SELECT name FROM profiles WHERE id < 3;
	sql.select("name").from("profiles").where({id: {$lt: 3}});

	// SELECT name FROM profiles WHERE id < 3 OR id > 10;
	sql.select("name").from("profiles").where({$or: [{id: {$lt: 3}}, {id: {$gt: 10}}]});	
```

