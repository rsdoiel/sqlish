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
    sqlish = require("./sqlish"),
    TestHarness = require("./harness"),
    run_group = TestHarness.run_group,
    test_delay = 10;


// Basic SQL assembly
TestHarness.push({callback: function () {
    var Sql = new sqlish.Sql(),
        s,
        expected_s;
    
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
TestHarness.push({ callback: function () {
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

if (require.main === module) {
    TestHarness.RunIt(path.basename(module.filename), 10, true);
} else {
    exports.RunIt = TestHarness.RunIt;
}
