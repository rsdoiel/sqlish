//
// sqlish.js - utility methods for creating SQL statements.
//
// @author: R. S. Doiel, <rsdoiel@gmail.com>
// copyright (c) 2012 all rights reserved
//
// Released under the Simplified BSD License.
// See: http://opensource.org/licenses/bsd-license.php
//
// revision: 0.0.1
//
/*jslint devel: true, node: true, maxerr: 50, indent: 4, vars: true, sloppy: true */

(function (self) {
    var MySQL = "mysql",
        SQLite = "sqlite",
        Sql;


    Sql = function (config) {
        var sql = {
            dialect: MySQL,
            use_UTC: false,
            sql: ""
        };
    
        if (config !== undefined) {
            Object.keys(config).forEach(function (key) {
                sql[key] = config[key];
            });
        }
    
    
    
        // Build an appropriate data string
        // from a JavaScript Date object.
        var sqlDate = function (d, use_UTC) {
            if (d === undefined) {
                d = new Date();
            } else if (typeof d === "string") {
                d = new Date(d);
            }
            
            if (use_UTC === undefined) {
                use_UTC = sql.use_UTC;
            }
            
            if (use_UTC === true) {
                if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 &&
                        d.getUTCSeconds() === 0 && d.getUTCMilliseconds() === 0) {
                    return [
                        d.getUTCFullYear(),
                        ("0" + (d.getUTCMonth() + 1)).substr(-2),
                        ("0" + d.getUTCDate()).substr(-2)
                    ].join("-");
                }
                return [
                    d.getUTCFullYear(),
                    "-",
                    ("0" + (d.getUTCMonth() + 1)).substr(-2),
                    "-",
                    ("0" + d.getUTCDate()).substr(-2),
                    " ",
                    d.getUTCHours(),
                    ":",
                    d.getUTCMinutes(),
                    ":",
                    d.getUTCSeconds()
                ].join("");
            }
        
            if (d.getHours() === 0 && d.getMinutes() === 0 &&
                    d.getSeconds() === 0 && d.getMilliseconds() === 0) {
                return [
                    d.getFullYear(),
                    ("0" + (d.getMonth() + 1)).substr(-2),
                    ("0" + d.getDate()).substr(-2)
                ].join("-");
            }
            return [
                d.getFullYear(),
                "-",
                ("0" + (d.getMonth() + 1)).substr(-2),
                "-",
                ("0" + d.getDate()).substr(-2),
                " ",
                d.getHours(),
                ":",
                d.getMinutes(),
                ":",
                d.getSeconds()
            ].join("");
        };
    
        // Return s as a double quoted string
        // safely escaped.
        var safely = function (s) {
            if (s === undefined || s === null) {
                return 'NULL';
            }
        
            switch (typeof s) {
            case 'boolean':
                if (s === true) {
                    return 'true';
                } else {
                    return 'false';
                }
            case 'number':
                return String(s);
            }
        
            if (s instanceof Date) {
                return sqlDate(s);
            }
        
            if (String(s).trim().substr(0, 1) === '@') {
                return s.replace(/![a-zA-Z0-9_]/g, '').trim();
            }
            if (String(s).trim() === "" || String(s).trim() === '""') {
                return '""';
            }
            return [
                '"',
                String(s).replace(/[\0\n\r\b\t\\\'\"\x1a]/g, function (c) {
                    switch (c) {
                    case "\0":
                        return "\\0";
                    case "\n":
                        return "\\n";
                    case "\r":
                        return "\\r";
                    case "\b":
                        return "\\b";
                    case "\t":
                        return "\\t";
                    case "\x1a":
                        return "\\Z";
                    default:
                        // FIXME: Need to add SQLite style escaping here.
                        return "\\" + c;
                    }
                }).trim(),
                '"'
            ].join("");
        };
    
    
        sql.sqlDate = sqlDate;
        sql.safely = safely;
    
        sql.insert = function (tableName, obj) {
            var fields = [], values = [];
            Object.keys(obj).forEach(function (item) {
                var key, value;
                
                // FIXME, I need to skip arrays, non-Date objects and
                // functions
                fields.push(item.replace(/![a-zA-Z0-9_]/g, ""));
                values.push(safely(obj[item]));
            });
            this.sql = ["INSERT INTO ", tableName, " (", fields.join(", "),
                    ") VALUES (", values.join(", "), ")"].join("");
            return this;
        };
    
        sql.replace = function (tableName, obj) {
            var fields = [], values = [];
            Object.keys(obj).forEach(function (item) {
                var key, value;
                
                fields.push(item.replace(/![a-zA-Z0-9_]/g, ""));
                values.push(safely(obj[item]));
            });
            this.sql = ["REPLACE INTO ", tableName, " (", fields.join(", "),
                    ") VALUES (", values.join(", "), ")"].join("");
            return this;
        };
        
        // Select options.    
        sql.select = function (fields) {
            var i, s;
    
            if (typeof fields === "string") {
                s = "SELECT " + fields.replace(/![a-zA-Z0-9_\.\*]/g, "");
            } else {
                for (i = 0; i < fields.length; i += 1) {
                    fields[i] = fields[i].replace(/![a-zA-Z0-9_\.\*]/g, "");
                }
                s = "SELECT " + fields.join(", ");
            }
            this.sql = s;
            return this;
        };
    
        sql.from = function (tables) {
            if (typeof tables === "string") {
                this.sql += " FROM " + tables;
            } else {
                this.sql += " FROM " + tables.join(", ");
            }
            return this;
        };
    
        sql.joinOn = function (tables, expr) {
            if (typeof tables === "string") {
                this.sql += " JOIN " + tables;
            } else {
                this.sql += " JOIN " + tables.join(", ");
            }
            this.sql += " ON " + expr;
            return this;
        };
    
        sql.where = function (expr) {
            this.sql += " WHERE " + expr;
            return this;
        };
    
        sql.limit = function (index, count) {
            if (count === undefined || count === null) {
                this.sql += " LIMIT " + index;
            } else {
                this.sql += " LIMIT " + index + "," + count;
            }
            return this;
        };
        
        sql.orderBy = function (fields, direction) {
            if (typeof fields === "string") {
                this.sql += " ORDER BY " + fields;
            } else {
                this.sql += " ORDER BY " + fields.join(", ");
            }
            if (direction === undefined || direction === null) {
                return this;
            } else if (direction.toUpperCase() === "ASC" || direction >= 0) {
                this.sql += " ASC";
            } else if (direction.toUpperCase() === "DESC" || direction < 0) {
                this.sql += " DESC";
            }
            return this;
        };
    
        sql.groupBy = function (fields) {
            if (typeof fields === "string") {
                this.sql += " GROUP BY " + fields;
            } else {
                this.sql += " GROUP BY " + fields.join(", ");
            }
            return this;
        };
        
        // Do a MySQL SET, e.g. SET @my_count = 0;
        sql.set = function (varName, value) {
            if (this.dialect === SQLite) {
                throw "SQLite does not support SET and @varname constructs";
            }
            if (String(value).trim() === "LAST_INSERT_ID()") {
                this.sql = "SET @" + varName.replace(/![a-zA-Z0-9_]/g, '') +
                    " = LAST_INSERT_ID()";
            } else {
                this.sql = "SET @" + varName.replace(/![a-zA-Z0-9_]/g, '') +
                    " = " + safely(value);
            }
            return this;
        };
        
        sql.into = function (fields) {
            // support for generating SQLite dialect quoting
            if (this.dialect === SQLite) {
                throw "INTO not supported in SQLite.";
            }
            if (typeof fields === "string") {
                this.sql += " INTO " + fields;
            } else {
                this.sql += " INTO " + fields.join(", ");
            }
            return this;
        };
        
        sql.valueOf = function () {
            return this.sql;
        };
    
        sql.toString = function () {
            return this.sql;
        };
        
        return sql;
    };

    // If we're running under NodeJS then export objects
    self.MySQL = MySQL;
    self.SQLite = SQLite;
    self.Sql = Sql;
    if (exports !== undefined) {
        exports.MySQL = MySQL;
        exports.Sql = Sql;
        exports.SQLite = SQLite;
    }

    return self;
}(this));

