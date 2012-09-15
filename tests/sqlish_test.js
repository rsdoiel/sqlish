//
// sqlish_test.js - automated tests for sqlish.js module.
//
// @author: R. S. Doiel, <rsdoiel@gmail.com>
// copyright (c) 2012 all rights reserved
//
// Released under Simplified the BSD License.
// See: http://opensource.org/licenses/bsd-license.php
//
/*jslint devel: true, node: true, maxerr: 50, indent: 4, vars: true, sloppy: true */

var path = require("path"),
    assert = require("assert"),
    sqlish = require("../sqlish"),
    harness = require("../lib/harness");


// Basic SQL assembly
harness.push({callback: function () {
    var Sql = new sqlish.Sql(),
        s,
        expected_s,
        now = new Date();
    
    expected_s = now.getFullYear() + '-' +
        ("0" + (now.getMonth() + 1)).substr(-2) + '-' +
        ("0" + now.getDate()).substr(-2) + " " +
		("0" + now.getHours()).substr(-2) + ':' +
		("0" + now.getMinutes()).substr(-2) + ':' +
		("0" + now.getSeconds()).substr(-2);
    s = Sql.sqlDate(now);
    assert.equal(s, expected_s);
    
    s = Sql.insert("test1", {id: 1, name: "Fred", email: "fred@example.com"});
    
    expected_s =  'INSERT INTO test1 (id, name, email) VALUES (1, "Fred", "fred@example.com")';
    
    assert.equal(s, expected_s);

    s = Sql.select("id");
    expected_s = "SELECT id";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = Sql.select(["id", "name", "email"]);
    expected_s = "SELECT id, name, email";
    assert.equal(s, expected_s);
    
    s = Sql.select(["id", "name", "email"]).from("test1");
    expected_s = "SELECT id, name, email FROM test1";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = Sql.select(["id", "name", "email"]).from("test1").where("id = 1");
    expected_s = "SELECT id, name, email FROM test1 WHERE id = 1";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = Sql.select(["id", "name", "email"]).from("test1").where("id = 1").orderBy("name");
    expected_s = "SELECT id, name, email FROM test1 WHERE id = 1 ORDER BY name";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = Sql.select(["id", "name", "email"]).from("test1").where("id = 1").orderBy(["name", "email"]);
    expected_s = "SELECT id, name, email FROM test1 WHERE id = 1 ORDER BY name, email";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = Sql.select(["id", "name", "email"]).from("test1").where("id = 1").groupBy(["email", "name"]);
    expected_s = "SELECT id, name, email FROM test1 WHERE id = 1 GROUP BY email, name";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = Sql.select(["id", "name", "email"]).from("test1").where("id = 1").groupBy("email");
    expected_s = "SELECT id, name, email FROM test1 WHERE id = 1 GROUP BY email";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = Sql.select(["id", "name", "email"]).from("test1").where("id = 1").groupBy(["email"]).orderBy(["email", "name"]);
    expected_s = "SELECT id, name, email FROM test1 WHERE id = 1 GROUP BY email ORDER BY email, name";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = Sql.select(["id", "name", "email"]).from("test1").where("id = 1").limit(1);
    expected_s = "SELECT id, name, email FROM test1 WHERE id = 1 LIMIT 1";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = Sql.select(["id", "name", "email"]).from("test1").where("id = 1").limit(1, 1);
    expected_s = "SELECT id, name, email FROM test1 WHERE id = 1 LIMIT 1,1";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = Sql.select("id").from("test1").where("id = 1").into("@id");
    expected_s = "SELECT id FROM test1 WHERE id = 1 INTO @id";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = Sql.select(["id", "name", "email"]).from("test1").where("id = 1").into(["@id", "@name", "@email"]);
    expected_s = "SELECT id, name, email FROM test1 WHERE id = 1 INTO @id, @name, @email";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = Sql.set("my_count", 1);
    expected_s = "SET @my_count = 1";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
}, label: "Basic SQL assemble tests."});

// Setup some basic tests for SQLite support
harness.push({ callback: function () {
    var wasThrown = false,
        s,
        expected_s,
        Sql = new sqlish.Sql({dialect: sqlish.SQLite});
    
    wasThrown = false;
    try {
        Sql.set("myvar", 1);
    } catch (err1) {
        wasThrown = true;
    }
    assert.ok(wasThrown, "Should have thrown an error for Sql.set()");
    
    wasThrown = false;
    try {
        Sql.into("@myvar");
    } catch (err2) {
        wasThrown = true;
    }
    assert.ok(wasThrown, "Should have thrown an error for Sql.into(\"@myId\")");
}, label: "SQLite specific tests."});

harness.push({callback: function () {
    var sql = new sqlish.Sql();
    
    assert.equal(sql.eol, ";", "Should have eol equal to ;");
    assert.equal(sql.select("count()").toString(), "SELECT count();");
    assert.equal(sql.select("count()").toString(""), "SELECT count()");
}, label: "Testing toString() terminiations"});

