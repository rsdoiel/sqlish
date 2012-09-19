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
    dialect = sqlish.Dialect,
    harness = require("../lib/harness");


// Basic SQL assembly
harness.push({callback: function () {
    var Sql = new sqlish.Sql(),
        threw_error = false,
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
    
    s = Sql.insert("test1", {id: 1, name: "Fred", email: "fred@example.com"}).toString();
    expected_s =  'INSERT INTO test1 (id, name, email) VALUES (1, "Fred", "fred@example.com");';
    assert.equal(s, expected_s);

    s = Sql.select("id").toString();
    expected_s = "SELECT id;";
    assert.equal(s, expected_s, "#1\n" + s + "\n" + expected_s);

    s = Sql.select(["id", "name", "email"]).toString();
    expected_s = "SELECT id, name, email;";
    assert.equal(s, expected_s, "#2\n" + s + "\n" + expected_s);
    
    s = Sql.select(["id", "name", "email"]).from("test1").toString();
    expected_s = "SELECT id, name, email FROM test1;";
    assert.equal(s, expected_s, "#3\n" + s + "\n" + expected_s);
    
    s = Sql.select(["id", "name", "email"]).from("test1").where({id: 1}).toString();
    expected_s = "SELECT id, name, email FROM test1 WHERE id = 1;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = Sql.select(["id", "name", "email"]).from("test1").where({id: 1}).orderBy("name").toString();
    expected_s = "SELECT id, name, email FROM test1 WHERE id = 1 ORDER BY name;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = Sql.select(["id", "name", "email"]).from("test1").where({id:  1}).orderBy(["name", "email"]).toString();
    expected_s = "SELECT id, name, email FROM test1 WHERE id = 1 ORDER BY name, email;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = Sql.select(["id", "name", "email"]).from("test1").where({id: 1}).groupBy(["email", "name"]).toString();
    expected_s = "SELECT id, name, email FROM test1 WHERE id = 1 GROUP BY email, name;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = Sql.select(["id", "name", "email"]).from("test1").where({id: 1}).groupBy("email").toString();
    expected_s = "SELECT id, name, email FROM test1 WHERE id = 1 GROUP BY email;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = Sql.select(["id", "name", "email"]).from("test1").where({id: 1}).groupBy(["email"]).orderBy(["email", "name"]).toString();
    expected_s = "SELECT id, name, email FROM test1 WHERE id = 1 GROUP BY email ORDER BY email, name;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = Sql.select(["id", "name", "email"]).from("test1").where({id: 1}).limit(1).toString();
    expected_s = "SELECT id, name, email FROM test1 WHERE id = 1 LIMIT 1;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = Sql.select(["id", "name", "email"]).from("test1").where({id: 1}).limit(1, 1).toString();
    expected_s = "SELECT id, name, email FROM test1 WHERE id = 1 LIMIT 1,1;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = Sql.select("id").from("test1").where({id: 1}).into("@id").toString();
    expected_s = "SELECT id FROM test1 WHERE id = 1 INTO @id;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = Sql.select(["id", "name", "email"]).from("test1").where({id: 1}).into(["@id", "@name", "@email"]).toString();
    expected_s = "SELECT id, name, email FROM test1 WHERE id = 1 INTO @id, @name, @email;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = Sql.select(["id"]).from("test1").where({ id: { $eq: [1, 2, 3] } }).toString();
    expected_s = "SELECT id FROM test1 WHERE (id = 1 OR id = 2 OR id = 3);";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    // Check to make sure it PostgreSQL 9.2 friendly
    s = Sql.set("my_count", 1).toString();
    expected_s = "SET my_count = 1;";
    assert.equal(s, expected_s, "#5\n" + s + "\n" + expected_s);

    // Check MySQL 5.5 variation
    Sql.dialect = dialect.MySQL55;
    s = Sql.set("my_count", 1).toString();
    expected_s = "SET @my_count = 1;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    // Check that SQLite3 throws error
    Sql.dialect = dialect.SQLite3;
    threw_error = false;
    try {
        s = Sql.set("my_count", 1);
    } catch (err) {
        threw_error = true;
    }
    assert.strictEqual(threw_error, true, "Dialect SQLite3 should throw error on set()");
}, label: "Basic SQL assemble tests."});

