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
/*global require, exports */

var path = require("path"),
    assert = require("assert"),
    util = require("util"),
    sqlish = require("../sqlish"),
    dialect = sqlish.Dialect,
    harness = require("harness");


// Basic SQL assembly
harness.push({callback: function () {
    var Sql = sqlish.Sqlish(),
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
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

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
    
    s = Sql.select(["id", "name", "email"]).from("test1").where({id: 1}).order("name").toString();
    expected_s = "SELECT id, name, email FROM test1 WHERE id = 1 ORDER BY name;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = Sql.select(["id", "name", "email"]).from("test1").where({id:  1}).order(["name", "email"]).toString();
    expected_s = "SELECT id, name, email FROM test1 WHERE id = 1 ORDER BY name, email;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = Sql.select(["id", "name", "email"]).from("test1").where({id: 1}).group(["email", "name"]).toString();
    expected_s = "SELECT id, name, email FROM test1 WHERE id = 1 GROUP BY email, name;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = Sql.select(["id", "name", "email"]).from("test1").where({id: 1}).group("email").toString();
    expected_s = "SELECT id, name, email FROM test1 WHERE id = 1 GROUP BY email;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = Sql.select(["id", "name", "email"]).from("test1").where({id: 1}).group(["email"]).order(["email", "name"]).toString();
    expected_s = "SELECT id, name, email FROM test1 WHERE id = 1 GROUP BY email ORDER BY email, name;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = Sql.select(["id", "name", "email"]).from("test1").where({id: 1}).limit(1).toString();
    expected_s = "SELECT id, name, email FROM test1 WHERE id = 1 LIMIT 1;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    s = Sql.select(["id", "name", "email"]).from("test1").where({id: 1}).limit(1, 1).toString();
    expected_s = "SELECT id, name, email FROM test1 WHERE id = 1 LIMIT 1 OFFSET 1;";
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
    Sql = new sqlish.Sqlish("MySQL 5.5");
    s = Sql.set("@my_count", 1).toString();
    expected_s = "SET @my_count = 1;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    // Check that PostgreSQL 9.2
    Sql = new sqlish.Sqlish("PostgreSQL 9.2");
    threw_error = false;
    try {
    	Sql.replace("test", {});
    } catch (err) {
    	threw_error = true;
    }
    assert.strictEqual(threw_error, true, "PostgreSQL 9.2 should throw an error on REPLACE");

    
    s = Sql.update("test").set("my_count", 0).toString();
    expected_s = "UPDATE test SET my_count = 0;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    // Check that SQLite3 throws error
    Sql = new sqlish.Sqlish("SQLite 3");
    threw_error = false;
    try {
        s = Sql.set("my_count", 1);
    } catch (err) {
        threw_error = true;
    }
    assert.strictEqual(threw_error, true, "Dialect SQLite3 should throw error on set()");
    harness.completed("Basic SQL assemble tests.");
}, label: "Basic SQL assemble tests."});

// Setup some basic tests for SQLite support
harness.push({ callback: function () {
    var wasThrown = false, Sql;

    Sql = new sqlish.Sqlish("SQLite 3");
    
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
    harness.completed("SQLite specific tests.");
}, label: "SQLite specific tests."});


//Testing toString() terminations
harness.push({callback: function () {
    var sql = new sqlish.Sqlish();
    
    assert.equal(sql.eol, ";", "Should have eol equal to ;");
    assert.equal(sql.select("count()").toString(), "SELECT count();");
    assert.equal(sql.select("count()").toString(""), "SELECT count()");
    harness.completed("Testing toString() terminations");
}, label: "Testing toString() terminations"});


// Test 0.0.3 feature set
harness.push({callback: function () {
    var sql = new sqlish.Sqlish(),
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
    harness.completed("Test 0.0.3 features.");
}, label: "Test 0.0.3 features."});


