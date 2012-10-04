// assert_this.js - Add basic node assert like methods for use in the browser.
//
// @author: R. S. Doiel, <rsdoiel@gmail.com>
// copyright (c) 2011 all rights reserved
//
// Released under the Simplified BSD License.
// See: http://opensource.org/licenses/bsd-license.php
//
//
/*jslint browser: true, sloppy: false, indent: 4, maxlen: 80 */
/*properties
	append, equal, fail, getElementsByTagName, log, notEqual, ok, strictEqual,
	strictNotEqual, error
*/
/*global
	console, document
*/

// Deal with possibly missing console.error()
/*jslint undef:true */
if (console === undefined) {
	var console = {
		log: print,
		error: print
	};
}
/*jslint undef:false */

var Assert = function () {
	"use strict";

	// Make an assert fail
	this.fail = function (msg) {
		console.error(msg);
		return false;
	};

	// Make an OK assertion
	this.ok = function (expr, msg) {
		if (expr) {
			return true;
		}
		console.error(msg);
		return false;
	};

	// Make an equal assertion
	this.equal = function (expr1, expr2, msg) {
		/*jslint eqeq: true */
		if (expr1 == expr2) {
			return true;
		}
		/*jslint eqeq: false */
		console.error(msg);
		return false;
	};

	// Make an notEqual assertion
	this.notEqual = function (expr1, expr2, msg) {
		/*jslint eqeq: true */
		if (expr1 != expr2) {
			return true;
		}
		/*jslint eqeq: false */
		console.error(msg);
		return false;
	};

	// Make an strictEqual assertion
	this.strictEqual = function (expr1, expr2, msg) {
		if (expr1 === expr2) {
			return true;
		}
		console.error(msg);
		return false;
	};

	// Make an strictNotEqual assertion
	this.strictNotEqual = function (expr1, expr2, msg) {
		if (expr1 !== expr2) {
			return true;
		}
		console.error(msg);
		return false;
	};
}, assert_this = new Assert();

/*jslint undef: true */
if (typeof assert === "undefined") {
	assert = assert_this;
} else {
	if (assert.fail === undefined) {
		assert.fail = assert_this.fail;
	}
	if (assert.ok === undefined) {
		assert.ok = assert_this.ok;
	}
	if (assert.equal === undefined) {
		assert.equal = assert_this.equal;
	}
	if (assert.notEqual === undefined) {
		assert.notEqual = assert_this.notEqual;
	}
	if (assert.strictEqual === undefined) {
		assert.strictEqual = assert_this.strictEqual;
	}
	if (assert.strictNotEqual === undefined) {
		assert.strictNotEqual = assert_this.strictNotEqual;
	}
}
/*jslint undef: false */
