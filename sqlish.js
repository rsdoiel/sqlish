
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
    "use strict";

    var Dialect = {
            SQL92: "SQL 1992",
            MySQL55: "MySQL 5.5",
            PostgreSQL92: "PostgreSQL 9.2",
            SQLite3: "SQLite 3"
        },
        Sql;

    Sql = function (config) {
        var sql = {
            dialect: Dialect.SQL92,
            use_UTC: false,
            verbs: {
                // Defining schema
                createTable: true,
                dropTable: true,
                createIndex: true,
                dropIndex: true,
                createView: true,
                dropView: true,
                // Rows interaction
                insert: true,
                update: true,
                replace: true,
                deleteFrom: true,
                select: true,
                set: true,
                union: true
            },
            clauses: {
                // Supporting clauses
                set: true,
                from: true,
                joinOn: true,
                where: true,
                limit: true,
                orderBy: true,
                groupBy: true,
                into: true
            },
            sql: {},
            eol: ";"
        }, key;

        if (typeof config !== "undefined") {
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
            if (typeof d === "undefined") {
                d = new Date();
            } else if (typeof d === "string") {
                d = new Date(d);
            }
            
            if (typeof use_UTC === "undefined") {
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
            if (typeof options !== "undefined") {
                if (typeof options.period !== "undefined" &&
                        options.period === true) {
                    re_terms.push("\\.");
                }
                if (typeof options.parenthesis !== "undefined" &&
                        options.parenthesis === true) {
                    re_terms.push("\\(\\)");
                }
                if (typeof options.asterisk !== "undefined" &&
                        options.asterisk === true) {
                    re_terms.push("\\*");
                }
                if (typeof options.at_sign !== "undefined" &&
                        options.at_sign === true) {
                    re_terms.push("@");
                }
                if (typeof options.dollar_sign !== "undefined" &&
                        options.dollar_sign === true) {
                    re_terms.push("\\$");
                }
            }
            re_terms.push("]");
            re = new RegExp(re_terms.join(""), "g");
            return String(s).replace(new RegExp(re_terms.join(""), "g"), "");
        };
        
        var safeFunc = function (s) {
            var re1 = /^[A-Z_]+\(\)$/i,
                re2 = /^[A-Z_]+\(/i,
                reParamOkChar = /(\s|[0-9]|[a-z]|,|\.)/i,
                m2,
                i,
                quot,
                parens;
            if (String(s).match(re1)) {
                return s;
            }
            m2 = String(s).match(re2);
            if (m2) {
                // Scan the string to make sure quoted content is
                // propertly escaped.
                quot = null;
                parens = 1;
                for (i = m2[0].length; i < s.length; i += 1) {
                    if (quot === null) {
                        // outside a quoted string
                        if (s[i] === "'" || s[i] === '"') {
                            quot = s[i];
                        } else if (s[i] === ';') {
                            return false;
                        } else if (s[i] === '(') {
                            parens += 1;
                        } else if (s[i] === ')') {
                            parens -= 1;
                            if (parens === 0) {
                                return s.substr(0, i + 1);
                            }
                        } else if (!String(s[i]).match(reParamOkChar)) {
                            throw "injection error: at '" + s[i] + "' in " + s;
                        }
                    } else {
                        // Inside quoted string.
                        if (s[i] === "\\" && (i + 1) < s.length) {
                            i += 1;
                        } else if (s[i] === quot) {
                            quot = null;
                        }
                    }
                }
            }
            return false;
        };

        // Return s as a double quoted string
        // safely escaped.
        var safely = function (s) {
            if (typeof s === "undefined" || s === null) {
                return 'NULL';
            }

            switch (typeof s) {
            case 'boolean':
                if (s === true) {
                    return 'true';
                }
                return 'false';
            case 'number':
                return s;
            case 'string':
                s = s.trim();
                if (s.substr(0, 1) === '@') {
                    return safeName(s, {at_sign: true}).trim();
                }
                if (s === "" || s === '""') {
                    return '""';
                }
                return [
                    '"',
                    s.replace(/[\0\n\r\b\t\\\'\"\x1a]/g, function (c) {
                        switch (c) {
                        case /\0/:
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
            }

            if (s instanceof Date) {
                return '"' + sqlDate(s) + '"';
            }
            throw ["injection error:", s].join(" ");
        };

        var firstKey = function (obj) {
            var ky;
            if (typeof obj === "object") {
                for (ky in obj) {
                    if (obj.hasOwnProperty(ky)) {
                        return ky;
                    }
                }
            }
            return false;
        };
        
        var re2SQLWildcard = function (re) {
            var s = re.toString();
            // Trim the first and last slash
            s = s.substr(1, s.length - 2);
            // replace * with %
            s = s.replace(/\*/g, '%');
            if (s.indexOf('^') === 0 && s.indexOf('$') === (s.length - 1)) {
                return s.substr(1, s.length - 2);
            } else if (s.indexOf('^') === 0) {
                return s.substr(1).replace(/\s+$/, '') + '%';
            } else if (s.indexOf('$') === (s.length - 1)) {
                return '%' + s.substr(0, s.length - 1).replace(/^\s+/, '');
            } else if (s.indexOf('^') === -1 && s.indexOf('$') === -1) {
                return '%' + s + '%';
            }
            return s;
        };
        
        var expr = function (obj) {
            var options = {
                    period: true,
                    dollar_sign: true
                },
                ky = firstKey(obj),
                vals,
                i;

            if (ky === false || ky !== safeName(ky, options)) {
                throw "injection error: " + obj +
                    " should be an object literal";
            }
             
            // Does key begin with $eq, $ne, $gt, $gte, $lt, $lte,
            // $or, $and, $like
            if (ky.substr(0, 1) ===  "$") {
                switch (ky) {
                case '$eq':
                    if (Array.isArray(obj[ky])) {
                        return obj[ky].map(function (v) {
                            return safely(v);
                        });
                    }
                    return "= " + safely(obj[ky]);
                case '$ne':
                    if (typeof obj[ky] === "object") {
                        return ["!=", expr(obj[ky])].join(" ");
                    }
                    return ["!=", safely(obj[ky])].join(" ");
                case '$gt':
                    if (typeof obj[ky] === "object") {
                        return [">", expr(obj[ky])].join(" ");
                    }
                    return [">", safely(obj[ky])].join(" ");
                case '$gte':
                    if (typeof obj[ky] === "object") {
                        return [">=", expr(obj[ky])].join(" ");
                    }
                    return [">=", safely(obj[ky])].join(" ");
                case '$lt':
                    if (typeof obj[ky] === "object") {
                        return ["<", expr(obj[ky])].join(" ");
                    }
                    return ["<", safely(obj[ky])].join(" ");
                case '$lte':
                    if (typeof obj[ky] === "object") {
                        return ["<=", expr(obj[ky])].join(" ");
                    }
                    return ["<=", safely(obj[ky])].join(" ");
                case '$or':
                    vals = [];
                    if (typeof obj[ky].length === undefined) {
                        throw "$or takes an array of objects as the value";
                    }
                    for (i = 0; i < obj[ky].length; i += 1) {
                        vals.push(expr(obj[ky][i]));
                    }
                    return vals.join(" OR ");
                case '$and':
                    vals = [];
                    if (typeof obj[ky].length === undefined) {
                        throw "$and takes an array of objects as the value";
                    }
                    for (i = 0; i < obj[ky].length; i += 1) {
                        vals.push(expr(obj[ky][i]));
                    }
                    return vals.join(" AND ");
                case '$like':
                    if (typeof obj[ky] === "object") {
                        if (obj[ky] instanceof RegExp) {
                            return "LIKE " +
                                safely(re2SQLWildcard(obj[ky]));
                        } else {
                            throw "$like takes a value that is of type string or number";
                        }
                    }

                    return "LIKE " + safely(obj[ky]);
                default:
                    throw [ky, "not supported"].join(" ");
                }
            } else if (typeof obj[ky] === "object") {
                var clause = expr(obj[ky]);

                if (Array.isArray(clause)) {
                    return '(' + clause.map(function (v) {
                        return [ky, v].join(" = ");
                    }).join(" OR ") + ')';
                }

                return [ky, expr(obj[ky])].join(" ");
            }
            return [ky, safely(obj[ky])].join(" = ");
        };

        var P = function (expression) {
            return ["(", expr(expression), ")"].join("");
        };

        var isSafeSqlObj = function (a_obj) {
            var error = true;

            ['sql', 'sql.verb', 'sqlDate', 'safely', 'safeName', 'expr', 'P', 'toString'].forEach(function (elem) {
                var out = a_obj;

                elem.split('.').forEach(function (key) {
                    out = out[key];
                });

                if (typeof out === 'undefined') {
                    error = false;
                }
            });

            return error;
        };

        sql.sqlDate = sqlDate;
        sql.safely = safely;
        sql.safeName = safeName;
        sql.safeFunc = safeFunc;
        sql.expr = expr;
        sql.P = P;
        sql.isSafeSqlObj = isSafeSqlObj;

        /*
         * Primary query methods - verbs and clauses 
         */
        sql.createTable = function (tableName, col_defs) {
            var ky;

            // Check to see if verb is available or over written
            if (typeof this.verbs.createTable === "function") {
                return this.verbs.createTable(tableName, col_defs);
            } else if (this.verbs.createTable === false) {
                throw "createTable not supported by " + this.dialect;
            }

            if (tableName !== safeName(tableName)) {
                throw "injection error: " + tableName;
            }

            for (ky in col_defs) {
                if (col_defs.hasOwnProperty(ky)) {
                    if (ky !== safeName(ky)) {
                        throw "injection error:" + col_defs;
                    }
                }
            }

            this.sql = {};
            this.sql.tableName = tableName;
            this.sql.verb = "CREATE TABLE";
            this.sql.columns = col_defs;
            return this;
        };
        
        sql.dropTable = function (tableName) {
            // Check to see if verb is available or over written
            if (typeof this.verbs.dropTable === "function") {
                return this.verbs.dropTable(tableName);
            } else if (this.verbs.dropTable === false) {
                throw "createTable not supported by " + this.dialect;
            }

            this.sql = {};
            
            if (tableName !== safeName(tableName)) {
                throw "injection error: " + tableName;
            }
            this.sql.tableName = tableName;
            this.sql.verb = "DROP TABLE";
            return this;
        };
        
        sql.createIndex = function (indexName, options) {
            var i;

            // Check to see if verb is available or over written
            if (typeof this.verbs.createIndex === "function") {
                return this.verbs.createIndex(indexName, options);
            } else if (this.verbs.createIndex === false) {
                throw "createIndex not supported by " + this.dialect;
            }

            if (indexName !== safeName(indexName)) {
                throw "injection error:" + indexName;
            }
            this.sql = {};
            this.sql.indexName = indexName;
            if (typeof options.unique !== "undefined" && options.unique === true) {
                this.sql.verb = "CREATE UNIQUE INDEX";
            } else {
                this.sql.verb = "CREATE INDEX";
            }
            
            if (typeof options.table === "undefined" || typeof options.columns === "undefined") {
                throw "Must define an index on something.";
            } else {
                this.sql.table = options.table;
                this.sql.columns = [];
                for (i = 0; i < options.columns.length; i += 1) {
                    this.sql.columns.push(options.columns[i]);
                }
            }
            
            return this;
        };
        
        sql.dropIndex = function (indexName) {
            // Check to see if verb is available or over written
            if (typeof this.verbs.dropIndex === "function") {
                return this.verbs.dropIndex(indexName);
            } else if (this.verbs.dropIndex === false) {
                throw "dropIndex not supported by " + this.dialect;
            }

            if (indexName !== safeName(indexName)) {
                throw "injection error: " + indexName;
            }
            this.sql = {};
            this.sql.indexName = indexName;
            this.sql.verb = "DROP INDEX";
            return this;
        };
        
        sql.createView = function (viewName, sql_obj) {
            // Check to see if verb is available or over written
            if (typeof this.verbs.createView === "function") {
                return this.verbs.createView(viewName, sql_obj);
            } else if (this.verbs.createView === false) {
                throw "createView not supported by " + this.dialect;
            }

            if (viewName !== safeName(viewName)) {
                throw "injection error: " + viewName;
            }

            // Make sure sql_obj is a real sql_obj
            if (typeof sql_obj === "string" ||
                    sql_obj instanceof String ||
                    isSafeSqlObj(sql_obj) === false) {
                throw "injection error: " + sql_obj;
            }
            this.sql = {};
            this.sql.viewName = viewName;
            this.sql.sql_view = sql_obj;
            this.sql.verb = "CREATE VIEW";
            this.sql.as = "AS " + sql_obj.toString("");
            return this;
        };
        
        sql.dropView = function (viewName) {
            // Check to see if verb is available or over written
            if (typeof this.verbs.dropView === "function") {
                return this.verbs.dropView(viewName);
            } else if (this.verbs.dropView === false) {
                throw "dropView not supported by " + this.dialect;
            }

            if (viewName !== safeName(viewName)) {
                throw "injection error: " + viewName;
            }
            this.sql = {};
            this.sql.viewName = viewName;
            this.sql.verb = "DROP VIEW";
            return this;
        };
 
        sql.insert = function (tableName, obj) {
            var fields = [], values = [], ky,
                options = {period: true};

            // Check to see if verb is available or over written
            if (typeof this.verbs.insert === "function") {
                return this.verbs.insert(tableName, obj);
            } else if (this.verbs.insert === false) {
                throw "insert not supported by " + this.dialect;
            }
            
            if (tableName !== safeName(tableName)) {
                tableName = safeName(tableName, options);
            }

            // Mongo 2.2's shell doesn't support Object.keys()
            for (ky in obj) {
                if (obj.hasOwnProperty(ky) && typeof ky === "string") {
                    if (ky !== safeName(ky, options)) {
                        throw "injection error: " + ky;
                    }
                    ky = safeName(ky, options);
                    fields.push(ky);
                    values.push(safely(obj[ky]));
                }
            }

            // Reset this inner sql object since this is a verb
            this.sql = {};
            this.sql.tableName = tableName;
            this.sql.verb = "INSERT INTO";
            this.sql.columns = fields.join(", ");
            this.sql.values = values.join(", ");
            return this;
        };
    

        sql.deleteFrom = function (tableName) {
            // Check to see if verb is available or over written
            if (typeof this.verbs.deleteFrom === "function") {
                return this.verbs.deleteFrom(tableName);
            } else if (this.verbs.deleteFrom === false) {
                throw "deleteFrom not supported by " + this.dialect;
            }

            if (tableName !== safeName(tableName)) {
                throw "injection error: " + tableName;
            }
            this.sql = {};
            this.sql.tableName = tableName;
            this.sql.verb = "DELETE FROM";
            return this;
        };

        sql.update = function (tableName) {
            // Check to see if verb is available or over written
            if (typeof this.verbs.update === "function") {
                return this.verbs.update(tableName);
            } else if (this.verbs.update === false) {
                throw "update not supported by " + this.dialect;
            }

            if (tableName !== safeName(tableName)) {
                throw "injection error: " + tableName;
            }
            this.sql = {};
            this.sql.tableName = tableName;
            this.sql.verb = "UPDATE";
            return this;
        };
        
        sql.replace = function (tableName, obj) {
            var fields = [], values = [], ky,
                options = {period: true};

            // Check to see if verb is available or over written
            if (typeof this.verbs.replace === "function") {
                return this.verbs.replace(tableName, obj);
            } else if (this.verbs.replace === false) {
                throw "replace not supported by " + this.dialect;
            }
            
            if (this.dialect === Dialect.PostgreSQL92) {
                throw "PostpreSQL 9.2 does not support replace";
            }
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

            // Reset this inner sql object since this is a verb
            this.sql = {};
            this.sql.tableName = tableName;
            this.sql.verb = "REPLACE INTO";
            this.sql.columns = fields.join(", ");
            this.sql.values = values.join(", ");
            return this;
        };
        
        // Select options.    
        sql.select = function (fields, opt) {
            var i, cols,
                colName,
                asName,
                options = {period: true, parenthesis: true, asterisk: true};
            
            if (typeof opt === "undefined") {
                opt = {};
            }

            // Check to see if verb is available or over written
            if (typeof this.verbs.select === "function") {
                return this.verbs.select(fields);
            } else if (this.verbs.select === false) {
                throw "select not supported by " + this.dialect;
            }

            if (typeof fields === "undefined") {
                cols = ["*"];
            } else if (typeof fields === "string") {
                if (safeName(fields, options) !== fields &&
                        safeFunc(fields) !== fields) {
                    throw ["injection error: ", fields].join("");
                }
                cols = [fields];
            } else {
                for (i = 0; i < fields.length; i += 1) {
                    if (typeof fields[i] === "object") {
                        // Unpack and "AS" sub clause
                        colName = firstKey(fields[i]);
                        asName = fields[i][colName];
                        if (colName !== safeName(colName) &&
                                colName !== safeFunc(colName)) {
                            throw "injection error: " + JSON.stringify(fields[i]);
                        }
                        if (asName !== safeName(asName)) {
                            throw "injection error: " + JSON.stringify(fields[i]);
                        }
                    } else if (safeName(fields[i], options) !== fields[i] &&
                            safeFunc(fields[i]) !== fields[i]) {
                        throw "injection error: " + JSON.stringify(fields[i]);
                    }
                }
                cols = fields;
            }

            // Reset this inner sql object since this is a verb
            this.sql = {};
            this.sql.verb = "SELECT";
            if (opt.distinct === true) {
                this.sql.verb = "SELECT DISTINCT";
            }
            if (opt.all === true) {
                this.sql.verb = "SELECT ALL";
            }

            this.sql.columns = cols;
            return this;
        };

        sql.union = function (sql1, sql2) {
            // Check to see if verb is available or over written
            if (typeof this.verbs.union === "function") {
                return this.verbs.union(sql1, sql2);
            } else if (this.verbs.union === false) {
                throw "union not supported by " + this.dialect;
            }
            
            if (isSafeSqlObj(sql1) === true &&
                    isSafeSqlObj(sql2)) {
                this.sql = {};
                this.sql.verb = "UNION";
                this.sql.sql1 = sql1;
                this.sql.sql2 = sql2;
            } else {
                throw "injection error:" + JSON.stringify(sql1) + " " + JSON.stringify(sql2);
            }
            return this;
        };

        sql.from = function (tables) {
            var i;

            // Check to see if clause is available or over written
            if (typeof this.clauses.from === "function") {
                return this.clauses.from(tables);
            } else if (this.clauses.from === false) {
                throw "from clause not supported by " + this.dialect;
            }

            if (typeof tables === "string") {
                if (safeName(tables) !== tables) {
                    throw ["injection error:", tables].join(" ");
                }
                this.sql.from = "FROM " + safeName(tables);
            } else {
                for (i = 0; i < tables.length; i += 1) {
                    if (safeName(tables[i]) !== tables[i]) {
                        throw "injection error: " + tables[i];
                    }
                    tables[i] = safeName(tables[i]);
                }
                this.sql.from = "FROM " + tables.join(", ");
            }
            return this;
        };
    
        sql.joinOn = function (tables, expression) {
            var i;
            
            // Check to see if clause is available or over written
            if (typeof this.clauses.joinOn === "function") {
                return this.clauses.JoinOn(tables, expression);
            } else if (this.clauses.joinOn === false) {
                throw "joinOn clause not supported by " + this.dialect;
            }

            if (typeof tables === "string") {
                if (safeName(tables) !== tables) {
                    throw ["injection error:", tables].join(" ");
                }
                this.sql.joinOn = " JOIN " + safeName(tables);
            } else {
                for (i = 0; i < tables.length; i += 1) {
                    if (safeName(tables[i]) !== tables[i]) {
                        throw "injection error: " + tables[i];
                    }
                    tables[i] = safeName(tables[i]);
                }
                this.sql.joinOn = " JOIN " + tables.join(", ");
            }
            this.sql.joinOn += " ON " + expr(expression);
            return this;
        };

        sql.where = function (expression) {
            // Check to see if clause is available or over written
            if (typeof this.clauses.where === "function") {
                return this.clauses.where(expression);
            } else if (this.clauses.where === false) {
                throw "where clause not supported by " + this.dialect;
            }

            this.sql.where = "WHERE " + sql.expr(expression);
            return this;
        };

        sql.limit = function (index, count) {
            // Check to see if insert is available or over written
            if (typeof this.clauses.limit === "function") {
                return this.clauses.limit(index, count);
            } else if (this.clauses.limit === false) {
                throw "limit clause not supported by " + this.dialect;
            }

            if (typeof index !== "number") {
                throw ["injection error:", index].join(" ");
            }
            if (count === undefined || count === null) {
                this.sql.limit = "LIMIT " + index;
            } else {
                if (typeof count !== "number") {
                    throw ["injection error:", count].join(" ");
                }
                this.sql.limit = "LIMIT " + index + "," + count;
            }
            return this;
        };

        sql.orderBy = function (fields, direction) {
            var i, options = {period: true};

            // Check to see if insert is available or over written
            if (typeof this.clauses.orderBy === "function") {
                return this.clauses.orderBy(fields, direction);
            } else if (this.clauses.orderBy === false) {
                throw "orderBy clause not supported by " + this.dialect;
            }

            if (typeof fields === "string") {
                if (fields !== safeName(fields, options)) {
                    throw ["injection error:", fields].join(" ");
                }
                this.sql.orderBy = "ORDER BY " + fields;
            } else {
                for (i = 0; i < fields.length; i += 1) {
                    if (fields[i] !== safeName(fields[i], options)) {
                        throw ["injection error:", fields].join(" ");
                    }
                    fields[i] = safeName(fields[i], options);
                }
                this.sql.orderBy = "ORDER BY " + fields.join(", ");
            }
            if (typeof direction === "undefined" || direction === null) {
                return this;
            } else if (direction.toUpperCase() === "ASC" || direction >= 0) {
                this.sql.orderBy += " ASC";
            } else if (direction.toUpperCase() === "DESC" || direction < 0) {
                this.sql.orderBy += " DESC";
            }
            return this;
        };
    
        sql.groupBy = function (fields) {
            var i, options = {period: true};

            // Check to see if insert is available or over written
            if (typeof this.clauses.groupBy === "function") {
                return this.clauses.groupBy(fields);
            } else if (this.clauses.groupBy === false) {
                throw "orderBy clause not supported by " + this.dialect;
            }

            if (typeof fields === "string") {
                if (fields !== safeName(fields, options)) {
                    throw ["injection error:", fields].join(" ");
                }
                this.sql.groupBy = "GROUP BY " + fields;
            } else {
                for (i = 0; i < fields.length; i += 1) {
                    if (fields[i] !== safeName(fields[i], options)) {
                        throw ["injection error:", fields].join(" ");
                    }
                    fields[i] = safeName(fields[i], options);
                }
                this.sql.groupBy = "GROUP BY " + fields.join(", ");
            }
            return this;
        };
        
        // Do a MySQL SET, e.g. SET @my_count = 0;
        // Or add a SET pharse to an UPDATE statement.
        sql.set = function (nameOrObject, value) {
            var ky, i, name, val,
                options = {
                    period: true,
                    at_sign: true
                };

            if (this.sql.verb !== "UPDATE") {
                if (this.dialect === Dialect.SQLite3) {
                    throw Dialect.SQLite3 + " does not support SET and @varname constructs";
                }
                // Check to see if clause is available or over written
                if (typeof this.clauses.set === "function") {
                    return this.clauses.set(nameOrObject, value);
                } else if (this.clauses.set === false) {
                    throw "set clause not supported by " + this.dialect;
                }
                this.sql = {};
                this.sql.verb = "SET";
            } else {
                // Check to see if verb is available or over written
                if (typeof this.verbs.set === "function") {
                    return this.verbs.set(nameOrObject, value);
                } else if (this.verbs.set === false) {
                    throw "set not supported by " + this.dialect;
                }
            }

            if (typeof nameOrObject === "string") {
                if (nameOrObject !== safeName(nameOrObject, {period: true})) {
                    throw "injection error: " + nameOrObject;
                }
                if (this.dialect === Dialect.MySQL55 && this.sql.verb === "SET") {
                    name = "@" + nameOrObject;
                } else {
                    name = nameOrObject;
                }
                if (value === safeFunc(value)) {
                    val = value;
                } else {
                    val = safely(value);
                }
                this.sql.values = [{key: name, value: value}];
            } else if (typeof nameOrObject === "object") {
                this.sql.values = [];
                for (ky in nameOrObject) {
                    if (nameOrObject.hasOwnProperty(ky)) {
                        if (ky !== safeName(ky, {period: true})) {
                            throw "injection error: " + JSON.stringify(ky);
                        }
                        if (Dialect.MySQL55 && this.sql.verb === "SET") {
                            name = "@" + ky;
                        } else {
                            name = ky;
                        }
                        if (nameOrObject[ky] === safeFunc(nameOrObject[ky])) {
                            val = nameOrObject[ky];
                        } else {
                            val = safely(nameOrObject[ky]);
                        }
                        this.sql.values.push({key: name, value: val});
                    }
                }
            } else {
                throw "Cannot add " + nameOrObject + " to " + this.sql;
            }
            return this;
        };

        sql.into = function (fields) {
            var i, options = {period: true, at_sign: true};

            // Check to see if clause is available or over written
            if (typeof this.clauses.into === "function") {
                return this.clauses.into(fields);
            } else if (this.clauses.into === false) {
                throw "into clause not supported by " + this.dialect;
            }

            // support for generating SQLite dialect quoting
            if (this.dialect === Dialect.SQLite3) {
                throw "INTO not supported by " + Dialect.SQLite3;
            }
            if (typeof fields === "string") {
                if (fields !== safeName(fields, options)) {
                    throw ["injection error:", fields].join(" ");
                }
                this.sql.into = "INTO " + fields;
            } else {
                for (i = 0; i < fields.length; i += 1) {
                    if (fields[i] !== safeName(fields[i], options)) {
                        throw ["injection error:", fields].join(" ");
                    }
                    fields[i] = safeName(fields[i], options);
                }
                this.sql.into = "INTO " + fields.join(", ");
            }
            return this;
        };
        
        sql.valueOf = function () {
            return this.sql;
        };
        
        var defColumns = function (column_defs) {
            var ky, src = [], def, clause;
            for (ky in column_defs) {
                if (column_defs.hasOwnProperty(ky)) {
                    if (ky !== safeName(ky)) {
                        throw "injection error: " + column_defs;
                    }
                    clause = [];
                    def = column_defs[ky];
                    switch (def.type.toUpperCase()) {
                    case 'INTEGER':
                    case 'INT':
                        clause = [def.type];
                        if (def.auto_increment === true) {
                            clause.push("AUTO_INCREMENT");
                        }
                        if (def.primary_key === true) {
                            clause.push("PRIMARY KEY");
                        }
                        break;
                    case 'VARCHAR':
                    case 'CHAR':
                        if (typeof def.length !== "undefined") {
                            clause.push(def.type + "(" + def.length + ")");
                        }
                        break;
                    case 'DATE':
                    case 'TIME':
                    case 'DATETIME':
                    case 'TIMESTAMP':
                    case 'TINYTEXT':
                    case 'TEXT':
                    case 'MEDIUMTEXT':
                    case 'LONGTEXT':
                    case 'TINYBLOB':
                    case 'BLOB':
                    case 'MEDIUMBLOB':
                    case 'LONGBLOB':
                        clause = [def.type];
                        break;
                    default:
                        throw ky + " of " + def.type + " not supported";
                    }
                    if (def["default"] === true) {
                        clause.push("DEFAULT " + safely(def["default"]));
                    }
                    if (def.not_null === true) {
                        clause.push("NOT NULL");
                    }
                    src.push(ky + " " + clause.join(" "));
                }
            }

            return src.join(", ");
        };

        sql.toString = function (eol) {
            var src = [], i, ky, vals;

            switch (this.sql.verb) {
            case 'CREATE TABLE':
                src.push(this.sql.verb);
                src.push(this.sql.tableName);
                src.push("(" + defColumns(this.sql.columns) + ")");
                break;
            case 'CREATE INDEX':
            case 'CREATE UNIQUE INDEX':
                src.push(this.sql.verb);
                src.push(this.sql.indexName);
                src.push("ON " + this.sql.table + " (" + this.sql.columns.join(", ") + ")");
                break;
            case 'CREATE VIEW':
                src.push(this.sql.verb);
                src.push(this.sql.viewName);
                src.push((this.sql.as).toString(""));
                break;
            case 'DROP TABLE':
                src.push(this.sql.verb);
                src.push(this.sql.tableName);
                break;
            case 'DROP INDEX':
                src.push(this.sql.verb);
                src.push(this.sql.indexName);
                break;
            case 'DROP VIEW':
                src.push(this.sql.verb);
                src.push(this.sql.viewName);
                break;
            case 'SELECT':
            case 'SELECT DISTINCT':
            case 'SELECT ALL':
                src.push(this.sql.verb);
                // Need to handle AS cases.
                vals = [];
                for (i = 0; i < this.sql.columns.length; i += 1) {
                    if (typeof this.sql.columns[i] === "object") {
                        ky = firstKey(this.sql.columns[i]);
                        vals.push(ky + " AS " + this.sql.columns[i][ky]);
                    } else {
                        vals.push(this.sql.columns[i]);
                    }
                }
                src.push(vals.join(", "));

                ['from', 'joinOn', 'where', 'groupBy', 'orderBy', 'limit', 'offset', 'into'].forEach((function (elem) {
                    if (typeof this.sql[elem] !== "undefined") {
                        src.push(this.sql[elem]);
                    }
                }).bind(this)); 
                break;
            case 'INSERT INTO':
            case 'REPLACE INTO':
                src.push(this.sql.verb);
                src.push(this.sql.tableName);
                src.push("(" + this.sql.columns + ")");
                src.push('VALUES');
                src.push("(" + this.sql.values + ")");
                break;
            case 'UPDATE':
                src.push(this.sql.verb);
                src.push(this.sql.tableName);
                if (typeof this.sql.values !== "undefined") {
                    vals = [];
                    src.push("SET");
                    for (i = 0; i < this.sql.values.length; i += 1) {
                        vals.push(this.sql.values[i].key + " = " +
                            this.sql.values[i].value);
                    }
                    src.push(vals.join(", "));
                }
                if (typeof this.sql.where !== "undefined") {
                    src.push(this.sql.where);
                }
                break;
            case 'DELETE FROM':
                src.push(this.sql.verb);
                src.push(this.sql.tableName);
                if (typeof this.sql.where !== "undefined") {
                    src.push(this.sql.where);
                }
                break;
            case 'SET':
                src.push(this.sql.verb);
                if (typeof this.sql.values !== "undefined") {
                    vals = [];
                    for (i = 0; i < this.sql.values.length; i += 1) {
                        vals.push(this.sql.values[i].key + " = " + this.sql.values[i].value);
                    }
                    src.push(vals.join(", "));
                }
                break;
            case 'UNION':
                src.push("(" + this.sql.sql1.toString("") + ")");
                src.push("UNION");
                src.push("(" + this.sql.sql2.toString("") + ")");
                break;
            default:
                throw "Don't know how to assemble SQL statement form " + this.sql.verb;
            }
            if (typeof eol === "undefined") {
                return src.join(" ") + this.eol;
            }
            return src.join(" ") + eol;
        };

        sql.execute = function (options) {
            throw "execute not supported by " + this.dialect;
        };
        /*
         * Plugins and extensions
         */
        sql.define = function (dialect_name, definition) {
            var ky;
            
            this.dialect = dialect_name;
            // Add the verb support
            if (typeof definition.verbs === "object") {
                for (ky in definition.verbs) {
                    if (definition.verbs.hasOwnProperty(ky)) {
                        this.verbs[ky] = definition.verbs[ky];
                    }
                }
            }
            
            if (typeof definition.clauses === "object") {
                for (ky in definition.clauses) {
                    if (definition.clauses.hasOwnProperty(ky)) {
                        this.clauses[ky] = definition.clauses[ky];
                    }
                }
            }
            
            if (typeof definition.toString === "function") {
                this.toString = definition.toString;
            }
            
            if (typeof definition.execute === "function") {
                this.execute = definition.execute;
            }
        };

        return sql;
    };
    
    // If we're running under NodeJS then export objects
    self.Dialect = Dialect;
    self.Sql = Sql;
    if (typeof exports !== undefined) {
        exports.Dialect = Dialect;
        exports.Sql = Sql;
    }

    return self;
}(this));