// Test 0.0.4 feature set
harness.push({callback: function () {
    var sql = new sqlish.Sqlish(),
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
    harness.completed("Test 0.0.4 features");
}, label: "Test 0.0.4 features"});


// Tests for injection vulnerabilities
harness.push({callback: function () {
    var sql = new sqlish.Sqlish(),
        threw_error = false,
        s,
        expected_s,
        sql2,
        evil_object_injection;

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

    sql2 = new sqlish.Sqlish();
    threw_error = false;
    try {
        s = sql.createView("myView;SELECT * FROM secrets;",
                sql2.select(["id", "name"]).from("myTable")
                    .order("name"));
    } catch (err4) {
        threw_error = true;
    }
    assert.strictEqual(threw_error, true, "Should throw an error when injection attempted on tableName parameter.");

    evil_object_injection = {
        toString: function () {
            return "This is some random injected string";
        }
    };
    threw_error = false;
    try {
        s = sql.createView("myView", evil_object_injection);
    } catch (err5) {
        threw_error = true;
    }
    assert.strictEqual(threw_error, true,
		"Should throw an injection error: " + evil_object_injection);
    s = sql.set({"@myVar": 'CONCAT(2, COUNT(3), " Jiminy Cricket")'}).toString();
    expected_s = 'SET @myVar = CONCAT(2, COUNT(3), " Jiminy Cricket");';
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
	
	s = sql.expr({"test.profile_id": "profiles.profile_id"});
	expected_s = "test.profile_id = \"profiles.profile_id\"";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

	// Applies rules to detect if the value is what you expect.
	// E.g. is it a number you expect a number back, if it is
	// a column reference you expect the column reference back.
	sql = new sqlish.Sqlish();
	assert.notEqual(sql.schemas, undefined, "Should have schemes defined");
	sql.on("test", {
		profile_id: function (value) {
			if (value === "profile_id" ||
					value === "test.profile_id" ||
					parseInt(value, 10) === value) {
				return value;
			}
			throw "injection error, test.profile_id: " + value;
		}
	});
	assert.notEqual(sql.schemas.test, undefined, "Should have sql.schemas.test defined");
	sql.on("profiles", {
		profile_id: function (value) {
			if (value === "profile_id" ||
					value === "profiles.profile_id" ||
					parseInt(value, 10) === value) {
				return value;
			}
			throw "injection error, profiles.profile_id: " + value;
		}
	});
	assert.notEqual(sql.schemas.profiles, undefined, "Should have sql.schemas.profiles defined.");

	assert.equal(sql.safely("test.profile_id", sql.schemas),
				 "test.profile_id",
				 "Should find column: " + sql.isColumnName("test.profile_id", sql.schemas));
	assert.equal(sql.safely("profiles.profile_id", sql.schemas),
				 "profiles.profile_id",
				 "Should find column: " + sql.isColumnName("profiles.profile_id", sql.schemas));
	
	s = sql.expr({"test.profile_id": "profiles.profile_id"}, sql.schemas);
	expected_s = "test.profile_id = profiles.profile_id";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

	s = sql.expr({"test.profile_id": {$eq: "profiles.profile_id"}}, sql.schemas);
	expected_s = "test.profile_id = profiles.profile_id";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

	s = sql.expr({"test.profile_id": {$ne: "profiles.profile_id"}}, sql.schemas);
	expected_s = "test.profile_id != profiles.profile_id";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

	s = sql.expr({"test.profile_id": {$gt: "profiles.profile_id"}}, sql.schemas);
	expected_s = "test.profile_id > profiles.profile_id";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

	s = sql.expr({"test.profile_id": {$gte: "profiles.profile_id"}}, sql.schemas);
	expected_s = "test.profile_id >= profiles.profile_id";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

	s = sql.expr({"test.profile_id": {$lt: "profiles.profile_id"}}, sql.schemas);
	expected_s = "test.profile_id < profiles.profile_id";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

	s = sql.expr({"test.profile_id": {$lte: "profiles.profile_id"}}, sql.schemas);
	expected_s = "test.profile_id <= profiles.profile_id";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    harness.completed("Test for injection in parameters.");
}, label: "Test for injection in parameters."});


