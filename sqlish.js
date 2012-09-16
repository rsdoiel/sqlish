
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
            SQL99: "sql 1999",
            SQL03: "sql 2003",
            MySQL55: "mysql 5.5",
            PostgreSQL92: "postgresql 9.2",
            SQLite3: "sqlite 3"
        },
        Sql;

    Sql = function (config) {
        var sql = {
            dialect: Dialect.SQL92,
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
        
        // Return s as a safe variable, table or coloumn name
        var safeName = function (s, options) {
            var re_terms = ["[", "^a-zA-Z0-9_"], re;
            if (options !== undefined) {
                if (options.period !== undefined &&
                        options.period === true) {
                    re_terms.push("\\.");
                }
                if (options.parenthesis !== undefined &&
                        options.parenthesis === true) {
                    re_terms.push("\\(\\)");
                }
                if (options.asterisk !== undefined &&
                        options.asterisk === true) {
                    re_terms.push("\\*");
                }
                if (options.at_sign !== undefined &&
                        options.at_sign === true) {
                    re_terms.push("@");
                }
            }
            re_terms.push("]");
            re = new RegExp(re_terms.join(""), "g");
            //console.log("DEBUG", re, s);
            return s.replace(new RegExp(re_terms.join(""), "g"), "");
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
                    case "\u0000":
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
                        if (this.dialect === Dialect.SQLite3) {
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
        sql.safeName = safeName;
    
        sql.expr = function (obj) {
        };

        sql.insert = function (tableName, obj) {
            var fields = [], values = [], ky,
                options = {period: true};
            
            if (tableName !== safeName(tableName)) {
                tableName = safeName(tableName, options);
            }
			// Mongo 2.2's shell doesn't support Object.keys()
            for (ky in obj) {
                if (obj.hasOwnProperty(ky) && typeof ky === "string") {
                    if (ky !== safeName(ky, options)) {
                        throw ["injection error:", ky].join(" ");
                    }
                    ky = safeName(ky, options);
                    fields.push(ky);
                    values.push(safely(obj[ky]));
                }
            }
            this.sql = ["INSERT INTO ", tableName, " (", fields.join(", "),
                    ") VALUES (", values.join(", "), ")"].join("");
            return this;
        };
    
        sql.replace = function (tableName, obj) {
            var fields = [], values = [], ky,
                options = {period: true};

            if (tableName !== safeName(tableName)) {
                tableName = safeName(tableName, options);
            }
			// Mongo 2.2's shell doesn't support Object.keys()
            for (ky in obj) {
                if (obj.hasOwnProperty(ky) && typeof ky === "string") {
                    if (ky !== safeName(ky, options)) {
                        throw ["injection error:", ky].join(" ");
                    }
                    ky = safeName(ky, options);
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
            var i, s, options = {period: true, parenthesis: true, asterisk: true};
    
            if (fields === undefined) {
                s = "SELECT *";
            } else if (typeof fields === "string") {
                if (safeName(fields, options) !== fields) {
                    throw ["injection error: ", fields].join("");
                }
                s = "SELECT " + safeName(fields, options);
            } else {
                for (i = 0; i < fields.length; i += 1) {
                    if (safeName(fields[i], options) !== fields[i]) {
                        throw "injection error: " + fields[i];
                    }
                    fields[i] = safeName(fields[i], options);
                }
                s = "SELECT " + fields.join(", ");
            }
            this.sql = s;
            return this;
        };
    
        sql.from = function (tables) {
            var i;
            if (typeof tables === "string") {
                if (safeName(tables) !== tables) {
                    throw ["injection error:", tables].join(" ");
                }
                this.sql += " FROM " + safeName(tables);
            } else {
                for (i = 0; i < tables.length; i += 1) {
                    if (safeName(tables[i]) !== tables[i]) {
                        throw "injection error: " + tables[i];
                    }
                    tables[i] = safeName(tables[i]);
                }
                this.sql += " FROM " + tables.join(", ");
            }
            return this;
        };
    
        sql.joinOn = function (tables, expr) {
            var i;
            if (typeof tables === "string") {
                if (safeName(tables) !== tables) {
                    throw ["injection error:", tables].join(" ");
                }
                this.sql += " JOIN " + safeName(tables);
            } else {
                for (i = 0; i < tables.length; i += 1) {
                    if (safeName(tables[i]) !== tables[i]) {
                        throw "injection error: " + tables[i];
                    }
                    tables[i] = safeName(tables[i]);
                }
                this.sql += " JOIN " + tables.join(", ");
            }
            this.sql += " ON " + expr;
            return this;
        };
    
        sql.where = function (expr) {
            // FIXME need ot validate the expression and prevent injection
            this.sql += " WHERE " + expr;
            return this;
        };
    
        sql.limit = function (index, count) {
            if (typeof index !== "number") {
                throw ["injection error:", index].join(" ");
            }
            if (count === undefined || count === null) {
                this.sql += " LIMIT " + index;
            } else {
                if (typeof count !== "number") {
                    throw ["injection error:", count].join(" ");
                }
                this.sql += " LIMIT " + index + "," + count;
            }
            return this;
        };
        
        sql.orderBy = function (fields, direction) {
            var i, options = {period: true};
            if (typeof fields === "string") {
                if (fields !== safeName(fields, options)) {
                    throw ["injection error:", fields].join(" ");
                }
                this.sql += " ORDER BY " + fields;
            } else {
                for (i = 0; i < fields.length; i += 1) {
                    if (fields[i] !== safeName(fields[i], options)) {
                        throw ["injection error:", fields].join(" ");
                    }
                    fields[i] = safeName(fields[i], options);
                }
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
            var i, options = {period: true};

            if (typeof fields === "string") {
                if (fields !== safeName(fields, options)) {
                    throw ["injection error:", fields].join(" ");
                }
                this.sql += " GROUP BY " + fields;
            } else {
                for (i = 0; i < fields.length; i += 1) {
                    if (fields[i] !== safeName(fields[i], options)) {
                        throw ["injection error:", fields].join(" ");
                    }
                    fields[i] = safeName(fields[i], options);
                }
                this.sql += " GROUP BY " + fields.join(", ");
            }
            return this;
        };
        
        // Do a MySQL SET, e.g. SET @my_count = 0;
        // Or add a SET pharse to an UPDATE statement.
        sql.set = function (name, value) {
            var ky, i;
            if (this.sql.indexOf("UPDATE") === 0) {
                if (typeof name === "string") {
                    this.sql += " SET " + safeName(name) +
                        " = " + safely(value);
                } else if (typeof name === "object") {
                    i = 0;
                    this.sql += " SET ";
                    for (ky in name) {
                        if (name.hasOwnProperty(ky)) {
                            if (i > 0) {
                                this.sql += ", ";
                            }
                            i += 1;
                            this.sql += safeName(ky) +
                                " = " + safely(name[ky]);
                        }
                    }
                } else {
                    throw "Cannot add " + name + " to " + this.sql;
                }
            } else {
                if (this.dialect === Dialect.SQLite3) {
                    throw Dialect.SQLite3 + " does not support SET and @varname constructs";
                }
                if (String(value).trim() === "LAST_INSERT_ID()") {
                    if (this.dialect === Dialect.MySQL55) {
                        this.sql = "SET @" + safeName(name) +
                            " = LAST_INSERT_ID()";
                    } else {
                        this.sql = "SET " + safeName(name) +
                            " = LAST_INSERT_ID()";
                    }
                } else {
                    if (this.dialect === Dialect.MySQL55) {
                        this.sql = "SET @" + safeName(name) +
                            " = " + safely(value);
                    } else {
                        this.sql = "SET " + safeName(name) +
                            " = " + safely(value);
                    }
                }
            }
            return this;
        };
        
        sql.into = function (fields) {
            var i, options = {period: true, at_sign: true};
            // support for generating SQLite dialect quoting
            if (this.dialect === Dialect.SQLite3) {
                throw "INTO not supported by " + Dialect.SQLite3;
            }
            if (typeof fields === "string") {
                if (fields !== safeName(fields, options)) {
                    throw ["injection error:", fields].join(" ");
                }
                this.sql += " INTO " + fields;
            } else {
                for (i = 0; i < fields.length; i += 1) {
                    if (fields[i] !== safeName(fields[i], options)) {
                        throw ["injection error:", fields].join(" ");
                    }
                    fields[i] = safeName(fields[i], options);
                }
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

