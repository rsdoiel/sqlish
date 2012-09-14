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
an array of fieldnames. If not field names are provided then the
an asterick is used in its place.