harness.push({callback: function () {
    var sql = new sqlish.Sql(),
        s,
        expected_s;
    
    s = sql.deleteFrom("test").toString();
    expected_s = "DELETE FROM test;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = sql.deleteFrom("test").where("ID = 32").toString();
    expected_s = "DELETE FROM test WHERE ID = 32;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = sql.update("test").toString();
    expected_s = "UPDATE test;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = sql.update("test").set({name: "George", email: "george@example.com"}).where("test.id = 2").toString();
    expected_s = 'UPDATE test SET name = "George", email = "george@example.com" WHERE test.id = 2;';
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
}, label: "Test 0.0.3 features."});

harness.push({callback: function () {
    var sql = new sqlish.Sql(),
        s,
        expected_s;

    // Bugs needing fixing before version 0.0.4 released
    s = sql.select().toString();
    expected_s = "SELECT *;";

    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = sql.createTable("test", {
        id: "INTEGER AUTO_INCREMENT PRIMARY KEY",
        name: "VARCHAR(255)",
        email: "VARCHAR(255)",
        modified: "TIMESTAMP"
    }).toString();
    expected_s = "CREATE TABLE test (id INTEGER AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), email VARCHAR(255), modified TIMESTAMP);";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = sql.alterTable("test", "ADD COLUMN", {
        created: "TIMESTAMP"
    }).toString();
    expected_s = "ALTER TABLE test ADD COLUMN (created TIMESTAMP);";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = sql.dropTable("test");
    expected_s = "DROP TABLE test";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);


    s = sql.createIndex("i_test", {
        unique: false,
        on: {
            table: "test", 
            columns: [
                "name", "email"
            ]
        }
    }).toString();
    expected_s = "CREATE INDEX i_test ON test (name, email);";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = sql.dropIndex("i_test").toString();
    expected_s = "DROP INDEX i_test;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    

}, label: "Test 0.0.4 features"});

/*
harness.push({callback: function () {
    
    // Auto-ordering of phrases moved to 0.0.5
    //assert.fail("Auto-ordering of phrases not implemented.");
    
    // SQLite supported by following sqlish functions
    // alterTable()
    // add()
    // rename()
    // begin()
    // transaction()
    // commit()
    // rollback()
    // end()
    // createIndex()
    // createTable()
    // createTrigger()
    // createView()
    // createVirtualTable()
    // deleteFrom()
    // dropIndex()
    // dropTable()
    // dropTrigger()
    // dropView()
    // endTransaction()
    // indexBy()
    // insert()
    // onConflict()
    // pragma() # Not sure this makes sense from a JS environment
    // reindex() # Not sure this makes sense from a JS environment
    // releaseSavePoint()
    // replace()
    // savePoint()
    // select()
    // update()
    // vacuum() # Not sure this makes sense from a JS environment
    // from()
    // where()
    // groupBy()
    // having()
    // distinct()
    // join()
    // union()
    // groupBy()
    // orderBy()
    // limit()
    // offset()
    //
    
    // MySQL supported by following sqlish function
    // alterDatabase()
    // alterEvent() # Not sure this makes sense from a JS environment
    // alterFunction() # Not sure this makes sense from a JS environment
    // alterTable()
    // createDatabase()
    // createEvent() # Not sure this makes sense from a JS environment
    // createFunction() # Not sure this makes sense from a JS environment
    // createIndex()
    // createProcedure() # Not sure this makes sense from a JS environment
    // createTable()
    // createTrigger() # Not sure this makes sense from a JS environment
    // createView()
    // dropDatabase()
    // dropEvent() # Not sure this makes sense from a JS environment
    // dropFunction() # Not sure this makes sense from a JS environment
    // dropIndex()
    // dropProcedure() # Not sure this makes sense from a JS environment
    // dropTable()
    // dropTrigger() # Not sure this makes sense from a JS environment
    // dropView()
    // renameTable()
    // truncateTable()
    // call() # Not sure this makes sense from a JS environment
    // delete()
    // handler() # Not sure this makes sense from a JS environment
    // insert()
    // loadDataInFile() # Not sure this makes sense from a JS environment
    // loadXML() # Not sure this makes sense from a JS environment
    // replace()
    // select()
    // update()
    // set() without update()
    // ignore()
    // groupBy()
    // having()
    // orderBy()
    // join()
    // union()
    // where()
    // with()
    // in()
    // into()
    // begin()
    // transaction()
    // savePoint()
    // releaseSavePoint()
    // commit()
    // rollback()
    
    // PostgreSQL supported by following sqlish functions:
    // alterTable()
    // createRule()
    // createSchema()
    // createTable()
    // createTrigger() # Not sure this makes sense from a JS environment
    // createType() # Not sure this makes sense from a JS environment
    // createFunction() # Not sure this makes sense from a JS environment
    // createView()
    // dropSchema()
    // dropTable()
    // dropView()
    // operator()  # Not sure this makes sense from a JS environment
    // set() (outside of UPDATE, no prefixed '@')
    // having()
    // inherits()
    // orReplace()
    // insert()
    // update()
    // deleteFrom()
    // where()
    // from()
    // orderBy()
    // groupBy()
    // having()
    // distinct()
    // limit()
    // offset()
    // with()
    // values()
    // join()
    // union()
    // intersect()
    // except()
    // with()
    // recursive()
    // in()
    // over()
    // begin()
    // savepoint()
    // commit()
    // rollback()    
}, label: "Test 0.0.5 features"});
 */

if (require.main === module) {
    harness.RunIt(path.basename(module.filename), 10, true);
} else {
    exports.RunIt = harness.RunIt;
}
