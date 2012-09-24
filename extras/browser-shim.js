// These are defined to stop errors in Chrome.
// They are not used in browser based tests.
(function (global, undefined) {
	global.exports = {};
	global.require = { main: true };
	global.module = true;
}(this));