// Test for 0.0.5 feature set
harness.push({callback: function () {
    var sql  = new sqlish.Sqlish(),
        s,
        expected_s,
        threw_error = false,
        sql1,
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
    sql = new sqlish.Sqlish("PostgreSQL 9.2");
    threw_error = false;
    try {
        sql.replace("test", {id: 3, name: "fred"});
    } catch (err2) {
        threw_error = true;
    }
    assert.strictEqual(threw_error, true, "dialect of PostgreSQL should throw error when replace() is called.");
    
    sql = new sqlish.Sqlish();

    // createView()
    sql2 = new sqlish.Sqlish();
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

    s = sql.select(["id", "name", "building"]).from("personnel").group("building").order("name").toString();
    expected_s = "SELECT id, name, building FROM personnel GROUP BY building ORDER BY name;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    s = sql.select(["id", "name", "building"]).from("personnel").order("name").group("building").toString();
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

    s = sql.select([
        {id: "building_id"},
        "name",
        "building",
        {"COUNT()": "cnt"}
    ]).from("personnel").order("name").group("building").toString();
    expected_s = "SELECT id AS building_id, name, building, COUNT() AS cnt FROM personnel GROUP BY building ORDER BY name;";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
    
    sql1 = new sqlish.Sqlish();
    sql2 = new sqlish.Sqlish();
    
    sql1.select().from("test1");
    sql2.select().from("test2");
    s = sql.union(sql1, sql2).toString();
    expected_s = "(SELECT * FROM test1) UNION (SELECT * FROM test2);";
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

    // distinct
    sql = new sqlish.Sqlish();
    s = sql.select(["id", "name"], {distinct: true})
            .from("test").where({name: {$like: "friend"}}).toString();
    expected_s = 'SELECT DISTINCT id, name FROM test WHERE name LIKE "friend";';
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
	
    sql = new sqlish.Sqlish();
    s = sql.select(["id", "name"], {distinct: true})
            .from("test").where({name: {$like: "friend"}})
			.order("name", -1).toString();
    expected_s = 'SELECT DISTINCT id, name FROM test WHERE name LIKE "friend" ORDER BY name DESC;';
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
	
    sql = new sqlish.Sqlish();
	sql.on("test", {
		id: function (value) {
			if (value === "id" ||
					value === "test.id" ||
					parseInt(value, 10) === value) {
				return value;
			}
			throw "injection error, test.id: " + value;
		}
	});
	sql.on("profiles", {
		id: function (value) {
			if (value === "id" ||
					value === "profiles.id" ||
					parseInt(value, 10) === value) {
				return value;
			}
			throw "injection error, profiles.profile_id: " + value;
		}
	});
    s = sql.select(["id", "name"], {distinct: false})
            .from("test").join("profiles", {"test.id": "profiles.id"})
			.where({name: {$like: "friend"}})
			.order("name", -1).toString();
    expected_s = 'SELECT id, name FROM test JOIN profiles ON (test.id = profiles.id) WHERE name LIKE "friend" ORDER BY name DESC;';
    assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
	harness.completed("Test 0.0.5 features");
}, label: "Test 0.0.5 features"});

harness.push({callback: function () {
	var sql = new sqlish.Sqlish("MySQL 5.5"),
		row = {
			date: '12/02/12',
			title: 'TBD',
			location: 'McDonald\'s Swim Stadium',
			time: 'TBA' 
  		};

	assert.ok(sql.select("id").from("event").toString(), "select().from()");
	// BUG: by the time where() is called dialect was getting lost.
	assert.ok(sql.select("id").from("event").where({$and: [{title: row.title}, 
						{location: row.location}]}),
						"select().from().where()" + util.inspect(sql));
	
    // having()
    // in()
    // with()
    // offset()

    // transaction()
    // commit()
    // rollback()
    // savePoint()
    // releaseSavePoint()
    // begin()
    // end()
    harness.completed("Test 0.0.6 bugs");
}, label: "Test 0.0.6 bugs"});

