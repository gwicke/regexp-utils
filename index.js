"use strict";

var RU = {};

RU.isRegExp = function (re) {
    return re && re.constructor === RegExp;
};

/**
 * Return the regexp source of either a regexp or a regexp matching a
 * passed-in string.
 */
RU.toSource = function (re) {
    if (RU.isRegExp(re)) {
        return re.source;
    } else {
        return RU.escapeRegExp(re);
    }
};

/**
 * Escape special regexp characters in a string used to build a regexp
 */
RU.escapeRegExp = function(re) {
	return re.replace(/[\^\\$*+?.()|{}\[\]\/]/g, '\\$&');
};

var OPEN_GROUP = /(^|[^\\])\((?!\?:)/;
/**
 * Convert all capturing groups in a regexp string into non-capturing ones
 *
 * FIXME: Don't match parens in char classes
 */
RU.makeGroupsUncapturing = function (re) {
    // Make capturing groups non-capturing
    var match = re.match(OPEN_GROUP);
    while (match) {
        re = re.replace(OPEN_GROUP, '$1(?:');
        match = re.match(OPEN_GROUP);
    }
    return re;
};

/**
 * Build a regexp-based switch
 *
 * Creates a matcher from an array of a mix of
 * - a regexp
 * - a string
 * - an array of [regexp or string, value]
 *
 * The matcher can then be applied to an input string, and yields either null
 * if nothing matched, or a result object like this:
 *
 * { match: [ 'foo', 'o', index: 0, input: 'foo' ],
 *   value: 'foo matched!' }
 *
 * The value is the optional value passed in as the second member in the
 * array, or undefined.
 * */
RU.makeRegExpSwitch = function (regexps) {
    var reBits = [],
        matchers = {},
        values = {},
        reBit;
    for (var i = 0, l = regexps.length; i < l; i++ ) {
        var re = regexps[i];
        if (Array.isArray(re)) {
            values[i] = re[1];
            re = re[0];
        }
        if (RU.isRegExp(re)) {
            matchers[i] = re;
            reBit = RU.makeGroupsUncapturing(RU.toSource(re));
        } else {
            reBit = RU.escapeRegExp(re);
        }
        reBits.push('(' + reBit + ')');
    }
    var switchRe = new RegExp(reBits.join('|'));
    return function regExpSwitcher (s) {
        var match = s.match(switchRe);
        if (match) {
            for (var i = 1, l = match.length; i < l; i++) {
                if (match[i]) {
                    break;
                }
            }
            if (matchers[i-1]) {
                // re-run the actual regexp with capturing groups
                match = s.match(matchers[i-1]);
            } else {
                match = [match[0], match[i]];
                match.index = 0;
                match.input = s;
            }
            return {
                match: match,
                value: values[i-1]
            };
        } else {
            return null;
        }
    };
};


module.exports = RU;
