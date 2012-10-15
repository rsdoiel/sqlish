//
// browser-shim.js - add just enough to allow testing in browser.
//
// @author: R. S. Doiel, <rsdoiel@gmail.com>
// copyright (c) 2012 all rights reserved
//
// Released under the Simplified BSD License.
// See: http://opensource.org/licenses/bsd-license.php
//
// These are defined to stop errors in Chrome.
// They are not used in browser based tests.
(function (global, undefined) {
	global.exports = {};
	global.require = { main: true };
	global.module = true;
	global.util = {
		inspect: function (obj) {
			return JSON.stringify(obj);
		}
	}
}(this));
