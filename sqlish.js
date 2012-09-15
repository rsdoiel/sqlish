
//
// sqlish.js - utility methods for creating SQL statements.
//
// @author: R. S. Doiel, <rsdoiel@gmail.com>
// copyright (c) 2012 all rights reserved
//
// Released under the Simplified BSD License.
// See: http://opensource.org/licenses/bsd-license.php
//
//
/*jslint devel: true, node: true, maxerr: 50, indent: 4, vars: true, sloppy: true */

(function (self) {
    var Dialect = {
            SQL92: "sql 1992",
            MySQL55: "mysql 5.5",
            PostgreSQL92: "postgresql 9.2",
            SQLite3: "sqlite 3"
        },
        Sql;

    Sql = function (config) {
        var sql = {
            dialect: Dialect.MySQL55,
            use_UTC: false,
            sql: "",
            eol: ";"
        }, key;

        if (config !== undefined) {
            // Mongo 2.2's shell doesn't support Object.keys()
            for (key in config) {
                if (config.hasOwnProperty(key) && typeof config[key] !== "function") {
					sql[key] = config[key];
                }
            }
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
                ("0" + d.getHours()).substr(-2),
                ":",
                ("0" + d.getMinutes()).substr(-2),
                ":",
                ("0" + d.getSeconds()).substr(-2)
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
                return '"' + sqlDate(s) + '"';
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
                    case "'":
                        if (this.dialect === SQLite) {
                            // SQLite single-quote escaping.
                            return "''";
                        }
                        return "\\" + c;
                    default:
                        return "\\" + c;
                    }
                }).trim(),
                '"'
            ].join("");
        };
    
    
        sql.sqlDate = sqlDate;
        sql.safely = safely;
    
        sql.insert = function (tableName, obj) {
            var fields = [], values = [], ky;
            
			// Mongo 2.2's shell doesn't support Object.keys()
            for (ky in obj) {
                if (obj.hasOwnProperty(ky) && typeof ky === "string") {
                    ky = ky.replace(/![a-zA-Z0-9_]/g, "");
                    fields.push(ky);
	                values.push(safely(obj[ky]));
                }
            }
            this.sql = ["INSERT INTO ", tableName, " (", fields.join(", "),
                    ") VALUES (", values.join(", "), ")"].join("");
            return this;
        };
    
        sql.replace = function (tableName, obj) {
            var fields = [], values = [], ky;

			// Mongo 2.2's shell doesn't support Object.keys()
            for (ky in obj) {
                if (obj.hasOwnProperty(ky) && typeof ky === "string") {
                    ky = ky.replace(/![a-zA-Z0-9_]/g, "");
                    fields.push(ky);
	                values.push(safely(obj[ky]));
                }
            }
            this.sql = ["REPLACE INTO ", tableName, " (", fields.join(", "),
                    ") VALUES (", values.join(", "), ")"].join("");
            return this;
        };
        
        // Select options.    
        sql.select = function (fields) {
            var i, s;
    
            if (fields === undefined) {
                s = "SELECT *";
            } else if (typeof fields === "string") {
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
        // Or add a SET pharse to an UPDATE statement.
        sql.set = function (varNameOrObject, value) {
            var ky, i;
            if (this.sql.indexOf("UPDATE") === 0) {
                if (typeof (varNameOrObject) === "string") {
                    this.sql += " SET " + varNameOrObject.replace(/![a-zA-Z0-9_]/g, '') +
                        " = " + safely(value);
                } else if (typeof varNameOrObject === "object") {
                    i = 0;
                    this.sql += " SET ";
                    for (ky in varNameOrObject) {
                        if (varNameOrObject.hasOwnProperty(ky)) {
                            if (i > 0) {
                                this.sql += ", ";
                            }
                            i += 1;
                            this.sql += ky.replace(/![a-zA-Z0-9_]/g, '') +
                                " = " + safely(varNameOrObject[ky]);
                        }
                    }
                } else {
                    throw "Cannot add " + varNameOrObject + " to " + this.sql;
                }
            } else {
                if (this.dialect === Dialect.SQLite3) {
                    throw Dialect.SQLite3 + " does not support SET and @varname constructs";
                }
                if (String(value).trim() === "LAST_INSERT_ID()") {
                    this.sql = "SET @" + varNameOrObject.replace(/![a-zA-Z0-9_]/g, '') +
                        " = LAST_INSERT_ID()";
                } else {
                    this.sql = "SET @" + varNameOrObject.replace(/![a-zA-Z0-9_]/g, '') +
                        " = " + safely(value);
                }
            }
            return this;
        };
        
        sql.into = function (fields) {
            // support for generating SQLite dialect quoting
            if (this.dialect === Dialect.SQLite3) {
                throw "INTO not supported by " + Dialect.SQLite3;
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
    
        sql.toString = function (eol) {
            if (eol === undefined) {
                return this.sql + this.eol;
            }
            return this.sql + eol;
        };
        
        sql.deleteFrom = function (tableName) {
            this.sql = "DELETE FROM " + tableName;
            return this;
        };

        sql.update = function (tableName) {
            this.sql = "UPDATE " + tableName;
            return this;
        };
        
        sql.createTable = function (tableName, col_defs) {
            var ky, i = 0;

            this.sql = "CREATE TABLE " + tableName + " (";
            for (ky in col_defs) {
                if (col_defs.hasOwnProperty(ky)) {
                    if (typeof ky === "string") {
                        ky = ky.replace(/![a-zA-Z0-9_]/g, '');
                        if (i > 0) {
                            this.sql += ", ";
                        }
                        this.sql += ky + " " + col_defs[ky];
                        i += 1;
                    }
                }
            }
            this.sql += ')';
            
            return this;
        };
        
        // Initial alterTable support RENAME TO, ADD COLUMN, DROP COLUMN
        sql.alterTable = function (tableName, action, col_defs) {
            var ky, i = 0;
            
            this.sql = "ALTER TABLE " + tableName + " " + action;
            if (action.match(/rename to/i)) {
                this.sql += " " + col_defs;
            } else {
                this.sql += " (";
                for (ky in col_defs) {
                    if (col_defs.hasOwnProperty(ky)) {
                        if (typeof ky === "string") {
                            ky = ky.replace(/![a-zA-Z0-9_]/g, '');
                            if (i > 0) {
                                this.sql += ", ";
                            }
                            this.sql += ky + " " + col_defs[ky];
                            i += 1;
                        }
                    }
                }
                this.sql += ")";

            }
            return this;
        };

        sql.dropTable = function (tableName) {
            this.sql = "DROP TABLE " + tableName;
            return this;
        };
        
        sql.createIndex = function (indexName, options) {
            var i;

            if (options.unique !== undefined && options.unique === true) {
                this.sql = "CREATE UNIQUE INDEX " + indexName;
            } else {
                this.sql = "CREATE INDEX " + indexName;
            }
            
            if (options.on === undefined) {
                throw "Must define an index on something.";
            } else {
                this.sql += " ON " + options.on.table + " (";
                for (i = 0; i < options.on.columns.length; i += 1) {
                    if (i > 0) {
                        this.sql += ", ";
                    }
                    this.sql += options.on.columns[i];
                }
                this.sql += ")";
            }
            
            return this;
        };
        
        sql.dropIndex = function (indexName) {
            this.sql = "DROP INDEX " + indexName;
            return this;
        };

        return sql;
    };

    // If we're running under NodeJS then export objects
    self.Dialect = Dialect;
    self.Sql = Sql;
    if (exports !== undefined) {
        exports.Dialect = Dialect;
        exports.Sql = Sql;
    }

    return self;
}(this));

