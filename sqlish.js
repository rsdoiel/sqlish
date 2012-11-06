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
/*jslint devel: true, node: true, maxerr: 50, vars: true, sloppy: true */
/*global exports */
(function (global) {
	//
	// Utility functions that are available across objects.
	//
	var isSqlObj = function (obj) {
		var ky;
		for (ky in this) {
			if (this.hasOwnProperty(ky) &&
					obj.hasOwnProperty(ky) === false) {
				return false;
			}
		}
		return true;
	};

	// Build an appropriate data string
	// from a JavaScript Date object.
	// @param d - a JavaScript Date object
	// @param use_UTC - boolean, true means use GMT otherwise local time.
	// @return a string formatted as YYYY-MM-DD HH:II:SS
	var sqlDate = function (d, use_UTC) {
		if (typeof d === "undefined") {
			d = new Date();
		} else if (typeof d === "string") {
			d = new Date(d);
		}

		if (typeof use_UTC === "undefined") {
			use_UTC = this.use_UTC;
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
	
	// Return s as a safe variable, table or column name
	// @param s - A string to sanitize
	// @param options - an object setting allowable characters.
	// @return save variable name as string
	var safeName = function (s, options) {
		var re_terms = ["[", "^a-zA-Z0-9_"], re;
		if (options !== undefined) {
			if (options.period !== undefined &&
					options.period === true) {
				if (typeof s === "string") {
					if (s.indexOf(".") === 0) {
						s = s.substr(1);
					}
					if (s.lastIndexOf(".") === (s.length - 1)) {
						s = s.substr(-1);
					}
				}
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
			if (options.dollar_sign !== undefined &&
					options.dollar_sign === true) {
				re_terms.push("\\$");
			}
		}
		re_terms.push("]");
		re = new RegExp(re_terms.join(""), "g");
		// We should not have a leading trailing period
		// options.period set.
		return String(s).replace(re, "");
	};
	
	// safeFunc - evaluate a SQL function reference for safe input
	// @param s - the string to be checked.
	// @return string processed.
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
			// properly escaped.
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

	// safeExpr - evaluate an expression and see if it make sense
	// @param a string representation of the expression.
	// @return the safe expr string or throw an error otherwise
	var safeExpr = function (expr) {
		var toks = [],
			safe_outside_string = ['a', 'b', 'c',
				'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k',
				'l', 'm', 'n', 'o', 'p', 'q', 'r',
				's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
				'0', '1', '2', '3', '4', '5', '6', '7',
				'8', '9', '=', '+', '-', '/', '*',
				'(', ')', ' ', '@', '.', '_', '.'],
			i = 0,
			in_string = false;
			
		toks = expr.toLowerCase().split("");
		for (i = 0; i < toks.length; i += 1) {
			if (toks[i] === '"' || toks[i] === "'") {
				if (in_string === false) {
					in_string = true;
				} else {
					// FIXME: We've finished a string, 
					// see if it is safe string
					in_string = false;
				}
			} else if (in_string === false) {				
				if (safe_outside_string.indexOf(toks[i]) < 0) {
					throw "injection error for expr: " + expr;
				}
			}
		}
		// We should be outside a quoted string
		if (in_string === true) {
			throw "injection error, open ended string for: " + expr;
		}
		return expr;
	};

	// isColumnName - verify column name against a schema
	// @param value
	// @return boolean
	var isColumnName = function (value, schemas) {
		var tableName, column;

		if (typeof schemas === "undefined") {
			return false;
		}

		if (typeof value === "string") {
			if (value.indexOf(".") > 0) {
				tableName = value.substr(0, value.indexOf("."));
				column = value.substr(value.indexOf(".") + 1);
				if (typeof schemas[tableName] === "undefined" ||
						typeof schemas[tableName][column] === "undefined") {
					return false;
				}
				return true;
			}
		}
		return false;
	};


	// Return s as a double quoted string
	// safely escaped, a JavaScript type or
	// as a right hand expression column reference.
	// @param s - A string to sanitize
	// @param dialect - an object setting allowable characters.
	// @return safe version of string
	var safely = function (s, schemas) {
		var options = {
			at_sign: true,
			period: true
		};

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
			if (isColumnName(s, schemas) === true) {
				return s;
			}
			if (s.substr(0, 1) === '@') {
				return safeName(s, options);
			}
			if (s === "" || s === '""') {
				return '""';
			}

			return [
				'"',
				s.replace(/[\0\n\r\b\t\\\'\"\x1a]/g, function (c) {
					switch (c) {
					//case /\0/:
					//	return "\\0";
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
						// FIXME: this should not co-mingle dialect 
						// specific in common
						// function.
						/*
						if (dialect.description ===
								Dialect.SQLite3.description) {
							// SQLite single-quote escaping.
							return "''";
						}
						*/
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

	// Check's the first key returned by an object
	// @param obj - the object to check
	// @return the key as a string
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
	
	// Covert a JavaScript RegExp into a simplier SQL style wildcarded
	// string. (This function was Yawnt's idea)
	// @param re - A JavaScript RegExp object
	// @return a string reflecting SQL style wildcarding
	var re2SQLWildcard = function (re) {
		var s = re.toString();
		if (!(re instanceof RegExp)) {
			throw "Not a RegExp object.";
		}

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
	
	// expr - process an MongoDB like JavaScript filter object and transform
	// into a SQL expression or phrase
	// @param obj - the filter expression
	// @return an SQL expression or phrase as a string
	var expr = function (obj, schemas) {
		var options = {
				period: true,
				dollar_sign: true,
				at_sign: true
			},
			clause,
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
						return safely(v, schemas);
					});
				}
				return "= " + safely(obj[ky], schemas);
			case '$ne':
				if (typeof obj[ky] === "object") {
					return ["!=", expr(obj[ky], schemas)].join(" ");
				}
				return ["!=", safely(obj[ky], schemas)].join(" ");
			case '$gt':
				if (typeof obj[ky] === "object") {
					return [">", expr(obj[ky], schemas)].join(" ");
				}
				return [">", safely(obj[ky], schemas)].join(" ");
			case '$gte':
				if (typeof obj[ky] === "object") {
					return [">=", expr(obj[ky], schemas)].join(" ");
				}
				return [">=", safely(obj[ky], schemas)].join(" ");
			case '$lt':
				if (typeof obj[ky] === "object") {
					return ["<", expr(obj[ky], schemas)].join(" ");
				}
				return ["<", safely(obj[ky], schemas)].join(" ");
			case '$lte':
				if (typeof obj[ky] === "object") {
					return ["<=", expr(obj[ky], schemas)].join(" ");
				}
				return ["<=", safely(obj[ky], schemas)].join(" ");
			case '$or':
				vals = [];
				if (typeof obj[ky].length === "undefined") {
					throw "$or takes an array of objects as the value";
				}
				for (i = 0; i < obj[ky].length; i += 1) {
					vals.push(expr(obj[ky][i], schemas));
				}
				return vals.join(" OR ");
			case '$and':
				vals = [];
				if (typeof obj[ky].length === "undefined") {
					throw "$and takes an array of objects as the value";
				}
				for (i = 0; i < obj[ky].length; i += 1) {
					vals.push(expr(obj[ky][i], schemas));
				}
				return vals.join(" AND ");
			case '$like':
				if (typeof obj[ky] === "object" || 
						typeof obj[ky] === "function") {
					if (obj[ky] instanceof RegExp) {
						return "LIKE " +
							safely(re2SQLWildcard(obj[ky]), schemas);
					} else {
						throw "$like takes a value that is of type string or number";
					}
					throw "$like takes a value that is of type String, Number or RegExp";
				}
				return "LIKE " + safely(obj[ky], schemas);
			default:
				throw [ky, "not supported"].join(" ");
			}
		} else if (typeof obj[ky] === "object") {
			clause = expr(obj[ky], schemas);

			if (Array.isArray(clause)) {
				return '(' + clause.map(function (v) {
					return [ky, v].join(" = ");
				}).join(" OR ") + ')';
			}

			return [ky, expr(obj[ky], schemas)].join(" ");
		}
		// Handle case where right side is a proper table.column_name
		if (obj[ky] === safeName(obj[ky], {period: true}) &&
			obj[ky].indexOf(".") > -1 &&
			obj[ky].indexOf(".") === obj[ky].lastIndexOf(".")) {
			return [ky, safeName(obj[ky], {period: true})].join(" = ");	
		}
		return [ky, safely(obj[ky], schemas)].join(" = ");
	};

	// P - parenthesis
	// @param expression
	// @return parenthesis enclosed string
	var P = function (expression, schemas) {
		return ["(", expr(expression, schemas), ")"].join("");
	};

	// Defined the default supported SQL dialects.
	// @param tableName - string, the name of the table being defined.
	// @param column_def - the definition of the column in the table as RegExp.
	// @return boolean, comparing table name and definition
	var on = function (tableName, column_def) {
		if (typeof this.schemas === "undefined") {
			this.schemas = {};
		}
		if (typeof this.schemas[tableName] === "undefined") {
			this.schemas[tableName] = {};
		}
		this.schemas[tableName] = column_def;
		return (this.schemas[tableName] === column_def);
	};

	// applyOn - apply the schema validation per table.
	// @param tableName
	// @param value to be compared
	// @return the applied value to schema.
	var applyOn = function (tableName, value) {
		var column;

		if (typeof this.schemas[tableName] === "undefined") {
			throw "injection error: " + tableName + ", " + value;
		}
		for (column in this.schemas[tableName]) {
			if (this.schemas[tableName].hasOwnProperty(column)) {
				if (typeof this.schemas[tableName][column] === "function") {
					return this.schemas[tableName][column](value);
				}
			}
		}
		throw "injection error: " + tableName + ", " + value;
	};

	// createTable - generate an SQL create phrase
	// @param tableName
	// @param object of column definitions
	// @return a chainable object
	var createTable = function (tableName, column_definitions) {
		var ky;

		if (tableName !== safeName(tableName)) {
			throw "injection error: " + tableName;
		}

		for (ky in column_definitions) {
			if (column_definitions.hasOwnProperty(ky)) {
				if (ky !== safeName(ky, this.schemas)) {
					throw "injection error:" + column_definitions;
				}
			}
		}

		this.sql = {};
		this.sql.tableName = tableName;
		this.sql.verb = "CREATE TABLE";
		this.sql.columns = column_definitions;
		// FIXME: Define schema based on column definitions provided
		if (typeof this.schemas[tableName] === "undefined") {
			this.schemas[tableName] = {};
		}
		return this;
	};

	// dropTable - generate a SQL DROP TABLE phrase
	// @param tableName - name of table to drop.
	// @return a chainable object
	var dropTable = function (tableName) {
		if (tableName !== safeName(tableName)) {
			throw "injection error: " + tableName;
		}
		this.sql = {};
		this.sql.tableName = tableName;
		this.sql.verb = "DROP TABLE";
		return this;
	};
		
	// createIndex - generate a SQL CREATE INDEX phrase
	// @param indexName - name of table to index.
	// @param options
	// @return a chainable object
	var createIndex = function (indexName, options) {
		var i;

		if (indexName !== safeName(indexName)) {
			throw "injection error:" + indexName;
		}
		this.sql = {};
		this.sql.indexName = indexName;
		if (options.unique !== undefined && options.unique === true) {
			this.sql.verb = "CREATE UNIQUE INDEX";
		} else {
			this.sql.verb = "CREATE INDEX";
		}
		
		if (typeof options.table === "undefined" ||
				typeof options.columns === "undefined") {
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
		
	// dropIndex - generate a SQL DROP INDEX phrase
	// @param indexName - name of table to index.
	// @return a chainable object
	var dropIndex = function (indexName) {
		if (indexName !== safeName(indexName)) {
			throw "injection error: " + indexName;
		}
		this.sql = {};
		this.sql.indexName = indexName;
		this.sql.verb = "DROP INDEX";
		return this;
	};

	// createView - generate a SQL CREATE VIEW phrase
	// @param viewName - name of table.
	// @param a SQLish object
	// @return a chainable object
	var createView = function (viewName, sql_obj) {
		if (viewName !== safeName(viewName)) {
			throw "injection error: " + viewName;
		}

		if (sql_obj instanceof String) {
			throw "injection error: " + viewName + " " + sql_obj;
		}
		if (typeof sql_obj === "undefined") {
			throw "injection error: " + viewName + " " + sql_obj;
		}
		if (this.isSqlObj(sql_obj) === false) {
			throw "injection error: " + viewName + " " + sql_obj;
		}
		this.sql = {};
		this.sql.viewName = viewName;
		this.sql.sql_view = sql_obj;
		this.sql.verb = "CREATE VIEW";
		this.sql.as = "AS " + sql_obj.toString("");
		return this;
	};
		
	// dropView - generate a SQL DROP VIEW phrase
	// @param viewName - name of table.
	// @return a chainable object
	var dropView = function (viewName) {
		if (viewName !== safeName(viewName)) {
			throw "injection error: " + viewName;
		}
		this.sql = {};
		this.sql.viewName = viewName;
		this.sql.verb = "DROP VIEW";
		return this;
	};
 
	// insert - generate a SQL INSERT phrase
	// @param tableName - name of table.
	// @param obj
	// @return a chainable object
	var insert = function (tableName, obj) {
		var fields = [], values = [], ky,
			options = {period: true};

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
				values.push(safely(obj[ky], this.schemas));
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

	// deleteFrom - generate a SQL DELETE phrase
	// @param tableName - name of table.
	// @return a chainable object
	var deleteFrom = function (tableName) {
		if (tableName !== safeName(tableName)) {
			throw "injection error: " + tableName;
		}
		this.sql = {};
		this.sql.tableName = tableName;
		this.sql.verb = "DELETE FROM";
		return this;
	};

	// update - generate a SQL UPDATE phrase
	// @param tableName - name of table.
	// @return a chainable object
	var update = function (tableName) {
		if (tableName !== safeName(tableName)) {
			throw "injection error: " + tableName;
		}
		this.sql = {};
		this.sql.tableName = tableName;
		this.sql.verb = "UPDATE";
		return this;
	};

	var replace = function (tableName, obj) {
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
				values.push(safely(obj[ky], this.schemas));
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
	var select = function (fields, opt) {
		var i, cols,
			colName,
			asName,
			options = {period: true, parenthesis: true, asterisk: true};
		
		if (typeof opt === "undefined") {
			opt = {};
		}

		if (typeof fields === "undefined") {
			cols = ["*"];
		} else if (typeof fields === "string") {
			if (safeName(fields, options) !== fields &&
					safeFunc(fields) !== fields) {
				throw ["injection error (0): ", fields].join("");
			}
			cols = [fields];
		} else {
			for (i = 0; i < fields.length; i += 1) {
				if (typeof fields[i] === "object") {
					// Unpack and "AS" sub clause
					colName = firstKey(fields[i]);
					asName = fields[i][colName];
					if (colName !== safeName(colName, {period: true}) &&
							colName !== safeFunc(colName)) {
						throw "injection error (1): " + JSON.stringify(fields[i]);
					}
					if (asName !== safeName(asName)) {
						throw "injection error (2): " + JSON.stringify(fields[i]);
					}
				} else if (safeName(fields[i], options) !== fields[i] &&
						safeFunc(fields[i]) !== fields[i] &&
						safeExpr(fields[i]) !== fields[i]) {
					throw "injection error (3): " + JSON.stringify(fields[i]);
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

	var union = function (sql1, sql2) {
		if (this.isSqlObj(sql1) === true &&
				this.isSqlObj(sql2)) {
			this.sql = {};
			this.sql.verb = "UNION";
			this.sql.sql1 = sql1;
			this.sql.sql2 = sql2;
		} else {
			throw "injection error:" + JSON.stringify(sql1) + " " + JSON.stringify(sql2);
		}
		return this;
	};

	var from = function (tables) {
		var i;

		if (typeof tables === "string") {
			if (safeName(tables) !== tables) {
				throw "injection error: " + tables;
			}
			this.sql.from = safeName(tables);
		} else {
			for (i = 0; i < tables.length; i += 1) {
				if (safeName(tables[i]) !== tables[i]) {
					throw "injection error: " + tables[i];
				}
				tables[i] = safeName(tables[i]);
			}
			this.sql.from = tables.join(", ");
		}
		return this;
	};

	var join = function (tables, expression) {
		var i;
		this.sql.join = {};
		if (typeof tables === "string") {
			if (safeName(tables) !== tables) {
				throw ["injection error:", tables].join(" ");
			}
			this.sql.join.tables = [safeName(tables)];
		} else {
			for (i = 0; i < tables.length; i += 1) {
				if (safeName(tables[i]) !== tables[i]) {
					throw "injection error: " + tables[i];
				}
				tables[i] = safeName(tables[i]);
			}
			this.sql.join.tables = tables;
		}
		this.sql.join.on = expr(expression, this.schemas);
		return this;
	};

	var where = function (expression) {
		this.sql.where = expr(expression, this.schemas);
		return this;
	};

	var limit = function (index, count) {
		if (typeof index !== "number") {
			throw ["injection error:", index].join(" ");
		}
		if (typeof count === "undefined" || count === null) {
			this.sql.limit = index;
		} else {
			if (typeof count !== "number") {
				throw "injection error: " + count;
			}
			this.sql.limit = count;
			this.sql.offset = index;
		}
		return this;
	};

	var offset = function (index) {
		if (typeof index !== "number") {
			throw ["injection error:", index].join(" ");
		}
		return this;
	};


	var order = function (fields, direction) {
		var i, options = {period: true};

		this.sql.order = {fields: [], direction: null};
		if (typeof fields === "string") {
			if (fields !== safeName(fields, options)) {
				throw ["injection error:", fields].join(" ");
			}
			this.sql.order.fields = [fields];
		} else {
			for (i = 0; i < fields.length; i += 1) {
				if (fields[i] !== safeName(fields[i], options)) {
					throw ["injection error:", fields].join(" ");
				}
				fields[i] = safeName(fields[i], options);
			}
			this.sql.order.fields = fields;
		}
		if (typeof direction === "undefined" || direction === null) {
			return this;
		}
		if (direction >= 0) {
			this.sql.order.direction = 1;
		} else if (direction < 0) {
			this.sql.order.direction += -1;
		}
		return this;
	};

	var group = function (fields) {
		var i, options = {period: true};

		if (typeof fields === "string") {
			if (fields !== safeName(fields, options)) {
				throw "injection error: " + fields;
			}
			this.sql.group = [fields];
		} else {
			for (i = 0; i < fields.length; i += 1) {
				if (fields[i] !== safeName(fields[i], options)) {
					throw "injection error: " + fields;
				}
				fields[i] = safeName(fields[i], options);
			}
			this.sql.group = fields;
		}
		return this;
	};

	// set - create an SQL SET phrase
	// @param nameOrObject
	// @param value
	// @return a chainable object.
	var set = function (nameOrObject, value) {
		var ky, i, name, val,
			options = {
				period: true,
				at_sign: true
			};

		if (this.sql.verb !== "UPDATE") {
			this.sql = {};
			this.sql.verb = "SET";
		}

		if (typeof nameOrObject === "string") {
			if (nameOrObject !== safeName(nameOrObject, {period: true, at_sign: true})) {
				throw "injection error: " + nameOrObject;
			}
			name = nameOrObject;
			if (value === safeFunc(value)) {
				val = value;
			} else {
				val = safely(value, this.schemas);
			}
			this.sql.values = [{key: name, value: value}];
		} else if (typeof nameOrObject === "object") {
			this.sql.values = [];
			for (ky in nameOrObject) {
				if (nameOrObject.hasOwnProperty(ky)) {
					if (ky !== safeName(ky, {period: true, at_sign: true})) {
						throw "injection error: " + JSON.stringify(ky);
					}
					name = ky;
					if (nameOrObject[ky] === safeFunc(nameOrObject[ky])) {
						val = nameOrObject[ky];
					} else {
						val = safely(nameOrObject[ky], this.schemas);
					}
					this.sql.values.push({key: name, value: val});
				}
			}
		} else {
			throw "Cannot add " + nameOrObject + " to " + this.sql;
		}
		return this;
	};

	var into = function (fields) {
		var i, options = {period: true, at_sign: true};

		if (typeof fields === "string") {
			if (fields !== safeName(fields, options)) {
				throw ["injection error:", fields].join(" ");
			}
			this.sql.into = [fields];
		} else {
			for (i = 0; i < fields.length; i += 1) {
				if (fields[i] !== safeName(fields[i], options)) {
					throw ["injection error:", fields].join(" ");
				}
				fields[i] = safeName(fields[i], options);
			}
			this.sql.into = fields;
		}
		return this;
	};

	var execute = function (options) {
		throw "execute not supported";
	};

	var defColumns = function (column_definitions) {
		var ky, src = [], def, clause;
		for (ky in column_definitions) {
			if (column_definitions.hasOwnProperty(ky)) {
				if (ky !== safeName(ky)) {
					throw "injection error: " + column_definitions;
				}
				clause = [];
				def = column_definitions[ky];
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
					if (typeof def.length !== undefined) {
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
					clause.push("DEFAULT " + safely(def["default"], this.schemas));
				}
				if (def.not_null === true) {
					clause.push("NOT NULL");
				}
				src.push(ky + " " + clause.join(" "));
			}
		}

		return src.join(", ");
	};

	var toString = function (eol) {
		var src = [], i, ky, vals, self = this;

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

			[
				'from', 'join',
				'where', 'group',
				'order', 'limit',
				'offset', 'into'
			].forEach(function (elem) {
				if (self.sql[elem] !== undefined) {
					switch (elem) {
					case 'join':
						if (self.sql[elem].tables.length > 1) {
							src.push("JOIN (" +
									 self.sql[elem].tables.join(", ") +
									 ") ON (" + self.sql[elem].on + ")");
						} else {
							src.push("JOIN " +
									 self.sql[elem].tables.join(", ") +
									 " ON (" + self.sql[elem].on + ")");
						}
						break;
					case 'order':
						if (self.sql[elem].direction === null) {
							src.push("ORDER BY " + self.sql[elem].fields.join(", "));
						} else if (self.sql[elem].direction >= 0) {
							src.push("ORDER BY " +
								self.sql[elem].fields.join(", ") +
								" ASC");
						} else if (self.sql[elem].direction < 0) {
							src.push("ORDER BY " +
								self.sql[elem].fields.join(", ") +
								" DESC");
						}
						break;
					case 'group':
						src.push("GROUP BY " + self.sql[elem].join(", "));
						break;
					default:
						if (typeof self.sql[elem].join === "undefined") {
							src.push(elem.toUpperCase() + " " + self.sql[elem]);
						} else {
							src.push(elem.toUpperCase() + " " + self.sql[elem].join(", "));
						}
						break;
					}
				}
			});
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
			if (this.sql.values !== undefined) {
				vals = [];
				src.push("SET");
				for (i = 0; i < this.sql.values.length; i += 1) {
					vals.push(this.sql.values[i].key + " = " +
						this.sql.values[i].value);
				}
				src.push(vals.join(", "));
			}
			if (this.sql.where !== undefined) {
				src.push("WHERE " + this.sql.where);
			}
			break;
		case 'DELETE FROM':
			src.push(this.sql.verb);
			src.push(this.sql.tableName);
			if (this.sql.where !== undefined) {
				src.push("WHERE " + this.sql.where);
			}
			break;
		case 'SET':
			src.push(this.sql.verb);
			if (this.sql.values !== undefined) {
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

	var valueOf = function () {
		return this.sql;
	};


	// Collection of dialects used by the Sqlish factory.
	// They serve as defaults for the object created
	// but can be overwritten by passing an additional function
	// collection to Sqlish constructor.
	var Dialects = function () {};

	// supported - return a list of names of supported
	// dialects.
	Dialects.supported = function () {
		var ky, names = [];
		
		for (ky in this) {
			if (this.hasOwnProperty(ky)) {
				names.push(ky);
			}
		}
		
		return names;
	};
	
	Dialects.define = function (dialect_name, function_collection) {
		var ky;
		
		if (typeof this[dialect_name] === "undefined") {
			this[dialect_name] = {};
			for (ky in function_collection) {
				if (function_collection.hasOwnProperty(ky)) {
					this[dialect_name][ky] = function_collection[ky];
				}
			}
		}
		throw dialect_name + " previously defined.";
	};
	
	Dialects["SQLite 3"] = {};
	// Support applying validation functions to
	// table's columns
	Dialects["SQLite 3"].set = function (nameOrObject, value) {
		if (this.sql.verb !== "UPDATE") {
			throw "SQL doesn't support SET except in UPDATE";
		}
		set(nameOrObject, value);
		return this;
	};
	Dialects["SQLite 3"].into = function () {
		throw "SQLite 3 doesn't support INTO phrase.";
	};


	Dialects["PostgreSQL 9.2"] = {};
	// Support applying validation functions to
	// table's columns
	Dialects["PostgreSQL 9.2"].replace = function () {
		throw "PostgreSQL 9.2 doens't support replace.";
	};

	Dialects["MySQL 5.5"] = {};
	// Support applying validation functions to
	// table's columns
	Dialects["MySQL 5.5"].set = set;


	// Sqlish - factory to create a SQL like JavaScript object
	// @constructor
	// @param dialect_name - the name of the dialect you want
	// to generate code for
	// @param function_collection - A collection of functions
	// to generate a dialect's code.
	// @return a new Sqlish object.
	var Sqlish = function (dialect_name, function_collection) {
		var ky, Sql;
		
		Sql = function () {
			this.name = dialect_name;
			this.use_UTC = false;
			this.sql = {};
			this.eol = ";";
			this.schemas = {};
			return this;
		};

		// Here's the default functions available to all objects
		// regardless of dialect.
		Sql.prototype.isSqlObj = isSqlObj;
		Sql.prototype.safely = safely;
		Sql.prototype.expr = expr;
		Sql.prototype.sqlDate = sqlDate;
		Sql.prototype.safeName = safeName;
		Sql.prototype.safeFunc = safeFunc;
		Sql.prototype.safeExpr = safeExpr;
		Sql.prototype.defColumns = defColumns;
		Sql.prototype.isColumnName = isColumnName;
		Sql.prototype.P = P;
		Sql.prototype.toString = toString;
		Sql.prototype.valueOf = valueOf;
		Sql.prototype.execute = execute;

		// Define the default SQL 92 like dialect
		// Support applying validation functions to
		// table's columns
		Sql.prototype.on = on;
		Sql.prototype.applyOn = applyOn;
		Sql.prototype.createTable = createTable;
		Sql.prototype.dropTable = dropTable;
		Sql.prototype.createIndex = createIndex;
		Sql.prototype.dropIndex = dropIndex;
		Sql.prototype.createView = createView;
		Sql.prototype.dropView = dropView;
		Sql.prototype.insert = insert;
		Sql.prototype.deleteFrom = deleteFrom;
		Sql.prototype.update = update;
		Sql.prototype.replace = replace;
		Sql.prototype.select = select;
		Sql.prototype.union = union;
		Sql.prototype.from = from;
		Sql.prototype.join = join;
		Sql.prototype.where = where;
		Sql.prototype.limit = limit;
		Sql.prototype.offset = offset;
		Sql.prototype.order = order;
		Sql.prototype.group = group;
		Sql.prototype.set = set;
		Sql.prototype.into = into;

		// If a dialect is defined, modify our definitions.
		if (Dialects[dialect_name] !== undefined) {
			// Mongo 2.2 shell doesn't support Object.keys()
			for (ky in Dialects[dialect_name]) {
				if (Dialects[dialect_name].hasOwnProperty(ky)) {
					Sql.prototype[ky] = Dialects[dialect_name][ky];
				}
			}
		}

		// If we're extending a dialect then update with
		// new functions.
		if (function_collection !== undefined) {
			for (ky in function_collection) {
				if (function_collection.hasOwnProperty(ky)) {
					Sql.prototype[ky] = function_collection[ky];
				}
			}
		}
		return new Sql();
	};

	global.sqlish = {
		Dialects: Dialects,
		Sqlish: Sqlish
	};

	if (exports !== undefined) {
		exports.Dialects = Dialects;
		exports.Sqlish = Sqlish;
	}
	
	return global;
}(this));