harness.push({callback: function (test_label) {
	var sql = new sqlish.Sqlish("MySQL 5.5");

	expected_s = 'REPLACE INTO wp_posts (ID, post_author, post_date, post_date_gmt, post_content, post_title, post_excerpt, post_status, comment_status, ping_status, post_password, post_name, to_ping, pinged, post_modified, post_modified_gmt, post_content_filtered, post_parent, guid, menu_order, post_type, post_mime_type, comment_count) VALUES (0, 0, "2012-11-04 08:53:03", "2012-11-04 16:53:3", "", "test.png", "Test Caption", "inherit", "closed", "closed", "", "2012/08/28/test.png", "", "", "2012-11-04 08:53:03", "2012-11-04 16:53:03", "", @parent_id, "http://localhost/2012/08/28/test.png", 0, "attachment", "image/png", 0);'
		
	s = sql.replace("wp_posts", {
		ID: 0,
		post_author: 0,
		post_date: "2012-11-04 08:53:03",
		post_date_gmt: "2012-11-04 16:53:3",
		post_content: "",
		post_title: "test.png",
		post_excerpt: "Test Caption",
		post_status: "inherit",
		comment_status: "closed",
		ping_status: "closed",
		post_password: "",
		post_name: "2012/08/28/test.png",
		to_ping: "",
		pinged: "",
		post_modified: "2012-11-04 08:53:03",
		post_modified_gmt: "2012-11-04 16:53:03",
		post_content_filtered: "",
		post_parent: "@parent_id",
		guid: "http://localhost/2012/08/28/test.png",
		menu_order: 0,
		post_type: "attachment",
		post_mime_type: "image/png",
		comment_count: 0
	}).toString();
	
	assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);

	expected_s = 'REPLACE INTO wp_posts (ID, post_author, post_date, post_date_gmt, post_content, post_title, post_excerpt, post_status, comment_status, ping_status, post_password, post_name, to_ping, pinged, post_modified, post_modified_gmt, post_content_filtered, post_parent, guid, menu_order, post_type, post_mime_type, comment_count) VALUES (0, 0, "2012-11-04 08:53:03", "2012-11-04 16:53:3", "", "test.png", "Test Caption", "inherit", "closed", "closed", "", "2012/08/28/test.png", "", "", "2012-11-04 08:53:03", "2012-11-04 16:53:03", "", @parent_id, "http://localhost/2012/08/28/test.png", 0, "attachment", "image/png", 0)';

	s = sql.replace("wp_posts", {
		ID: 0,
		post_author: 0,
		post_date: "2012-11-04 08:53:03",
		post_date_gmt: "2012-11-04 16:53:3",
		post_content: "",
		post_title: "test.png",
		post_excerpt: "Test Caption",
		post_status: "inherit",
		comment_status: "closed",
		ping_status: "closed",
		post_password: "",
		post_name: "2012/08/28/test.png",
		to_ping: "",
		pinged: "",
		post_modified: "2012-11-04 08:53:03",
		post_modified_gmt: "2012-11-04 16:53:03",
		post_content_filtered: "",
		post_parent: "@parent_id",
		guid: "http://localhost/2012/08/28/test.png",
		menu_order: 0,
		post_type: "attachment",
		post_mime_type: "image/png",
		comment_count: 0
	}).toString("");
	
	assert.equal(s, expected_s, "\n" + s + "\n" + expected_s);
       
	harness.completed(test_label);
}, label: "Test 0.0.8 bugs"});

harness.RunIt(path.basename(module.filename), 10);