// Setup some basic tests for SQLite support
harness.push({ callback: function () {
    var wasThrown = false, Sql;

    Sql = new sqlish.Sql({
        dialect: dialect.SQLite3
    });
    
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


//Testing toString() terminations
harness.push({callback: function () {
    var sql = new sqlish.Sql();
    
    assert.equal(sql.eol, ";", "Should have eol equal to ;");
    assert.equal(sql.select("count()").toString(), "SELECT count();");
    assert.equal(sql.select("count()").toString(""), "SELECT count()");
}, label: "Testing toString() terminiations"});


// Test 0.0.3 feature set
harness.push({callback: function () {
    var sql = new sqlish.Sql(),
        s,
        expected_s;
    
    s = sql.deleteFrom("test").toString();
    expected_s = "DELETE FROM test;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = sql.deleteFrom("test").where({ID: 32}).toString();
    expected_s = "DELETE FROM test WHERE ID = 32;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = sql.update("test").toString();
    expected_s = "UPDATE test;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = sql.update("test").set({name: "George", email: "george@example.com"}).where({"test.id": 2}).toString();
    expected_s = 'UPDATE test SET name = "George", email = "george@example.com" WHERE test.id = 2;';
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
}, label: "Test 0.0.3 features."});


// Test 0.0.4 feature set
harness.push({callback: function () {
    var sql = new sqlish.Sql(),
        s,
        expected_s;

    // Bugs needing fixing before version 0.0.4 released
    s = sql.select().toString();
    expected_s = "SELECT *;";

    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = sql.createTable("test", {
        id: {
            type: "INTEGER",
            auto_increment: true,
            primary_key: true
        },
        name: {type: "VARCHAR", length: 255},
        email: {type: "VARCHAR", length: 255},
        modified: {type: "TIMESTAMP"}
    }).toString();
    expected_s = "CREATE TABLE test (id INTEGER AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), email VARCHAR(255), modified TIMESTAMP);";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = sql.dropTable("test");
    expected_s = "DROP TABLE test;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);


    s = sql.createIndex("i_test", {
        unique: false,
        table: "test",
        columns: [ "name", "email" ]
    }).toString();
    expected_s = "CREATE INDEX i_test ON test (name, email);";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = sql.dropIndex("i_test").toString();
    expected_s = "DROP INDEX i_test;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = sql.safeFunc("LAST_INSERT_ID()");
    expected_s = "LAST_INSERT_ID()";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = sql.safeFunc('CONCAT("Hello", "World!")');
    expected_s = 'CONCAT("Hello", "World!")';
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = sql.safeFunc('CONCAT("said", name, ", \\"World I know!\\"")');
    expected_s = 'CONCAT("said", name, ", \\"World I know!\\"")';
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = sql.safeFunc('CONCAT("Hello");SELECT "World!";');
    expected_s = 'CONCAT("Hello")';
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = sql.safeFunc('CONCAT("Hello World!";');
    expected_s = false;
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = sql.safeFunc('CONCAT("Hello World!\');');
    expected_s = false;
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = sql.safeFunc('CONCAT("Hello World!\');');
    expected_s = false;
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = sql.safeFunc('CONCAT("Hello World!", COUNT())');
    expected_s = 'CONCAT("Hello World!", COUNT())';
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
}, label: "Test 0.0.4 features"});


// Tests for injection vulnerabilities
harness.push({callback: function () {
    var sql = new sqlish.Sql(),
        threw_error = false,
        s,
        expected_s,
        sql2,
        evil_injection;

    s = sql.safely("George");
    expected_s = '"George"';
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = sql.safeName("test");
    expected_s = "test";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = sql.safeName("test.two");
    expected_s = "testtwo";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = sql.safeName("test.two", {period: true});
    expected_s = "test.two";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = sql.safeName("test.two.*", {period: true, asterisk: true});
    expected_s = "test.two.*";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    threw_error = false;
    try {
        s = sql.select("test;SELECT * FROM other_test");
    } catch (err) {
        threw_error = true;
    }
    assert.ok(threw_error, "injection error expected");

    threw_error = false;
    try {
        s = sql.createTable("myTable;SELECT * FROM secrets;", {
            id: {
                type: "INTEGER",
                auto_increment: true,
                primary_key: true
            },
            name: {
                type: "VARCHAR",
                length: 255
            }
        });
    } catch (err2) {
        threw_error = true;
    }
    assert.strictEqual(threw_error, true, "Should throw an error when injection attempted on tableName parameter.");
    
    threw_error = false;
    try {
        s = sql.createIndex("i_myTable;SELECT * FROM secrets;", {
            unique: true,
            table: "myTable",
            columns: "name"
        });
    } catch (err3) {
        threw_error = true;
    }
    assert.strictEqual(threw_error, true, "Should throw an error when injection attempted on tableName parameter.");

    sql2 = new sqlish.Sql();
    threw_error = false;
    try {
        s = sql.createView("myView;SELECT * FROM secrets;",
                sql2.select(["id", "name"]).from("myTable")
                    .orderBy("name"));
    } catch (err4) {
        threw_error = true;
    }
    assert.strictEqual(threw_error, true, "Should throw an error when injection attempted on tableName parameter.");

    evil_injection = {
        toString: function () {
            return "This is some random injected string";
        }
    };
    threw_error = false;
    try {
        s = sql.createView("myView",
            evil_injection);
    } catch (err5) {
        threw_error = true;
    }
    assert.strictEqual(threw_error, true, "Should throw an injection error when String object is passed in second parameter.");
}, label: "Test for injection in parameters."});


// Test for 0.0.5 feature set
harness.push({callback: function () {
    var sql  = new sqlish.Sql(),
        s,
        expected_s,
        threw_error = false,
        sql2;

    s = sql.expr({name: "George"});
    expected_s = 'name = "George"';
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = sql.expr({name: {$eq: "George"}});
    expected_s = 'name = "George"';
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = sql.expr({$or: [{name: "George"}, {name: "Georgia"}]});
    expected_s = 'name = "George" OR name = "Georgia"';
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = sql.expr({$or: [{name: "George"}, {name: "Georgia"}, {name: "Wilma"}]});
    expected_s = 'name = "George" OR name = "Georgia" OR name = "Wilma"';
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = sql.expr({$and: [{name: "George"}, {name: "Georgia"}]});
    expected_s = 'name = "George" AND name = "Georgia"';
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = sql.expr({$and: [{name: "George"}, {name: "Georgia"}, {name: "Wilma"}]});
    expected_s = 'name = "George" AND name = "Georgia" AND name = "Wilma"';
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = sql.expr({cnt: 3});
    expected_s = "cnt = 3";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = sql.expr({cnt: {$eq: 3}});
    expected_s = "cnt = 3";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = sql.expr({cnt: {$gt: 3}});
    expected_s = "cnt > 3";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = sql.expr({cnt: {$gte: 3}});
    expected_s = "cnt >= 3";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = sql.expr({cnt: {$lt: 3}});
    expected_s = "cnt < 3";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = sql.expr({cnt: {$lte: 3}});
    expected_s = "cnt <= 3";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = sql.P({cnt: 3});
    expected_s = "(cnt = 3)";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = sql.P({name: {$like: "John"}});
    expected_s = '(name LIKE "John")';
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = sql.P({name: {$like: 5}});
    expected_s = '(name LIKE 5)';
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    threw_error = false;
    try {
        s = sql.P({name: {$like: {name: "some object"}}});
        expected_s = '(name LIKE 5)';
    } catch (err) {
        threw_error = true;
    }
    assert.strictEqual(threw_error, true, "$like should not accept an object as an argument.");

    s = sql.expr({name: {$like: /Albert/}});
    expected_s = 'name LIKE "%Albert%"';
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = sql.expr({name: {$like: /^Albert/}});
    expected_s = 'name LIKE "Albert%"';
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = sql.expr({name: {$like: /Albert$/}});
    expected_s = 'name LIKE "%Albert"';
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = sql.expr({name: {$like: /^Albert$/}});
    expected_s = 'name LIKE "Albert"';
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = sql.expr({name: {$like: /^Albert*Carrots/}});
    expected_s = 'name LIKE "Albert%Carrots%"';
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = sql.expr({name: {$like: /^Albert*Carrots*bricks$/}});
    expected_s = 'name LIKE "Albert%Carrots%bricks"';
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    
    // replace() /* PostgreSQL 9.2 doesn't support replace() */
    sql.dialect = dialect.PostgreSQL92;
    threw_error = false;
    try {
        sql.replace("test", {id: 3, name: "fred"});
    } catch (err2) {
        threw_error = true;
    }
    assert.strictEqual(threw_error, true, "dialect of PostgreSQL should throw error when replace() is called.");
    sql.dialect = dialect.SQL92;

    // createView()
    sql2 = new sqlish.Sql();
    s = sql.createView("myView",
            sql2.select(["id", "name", "email"]).from("profiles")).toString();
    expected_s = "CREATE VIEW myView AS SELECT id, name, email FROM profiles;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    threw_error = false;
    try {
        s = sql.createView("myView", expected_s);
    } catch (err3) {
        threw_error = true;
    }
    assert.strictEqual(threw_error, true, "Calling createView() with string in second parameter should throw error");
    
    // dropView()
    s = sql.dropView("myView").toString();
    expected_s = "DROP VIEW myView;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = sql.select(["id", "name", "building"]).from("personnel").groupBy("building").orderBy("name").toString();
    expected_s = "SELECT id, name, building FROM personnel GROUP BY building ORDER BY name;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = sql.select(["id", "name", "building"]).from("personnel").orderBy("name").groupBy("building").toString();
    expected_s = "SELECT id, name, building FROM personnel GROUP BY building ORDER BY name;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    threw_error = false;
    try {
        s = sql.createTable("myTable;SELECT * FROM secrets;", {
            id: {
                type: "INTEGER",
                auto_increment: true,
                primary_key: true
            },
            name: {
                type: "VARCHAR",
                length: 255
            }
        });
    } catch (err4) {
        threw_error = true;
    }
    assert.strictEqual(threw_error, true, "Should throw an error when injection attempted on tableName parameter.");
    
    // insert()
    // values()
    // update()
    // set() (outside of UPDATE, no prefixed '@')
    // deleteFrom()

    // select()
    // distinct()
    // from()
    // join()
    // union()
    // where()
    // having()
    // in()
    // with()
    // groupBy()
    // orderBy()
    // limit()
    // offset()

    // transaction()
    // commit()
    // rollback()
    // savePoint()
    // releaseSavePoint()
    // begin()
    // end()
    // set() /* where SET is verb MySQL 5.5 and PostgreSQL 9.2 */

}, label: "Test 0.0.5 features"});

if (require.main === module) {
    harness.RunIt(path.basename(module.filename), 10, true);
} else {
    exports.RunIt = harness.RunIt;
}
